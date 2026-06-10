import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bookmark, Eye, Lock } from "lucide-react";
import { BottomNav } from "@/components/skoup/BottomNav";
import { TeamLogo } from "@/components/skoup/TeamLogo";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/follows")({
  head: () => ({
    meta: [
      { title: "SKOUP — Suivis" },
      { name: "description", content: "Vos matchs suivis et événements en direct." },
      { property: "og:title", content: "SKOUP — Suivis" },
      { property: "og:description", content: "Vos matchs suivis et événements en direct." },
    ],
  }),
  component: FollowsPage,
});

// ---------- Types ----------

interface WatchlistRow {
  id: string;
  match_id: string;
  home_name: string | null;
  away_name: string | null;
  home_logo: string | null;
  away_logo: string | null;
  competition_name: string | null;
  competition_logo: string | null;
  kickoff_at: string | null;
  status: string | null;
  score_home: number | null;
  score_away: number | null;
}

// ---------- Date helpers ----------

const DAY_NAMES_FULL = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];
const MONTH_NAMES_FULL = [
  "JAN", "FÉV", "MARS", "AVR", "MAI", "JUIN",
  "JUIL", "AOÛT", "SEPT", "OCT", "NOV", "DÉC",
];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function localDateKey(iso: string | null): string {
  if (!iso) return "0000-00-00";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function offsetDateKey(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDateLabel(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DAY_NAMES_FULL[dt.getDay()]} ${dt.getDate()} ${MONTH_NAMES_FULL[dt.getMonth()]}`;
}

function formatKickoff(iso: string | null): string {
  if (!iso) return "--:--";
  const d = new Date(iso);
  return `${pad(d.getHours())}h${pad(d.getMinutes())}`;
}

const LIVE_STATUSES = new Set(["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT", "SUSP"]);
const FINISHED_STATUSES = new Set(["FT", "AET", "PEN", "AWD", "WO"]);

const TODAY = todayKey();
const TOMORROW = offsetDateKey(1);

// ---------- Sub-components ----------

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-4 pt-4 pb-2">
      <span
        className="uppercase"
        style={{ fontSize: 10, color: "#475569", letterSpacing: "0.08em", fontWeight: 600 }}
      >
        {children}
      </span>
    </div>
  );
}

function FollowCard({
  row,
  onRemove,
}: {
  row: WatchlistRow;
  onRemove: (id: string, matchId: string) => void;
}) {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLeaving(true);
    setTimeout(() => onRemove(row.id, row.match_id), 200);
  };

  const onCardClick = () => {
    navigate({ to: "/match/$matchId", params: { matchId: row.match_id } });
  };

  const isLive = LIVE_STATUSES.has(row.status ?? "");
  const isFinished = FINISHED_STATUSES.has(row.status ?? "");

  return (
    <div
      onClick={onCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onCardClick()}
      className="cursor-pointer active:opacity-80"
      style={{
        backgroundColor: "#1E293B",
        border: isLive ? "0.5px solid #1E3A5F" : "0.5px solid #1E3A5F",
        borderLeft: isLive ? "3px solid #E8622A" : "0.5px solid #1E3A5F",
        borderRadius: 12,
        margin: "4px 12px",
        padding: "10px 12px",
        opacity: leaving ? 0 : 1,
        transition: "opacity 200ms ease-out",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-1 flex-col gap-[6px]">
          <div className="flex items-center gap-[10px]">
            <TeamLogo src={row.home_logo ?? ""} name={row.home_name ?? "?"} size={28} rounded={4} />
            <span style={{ fontSize: 13, color: "#E2E8F0" }} className="flex-1 font-medium leading-tight">
              {row.home_name ?? "—"}
            </span>
          </div>
          <div className="flex items-center gap-[10px]">
            <TeamLogo src={row.away_logo ?? ""} name={row.away_name ?? "?"} size={28} rounded={4} />
            <span style={{ fontSize: 13, color: "#E2E8F0" }} className="flex-1 font-medium leading-tight">
              {row.away_name ?? "—"}
            </span>
          </div>
          <span style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
            {row.competition_name ?? ""}
          </span>
        </div>

        <div className="flex flex-col items-end justify-center" style={{ minWidth: 56 }}>
          {isFinished ? (
            <>
              <span className="font-display font-bold" style={{ fontSize: 16, color: "#FFFFFF", lineHeight: 1 }}>
                {row.score_home ?? 0} — {row.score_away ?? 0}
              </span>
              <span style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>Terminé</span>
            </>
          ) : isLive ? (
            <>
              <span className="font-display font-bold" style={{ fontSize: 16, color: "#FFFFFF", lineHeight: 1 }}>
                {row.score_home ?? 0} — {row.score_away ?? 0}
              </span>
              <span style={{ fontSize: 10, color: "#22C55E", marginTop: 4 }}>En direct</span>
            </>
          ) : (
            <span className="font-display font-bold" style={{ fontSize: 16, color: "#FFFFFF", lineHeight: 1 }}>
              {formatKickoff(row.kickoff_at)}
            </span>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-end">
        <button
          type="button"
          onClick={handleRemove}
          aria-label="Retirer des suivis"
          className="flex items-center justify-center"
          style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: "#0F172A", border: "0.5px solid #1E3A5F" }}
        >
          <Eye size={16} color="#E8622A" />
        </button>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div
      style={{
        backgroundColor: "#1E293B",
        border: "0.5px solid #1E3A5F",
        borderRadius: 12,
        margin: "4px 12px",
        padding: "10px 12px",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-1 flex-col gap-[10px]">
          <div className="flex items-center gap-[10px]">
            <Skeleton className="h-7 w-7 rounded" />
            <Skeleton className="h-3 w-28" />
          </div>
          <div className="flex items-center gap-[10px]">
            <Skeleton className="h-7 w-7 rounded" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-2 w-20 mt-1" />
        </div>
        <Skeleton className="h-6 w-12 mt-1" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 text-center" style={{ minHeight: "60vh" }}>
      <Bookmark size={48} color="#1E3A5F" />
      <h2 className="font-display font-bold mt-4 text-white" style={{ fontSize: 16 }}>
        Aucun match suivi
      </h2>
      <p style={{ fontSize: 13, color: "#475569", maxWidth: 260, marginTop: 6 }}>
        Appuie sur l'icône 👁 sur une fiche de match pour le suivre
      </p>
    </div>
  );
}

function NotLoggedState() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center px-6 text-center" style={{ minHeight: "60vh" }}>
      <Lock size={48} color="#1E3A5F" />
      <h2 className="font-display font-bold mt-4 text-white" style={{ fontSize: 16 }}>
        Connecte-toi pour voir tes suivis
      </h2>
      <p style={{ fontSize: 13, color: "#475569", maxWidth: 260, marginTop: 6 }}>
        Crée un compte ou connecte-toi pour suivre des matchs et retrouver tes pronostics.
      </p>
      <button
        type="button"
        onClick={() => navigate({ to: "/auth" })}
        style={{
          marginTop: 20,
          backgroundColor: "#E8622A",
          color: "#FFFFFF",
          borderRadius: 8,
          padding: "10px 24px",
          fontSize: 14,
          fontWeight: 600,
          border: "none",
        }}
        className="active:opacity-80"
      >
        Se connecter
      </button>
    </div>
  );
}

// ---------- Page ----------

function FollowsPage() {
  const [matches, setMatches] = useState<WatchlistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Load watchlist from Supabase
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;

      if (!session) {
        setUserId(null);
        setMatches([]);
        setLoading(false);
        return;
      }

      setUserId(session.user.id);

      const { data, error } = await supabase
        .from("watchlist")
        .select("*")
        .eq("user_id", session.user.id)
        .order("kickoff_at", { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error("watchlist fetch error", error);
        toast.error("Erreur lors du chargement des suivis.");
      } else {
        setMatches((data as WatchlistRow[]) ?? []);
      }
      setLoading(false);

      // Realtime subscription for score/status updates
      channel = supabase
        .channel("watchlist-changes")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "watchlist",
            filter: `user_id=eq.${session.user.id}`,
          },
          (payload) => {
            setMatches((prev) =>
              prev.map((m) =>
                m.match_id === (payload.new as WatchlistRow).match_id
                  ? { ...m, ...(payload.new as WatchlistRow) }
                  : m
              )
            );
          }
        )
        .subscribe();
    }

    load();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const handleRemove = async (id: string, matchId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("watchlist")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) {
      console.error("watchlist remove error", error);
      toast.error("Erreur lors de la suppression.");
      return;
    }
    setMatches((prev) => prev.filter((m) => m.match_id !== matchId));
  };

  const grouped = useMemo(() => {
    const byDate = new Map<string, WatchlistRow[]>();
    for (const m of matches) {
      const key = localDateKey(m.kickoff_at);
      const arr = byDate.get(key) ?? [];
      arr.push(m);
      byDate.set(key, arr);
    }
    const sortedKeys = Array.from(byDate.keys()).sort();
    return sortedKeys.map((key) => {
      let label: string;
      if (key === TODAY) label = "AUJOURD'HUI";
      else if (key === TOMORROW) label = "DEMAIN";
      else label = formatDateLabel(key);
      return { key, label, items: byDate.get(key)! };
    });
  }, [matches]);

  const total = matches.length;

  return (
    <div className="min-h-screen font-sans text-[#E2E8F0]" style={{ backgroundColor: "#0F172A" }}>
      <header className="flex items-center justify-between px-4 py-3">
        <h1 className="font-display font-bold text-white" style={{ fontSize: 18 }}>
          Suivis
        </h1>
        {!loading && userId && total > 0 && (
          <span
            style={{
              backgroundColor: "#1E293B",
              color: "#94A3B8",
              border: "0.5px solid #1E3A5F",
              borderRadius: 10,
              padding: "2px 10px",
              fontSize: 12,
            }}
          >
            {total} match{total > 1 ? "s" : ""}
          </span>
        )}
      </header>

      <main className="pb-24">
        {loading ? (
          <>
            <div style={{ margin: "8px 0 4px", padding: "4px 16px" }}>
              <Skeleton className="h-2 w-20" />
            </div>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : !userId ? (
          <NotLoggedState />
        ) : total === 0 ? (
          <EmptyState />
        ) : (
          grouped.map((section) => (
            <section key={section.key}>
              <SectionLabel>{section.label}</SectionLabel>
              {section.items.map((row) => (
                <FollowCard key={row.id} row={row} onRemove={handleRemove} />
              ))}
            </section>
          ))
        )}
      </main>

      <BottomNav active="bookmark" />
    </div>
  );
}
