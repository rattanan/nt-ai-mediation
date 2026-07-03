import Link from "next/link";
import { KeyRound, Search, ShieldCheck, UserCog } from "lucide-react";
import { updateUserPassword, updateUserProfile } from "@/app/admin/users/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/admin/auth";
import {
  accountStatusOptions,
  adminRoleOptions,
  getAdminUser,
  listAdminUsers,
} from "@/lib/admin/users";

export const dynamic = "force-dynamic";

const roleLabels = Object.fromEntries(adminRoleOptions.map((option) => [option.value, option.label]));
const statusLabels = Object.fromEntries(accountStatusOptions.map((option) => [option.value, option.label]));

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    role?: string;
    userId?: string;
    success?: string;
    error?: string;
  }>;
}) {
  const profile = await requireAdmin();
  const params = await searchParams;
  const { users, error } = await listAdminUsers({ query: params.q, role: params.role });
  const selectedUser = await getAdminUser(params.userId ?? users[0]?.id);

  return (
    <AdminShell
      profile={profile}
      activePath="/admin/users"
      title="User Management"
      subtitle="ค้นหา ตรวจสอบ แก้ไขบทบาท สถานะ และข้อมูลโปรไฟล์ผู้ใช้งาน"
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_26rem]">
        <section className="rounded-lg border border-black/5 bg-white shadow-sm">
          <div className="border-b border-black/5 p-5">
            <form className="grid gap-3 md:grid-cols-[1fr_12rem_auto]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
                <Input
                  name="q"
                  defaultValue={params.q ?? ""}
                  className="pl-10"
                  placeholder="ค้นหาชื่อ อีเมล หรือองค์กร"
                  aria-label="ค้นหาผู้ใช้งาน"
                />
              </label>
              <select
                name="role"
                defaultValue={params.role ?? ""}
                className="h-11 rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm outline-none focus:border-[#F5B800] focus:ring-2 focus:ring-[#FFD200]/30"
                aria-label="กรองตามบทบาท"
              >
                <option value="">ทุกบทบาท</option>
                {adminRoleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button type="submit" className="h-11 rounded-lg font-semibold">
                ค้นหา
              </Button>
            </form>
          </div>

          <div className="p-5">
            {params.success ? <Alert variant="success" className="mb-4">{params.success}</Alert> : null}
            {params.error ? <Alert variant="destructive" className="mb-4">{params.error}</Alert> : null}
            {error ? <Alert variant="destructive" className="mb-4">โหลดผู้ใช้งานไม่สำเร็จ: {error}</Alert> : null}

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-black/5 text-xs uppercase text-[#6B7280]">
                  <tr>
                    <th className="px-3 py-3">ผู้ใช้</th>
                    <th className="px-3 py-3">บทบาท</th>
                    <th className="px-3 py-3">สถานะ</th>
                    <th className="px-3 py-3">สร้างเมื่อ</th>
                    <th className="px-3 py-3" aria-label="ดูรายละเอียด" />
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-12 text-center text-[#6B7280]">
                        ไม่พบผู้ใช้งานตามเงื่อนไขที่ค้นหา
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="border-b border-black/5 last:border-0">
                        <td className="px-3 py-4">
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-xs text-[#6B7280]">{user.email ?? "ไม่มีอีเมลในโปรไฟล์"}</p>
                        </td>
                        <td className="px-3 py-4">
                          <Badge>{roleLabels[user.role] ?? user.role}</Badge>
                        </td>
                        <td className="px-3 py-4">
                          <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-semibold">
                            {statusLabels[user.account_status] ?? user.account_status}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-[#6B7280]">
                          {new Date(user.created_at).toLocaleDateString("th-TH")}
                        </td>
                        <td className="px-3 py-4 text-right">
                          <Link
                            href={`/admin/users?userId=${user.id}`}
                            className="font-semibold text-[#8A6500] hover:text-[#111827]"
                          >
                            รายละเอียด
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF2A8]">
                <UserCog className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold">รายละเอียดผู้ใช้</h2>
                <p className="text-sm text-[#6B7280]">แก้ไขโปรไฟล์และสิทธิ์การใช้งาน</p>
              </div>
            </div>

            {selectedUser ? (
              <form action={updateUserProfile} className="mt-5 space-y-4">
                <input type="hidden" name="user_id" value={selectedUser.id} />
                <label className="block">
                  <span className="text-sm font-medium">ชื่อ-นามสกุล</span>
                  <Input name="full_name" defaultValue={selectedUser.full_name} className="mt-2" required />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">อีเมล</span>
                  <Input name="email" type="email" defaultValue={selectedUser.email ?? ""} className="mt-2" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">โทรศัพท์</span>
                  <Input name="phone" defaultValue={selectedUser.phone ?? ""} className="mt-2" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">องค์กร</span>
                  <Input name="organization_name" defaultValue={selectedUser.organization_name ?? ""} className="mt-2" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">บทบาท</span>
                  <select
                    name="role"
                    defaultValue={selectedUser.role}
                    className="mt-2 h-11 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm outline-none focus:border-[#F5B800] focus:ring-2 focus:ring-[#FFD200]/30"
                  >
                    {adminRoleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium">สถานะบัญชี</span>
                  <select
                    name="account_status"
                    defaultValue={selectedUser.account_status}
                    className="mt-2 h-11 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm outline-none focus:border-[#F5B800] focus:ring-2 focus:ring-[#FFD200]/30"
                  >
                    {accountStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <Button type="submit" className="h-11 w-full rounded-lg font-semibold">
                  บันทึกข้อมูลผู้ใช้
                </Button>
              </form>
            ) : (
              <p className="mt-5 text-sm text-[#6B7280]">เลือกผู้ใช้จากตารางเพื่อดูรายละเอียด</p>
            )}
          </section>

          {selectedUser ? (
            <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF2A8]">
                  <KeyRound className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-semibold">Reset / Update Password</h2>
                  <p className="text-sm text-[#6B7280]">ใช้ Supabase Admin Auth API ฝั่ง server เท่านั้น</p>
                </div>
              </div>
              <form action={updateUserPassword} className="mt-5 space-y-4">
                <input type="hidden" name="user_id" value={selectedUser.id} />
                <label className="block">
                  <span className="text-sm font-medium">รหัสผ่านใหม่</span>
                  <Input name="password" type="password" autoComplete="new-password" className="mt-2" required />
                </label>
                <Button type="submit" variant="outline" className="h-11 w-full rounded-lg font-semibold">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  อัปเดตรหัสผ่าน
                </Button>
              </form>
            </section>
          ) : null}
        </aside>
      </div>
    </AdminShell>
  );
}
