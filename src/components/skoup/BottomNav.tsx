import { Volleyball, Search, Bookmark, Settings } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export type BottomNavKey = "matches" | "search" | "bookmark" | "settings";

const items: { key: BottomNavKey; icon: typeof Volleyball; label: string; to: string }[] = [
  { key: "matches", icon: Volleyball, label: "Matchs", to: "/" },
  { key: "search", icon: Search, label: "Recherche", to: "/explorer" },
  { key: "bookmark", icon: Bookmark, label: "Favoris", to: "/" },
  { key: "settings", icon: Settings, label: "Réglages", to: "/" },
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
