using System.Collections.Concurrent;
using System.Collections.Generic;

namespace VitalService.Dtos.Coms
{
    public class CpuUsage
    {
        [SwaggerRequired]
        public List<int> CoreClocksMhz { get; set; } = new();
        [SwaggerRequired]
        public float Total { get; set; }
        [SwaggerRequired]
        public float? PowerDrawWattage { get; set; }
        [SwaggerRequired]
        public List<float> CorePercentages { get; set; } = new();

        [SwaggerRequired]
        public ConcurrentDictionary<string, float> TemperatureReadings { get; set; } = new();

    }

}
