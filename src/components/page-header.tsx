/** En-tête de page : titre, sous-titre et actions principales. */
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
      {/* Mobile : actions empilées en pleine largeur, à portée de pouce. */}
      {actions && <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap [&>*]:w-full sm:[&>*]:w-auto">{actions}</div>}
    </div>
  );
}
