import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ALL_COUNTRIES, FRANCOPHONE_AFRICA, OTHER_COUNTRIES } from "@/lib/countries";

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

type Mode = "email" | "phone";

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

function SignupPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("email");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [dial, setDial] = useState("+225");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pwdValid = password.length >= 8;
  const match = confirm.length === 0 || confirm === password;
  const identityValid = mode === "email" ? !!email && !!country : !!phone.trim();
  const valid = !!username && identityValid && pwdValid && password === confirm;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setError(null);
    setLoading(true);
    try {
      const fullPhone = mode === "phone" ? `${dial}${phone.replace(/\s+/g, "")}` : undefined;
      const { error } = await supabase.auth.signUp({
        ...(mode === "email" ? { email } : { phone: fullPhone! }),
        password,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
          data: {
            username,
            country: country || null,
            phone: fullPhone || null,
          },
        },
      });
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("registered") || msg.includes("exists") || msg.includes("already")) {
          setError(mode === "email" ? "Cet email est déjà associé à un compte" : "Ce numéro est déjà associé à un compte");
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
    <div className="min-h-screen font-sans" style={{ backgroundColor: "#0F172A", color: "#E2E8F0" }}>
      <header className="relative flex items-center justify-center" style={{ paddingTop: 40, paddingBottom: 8 }}>
        <button
          onClick={() => navigate({ to: "/login" })}
          aria-label="Retour"
          style={{ position: "absolute", left: 16, top: 40, color: "#94A3B8" }}
        >
          <ArrowLeft size={22} />
        </button>
        <div className="text-center">
          <h1 className="font-display font-bold text-white" style={{ fontSize: 28 }}>SKOUP</h1>
          <p style={{ fontSize: 14, color: "#475569", marginTop: 4 }}>Crée ton compte</p>
        </div>
      </header>

      <form onSubmit={onSubmit} style={{ marginTop: 24, padding: "0 24px" }} className="flex flex-col gap-4">
        {/* Tabs */}
        <div style={{ display: "flex", gap: 8 }}>
          <TabButton active={mode === "email"} onClick={() => setMode("email")}>Email</TabButton>
          <TabButton active={mode === "phone"} onClick={() => setMode("phone")}>Numéro de téléphone</TabButton>
        </div>

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

        {mode === "email" ? (
          <>
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
            <Field label="Pays">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                style={{ ...inputBase, appearance: "none", cursor: "pointer", color: country ? "#FFFFFF" : "#64748B" }}
                required
              >
                <option value="" disabled>Sélectionne ton pays</option>
                <optgroup label="Afrique francophone">
                  {FRANCOPHONE_AFRICA.map((c) => (
                    <option key={c.code} value={c.name} style={{ color: "#000" }}>{c.flag} {c.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Autres pays">
                  {OTHER_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.name} style={{ color: "#000" }}>{c.flag} {c.name}</option>
                  ))}
                </optgroup>
              </select>
            </Field>
          </>
        ) : (
          <Field label="Numéro de téléphone">
            <div style={{ display: "flex", gap: 8 }}>
              <select
                value={dial}
                onChange={(e) => setDial(e.target.value)}
                style={{
                  ...inputBase,
                  width: "30%",
                  appearance: "none",
                  cursor: "pointer",
                  paddingLeft: 10,
                  paddingRight: 10,
                }}
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
                onFocus={focusStyle}
                onBlur={blurStyle}
                placeholder="XX XX XX XX XX"
                style={{ ...inputBase, width: "70%" }}
                required
              />
            </div>
          </Field>
        )}

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
              style={{ ...inputBase, paddingRight: 44, borderColor: !match ? "#EF4444" : "#1E3A5F" }}
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

        {error && <p style={{ fontSize: 12, color: "#EF4444", textAlign: "center" }}>{error}</p>}

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


        <p style={{ textAlign: "center", fontSize: 13, color: "#94A3B8", marginTop: 12, paddingBottom: 32 }}>
          Déjà un compte ?{" "}
          <Link to="/login" style={{ color: "#E8622A", textDecoration: "underline" }}>Se connecter</Link>
        </p>
      </form>
    </div>
  );
}
