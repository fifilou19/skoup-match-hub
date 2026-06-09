import { Search, Bookmark, Settings } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export type BottomNavKey = "matches" | "search" | "bookmark" | "settings";

type IconProps = { size?: number; color?: string };

function PitchIcon({ size = 24, color = "currentColor" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="5" width="20" height="14" rx="1.5" />
      <line x1="12" y1="5" x2="12" y2="19" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M2 9h3v6H2z" />
      <path d="M22 9h-3v6h3z" />
    </svg>
  );
}

const items: { key: BottomNavKey; icon: (p: IconProps) => React.ReactElement; label: string; to: string }[] = [
  { key: "matches", icon: PitchIcon, label: "Matchs", to: "/" },
  { key: "search", icon: (p) => <Search {...p} />, label: "Recherche", to: "/explorer" },
  { key: "bookmark", icon: (p) => <Bookmark {...p} />, label: "Favoris", to: "/" },
  { key: "settings", icon: (p) => <Settings {...p} />, label: "Réglages", to: "/" },
];

export function BottomNav({ active = "matches" }: { active?: BottomNavKey }) {
  const navigate = useNavigate();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around"
      style={{
        backgroundColor: "#1E293B",
        borderTop: "0.5px solid #1E3A5F",
        paddingTop: 8,
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)",
      }}
    >
      {items.map((it) => {
        const Icon = it.icon;
        const isActive = it.key === active;
        return (
          <button
            key={it.key}
            type="button"
            aria-label={it.label}
            onClick={() => navigate({ to: it.to })}
            className="flex flex-1 items-center justify-center py-1"
          >
            <Icon size={24} color={isActive ? "#E8622A" : "#64748B"} />
          </button>
        );
      })}
    </nav>
  );
}
