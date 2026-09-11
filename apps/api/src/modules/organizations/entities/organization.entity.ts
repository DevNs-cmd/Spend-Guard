// Organization: id, name, plan, createdAt, retention settings.
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Organization {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column() name: string;
  @Column({ default: "starter" }) plan: string;
}
