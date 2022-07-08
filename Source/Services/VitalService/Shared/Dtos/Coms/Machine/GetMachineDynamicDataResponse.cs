using System;
using System.Collections.Generic;
using VitalService.Dtos.Data;

namespace VitalService.Dtos.Coms
{
    public class GetMachineDynamicDataResponse
    {
        [SwaggerRequired]
        public CpuUsages? CpuUsageData { get; set; }
        [SwaggerRequired]
        public RamUsages? RamUsagesData { get; set; }
        [SwaggerRequired]
        public List<GpuUsages>? GpuUsageData { get; set; }
        [SwaggerRequired]
        public DiskUsages? DiskUsages { get; set; }
        [SwaggerRequired]
        public NetworkAdapters? NetworkUsageData { get; set; }
        [SwaggerRequired]
        public IDictionary<int, float>? ProcessCpuUsage { get; set; }
        [SwaggerRequired]
        public IDictionary<int, float>? ProcessCpuThreadsUsage { get; set; }
        [SwaggerRequired]
        public IDictionary<int, float>? ProcessThreadCount { get; set; }
        [SwaggerRequired]
        public IDictionary<int, float>? ProcessRamUsageGb { get; set; }
        [SwaggerRequired]
        public IDictionary<int, double>? ProcessDiskBytesPerSecActivity { get; set; }
        [SwaggerRequired]
        public IDictionary<string, float>? CpuTemperature { get; set; }
        [SwaggerRequired]
        public IDictionary<int, float>? ProcessGpuUsage { get; set; }
    }

    public class GetMachineTimeSeriesRequest
    {
        [SwaggerRequired]
        public DateTime Earliest { get; set; }
        [SwaggerRequired]
        public DateTime Latest { get; set; }
    }
}