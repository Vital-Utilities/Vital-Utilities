using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VitalService.Migrations.MetricDb
{
    public partial class ff : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Metrics",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    DateTimeOffset = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Metrics", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CpuUsageMetricModel",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TotalCoreUsagePercentage = table.Column<double>(type: "REAL", nullable: true),
                    PackageTemperature = table.Column<double>(type: "REAL", nullable: true),
                    PowerDrawWattage = table.Column<double>(type: "REAL", nullable: true),
                    CoresUsagePercentage = table.Column<string>(type: "TEXT", nullable: true),
                    TimeSeriesMachineMetricsModelId = table.Column<int>(type: "INTEGER", nullable: true),
                    UniqueIdentifier = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CpuUsageMetricModel", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CpuUsageMetricModel_Metrics_TimeSeriesMachineMetricsModelId",
                        column: x => x.TimeSeriesMachineMetricsModelId,
                        principalTable: "Metrics",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "DiskUsageMetricModel",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Serial = table.Column<string>(type: "TEXT", nullable: true),
                    Name = table.Column<string>(type: "TEXT", nullable: true),
                    DriveLetter = table.Column<string>(type: "TEXT", nullable: true),
                    DriveType = table.Column<int>(type: "INTEGER", nullable: true),
                    UsedSpacePercentage = table.Column<float>(type: "REAL", nullable: true),
                    UsedSpaceBytes = table.Column<long>(type: "INTEGER", nullable: true),
                    WriteActivityPercentage = table.Column<float>(type: "REAL", nullable: true),
                    TotalActivityPercentage = table.Column<float>(type: "REAL", nullable: true),
                    ReadRateBytesPerSecond = table.Column<double>(type: "REAL", nullable: true),
                    WriteRateBytesPerSecond = table.Column<double>(type: "REAL", nullable: true),
                    DataReadBytes = table.Column<double>(type: "REAL", nullable: true),
                    DataWrittenBytes = table.Column<double>(type: "REAL", nullable: true),
                    Temperatures = table.Column<string>(type: "TEXT", nullable: true),
                    TimeSeriesMachineMetricsModelId = table.Column<int>(type: "INTEGER", nullable: true),
                    UniqueIdentifier = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiskUsageMetricModel", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DiskUsageMetricModel_Metrics_TimeSeriesMachineMetricsModelId",
                        column: x => x.TimeSeriesMachineMetricsModelId,
                        principalTable: "Metrics",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "GpuUsageMetricModel",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CoreUsagePercentage = table.Column<double>(type: "REAL", nullable: true),
                    VramUsageGB = table.Column<double>(type: "REAL", nullable: true),
                    VramTotalGB = table.Column<double>(type: "REAL", nullable: true),
                    CoreTemperature = table.Column<double>(type: "REAL", nullable: true),
                    PowerDrawWattage = table.Column<double>(type: "REAL", nullable: true),
                    FanPercentage = table.Column<string>(type: "TEXT", nullable: true),
                    TimeSeriesMachineMetricsModelId = table.Column<int>(type: "INTEGER", nullable: true),
                    UniqueIdentifier = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GpuUsageMetricModel", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GpuUsageMetricModel_Metrics_TimeSeriesMachineMetricsModelId",
                        column: x => x.TimeSeriesMachineMetricsModelId,
                        principalTable: "Metrics",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "NetworkUsageMetricModel",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UploadSpeedBps = table.Column<double>(type: "REAL", nullable: true),
                    DownloadSpeedBps = table.Column<double>(type: "REAL", nullable: true),
                    TimeSeriesMachineMetricsModelId = table.Column<int>(type: "INTEGER", nullable: true),
                    UniqueIdentifier = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NetworkUsageMetricModel", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NetworkUsageMetricModel_Metrics_TimeSeriesMachineMetricsModelId",
                        column: x => x.TimeSeriesMachineMetricsModelId,
                        principalTable: "Metrics",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "RamUsageMetricModel",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    FreePhysicalMemory = table.Column<float>(type: "REAL", nullable: true),
                    TotalVisibleMemorySize = table.Column<float>(type: "REAL", nullable: true),
                    TimeSeriesMachineMetricsModelId = table.Column<int>(type: "INTEGER", nullable: true),
                    UniqueIdentifier = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RamUsageMetricModel", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RamUsageMetricModel_Metrics_TimeSeriesMachineMetricsModelId",
                        column: x => x.TimeSeriesMachineMetricsModelId,
                        principalTable: "Metrics",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_CpuUsageMetricModel_TimeSeriesMachineMetricsModelId",
                table: "CpuUsageMetricModel",
                column: "TimeSeriesMachineMetricsModelId");

            migrationBuilder.CreateIndex(
                name: "IX_DiskUsageMetricModel_TimeSeriesMachineMetricsModelId",
                table: "DiskUsageMetricModel",
                column: "TimeSeriesMachineMetricsModelId");

            migrationBuilder.CreateIndex(
                name: "IX_GpuUsageMetricModel_TimeSeriesMachineMetricsModelId",
                table: "GpuUsageMetricModel",
                column: "TimeSeriesMachineMetricsModelId");

            migrationBuilder.CreateIndex(
                name: "IX_Metrics_Id",
                table: "Metrics",
                column: "Id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NetworkUsageMetricModel_TimeSeriesMachineMetricsModelId",
                table: "NetworkUsageMetricModel",
                column: "TimeSeriesMachineMetricsModelId");

            migrationBuilder.CreateIndex(
                name: "IX_RamUsageMetricModel_TimeSeriesMachineMetricsModelId",
                table: "RamUsageMetricModel",
                column: "TimeSeriesMachineMetricsModelId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CpuUsageMetricModel");

            migrationBuilder.DropTable(
                name: "DiskUsageMetricModel");

            migrationBuilder.DropTable(
                name: "GpuUsageMetricModel");

            migrationBuilder.DropTable(
                name: "NetworkUsageMetricModel");

            migrationBuilder.DropTable(
                name: "RamUsageMetricModel");

            migrationBuilder.DropTable(
                name: "Metrics");
        }
    }
}
