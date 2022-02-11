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
                //ProcessThreadCount = MachineDataStore.GetProcessMetrics(MachineDataStore.MetricType.ThreadCount)
            };
            return Task.FromResult(toReturn);
        }
        //[HttpPost("timeseries/range")]
        //public TimeSeriesMachineMetrics TimeSeriesDataAsync([FromBody] GetMachineTimeSeriesRequest request)
        //{
        //    var getLast = MachineDataStore.GetMetricsBetween(request);
        //    var toReturn = new TimeSeriesMachineMetrics
        //    {
        //        CpuUsageData = getLast.CpuMetrics,
        //        GpuUsageData = getLast.GpuMetrics,
        //    };
        //    return toReturn;
        //}

        [HttpPost("timeseries/relative")]
        public TimeSeriesMachineMetricsResponse TimeSeriesData([FromBody] GetMachineRelativeTimeSeriesRequest request)
        {
            var (requestDateRange, model) = MachineDataStore.GetMetrics(request.From, request.To);

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
