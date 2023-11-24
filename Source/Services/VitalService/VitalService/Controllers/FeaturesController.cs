using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VitalService.Dtos;

namespace VitalService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public partial class FeaturesController : ControllerBase
    {

        [ProducesResponseType(StatusCodes.Status200OK)]
        [HttpGet]
        public IActionResult GetFeatures(Features features)
        {

            return Ok(features);
        }
    }
}
