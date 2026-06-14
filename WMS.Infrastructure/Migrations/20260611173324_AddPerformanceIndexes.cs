using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "DepartmentId",
                keyValue: 1,
                column: "CreatedOn",
                value: new DateTime(2026, 6, 11, 23, 3, 24, 411, DateTimeKind.Local).AddTicks(1307));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "DepartmentId",
                keyValue: 2,
                column: "CreatedOn",
                value: new DateTime(2026, 6, 11, 23, 3, 24, 411, DateTimeKind.Local).AddTicks(1318));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "DepartmentId",
                keyValue: 3,
                column: "CreatedOn",
                value: new DateTime(2026, 6, 11, 23, 3, 24, 411, DateTimeKind.Local).AddTicks(1319));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "DepartmentId",
                keyValue: 4,
                column: "CreatedOn",
                value: new DateTime(2026, 6, 11, 23, 3, 24, 411, DateTimeKind.Local).AddTicks(1320));

            migrationBuilder.CreateIndex(
                name: "IX_Leaves_Status",
                table: "Leaves",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Employees_Status",
                table: "Employees",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Attendances_AttendanceDate",
                table: "Attendances",
                column: "AttendanceDate");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Leaves_Status",
                table: "Leaves");

            migrationBuilder.DropIndex(
                name: "IX_Employees_Status",
                table: "Employees");

            migrationBuilder.DropIndex(
                name: "IX_Attendances_AttendanceDate",
                table: "Attendances");

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "DepartmentId",
                keyValue: 1,
                column: "CreatedOn",
                value: new DateTime(2026, 6, 10, 15, 2, 52, 198, DateTimeKind.Local).AddTicks(8291));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "DepartmentId",
                keyValue: 2,
                column: "CreatedOn",
                value: new DateTime(2026, 6, 10, 15, 2, 52, 198, DateTimeKind.Local).AddTicks(8303));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "DepartmentId",
                keyValue: 3,
                column: "CreatedOn",
                value: new DateTime(2026, 6, 10, 15, 2, 52, 198, DateTimeKind.Local).AddTicks(8304));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "DepartmentId",
                keyValue: 4,
                column: "CreatedOn",
                value: new DateTime(2026, 6, 10, 15, 2, 52, 198, DateTimeKind.Local).AddTicks(8305));
        }
    }
}
