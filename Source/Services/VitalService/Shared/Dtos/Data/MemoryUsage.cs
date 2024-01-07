namespace VitalService.Dtos.Data
{
    public class MemoryUsage
    {

        public long UsedMemoryBytes { get; set; }

        public long TotalVisibleMemoryBytes { get; set; }

        public float SwapPercentage { get; set; }

        public long SwapUsedBytes { get; set; }

        public long SwapTotalBytes { get; set; }
    }
}
