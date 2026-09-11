// Tag entity lives here (kept single-file since it's small).
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Tag {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column() organizationId: string;
  @Column() key: string;
  @Column() value: string;
}
