import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Share2, HelpCircle, LogOut, ChevronRight } from "lucide-react";
import { BottomNav } from "@/components/skoup/BottomNav";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "SKOUP — Paramètres" },
      { name: "description", content: "Gérez votre profil, abonnement et préférences SKOUP." },
      { property: "og:title", content: "SKOUP — Paramètres" },
      {
        property: "og:description",
        content: "Gérez votre profil, abonnement et préférences SKOUP.",
      },
    ],
  }),
  component: SettingsPage,
});

const SHARE_TEXT =
  "J'utilise SKOUP pour mes pronostics foot 🎯\nLe bon événement, au bon moment.\nTélécharge l'app : https://skoup.app";

function SettingsPage() {
  const navigate = useNavigate();
  const [showPlans, setShowPlans] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [isAuthed, setIsAuthed] = useState<boolean>(false);
  const [quotaUsed, setQuotaUsed] = useState<number>(0);
  const quotaMax = 3;

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      const userEmail = sessionData?.session?.user?.email ?? "";
      if (!userId) {
        setIsAuthed(false);
        return;
      }
      setIsAuthed(true);
      setEmail(userEmail);

      const [{ data: profile }, { data: quota }] = await Promise.all([
        supabase
          .from("profiles")
          .select("username, country")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("daily_quota")
          .select("count")
          .eq("user_id", userId)
          .eq("quota_date", new Date().toISOString().split("T")[0])
          .maybeSingle(),
      ]);
      setUsername(profile?.username ?? "");
      setCountry(profile?.country ?? "");
      setQuotaUsed(quota?.count ?? 0);
    })();
  }, []);

  const initials = username
    ? username
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : email?.[0]?.toUpperCase() || "?";


  const onShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "SKOUP", text: SHARE_TEXT });
      } else {
        await navigator.clipboard.writeText(SHARE_TEXT);
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div
      className="min-h-screen font-sans text-[#E2E8F0]"
      style={{ backgroundColor: "#0F172A" }}
    >
      <header className="flex items-center px-4 py-3">
        <h1 className="font-display font-bold text-white" style={{ fontSize: 18 }}>
          Paramètres
        </h1>
      </header>

      <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 pb-24">
        {/* Profile */}
        <button
          type="button"
          onClick={() => navigate({ to: "/profile" })}
          style={{
            backgroundColor: "#1E293B",
            border: "0.5px solid #1E3A5F",
            borderRadius: 12,
            padding: 16,
          }}
          className="flex w-full items-center text-left active:bg-white/5"
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: 48,
              height: 48,
              borderRadius: 999,
              backgroundColor: "#0B1F3A",
              border: "1.5px solid #1E3A5F",
            }}
          >
            <span className="font-display font-bold text-white" style={{ fontSize: 18 }}>
              {initials}
            </span>
          </div>
          <div className="ml-3 flex flex-1 flex-col min-w-0">
            <span className="truncate" style={{ fontSize: 14, color: "#FFFFFF", fontWeight: 500 }}>
              {username || (isAuthed ? "Utilisateur" : "Invité")}
            </span>
            <span className="truncate" style={{ fontSize: 12, color: "#64748B" }}>{email || "—"}</span>
            {country && (
              <span className="truncate" style={{ fontSize: 11, color: "#475569" }}>{country}</span>
            )}
          </div>
          <ChevronRight size={16} color="#475569" className="ml-2 shrink-0" />
        </button>

        {/* Subscription — FREE */}
        <section
          style={{
            backgroundColor: "#0F172A",
            border: "1px solid #1E3A5F",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <span
            style={{
              backgroundColor: "#1E293B",
              color: "#64748B",
              border: "0.5px solid #1E3A5F",
              borderRadius: 6,
              fontSize: 10,
              padding: "2px 8px",
              fontWeight: 600,
            }}
            className="inline-block uppercase"
          >
            Free
          </span>
          <p style={{ fontSize: 13, color: "#FFFFFF", marginTop: 4 }}>Plan gratuit</p>
          <p style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
            2 / 3 analyses utilisées aujourd'hui
          </p>
          <div className="mt-2 flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: i < 2 ? "#E8622A" : "#1E3A5F",
                }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowPlans(true)}
            className="w-full active:opacity-80"
            style={{
              backgroundColor: "#E8622A",
              color: "#FFFFFF",
              borderRadius: 8,
              padding: 12,
              fontSize: 13,
              fontWeight: 500,
              marginTop: 12,
            }}
          >
            Passer à Premium : 1 990 FCFA / mois
          </button>
        </section>

        {/*
        // PREMIUM variant
        <section
          style={{
            backgroundColor: "#0F2E1A",
            border: "1px solid #22C55E",
            borderRadius: 12,
            margin: "0 16px",
            padding: 16,
          }}
        >
          <span style={{ backgroundColor: "#22C55E", color: "#0F2E1A", borderRadius: 6, fontSize: 10, padding: "2px 8px", fontWeight: 600 }}>PREMIUM</span>
          <p style={{ fontSize: 13, color: "#FFFFFF", marginTop: 4 }}>Plan Mensuel</p>
          <p style={{ fontSize: 12, color: "#64748B" }}>Renouvellement le 15 juillet 2026</p>
          <button
            type="button"
            className="w-full"
            style={{ backgroundColor: "transparent", border: "0.5px solid #22C55E", color: "#22C55E", borderRadius: 8, padding: 10, fontSize: 12, marginTop: 10 }}
          >
            Passer à l'annuel · économise 25%
          </button>
        </section>
        */}

        {/* Account */}
        <div>
          <h2
            className="uppercase"
            style={{
              fontSize: 10,
              color: "#475569",
              letterSpacing: "0.08em",
              margin: "20px 0 8px",
            }}
          >
            Compte
          </h2>
          <div
            style={{
              backgroundColor: "#1E293B",
              border: "0.5px solid #1E3A5F",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <Row
              icon={<Share2 size={18} color="#94A3B8" />}
              label="Partager SKOUP"
              onClick={onShare}
            />
            <Divider />
            <Row
              icon={<HelpCircle size={18} color="#94A3B8" />}
              label="Support & FAQ"
              right={<ChevronRight size={16} color="#475569" />}
            />
            <Divider />
            <Row
              icon={<LogOut size={18} color="#EF4444" />}
              label="Se déconnecter"
              labelColor="#EF4444"
              onClick={() => setShowLogout(true)}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex flex-col items-center"
          style={{ marginTop: 24, marginBottom: 32 }}
        >
          <span style={{ fontSize: 11, color: "#1E3A5F" }}>SKOUP v1.0</span>
          <span style={{ fontSize: 11, color: "#1E3A5F", fontStyle: "italic" }}>
            Le bon événement, au bon moment.
          </span>
        </div>
      </main>

      {showPlans && <PlansSheet onClose={() => setShowPlans(false)} />}
      {showLogout && (
        <LogoutDialog
          onCancel={() => setShowLogout(false)}
          onConfirm={() => setShowLogout(false)}
        />
      )}

      <BottomNav active="settings" />
    </div>
  );
}

