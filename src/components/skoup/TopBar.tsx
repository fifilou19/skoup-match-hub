import { Bell } from "lucide-react";

export function TopBar() {
  return (
    <header className="flex items-center justify-between px-4 py-3">
      <h1
        className="font-display font-bold text-white"
        style={{ fontSize: 18, letterSpacing: "2px" }}
      >
        SKOUP
      </h1>
      <button
        type="button"
        aria-label="Notifications"
        className="flex h-9 w-9 items-center justify-center rounded-full text-[#94A3B8] active:bg-white/5"
      >
        <Bell size={20} />
      </button>
    </header>
  );
}
