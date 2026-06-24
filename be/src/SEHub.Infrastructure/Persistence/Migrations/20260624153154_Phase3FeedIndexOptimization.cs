using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SEHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase3FeedIndexOptimization : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_UserProfiles_Major_Semester",
                table: "UserProfiles",
                columns: new[] { "Major", "Semester" });

            migrationBuilder.CreateIndex(
                name: "IX_Posts_Status_AuthorId_CreatedAt",
                table: "Posts",
                columns: new[] { "Status", "AuthorId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_PostReports_Status_CreatedAt",
                table: "PostReports",
                columns: new[] { "Status", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserProfiles_Major_Semester",
                table: "UserProfiles");

            migrationBuilder.DropIndex(
                name: "IX_Posts_Status_AuthorId_CreatedAt",
                table: "Posts");

            migrationBuilder.DropIndex(
                name: "IX_PostReports_Status_CreatedAt",
                table: "PostReports");
        }
    }
}
