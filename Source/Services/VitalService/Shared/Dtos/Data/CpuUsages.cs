using System.Collections.Concurrent;
using System.Collections.Generic;

namespace VitalService.Dtos.Coms
{
    public class CpuUsage
    {
        
        public List<int> CoreClocksMhz { get; set; } = new();
        
        public float Total { get; set; }
        
        public float? PowerDrawWattage { get; set; }
        
        public List<float> CorePercentages { get; set; } = new();

        
        public ConcurrentDictionary<string, float> TemperatureReadings { get; set; } = new();

    }

}
