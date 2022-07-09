namespace VitalService.Dtos.Coms
{
    public class CpuData
    {
        
        public string Name { get; set; }
        
        public int NumberOfEnabledCore { get; set; }
        
        public int NumberOfCores { get; set; }
        
        public int ThreadCount { get; set; }
        
        public bool VirtualizationFirmwareEnabled { get; set; }
        
        public float L1CacheSize { get; set; }
        
        public float L2CacheSize { get; set; }
        
        public float L3CacheSize { get; set; }
    }
}
