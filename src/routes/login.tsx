import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.toLowerCase().includes("invalid")) {
          setError("Email ou mot de passe incorrect");
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
    if (!email) {
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
        <h1
          className="font-display font-bold text-white"
          style={{ fontSize: 32, letterSpacing: 3 }}
        >
          SKOUP
        </h1>
        <p style={{ fontSize: 14, color: "#475569", fontStyle: "italic", marginTop: 8 }}>
          Le bon événement, au bon moment.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        style={{ marginTop: 48, padding: "0 24px" }}
        className="flex flex-col gap-4"
      >
        <div>
          <label style={{ fontSize: 11, color: "#475569" }}>Email ou téléphone</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#E8622A")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#1E3A5F")}
            style={{ ...inputStyle, marginTop: 6 }}
            required
          />
        </div>

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
            <button
              type="button"
              onClick={onForgot}
              style={{ fontSize: 12, color: "#E8622A" }}
            >
              Mot de passe oublié ?
            </button>
          </div>
        </div>

        {error && (
          <p style={{ fontSize: 12, color: "#EF4444", textAlign: "center" }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="font-display font-bold"
          style={{
            background: "#E8622A",
            color: "#FFFFFF",
            width: "100%",
            borderRadius: 8,
            padding: 14,
            fontSize: 15,
            marginTop: 8,
            opacity: loading || !email || !password ? 0.5 : 1,
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
