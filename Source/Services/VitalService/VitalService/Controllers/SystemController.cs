using Microsoft.AspNetCore.Mvc;
using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using VitalService.Dtos.Coms;
using VitalService.Services.PerformanceServices;
using VitalService.Stores;

namespace VitalService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SystemController : ControllerBase
    {
        private MachineDataStore MachineDataStore { get; }
        public HardwarePerformanceService HardwarePerformanceService { get; }

        public SystemController(MachineDataStore machineDataStore, HardwarePerformanceService hardwarePerformanceService)
        {
            MachineDataStore = machineDataStore;
            HardwarePerformanceService = hardwarePerformanceService;
        }

        [HttpGet("static")]
        public GetMachineStaticDataResponse StaticData()
        {

            return MachineDataStore.GetStaticData();
        }

        [HttpGet("dynamic")]
        public Task<GetMachineDynamicDataResponse> DynamicDataAsync()
        {
            var processCpuUsage = MachineDataStore.GetProcessCpuUsages();

            var toReturn = new GetMachineDynamicDataResponse
            {
                CpuUsageData = MachineDataStore.GetCpuUsage(),
                RamUsagesData = MachineDataStore.GetRamUsage(),
                GpuUsageData = MachineDataStore.GetGpuUsage(),
                NetworkUsageData = MachineDataStore.GetNetworkUsage(),
                DiskUsages = HardwarePerformanceService.CurrentDiskUsages,
                //ProcessCpuThreadsUsage = await MachineDataStore.GetProcessTotalCpuThreadsUsagesAsync(),
                ProcessCpuUsage = processCpuUsage,
                ProcessRamUsageGb = MachineDataStore.GetProcessRamUsagesInGb(),
                ProcessDiskBytesPerSecActivity = MachineDataStore.GetProcessDiskBytesPerSecActivity(),
                ProcessGpuUsage = MachineDataStore.GetProcessGpuUsage(),
                //ProcessThreadCount = MachineDataStore.GetProcessMetrics(MachineDataStore.MetricType.ThreadCount)
            };
            return Task.FromResult(toReturn);
        }

        [HttpPost("timeseries")]
        public TimeSeriesMachineMetricsResponse TimeSeriesData([FromBody] GetMachineTimeSeriesRequest request)
        {
            var (requestDateRange, model) = MachineDataStore.GetMetrics(request.Earliest, request.Latest);

            return new TimeSeriesMachineMetricsResponse
            {
                RequestRange = requestDateRange,
                Metrics = model
            };
        }

        [HttpPatch]
        public Task SetFastestCores()
        {
            throw new NotImplementedException();
        }


    }
}
