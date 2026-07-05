export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="h-24 animate-pulse rounded-lg bg-[#E5E7EB]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-lg bg-[#E5E7EB]" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-72 animate-pulse rounded-lg bg-[#E5E7EB]" />
        <div className="h-72 animate-pulse rounded-lg bg-[#E5E7EB]" />
      </div>
    </div>
  );
}
