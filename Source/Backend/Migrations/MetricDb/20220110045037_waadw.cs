using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VitalService.Migrations.MetricDb
{
    public partial class waadw : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RamUsageMetricModel_Metrics_TimeSeriesMachineMetricsModelId",
                table: "RamUsageMetricModel");

            migrationBuilder.DropIndex(
                name: "IX_RamUsageMetricModel_TimeSeriesMachineMetricsModelId",
                table: "RamUsageMetricModel");

            migrationBuilder.DropColumn(
                name: "TimeSeriesMachineMetricsModelId",
                table: "RamUsageMetricModel");

            migrationBuilder.AlterColumn<long>(
                name: "UploadSpeedBps",
                table: "NetworkUsageMetricModel",
                type: "INTEGER",
                nullable: true,
                oldClrType: typeof(double),
                oldType: "REAL",
                oldNullable: true);

            migrationBuilder.AlterColumn<long>(
                name: "DownloadSpeedBps",
                table: "NetworkUsageMetricModel",
                type: "INTEGER",
                nullable: true,
                oldClrType: typeof(double),
                oldType: "REAL",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RamUsageDataId",
                table: "Metrics",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Metrics_RamUsageDataId",
                table: "Metrics",
                column: "RamUsageDataId");

            migrationBuilder.AddForeignKey(
                name: "FK_Metrics_RamUsageMetricModel_RamUsageDataId",
                table: "Metrics",
                column: "RamUsageDataId",
                principalTable: "RamUsageMetricModel",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Metrics_RamUsageMetricModel_RamUsageDataId",
                table: "Metrics");

            migrationBuilder.DropIndex(
                name: "IX_Metrics_RamUsageDataId",
                table: "Metrics");

            migrationBuilder.DropColumn(
                name: "RamUsageDataId",
                table: "Metrics");

            migrationBuilder.AddColumn<int>(
                name: "TimeSeriesMachineMetricsModelId",
                table: "RamUsageMetricModel",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AlterColumn<double>(
                name: "UploadSpeedBps",
                table: "NetworkUsageMetricModel",
                type: "REAL",
                nullable: true,
                oldClrType: typeof(long),
                oldType: "INTEGER",
                oldNullable: true);

            migrationBuilder.AlterColumn<double>(
                name: "DownloadSpeedBps",
                table: "NetworkUsageMetricModel",
                type: "REAL",
                nullable: true,
                oldClrType: typeof(long),
                oldType: "INTEGER",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_RamUsageMetricModel_TimeSeriesMachineMetricsModelId",
                table: "RamUsageMetricModel",
                column: "TimeSeriesMachineMetricsModelId");

            migrationBuilder.AddForeignKey(
                name: "FK_RamUsageMetricModel_Metrics_TimeSeriesMachineMetricsModelId",
                table: "RamUsageMetricModel",
                column: "TimeSeriesMachineMetricsModelId",
                principalTable: "Metrics",
                principalColumn: "Id");
        }
    }
}
