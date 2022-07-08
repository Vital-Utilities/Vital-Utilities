namespace VitalService.Dtos.Coms
{
    public class CpuData
    {
        [SwaggerRequired]
        public string Name { get; set; }
        [SwaggerRequired]
        public int NumberOfEnabledCore { get; set; }
        [SwaggerRequired]
        public int NumberOfCores { get; set; }
        [SwaggerRequired]
        public int ThreadCount { get; set; }
        [SwaggerRequired]
        public bool VirtualizationFirmwareEnabled { get; set; }
        [SwaggerRequired]
        public float L1CacheSize { get; set; }
        [SwaggerRequired]
        public float L2CacheSize { get; set; }
        [SwaggerRequired]
        public float L3CacheSize { get; set; }
    }
}
