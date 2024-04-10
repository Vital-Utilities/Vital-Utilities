﻿// <auto-generated />
using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using VitalService.Data;

#nullable disable

namespace VitalService.Migrations.MetricDb
{
    [DbContext(typeof(MetricDbContext))]
    partial class MetricDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder.HasAnnotation("ProductVersion", "8.0.0");

            modelBuilder.Entity("VitalService.Dtos.Data.Metrics.CpuUsageMetricModel", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<string>("CoreClocksMhz")
                        .HasColumnType("TEXT");

                    b.Property<string>("CoresUsagePercentage")
                        .HasColumnType("TEXT");

                    b.Property<float?>("PackageTemperature")
                        .HasColumnType("REAL");

                    b.Property<float?>("PowerDrawWattage")
                        .HasColumnType("REAL");

                    b.Property<int?>("TimeSeriesMachineMetricsModelId")
                        .HasColumnType("INTEGER");

                    b.Property<float?>("TotalCoreUsagePercentage")
                        .HasColumnType("REAL");

                    b.Property<string>("UniqueIdentifier")
                        .HasColumnType("TEXT");

                    b.HasKey("Id");

                    b.HasIndex("TimeSeriesMachineMetricsModelId");

                    b.ToTable("CpuUsageMetricModel");
                });

            modelBuilder.Entity("VitalService.Dtos.Data.Metrics.DiskUsageMetricModel", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<double?>("DataReadBytes")
                        .HasColumnType("REAL");

                    b.Property<double?>("DataWrittenBytes")
                        .HasColumnType("REAL");

                    b.Property<string>("DriveLetter")
                        .HasColumnType("TEXT");

                    b.Property<string>("Name")
                        .HasColumnType("TEXT");

                    b.Property<double?>("ReadRateBytesPerSecond")
                        .HasColumnType("REAL");

                    b.Property<string>("Serial")
                        .HasColumnType("TEXT");

                    b.Property<string>("Temperatures")
                        .HasColumnType("TEXT");

                    b.Property<int?>("TimeSeriesMachineMetricsModelId")
                        .HasColumnType("INTEGER");

                    b.Property<float?>("TotalActivityPercentage")
                        .HasColumnType("REAL");

                    b.Property<long?>("TotalSpaceBytes")
                        .HasColumnType("INTEGER");

                    b.Property<string>("UniqueIdentifier")
                        .HasColumnType("TEXT");

                    b.Property<long?>("UsedSpaceBytes")
                        .HasColumnType("INTEGER");

                    b.Property<float?>("UsedSpacePercentage")
                        .HasColumnType("REAL");

                    b.Property<float?>("WriteActivityPercentage")
                        .HasColumnType("REAL");

                    b.Property<double?>("WriteRateBytesPerSecond")
                        .HasColumnType("REAL");

                    b.HasKey("Id");

                    b.HasIndex("TimeSeriesMachineMetricsModelId");

                    b.ToTable("DiskUsageMetricModel");
                });

            modelBuilder.Entity("VitalService.Dtos.Data.Metrics.GpuUsageMetricModel", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<float?>("CoreTemperature")
                        .HasColumnType("REAL");

                    b.Property<float?>("CoreUsagePercentage")
                        .HasColumnType("REAL");

                    b.Property<string>("FanPercentage")
                        .HasColumnType("TEXT");

                    b.Property<float?>("PowerDrawWattage")
                        .HasColumnType("REAL");

                    b.Property<int?>("TimeSeriesMachineMetricsModelId")
                        .HasColumnType("INTEGER");

                    b.Property<string>("UniqueIdentifier")
                        .HasColumnType("TEXT");

                    b.Property<float?>("VramTotalBytes")
                        .HasColumnType("REAL");

                    b.Property<float?>("VramUsageBytes")
                        .HasColumnType("REAL");

                    b.HasKey("Id");

                    b.HasIndex("TimeSeriesMachineMetricsModelId");

                    b.ToTable("GpuUsageMetricModel");
                });

            modelBuilder.Entity("VitalService.Dtos.Data.Metrics.NetworkUsageMetricModel", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<long?>("DownloadSpeedBps")
                        .HasColumnType("INTEGER");

                    b.Property<int?>("TimeSeriesMachineMetricsModelId")
                        .HasColumnType("INTEGER");

                    b.Property<string>("UniqueIdentifier")
                        .HasColumnType("TEXT");

                    b.Property<long?>("UploadSpeedBps")
                        .HasColumnType("INTEGER");

                    b.HasKey("Id");

                    b.HasIndex("TimeSeriesMachineMetricsModelId");

                    b.ToTable("NetworkUsageMetricModel");
                });

            modelBuilder.Entity("VitalService.Dtos.Data.Metrics.RamUsageMetricModel", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<double?>("TotalVisibleMemoryBytes")
                        .HasColumnType("REAL");

                    b.Property<string>("UniqueIdentifier")
                        .HasColumnType("TEXT");

                    b.Property<double?>("UsedMemoryBytes")
                        .HasColumnType("REAL");

                    b.HasKey("Id");

                    b.ToTable("RamUsageMetricModel");
                });

            modelBuilder.Entity("VitalService.Dtos.Data.Metrics.TimeSeriesMachineMetricsModel", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<DateTimeOffset>("DateTimeOffset")
                        .HasColumnType("TEXT");

                    b.Property<int>("RamUsageDataId")
                        .HasColumnType("INTEGER");

                    b.HasKey("Id");

                    b.HasIndex("Id")
                        .IsUnique();

                    b.HasIndex("RamUsageDataId");

                    b.ToTable("Metrics");
                });

            modelBuilder.Entity("VitalService.Dtos.Data.Metrics.CpuUsageMetricModel", b =>
                {
                    b.HasOne("VitalService.Dtos.Data.Metrics.TimeSeriesMachineMetricsModel", null)
                        .WithMany("CpuUsageData")
                        .HasForeignKey("TimeSeriesMachineMetricsModelId");
                });

            modelBuilder.Entity("VitalService.Dtos.Data.Metrics.DiskUsageMetricModel", b =>
                {
                    b.HasOne("VitalService.Dtos.Data.Metrics.TimeSeriesMachineMetricsModel", null)
                        .WithMany("DiskUsageData")
                        .HasForeignKey("TimeSeriesMachineMetricsModelId");
                });

            modelBuilder.Entity("VitalService.Dtos.Data.Metrics.GpuUsageMetricModel", b =>
                {
                    b.HasOne("VitalService.Dtos.Data.Metrics.TimeSeriesMachineMetricsModel", null)
                        .WithMany("GpuUsageData")
                        .HasForeignKey("TimeSeriesMachineMetricsModelId");
                });

            modelBuilder.Entity("VitalService.Dtos.Data.Metrics.NetworkUsageMetricModel", b =>
                {
                    b.HasOne("VitalService.Dtos.Data.Metrics.TimeSeriesMachineMetricsModel", null)
                        .WithMany("NetworkUsageData")
                        .HasForeignKey("TimeSeriesMachineMetricsModelId");
                });

            modelBuilder.Entity("VitalService.Dtos.Data.Metrics.TimeSeriesMachineMetricsModel", b =>
                {
                    b.HasOne("VitalService.Dtos.Data.Metrics.RamUsageMetricModel", "RamUsageData")
                        .WithMany()
                        .HasForeignKey("RamUsageDataId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("RamUsageData");
                });

            modelBuilder.Entity("VitalService.Dtos.Data.Metrics.TimeSeriesMachineMetricsModel", b =>
                {
                    b.Navigation("CpuUsageData");

                    b.Navigation("DiskUsageData");

                    b.Navigation("GpuUsageData");

                    b.Navigation("NetworkUsageData");
                });
#pragma warning restore 612, 618
        }
    }
}
