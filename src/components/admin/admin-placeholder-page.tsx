import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/admin/auth";

export async function AdminPlaceholderPage({
  activePath,
  title,
}: {
  activePath: string;
  title: string;
}) {
  const profile = await requireAdmin();

  return (
    <AdminShell
      profile={profile}
      activePath={activePath}
      title={title}
      subtitle="พื้นที่นี้เตรียมไว้สำหรับเชื่อมต่อข้อมูลและ workflow ในรอบถัดไป"
    >
      <section className="rounded-lg border border-dashed border-[#D1D5DB] bg-white p-10 text-center shadow-sm">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-[#6B7280]">
          ยังไม่มีข้อมูลในหน้าจอนี้ ระบบจะเชื่อมต่อโมดูลจริงเมื่อพร้อมใช้งาน
        </p>
      </section>
    </AdminShell>
  );
}