function Row({
  icon,
  label,
  right,
  onClick,
  labelColor = "#E2E8F0",
}: {
  icon: React.ReactNode;
  label: string;
  right?: React.ReactNode;
  onClick?: () => void;
  labelColor?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-white/5"
    >
      {icon}
      <span className="flex-1" style={{ fontSize: 13, color: labelColor }}>
        {label}
      </span>
      {right}
    </button>
  );
}

function Divider() {
  return <div style={{ height: "0.5px", backgroundColor: "#1E3A5F" }} />;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  save?: string;
}
const PLANS: Plan[] = [
  { id: "m", name: "Mensuel", price: "1 990 FCFA / mois" },
  { id: "q", name: "Trimestriel", price: "4 990 FCFA / 3 mois", save: "Économise 15%" },
  { id: "y", name: "Annuel", price: "17 900 FCFA / an", save: "Économise 25%" },
];

function PlansSheet({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ backgroundColor: "rgba(11, 31, 58, 0.8)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full animate-[fade-in_0.2s_ease-out]"
        style={{
          backgroundColor: "#1E293B",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          borderTop: "0.5px solid #1E3A5F",
          padding: 16,
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
        }}
      >
        <div className="flex items-center justify-between pb-3">
          <h3 className="font-display font-bold text-white" style={{ fontSize: 16 }}>
            Choisis ton plan
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={{ color: "#94A3B8", fontSize: 20, lineHeight: 1 }}
          >
            ×
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {PLANS.map((p) => (
            <div
              key={p.id}
              style={{
                backgroundColor: "#0F172A",
                border: "0.5px solid #1E3A5F",
                borderRadius: 12,
                padding: 12,
              }}
            >
              <div className="flex items-baseline justify-between">
                <span className="font-display font-bold text-white" style={{ fontSize: 14 }}>
                  {p.name}
                </span>
                {p.save && (
                  <span style={{ fontSize: 10, color: "#22C55E" }}>{p.save}</span>
                )}
              </div>
              <p style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{p.price}</p>
              <button
                type="button"
                className="mt-2 w-full"
                style={{
                  backgroundColor: "#E8622A",
                  color: "#FFFFFF",
                  borderRadius: 8,
                  padding: 10,
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Payer avec Wave
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LogoutDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ backgroundColor: "rgba(11, 31, 58, 0.8)" }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#1E293B",
          border: "0.5px solid #1E3A5F",
          borderRadius: 12,
          padding: 20,
          width: "100%",
          maxWidth: 320,
        }}
      >
        <h3 className="font-display font-bold text-white" style={{ fontSize: 15 }}>
          Déconnexion
        </h3>
        <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 6 }}>
          Tu vas être déconnecté. Continuer ?
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1"
            style={{
              backgroundColor: "#0F172A",
              color: "#94A3B8",
              border: "0.5px solid #1E3A5F",
              borderRadius: 8,
              padding: 10,
              fontSize: 13,
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1"
            style={{
              backgroundColor: "#EF4444",
              color: "#FFFFFF",
              borderRadius: 8,
              padding: 10,
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
