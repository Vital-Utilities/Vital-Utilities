namespace VitalService.Dtos.Coms
{
    public class CpuData
    {
        
        public string Name { get; set; }
        
        public int NumberOfEnabledCore { get; set; }
        
        public int NumberOfCores { get; set; }
        
        public int ThreadCount { get; set; }
        
        public bool VirtualizationFirmwareEnabled { get; set; }
        
        public ulong L1CacheSize { get; set; }
        
        public ulong L2CacheSize { get; set; }
        
        public ulong L3CacheSize { get; set; }
    }
}
