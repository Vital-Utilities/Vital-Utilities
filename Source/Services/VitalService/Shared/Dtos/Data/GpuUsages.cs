using System.Collections.Concurrent;
using System.Collections.Generic;

namespace VitalService.Dtos.Coms
{
    public class GpuUsages
    {
        [SwaggerRequired]
        public string? Name { get; set; }
        [SwaggerRequired]
        public ConcurrentDictionary<string, float> TemperatureReadings { get; set; } = new();
        [SwaggerRequired]
        public float? TotalMemoryBytes { get; set; }
        [SwaggerRequired]
        public float? MemoryUsedBytes { get; set; }
        [SwaggerRequired]
        public float? MemoryClockMhz { get; set; }
        [SwaggerRequired]
        public float? ShaderClockMhz { get; set; }
        [SwaggerRequired]
        public float? CoreClockMhz { get; set; }
        [SwaggerRequired]
        public Dictionary<string, float>? FanPercentage { get; set; } = new();
        [SwaggerRequired]
        public float? PowerDraw { get; set; }
        [SwaggerRequired]
        public LoadData? Load { get; set; } = new();
        [SwaggerRequired]
        public PCIE_ThroughPut PCIe { get; set; } = new();

        
    }
    public class PCIE_ThroughPut
    {
        [SwaggerRequired]
        public ulong? PCIe_RxBytesPerSecond { get; set; }
        [SwaggerRequired]
        public ulong? PCIe_TxBytesPerSecond { get; set; }
    }

    public class LoadData
    {
        [SwaggerRequired]
        public float? Core { get; set; }
        [SwaggerRequired]
        public float? FrameBuffer { get; set; }
        [SwaggerRequired]
        public float? VideoEngine { get; set; }
        [SwaggerRequired]
        public float? BusInterface { get; set; }
        [SwaggerRequired]
        public float? Memory { get; set; }
        [SwaggerRequired]
        public float? MemoryController { get; set; }
        [SwaggerRequired]
        public float? Cuda { get; set; }
        [SwaggerRequired]
        public float? ThreeD { get; set; }
    }
}
