import Link from "next/link";
import { CalendarClock, ExternalLink, Video } from "lucide-react";
import { AppointmentStatusBadge } from "@/components/appointments/appointment-status-badge";
import { Button } from "@/components/ui/button";
import {
  formatAppointmentDateTime,
  meetingTypeLabels,
  type AppointmentWithDetails,
} from "@/lib/appointments";

export function AppointmentSummaryCard({
  appointment,
  detailHref,
  actions,
}: {
  appointment: AppointmentWithDetails;
  detailHref?: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <AppointmentStatusBadge status={appointment.status} />
          <h2 className="mt-3 text-lg font-semibold">
            นัดไกล่เกลี่ย {appointment.cases?.case_number ? `เคส ${appointment.cases.case_number}` : ""}
          </h2>
          <div className="mt-3 grid gap-2 text-sm text-[#4B5563]">
            <p className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-[#A87900]" />
              {formatAppointmentDateTime(appointment)}
            </p>
            <p className="flex items-center gap-2">
              <Video className="h-4 w-4 text-[#A87900]" />
              {meetingTypeLabels[appointment.meeting_type]}
            </p>
          </div>
        </div>
        {detailHref ? (
          <Button href={detailHref} variant="outline" className="rounded-lg font-semibold">
            รายละเอียด
          </Button>
        ) : null}
      </div>

      {appointment.meeting_url ? (
        <a
          href={appointment.meeting_url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#FFD200] px-4 py-2 text-sm font-semibold text-[#111827] hover:bg-[#F5B800]"
        >
          เปิดลิงก์ประชุม
          <ExternalLink className="h-4 w-4" />
        </a>
      ) : (
        <p className="mt-4 rounded-lg bg-[#F8FAFC] p-3 text-sm text-[#6B7280]">
          ยังไม่มี Meeting URL ผู้ไกล่เกลี่ยหรือผู้ดูแลระบบสามารถเพิ่มลิงก์ได้
        </p>
      )}

      {appointment.cases ? (
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[#6B7280]">เจ้าหนี้</dt>
            <dd className="font-medium">{appointment.creditor_organizations?.organization_name ?? appointment.cases.creditor_name}</dd>
          </div>
          <div>
            <dt className="text-[#6B7280]">ผู้ไกล่เกลี่ย</dt>
            <dd className="font-medium">
              {appointment.mediator_profiles
                ? `${appointment.mediator_profiles.title ?? ""} ${appointment.mediator_profiles.first_name} ${appointment.mediator_profiles.last_name}`.trim()
                : "-"}
            </dd>
          </div>
        </dl>
      ) : null}

      {actions ? <div className="mt-5 border-t border-black/5 pt-4">{actions}</div> : null}
      {detailHref ? (
        <Link href={detailHref} className="mt-4 inline-block text-sm font-semibold text-[#8A6500] hover:text-[#111827]">
          ดูประวัติและสถานะผู้เข้าร่วม
        </Link>
      ) : null}
    </section>
  );
}
