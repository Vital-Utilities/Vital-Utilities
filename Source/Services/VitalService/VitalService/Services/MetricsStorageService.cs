using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Serilog;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using VitalService.Data;
using VitalService.Dtos.Data.Metrics;
using VitalService.Services.PerformanceServices;
using VitalService.Stores;

namespace VitalService.Services
{
    public class MetricsStorageService : IHostedService
    {
        public ConcurrentDictionary<DateTimeOffset, TimeSeriesMachineMetricsModel> MetricsCache { get; } = new();

        private HardwarePerformanceService HardwarePerformanceService { get; }
        private IDbContextFactory<MetricDbContext> MetricDbContextFactory { get; }
        private SettingsStore SettingsStore { get; }
        private Timer MetricsStorageServiceTimer { get; }
        private TimeSpan DataRetentionPeriod { get; } = TimeSpan.FromDays(2);
        private TimeSpan RunTrimInterval { get; } = TimeSpan.FromMinutes(30);
        public Timer TrimTimer { get; }

        public MetricsStorageService(HardwarePerformanceService hardwarePerformanceService, IDbContextFactory<MetricDbContext> metricDbContextFactory, SettingsStore settingsStore)
        {
            HardwarePerformanceService = hardwarePerformanceService;
            MetricDbContextFactory = metricDbContextFactory;
            SettingsStore = settingsStore;
            TrimTimer = new Timer((_) => Task.Run(() => TrimDatabaseAndCache()), null, Timeout.Infinite, Timeout.Infinite);

            MetricsStorageServiceTimer = new Timer((_) => Task.Run(() => SaveMetrics()), null, Timeout.Infinite, Timeout.Infinite);
#pragma warning disable CS4014 // Because this call is not awaited, execution of the current method continues before the call is completed
            new Thread(() => LoadDbIntoCache(metricDbContextFactory)).Start();
#pragma warning restore CS4014 // Because this call is not awaited, execution of the current method continues before the call is completed


        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            Log.Logger.Information($"{nameof(MetricsStorageService)} started");
            TrimTimer.Change(TimeSpan.FromMinutes(1), RunTrimInterval);
            MetricsStorageServiceTimer.Change(TimeSpan.Zero, TimeSpan.FromSeconds(2));
            return Task.CompletedTask;
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            MetricsStorageServiceTimer?.Change(Timeout.Infinite, 0);
            Log.Logger.Information($"{nameof(MetricsStorageService)} is stopped.");
            return Task.CompletedTask;
        }

        private async Task TrimDatabaseAndCache()
        {
            await Utilities.Debug.LogExecutionTime(null, async () =>
            {
                var deleteDataOlderThan = DateTimeOffset.Now.Subtract(DataRetentionPeriod);

                var toDelete = MetricsCache.Where(e => e.Key < deleteDataOlderThan).ToArray();
                foreach (var item in toDelete)
                {
                    MetricsCache.Remove(item.Key, out _);
                }

                using var dbContext = await MetricDbContextFactory.CreateDbContextAsync();
                dbContext.Metrics.RemoveRange(toDelete.Select(e => e.Value));
                await dbContext.SaveChangesAsync();
            });
        }

        private async Task LoadDbIntoCache(IDbContextFactory<MetricDbContext> metricDbContextFactory)
        {
            await Utilities.Debug.LogExecutionTime("Load metrics Db into cache", async () =>
            {
                Log.Logger.Information("Loading Metric Database into memory.");

                using var fileContext = metricDbContextFactory.CreateDbContext();

                var result = await fileContext.Metrics
                    .AsNoTracking()
                    .Include(e => e.CpuUsageData)
                    .Include(e => e.GpuUsageData)
                    .Include(e => e.RamUsageData)
                    .Include(e => e.NetworkUsageData)
                    .Include(e => e.DiskUsageData)
                    .AsSplitQuery()
                    .ToArrayAsync();

                var dictionary = new ConcurrentDictionary<DateTimeOffset, TimeSeriesMachineMetricsModel>();

                foreach (var item in result)
                {
                    dictionary.AddOrUpdate(item.DateTimeOffset, item, (key, existingValue) => item); // overcomes duplicate key being loaded into cache.
                }

                foreach (var item in dictionary)
                {
                    MetricsCache.TryAdd(item.Value.DateTimeOffset, item.Value);
                }
                Log.Logger.Information("Finished loading Metric Database into memory.");
            });

        }

