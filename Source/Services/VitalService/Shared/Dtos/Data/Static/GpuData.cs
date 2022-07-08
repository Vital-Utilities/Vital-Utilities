namespace VitalService.Dtos.Coms
{
    public class GpuData
    {
        [SwaggerRequired]
        public string Name { get; set; }
        [SwaggerRequired]
        public float? MemoryTotalBytes { get; set; }
    }
}
