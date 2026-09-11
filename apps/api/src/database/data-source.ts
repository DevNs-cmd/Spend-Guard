// TypeORM data source for migrations. Shared file — edit via PR only.
import { DataSource } from "typeorm";

export default new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: ["src/modules/**/entities/*.entity.ts"],
  migrations: ["src/database/migrations/*.ts"],
});
