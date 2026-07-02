import type { AppRole } from "@/types/database";

export const roleHome: Record<AppRole, string> = {
  debtor: "/dashboard/debtor",
  mediator: "/dashboard/mediator",
  creditor: "/dashboard/creditor",
  admin: "/dashboard/admin",
};

export function getRoleHome(role: AppRole) {
  return roleHome[role];
}

export function isAppRole(value: string): value is AppRole {
  return value === "debtor" || value === "mediator" || value === "creditor" || value === "admin";
}
