using JM.LinqFaster;
using Microsoft.Extensions.Hosting;
using Serilog;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Management;
using System.Management.Automation;
using System.Threading;
using System.Threading.Tasks;
using VitalRustServiceClasses;
using VitalService.Stores;
namespace VitalService.Services.PerformanceServices
{
    public class SoftwarePerformanceService : IHostedService
    {
        private ManagedProcessStore AffinityStore { get; }

        /// <summary>
        /// pid, obj
        /// </summary>
        public ConcurrentDictionary<int, ProcessData> RunningProcesses { get { LastServiceAccess = DateTime.Now; return runningProcesses; } }
        public ConcurrentDictionary<int, VitalRustServiceClasses.ProcessData> ProcessPerformanceData { get { LastServiceAccess = DateTime.Now; return processPerformanceData; } }

        public ConcurrentDictionary<int, string> IdName { get { LastServiceAccess = DateTime.Now; return idName; } }

        private bool IsUpdatingRunningProcesses { get; set; }

        private ConcurrentDictionary<int, VitalRustServiceClasses.ProcessData> processPerformanceData = new();
        private ConcurrentDictionary<int, ProcessData> runningProcesses = new();
        private ConcurrentDictionary<int, string> idName = new();
        private ConcurrentDictionary<string, int> nameId = new();

        private Timer? UpdateParentChildMapperTimer { get; set; } = null;

        private Timer? UpdateProcessesUsageTimer { get; set; } = null;
        private Timer? UpdateRunningProcessesTimer { get; set; } = null;
        private Timer? AutoThrottlerTimer { get; set; } = null;
        private DateTime LastServiceAccess;
        private ConcurrentDictionary<int, string> pidProcessTitleMapping = new();

        public bool ThrottleActive { get; private set; }
        readonly TimeSpan throttleAfter = TimeSpan.FromSeconds(10);



        public SoftwarePerformanceService(ManagedProcessStore affinityStore)
        {
            AffinityStore = affinityStore;
            AutoThrottlerTimer = new Timer((_) => AutoThrottle(), null, Timeout.Infinite, Timeout.Infinite);
            UpdateRunningProcessesTimer = new Timer((_) =>
            {
                if (!IsUpdatingRunningProcesses)
                {
                    IsUpdatingRunningProcesses = true;
                    try
                    {
                        GetProcesses();
                    }
                    finally
                    {
                        IsUpdatingRunningProcesses = false;
                    }
                }
            }, null, Timeout.Infinite, Timeout.Infinite);
        }

        public void RecieveProcessData(IEnumerable<VitalRustServiceClasses.ProcessData> data)
        {
            var concurrent = new ConcurrentDictionary<int, VitalRustServiceClasses.ProcessData>();
            foreach (var process in data)
            {
                concurrent.TryAdd((int)process.Pid, process);
            }
            processPerformanceData = concurrent;
        }

        public Dictionary<int, PerfObj> GetProcessMetrics()
        {
            return ProcessPerformanceData.ToDictionary(k => k.Key, v =>
            {
                return new PerfObj
                {
                    InstanceName = v.Value.Name,
                    IDProcess = (int)v.Value.Pid,
                    PercentProcessorTime = (float)Math.Round(v.Value.CpuPercentage, 2),
                    WorkingSetGB = (float)Math.Round(v.Value.MemoryKb / 1024 / 1024, 3),
                    WriteBytesPerSec = v.Value.DiskUsage.WriteBytesPerSecond,
                    ReadBytesPerSec = v.Value.DiskUsage.ReadBytesPerSecond,
                    GpuPercentage = v.Value.GpuUtil?.GpuCorePercentage ?? 0
                };
            });
        }

