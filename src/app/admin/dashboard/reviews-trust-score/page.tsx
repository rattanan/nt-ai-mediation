import { AlertTriangle, CheckCircle2, ClipboardList, Star, TrendingUp } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { ChartCard, ChartGrid, DashboardLayout, DataTableCard, KpiCard, KpiGrid, StatusBadge, TrustScoreBadge } from "@/components/admin/dashboard/dashboard-components";
import { requireAdmin } from "@/lib/admin/auth";
import { getReviewsTrustScoreDashboardData } from "@/lib/admin/dashboard";

export const dynamic = "force-dynamic";

export default async function ReviewsTrustScoreDashboardPage() {
  const profile = await requireAdmin();
  const data = await getReviewsTrustScoreDashboardData();
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({ label: `${rating} ดาว`, value: data.tables.reviews.filter((item) => item.rating === rating).length }));

  return (
    <AdminShell profile={profile} activePath="/admin/dashboard" title="Reviews & Trust Score Dashboard" subtitle="คุณภาพผู้ไกล่เกลี่ย รีวิว ความพึงพอใจ และ trust score">
      <DashboardLayout activePath="/admin/dashboard/reviews-trust-score" title="Reviews & Trust Score" description="ตรวจคิวรีวิว คุณภาพบริการ และ mediator trust score เพื่อรักษามาตรฐานแพลตฟอร์ม">
        <KpiGrid>
          <KpiCard label="Pending Reviews" value={data.pendingReviews.length} icon={ClipboardList} />
          <KpiCard label="Approved Reviews" value={data.approvedReviews.length} icon={CheckCircle2} />
          <KpiCard label="Average Rating" value={data.averageRating.toFixed(1)} icon={Star} />
          <KpiCard label="Average Trust Score" value={data.averageTrustScore} icon={TrendingUp} />
          <KpiCard label="Complaints" value={data.complaintReviews.length} icon={AlertTriangle} />
        </KpiGrid>

        <ChartGrid>
          <ChartCard title="Rating Distribution" items={ratingDistribution} />
          <ChartCard title="Trust Score Distribution" items={[{ label: "85+", value: data.tables.trustScores.filter((item) => item.overall_score >= 85).length }, { label: "70-84", value: data.tables.trustScores.filter((item) => item.overall_score >= 70 && item.overall_score < 85).length }, { label: "50-69", value: data.tables.trustScores.filter((item) => item.overall_score >= 50 && item.overall_score < 70).length }, { label: "<50", value: data.tables.trustScores.filter((item) => item.overall_score < 50).length }]} />
          <ChartCard title="Review Trend" items={data.charts.monthlyCases} />
          <ChartCard title="Complaint Trend" items={[{ label: "Complaints", value: data.complaintReviews.length }]} />
        </ChartGrid>

        <section className="grid gap-6 xl:grid-cols-2">
          <DataTableCard title="Reviews Pending Approval" columns={["Mediator ID", "Rating", "Comment"]} rows={data.pendingReviews.slice(0, 8).map((item) => [item.mediator_id, item.rating, item.comment ?? "-"])} />
          <DataTableCard title="Latest Approved Reviews" columns={["Mediator ID", "Rating", "Reviewed"]} rows={data.approvedReviews.slice(0, 8).map((item) => [item.mediator_id, item.rating, item.reviewed_at ? new Date(item.reviewed_at).toLocaleDateString("th-TH") : "-"])} />
          <DataTableCard title="Mediators with Low Rating" columns={["Mediator ID", "Rating", "สถานะ"]} rows={data.tables.trustScores.filter((item) => item.average_rating < 3).slice(0, 8).map((item) => [item.mediator_id, item.average_rating.toFixed(1), <TrustScoreBadge key={item.id} score={item.overall_score} />])} />
          <DataTableCard title="Mediators with Complaints" columns={["Mediator ID", "Rating", "สถานะรีวิว"]} rows={data.complaintReviews.slice(0, 8).map((item) => [item.mediator_id, item.rating, <StatusBadge key={item.id} status={item.status} />])} />
        </section>
      </DashboardLayout>
    </AdminShell>
  );
}
