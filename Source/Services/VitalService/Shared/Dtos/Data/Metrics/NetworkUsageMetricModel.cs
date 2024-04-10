
using VitalService.Interfaces;

namespace VitalService.Dtos.Data.Metrics
{
    public class NetworkUsageMetricModel : HardwareMetricModel
    {
        
        public long? UploadSpeedBps { get; set; }
        
        public long? DownloadSpeedBps { get; set; }

        public NetworkUsageMetricModel(string? uniqueIdentifier, long? uploadSpeedBps, long? downloadSpeedBps) : base(uniqueIdentifier)
        {
            UploadSpeedBps = uploadSpeedBps;
            DownloadSpeedBps = downloadSpeedBps;
        }

    }
}
