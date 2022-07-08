namespace VitalService.Dtos.Coms
{
    public class MemoryUsage
    {
        [SwaggerRequired]
        public double UsedMemoryBytes { get; set; }
        [SwaggerRequired]
        public double TotalVisibleMemoryBytes { get; set; }
        [SwaggerRequired]
        public float SwapPercentage { get; set; }
        [SwaggerRequired]
        public float SwapUsedKB { get; set; }
        [SwaggerRequired]
        public float SwapTotalKB { get; set; }
    }
}
