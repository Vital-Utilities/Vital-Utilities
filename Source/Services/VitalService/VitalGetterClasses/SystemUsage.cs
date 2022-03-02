namespace VitalRustServiceClasses
{
    public class SystemUsage
    {
        public CpuUsage CpuUsage { get; set; }
        public MemUsage MemUsage { get; set; }
        //public GpuUsage[] GpuUsage { get; set; }
        public NetworkAdapterUsage[] NetworkAdapterUsage { get; set; }

    }
}
