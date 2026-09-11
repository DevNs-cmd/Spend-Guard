export interface OrganizationDto {
  id: string;
  name: string;
  plan: "starter" | "growth" | "pro" | "enterprise";
}
