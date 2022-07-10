namespace VitalService.Dtos.Coms
{
    public class RamData
    {
        
        public string? Name { get; set; }
        
        public string? PartNumber { get; set; }
        
        public string? Type { get; set; } // DDRx
        
        public uint? SpeedMhz { get; set; }
        
        public int? SlotNumber { get; set; }
        
        public string? SlotChannel { get; set; }
        
        public uint? ConfiguredClockSpeedMhz { get; set; }
        
        public double? Capacity { get; set; }
    }
}
