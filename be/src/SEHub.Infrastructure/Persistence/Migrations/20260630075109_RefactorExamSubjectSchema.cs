using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SEHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RefactorExamSubjectSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Exams_Major_Code",
                table: "Exams");

            migrationBuilder.DropIndex(
                name: "IX_Exams_Major_Status_ExamType",
                table: "Exams");

            migrationBuilder.Sql(
                """
                UPDATE "Exams"
                SET
                    "Title" = CASE
                        WHEN "Title" ~ '^(FE|PE)-'
                            OR "Title" LIKE '%-FINAL-%'
                            OR "Title" LIKE '%-LAB-%'
                            OR "Title" LIKE 'MOD-%'
                            OR "Title" LIKE '%-Rev%'
                            THEN LEFT("Title", 100)
                        ELSE LEFT("Code", 100)
                    END,
                    "Code" = UPPER((regexp_match("Code", '[A-Za-z]{3}[0-9]{3}[Cc]?'))[1])
                WHERE length("Code") > 7
                  AND (
                    "Code" ILIKE 'FE-%'
                    OR "Code" ILIKE 'PE-%'
                    OR "Code" ILIKE 'MOD-%'
                    OR "Code" LIKE '%-FINAL-%'
                    OR "Code" LIKE '%-LAB-%'
                    OR "Code" LIKE '%-Rev%'
                    OR "Code" LIKE '%-ARCH-%'
                    OR "Code" LIKE '%-DEL-%'
                    OR strpos("Code", '_') > 0
                  )
                  AND (regexp_match("Code", '[A-Za-z]{3}[0-9]{3}[Cc]?')) IS NOT NULL;
                """);

            migrationBuilder.Sql(
                """
                UPDATE "Exams"
                SET "Code" = UPPER((regexp_match("Code", '[A-Za-z]{3}[0-9]{3}[Cc]?'))[1])
                WHERE length("Code") > 20
                  AND (regexp_match("Code", '[A-Za-z]{3}[0-9]{3}[Cc]?')) IS NOT NULL;
                """);

            migrationBuilder.Sql(
                """
                WITH ranked AS (
                    SELECT "Id", "Title",
                        ROW_NUMBER() OVER (PARTITION BY "Title" ORDER BY "CreatedAt", "Id") AS rn
                    FROM "Exams"
                )
                UPDATE "Exams" AS e
                SET "Title" = LEFT(e."Title", 88) || '-DUP-' || SUBSTRING(e."Id"::text, 1, 8)
                FROM ranked AS r
                WHERE e."Id" = r."Id" AND r.rn > 1;
                """);

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "Exams",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200);

            migrationBuilder.AlterColumn<string>(
                name: "Code",
                table: "Exams",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.CreateIndex(
                name: "IX_Exams_Code_Status_ExamType",
                table: "Exams",
                columns: new[] { "Code", "Status", "ExamType" });

            migrationBuilder.CreateIndex(
                name: "IX_Exams_Title",
                table: "Exams",
                column: "Title",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Exams_Code_Status_ExamType",
                table: "Exams");

            migrationBuilder.DropIndex(
                name: "IX_Exams_Title",
                table: "Exams");

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "Exams",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "Code",
                table: "Exams",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20);

            migrationBuilder.CreateIndex(
                name: "IX_Exams_Major_Code",
                table: "Exams",
                columns: new[] { "Major", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Exams_Major_Status_ExamType",
                table: "Exams",
                columns: new[] { "Major", "Status", "ExamType" });
        }
    }
}
