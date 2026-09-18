import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableUnique,
} from "typeorm";

export class CreateUsageTables1760000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "project",
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
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: "usage_record",
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
            name: "providerConnectionId",
            type: "varchar",
          },
          {
            name: "sourceRecordId",
            type: "varchar",
          },
          {
            name: "model",
            type: "varchar",
          },
          {
            name: "inputTokens",
            type: "integer",
          },
          {
            name: "outputTokens",
            type: "integer",
          },
          {
            name: "cachedTokens",
            type: "integer",
            isNullable: true,
          },
          {
            name: "projectId",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "occurredAt",
            type: "timestamptz",
          },
        ],
        uniques: [
          new TableUnique({
            name: "UQ_usage_record_source",
            columnNames: [
              "organizationId",
              "providerConnectionId",
              "sourceRecordId",
            ],
          }),
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: "cost_record",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "gen_random_uuid()",
          },
          {
            name: "usageRecordId",
            type: "uuid",
          },
          {
            name: "costUsd",
            type: "decimal",
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      "cost_record",
      new TableForeignKey({
        name: "FK_cost_record_usage",
        columnNames: ["usageRecordId"],
        referencedTableName: "usage_record",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: "tag",
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
            name: "key",
            type: "varchar",
          },
          {
            name: "value",
            type: "varchar",
          },
        ],
        uniques: [
          new TableUnique({
            name: "UQ_tag_organization_key_value",
            columnNames: [
              "organizationId",
              "key",
              "value",
            ],
          }),
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: "usage_record_tag",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "gen_random_uuid()",
          },
          {
            name: "usageRecordId",
            type: "uuid",
          },
          {
            name: "tagId",
            type: "uuid",
          },
        ],
        uniques: [
          new TableUnique({
            name: "UQ_usage_record_tag",
            columnNames: [
              "usageRecordId",
              "tagId",
            ],
          }),
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      "usage_record_tag",
      new TableForeignKey({
        name: "FK_usage_record_tag_usage",
        columnNames: ["usageRecordId"],
        referencedTableName: "usage_record",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    await queryRunner.createForeignKey(
      "usage_record_tag",
      new TableForeignKey({
        name: "FK_usage_record_tag_tag",
        columnNames: ["tagId"],
        referencedTableName: "tag",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("usage_record_tag", true);
    await queryRunner.dropTable("tag", true);
    await queryRunner.dropTable("cost_record", true);
    await queryRunner.dropTable("usage_record", true);
    await queryRunner.dropTable("project", true);
  }
}