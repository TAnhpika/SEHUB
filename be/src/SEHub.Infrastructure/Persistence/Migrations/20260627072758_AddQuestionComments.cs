using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SEHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddQuestionComments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                CREATE TABLE IF NOT EXISTS "QuestionComments" (
                    "Id" uuid NOT NULL,
                    "ExamId" uuid NOT NULL,
                    "QuestionId" uuid NOT NULL,
                    "AuthorId" uuid NOT NULL,
                    "ParentCommentId" uuid,
                    "Content" character varying(2000) NOT NULL,
                    "IsDeleted" boolean NOT NULL,
                    "DeletedAt" timestamp with time zone,
                    "DeletedById" uuid,
                    "CreatedAt" timestamp with time zone NOT NULL,
                    "UpdatedAt" timestamp with time zone,
                    CONSTRAINT "PK_QuestionComments" PRIMARY KEY ("Id")
                );

                DO $m$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = 'FK_QuestionComments_QuestionComments_ParentCommentId'
                    ) THEN
                        ALTER TABLE "QuestionComments"
                            ADD CONSTRAINT "FK_QuestionComments_QuestionComments_ParentCommentId"
                            FOREIGN KEY ("ParentCommentId") REFERENCES "QuestionComments" ("Id") ON DELETE RESTRICT;
                    END IF;

                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = 'FK_QuestionComments_Questions_QuestionId'
                    ) THEN
                        ALTER TABLE "QuestionComments"
                            ADD CONSTRAINT "FK_QuestionComments_Questions_QuestionId"
                            FOREIGN KEY ("QuestionId") REFERENCES "Questions" ("Id") ON DELETE CASCADE;
                    END IF;
                END $m$;

                CREATE INDEX IF NOT EXISTS "IX_QuestionComments_ExamId_QuestionId"
                    ON "QuestionComments" ("ExamId", "QuestionId");
                CREATE INDEX IF NOT EXISTS "IX_QuestionComments_ParentCommentId"
                    ON "QuestionComments" ("ParentCommentId");
                CREATE INDEX IF NOT EXISTS "IX_QuestionComments_QuestionId"
                    ON "QuestionComments" ("QuestionId");
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "QuestionComments");
        }
    }
}
