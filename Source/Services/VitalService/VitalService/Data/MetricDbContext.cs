using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using VitalService.Dtos.Data.Metrics;

namespace VitalService.Data
{
    public class MetricDbContext : DbContext
    {
        public MetricDbContext(DbContextOptions<MetricDbContext> options)
            : base(options)
        {
        }

        public DbSet<TimeSeriesMachineMetricsModel> Metrics { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            //optionsBuilder.LogTo(Log.Logger.Information);
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {

            modelBuilder.Entity<TimeSeriesMachineMetricsModel>().HasIndex(e => e.Id).IsUnique();
            modelBuilder.Entity<DiskUsageMetricModel>(e =>
            {
                var valueComparer = new ValueComparer<Dictionary<string, float>>(
                    (c1, c2) => c1.SequenceEqual(c2),
                    c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                    c => c.ToDictionary(k => k.Key, v => v.Value));
                e.Property(p => p.Temperatures).HasConversion(
                    d => JsonConvert.SerializeObject(d, Formatting.None),
                    s => JsonConvert.DeserializeObject<Dictionary<string, float>>(s)
                ).Metadata.SetValueComparer(valueComparer);
            });
            modelBuilder.Entity<CpuUsageMetricModel>(e =>
            {
                var valueComparer = new ValueComparer<Dictionary<int, float>>(
                    (c1, c2) => c1.SequenceEqual(c2),
                    c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                    c => c.ToDictionary(k => k.Key, v => v.Value));
                e.Property(p => p.CoresUsagePercentage).HasConversion(
                    d => JsonConvert.SerializeObject(d, Formatting.None),
                    s => JsonConvert.DeserializeObject<Dictionary<int, float>>(s)

                ).Metadata.SetValueComparer(valueComparer);

                e.Property(p => p.CoreClocksMhz).HasConversion(
                    d => JsonConvert.SerializeObject(d, Formatting.None),
                    s => JsonConvert.DeserializeObject<Dictionary<int, float>>(s)

                ).Metadata.SetValueComparer(valueComparer);
            });

            modelBuilder.Entity<GpuUsageMetricModel>(e =>
            {
                var valueComparer = new ValueComparer<Dictionary<string, float>?>(
                    (c1, c2) => c1.SequenceEqual(c2),
                    c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                    c => c.ToDictionary(k => k.Key, v => v.Value));
                e.Property(p => p.FanPercentage).HasConversion(
                    d => JsonConvert.SerializeObject(d, Formatting.None),
                    s => JsonConvert.DeserializeObject<Dictionary<string, float>?>(s)
                ).Metadata.SetValueComparer(valueComparer);
            });
        }
    }
}