using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
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

        [ProducesResponseType(typeof(GetMachineStaticDataResponse), StatusCodes.Status200OK)]
        [HttpGet("static")]
        public GetMachineStaticDataResponse StaticData()
        {

            return MachineDataStore.GetStaticData();
        }

        [ProducesResponseType(typeof(GetMachineDynamicDataResponse), StatusCodes.Status200OK)]
        [HttpGet("dynamic")]
        public GetMachineDynamicDataResponse DynamicDataAsync()
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
                ProcessRamUsageBytes = MachineDataStore.GetProcessRamUsagesInBytes(),
                ProcessDiskBytesPerSecActivity = MachineDataStore.GetProcessDiskBytesPerSecActivity(),
                ProcessGpuUsage = MachineDataStore.GetProcessGpuUsage(),
                //ProcessThreadCount = MachineDataStore.GetProcessMetrics(MachineDataStore.MetricType.ThreadCount)
            };
            return toReturn;
        }

        [ProducesResponseType(typeof(TimeSeriesMachineMetricsResponse), StatusCodes.Status200OK)]
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
    }
}
