using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VitalRustServiceClasses
{
    public class Disk
    {
        public string Name { get; set; }
        public string? Serial { get; set; }
        public string? Letter { get; set; }
        public string? DriveType { get; set; }
        public DiskThroughput? Throughput { get; set; } = new();
        public DiskLoad? Load { get; set; } = new();
        public Dictionary<string, float>? Temperatures { get; set; } = new();
        public DiskHealth? Health { get; set; } = new();
    }
    public class DiskLoad
    {
        public float? UsedSpacePercentage { get; set; }
        public float? UsedSpaceBytes { get; set; }
        public float? TotalFreeSpaceBytes { get; set; }
        public float? WriteActivityPercentage { get; set; }
        public float? TotalActivityPercentage { get; set; }
    }

    public class DiskThroughput
    {
        public float? ReadRateBytesPerSecond { get; set; }
        public float? WriteRateBytesPerSecond { get; set; }
    }

    public class DiskHealth
    {
        public float? TotalBytesRead { get; set; }
        public float? TotalBytesWritten { get; set; }
    }
}
