using VitalService;

namespace VitalRustServiceClasses
{
    public class ProcessData
    {
        
        public float Pid { get; set; }
        
        public float? ParentPid { get; set; }
        
        public string? ExecutablePath { get; set; }
        
        public string? Description { get; set; }
        
        public string? MainWindowTitle { get; set; }
        
        public string Name { get; set; }
        
        public DateTime TimeStamp { get; set; }
        
        public float CpuPercentage { get; set; }
        
        public float MemoryKb { get; set; }
        
        public ProcessDiskUsage DiskUsage { get; set; }
        
        public string? Status { get; set; }
        
        public ProcessGpuUtil? GpuUtil { get; set; }
    }

    public class ProcessDiskUsage
    {
        
        public float ReadBytesPerSecond { get; set; }
        
        public float WriteBytesPerSecond { get; set; }
    }

    public class ProcessGpuUtil
    {
        
        public float? GpuCorePercentage { get; set; }
        
        public float? GpuMemPercentage { get; set; }
        
        public float? GpuEncodingPercentage { get; set; }
        
        public float? GpuDecodingPercentage { get; set; }
    }
}
