/** Page header: title, subtitle and main actions. */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="max-w-2xl space-y-1.5">
        <h2 className="text-[28px] leading-tight font-extrabold tracking-tight">{title}</h2>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>
      {/* Mobile: full-width stacked actions, within thumb reach. Hidden while every action is
          (the list/board switch alone, below tablets), so it leaves no gap. */}
      {actions && (
        <div className="hidden flex-col gap-2 has-[>:not(.hidden)]:flex sm:grow sm:flex-row sm:flex-wrap sm:items-center sm:justify-end md:flex [&>*]:w-full sm:[&>*]:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
