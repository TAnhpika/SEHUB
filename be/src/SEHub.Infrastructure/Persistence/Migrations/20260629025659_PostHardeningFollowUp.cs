using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SEHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class PostHardeningFollowUp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_PointTransactions_UserId_Status_CreatedAt",
                table: "PointTransactions",
                columns: new[] { "UserId", "Status", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Documents_DeletedById",
                table: "Documents",
                column: "DeletedById");

            migrationBuilder.AddForeignKey(
                name: "FK_Documents_AspNetUsers_DeletedById",
                table: "Documents",
                column: "DeletedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Documents_AspNetUsers_DeletedById",
                table: "Documents");

            migrationBuilder.DropIndex(
                name: "IX_PointTransactions_UserId_Status_CreatedAt",
                table: "PointTransactions");

            migrationBuilder.DropIndex(
                name: "IX_Documents_DeletedById",
                table: "Documents");
        }
    }
}
