using InfluxDB.Client;
using InfluxDB.Client.Api.Domain;
using InfluxDB.Client.Writes;
using System.Collections.Concurrent;
using VitalService.Stores;
using Microsoft.Extensions.Hosting;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using VitalService.Services.PerformanceServices;

namespace VitalService.Services
{
    public class InfluxDbInterfacingService : IHostedService
    {
        public InfluxDBClient Client { get; }
        private static string Bucket => AppDomain.CurrentDomain.FriendlyName;
        private static string Org => AppDomain.CurrentDomain.FriendlyName;

        private Timer DataWriterTimer { get; set; }
        private MachineDataStore MachineDataStore { get; }
        public ProfileStore ProfileStore { get; }
        public SoftwarePerformanceService NewMachineDataService { get; }
        private SettingsStore SettingsStore { get; }
        private WriteApi WriteApi { get; }
        public InfluxDbInterfacingService(MachineDataStore machineDataStore, ProfileStore profileStore, SettingsStore settingsStore, SoftwarePerformanceService newMachineDataService)
        {
            SettingsStore = settingsStore;
            Client = InfluxDBClientFactory.Create(SettingsStore.Settings.InfluxDb.EndPoint, SettingsStore.Settings.InfluxDb.Token);
            WriteApi = Client.GetWriteApi();
            MachineDataStore = machineDataStore;
            ProfileStore = profileStore;
            NewMachineDataService = newMachineDataService;
            DataWriterTimer = new Timer(WriteData, null, Timeout.Infinite, Timeout.Infinite);
        }

        private void WriteData(object? @object)
        {
            Utilities.Debug.LogExecutionTime(null, () =>
            {
                var data = new ConcurrentBag<IEnumerable<PointData>>
                {
                    GetCpuData(),
                    //GetProcessTotalThreadUsageData(),
                    GetProcessTotalCpuUsageData(),
                    GetProfilesData(),
                    GetGpuData()
                };

                WriteApi.WritePoints("vital", "vital", data.SelectMany(e => e).ToList());
            });
        }

        private IEnumerable<PointData> GetCpuData()
        {
            return new[]{PointData
                        .Measurement("cpu")
                        .Tag("host", Environment.MachineName)
                        .Field("total_percentage", MachineDataStore.GetCpuUsagePercentage())
                        .Timestamp(DateTime.UtcNow, WritePrecision.Ns) };
        }
        private IEnumerable<PointData> GetGpuData()
        {
            var usage = MachineDataStore.GetGpuUsage()[0]?.Load?.Core;
            if (usage == null)
                return Array.Empty<PointData>();

            return new[]{PointData
                        .Measurement("gpu")
                        .Tag("host", Environment.MachineName)
                        .Field("core_percentage", (double)usage)
                        .Timestamp(DateTime.UtcNow, WritePrecision.Ns) };

        }
        //private IEnumerable<PointData> GetProcessTotalThreadUsageData()
        //{
        //    var processes = MachineDataStore.GetProcessTotalCpuThreadsUsages();
        //    var withName = processes.ToDictionary(k =>
        //    {
        //        NewMachineDataService.IdName.TryGetValue(k.Key, out var name);
        //        return name ?? k.Key.ToString();
        //    }, v => v.Value);
        //    foreach (var process in withName)
        //    {
        //        var point = PointData
        //                    .Measurement("cpu_process_thread_usage_percentage")
        //                    .Tag("host", Environment.MachineName)
        //                    .Field($"{process.Key}", process.Value)
        //                    .Timestamp(DateTime.UtcNow, WritePrecision.Ns);
        //        yield return point;
        //    }
        //}

        private IEnumerable<PointData> GetProcessTotalCpuUsageData()
        {
            var processes = MachineDataStore.GetProcessTotalCpuUsages();
            var withName = new Dictionary<string, float>();
            foreach (var (key, value) in processes)
            {
                NewMachineDataService.IdName.TryGetValue(key, out var name);
                if (name is null)
                    continue;
                withName.TryAdd(name, value);
            }

            foreach (var process in withName)
            {
                var point = PointData
                            .Measurement("cpu_process_usage_percentage")
                            .Tag("host", Environment.MachineName)
                            .Field($"{process.Key}", process.Value)
                            .Timestamp(DateTime.UtcNow, WritePrecision.Ns);
                yield return point;
            }
        }

        private IEnumerable<PointData> GetProfilesData()
        {
            var profiles = ProfileStore.GetAllAsync().Result;

            var point = PointData
                        .Measurement("profile")
                        .Tag("host", Environment.MachineName)
                        .Field("profile_count", profiles.Length)
                        .Timestamp(DateTime.UtcNow, WritePrecision.Ns);
            return new[] { point };
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            Serilog.Log.Logger.Information($"{nameof(InfluxDbInterfacingService)} started");
            DataWriterTimer.Change(TimeSpan.Zero, TimeSpan.FromSeconds(5));

            return Task.CompletedTask;
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            Serilog.Log.Logger.Information($"{nameof(InfluxDbInterfacingService)} is stopping.");
            WriteApi.Dispose();
            DataWriterTimer?.Change(Timeout.Infinite, 0);

            return Task.CompletedTask;
        }
    }
}