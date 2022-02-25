namespace VitalRustServiceClasses
{
    public class NetworkUsage
    {
        public string Name { get; set; }
        public string? Description { get; set; }
        public string MacAddress { get; set; }
        public float UploadSpeedBps { get; set; }
        public float DownloadSpeedBps { get; set; }
        public float UploadedBps { get; set; }
        public float DownloadedBps { get; set; }
        public float UsagePercentage { get; set; }
    }
}
