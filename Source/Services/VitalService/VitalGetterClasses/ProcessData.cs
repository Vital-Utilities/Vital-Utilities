namespace VitalRustServiceClasses
{
    public class ProcessData
    {
        public float Pid { get; set; }
        public float? ParentPid { get; set; }
        public string Name { get; set; }
        public DateTime TimeStamp { get; set; }
        public float CpuPercentage { get; set; }
        public float MemoryKb { get; set; }
        public DiskUsage DiskUsage { get; set; }
        public string Status { get; set; }
        public ProcessGpuUtil? GpuUtil { get; set; }
    }
}
