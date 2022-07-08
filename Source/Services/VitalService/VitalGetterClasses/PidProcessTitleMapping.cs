using VitalService;

namespace VitalRustServiceClasses
{
    public class PidProcessTitleMapping
    {
        [SwaggerRequired]
        public float Id { get; set; }
        [SwaggerRequired]
        public string Title { get; set; }
    }
}
