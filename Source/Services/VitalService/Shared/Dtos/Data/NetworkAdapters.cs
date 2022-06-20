using System.Collections.Concurrent;

namespace VitalService.Dtos.Coms
{
    public class NetworkAdapters
    {
        public ConcurrentDictionary<string, NetworkAdapter> Adapters { get; set; } = new();

        public class NetworkAdapter
        {
            public NetAdapterUsage Usage { get; set; } = new();
            public Properties Properties { get; set; } = new();
        }
        public class Properties
        {
            public IPInterfaceProperties IPInterfaceProperties { get; set; } = new();
            public string Name { get; set; }
            public string? Description { get; set; }
            public string MacAddress { get; set; }
            public long SpeedBps { get; set; }
            public string ConnectionType { get; set; }

        }
        public class IPInterfaceProperties
        {
            public string? IPv4Address { get; set; }
            public string? IPv6Address { get; set; }
            public string? DnsSuffix { get; set; }
            public bool IsDnsEnabled { get; set; }
        }
        public class NetAdapterUsage
        {
            public long UploadSpeedBps { get; set; }
            public long DownloadSpeedBps { get; set; }
            public ulong UploadedBps { get; set; }
            public ulong DownloadedBps { get; set; }
            public long UsagePercentage { get; set; }
        }
    }

}
