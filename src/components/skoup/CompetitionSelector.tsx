import { useState } from "react";
import { ChevronDown, Globe, X } from "lucide-react";
import { TeamLogo } from "./TeamLogo";
import type { Competition } from "@/data/matches";

export function CompetitionSelector({
  competitions,
  value,
  onChange,
}: {
  competitions: Competition[];
  value: string; // 'all' or competition id
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = competitions.find((c) => c.id === value);

  return (
    <>
      <div className="px-4 pb-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-2"
          style={{
            backgroundColor: "#1E293B",
            border: "0.5px solid #1E3A5F",
            borderRadius: 8,
            padding: "8px 12px",
          }}
        >
          {selected ? (
            <TeamLogo src={selected.logo} name={selected.name} size={24} rounded={4} />
          ) : (
            <div
              className="flex items-center justify-center"
              style={{ width: 24, height: 24 }}
            >
              <Globe size={20} className="text-[#94A3B8]" />
            </div>
          )}
          <span className="flex-1 text-left text-sm" style={{ color: "#94A3B8" }}>
            {selected ? selected.name : "Toutes les compétitions"}
          </span>
          <ChevronDown size={18} className="text-[#94A3B8]" />
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ backgroundColor: "rgba(11, 31, 58, 0.8)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full animate-in slide-in-from-bottom duration-200"
            style={{
              backgroundColor: "#1E293B",
              borderTop: "0.5px solid #1E3A5F",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: "75vh",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <h2 className="font-display font-semibold text-white" style={{ fontSize: 16 }}>
                Compétitions
              </h2>
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setOpen(false)}
                className="text-[#94A3B8]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto pb-6" style={{ maxHeight: "60vh" }}>
              <button
                type="button"
                onClick={() => {
                  onChange("all");
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-white/5"
              >
                <div
                  className="flex items-center justify-center"
                  style={{ width: 28, height: 28 }}
                >
                  <Globe size={22} className="text-[#94A3B8]" />
                </div>
                <span className="text-sm text-[#E2E8F0]">Toutes les compétitions</span>
              </button>
              {competitions.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onChange(c.id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-white/5"
                >
                  <TeamLogo src={c.logo} name={c.name} size={28} rounded={4} />
                  <div className="flex flex-col">
                    <span className="text-sm text-[#E2E8F0]">{c.name}</span>
                    <span className="text-[#64748B]" style={{ fontSize: 11 }}>
                      {c.country}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
