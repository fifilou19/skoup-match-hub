import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ALL_COUNTRIES } from "@/lib/countries";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "SKOUP — Connexion" },
      { name: "description", content: "Connectez-vous à SKOUP." },
    ],
  }),
  component: LoginPage,
});

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#1E293B",
  border: "0.5px solid #1E3A5F",
  borderRadius: 8,
  padding: 14,
  color: "#FFFFFF",
  fontSize: 14,
  outline: "none",
};

type Mode = "email" | "phone";

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: "10px 12px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        background: active ? "#E8622A" : "transparent",
        color: active ? "#FFFFFF" : "#64748B",
        border: active ? "0.5px solid #E8622A" : "0.5px solid #1E3A5F",
      }}
    >
      {children}
    </button>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("email");
  const [email, setEmail] = useState("");
  const [dial, setDial] = useState("+225");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const identityValid = mode === "email" ? !!email : !!phone.trim();
  const canSubmit = identityValid && !!password;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const credentials =
        mode === "email"
          ? { email, password }
          : { phone: `${dial}${phone.replace(/\s+/g, "")}`, password };
      const { error } = await supabase.auth.signInWithPassword(credentials);
      if (error) {
        if (error.message.toLowerCase().includes("invalid")) {
          setError(mode === "email" ? "Email ou mot de passe incorrect" : "Numéro ou mot de passe incorrect");
        } else {
          setError(error.message);
        }
        return;
      }
      navigate({ to: "/" });
    } catch {
      setError("Vérifie ta connexion internet");
    } finally {
      setLoading(false);
    }
  };

  const onForgot = async () => {
    if (mode !== "email" || !email) {
      toast("Entre ton email d'abord");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
    });
    if (error) toast.error(error.message);
    else toast.success("Email de réinitialisation envoyé");
  };

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: "#0F172A", color: "#E2E8F0" }}>
      <div style={{ paddingTop: 80 }} className="text-center">
        <h1 className="font-display font-bold text-white" style={{ fontSize: 32, letterSpacing: 3 }}>
          SKOUP
        </h1>
        <p style={{ fontSize: 14, color: "#475569", fontStyle: "italic", marginTop: 8 }}>
          Le bon événement, au bon moment.
        </p>
      </div>

      <form onSubmit={onSubmit} style={{ marginTop: 40, padding: "0 24px" }} className="flex flex-col gap-4">
        <div style={{ display: "flex", gap: 8 }}>
          <TabButton active={mode === "email"} onClick={() => setMode("email")}>Email</TabButton>
          <TabButton active={mode === "phone"} onClick={() => setMode("phone")}>Numéro</TabButton>
        </div>

        {mode === "email" ? (
          <div>
            <label style={{ fontSize: 11, color: "#475569" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#E8622A")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1E3A5F")}
              style={{ ...inputStyle, marginTop: 6 }}
              required
            />
          </div>
        ) : (
          <div>
            <label style={{ fontSize: 11, color: "#475569" }}>Numéro de téléphone</label>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <select
                value={dial}
                onChange={(e) => setDial(e.target.value)}
                style={{ ...inputStyle, width: "30%", appearance: "none", cursor: "pointer", paddingLeft: 10, paddingRight: 10 }}
              >
                {ALL_COUNTRIES.map((c, i) => (
                  <option key={`${c.code}-${i}`} value={c.dial} style={{ color: "#000" }}>
                    {c.flag} {c.dial}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#E8622A")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#1E3A5F")}
                placeholder="XX XX XX XX XX"
                style={{ ...inputStyle, width: "70%" }}
                required
              />
            </div>
          </div>
        )}

        <div>
          <label style={{ fontSize: 11, color: "#475569" }}>Mot de passe</label>
          <div style={{ position: "relative", marginTop: 6 }}>
            <input
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#E8622A")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#1E3A5F")}
              style={{ ...inputStyle, paddingRight: 44 }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }}
              aria-label={showPwd ? "Masquer" : "Afficher"}
            >
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="flex justify-end" style={{ marginTop: 8 }}>
            <button type="button" onClick={onForgot} style={{ fontSize: 12, color: "#E8622A" }}>
              Mot de passe oublié ?
            </button>
          </div>
        </div>

        {error && <p style={{ fontSize: 12, color: "#EF4444", textAlign: "center" }}>{error}</p>}

        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="font-display font-bold"
          style={{
            background: "#E8622A",
            color: "#FFFFFF",
            width: "100%",
            borderRadius: 8,
            padding: 14,
            fontSize: 15,
            marginTop: 8,
            opacity: loading || !canSubmit ? 0.5 : 1,
          }}
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>

        <div className="flex items-center" style={{ margin: "20px 0", gap: 12 }}>
          <div style={{ flex: 1, height: 0, borderTop: "0.5px solid #1E3A5F" }} />
          <span style={{ color: "#475569", fontSize: 12 }}>ou</span>
          <div style={{ flex: 1, height: 0, borderTop: "0.5px solid #1E3A5F" }} />
        </div>

        <p style={{ textAlign: "center", fontSize: 13, color: "#94A3B8" }}>
          Pas encore de compte ?{" "}
          <Link to="/signup" style={{ color: "#E8622A", textDecoration: "underline" }}>
            S'inscrire
          </Link>
        </p>
      </form>
    </div>
  );
}
