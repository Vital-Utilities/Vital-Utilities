using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using VitalService.Dtos.Coms;

namespace VitalService.Dtos.Data
{
    public class DiskUsages
    {
        public ConcurrentDictionary<string, DiskUsage> Disks { get; set; } = new();
        public class DiskUsage
        {
            public string Name { get; set; }
            public string? Serial { get; set; }
            public string? UniqueIdentifier { get; set; }
            public DriveType? DriveType { get; set; }
            public Throughput Throughput { get; set; } = new();
            public Load Load { get; set; } = new Load();
            public Dictionary<string, float> Temperatures { get; set; } = new();
            public Data Data { get; set; } = new Data();
            public string Label { get; set; }
            public string Letter { get; set; }
        }
        public class Load
        {
            public float? UsedSpacePercentage { get; set; }
            public long? UsedSpaceBytes { get; set; }
            public long? TotalFreeSpaceBytes { get; set; }
            public float? WriteActivityPercentage { get; set; }
            public float? TotalActivityPercentage { get; set; }
        }

        public class Throughput
        {
            public long? ReadRateBytesPerSecond { get; set; }
            public long? WriteRateBytesPerSecond { get; set; }
        }

        public class Data
        {
            public ulong? DataReadBytes { get; set; }
            public ulong? DataWrittenBytes { get; set; }
        }

    }
}
