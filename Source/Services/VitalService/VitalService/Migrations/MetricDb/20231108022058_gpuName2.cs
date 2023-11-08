using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VitalService.Migrations.MetricDb
{
    /// <inheritdoc />
    public partial class gpuName2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "GpuUsageMetricModel",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Name",
                table: "GpuUsageMetricModel");
        }
    }
}
