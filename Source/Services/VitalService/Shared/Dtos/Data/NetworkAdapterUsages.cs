using System.Collections.Concurrent;

namespace VitalService.Dtos.Coms
{
    public class NetworkAdapterUsages
    {
        [SwaggerRequired]
        public ConcurrentDictionary<string, NetworkAdapterUsage> Adapters { get; set; } = new();
    }
    public class NetworkAdapterUsage
    {
        [SwaggerRequired]
        public NetAdapterUsage? Usage { get; set; } = new();
        [SwaggerRequired]
        public NetworkAdapterProperties Properties { get; set; } = new();
    }
    public class NetworkAdapterProperties
    {
        [SwaggerRequired]
        public IPInterfaceProperties IPInterfaceProperties { get; set; } = new();
        [SwaggerRequired]
        public string Name { get; set; }
        [SwaggerRequired]
        public string? Description { get; set; }
        [SwaggerRequired]
        public string MacAddress { get; set; }
        [SwaggerRequired]
        public long? SpeedBps { get; set; }
        [SwaggerRequired]
        public string? ConnectionType { get; set; }

    }
    public class IPInterfaceProperties
    {
        [SwaggerRequired]
        public string? IPv4Address { get; set; }
        [SwaggerRequired]
        public string? IPv6Address { get; set; }
        [SwaggerRequired]
        public string? DnsSuffix { get; set; }
        [SwaggerRequired]
        public bool IsDnsEnabled { get; set; }
    }
    public class NetAdapterUsage
    {
        [SwaggerRequired]
        public long SendBps { get; set; }
        [SwaggerRequired]
        public long RecieveBps { get; set; }
        [SwaggerRequired]
        public long SentBytes { get; set; }
        [SwaggerRequired]
        public long RecievedBytes { get; set; }
        [SwaggerRequired]
        public float? UsagePercentage { get; set; }
    }
}
