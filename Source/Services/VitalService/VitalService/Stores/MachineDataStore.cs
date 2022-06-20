using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using VitalService.Dtos;
using VitalService.Dtos.Coms;
using VitalService.Dtos.Data.Metrics;
using VitalService.Services;
using VitalService.Services.PerformanceServices;
using static VitalService.Dtos.GetRunningProcessesResponse;

namespace VitalService.Stores
{
    public class MachineDataStore
    {
        SoftwarePerformanceService SoftwarePerformanceService { get; }
        HardwarePerformanceService HardwarePerformanceService { get; }
        private ConcurrentDictionary<DateTimeOffset, TimeSeriesMachineMetricsModel> MetricsCache { get; }
        public MachineDataStore(
            SoftwarePerformanceService newMachineDataService,
            HardwarePerformanceService hardwarePerformanceService,
            MetricsStorageService metricsStorageService)
        {
            SoftwarePerformanceService = newMachineDataService;
            HardwarePerformanceService = hardwarePerformanceService;
            MetricsCache = metricsStorageService.MetricsCache;
        }

        public GetMachineStaticDataResponse GetStaticData()
        {
            return HardwarePerformanceService.MachineStaticData;
        }

        public RamUsages GetRamUsage()
        {
            return HardwarePerformanceService.CurrentRamUsage;
        }

        public List<GpuUsages> GetGpuUsage()
        {
            return HardwarePerformanceService.CurrentGpuUsage;
        }
        public NetworkAdapters GetNetworkUsage()
        {
            return HardwarePerformanceService.CurrentNetworkUsage;
        }

        internal IDictionary<int, float> GetProcessGpuUsage()
        {
            var metrics = SoftwarePerformanceService.GetProcessMetrics();

            return metrics.ToDictionary(k => k.Value.IDProcess, v => v.Value.GpuPercentage);
        }

        //public async Task<Dictionary<int, float>> GetProcessTotalCpuThreadsUsagesAsync()
        //{
        //    var returnValue = new Dictionary<int, float>();
        //    var metrics = NewMachineDataService.GetProcessMetrics(MetricType.CpuUsage);
        //    var mappings = ProcessRelationsService.ProcessChildMapping;
        //    var managedProcesses = await ManagedProcessStore.GetAsync();
        //    foreach (var key in mappings.Keys)
        //    {
        //        var process = NewMachineDataService.RunningProcesses.SingleOrDefault(e => e.Id == key);
        //        if (process is null)
        //            continue;
        //        var availableProcessorCoresCount = managedProcesses.SingleOrDefault(e => process.Id == key)?.AffinityBinary.Count(e => e == '1') ?? Environment.ProcessorCount;
        //        var trackers = new List<ITracker>();
        //        var children = mappings[key];
        //        foreach (var childId in children)
        //        {
        //            try
        //            {
        //                trackers.Add(metrics[childId]);

        //            }
        //            catch
        //            {
        //            }
        //        }
        //        var sum = (float)Math.Round(trackers.Sum(e => ((TrackedPerformanceCounter)e).Value) / availableProcessorCoresCount, 1);
        //        returnValue.Add(key, sum);
        //    }
        //    return returnValue;
        //}
        public Dictionary<int, float> GetProcessCpuUsages()
        {
            var metrics = SoftwarePerformanceService.GetProcessMetrics().ToDictionary(k => k.Key, v => v.Value.PercentProcessorTime);

            return metrics;
        }

        public CpuUsages GetCpuUsage()
        {
            return HardwarePerformanceService.CurrentCpuUsage;
        }
        public (DateRange requestDateRange, TimeSeriesMachineMetricsModel[] model) GetMetrics(DateTime earliest, DateTime latest)
        {
            TimeSeriesMachineMetricsModel[] model = Array.Empty<TimeSeriesMachineMetricsModel>();
            DateRange requestDateRange = new(earliest, latest);
            Utilities.Debug.LogExecutionTime("Metrics from cache", () =>
             {
                 model = MetricsCache
                 .Where(e => e.Key.UtcDateTime >= requestDateRange.Earliest && e.Key.UtcDateTime <= requestDateRange.Latest)
                 .OrderBy(e => e.Value.DateTimeOffset)
                 .Select(e => e.Value)
                 .ToArray();

             });

            return (requestDateRange, model);
        }


        public Dictionary<int, float> GetProcessTotalCpuUsages()
        {
            var returnValue = new Dictionary<int, float>();
            var metrics = SoftwarePerformanceService.GetProcessMetrics();
            foreach (var map in SoftwarePerformanceService.IdName)
            {
                if (metrics.TryGetValue(map.Key, out var metric))
                    returnValue.Add(map.Key, metric.PercentProcessorTime);
            }
            return returnValue;
        }

        public float GetCpuUsagePercentage()
        {
            return (float)Math.Round(HardwarePerformanceService.CurrentCpuUsage.Total, 1);
        }

        internal float? GetCpuClockSpeed()
        {
            throw new NotImplementedException();
        }
        public Dictionary<int, float> GetProcessRamUsagesInGb()
        {
            var metrics = SoftwarePerformanceService.GetProcessMetrics();

            return metrics.ToDictionary(k => k.Value.IDProcess, v => v.Value.WorkingSetGB);

        }

        public Dictionary<int, double> GetProcessDiskBytesPerSecActivity()
        {
            var metrics = SoftwarePerformanceService.GetProcessMetrics();

            return metrics.ToDictionary(k => k.Value.IDProcess, v => v.Value.WriteBytesPerSec + v.Value.ReadBytesPerSec);

        }
        public Dictionary<int, ParentChildModelDto> GetRunningProcesses()
        {
            var returnValue = new Dictionary<int, ParentChildModelDto>();
            var runningProcesses = SoftwarePerformanceService.RunningProcesses.ToDictionary(k => k.Key, v => v.Value);
            Utilities.Debug.LogExecutionTime("map children to parent", () =>
            {
                //var processesWithMainTitle = runningProcesses.Values.Where(e => !string.IsNullOrEmpty(e.MainWindowTitle)).ToArray();
                foreach (var process in runningProcesses.Values)
                {

                    returnValue.Add(process.ProcessId,
                        new ParentChildModelDto
                        {
                            Parent = new ProcessViewDto { Id = process.ProcessId, ProcessName = process.Name, ProcessTitle = process.MainWindowTitle, Description = process.Description }
                        ,
                            Children = runningProcesses.Where(e => e.Value.ParentProcessId == process.ProcessId)
                                                       .Select(e => e.Value)
                                                       .Select(e => new ProcessViewDto { Id = e.ProcessId, ProcessName = e.Name, ProcessTitle = e.MainWindowTitle })
                                                       .OrderBy(e => e.Id)
                                                       .ToHashSet()
                        }

                    );
                }
            });

            return returnValue;
        }

    }
}
