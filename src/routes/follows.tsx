import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bookmark, Lock, X } from "lucide-react";
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

const DAY_NAMES_FULL = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];
const MONTH_NAMES_FULL = [
  "JAN", "FÉV", "MARS", "AVR", "MAI", "JUIN",
  "JUIL", "AOÛT", "SEPT", "OCT", "NOV", "DÉC",
];
const LIVE_STATUSES = new Set(["1H", "2H", "HT", "ET", "BT", "P", "LIVE"]);
const FINISHED_STATUSES = new Set(["FT", "AET", "PEN", "AWD", "WO"]);

function pad(n: number) {
  return n.toString().padStart(2, "0");
}
function dateKeyFromIso(iso: string | null): string {
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
function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${pad(d.getHours())}h${pad(d.getMinutes())}`;
}

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
  item,
  onRemove,
}: {
  item: WatchlistRow;
  onRemove: (id: string) => Promise<void>;
}) {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  const status = item.status ?? "NS";
  const isLive = LIVE_STATUSES.has(status);
  const isFinished = FINISHED_STATUSES.has(status);

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLeaving(true);
    setTimeout(() => {
      onRemove(item.id);
    }, 200);
  };

  const onCardClick = () => {
    navigate({ to: "/match/$matchId", params: { matchId: item.match_id } });
  };

  return (
    <div
      onClick={onCardClick}
      role="button"
      tabIndex={0}
      className="cursor-pointer active:opacity-80"
      style={{
        backgroundColor: "#1E293B",
        border: "0.5px solid #1E3A5F",
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
            <TeamLogo src={item.home_logo ?? ""} name={item.home_name ?? ""} size={28} rounded={4} />
            <span style={{ fontSize: 13, color: "#E2E8F0" }} className="flex-1 font-medium leading-tight">
              {item.home_name}
            </span>
          </div>
          <div className="flex items-center gap-[10px]">
            <TeamLogo src={item.away_logo ?? ""} name={item.away_name ?? ""} size={28} rounded={4} />
            <span style={{ fontSize: 13, color: "#E2E8F0" }} className="flex-1 font-medium leading-tight">
              {item.away_name}
            </span>
          </div>
          <div className="flex items-center gap-1" style={{ marginTop: 2 }}>
            {item.competition_logo && (
              <img
                src={item.competition_logo}
                alt=""
                width={16}
                height={16}
                style={{ objectFit: "contain" }}
              />
            )}
            <span style={{ fontSize: 11, color: "#475569" }}>{item.competition_name}</span>
          </div>
        </div>

        <div className="flex flex-col items-end justify-center" style={{ minWidth: 56 }}>
          {isFinished ? (
            <>
              <span className="font-display font-bold" style={{ fontSize: 16, color: "#FFFFFF", lineHeight: 1 }}>
                {item.score_home ?? 0} — {item.score_away ?? 0}
              </span>
              <span style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>Terminé</span>
            </>
          ) : isLive ? (
            <>
              <span className="font-display font-bold" style={{ fontSize: 16, color: "#FFFFFF", lineHeight: 1 }}>
                {item.score_home ?? 0} — {item.score_away ?? 0}
              </span>
              <span style={{ fontSize: 10, color: "#22C55E", marginTop: 4 }}>{status}</span>
            </>
          ) : (
            <span className="font-display font-bold" style={{ fontSize: 16, color: "#FFFFFF", lineHeight: 1 }}>
              {formatTime(item.kickoff_at)}
            </span>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-end">
        <button
          type="button"
          onClick={handleRemove}
          aria-label="Retirer de la watchlist"
          className="flex items-center justify-center"
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            backgroundColor: "#0F172A",
            border: "0.5px solid #1E3A5F",
          }}
        >
          <Eye size={16} color="#E8622A" />
        </button>
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
        Appuie sur l'icône 👁 sur un match pour le suivre
      </p>
    </div>
  );
}

function SignedOutState() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center px-6 text-center" style={{ minHeight: "60vh" }}>
      <Lock size={48} color="#1E3A5F" />
      <h2 className="font-display font-bold mt-4 text-white" style={{ fontSize: 16 }}>
        Connecte-toi pour suivre des matchs
      </h2>
      <p style={{ fontSize: 13, color: "#475569", maxWidth: 260, marginTop: 6 }}>
        Crée un compte pour retrouver tes matchs suivis ici.
      </p>
      <button
        type="button"
        onClick={() => navigate({ to: "/auth" })}
        style={{
          marginTop: 18,
          backgroundColor: "#E8622A",
          color: "#FFFFFF",
          borderRadius: 8,
          padding: "10px 20px",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        Se connecter
      </button>
    </div>
  );
}

function SkeletonCard() {
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
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

function FollowsPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<WatchlistRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id ?? null;
      if (cancelled) return;
      setUserId(uid);
      if (!uid) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("watchlist")
        .select("*")
        .eq("user_id", uid)
        .order("kickoff_at", { ascending: true });
      if (cancelled) return;
      if (error) {
        console.error("watchlist load failed", error);
      } else {
        setItems((data ?? []) as WatchlistRow[]);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Realtime subscription for live score updates
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("watchlist-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "watchlist",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const next = payload.new as WatchlistRow;
          setItems((prev) =>
            prev.map((it) => (it.match_id === next.match_id ? { ...it, ...next } : it))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleRemove = async (id: string) => {
    const target = items.find((it) => it.id === id);
    setItems((arr) => arr.filter((it) => it.id !== id));
    const { error } = await supabase.from("watchlist").delete().eq("id", id);
    if (error) {
      console.error("watchlist delete failed", error);
      toast.error("Suppression impossible");
      if (target) setItems((arr) => [...arr, target]);
    }
  };

  const TODAY = todayKey();
  const TOMORROW = offsetDateKey(1);

  const grouped = useMemo(() => {
    const byDate = new Map<string, WatchlistRow[]>();
    for (const it of items) {
      const key = dateKeyFromIso(it.kickoff_at);
      const arr = byDate.get(key) ?? [];
      arr.push(it);
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
  }, [items, TODAY, TOMORROW]);

  const total = items.length;
  const showCount = !loading && userId && total > 0;

  return (
    <div className="min-h-screen font-sans text-[#E2E8F0]" style={{ backgroundColor: "#0F172A" }}>
      <header className="flex items-center justify-between px-4 py-3">
        <h1 className="font-display font-bold text-white" style={{ fontSize: 18 }}>
          Suivis
        </h1>
        {showCount && (
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
            <SectionLabel>CHARGEMENT</SectionLabel>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : !userId ? (
          <SignedOutState />
        ) : total === 0 ? (
          <EmptyState />
        ) : (
          grouped.map((section) => (
            <section key={section.key}>
              <SectionLabel>{section.label}</SectionLabel>
              {section.items.map((it) => (
                <FollowCard key={it.id} item={it} onRemove={handleRemove} />
              ))}
            </section>
          ))
        )}
      </main>

      <BottomNav active="bookmark" />
    </div>
  );
}
