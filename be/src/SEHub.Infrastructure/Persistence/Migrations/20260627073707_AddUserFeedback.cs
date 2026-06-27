using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SEHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUserFeedback : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                CREATE TABLE IF NOT EXISTS "UserFeedbacks" (
                    "Id" uuid NOT NULL,
                    "UserId" uuid,
                    "Username" character varying(100) NOT NULL,
                    "Description" character varying(4000) NOT NULL,
                    "Status" integer NOT NULL,
                    "AttachmentUrlsJson" character varying(8000) NOT NULL DEFAULT '[]',
                    "CreatedAt" timestamp with time zone NOT NULL,
                    "UpdatedAt" timestamp with time zone,
                    CONSTRAINT "PK_UserFeedbacks" PRIMARY KEY ("Id")
                );

                CREATE INDEX IF NOT EXISTS "IX_UserFeedbacks_CreatedAt"
                    ON "UserFeedbacks" ("CreatedAt");
                CREATE INDEX IF NOT EXISTS "IX_UserFeedbacks_Status"
                    ON "UserFeedbacks" ("Status");
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserFeedbacks");
        }
    }
}
