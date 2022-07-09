using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using VitalService.Dtos.Coms;

namespace VitalService.Dtos.Data
{
    public class DiskUsages
    {
        
        public ConcurrentDictionary<string, DiskUsage> Disks { get; set; } = new();


    }
    public class DiskUsage
    {
        
        public string Name { get; set; }
        
        public string? Serial { get; set; }
        
        public string? UniqueIdentifier { get; set; }
        
        public DriveType DriveType { get; set; }
        
        public DiskType DiskType { get; set; }
        public DiskThroughput? Throughput { get; set; } = new();
        
        public DiskLoad Load { get; set; } = new DiskLoad();
        
        public Dictionary<string, float> Temperatures { get; set; } = new();
        
        public DiskHealth? DiskHealth { get; set; } = new DiskHealth();
        
        public string? VolumeLabel { get; set; }
        
        public string? Letter { get; set; }
    }
    public class DiskLoad
    {
        
        public float? UsedSpacePercentage { get; set; }
        
        public long? UsedSpaceBytes { get; set; }
        
        public long? TotalFreeSpaceBytes { get; set; }
        
        public float? WriteActivityPercentage { get; set; }
        
        public float? TotalActivityPercentage { get; set; }
    }
    public enum DiskType
    {
        Unknown,
        HDD,
        SSD
    }
    public class DiskThroughput
    {
        
        public long? ReadRateBytesPerSecond { get; set; }
        
        public long? WriteRateBytesPerSecond { get; set; }
    }

    public class DiskHealth
    {
        
        public ulong? TotalBytesRead { get; set; }
        
        public ulong? TotalBytesWritten { get; set; }
    }
}
