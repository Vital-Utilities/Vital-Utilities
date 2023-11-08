using System.Collections.Generic;

namespace VitalService.Dtos.Data.Metrics
{
    public class GpuUsageMetricModel : HardwareMetricModel
    {
        public float? CoreUsagePercentage { get; set; }
        
        public float? VramUsageBytes { get; set; }
        
        public float? VramTotalBytes { get; set; }
        
        public float? CoreTemperature { get; set; }
        
        public float? PowerDrawWattage { get; set; }
        
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
