using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SEHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSubjectsCatalog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SubjectCode",
                table: "DocumentCategories",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Subjects",
                columns: table => new
                {
                    Code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Semester = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Subjects", x => x.Code);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DocumentCategories_SubjectCode",
                table: "DocumentCategories",
                column: "SubjectCode");

            migrationBuilder.CreateIndex(
                name: "IX_Subjects_DisplayOrder",
                table: "Subjects",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_Subjects_Semester",
                table: "Subjects",
                column: "Semester");

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentCategories_Subjects_SubjectCode",
                table: "DocumentCategories",
                column: "SubjectCode",
                principalTable: "Subjects",
                principalColumn: "Code",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DocumentCategories_Subjects_SubjectCode",
                table: "DocumentCategories");

            migrationBuilder.DropTable(
                name: "Subjects");

            migrationBuilder.DropIndex(
                name: "IX_DocumentCategories_SubjectCode",
                table: "DocumentCategories");

            migrationBuilder.DropColumn(
                name: "SubjectCode",
                table: "DocumentCategories");
        }
    }
}
