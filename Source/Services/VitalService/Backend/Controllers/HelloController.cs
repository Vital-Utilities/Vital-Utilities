using Microsoft.AspNetCore.Mvc;

namespace VitalService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HelloController : Controller
    {
        [HttpGet]
        public IActionResult Hello()
        {
            return Ok();
        }
    }
}
