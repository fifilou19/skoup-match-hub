import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronRight, ArrowLeft, X } from "lucide-react";
import { BottomNav } from "@/components/skoup/BottomNav";
import { TeamLogo } from "@/components/skoup/TeamLogo";
import { MatchCard } from "@/components/skoup/MatchCard";
import { searchTeams, getTeamNextFixtures, type DtoTeamSearch } from "@/lib/apiFootball.functions";
import { dtoToMatch } from "@/lib/matchMapping";

export const Route = createFileRoute("/explorer")({
  head: () => ({
    meta: [
      { title: "SKOUP — Explorer" },
      { name: "description", content: "Recherchez une équipe et découvrez ses prochains matchs." },
      { property: "og:title", content: "SKOUP — Explorer" },
      { property: "og:description", content: "Recherchez une équipe et découvrez ses prochains matchs." },
    ],
  }),
  component: ExplorerPage,
});

function highlight(name: string, query: string) {
  const idx = name.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return name;
  return (
    <>
      {name.slice(0, idx)}
      <span style={{ color: "#E8622A" }}>{name.slice(idx, idx + query.length)}</span>
      {name.slice(idx + query.length)}
    </>
  );
}

function useDebounced<T>(value: T, ms = 350): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

const RECENT_KEY = "skoup:recentTeamSearches";
const MAX_RECENT = 6;

