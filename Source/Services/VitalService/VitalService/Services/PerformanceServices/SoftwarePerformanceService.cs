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
        public ConcurrentDictionary<int, PerfObj.Raw> ProcessPerformanceData { get { LastServiceAccess = DateTime.Now; return processPerformanceData; } }

        public ConcurrentDictionary<int, string> IdName { get { LastServiceAccess = DateTime.Now; return idName; } }
        public ConcurrentDictionary<string, int> NameId { get { LastServiceAccess = DateTime.Now; return nameId; } }
        private bool IsUpdatingTrackedProcesses { get; set; }
        private bool IsUpdatingRunningProcesses { get; set; }
        private bool IsParentChildMapping { get; set; }

        private ConcurrentDictionary<int, PerfObj.Raw> processPerformanceData = new();
        private ConcurrentDictionary<int, HashSet<int>> parentChildProcessMapping = new();
        private ConcurrentDictionary<int, ProcessData> runningProcesses = new();
        private ConcurrentDictionary<int, string> idName = new();
        private ConcurrentDictionary<string, int> nameId = new();

        private Timer? UpdateParentChildMapperTimer { get; set; } = null;

        private Timer? UpdateProcessesUsageTimer { get; set; } = null;
        private Timer? UpdateRunningProcessesTimer { get; set; } = null;
        private Timer? AutoThrottlerTimer { get; set; } = null;
        private DateTime LastServiceAccess;

        public bool ThrottleActive { get; private set; }
        readonly TimeSpan throttleAfter = TimeSpan.FromSeconds(10);


        private ProcessPerfWmiQueryer ProcessPerfWmiQueryer { get; }

        public SoftwarePerformanceService(ManagedProcessStore affinityStore)
        {
            AffinityStore = affinityStore;
            AutoThrottlerTimer = new Timer((_) => AutoThrottle(), null, Timeout.Infinite, Timeout.Infinite);
            UpdateProcessesUsageTimer = new Timer((_) => InvokeProcessesPerformanceQuery(), null, Timeout.Infinite, Timeout.Infinite);
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

            //UpdateParentChildMapperTimer = new Timer(MapParentChildren, null, Timeout.Infinite, Timeout.Infinite);

            var f = new ProcessPerfWmiQueryer();
            f.ObjectReady += ProcessPerfWmiQueryer_ObjectReady;
            ProcessPerfWmiQueryer = f;
        }
        public Dictionary<int, PerfObj> GetProcessMetrics()
        {
            return ProcessPerformanceData.ToDictionary(k => k.Key, v =>
            {
                return new PerfObj
                {
                    InstanceName = v.Value.InstanceName,
                    IDProcess = v.Value.IDProcess,
                    PercentProcessorTime = (float)Math.Round(v.Value.PercentProcessorTime, 2),
                    WorkingSetGB = (float)Math.Round(v.Value.WorkingSetPrivate / 1024 / 1024 / 1024, 3),
                    WriteBytesPerSec = v.Value.WriteBytesPerSec,
                    ReadBytesPerSec = v.Value.ReadBytesPerSec,
                };
            });
        }
        private void ProcessPerfWmiQueryer_ObjectReady(object sender, ObjectReadyEventArgs e)
        {

            try
            {
                var instanceName = e.NewObject["Name"].ToString();
                if (instanceName is not null or "_Total")
                {
                    var value = new PerfObj.Raw
                    {
#pragma warning disable CS8604 // Possible null reference argument.
                        InstanceName = instanceName,
                        PercentProcessorTime = double.Parse(e.NewObject["PercentProcessorTime"].ToString()) / 10,
                        WorkingSetPrivate = double.Parse(e.NewObject["WorkingSetPrivate"].ToString()),
                        WriteBytesPerSec = double.Parse(e.NewObject["IOWriteBytesPersec"].ToString()),
                        ReadBytesPerSec = double.Parse(e.NewObject["IOReadBytesPersec"].ToString()),
                        IDProcess = int.Parse(e.NewObject["IDProcess"].ToString())
#pragma warning restore CS8604 // Possible null reference argument.
                    };
                    processPerformanceData.AddOrUpdate(value.IDProcess, value, (index, oldVal) => oldVal = value);
                }
            }
            catch (Exception ex)
            {
                Log.Logger.Error(ex, "Something went wrong");
            }
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

            public class Raw
            {
                public string? InstanceName { get; set; }
                public int IDProcess { get; set; }

                public double PercentProcessorTime { get; set; }

                public double WorkingSetPrivate { get; set; }
                public double WriteBytesPerSec { get; internal set; }
                public double ReadBytesPerSec { get; internal set; }
            }
        }

        private void GetProcesses()
        {
            Utilities.Debug.LogExecutionTime(null, () =>
            {
                var returnValue = new ConcurrentDictionary<int, ProcessData>();
                var properties = typeof(ProcessData).GetProperties();
                var processesWithMainTitle = new Dictionary<int, string>();
                var unrespondingProcesses = new HashSet<int>();
                Utilities.Debug.LogExecutionTime("Get Processes with main title", () =>
                {
                    var ps = PowerShell.Create();
                    ps.AddScript("Get-Process | Where-Object { $_.MainWindowTitle }");
                    foreach (var collection in ps.Invoke())
                    {
                        var baseobj = collection.BaseObject;
                        var type = baseobj.GetType();
                        if (baseobj != null)
                        {
                            var id = int.Parse(type.GetProperty("Id")?.GetValue(baseobj, null).ToString());
                            processesWithMainTitle.Add(id, type.GetProperty("MainWindowTitle")?.GetValue(baseobj, null)?.ToString());
                            if (baseobj.GetType().GetProperty("Responding")?.GetValue(baseobj, null)?.ToString() == "False")
                                unrespondingProcesses.Add(id);
                        }
                    }
                });
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
                                if (processesWithMainTitle.TryGetValue(val, out var value))
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

        private void InvokeProcessesPerformanceQuery()
        {
            if (!ProcessPerfWmiQueryer.ReadyToInvoke)
                return;
            Utilities.Debug.LogExecutionTime(null, () =>
            {
                ProcessPerfWmiQueryer.InvokeGet();
                while (!ProcessPerfWmiQueryer.ReadyToInvoke)
                {
                    // do nothing;
                }
            });
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

        private void MapParentChildren()
        {
            if (IsParentChildMapping)
            {
                return;
            }
            IsParentChildMapping = true;
            Utilities.Debug.LogExecutionTime(null, () =>
            {
                var dictionary = new ConcurrentDictionary<int, HashSet<int>>();


                foreach (var (key, value) in runningProcesses)
                {
                    try
                    {
                        if (!dictionary.ContainsKey(value.ParentProcessId))
                            dictionary.TryAdd(value.ParentProcessId, new HashSet<int>());
                        dictionary[value.ParentProcessId].Add(key);
                    }
                    catch (Exception e)
                    {
                        Log.Logger.Error(e, "Something went wrong");
                    }
                };

                parentChildProcessMapping = dictionary;
            });
            IsParentChildMapping = false;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            Log.Logger.Information($"{nameof(SoftwarePerformanceService)} started");
            LastServiceAccess = DateTime.Now;
            UpdateProcessesUsageTimer.Change(TimeSpan.FromSeconds(3), TimeSpan.FromSeconds(2));
            AutoThrottlerTimer?.Change(TimeSpan.FromSeconds(6), TimeSpan.FromSeconds(2));
            UpdateParentChildMapperTimer?.Change(TimeSpan.FromSeconds(2), TimeSpan.FromSeconds(2));
            UpdateRunningProcessesTimer?.Change(TimeSpan.FromSeconds(0), TimeSpan.FromSeconds(2));
            return Task.CompletedTask;
        }
        public Task StopAsync(CancellationToken cancellationToken)
        {
            AutoThrottlerTimer?.Change(Timeout.Infinite, 0);
            UpdateProcessesUsageTimer?.Change(Timeout.Infinite, 0);
            UpdateParentChildMapperTimer?.Change(Timeout.Infinite, 0);
            UpdateRunningProcessesTimer?.Change(Timeout.Infinite, 0);

            Log.Logger.Information($"{nameof(SoftwarePerformanceService)} is stopped.");

            return Task.CompletedTask;
        }

    }
}