import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "SKOUP — Inscription" },
      { name: "description", content: "Crée ton compte SKOUP." },
    ],
  }),
  component: SignupPage,
});

const inputBase: React.CSSProperties = {
  width: "100%",
  background: "#1E293B",
  border: "0.5px solid #1E3A5F",
  borderRadius: 8,
  padding: 14,
  color: "#FFFFFF",
  fontSize: 14,
  outline: "none",
};

function Field({
  label,
  children,
  hint,
  hintColor = "#475569",
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  hintColor?: string;
}) {
  return (
    <div>
      <label style={{ fontSize: 11, color: "#475569" }}>{label}</label>
      <div style={{ marginTop: 6 }}>{children}</div>
      {hint && <p style={{ fontSize: 10, color: hintColor, marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

function SignupPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pwdValid = password.length >= 8;
  const match = confirm.length === 0 || confirm === password;
  const valid = username && email && pwdValid && password === confirm;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
          data: { username, phone: phone || null },
        },
      });
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("registered") || msg.includes("exists")) {
          setError("Cet email est déjà associé à un compte");
        } else {
          setError(error.message);
        }
        return;
      }
      toast.success("Bienvenue sur SKOUP 🎯", { style: { background: "#065F46", color: "#fff" } });
      navigate({ to: "/" });
    } catch {
      setError("Vérifie ta connexion internet");
    } finally {
      setLoading(false);
    }
  };

  const focusStyle = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = "#E8622A");
  const blurStyle = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = "#1E3A5F");

  return (
    <div
      className="min-h-screen font-sans"
      style={{ backgroundColor: "#0F172A", color: "#E2E8F0" }}
    >
      <header className="relative flex items-center justify-center" style={{ paddingTop: 40, paddingBottom: 8 }}>
        <button
          onClick={() => navigate({ to: "/login" })}
          aria-label="Retour"
          style={{ position: "absolute", left: 16, top: 40, color: "#94A3B8" }}
        >
          <ArrowLeft size={22} />
        </button>
        <div className="text-center">
          <h1 className="font-display font-bold text-white" style={{ fontSize: 28 }}>
            SKOUP
          </h1>
          <p style={{ fontSize: 14, color: "#475569", marginTop: 4 }}>Crée ton compte</p>
        </div>
      </header>

      <form
        onSubmit={onSubmit}
        style={{ marginTop: 32, padding: "0 24px" }}
        className="flex flex-col gap-4"
      >
        <Field label="Nom d'utilisateur">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onFocus={focusStyle}
            onBlur={blurStyle}
            style={inputBase}
            required
          />
        </Field>

        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={focusStyle}
            onBlur={blurStyle}
            style={inputBase}
            required
          />
        </Field>

        <Field label="Téléphone (optionnel)">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onFocus={focusStyle}
            onBlur={blurStyle}
            placeholder="+225 XX XX XX XX XX"
            style={inputBase}
          />
        </Field>

        <Field label="Mot de passe" hint="Minimum 8 caractères">
          <div style={{ position: "relative" }}>
            <input
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={focusStyle}
              onBlur={blurStyle}
              style={{ ...inputBase, paddingRight: 44 }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }}
            >
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </Field>

        <Field
          label="Confirmer le mot de passe"
          hint={!match ? "Les mots de passe ne correspondent pas" : undefined}
          hintColor="#EF4444"
        >
          <div style={{ position: "relative" }}>
            <input
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onFocus={focusStyle}
              onBlur={blurStyle}
              style={{
                ...inputBase,
                paddingRight: 44,
                borderColor: !match ? "#EF4444" : "#1E3A5F",
              }}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </Field>

        {error && (
          <p style={{ fontSize: 12, color: "#EF4444", textAlign: "center" }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={!valid || loading}
          className="font-display font-bold"
          style={{
            background: "#E8622A",
            color: "#FFFFFF",
            width: "100%",
            borderRadius: 8,
            padding: 14,
            fontSize: 15,
            marginTop: 8,
            opacity: !valid || loading ? 0.5 : 1,
            cursor: !valid || loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Création…" : "Créer mon compte"}
        </button>

        <p style={{ textAlign: "center", fontSize: 13, color: "#94A3B8", marginTop: 16, paddingBottom: 32 }}>
          Déjà un compte ?{" "}
          <Link to="/login" style={{ color: "#E8622A", textDecoration: "underline" }}>
            Se connecter
          </Link>
        </p>
      </form>
    </div>
  );
}
