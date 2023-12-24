using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VitalService.Migrations.MetricDb
{
    /// <inheritdoc />
    public partial class change1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "TotalSpaceBytes",
                table: "DiskUsageMetricModel",
                type: "INTEGER",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TotalSpaceBytes",
                table: "DiskUsageMetricModel");
        }
    }
}
