using VitalService;
using VitalService.Dtos.Coms;
using VitalService.Dtos.Data;

namespace VitalRustServiceClasses
{
    public class SystemUsage
    {
        [SwaggerRequired]
        public CpuUsage CpuUsage { get; set; }
        [SwaggerRequired]
        public MemoryUsage MemUsage { get; set; }
        //public GpuUsage[] GpuUsage { get; set; }
        [SwaggerRequired]
        public NetworkAdapterUsage[] NetworkAdapterUsage { get; set; }
        [SwaggerRequired]
        public Dictionary<string, DiskUsage> DiskUsage { get; set; }

    }



}
