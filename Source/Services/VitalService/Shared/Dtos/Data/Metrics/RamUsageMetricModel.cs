namespace VitalService.Dtos.Data.Metrics
{
    public class RamUsageMetricModel : HardwareMetricModel
    {
        [SwaggerRequired]
        public double? UsedMemoryBytes { get; set; }
        [SwaggerRequired]
        public double? TotalVisibleMemoryBytes { get; set; }
        public RamUsageMetricModel() : base()
        {
        }
        public RamUsageMetricModel(string? uniqueIdentifier, double? usedMemoryBytes, double? totalVisibleMemoryBytes) : base(uniqueIdentifier)
        {
            UsedMemoryBytes = usedMemoryBytes;
            TotalVisibleMemoryBytes = totalVisibleMemoryBytes;
        }
    }
}
