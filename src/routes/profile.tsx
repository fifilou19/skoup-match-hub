import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Lock, ChevronRight, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "SKOUP — Mon profil" },
      { name: "description", content: "Gère tes informations personnelles SKOUP." },
    ],
  }),
  component: ProfilePage,
});

interface FieldProps {
  label: string;
  value: string;
  onSave: (v: string) => void | Promise<void>;
  type?: string;
  editable?: boolean;
}

function EditableField({ label, value, onSave, type = "text", editable = true }: FieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (!editable) {
    return (
      <div className="flex w-full items-center px-4 py-3">
        <div className="flex-1">
          <div style={{ fontSize: 11, color: "#475569" }}>{label}</div>
          <div style={{ fontSize: 13, color: "#FFFFFF", marginTop: 2 }}>{value}</div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => !editing && setEditing(true)}
      className="flex w-full items-center px-4 py-3 text-left active:bg-white/5"
    >
      <div className="flex-1">
        <div style={{ fontSize: 11, color: "#475569" }}>{label}</div>
        {editing ? (
          <input
            autoFocus
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            style={{
              fontSize: 13,
              color: "#FFFFFF",
              backgroundColor: "#0F172A",
              border: "0.5px solid #1E3A5F",
              borderRadius: 6,
              padding: "6px 8px",
              marginTop: 2,
              width: "100%",
            }}
          />
        ) : (
          <div style={{ fontSize: 13, color: "#FFFFFF", marginTop: 2 }}>{value}</div>
        )}
      </div>
      {editing ? (
        <span
          onClick={(e) => {
            e.stopPropagation();
            save();
          }}
          style={{
            backgroundColor: "#E8622A",
            color: "#FFFFFF",
            borderRadius: 6,
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 500,
            marginLeft: 8,
          }}
        >
          Enregistrer
        </span>
      ) : (
        <Pencil size={14} color="#475569" />
      )}
    </button>
  );
}

function Divider() {
  return <div style={{ height: "0.5px", backgroundColor: "#1E3A5F" }} />;
}

