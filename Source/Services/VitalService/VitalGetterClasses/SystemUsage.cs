using VitalService;
using VitalService.Dtos.Coms;
using VitalService.Dtos.Data;

namespace VitalRustServiceClasses
{
    public class SystemUsage
    {
        
        public CpuUsage CpuUsage { get; set; }
        
        public MemoryUsage MemUsage { get; set; }
        //public GpuUsage[] GpuUsage { get; set; }
        
        public NetworkAdapterUsage[] NetworkAdapterUsage { get; set; }
        
        public Dictionary<string, DiskUsage> DiskUsage { get; set; }

    }



}
