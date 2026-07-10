using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SEHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPartnerVoucherInventory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PartnerVoucherTypes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Label = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    DiscountPercent = table.Column<int>(type: "integer", nullable: false),
                    ValidityDays = table.Column<int>(type: "integer", nullable: false),
                    PartnerName = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PartnerVoucherTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SubscriptionPlanPartnerRewards",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PlanCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PartnerVoucherTypeCode = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubscriptionPlanPartnerRewards", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PartnerVoucherCodes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TypeId = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    AssignedUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    AssignedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PaymentOrderId = table.Column<Guid>(type: "uuid", nullable: true),
                    ImportedByAdminId = table.Column<Guid>(type: "uuid", nullable: true),
                    ImportedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PartnerVoucherCodes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PartnerVoucherCodes_AspNetUsers_AssignedUserId",
                        column: x => x.AssignedUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PartnerVoucherCodes_AspNetUsers_ImportedByAdminId",
                        column: x => x.ImportedByAdminId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_PartnerVoucherCodes_PartnerVoucherTypes_TypeId",
                        column: x => x.TypeId,
                        principalTable: "PartnerVoucherTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PartnerVoucherCodes_PaymentOrders_PaymentOrderId",
                        column: x => x.PaymentOrderId,
                        principalTable: "PaymentOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PartnerVoucherCodes_AssignedUserId",
                table: "PartnerVoucherCodes",
                column: "AssignedUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PartnerVoucherCodes_Code",
                table: "PartnerVoucherCodes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PartnerVoucherCodes_ImportedByAdminId",
                table: "PartnerVoucherCodes",
                column: "ImportedByAdminId");

            migrationBuilder.CreateIndex(
                name: "IX_PartnerVoucherCodes_PaymentOrderId",
                table: "PartnerVoucherCodes",
                column: "PaymentOrderId",
                unique: true,
                filter: "\"PaymentOrderId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_PartnerVoucherCodes_TypeId_Status",
                table: "PartnerVoucherCodes",
                columns: new[] { "TypeId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_PartnerVoucherTypes_Code",
                table: "PartnerVoucherTypes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SubscriptionPlanPartnerRewards_PlanCode",
                table: "SubscriptionPlanPartnerRewards",
                column: "PlanCode",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PartnerVoucherCodes");

            migrationBuilder.DropTable(
                name: "SubscriptionPlanPartnerRewards");

            migrationBuilder.DropTable(
                name: "PartnerVoucherTypes");
        }
    }
}
