using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using VitalRustServiceClasses;
using VitalService.Services.PerformanceServices;

namespace VitalService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class IngestController : ControllerBase
    {
        SoftwarePerformanceService SoftwarePerformanceService { get; }

        public IngestController(SoftwarePerformanceService softwarePerformanceService)
        {
            SoftwarePerformanceService = softwarePerformanceService;
        }

        [Route("ProcessGpu")]
        [HttpPost]
        public IActionResult ProcessGpuUsages(IEnumerable<ProcessData> data)
        {
            SoftwarePerformanceService.RecieveProcessGpuData(data);
            return Ok();
        }
    }
}
