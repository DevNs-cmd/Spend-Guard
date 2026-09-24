import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableUnique,
  TableIndex,
} from "typeorm";

export class CreateBudgetsReportsBillingTables1761000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Budget Table
    await queryRunner.createTable(
      new Table({
        name: "budget",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "gen_random_uuid()",
          },
          {
            name: "organizationId",
            type: "varchar",
          },
          {
            name: "scope",
            type: "varchar",
            default: "'organization'",
          },
          {
            name: "projectId",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "teamTagValue",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "softLimitUsd",
            type: "decimal",
            precision: 12,
            scale: 2,
          },
          {
            name: "hardLimitUsd",
            type: "decimal",
            precision: 12,
            scale: 2,
          },
          {
            name: "period",
            type: "varchar",
            default: "'monthly'",
          },
          {
            name: "active",
            type: "boolean",
            default: true,
          },
          {
            name: "createdAt",
            type: "timestamptz",
            default: "now()",
          },
          {
            name: "updatedAt",
            type: "timestamptz",
            default: "now()",
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      "budget",
      new TableIndex({
        name: "IDX_budget_org_active",
        columnNames: ["organizationId", "active"],
      }),
    );

    // 2. Alert Table
    await queryRunner.createTable(
      new Table({
        name: "alert",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "gen_random_uuid()",
          },
          {
            name: "organizationId",
            type: "varchar",
          },
          {
            name: "budgetId",
            type: "uuid",
          },
          {
            name: "severity",
            type: "varchar",
          },
          {
            name: "currentSpendUsd",
            type: "decimal",
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: "thresholdUsd",
            type: "decimal",
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: "periodKey",
            type: "varchar",
          },
          {
            name: "firedAt",
            type: "timestamptz",
            default: "now()",
          },
        ],
        uniques: [
          new TableUnique({
            name: "UQ_alert_budget_severity_period",
            columnNames: ["budgetId", "severity", "periodKey"],
          }),
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      "alert",
      new TableIndex({
        name: "IDX_alert_org_fired",
        columnNames: ["organizationId", "firedAt"],
      }),
    );

    await queryRunner.createForeignKey(
      "alert",
      new TableForeignKey({
        name: "FK_alert_budget",
        columnNames: ["budgetId"],
        referencedTableName: "budget",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    // 3. Report Table
    await queryRunner.createTable(
      new Table({
        name: "report",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "gen_random_uuid()",
          },
          {
            name: "organizationId",
            type: "varchar",
          },
          {
            name: "name",
            type: "varchar",
          },
          {
            name: "type",
            type: "varchar",
            default: "'spend_summary'",
          },
          {
            name: "format",
            type: "varchar",
            default: "'pdf'",
          },
          {
            name: "frequency",
            type: "varchar",
            default: "'monthly'",
          },
          {
            name: "dateRange",
            type: "varchar",
            default: "'this_month'",
          },
          {
            name: "recipients",
            type: "text",
            isNullable: true,
          },
          {
            name: "shareToken",
            type: "varchar",
            isUnique: true,
          },
          {
            name: "shareExpiresAt",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "filters",
            type: "text",
            isNullable: true,
          },
          {
            name: "active",
            type: "boolean",
            default: true,
          },
          {
            name: "lastRunAt",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "createdAt",
            type: "timestamptz",
            default: "now()",
          },
          {
            name: "updatedAt",
            type: "timestamptz",
            default: "now()",
          },
        ],
        uniques: [
          new TableUnique({
            name: "UQ_report_share_token",
            columnNames: ["shareToken"],
          }),
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      "report",
      new TableIndex({
        name: "IDX_report_org_active",
        columnNames: ["organizationId", "active"],
      }),
    );

    // 4. Processed Webhook Table
    await queryRunner.createTable(
      new Table({
        name: "processed_webhook",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "gen_random_uuid()",
          },
          {
            name: "eventId",
            type: "varchar",
            isUnique: true,
          },
          {
            name: "eventType",
            type: "varchar",
          },
          {
            name: "processedAt",
            type: "timestamptz",
            default: "now()",
          },
        ],
        uniques: [
          new TableUnique({
            name: "UQ_processed_webhook_event_id",
            columnNames: ["eventId"],
          }),
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("processed_webhook", true);
    await queryRunner.dropTable("report", true);
    await queryRunner.dropTable("alert", true);
    await queryRunner.dropTable("budget", true);
  }
}
