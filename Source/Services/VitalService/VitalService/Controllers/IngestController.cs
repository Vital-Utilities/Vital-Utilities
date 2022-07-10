using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Serilog;
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
        HardwarePerformanceService HardwarePerformanceService { get; }

        public IngestController(SoftwarePerformanceService softwarePerformanceService, HardwarePerformanceService hardwarePerformanceService)
        {
            SoftwarePerformanceService = softwarePerformanceService;
            HardwarePerformanceService = hardwarePerformanceService;
        }

        [ProducesResponseType(StatusCodes.Status200OK)]
        [Route("Utilization")]
        [HttpPost]
        public IActionResult Utilization([FromBody] SendUtilizationRequest data)
        {
            SoftwarePerformanceService.RecieveProcessData(data.ProcessData);
            HardwarePerformanceService.RecieveHardwareData(data.SystemUsage);
            return Ok();
        }

    }
}
