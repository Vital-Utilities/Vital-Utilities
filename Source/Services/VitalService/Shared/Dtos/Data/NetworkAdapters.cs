﻿using System.Collections.Concurrent;

namespace VitalService.Dtos.Coms
{
    public class NetworkAdapters
    {
        [SwaggerRequired]
        public ConcurrentDictionary<string, NetworkAdapter> Adapters { get; set; } = new();

        public class NetworkAdapter
        {
            [SwaggerRequired]
            public NetAdapterUsage Usage { get; set; } = new();
            [SwaggerRequired]
            public Properties Properties { get; set; } = new();
        }
        public class Properties
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
            public long SpeedBps { get; set; }
            [SwaggerRequired]
            public string ConnectionType { get; set; }

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
            public long UploadSpeedBps { get; set; }
            [SwaggerRequired]
            public long DownloadSpeedBps { get; set; }
            [SwaggerRequired]
            public ulong UploadedBps { get; set; }
            [SwaggerRequired]
            public ulong DownloadedBps { get; set; }
            [SwaggerRequired]
            public long UsagePercentage { get; set; }
        }
    }

}
