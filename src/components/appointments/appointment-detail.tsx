import { AppointmentStatusBadge } from "@/components/appointments/appointment-status-badge";
import { Badge } from "@/components/ui/badge";
import { RecordingConsentCard } from "@/components/appointments/recording-consent-card";
import { ApprovedMinutesCard } from "@/components/appointments/approved-minutes-card";
import {
  appointmentStatusLabels,
  formatAppointmentDateTime,
  meetingProviderLabels,
  meetingTypeLabels,
  participantStatusLabels,
  type AppointmentWithDetails,
} from "@/lib/appointments";

const roleLabels = {
  debtor: "ลูกหนี้",
  creditor_officer: "เจ้าหน้าที่เจ้าหนี้",
  mediator: "ผู้ไกล่เกลี่ย",
  admin: "ผู้ดูแลระบบ",
};

export function AppointmentDetail({ appointment, actions }: { appointment: AppointmentWithDetails; actions?: React.ReactNode }) {
  const history = appointment.appointment_status_history ?? [];
  const participants = appointment.appointment_participants ?? [];

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
      <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
        <div className="border-b border-black/5 pb-5">
          <AppointmentStatusBadge status={appointment.status} />
          <h2 className="mt-3 text-2xl font-semibold">นัดไกล่เกลี่ยเคส {appointment.cases?.case_number ?? "-"}</h2>
          <p className="mt-1 text-sm text-[#6B7280]">{formatAppointmentDateTime(appointment)}</p>
        </div>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div><dt className="text-sm text-[#6B7280]">ลูกหนี้</dt><dd className="font-medium">{appointment.debtor_profile?.full_name ?? "-"}</dd></div>
          <div><dt className="text-sm text-[#6B7280]">องค์กรเจ้าหนี้</dt><dd className="font-medium">{appointment.creditor_organizations?.organization_name ?? appointment.cases?.creditor_name ?? "-"}</dd></div>
          <div><dt className="text-sm text-[#6B7280]">ผู้ไกล่เกลี่ย</dt><dd className="font-medium">{appointment.mediator_profiles ? `${appointment.mediator_profiles.title ?? ""} ${appointment.mediator_profiles.first_name} ${appointment.mediator_profiles.last_name}`.trim() : "-"}</dd></div>
          <div><dt className="text-sm text-[#6B7280]">รูปแบบประชุม</dt><dd className="font-medium">{meetingTypeLabels[appointment.meeting_type]}</dd></div>
          <div><dt className="text-sm text-[#6B7280]">ผู้ให้บริการ</dt><dd className="font-medium">{meetingProviderLabels[appointment.meeting_provider]}</dd></div>
          <div><dt className="text-sm text-[#6B7280]">สถานะ</dt><dd className="font-medium">{appointmentStatusLabels[appointment.status]}</dd></div>
        </dl>

        <div className="mt-6">
          <h3 className="font-semibold">Meeting URL</h3>
          {appointment.meeting_url ? (
            <a href={appointment.meeting_url} target="_blank" rel="noreferrer" className="mt-2 inline-block break-all text-sm font-semibold text-[#8A6500] hover:text-[#111827]">
              {appointment.meeting_url}
            </a>
          ) : (
            <p className="mt-2 rounded-lg bg-[#F8FAFC] p-4 text-sm text-[#6B7280]">ยังไม่มีลิงก์ประชุม</p>
          )}
        </div>

        {actions ? <div className="mt-6 border-t border-black/5 pt-5">{actions}</div> : null}
      </section>

      <aside className="space-y-5">
        <RecordingConsentCard appointmentId={appointment.id} />
        <ApprovedMinutesCard appointmentId={appointment.id} />
        <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">สถานะผู้เข้าร่วม</h2>
          <div className="mt-4 space-y-3">
            {participants.length === 0 ? <p className="text-sm text-[#6B7280]">ยังไม่มีรายการผู้เข้าร่วม</p> : participants.map((participant) => (
              <div key={participant.id} className="rounded-lg bg-[#F8FAFC] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{roleLabels[participant.role]}</p>
                  <Badge>{participantStatusLabels[participant.status]}</Badge>
                </div>
                {participant.note ? <p className="mt-2 text-sm text-[#4B5563]">{participant.note}</p> : null}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">ประวัติสถานะนัดหมาย</h2>
          <div className="mt-4 space-y-3">
            {history.length === 0 ? <p className="text-sm text-[#6B7280]">ยังไม่มีประวัติ</p> : history.map((entry) => (
              <div key={entry.id} className="rounded-lg bg-[#F8FAFC] p-3">
                <p className="text-sm font-medium">{appointmentStatusLabels[entry.to_status]}</p>
                <p className="mt-1 text-xs text-[#6B7280]">{new Date(entry.created_at).toLocaleString("th-TH")}</p>
                {entry.note ? <p className="mt-2 text-sm text-[#4B5563]">{entry.note}</p> : null}
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
