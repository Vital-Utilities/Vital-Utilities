using System.Collections.Generic;
using System.IO;

namespace VitalService.Dtos.Data.Metrics
{
    public class DiskUsageMetricModel : HardwareMetricModel
    {
        [SwaggerRequired]
        public string? Serial { get; set; }
        [SwaggerRequired]
        public string? Name { get; set; }
        [SwaggerRequired]
        public string? DriveLetter { get; set; }
        [SwaggerRequired]
        public DriveType? DriveType { get; set; }
        [SwaggerRequired]
        public float? UsedSpacePercentage { get; set; }
        [SwaggerRequired]
        public long? UsedSpaceBytes { get; set; }
        [SwaggerRequired]
        public float? WriteActivityPercentage { get; set; }
        [SwaggerRequired]
        public float? TotalActivityPercentage { get; set; }

        [SwaggerRequired]
        public double? ReadRateBytesPerSecond { get; set; }
        [SwaggerRequired]
        public double? WriteRateBytesPerSecond { get; set; }
        [SwaggerRequired]

        public double? DataReadBytes { get; set; }
        [SwaggerRequired]
        public double? DataWrittenBytes { get; set; }
        [SwaggerRequired]
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
