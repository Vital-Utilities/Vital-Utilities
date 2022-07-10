using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace VitalService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HelloController : Controller
    {
        [ProducesResponseType(StatusCodes.Status200OK)]
        [HttpGet]
        public IActionResult Hello()
        {
            return Ok();
        }
    }
}
