using VitalService;

namespace VitalRustServiceClasses
{
    public class ProcessData
    {
        
        public int Pid { get; set; }
        
        public int? ParentPid { get; set; }
        
        public string? ExecutablePath { get; set; }
        
        public string? Description { get; set; }
        
        public string? MainWindowTitle { get; set; }
        
        public string Name { get; set; }
        
        public DateTime TimeStamp { get; set; }
        
        public float CpuPercentage { get; set; }
        
        public long MemoryKb { get; set; }
        
        public ProcessDiskUsage DiskUsage { get; set; }
        
        public string? Status { get; set; }
        
        public ProcessGpuUtil? GpuUtil { get; set; }
    }

    public class ProcessDiskUsage
    {
        
        public long ReadBytesPerSecond { get; set; }
        
        public long WriteBytesPerSecond { get; set; }
    }

    public class ProcessGpuUtil
    {
        
        public float? GpuCorePercentage { get; set; }
        
        public float? GpuMemPercentage { get; set; }
        
        public float? GpuEncodingPercentage { get; set; }
        
        public float? GpuDecodingPercentage { get; set; }
    }
}
