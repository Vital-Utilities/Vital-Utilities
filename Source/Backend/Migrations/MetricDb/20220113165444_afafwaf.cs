using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VitalService.Migrations.MetricDb
{
    public partial class afafwaf : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "TotalVisibleMemorySize",
                table: "RamUsageMetricModel",
                newName: "UsedMemoryBytes");

            migrationBuilder.RenameColumn(
                name: "FreePhysicalMemory",
                table: "RamUsageMetricModel",
                newName: "TotalVisibleMemoryBytes");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "UsedMemoryBytes",
                table: "RamUsageMetricModel",
                newName: "TotalVisibleMemorySize");

            migrationBuilder.RenameColumn(
                name: "TotalVisibleMemoryBytes",
                table: "RamUsageMetricModel",
                newName: "FreePhysicalMemory");
        }
    }
}
