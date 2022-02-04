namespace VitalService.Dtos.Data.Metrics
{
    public class RamUsageMetricModel : HardwareMetricModel
    {
        public double? UsedMemoryBytes { get; set; }
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
