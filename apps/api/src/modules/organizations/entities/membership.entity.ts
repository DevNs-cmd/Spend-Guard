// Membership: links User <-> Organization with a Role (Owner/Admin/Member/Viewer)
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Membership {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column() userId: string;
  @Column() organizationId: string;
  @Column({ default: "member" }) role: "owner" | "admin" | "member" | "viewer";
}
