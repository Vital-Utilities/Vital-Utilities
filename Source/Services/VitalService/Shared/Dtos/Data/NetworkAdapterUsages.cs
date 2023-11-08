using System.Collections.Concurrent;

namespace VitalService.Dtos.Coms
{
    public class NetworkAdapterUsages
    {
        
        public ConcurrentDictionary<string, NetworkAdapterUsage> Adapters { get; set; } = new();
    }
    public class NetworkAdapterUsage
    {
        public NetAdapterUsage? Usage { get; set; } = new();
        
        public NetworkAdapterProperties Properties { get; set; } = new();
    }
    public class NetworkAdapterProperties
    {
        
        public IPInterfaceProperties IPInterfaceProperties { get; set; } = new();
        public bool IsUp { get; set; }

        public string Name { get; set; }
        
        public string? Description { get; set; }
        
        public string? MacAddress { get; set; }
        
        public long? SpeedBps { get; set; }
        
        public string? ConnectionType { get; set; }

    }
    public class IPInterfaceProperties
    {
        
        public string? IPv4Address { get; set; }
        
        public string? IPv6Address { get; set; }
        
        public string? DnsSuffix { get; set; }
        
        public bool? IsDnsEnabled { get; set; }
    }

    public class NetAdapterUsage
    {
        public long SendBps { get; set; }
        
        public long RecieveBps { get; set; }
        
        public float? UsagePercentage { get; set; }
    }
}
