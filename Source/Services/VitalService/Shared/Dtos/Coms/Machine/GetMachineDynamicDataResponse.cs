using System;
using System.Collections.Generic;
using VitalService.Dtos.Data;

namespace VitalService.Dtos.Coms
{
    public class GetMachineDynamicDataResponse
    {
        public CpuUsages? CpuUsageData { get; set; }
        public RamUsages? RamUsagesData { get; set; }
        public List<GpuUsages>? GpuUsageData { get; set; }
        public DiskUsages? DiskUsages { get; set; }
        public NetworkAdapters? NetworkUsageData { get; set; }
        public IDictionary<int, float>? ProcessCpuUsage { get; set; }
        public IDictionary<int, float>? ProcessCpuThreadsUsage { get; set; }
        public IDictionary<int, float>? ProcessThreadCount { get; set; }
        public IDictionary<int, float>? ProcessRamUsageGb { get; set; }
        public IDictionary<int, double>? ProcessDiskBytesPerSecActivity { get; set; }
        public IDictionary<string, float>? CpuTemperature { get; set; }
        public IDictionary<int, float>? ProcessGpuUsage { get; set; }
    }

    public class GetMachineTimeSeriesRequest
    {
        public DateTime From { get; set; }
        public DateTime To { get; set; }
    }

    public class GetMachineRelativeTimeSeriesRequest
    {
        public DateTime From { get; set; }
        public To To { get; set; } = new To(null, null, null, null);
    }
    public record To(int? Months, int? Days, int? Hours, int? Minutes);
}