using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VitalService.Dtos.Data.Metrics
{
    public class TimeSeriesMachineMetricsModel
    {
        [SwaggerRequired]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Key]
        public int Id { get; set; }
        [SwaggerRequired]
        public DateTimeOffset DateTimeOffset { get; set; } = new DateTimeOffset(DateTime.Now); 
        [SwaggerRequired]
        public List<CpuUsageMetricModel> CpuUsageData { get; set; }

        [SwaggerRequired]
        public List<GpuUsageMetricModel> GpuUsageData { get; set; } = new List<GpuUsageMetricModel>(); 
        [SwaggerRequired]
        public RamUsageMetricModel RamUsageData { get; set; }
        [SwaggerRequired]
        public List<NetworkUsageMetricModel> NetworkUsageData { get; set; }
        [SwaggerRequired]
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
