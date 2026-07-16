import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfileStore } from "@/store/useProfileStore";
import { cn } from "@/lib/utils/cn";

export function ProfileSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const profiles = useProfileStore((s) => s.profiles);
  const activeProfileId = useProfileStore((s) => s.activeProfileId);
  const setActiveProfile = useProfileStore((s) => s.setActiveProfile);
  const active = profiles.find((p) => p.id === activeProfileId);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!active) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-base-600 bg-base-800 px-3 py-1.5 text-xs font-medium text-base-100 hover:bg-base-700"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        {active.name}
        <svg className="h-3 w-3 text-base-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-1 w-64 rounded-md border border-base-600 bg-base-800 py-1 shadow-panel animate-fade-in">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                void setActiveProfile(p.id);
                setOpen(false);
              }}
              className={cn(
                "flex w-full flex-col items-start px-3 py-2 text-left text-xs hover:bg-base-700",
                p.id === activeProfileId && "bg-base-700/60",
              )}
            >
              <span className="font-medium text-base-100">{p.name}</span>
              <span className="truncate text-[11px] text-base-400">{p.panelUrl}</span>
            </button>
          ))}
          <div className="mt-1 border-t border-base-700 pt-1">
            <button
              onClick={() => {
                setOpen(false);
                navigate("/profiles");
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-accent-400 hover:bg-base-700"
            >
              Profile verwalten
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
