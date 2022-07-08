namespace VitalService.Dtos.Coms
{
    public class RamData
    {
        [SwaggerRequired]
        public string? Name { get; set; }
        [SwaggerRequired]
        public string? PartNumber { get; set; }
        [SwaggerRequired]
        public string? Type { get; set; } // DDRx
        [SwaggerRequired]
        public uint? SpeedMhz { get; set; }
        [SwaggerRequired]
        public int? SlotNumber { get; set; }
        [SwaggerRequired]
        public string? SlotChannel { get; set; }
        [SwaggerRequired]
        public uint? ConfiguredClockSpeedMhz { get; set; }
        [SwaggerRequired]
        public double? Capacity { get; set; }
    }
}
