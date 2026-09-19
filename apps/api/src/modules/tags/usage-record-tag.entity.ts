import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
} from "typeorm";

@Entity()
@Unique(["usageRecordId", "tagId"])
export class UsageRecordTag {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  usageRecordId: string;

  @Column()
  tagId: string;
}