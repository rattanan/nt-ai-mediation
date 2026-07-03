import type { AppRole } from "@/types/database";

export const roleHome: Record<AppRole, string> = {
  debtor: "/debtor",
  mediator: "/mediator",
  creditor: "/creditor",
  admin: "/admin/dashboard",
};

export function getRoleHome(role: AppRole) {
  return roleHome[role];
}

export function isAppRole(value: string): value is AppRole {
  return value === "debtor" || value === "mediator" || value === "creditor" || value === "admin";
}
