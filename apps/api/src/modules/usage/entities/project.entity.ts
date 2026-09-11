// Project: a cost-attribution bucket within an org (e.g. "Support Bot").
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Project {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column() organizationId: string;
  @Column() name: string;
}
