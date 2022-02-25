namespace VitalRustServiceClasses
{
    public class GpuUsage
    {
        public string Name { get; set; }
        public float CorePercentage { get; set; }
        public float CorePowerWatt { get; set; }
        public float CoreClockMhz { get; set; }
        public float MemPercentage { get; set; }
        public float MemTotalKB { get; set; }
        public float MemClockMhz { get; set; }
        public float PciThroughputSendKBs { get; set; }
        public float PciThroughputRecieveKBs { get; set; }
    }
}
