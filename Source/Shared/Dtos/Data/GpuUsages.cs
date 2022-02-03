using System.Collections.Concurrent;
using System.Collections.Generic;

namespace VitalService.Dtos.Coms
{
    public class GpuUsages
    {
        public ConcurrentDictionary<string, float> TemperatureReadings { get; set; } = new();
        public float? TotalMemoryBytes { get; set; }
        public float? MemoryUsedBytes { get; set; }
        public float? MemoryClockMhz { get; set; }
        public float? ShaderClockMhz { get; set; }
        public float? CoreClockMhz { get; set; }
        public Dictionary<string, float>? FanPercentage { get; set; } = new();
        public float? PowerDraw { get; set; }
        public LoadData Load { get; set; } = new();
        public PCIE_ThroughPut PCIe_Throughput { get; set; } = new();

        public class PCIE_ThroughPut
        {
            public ulong? PCIe_Rx_BytesPerSecond { get; set; }
            public ulong? PCIe_Tx_BytesPerSecond { get; set; }
        }

        public class LoadData
        {
            public float? Core { get; set; }
            public float? FrameBuffer { get; set; }
            public float? VideoEngine { get; set; }
            public float? BusInterface { get; set; }
            public float? Memory { get; set; }
            public float? MemoryController { get; set; }
            public float? Cuda { get; set; }
            public float? ThreeD { get; set; }
        }
    }

}
