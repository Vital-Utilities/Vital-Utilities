using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VitalService.Migrations.MetricDb
{
    public partial class afaadfwaf : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "VramUsageGB",
                table: "GpuUsageMetricModel",
                newName: "VramUsageBytes");

            migrationBuilder.RenameColumn(
                name: "VramTotalGB",
                table: "GpuUsageMetricModel",
                newName: "VramTotalBytes");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "VramUsageBytes",
                table: "GpuUsageMetricModel",
                newName: "VramUsageGB");

            migrationBuilder.RenameColumn(
                name: "VramTotalBytes",
                table: "GpuUsageMetricModel",
                newName: "VramTotalGB");
        }
    }
}
