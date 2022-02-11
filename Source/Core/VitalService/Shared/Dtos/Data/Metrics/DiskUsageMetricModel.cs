using System.Collections.Generic;
using System.IO;

namespace VitalService.Dtos.Data.Metrics
{
    public class DiskUsageMetricModel : HardwareMetricModel
    {
        public string? Serial { get; set; }
        public string? Name { get; set; }
        public string? DriveLetter { get; set; }
        public DriveType? DriveType { get; set; }
        public float? UsedSpacePercentage { get; set; }
        public long? UsedSpaceBytes { get; set; }
        public float? WriteActivityPercentage { get; set; }
        public float? TotalActivityPercentage { get; set; }

        public double? ReadRateBytesPerSecond { get; set; }
        public double? WriteRateBytesPerSecond { get; set; }

        public double? DataReadBytes { get; set; }
        public double? DataWrittenBytes { get; set; }
        public Dictionary<string, float>? Temperatures { get; set; }

        public DiskUsageMetricModel()
        {

        }

        public DiskUsageMetricModel(string? name, string? uniqueIdentifier, string? driveLetter, double? dataWrittenBytes,
            double? dataReadBytes,
            double? writeRateBytesPerSecond,
            double? readRateBytesPerSecond,
            float? totalActivityPercentage,
            float? writeActivityPercentage,
            float? usedSpacePercentage,
            Dictionary<string, float>? temperatures, long? usedSpaceBytes, string? serial, DriveType? diskType = null) : base(uniqueIdentifier)
        {
            Name = name;
            DriveLetter = driveLetter;
            DataWrittenBytes = dataWrittenBytes;
            DataReadBytes = dataReadBytes;
            WriteRateBytesPerSecond = writeRateBytesPerSecond;
            ReadRateBytesPerSecond = readRateBytesPerSecond;
            TotalActivityPercentage = totalActivityPercentage;
            WriteActivityPercentage = writeActivityPercentage;
            UsedSpacePercentage = usedSpacePercentage;
            Temperatures = temperatures;
            UsedSpaceBytes = usedSpaceBytes;
            Serial = serial;
            DriveType = diskType;
        }
    }
}
