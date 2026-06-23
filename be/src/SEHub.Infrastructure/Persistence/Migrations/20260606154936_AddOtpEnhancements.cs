using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SEHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOtpEnhancements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsUsed",
                table: "OtpVerifications",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                table: "OtpVerifications",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_OtpVerifications_Phone_Purpose",
                table: "OtpVerifications",
                columns: new[] { "Phone", "Purpose" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_OtpVerifications_Phone_Purpose",
                table: "OtpVerifications");

            migrationBuilder.DropColumn(
                name: "IsUsed",
                table: "OtpVerifications");

            migrationBuilder.DropColumn(
                name: "Phone",
                table: "OtpVerifications");
        }
    }
}
