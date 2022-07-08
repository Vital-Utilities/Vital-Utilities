using System.Collections.Generic;
using System.Linq;

namespace VitalService.Dtos.Data.Metrics
{
    public class CpuUsageMetricModel : HardwareMetricModel
    {
        [SwaggerRequired]
        public float? TotalCoreUsagePercentage { get; set; }
        [SwaggerRequired]
        public float? PackageTemperature { get; set; }
        [SwaggerRequired]
        public float? PowerDrawWattage { get; set; }
        [SwaggerRequired]
        public Dictionary<int, float>? CoreClocksMhz { get; set; } = new();
        [SwaggerRequired]
        public Dictionary<int, float>? CoresUsagePercentage { get; set; } = new();

        public CpuUsageMetricModel() : base(null)
        {

        }
        public CpuUsageMetricModel(string uniqueIdentifier, float? coreUsagePercentage, float? packageTemperature, float? powerDrawWattage, Dictionary<int, float>? cores, Dictionary<int, float>? coreClocksMhz) : base(uniqueIdentifier)
        {
            TotalCoreUsagePercentage = coreUsagePercentage;
            PackageTemperature = packageTemperature;
            PowerDrawWattage = powerDrawWattage;
            CoresUsagePercentage = cores;
            CoreClocksMhz = coreClocksMhz;
        }

    }
}
