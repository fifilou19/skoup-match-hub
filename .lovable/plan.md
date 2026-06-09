# SKOUP — Page Matchs

Mobile-first dark PWA page at route `/` (set as home) with bottom nav. Specs already defined by user; implementation will follow them verbatim.

## Files to create

- `src/routes/index.tsx` — replace placeholder with the Matchs page (this is the default landing).
- `src/components/skoup/TopBar.tsx` — logo + notification bell.
- `src/components/skoup/DayToggle.tsx` — Aujourd'hui / Demain.
- `src/components/skoup/CompetitionSelector.tsx` — trigger + bottom sheet (uses shadcn `Sheet` with `side="bottom"`).
- `src/components/skoup/MatchCard.tsx` — 3-column card with reliability badge + watchlist eye.
- `src/components/skoup/CompetitionSection.tsx` — header + list of `MatchCard`.
- `src/components/skoup/TeamLogo.tsx` — `<img>` with onError fallback to colored circle with initial.
- `src/components/skoup/BottomNav.tsx` — fixed bottom bar, 4 icons (football active).
- `src/data/matches.ts` — mocked data exactly as provided + competitions list for the sheet.

## Design tokens

Update `src/styles.css`:
- Set dark as default (apply `.dark` class on `<html>` in `__root.tsx`, or override `:root` tokens directly).
- Add SKOUP tokens: `--skoup-bg #0F172A`, `--skoup-card #1E293B`, `--skoup-primary #0B1F3A`, `--skoup-accent #E8622A`, `--skoup-border #1E3A5F`, plus text greys (#94A3B8, #64748B, #475569, #E2E8F0).
- Load Outfit + Inter via `<link>` in `__root.tsx` head; register `--font-display` (Outfit) and `--font-sans` (Inter) under `@theme`.
- Set body background and base font to Inter.

## Page composition (in order)

1. `TopBar`
2. `DayToggle` (state: `'today' | 'tomorrow'`)
3. `CompetitionSelector` (state: selected competition id or `'all'`; opens bottom sheet)
4. Scrollable list: filter mock data by selected competition, render `CompetitionSection` per group in this order: African local → CAF → Premier League → Liga → Ligue 1 → others (sort helper in `matches.ts`).
5. `BottomNav` fixed (add bottom padding to scroll area so last card isn't hidden).

## Match card details

- Reliability badge logic helper `getWindow(match)`:
  - `window === 'conf'` → green "Conf. ✓"
  - `window === 'soon'` → grey "Dans {hoursUntil}h"
  - else → none
- Eye icon (`Eye` from lucide-react) inside 28px circle; click toggles local `inWatchlist` state with `scale(1.2)` 150ms transition (tailwind `transition-transform duration-150` + state class).
- Card click → `navigate({ to: '/match/$matchId', params: { matchId: id } })`. Route doesn't exist yet — add stub `src/routes/match.$matchId.tsx` so typecheck passes (simple "Match {id}" placeholder + back link).

## Bottom sheet

shadcn `Sheet` with `side="bottom"`; rounded top, dark overlay (`bg-[#0B1F3A]/80`). List items per spec; "Toutes les compétitions" with `Globe` icon at top.

## Logo fallback

`TeamLogo` component: `useState` for `errored`; on `onError` swap to a `div` with deterministic color (hash of name → hue) and white initial.

## Bottom nav

Fixed `bottom-0`, full width, `#1E293B` bg with top border `#1E3A5F`. Icons from lucide-react: no exact `ball-football` — use `Volleyball`/`CircleDot` substitute (closest available; will pick `Volleyball` styled orange when active). Other icons: `Search`, `Bookmark`, `Settings`.

## Out of scope

- No real API calls, no auth, no light mode, no FIFA/UEFA indices, no settings page logic — just the Matchs screen + match detail stub for navigation.
