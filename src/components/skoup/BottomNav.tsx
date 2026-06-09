import { Volleyball, Search, Bookmark, Settings } from "lucide-react";

const items = [
  { key: "matches", icon: Volleyball, label: "Matchs", active: true },
  { key: "search", icon: Search, label: "Recherche", active: false },
  { key: "bookmark", icon: Bookmark, label: "Favoris", active: false },
  { key: "settings", icon: Settings, label: "Réglages", active: false },
];

export function BottomNav() {
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
        return (
          <button
            key={it.key}
            type="button"
            aria-label={it.label}
            className="flex flex-1 items-center justify-center py-1"
          >
            <Icon size={24} color={it.active ? "#E8622A" : "#64748B"} />
          </button>
        );
      })}
    </nav>
  );
}
