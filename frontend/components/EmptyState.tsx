export default function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border py-12 text-center">
      <div className="text-sm font-medium text-text-primary">{title}</div>
      {description && <div className="text-sm text-text-muted">{description}</div>}
    </div>
  );
}
