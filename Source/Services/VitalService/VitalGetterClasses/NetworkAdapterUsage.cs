namespace VitalRustServiceClasses
{
    public class NetworkAdapterUsage
    {
        public NetworkAdapterProperties Properties { get; set; }
        public NetworkAdapterUtil? Utilisation { get; set; }
    }
    public class NetworkAdapterProperties
    {
        public string Name { get; set; }
        public string? Description { get; set; }
        public string MacAddress { get; set; }
        public float? SpeedBps { get; set; }
        public string? ConnectionType { get; set; }
        public string[]? IPv4Address { get; set; }
        public string[]? IPv6Address { get; set; }
        public string? DnsSuffix { get; set; }
    }

    public class NetworkAdapterUtil
    {
        public float SendBps { get; set; }
        public float RecieveBps { get; set; }
    }
}
