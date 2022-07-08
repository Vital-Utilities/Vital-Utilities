namespace VitalService.Dtos.Coms
{
    public class RamUsages
    {
        [SwaggerRequired]
        public double UsedMemoryBytes { get; set; }
        [SwaggerRequired]
        public double TotalVisibleMemoryBytes { get; set; }
    }
}
