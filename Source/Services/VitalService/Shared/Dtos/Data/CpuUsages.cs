using System.Collections.Concurrent;
using System.Collections.Generic;

namespace VitalService.Dtos.Coms
{
    public class CpuUsage
    {
        public string Name { get; set; }
        public string? Brand { get; set; }
        public string? VendorId { get; set; }
        public List<int> CoreClocksMhz { get; set; } = new();
        public float TotalCorePercentage { get; set; }
        
        public float? PowerDrawWattage { get; set; }
        
        public List<float> CorePercentages { get; set; } = new();

        public CpuCache? CpuCache { get; set; }
        
        public ConcurrentDictionary<string, float> TemperatureReadings { get; set; } = new();

    }
    public class CpuCache
    {
        public ulong? L1Size { get; set; }
        public ulong? L1LineSize { get; set; }
        public ulong? L2Size { get; set; }
        public ulong? L2LineSize { get; set; }
        public ulong? L3Size { get; set; }
        public ulong? L3LineSize { get; set; }
    }
}