function ProfilePage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return;
      setUserId(user.id);
      setEmail(user.email ?? "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, phone, country")
        .eq("id", user.id)
        .maybeSingle();
      setName(profile?.username ?? "");
      setPhone(user.phone ?? profile?.phone ?? "");
    })();
  }, []);

  const saveUsername = async (newUsername: string) => {
    if (!userId) {
      toast.error("Tu dois être connecté");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .upsert(
        { id: userId, username: newUsername, updated_at: new Date().toISOString() },
        { onConflict: "id" },
      );
    if (error) {
      toast.error("Erreur lors de la sauvegarde");
      throw error;
    }
    setName(newUsername);
    toast.success("Nom d'utilisateur mis à jour ✓");
  };

  return (
    <div className="min-h-screen font-sans text-[#E2E8F0]" style={{ backgroundColor: "#0F172A" }}>
      <header className="flex items-center px-4 py-3">
        <button
          type="button"
          aria-label="Retour"
          onClick={() => navigate({ to: "/settings" })}
          className="flex h-9 w-9 items-center justify-center"
        >
          <ArrowLeft size={20} color="#94A3B8" />
        </button>
        <h1
          className="absolute left-1/2 -translate-x-1/2 font-display font-bold text-white"
          style={{ fontSize: 18 }}
        >
          Mon profil
        </h1>
      </header>

      <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 pb-24">
        <section
          style={{
            backgroundColor: "#1E293B",
            border: "0.5px solid #1E3A5F",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <EditableField label="Nom d'utilisateur" value={name} onSave={saveUsername} />
          <Divider />
          <EditableField label="Email" value={email} onSave={setEmail} type="email" editable={false} />
          <Divider />
          <EditableField label="Téléphone" value={phone} onSave={setPhone} type="tel" editable={false} />
        </section>

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
            Sécurité
          </h2>
          <div
            style={{
              backgroundColor: "#1E293B",
              border: "0.5px solid #1E3A5F",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={() => setShowPwd(true)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-white/5"
            >
              <Lock size={20} color="#64748B" />
              <span className="flex-1" style={{ fontSize: 13, color: "#FFFFFF" }}>
                Changer le mot de passe
              </span>
              <ChevronRight size={16} color="#475569" />
            </button>
          </div>
        </div>
      </main>

      {showPwd && <PasswordSheet onClose={() => setShowPwd(false)} />}
    </div>
  );
}

function PasswordSheet({ onClose }: { onClose: () => void }) {
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const nextTooShort = next.length > 0 && next.length < 8;
  const mismatch = confirm.length > 0 && confirm !== next;
  const valid = next.length >= 8 && confirm === next;

  const handleChangePassword = async () => {
    if (next.length < 8) {
      setPasswordError("Minimum 8 caractères");
      return;
    }
    if (next !== confirm) {
      setPasswordError("Les mots de passe ne correspondent pas");
      return;
    }
    setIsLoading(true);
    setPasswordError("");
    try {
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) {
        setPasswordError("Erreur : " + error.message);
      } else {
        toast.success("Mot de passe modifié avec succès ✓");
        setNext("");
        setConfirm("");
        onClose();
      }
    } catch (e) {
      setPasswordError("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ backgroundColor: "rgba(11, 31, 58, 0.8)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full"
        style={{
          backgroundColor: "#1E293B",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          borderTop: "0.5px solid #1E3A5F",
          padding: 16,
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
        }}
      >
        <h3 className="font-display font-bold text-white" style={{ fontSize: 16, marginBottom: 12 }}>
          Changer le mot de passe
        </h3>

        <PwdInput
          label="Nouveau mot de passe"
          value={next}
          onChange={setNext}
          visible={showNext}
          onToggle={() => setShowNext((v) => !v)}
          borderColor={
            nextTooShort ? "#EF4444" : next.length >= 8 ? "#22C55E" : "#1E3A5F"
          }
          error={nextTooShort ? "Minimum 8 caractères" : undefined}
        />

        <PwdInput
          label="Confirmer le nouveau mot de passe"
          value={confirm}
          onChange={setConfirm}
          visible={showConfirm}
          onToggle={() => setShowConfirm((v) => !v)}
          borderColor={
            mismatch ? "#EF4444" : confirm.length > 0 && confirm === next ? "#22C55E" : "#1E3A5F"
          }
          error={mismatch ? "Les mots de passe ne correspondent pas" : undefined}
        />

        {passwordError && (
          <p style={{ fontSize: 12, color: "#EF4444", marginBottom: 8 }}>
            {passwordError}
          </p>
        )}

        <button
          type="button"
          disabled={!valid || isLoading}
          onClick={handleChangePassword}
          className="w-full"
          style={{
            backgroundColor: valid && !isLoading ? "#E8622A" : "#1E3A5F",
            color: valid && !isLoading ? "#FFFFFF" : "#64748B",
            borderRadius: 8,
            padding: 14,
            fontSize: 14,
            fontWeight: 500,
            marginTop: 8,
            opacity: valid && !isLoading ? 1 : 0.6,
          }}
        >
          {isLoading ? "Modification…" : "Modifier le mot de passe"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="w-full"
          style={{
            backgroundColor: "transparent",
            color: "#64748B",
            padding: 10,
            fontSize: 13,
            marginTop: 4,
          }}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

function PwdInput({
  label,
  value,
  onChange,
  visible,
  onToggle,
  borderColor = "#1E3A5F",
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  onToggle: () => void;
  borderColor?: string;
  error?: string;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, color: "#475569", display: "block", marginBottom: 4 }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            backgroundColor: "#0F172A",
            border: `0.5px solid ${borderColor}`,
            borderRadius: 8,
            padding: 12,
            paddingRight: 40,
            color: "#FFFFFF",
            fontSize: 13,
          }}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? "Masquer" : "Afficher"}
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          {visible ? <EyeOff size={16} color="#64748B" /> : <Eye size={16} color="#64748B" />}
        </button>
      </div>
      {error && (
        <p style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>{error}</p>
      )}
    </div>
  );
}
