using System.Collections.Concurrent;
using System.Collections.Generic;

namespace VitalService.Dtos.Coms
{
    public class GpuUsages
    {
        
        public string? Name { get; set; }
        
        public ConcurrentDictionary<string, float> TemperatureReadings { get; set; } = new();
        
        public long? TotalMemoryBytes { get; set; }
        
        public long? MemoryUsedBytes { get; set; }
        
        public int? MemoryClockMhz { get; set; }
        
        public int? ShaderClockMhz { get; set; }
        
        public int? CoreClockMhz { get; set; }
        
        public Dictionary<string, float>? FanPercentage { get; set; } = new();
        
        public int? PowerDrawWatt { get; set; }
        
        public LoadData? Load { get; set; } = new();
        
        public PCIE_ThroughPut PCIe { get; set; } = new();

        
    }
    public class PCIE_ThroughPut
    {
        
        public long? PCIe_RxBytesPerSecond { get; set; }
        
        public long? PCIe_TxBytesPerSecond { get; set; }
    }

    public class LoadData
    {
        
        public float? CorePercentage { get; set; }
        
        public float? FrameBufferPercentage { get; set; }
        
        public float? VideoEnginePercentage { get; set; }
        
        public float? BusInterfacePercentage { get; set; }
        
        public float? MemoryUsedPercentage { get; set; }
        
        public float? MemoryControllerPercentage { get; set; }
        
        public float? CudaPercentage { get; set; }
        
        public float? ThreeDPercentage { get; set; }
    }
}
