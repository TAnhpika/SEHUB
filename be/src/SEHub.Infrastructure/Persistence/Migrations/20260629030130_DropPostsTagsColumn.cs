using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SEHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class DropPostsTagsColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Tags",
                table: "Posts");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Tags",
                table: "Posts",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: false,
                defaultValue: "");
        }
    }
}
