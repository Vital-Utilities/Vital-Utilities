using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using VitalService.Dtos.Coms;

namespace VitalService.Dtos.Data
{
    public class DiskUsages
    {
        [SwaggerRequired]
        public ConcurrentDictionary<string, DiskUsage> Disks { get; set; } = new();


    }
    public class DiskUsage
    {
        [SwaggerRequired]
        public string Name { get; set; }
        [SwaggerRequired]
        public string? Serial { get; set; }
        [SwaggerRequired]
        public string? UniqueIdentifier { get; set; }
        [SwaggerRequired]
        public DriveType? DriveType { get; set; }
        [SwaggerRequired]
        public DiskType? DiskType { get; set; }
        [SwaggerRequired]
        public Throughput? Throughput { get; set; } = new();
        [SwaggerRequired]
        public DiskLoad Load { get; set; } = new DiskLoad();
        [SwaggerRequired]
        public Dictionary<string, float> Temperatures { get; set; } = new();
        [SwaggerRequired]
        public DiskHealth? Data { get; set; } = new DiskHealth();
        [SwaggerRequired]
        public string Label { get; set; }
        [SwaggerRequired]
        public string Letter { get; set; }
    }
    public class DiskLoad
    {
        [SwaggerRequired]
        public float? UsedSpacePercentage { get; set; }
        [SwaggerRequired]
        public long? UsedSpaceBytes { get; set; }
        [SwaggerRequired]
        public long? TotalFreeSpaceBytes { get; set; }
        [SwaggerRequired]
        public float? WriteActivityPercentage { get; set; }
        [SwaggerRequired]
        public float? TotalActivityPercentage { get; set; }
    }
    public enum DiskType
    {
        Unknown,
        HDD,
        SSD
    }
    public class Throughput
    {
        [SwaggerRequired]
        public long? ReadRateBytesPerSecond { get; set; }
        [SwaggerRequired]
        public long? WriteRateBytesPerSecond { get; set; }
    }

    public class DiskHealth
    {
        [SwaggerRequired]
        public ulong? TotalBytesRead { get; set; }
        [SwaggerRequired]
        public ulong? TotalBytesWritten { get; set; }
    }
}
