using System;
using System.Collections.Generic;
using VitalService.Dtos.Data;

namespace VitalService.Dtos.Coms
{
    public class GetMachineDynamicDataResponse
    {
        
        public CpuUsage? CpuUsageData { get; set; }
        
        public MemoryUsage? RamUsagesData { get; set; }
        
        public List<GpuUsage>? GpuUsageData { get; set; }
        
        public DiskUsages? DiskUsages { get; set; }
        
        public NetworkAdapterUsages? NetworkUsageData { get; set; }
        
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
        
        public DateTime Earliest { get; set; }
        
        public DateTime Latest { get; set; }
    }
}