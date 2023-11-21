using Microsoft.Extensions.Hosting;
using System.Collections.Generic;
using System;
using System.Threading;
using System.Threading.Tasks;
using VitalService.Dtos.Coms;
using VitalService.Dtos.Data;
using VitalRustServiceClasses;
using LibreHardwareMonitor.Hardware;
using Serilog;

namespace VitalService.Services.PerformanceServices
{
    public abstract class HardwarePerformanceService : IHostedService
    {
        public GetMachineStaticDataResponse MachineStaticData { get; set; } = new();
        public MemoryUsage CurrentRamUsage { get { RecordAccess(); return ramUsageData; } }
        public List<GpuUsage> CurrentGpuUsage { get { RecordAccess(); return gpuUsageData; } }
        public CpuUsage CurrentCpuUsage { get { RecordAccess(); return cpuUsageData; } }
        public DiskUsages CurrentDiskUsages { get { RecordAccess(); return diskUsagesData; } }
        public NetworkAdapterUsages CurrentNetworkUsage { get { RecordAccess(); return networkUsageData; } }

        void RecordAccess() => lastServiceAccess = DateTime.Now;
        internal DateTime lastServiceAccess;

        internal List<GpuUsage> gpuUsageData = new();
        internal CpuUsage cpuUsageData = new();
        internal MemoryUsage ramUsageData = new();
        internal NetworkAdapterUsages networkUsageData = new();
        internal bool IsUpdatingCpuUsage { get; set; }
        internal bool IsUpdatingDiskUsage { get; set; }
        internal bool IsUpdatingNetworkUsage { get; set; }
        internal bool IsUpdatingGpuUsage { get; set; }

        internal Timer UpdateHardwareUsageDataTimer { get; set; }
        internal Timer AutoThrottlerTimer { get; set; }
        internal DiskUsages diskUsagesData = new();
        internal CpuUsage? cpuDataFromRust;
        internal MemoryUsage? memDataFromRust;
        internal GpuUsage[]? gpuDataFromRust;
        internal NetworkAdapterUsage[]? networkDataFromRust;
        internal Dictionary<string, DiskUsage>? diskUsageDataFromRust;
        public bool ThrottleActive { get; private set; }
        private readonly TimeSpan throttleAfter = TimeSpan.FromSeconds(10);

        internal Action? UpdateUpdateVisitor { get; init; }

        public HardwarePerformanceService()
        {
            AutoThrottlerTimer = new Timer((_) => AutoThrottle(), null, Timeout.Infinite, Timeout.Infinite);
            UpdateHardwareUsageDataTimer = new Timer((_) =>
            {
                UpdateUpdateVisitor?.Invoke();
                Task.Run(() => UpdateCpuUsage());
                Task.Run(() => UpdateRamUsage());
                Task.Run(() => UpdateGpuUsage());
                Task.Run(() => UpdateNetworkUsage());
                Task.Run(() => UpdateDiskUsage());
            }, null, Timeout.Infinite, Timeout.Infinite);
        }

        internal abstract void UpdateDiskUsage();
        internal abstract void UpdateNetworkUsage();
        internal abstract void UpdateGpuUsage();
        internal abstract void UpdateCpuUsage();
        internal abstract void UpdateRamUsage();

        public void RecieveHardwareData(SystemUsage hardwareUsage)
        {
            cpuDataFromRust = hardwareUsage.CpuUsage;
            memDataFromRust = hardwareUsage.MemUsage;
            gpuDataFromRust = hardwareUsage.GpuUsage;
            networkDataFromRust = hardwareUsage.NetworkAdapterUsage;
            diskUsageDataFromRust = hardwareUsage.DiskUsage;
        }

        private void AutoThrottle()
        {
            if (!ThrottleActive && DateTime.Now - lastServiceAccess > throttleAfter)
            {
                ThrottleActive = true;
                UpdateHardwareUsageDataTimer?.Change(Timeout.Infinite, 0);
                Log.Logger.Information($"{nameof(HardwarePerformanceService)} Throttler engaged. No queries recieved in the last {throttleAfter.TotalSeconds} seconds");
            }
            else if (ThrottleActive && DateTime.Now - lastServiceAccess < throttleAfter)
            {
                Log.Logger.Information($"{nameof(HardwarePerformanceService)} resuming to normal operation");
                ThrottleActive = false;
                UpdateHardwareUsageDataTimer?.Change(TimeSpan.FromSeconds(1), TimeSpan.FromSeconds(2));
            }
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            Log.Logger.Information($"{nameof(HardwarePerformanceService)} started");
            lastServiceAccess = DateTime.Now;
            AutoThrottlerTimer.Change(TimeSpan.FromSeconds(6), TimeSpan.FromSeconds(2));
            UpdateHardwareUsageDataTimer.Change(TimeSpan.Zero, TimeSpan.FromSeconds(2));
            return Task.CompletedTask;
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            AutoThrottlerTimer?.Change(Timeout.Infinite, 0);
            UpdateHardwareUsageDataTimer?.Change(Timeout.Infinite, 0);
            Log.Logger.Information($"{nameof(HardwarePerformanceService)} is stopped.");
            return Task.CompletedTask;
        }
    }
}
