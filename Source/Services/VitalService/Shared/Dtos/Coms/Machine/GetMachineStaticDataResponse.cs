using System.Collections.Generic;

namespace VitalService.Dtos.Coms
{
    public class GetMachineStaticDataResponse
    {
        
        public string? DirectXVersion { get; set; }
        
        public CpuData Cpu { get; set; } = new CpuData(); 
        
        public List<RamData> Ram { get; set; } = new List<RamData>(); 
        
        public List<GpuData> Gpu { get; set; } = new List<GpuData>();
    }

}
