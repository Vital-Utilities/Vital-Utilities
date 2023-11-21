using LibreHardwareMonitor.Hardware;
using Microsoft.Extensions.Hosting;
using System.Linq;
using System;
using System.Runtime.Versioning;
using System.Threading;
using System.Threading.Tasks;
using VitalService.Dtos.Coms;
using System.IO;
using VitalService.Dtos.Data;

namespace VitalService.Services.PerformanceServices
{
    [SupportedOSPlatform("osx")]
    public class HardwarePerformanceServiceMac : HardwarePerformanceService
    {

        public HardwarePerformanceServiceMac()
        {
        }

        internal override void UpdateCpuUsage()
        {
            if (cpuDataFromRust is null)
                return;

            cpuUsageData = cpuDataFromRust;
        }

        internal override void UpdateDiskUsage()
        {
            if (diskUsageDataFromRust is null)
                return;

            var toReturn = new DiskUsages();

            foreach (var item in diskUsageDataFromRust)
                toReturn.Disks.TryAdd(item.Key, item.Value);

            diskUsagesData = toReturn;
        }

        internal override void UpdateGpuUsage()
        {
            if (gpuDataFromRust is null)
                return;
            gpuUsageData = gpuDataFromRust.ToList();
        }

        internal override void UpdateNetworkUsage()
        {
            if (networkDataFromRust is null)
                return;
            var toReturn = new NetworkAdapterUsages();

            if (networkDataFromRust is not null)
                foreach (var adapter in networkDataFromRust)
                    toReturn.Adapters.TryAdd(adapter.Properties.Name, adapter);

            networkUsageData = toReturn;
        }

        internal override void UpdateRamUsage()
        {

            if (memDataFromRust is null)
                return;

            ramUsageData = memDataFromRust;
        }
    }
}
