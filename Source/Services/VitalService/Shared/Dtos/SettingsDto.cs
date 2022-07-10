using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

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
            [Required]
            public int VitalServiceHttpsPort { get; set; } = 50031;

            [Required]
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
            [Required]
            public bool PersistMetrics { get; set; } = true;
        }

        public class InfluxDbSettings
        {
            [Required]
            public bool Enabled { get; set; } = false;
            [Required]
            public int ReportIntervalSeconds { get; set; } = 5;
            [Required]
            public string EndPoint { get; set; } = "http://localhost:8086";
            [Required]
            public string Token { get; set; } = "";
        }
    }
}
