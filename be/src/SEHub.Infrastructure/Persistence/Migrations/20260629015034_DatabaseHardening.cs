using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SEHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class DatabaseHardening : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ViolationEscalations_UserId",
                table: "ViolationEscalations");

            migrationBuilder.DropIndex(
                name: "IX_Exams_Code",
                table: "Exams");

            migrationBuilder.DropIndex(
                name: "IX_Exams_Semester_Major_ExamType",
                table: "Exams");

            migrationBuilder.AlterColumn<string>(
                name: "AnswersJson",
                table: "ExamAttempts",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(8000)",
                oldMaxLength: 8000);

            migrationBuilder.Sql(
                """
                DROP INDEX IF EXISTS "IX_ConversationReports_ConversationId_ReporterId_Status";
                ALTER TABLE "ConversationReports"
                    ALTER COLUMN "Status" TYPE integer
                    USING (
                        CASE
                            WHEN "Status" ~ '^[0-9]+$' THEN "Status"::integer
                            WHEN lower("Status") = 'pending' THEN 0
                            WHEN lower("Status") = 'approved' THEN 1
                            WHEN lower("Status") = 'rejected' THEN 2
                            WHEN lower("Status") = 'resolved' THEN 3
                            ELSE 0
                        END
                    );
                CREATE INDEX "IX_ConversationReports_ConversationId_ReporterId_Status"
                    ON "ConversationReports" ("ConversationId", "ReporterId", "Status");
                """);

            migrationBuilder.CreateTable(
                name: "QuestionAttachments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    QuestionId = table.Column<Guid>(type: "uuid", nullable: false),
                    PublicId = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Url = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestionAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuestionAttachments_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "Questions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Tags",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Slug = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tags", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserMissionProgress",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    MissionCode = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    PeriodKey = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ProgressCount = table.Column<int>(type: "integer", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ClaimedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserMissionProgress", x => new { x.UserId, x.MissionCode, x.PeriodKey });
                    table.ForeignKey(
                        name: "FK_UserMissionProgress_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PostTags",
                columns: table => new
                {
                    PostId = table.Column<Guid>(type: "uuid", nullable: false),
                    TagId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PostTags", x => new { x.PostId, x.TagId });
                    table.ForeignKey(
                        name: "FK_PostTags_Posts_PostId",
                        column: x => x.PostId,
                        principalTable: "Posts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PostTags_Tags_TagId",
                        column: x => x.TagId,
                        principalTable: "Tags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ViolationEscalations_EscalatedById",
                table: "ViolationEscalations",
                column: "EscalatedById");

            migrationBuilder.CreateIndex(
                name: "IX_ViolationEscalations_UserId_CreatedAt",
                table: "ViolationEscalations",
                columns: new[] { "UserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_UserReports_ExamId",
                table: "UserReports",
                column: "ExamId");

            migrationBuilder.CreateIndex(
                name: "IX_UserReports_PostId",
                table: "UserReports",
                column: "PostId");

            migrationBuilder.CreateIndex(
                name: "IX_UserReports_QuestionCommentId",
                table: "UserReports",
                column: "QuestionCommentId");

            migrationBuilder.CreateIndex(
                name: "IX_UserReports_QuestionId",
                table: "UserReports",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_UserReports_ReporterId",
                table: "UserReports",
                column: "ReporterId");

            migrationBuilder.CreateIndex(
                name: "IX_UserReports_ResolvedById",
                table: "UserReports",
                column: "ResolvedById");

            migrationBuilder.AddCheckConstraint(
                name: "CK_UserReports_Source_Context",
                table: "UserReports",
                sql: "(\"Source\" = 0 AND \"PostId\" IS NOT NULL AND \"ExamId\" IS NULL AND \"QuestionId\" IS NULL AND \"QuestionCommentId\" IS NULL)\r\nOR (\"Source\" = 1 AND \"PostId\" IS NULL AND \"ExamId\" IS NOT NULL AND \"QuestionId\" IS NOT NULL AND \"QuestionCommentId\" IS NOT NULL)\r\nOR (\"Source\" = 2 AND \"PostId\" IS NULL AND \"ExamId\" IS NULL AND \"QuestionId\" IS NULL AND \"QuestionCommentId\" IS NULL)");

            migrationBuilder.CreateIndex(
                name: "IX_UserFeedbacks_UserId",
                table: "UserFeedbacks",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserBans_ActorId",
                table: "UserBans",
                column: "ActorId");

            migrationBuilder.CreateIndex(
                name: "IX_UserBans_UserId_CreatedAt",
                table: "UserBans",
                columns: new[] { "UserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_QuestionReports_ReporterId",
                table: "QuestionReports",
                column: "ReporterId");

            migrationBuilder.CreateIndex(
                name: "IX_QuestionReports_ResolvedById",
                table: "QuestionReports",
                column: "ResolvedById");

            migrationBuilder.CreateIndex(
                name: "IX_QuestionComments_AuthorId",
                table: "QuestionComments",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_QuestionComments_DeletedById",
                table: "QuestionComments",
                column: "DeletedById");

            migrationBuilder.CreateIndex(
                name: "IX_PracticeSubmissions_ReviewedById",
                table: "PracticeSubmissions",
                column: "ReviewedById");

            migrationBuilder.CreateIndex(
                name: "IX_PracticeSubmissions_UserId",
                table: "PracticeSubmissions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Posts_AuthorId",
                table: "Posts",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_Posts_DeletedById",
                table: "Posts",
                column: "DeletedById");

            migrationBuilder.CreateIndex(
                name: "IX_Posts_ModeratedById",
                table: "Posts",
                column: "ModeratedById");

            migrationBuilder.CreateIndex(
                name: "IX_PostReports_ReporterId",
                table: "PostReports",
                column: "ReporterId");

            migrationBuilder.CreateIndex(
                name: "IX_PostReports_ResolvedById",
                table: "PostReports",
                column: "ResolvedById");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentOrders_UserId_Status",
                table: "PaymentOrders",
                columns: new[] { "UserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Exams_ContentHash",
                table: "Exams",
                column: "ContentHash");

            migrationBuilder.CreateIndex(
                name: "IX_Exams_Major_Code",
                table: "Exams",
                columns: new[] { "Major", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Exams_Major_Status_ExamType",
                table: "Exams",
                columns: new[] { "Major", "Status", "ExamType" });

            migrationBuilder.CreateIndex(
                name: "IX_Exams_RejectedById",
                table: "Exams",
                column: "RejectedById");

            migrationBuilder.CreateIndex(
                name: "IX_ConversationReports_ResolvedById",
                table: "ConversationReports",
                column: "ResolvedById");

            migrationBuilder.CreateIndex(
                name: "IX_Comments_AuthorId",
                table: "Comments",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_Comments_DeletedById",
                table: "Comments",
                column: "DeletedById");

            migrationBuilder.CreateIndex(
                name: "IX_CommentReports_ReporterId",
                table: "CommentReports",
                column: "ReporterId");

            migrationBuilder.CreateIndex(
                name: "IX_CommentReports_ResolvedById",
                table: "CommentReports",
                column: "ResolvedById");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_Points",
                table: "AspNetUsers",
                column: "Points");

            migrationBuilder.CreateIndex(
                name: "IX_AiExamChatThreads_ExamId",
                table: "AiExamChatThreads",
                column: "ExamId");

            migrationBuilder.CreateIndex(
                name: "IX_AiExamChatThreads_QuestionId",
                table: "AiExamChatThreads",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_PostTags_TagId",
                table: "PostTags",
                column: "TagId");

            migrationBuilder.CreateIndex(
                name: "IX_QuestionAttachments_QuestionId_SortOrder",
                table: "QuestionAttachments",
                columns: new[] { "QuestionId", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_Tags_Name",
                table: "Tags",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tags_Slug",
                table: "Tags",
                column: "Slug",
                unique: true);

            migrationBuilder.Sql(
                """
                INSERT INTO "Tags" ("Id", "Name", "Slug", "CreatedAt")
                SELECT DISTINCT ON (slug) gen_random_uuid(), name, slug, NOW() AT TIME ZONE 'UTC'
                FROM (
                    SELECT
                        trim(both '#' from trim(raw_tag)) AS name,
                        COALESCE(
                            NULLIF(trim(both '-' FROM regexp_replace(lower(trim(both '#' from trim(raw_tag))), '[^a-z0-9]+', '-', 'g')), ''),
                            'tag') AS slug
                    FROM "Posts" p
                    CROSS JOIN LATERAL unnest(string_to_array(p."Tags", ',')) AS raw_tag
                    WHERE p."Tags" IS NOT NULL AND trim(p."Tags") <> '' AND trim(raw_tag) <> ''
                ) normalized
                ON CONFLICT ("Slug") DO NOTHING;

                INSERT INTO "PostTags" ("PostId", "TagId")
                SELECT DISTINCT p."Id", t."Id"
                FROM "Posts" p
                CROSS JOIN LATERAL unnest(string_to_array(p."Tags", ',')) AS raw_tag
                JOIN "Tags" t ON t."Slug" = COALESCE(
                    NULLIF(trim(both '-' FROM regexp_replace(lower(trim(both '#' from trim(raw_tag))), '[^a-z0-9]+', '-', 'g')), ''),
                    'tag')
                WHERE p."Tags" IS NOT NULL AND trim(p."Tags") <> '' AND trim(raw_tag) <> ''
                ON CONFLICT ("PostId", "TagId") DO NOTHING;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_UserMissionProgress_UserId_PeriodKey",
                table: "UserMissionProgress",
                columns: new[] { "UserId", "PeriodKey" });

            migrationBuilder.AddForeignKey(
                name: "FK_AiExamChatThreads_AspNetUsers_UserId",
                table: "AiExamChatThreads",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_AiExamChatThreads_Exams_ExamId",
                table: "AiExamChatThreads",
                column: "ExamId",
                principalTable: "Exams",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_AiExamChatThreads_Questions_QuestionId",
                table: "AiExamChatThreads",
                column: "QuestionId",
                principalTable: "Questions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ChatbotConversations_AspNetUsers_UserId",
                table: "ChatbotConversations",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_CommentReports_AspNetUsers_ReporterId",
                table: "CommentReports",
                column: "ReporterId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_CommentReports_AspNetUsers_ResolvedById",
                table: "CommentReports",
                column: "ResolvedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Comments_AspNetUsers_AuthorId",
                table: "Comments",
                column: "AuthorId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Comments_AspNetUsers_DeletedById",
                table: "Comments",
                column: "DeletedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_ConversationReports_AspNetUsers_ResolvedById",
                table: "ConversationReports",
                column: "ResolvedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_DocumentAccessLogs_AspNetUsers_UserId",
                table: "DocumentAccessLogs",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ExamAttempts_AspNetUsers_UserId",
                table: "ExamAttempts",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Exams_AspNetUsers_RejectedById",
                table: "Exams",
                column: "RejectedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Exams_AspNetUsers_SubmittedById",
                table: "Exams",
                column: "SubmittedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_PaymentOrders_AspNetUsers_UserId",
                table: "PaymentOrders",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PointTransactions_AspNetUsers_UserId",
                table: "PointTransactions",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PostLikes_AspNetUsers_UserId",
                table: "PostLikes",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PostReports_AspNetUsers_ReporterId",
                table: "PostReports",
                column: "ReporterId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PostReports_AspNetUsers_ResolvedById",
                table: "PostReports",
                column: "ResolvedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Posts_AspNetUsers_AuthorId",
                table: "Posts",
                column: "AuthorId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Posts_AspNetUsers_DeletedById",
                table: "Posts",
                column: "DeletedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Posts_AspNetUsers_ModeratedById",
                table: "Posts",
                column: "ModeratedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_PracticeSubmissions_AspNetUsers_ReviewedById",
                table: "PracticeSubmissions",
                column: "ReviewedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_PracticeSubmissions_AspNetUsers_UserId",
                table: "PracticeSubmissions",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_QuestionComments_AspNetUsers_AuthorId",
                table: "QuestionComments",
                column: "AuthorId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_QuestionComments_AspNetUsers_DeletedById",
                table: "QuestionComments",
                column: "DeletedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_QuestionComments_Exams_ExamId",
                table: "QuestionComments",
                column: "ExamId",
                principalTable: "Exams",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_QuestionReports_AspNetUsers_ReporterId",
                table: "QuestionReports",
                column: "ReporterId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_QuestionReports_AspNetUsers_ResolvedById",
                table: "QuestionReports",
                column: "ResolvedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_RankRewardVouchers_AspNetUsers_UserId",
                table: "RankRewardVouchers",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_RefreshTokens_AspNetUsers_UserId",
                table: "RefreshTokens",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Subscriptions_AspNetUsers_UserId",
                table: "Subscriptions",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_UserBadges_AspNetUsers_UserId",
                table: "UserBadges",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_UserBans_AspNetUsers_ActorId",
                table: "UserBans",
                column: "ActorId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_UserBans_AspNetUsers_UserId",
                table: "UserBans",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_UserDailyActivities_AspNetUsers_UserId",
                table: "UserDailyActivities",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_UserFeedbacks_AspNetUsers_UserId",
                table: "UserFeedbacks",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_UserLevelHistories_AspNetUsers_UserId",
                table: "UserLevelHistories",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_UserReports_AspNetUsers_ReportedUserId",
                table: "UserReports",
                column: "ReportedUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_UserReports_AspNetUsers_ReporterId",
                table: "UserReports",
                column: "ReporterId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_UserReports_AspNetUsers_ResolvedById",
                table: "UserReports",
                column: "ResolvedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_UserReports_Exams_ExamId",
                table: "UserReports",
                column: "ExamId",
                principalTable: "Exams",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_UserReports_Posts_PostId",
                table: "UserReports",
                column: "PostId",
                principalTable: "Posts",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_UserReports_QuestionComments_QuestionCommentId",
                table: "UserReports",
                column: "QuestionCommentId",
                principalTable: "QuestionComments",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_UserReports_Questions_QuestionId",
                table: "UserReports",
                column: "QuestionId",
                principalTable: "Questions",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_ViolationEscalations_AspNetUsers_EscalatedById",
                table: "ViolationEscalations",
                column: "EscalatedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ViolationEscalations_AspNetUsers_UserId",
                table: "ViolationEscalations",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AiExamChatThreads_AspNetUsers_UserId",
                table: "AiExamChatThreads");

            migrationBuilder.DropForeignKey(
                name: "FK_AiExamChatThreads_Exams_ExamId",
                table: "AiExamChatThreads");

            migrationBuilder.DropForeignKey(
                name: "FK_AiExamChatThreads_Questions_QuestionId",
                table: "AiExamChatThreads");

            migrationBuilder.DropForeignKey(
                name: "FK_ChatbotConversations_AspNetUsers_UserId",
                table: "ChatbotConversations");

            migrationBuilder.DropForeignKey(
                name: "FK_CommentReports_AspNetUsers_ReporterId",
                table: "CommentReports");

            migrationBuilder.DropForeignKey(
                name: "FK_CommentReports_AspNetUsers_ResolvedById",
                table: "CommentReports");

            migrationBuilder.DropForeignKey(
                name: "FK_Comments_AspNetUsers_AuthorId",
                table: "Comments");

            migrationBuilder.DropForeignKey(
                name: "FK_Comments_AspNetUsers_DeletedById",
                table: "Comments");

            migrationBuilder.DropForeignKey(
                name: "FK_ConversationReports_AspNetUsers_ResolvedById",
                table: "ConversationReports");

            migrationBuilder.DropForeignKey(
                name: "FK_DocumentAccessLogs_AspNetUsers_UserId",
                table: "DocumentAccessLogs");

            migrationBuilder.DropForeignKey(
                name: "FK_ExamAttempts_AspNetUsers_UserId",
                table: "ExamAttempts");

            migrationBuilder.DropForeignKey(
                name: "FK_Exams_AspNetUsers_RejectedById",
                table: "Exams");

            migrationBuilder.DropForeignKey(
                name: "FK_Exams_AspNetUsers_SubmittedById",
                table: "Exams");

            migrationBuilder.DropForeignKey(
                name: "FK_PaymentOrders_AspNetUsers_UserId",
                table: "PaymentOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_PointTransactions_AspNetUsers_UserId",
                table: "PointTransactions");

            migrationBuilder.DropForeignKey(
                name: "FK_PostLikes_AspNetUsers_UserId",
                table: "PostLikes");

            migrationBuilder.DropForeignKey(
                name: "FK_PostReports_AspNetUsers_ReporterId",
                table: "PostReports");

            migrationBuilder.DropForeignKey(
                name: "FK_PostReports_AspNetUsers_ResolvedById",
                table: "PostReports");

            migrationBuilder.DropForeignKey(
                name: "FK_Posts_AspNetUsers_AuthorId",
                table: "Posts");

            migrationBuilder.DropForeignKey(
                name: "FK_Posts_AspNetUsers_DeletedById",
                table: "Posts");

            migrationBuilder.DropForeignKey(
                name: "FK_Posts_AspNetUsers_ModeratedById",
                table: "Posts");

            migrationBuilder.DropForeignKey(
                name: "FK_PracticeSubmissions_AspNetUsers_ReviewedById",
                table: "PracticeSubmissions");

            migrationBuilder.DropForeignKey(
                name: "FK_PracticeSubmissions_AspNetUsers_UserId",
                table: "PracticeSubmissions");

            migrationBuilder.DropForeignKey(
                name: "FK_QuestionComments_AspNetUsers_AuthorId",
                table: "QuestionComments");

            migrationBuilder.DropForeignKey(
                name: "FK_QuestionComments_AspNetUsers_DeletedById",
                table: "QuestionComments");

            migrationBuilder.DropForeignKey(
                name: "FK_QuestionComments_Exams_ExamId",
                table: "QuestionComments");

            migrationBuilder.DropForeignKey(
                name: "FK_QuestionReports_AspNetUsers_ReporterId",
                table: "QuestionReports");

            migrationBuilder.DropForeignKey(
                name: "FK_QuestionReports_AspNetUsers_ResolvedById",
                table: "QuestionReports");

            migrationBuilder.DropForeignKey(
                name: "FK_RankRewardVouchers_AspNetUsers_UserId",
                table: "RankRewardVouchers");

            migrationBuilder.DropForeignKey(
                name: "FK_RefreshTokens_AspNetUsers_UserId",
                table: "RefreshTokens");

            migrationBuilder.DropForeignKey(
                name: "FK_Subscriptions_AspNetUsers_UserId",
                table: "Subscriptions");

            migrationBuilder.DropForeignKey(
                name: "FK_UserBadges_AspNetUsers_UserId",
                table: "UserBadges");

            migrationBuilder.DropForeignKey(
                name: "FK_UserBans_AspNetUsers_ActorId",
                table: "UserBans");

            migrationBuilder.DropForeignKey(
                name: "FK_UserBans_AspNetUsers_UserId",
                table: "UserBans");

            migrationBuilder.DropForeignKey(
                name: "FK_UserDailyActivities_AspNetUsers_UserId",
                table: "UserDailyActivities");

            migrationBuilder.DropForeignKey(
                name: "FK_UserFeedbacks_AspNetUsers_UserId",
                table: "UserFeedbacks");

            migrationBuilder.DropForeignKey(
                name: "FK_UserLevelHistories_AspNetUsers_UserId",
                table: "UserLevelHistories");

            migrationBuilder.DropForeignKey(
                name: "FK_UserReports_AspNetUsers_ReportedUserId",
                table: "UserReports");

            migrationBuilder.DropForeignKey(
                name: "FK_UserReports_AspNetUsers_ReporterId",
                table: "UserReports");

            migrationBuilder.DropForeignKey(
                name: "FK_UserReports_AspNetUsers_ResolvedById",
                table: "UserReports");

            migrationBuilder.DropForeignKey(
                name: "FK_UserReports_Exams_ExamId",
                table: "UserReports");

            migrationBuilder.DropForeignKey(
                name: "FK_UserReports_Posts_PostId",
                table: "UserReports");

            migrationBuilder.DropForeignKey(
                name: "FK_UserReports_QuestionComments_QuestionCommentId",
                table: "UserReports");

            migrationBuilder.DropForeignKey(
                name: "FK_UserReports_Questions_QuestionId",
                table: "UserReports");

            migrationBuilder.DropForeignKey(
                name: "FK_ViolationEscalations_AspNetUsers_EscalatedById",
                table: "ViolationEscalations");

            migrationBuilder.DropForeignKey(
                name: "FK_ViolationEscalations_AspNetUsers_UserId",
                table: "ViolationEscalations");

            migrationBuilder.DropTable(
                name: "PostTags");

            migrationBuilder.DropTable(
                name: "QuestionAttachments");

            migrationBuilder.DropTable(
                name: "UserMissionProgress");

            migrationBuilder.DropTable(
                name: "Tags");

            migrationBuilder.DropIndex(
                name: "IX_ViolationEscalations_EscalatedById",
                table: "ViolationEscalations");

            migrationBuilder.DropIndex(
                name: "IX_ViolationEscalations_UserId_CreatedAt",
                table: "ViolationEscalations");

            migrationBuilder.DropIndex(
                name: "IX_UserReports_ExamId",
                table: "UserReports");

            migrationBuilder.DropIndex(
                name: "IX_UserReports_PostId",
                table: "UserReports");

            migrationBuilder.DropIndex(
                name: "IX_UserReports_QuestionCommentId",
                table: "UserReports");

            migrationBuilder.DropIndex(
                name: "IX_UserReports_QuestionId",
                table: "UserReports");

            migrationBuilder.DropIndex(
                name: "IX_UserReports_ReporterId",
                table: "UserReports");

            migrationBuilder.DropIndex(
                name: "IX_UserReports_ResolvedById",
                table: "UserReports");

            migrationBuilder.DropCheckConstraint(
                name: "CK_UserReports_Source_Context",
                table: "UserReports");

            migrationBuilder.DropIndex(
                name: "IX_UserFeedbacks_UserId",
                table: "UserFeedbacks");

            migrationBuilder.DropIndex(
                name: "IX_UserBans_ActorId",
                table: "UserBans");

            migrationBuilder.DropIndex(
                name: "IX_UserBans_UserId_CreatedAt",
                table: "UserBans");

            migrationBuilder.DropIndex(
                name: "IX_QuestionReports_ReporterId",
                table: "QuestionReports");

            migrationBuilder.DropIndex(
                name: "IX_QuestionReports_ResolvedById",
                table: "QuestionReports");

            migrationBuilder.DropIndex(
                name: "IX_QuestionComments_AuthorId",
                table: "QuestionComments");

            migrationBuilder.DropIndex(
                name: "IX_QuestionComments_DeletedById",
                table: "QuestionComments");

            migrationBuilder.DropIndex(
                name: "IX_PracticeSubmissions_ReviewedById",
                table: "PracticeSubmissions");

            migrationBuilder.DropIndex(
                name: "IX_PracticeSubmissions_UserId",
                table: "PracticeSubmissions");

            migrationBuilder.DropIndex(
                name: "IX_Posts_AuthorId",
                table: "Posts");

            migrationBuilder.DropIndex(
                name: "IX_Posts_DeletedById",
                table: "Posts");

            migrationBuilder.DropIndex(
                name: "IX_Posts_ModeratedById",
                table: "Posts");

            migrationBuilder.DropIndex(
                name: "IX_PostReports_ReporterId",
                table: "PostReports");

            migrationBuilder.DropIndex(
                name: "IX_PostReports_ResolvedById",
                table: "PostReports");

            migrationBuilder.DropIndex(
                name: "IX_PaymentOrders_UserId_Status",
                table: "PaymentOrders");

            migrationBuilder.DropIndex(
                name: "IX_Exams_ContentHash",
                table: "Exams");

            migrationBuilder.DropIndex(
                name: "IX_Exams_Major_Code",
                table: "Exams");

            migrationBuilder.DropIndex(
                name: "IX_Exams_Major_Status_ExamType",
                table: "Exams");

            migrationBuilder.DropIndex(
                name: "IX_Exams_RejectedById",
                table: "Exams");

            migrationBuilder.DropIndex(
                name: "IX_ConversationReports_ResolvedById",
                table: "ConversationReports");

            migrationBuilder.DropIndex(
                name: "IX_Comments_AuthorId",
                table: "Comments");

            migrationBuilder.DropIndex(
                name: "IX_Comments_DeletedById",
                table: "Comments");

            migrationBuilder.DropIndex(
                name: "IX_CommentReports_ReporterId",
                table: "CommentReports");

            migrationBuilder.DropIndex(
                name: "IX_CommentReports_ResolvedById",
                table: "CommentReports");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_Points",
                table: "AspNetUsers");

            migrationBuilder.DropIndex(
                name: "IX_AiExamChatThreads_ExamId",
                table: "AiExamChatThreads");

            migrationBuilder.DropIndex(
                name: "IX_AiExamChatThreads_QuestionId",
                table: "AiExamChatThreads");

            migrationBuilder.AlterColumn<string>(
                name: "AnswersJson",
                table: "ExamAttempts",
                type: "character varying(8000)",
                maxLength: 8000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "ConversationReports",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.CreateIndex(
                name: "IX_ViolationEscalations_UserId",
                table: "ViolationEscalations",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Exams_Code",
                table: "Exams",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Exams_Semester_Major_ExamType",
                table: "Exams",
                columns: new[] { "Semester", "Major", "ExamType" });
        }
    }
}
