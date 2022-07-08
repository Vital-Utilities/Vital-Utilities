using System.Collections.Generic;

namespace VitalService.Dtos.Data.Metrics
{
    public class GpuUsageMetricModel : HardwareMetricModel
    {
        [SwaggerRequired]
        public float? CoreUsagePercentage { get; set; }
        [SwaggerRequired]
        public float? VramUsageBytes { get; set; }
        [SwaggerRequired]
        public float? VramTotalBytes { get; set; }
        [SwaggerRequired]
        public float? CoreTemperature { get; set; }
        [SwaggerRequired]
        public float? PowerDrawWattage { get; set; }
        [SwaggerRequired]
        public Dictionary<string, float>? FanPercentage { get; set; }

        public GpuUsageMetricModel() : base(null)
        {

        }
        public GpuUsageMetricModel(string uniqueIdentifier, float? coreUsagePercentage, float? vramUsageBytes, float? coreTemperature, float? powerDrawWattage, Dictionary<string, float>? fanPercentage, float? vRamTotalBytes) : base(uniqueIdentifier)
        {
            CoreUsagePercentage = coreUsagePercentage;
            VramUsageBytes = vramUsageBytes;
            CoreTemperature = coreTemperature;
            PowerDrawWattage = powerDrawWattage;
            FanPercentage = fanPercentage;
            VramTotalBytes = vRamTotalBytes;
        }
    }
}