function loadRecent(): DtoTeamSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecent(items: DtoTeamSearch[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

function ExplorerPage() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [selected, setSelected] = useState<DtoTeamSearch | null>(null);
  const [recent, setRecent] = useState<DtoTeamSearch[]>([]);

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  const handleSelect = (t: DtoTeamSearch) => {
    setSelected(t);
    setRecent((prev) => {
      const next = [t, ...prev.filter((p) => p.id !== t.id)].slice(0, MAX_RECENT);
      saveRecent(next);
      return next;
    });
  };

  const clearRecent = () => {
    setRecent([]);
    saveRecent([]);
  };

  const debounced = useDebounced(query.trim(), 400);
  const fetchSearch = useServerFn(searchTeams);

  const { data, isFetching } = useQuery({
    queryKey: ["teamSearch", debounced],
    queryFn: () => fetchSearch({ data: { q: debounced } }),
    enabled: debounced.length >= 3 && !selected,
    staleTime: 5 * 60_000,
  });

  if (selected) {
    return <TeamResults team={selected} onBack={() => setSelected(null)} />;
  }

  const showSuggestions = debounced.length >= 3;

  return (
    <div className="min-h-screen font-sans text-[#E2E8F0]" style={{ backgroundColor: "#0F172A" }}>
      <header className="flex items-center px-4 py-3">
        <h1 className="font-display font-bold text-white" style={{ fontSize: 18 }}>
          Explorer
        </h1>
      </header>

      <div style={{ margin: "12px 16px 0" }}>
        <div
          className="flex items-center gap-2"
          style={{
            backgroundColor: "#1E293B",
            border: `0.5px solid ${focused ? "#E8622A" : "#1E3A5F"}`,
            borderRadius: 10,
            padding: "10px 14px",
            transition: "border-color 120ms",
          }}
        >
          <Search size={18} color="#475569" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Rechercher une équipe..."
            className="flex-1 bg-transparent outline-none placeholder:text-[#475569]"
            style={{ fontSize: 14, color: "#E2E8F0", caretColor: "#E8622A" }}
          />
        </div>
      </div>

      <main className="pb-24" style={{ marginTop: 20 }}>
        {!showSuggestions && recent.length === 0 && (
          <p style={{ fontSize: 13, color: "#64748B", margin: "0 16px" }}>
            Tapez au moins 3 lettres pour rechercher une équipe.
          </p>
        )}
        {!showSuggestions && recent.length > 0 && (
          <div>
            <div
              className="flex items-center justify-between uppercase"
              style={{ fontSize: 12, color: "#475569", letterSpacing: "0.05em", margin: "0 16px 8px" }}
            >
              <span>Recherches récentes</span>
              <button
                type="button"
                onClick={clearRecent}
                style={{ fontSize: 11, color: "#64748B", textTransform: "none", letterSpacing: 0 }}
                className="active:opacity-60"
              >
                Effacer
              </button>
            </div>
            <Suggestions items={recent} query="" onSelect={handleSelect} />
          </div>
        )}
        {showSuggestions && isFetching && (
          <p style={{ fontSize: 13, color: "#64748B", margin: "0 16px" }}>Recherche…</p>
        )}
        {showSuggestions && !isFetching && (
          <Suggestions
            items={data?.teams ?? []}
            query={debounced}
            onSelect={handleSelect}
          />
        )}
      </main>

      <BottomNav active="search" />
    </div>
  );
}

function Suggestions({
  items,
  query,
  onSelect,
}: {
  items: DtoTeamSearch[];
  query: string;
  onSelect: (t: DtoTeamSearch) => void;
}) {
  if (items.length === 0) {
    return (
      <p style={{ fontSize: 13, color: "#64748B", margin: "0 16px" }}>
        Aucun résultat pour « {query} »
      </p>
    );
  }
  return (
    <div
      style={{
        margin: "0 16px",
        backgroundColor: "#1E293B",
        border: "0.5px solid #1E3A5F",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      {items.map((t, i) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onSelect(t)}
          className="flex w-full items-center gap-3 px-3 py-3 text-left active:bg-white/5"
          style={{ borderTop: i === 0 ? "none" : "0.5px solid #1E3A5F" }}
        >
          <TeamLogo src={t.logo} name={t.name} size={32} rounded={6} />
          <div className="flex flex-1 flex-col">
            <span style={{ fontSize: 13, color: "#FFFFFF" }} className="font-bold">
              {highlight(t.name, query)}
            </span>
            <span style={{ fontSize: 11, color: "#64748B" }}>{t.country}</span>
          </div>
          <ChevronRight size={16} color="#475569" />
        </button>
      ))}
    </div>
  );
}

function TeamResults({ team, onBack }: { team: DtoTeamSearch; onBack: () => void }) {
  const fetchNext = useServerFn(getTeamNextFixtures);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["teamNext", team.id],
    queryFn: () => fetchNext({ data: { teamId: team.id, next: 5 } }),
    staleTime: 5 * 60_000,
  });
  const matches = useMemo(() => (data?.matches ?? []).map(dtoToMatch), [data]);

  return (
    <div className="min-h-screen font-sans text-[#E2E8F0]" style={{ backgroundColor: "#0F172A" }}>
      <header className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Retour"
          className="flex h-9 w-9 items-center justify-center rounded-full active:bg-white/5"
        >
          <ArrowLeft size={20} color="#94A3B8" />
        </button>
        <TeamLogo src={team.logo} name={team.name} size={44} rounded={8} />
        <div className="flex flex-col">
          <h1 className="font-display font-bold text-white" style={{ fontSize: 18 }}>
            {team.name}
          </h1>
          <span style={{ fontSize: 12, color: "#64748B" }}>{team.country}</span>
        </div>
      </header>

      <main className="pb-24" style={{ marginTop: 12 }}>
        <h2
          style={{ fontSize: 12, color: "#475569", letterSpacing: "0.05em", margin: "0 16px 8px" }}
          className="uppercase"
        >
          Prochains matchs
        </h2>
        {isLoading && (
          <p style={{ fontSize: 13, color: "#64748B", margin: "0 16px" }}>Chargement…</p>
        )}
        {isError && (
          <p style={{ fontSize: 13, color: "#EF4444", margin: "0 16px" }}>
            Erreur de chargement.
          </p>
        )}
        {!isLoading && !isError && matches.length === 0 && (
          <p style={{ fontSize: 13, color: "#64748B", margin: "0 16px" }}>
            Aucun match programmé.
          </p>
        )}
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </main>

      <BottomNav active="search" />
    </div>
  );
}