        private void SaveMetrics()
        {
            var metric = new TimeSeriesMachineMetricsModel(
                    new List<CpuUsageMetricModel>
                    {
                        new CpuUsageMetricModel(
                            HardwarePerformanceService.MachineStaticData.Cpu.Name,
                            HardwarePerformanceService.CurrentCpuUsage.TotalCorePercentage,
                            HardwarePerformanceService.CurrentCpuUsage.TemperatureReadings.GetValueOrDefault("CPU Package"),
                            HardwarePerformanceService.CurrentCpuUsage.PowerDrawWattage,
                            HardwarePerformanceService.CurrentCpuUsage.CorePercentages.Select((e,i) => new KeyValuePair<int, float>(i, e)).ToDictionary(k=> k.Key, v=> v.Value),
                            HardwarePerformanceService.CurrentCpuUsage.CoreClocksMhz.Select((e,i) => new KeyValuePair<int, float>(i, e)).ToDictionary(k=> k.Key, v=> v.Value))
                    },
                    GetGpuMetricModels(),
                    new RamUsageMetricModel(
                        null,
                        HardwarePerformanceService.CurrentRamUsage.UsedMemoryBytes,
                        HardwarePerformanceService.CurrentRamUsage.TotalVisibleMemoryBytes),
                     HardwarePerformanceService.CurrentNetworkUsage.Adapters.Select(e =>
                     new NetworkUsageMetricModel(
                        e.Value.Properties.MacAddress,
                        e.Value.Usage?.SendBps,
                        e.Value.Usage?.RecieveBps)).ToList(),
                      HardwarePerformanceService.CurrentDiskUsages.Disks.Select(e =>
                          new DiskUsageMetricModel(e.Value.Name,
                            e.Value.Letter,
                            e.Value.Letter,
                            e.Value.DiskHealth?.TotalBytesWritten,
                            e.Value.DiskHealth?.TotalBytesRead,
                            e.Value.Throughput?.WriteRateBytesPerSecond,
                            e.Value.Throughput?.ReadRateBytesPerSecond,
                            e.Value.Load?.TotalActivityPercentage,
                            e.Value.Load?.WriteActivityPercentage,
                            e.Value.Load?.UsedSpacePercentage,
                            e.Value.Temperatures.ToDictionary(k => k.Key, v => v.Value),
                            e.Value.Load?.UsedSpaceBytes,
                            e.Value.Serial
                        )).ToList());

            List<GpuUsageMetricModel> GetGpuMetricModels()
            {
                var models = new List<GpuUsageMetricModel>();
                for (int i = 0; i < HardwarePerformanceService.MachineStaticData.Gpu.Count; i++)
                {
                    if (i < HardwarePerformanceService.CurrentGpuUsage.Count)
                        models.Add(new GpuUsageMetricModel(
                                        $"{i}",
                                        HardwarePerformanceService.CurrentGpuUsage[i].Load?.CorePercentage,
                                        HardwarePerformanceService.CurrentGpuUsage[i].MemoryUsedBytes,
                                        HardwarePerformanceService.CurrentGpuUsage[i].TemperatureReadings.GetValueOrDefault("GPU Core"),
                                        HardwarePerformanceService.CurrentGpuUsage[i].PowerDrawWatt,
                                        HardwarePerformanceService.CurrentGpuUsage[i].FanPercentage,
                                        HardwarePerformanceService.CurrentGpuUsage[i].TotalMemoryBytes));
                }
                return models;
            }

            var tasks = new List<Task>();

            tasks.Add(Task.Run(() => SaveToCache(metric)));

            if (SettingsStore.Settings.Metrics.PersistMetrics)
                tasks.Add(Task.Run(() => SaveToFile(metric)));

            Task.WaitAll(tasks.ToArray());
        }
        private void SaveToCache(TimeSeriesMachineMetricsModel metric)
        {
            MetricsCache.TryAdd(metric.DateTimeOffset, metric);
        }
        private void SaveToFile(TimeSeriesMachineMetricsModel metric)
        {
            try
            {
                using var dbContext = MetricDbContextFactory.CreateDbContext();
                using var transaction = dbContext.Database.BeginTransaction();

                dbContext.Metrics.Add(metric);
                dbContext.SaveChanges();
                transaction.Commit();
            }
            catch (Exception e)
            {
                Log.Error(e, "Something went wrong!");
            }
        }
    }
}
