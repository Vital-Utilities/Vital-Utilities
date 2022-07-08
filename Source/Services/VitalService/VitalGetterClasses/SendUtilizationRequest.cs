using VitalService;

namespace VitalRustServiceClasses
{
    public class SendUtilizationRequest
    {
        [SwaggerRequired]
        public ProcessData[] ProcessData { get; set; }
        [SwaggerRequired]
        public SystemUsage SystemUsage { get; set; }
    }
}
