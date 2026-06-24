using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SEHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class StorageHardening : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AvatarPublicId",
                table: "UserProfiles",
                type: "character varying(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Content",
                table: "Questions",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(4000)",
                oldMaxLength: 4000);

            migrationBuilder.AlterColumn<string>(
                name: "Text",
                table: "QuestionOptions",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(2000)",
                oldMaxLength: 2000);

            migrationBuilder.AddColumn<string>(
                name: "AttachmentPublicId",
                table: "Messages",
                type: "character varying(256)",
                maxLength: 256,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvatarPublicId",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "AttachmentPublicId",
                table: "Messages");

            migrationBuilder.AlterColumn<string>(
                name: "Content",
                table: "Questions",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Text",
                table: "QuestionOptions",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");
        }
    }
}
