
namespace VitalService.Dtos.Data.Metrics
{
    public class NetworkUsageMetricModel : HardwareMetricModel
    {
        [SwaggerRequired]
        public long? UploadSpeedBps { get; set; }
        [SwaggerRequired]
        public long? DownloadSpeedBps { get; set; }

        public NetworkUsageMetricModel(string? uniqueIdentifier, long? uploadSpeedBps, long? downloadSpeedBps) : base(uniqueIdentifier)
        {
            UploadSpeedBps = uploadSpeedBps;
            DownloadSpeedBps = downloadSpeedBps;
        }

    }
}
