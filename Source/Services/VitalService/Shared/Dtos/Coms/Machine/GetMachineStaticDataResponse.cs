using System.Collections.Generic;

namespace VitalService.Dtos.Coms
{
    public class GetMachineStaticDataResponse
    {
        [SwaggerRequired]
        public string? DirectXVersion { get; set; }
        [SwaggerRequired]
        public CpuData Cpu { get; set; } = new CpuData(); 
        [SwaggerRequired]
        public List<RamData> Ram { get; set; } = new List<RamData>(); 
        [SwaggerRequired]
        public List<GpuData> Gpu { get; set; } = new List<GpuData>();
    }

}
