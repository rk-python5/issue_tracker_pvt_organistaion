import { cn } from "@/lib/utils";

type BadgeVariant = "open" | "closed" | "active" | "inactive";

const variantClasses: Record<BadgeVariant, string> = {
  open: "bg-badge-open-bg text-badge-open-fg",
  closed: "bg-badge-closed-bg text-badge-closed-fg",
  active: "bg-badge-active-bg text-badge-active-fg",
  inactive: "bg-badge-inactive-bg text-badge-inactive-fg",
};

export function StatusBadge({ variant, label }: { variant: BadgeVariant; label?: string }) {
  const text = label ?? variant.charAt(0).toUpperCase() + variant.slice(1);
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", variantClasses[variant])}>
      {text}
    </span>
  );
}
