using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VitalService.Dtos.Data.Metrics
{
    public class TimeSeriesMachineMetricsModel
    {
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Key]
        public int Id { get; set; }
        public DateTimeOffset DateTimeOffset { get; set; } = new DateTimeOffset(DateTime.Now);
        public List<CpuUsageMetricModel> CpuUsageData { get; set; }

        public List<GpuUsageMetricModel> GpuUsageData { get; set; } = new List<GpuUsageMetricModel>();
        public RamUsageMetricModel RamUsageData { get; set; }
        public List<NetworkUsageMetricModel> NetworkUsageData { get; set; }
        public List<DiskUsageMetricModel> DiskUsageData { get; set; }

#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        public TimeSeriesMachineMetricsModel()
        {

        }
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.

        public TimeSeriesMachineMetricsModel(List<CpuUsageMetricModel> cpuUsageData,
            List<GpuUsageMetricModel> gpuUsageData,
            RamUsageMetricModel ramUsageData,
            List<NetworkUsageMetricModel> networkUsageData,
            List<DiskUsageMetricModel> diskUsageData)
        {
            CpuUsageData = cpuUsageData;
            GpuUsageData = gpuUsageData;
            RamUsageData = ramUsageData;
            NetworkUsageData = networkUsageData;
            DiskUsageData = diskUsageData;
        }
    }
}
