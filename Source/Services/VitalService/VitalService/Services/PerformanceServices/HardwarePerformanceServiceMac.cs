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
        public HardwarePerformanceServiceMac(): base()
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
            if (gpuDataFromRust != null)
                gpuUsageData = [.. gpuDataFromRust];
        }

        internal override void UpdateNetworkUsage()
        {
            if (networkDataFromRust is null)
                return;
            var toReturn = new NetworkAdapterUsages();
            string[] filterList = ["lo0", "en0", "bridge0"];
            if (networkDataFromRust is not null)
                foreach (var adapter in networkDataFromRust.Where(e=> filterList.Contains(e.Properties.Name)))
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
