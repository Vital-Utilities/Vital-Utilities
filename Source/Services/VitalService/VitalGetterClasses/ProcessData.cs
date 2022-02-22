using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VitalRustServiceClasses
{
    public class ProcessData
    {
        public float Pid { get; set; }
        public float? ParentPid { get; set; }
        public string Name { get; set; }
        public DateTime TimeStamp { get; set; }
        public float CpuPercentage { get; set; }
        public float MemoryKb { get; set; }
        public DiskUsage DiskUsage { get; set; }
        public string Status { get; set; }
        public float? GpuCorePercentage { get; set; }
        public float? GpuMemPercentage { get; set; }
        public float? GpuEncodingPercentage { get; set; }
        public float? GpuDecodingPercentage { get; set; }
    }
    public class SendUtilizationRequest
    {
        public ProcessData[] ProcessData { get; set; }
        public SystemUsage SystemUsage { get; set; }
    }

    public class DiskUsage
    {
        public float ReadBytesPerSecond { get; set; }
        public float WriteBytesPerSecond { get; set; }
    }

    public class SystemUsage
    {
        public CpuUsage CpuUsage { get; set; }
        public MemUsage MemUsage { get; set; }
        //public GpuUsage[] GpuUsage { get; set; }
        //public NetworkUsage[] NetworkUsage { get; set; }

    }
    public class NetworkUsage
    {
        public string Name { get; set; }
        public string? Description { get; set; }
        public string MacAddress { get; set; }
        public float UploadSpeedBps { get; set; }
        public float DownloadSpeedBps { get; set; }
        public float UploadedBps { get; set; }
        public float DownloadedBps { get; set; }
        public float UsagePercentage { get; set; }
    }

    public class CpuUsage
    {
        public float CpuPercentage { get; set; }
        public float CpuTemp { get; set; }
        public List<float> CoreFrequencies { get; set; }
        public List<float> CorePercentages { get; set; }
    }
    public class GpuUsage
    {
        public string Name { get; set; }
        public float CorePercentage { get; set; }
        public float CorePowerWatt { get; set; }
        public float CoreClockMhz { get; set; }
        public float MemPercentage { get; set; }
        public float MemTotalKB { get; set; }
        public float MemClockMhz { get; set; }
        public float PciThroughputSendKBs { get; set; }
        public float PciThroughputRecieveKBs { get; set; }
    }

    public class MemUsage
    {
        public float MemPercentage { get; set; }
        public float MemUsedKB { get; set; }
        public float MemTotalKB { get; set; }
        public float SwapPercentage { get; set; }
        public float SwapUsedKB { get; set; }
        public float SwapTotalKB { get; set; }

    }

    public class SendProcessMainWindowTitleMappingRequest
    {
        public List<PidProcessTitleMapping> Mappings { get; set; }
    }

    public class PidProcessTitleMapping
    {
        public float Id { get; set; }
        public string Title { get; set; }
    }
}
