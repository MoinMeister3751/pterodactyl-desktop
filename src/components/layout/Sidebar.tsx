import { useCallback, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils/cn";
import { useProfileStore } from "@/store/useProfileStore";

const MIN_WIDTH = 180;
const MAX_WIDTH = 360;
const DEFAULT_WIDTH = 232;

const navItems = [
  { to: "/", label: "Dashboard", icon: DashboardIcon, end: true },
  { to: "/settings", label: "Einstellungen", icon: SettingsIcon, end: false },
];

export function Sidebar() {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const isDragging = useRef(false);
  const profile = useProfileStore((s) => s.activeProfile());

  const onMouseDown = useCallback(() => {
    isDragging.current = true;
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      setWidth(Math.min(Math.max(e.clientX, MIN_WIDTH), MAX_WIDTH));
    };
    const onMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, []);

  return (
    <aside
      style={{ width }}
      className="relative flex shrink-0 flex-col border-r border-base-700 bg-base-900"
    >
      <div className="flex h-14 items-center gap-2 border-b border-base-700 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-500/15 text-accent-400">
          <PteroIcon />
        </div>
        <span className="truncate text-sm font-semibold text-base-100">Pterodactyl Desktop</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent-500/15 text-accent-300"
                  : "text-base-300 hover:bg-base-800 hover:text-base-100",
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {profile && (
        <div className="border-t border-base-700 p-3">
          <p className="truncate text-xs font-medium text-base-100">{profile.name}</p>
          <p className="truncate text-[11px] text-base-400">{profile.panelUrl}</p>
        </div>
      )}

      <div
        onMouseDown={onMouseDown}
        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-accent-500/40"
      />
    </aside>
  );
}

function PteroIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-4 w-4"} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 17l4-10 4 10M6 13h4m3 4l4-10 4 10M15 13h4" />
    </svg>
  );
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h8v8H3V3zm10 0h8v5h-8V3zM3 13h8v8H3v-8zm10 3h8v5h-8v-5z" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
