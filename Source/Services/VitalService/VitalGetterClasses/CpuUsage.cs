namespace VitalRustServiceClasses
{
    public class CpuUsage
    {
        public float CpuPercentage { get; set; }
        public float CpuTemp { get; set; }
        public List<float> CoreFrequencies { get; set; }
        public List<float> CorePercentages { get; set; }
    }
}
