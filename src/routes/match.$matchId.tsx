import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/match/$matchId")({
  component: MatchDetail,
});

function MatchDetail() {
  const { matchId } = Route.useParams();
  return (
    <div
      className="min-h-screen px-4 py-6 font-sans text-[#E2E8F0]"
      style={{ backgroundColor: "#0F172A" }}
    >
      <Link to="/" className="inline-flex items-center gap-2 text-[#94A3B8]">
        <ArrowLeft size={18} />
        <span className="text-sm">Retour</span>
      </Link>
      <h1 className="mt-6 font-display text-2xl font-bold text-white">
        Match {matchId}
      </h1>
      <p className="mt-2 text-sm text-[#94A3B8]">Détails du match à venir.</p>
    </div>
  );
}
