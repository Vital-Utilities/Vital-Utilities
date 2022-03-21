using System;
using System.Collections.Generic;

namespace VitalService.Dtos
{
    public class SettingsDto
    {
        public bool? RunAtStarup { get; set; } = false;
        public SettingsClasses.LaunchSettings Launch { get; set; } = new();
        public SettingsClasses.MetricsSettings Metrics { get; set; } = new();
        public SettingsClasses.InfluxDbSettings InfluxDb { get; set; } = new();
        //public SettingsClasses.LoggingSettings Logging { get; set; } = new();
    }

    public static class SettingsClasses
    {
        public class LaunchSettings
        {
            public int VitalServiceHttpsPort { get; set; } = 50031;
            public int VitalServiceHttpPort { get; set; } = 50030;
        }
        //public class LoggingSettings
        //{
        //    public MinimumLogLevel LoggerMinimumLevel { get; set; } = MinimumLogLevel.Fatal;
        //}

        //public enum MinimumLogLevel
        //{
        //    Debug,
        //    Fatal,
        //    Warning,
        //    Info
        //}

        public class MetricsSettings
        {
            public bool PersistMetrics { get; set; } = true;
        }

        public class InfluxDbSettings
        {
            public bool Enabled { get; set; } = false;
            public int ReportIntervalSeconds { get; set; } = 5;
            public string EndPoint { get; set; } = "http://localhost:8086";
            public string Token { get; set; } = "";
        }
    }
}
