import type { ReactNode } from "react";
import { ProfileSwitcher } from "./ProfileSwitcher";
import { UpdateBadge } from "./UpdateBadge";

interface TopBarProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function TopBar({ title, subtitle, children }: TopBarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-base-700 bg-base-900 px-5">
      <div className="min-w-0">
        <h1 className="truncate text-sm font-semibold text-base-100">{title}</h1>
        {subtitle && <p className="truncate text-xs text-base-400">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {children}
        <UpdateBadge />
        <ProfileSwitcher />
      </div>
    </header>
  );
}
