using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SEHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddExamRejectionAndRevision : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "RejectedAt",
                table: "Exams",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "RejectedById",
                table: "Exams",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReasonCode",
                table: "Exams",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReasonDetail",
                table: "Exams",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "RevisionOfExamId",
                table: "Exams",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Exams_RevisionOfExamId",
                table: "Exams",
                column: "RevisionOfExamId");

            migrationBuilder.AddForeignKey(
                name: "FK_Exams_Exams_RevisionOfExamId",
                table: "Exams",
                column: "RevisionOfExamId",
                principalTable: "Exams",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Exams_Exams_RevisionOfExamId",
                table: "Exams");

            migrationBuilder.DropIndex(
                name: "IX_Exams_RevisionOfExamId",
                table: "Exams");

            migrationBuilder.DropColumn(
                name: "RejectedAt",
                table: "Exams");

            migrationBuilder.DropColumn(
                name: "RejectedById",
                table: "Exams");

            migrationBuilder.DropColumn(
                name: "RejectionReasonCode",
                table: "Exams");

            migrationBuilder.DropColumn(
                name: "RejectionReasonDetail",
                table: "Exams");

            migrationBuilder.DropColumn(
                name: "RevisionOfExamId",
                table: "Exams");
        }
    }
}
