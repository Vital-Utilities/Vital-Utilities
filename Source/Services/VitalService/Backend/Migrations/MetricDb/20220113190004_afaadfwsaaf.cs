using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VitalService.Migrations.MetricDb
{
    public partial class afaadfwsaaf : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CoreClocksMhz",
                table: "CpuUsageMetricModel",
                type: "TEXT",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CoreClocksMhz",
                table: "CpuUsageMetricModel");
        }
    }
}
