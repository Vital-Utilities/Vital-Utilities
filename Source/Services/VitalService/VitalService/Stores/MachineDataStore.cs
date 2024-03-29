﻿using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
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

        internal IDictionary<int, float> GetProcessGpuUsage()
        {
            var metrics = SoftwarePerformanceService.GetProcessMetrics();

            return metrics.ToDictionary(k => k.Value.IDProcess, v => v.Value.GpuPercentage);
        }

        public Dictionary<int, float> GetProcessCpuUsages()
        {
            var metrics = SoftwarePerformanceService.GetProcessMetrics().ToDictionary(k => k.Key, v => v.Value.PercentProcessorTime);

            return metrics;
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

        public Dictionary<int, float> GetProcessRamUsagesInBytes()
        {
            var metrics = SoftwarePerformanceService.GetProcessMetrics();

            return metrics.ToDictionary(k => k.Value.IDProcess, v => v.Value.WorkingSetBytes);

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
                                                       .Select(e => new ProcessViewDto { Id = e.ProcessId, ProcessName = e.Name, ProcessTitle = e.MainWindowTitle, Description = e.Description })
                                                       .OrderBy(e => e.Id)
                                                       .ToDictionary(k => k.Id, v => v)
                        }

                    );
                }
            });

            return returnValue;
        }

    }
}
