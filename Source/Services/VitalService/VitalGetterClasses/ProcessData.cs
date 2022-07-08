using VitalService;

namespace VitalRustServiceClasses
{
    public class ProcessData
    {
        [SwaggerRequired]
        public float Pid { get; set; }
        [SwaggerRequired]
        public float? ParentPid { get; set; }
        [SwaggerRequired]
        public string? ExecutablePath { get; set; }
        [SwaggerRequired]
        public string? Description { get; set; }
        [SwaggerRequired]
        public string? MainWindowTitle { get; set; }
        [SwaggerRequired]
        public string Name { get; set; }
        [SwaggerRequired]
        public DateTime TimeStamp { get; set; }
        [SwaggerRequired]
        public float CpuPercentage { get; set; }
        [SwaggerRequired]
        public float MemoryKb { get; set; }
        [SwaggerRequired]
        public ProcessDiskUsage DiskUsage { get; set; }
        [SwaggerRequired]
        public string? Status { get; set; }
        [SwaggerRequired]
        public ProcessGpuUtil? GpuUtil { get; set; }
    }

    public class ProcessDiskUsage
    {
        [SwaggerRequired]
        public float ReadBytesPerSecond { get; set; }
        [SwaggerRequired]
        public float WriteBytesPerSecond { get; set; }
    }

    public class ProcessGpuUtil
    {
        [SwaggerRequired]
        public float? GpuCorePercentage { get; set; }
        [SwaggerRequired]
        public float? GpuMemPercentage { get; set; }
        [SwaggerRequired]
        public float? GpuEncodingPercentage { get; set; }
        [SwaggerRequired]
        public float? GpuDecodingPercentage { get; set; }
    }
}