        public void RecieveIdProcessTitleMappings(List<PidProcessTitleMapping> mappings)
        {
            var dictionary = new ConcurrentDictionary<int, string>();
            foreach (var mapping in mappings)
            {
                dictionary.TryAdd((int)mapping.Id, mapping.Title);
            }
            pidProcessTitleMapping = dictionary;
        }
        public class PerfObj
        {
            public string? InstanceName { get; set; }
            public int IDProcess { get; set; }
            /// <summary>
            /// Cpu
            /// </summary>
            public float PercentProcessorTime { get; set; }
            /// <summary>
            /// Ram
            /// </summary>
            public float WorkingSetGB { get; set; }
            public double WriteBytesPerSec { get; set; }
            public double ReadBytesPerSec { get; set; }
            public float GpuPercentage { get; internal set; }
        }
        private void GetProcesses()
        {
            Utilities.Debug.LogExecutionTime(null, () =>
            {
                var returnValue = new ConcurrentDictionary<int, ProcessData>();
                var properties = typeof(ProcessData).GetProperties();

                var searcher = new ManagementObjectSearcher("root\\CIMV2", "SELECT * FROM Win32_Process");
                var toReturnIdName = new ConcurrentDictionary<int, string>();
                var toReturnNameId = new ConcurrentDictionary<string, int>();
                try
                {
                    foreach (var queryObj in searcher.Get())
                    {
                        var data = new ProcessData();
                        foreach (var propertyInfo in properties)
                        {
                            if (propertyInfo.Name == "MainWindowTitle")
                            {
                                var val = int.Parse(queryObj["ProcessId"].ToString());
                                if (pidProcessTitleMapping.TryGetValue(val, out var value))
                                    propertyInfo.SetValue(data, Convert.ChangeType(value, propertyInfo.PropertyType), null);
                                continue;
                            }
                            else if (propertyInfo.Name == "Description" && !string.IsNullOrEmpty(data.ExecutablePath))
                            {
                                var description = FileVersionInfo.GetVersionInfo(data.ExecutablePath).FileDescription;
                                if (string.IsNullOrWhiteSpace(description))
                                    description = null;
                                propertyInfo.SetValue(data, Convert.ChangeType(description, propertyInfo.PropertyType), null);

                                continue;
                            }
                            propertyInfo.SetValue(data, Convert.ChangeType(queryObj[propertyInfo.Name]?.ToString() ?? "", propertyInfo.PropertyType), null);
                        }
                        returnValue.TryAdd(data.ProcessId, data);
                        toReturnIdName.TryAdd(data.ParentProcessId, data.Name);
                        toReturnNameId.TryAdd(data.Name, data.ProcessId);
                    }
                    runningProcesses = returnValue;
                    idName = toReturnIdName;
                    nameId = toReturnNameId;
                }
                catch (Exception e)
                {
                    Log.Logger.Error(e.Message, e);
                }
            });

        }

        public class ProcessData
        {
            public int ProcessId { get; set; }
            public int ParentProcessId { get; set; }
            public string? ExecutablePath { get; set; }
            public string CommandLine { get; set; } = "";
            public string Name { get; set; } = "";
            public string? Description { get; set; } // must come after ExecutablePath
            public string? MainWindowTitle { get; set; }
        }

        private void AutoThrottle()
        {
            if (!ThrottleActive && DateTime.Now - LastServiceAccess > throttleAfter)
            {
                ThrottleActive = true;
                UpdateProcessesUsageTimer?.Change(Timeout.Infinite, 0);
                UpdateParentChildMapperTimer?.Change(TimeSpan.FromSeconds(20), TimeSpan.FromSeconds(20));
                UpdateRunningProcessesTimer?.Change(TimeSpan.FromSeconds(15), TimeSpan.FromSeconds(20));
                Log.Logger.Information($"{nameof(SoftwarePerformanceService)} Throttler engaged. No external queries for more than {throttleAfter.TotalSeconds} seconds");
            }

            else if (ThrottleActive && DateTime.Now - LastServiceAccess < throttleAfter)
            {
                Log.Logger.Information($"{nameof(SoftwarePerformanceService)} resuming to normal operation");
                ThrottleActive = false;
                UpdateProcessesUsageTimer?.Change(TimeSpan.FromSeconds(3), TimeSpan.FromSeconds(2));
                UpdateParentChildMapperTimer?.Change(TimeSpan.FromSeconds(2), TimeSpan.FromSeconds(2));
                UpdateRunningProcessesTimer?.Change(TimeSpan.FromSeconds(4), TimeSpan.FromSeconds(2));
            }
        }


        public Task StartAsync(CancellationToken cancellationToken)
        {
            Log.Logger.Information($"{nameof(SoftwarePerformanceService)} started");
            LastServiceAccess = DateTime.Now;
            AutoThrottlerTimer?.Change(TimeSpan.FromSeconds(6), TimeSpan.FromSeconds(2));
            UpdateRunningProcessesTimer?.Change(TimeSpan.FromSeconds(0), TimeSpan.FromSeconds(2));
            return Task.CompletedTask;
        }
        public Task StopAsync(CancellationToken cancellationToken)
        {
            AutoThrottlerTimer?.Change(Timeout.Infinite, 0);
            UpdateRunningProcessesTimer?.Change(Timeout.Infinite, 0);

            Log.Logger.Information($"{nameof(SoftwarePerformanceService)} is stopped.");

            return Task.CompletedTask;
        }

    }
}