using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SEHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class DatabaseCleanupRefactor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE "Posts" DROP COLUMN IF EXISTS "Tags";

                UPDATE "DocumentCategories" c
                SET "SubjectCode" = s."Code"
                FROM "Subjects" s
                WHERE (c."SubjectCode" IS NULL OR trim(c."SubjectCode") = '')
                  AND upper(c."Name") = upper(s."Name");

                UPDATE "DocumentCategories"
                SET "SubjectCode" = 'PRF192'
                WHERE "SubjectCode" IS NULL OR trim("SubjectCode") = '';
                """);

            migrationBuilder.DropForeignKey(
                name: "FK_Exams_Subjects_Code",
                table: "Exams");

            migrationBuilder.DropIndex(
                name: "IX_DocumentCategories_Semester_Major",
                table: "DocumentCategories");

            migrationBuilder.DropIndex(
                name: "IX_DocumentCategories_SubjectCode",
                table: "DocumentCategories");

            migrationBuilder.DropColumn(
                name: "CoverImageUrl",
                table: "Posts");

            migrationBuilder.DropColumn(
                name: "AssetUrl",
                table: "Exams");

            migrationBuilder.DropColumn(
                name: "Major",
                table: "Exams");

            migrationBuilder.DropColumn(
                name: "QuestionCount",
                table: "Exams");

            migrationBuilder.DropColumn(
                name: "Semester",
                table: "Exams");

            migrationBuilder.DropColumn(
                name: "FilePath",
                table: "Documents");

            migrationBuilder.DropColumn(
                name: "Major",
                table: "DocumentCategories");

            migrationBuilder.DropColumn(
                name: "Semester",
                table: "DocumentCategories");

            migrationBuilder.RenameColumn(
                name: "Title",
                table: "Exams",
                newName: "PaperCode");

            migrationBuilder.RenameColumn(
                name: "Code",
                table: "Exams",
                newName: "SubjectCode");

            migrationBuilder.RenameIndex(
                name: "IX_Exams_Title",
                table: "Exams",
                newName: "IX_Exams_PaperCode");

            migrationBuilder.RenameIndex(
                name: "IX_Exams_Code_Status_ExamType",
                table: "Exams",
                newName: "IX_Exams_SubjectCode_Status_ExamType");

            migrationBuilder.RenameIndex(
                name: "IX_Exams_Code_ExamType_IsPinned",
                table: "Exams",
                newName: "IX_Exams_SubjectCode_ExamType_IsPinned");

            migrationBuilder.AlterColumn<string>(
                name: "SubjectCode",
                table: "DocumentCategories",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_DocumentCategories_SubjectCode",
                table: "DocumentCategories",
                column: "SubjectCode",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Exams_Subjects_SubjectCode",
                table: "Exams",
                column: "SubjectCode",
                principalTable: "Subjects",
                principalColumn: "Code",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Exams_Subjects_SubjectCode",
                table: "Exams");

            migrationBuilder.DropIndex(
                name: "IX_DocumentCategories_SubjectCode",
                table: "DocumentCategories");

            migrationBuilder.RenameColumn(
                name: "SubjectCode",
                table: "Exams",
                newName: "Code");

            migrationBuilder.RenameColumn(
                name: "PaperCode",
                table: "Exams",
                newName: "Title");

            migrationBuilder.RenameIndex(
                name: "IX_Exams_SubjectCode_Status_ExamType",
                table: "Exams",
                newName: "IX_Exams_Code_Status_ExamType");

            migrationBuilder.RenameIndex(
                name: "IX_Exams_SubjectCode_ExamType_IsPinned",
                table: "Exams",
                newName: "IX_Exams_Code_ExamType_IsPinned");

            migrationBuilder.RenameIndex(
                name: "IX_Exams_PaperCode",
                table: "Exams",
                newName: "IX_Exams_Title");

            migrationBuilder.AddColumn<string>(
                name: "CoverImageUrl",
                table: "Posts",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AssetUrl",
                table: "Exams",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Major",
                table: "Exams",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "QuestionCount",
                table: "Exams",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Semester",
                table: "Exams",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "FilePath",
                table: "Documents",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "SubjectCode",
                table: "DocumentCategories",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20);

            migrationBuilder.AddColumn<string>(
                name: "Major",
                table: "DocumentCategories",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Semester",
                table: "DocumentCategories",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_DocumentCategories_Semester_Major",
                table: "DocumentCategories",
                columns: new[] { "Semester", "Major" });

            migrationBuilder.CreateIndex(
                name: "IX_DocumentCategories_SubjectCode",
                table: "DocumentCategories",
                column: "SubjectCode");

            migrationBuilder.AddForeignKey(
                name: "FK_Exams_Subjects_Code",
                table: "Exams",
                column: "Code",
                principalTable: "Subjects",
                principalColumn: "Code",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
