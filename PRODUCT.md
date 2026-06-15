# Product

## Register

product

## Users

Thai-speaking enterprise teams (admins, managers, and members) working inside a
shared workspace. They are in a task: managing teams and projects, reviewing
users and roles, reading audit logs, checking the calendar, handling documents,
and monitoring activity. They use the app daily, often for long sessions, and
move between dense data views and focused forms. Interface text is bilingual:
Thai (Anuphan) for body and labels, Latin/numerals (Geist) for data, IDs, and
code. The tool should disappear into the task.

## Product Purpose

A management dashboard ("A-DXC Workspace") that centralizes team/project
operations, administration, and monitoring for an organization. Success is when
a user can find, read, and act on information quickly without friction — clear
hierarchy, trustworthy controls, no guesswork about what a control does.

## Brand Personality

Modern and energetic, but professional and calm under load. Three words:
confident, vibrant, structured. The brand carries a violet→fuchsia accent that
should feel like a deliberate signature (primary actions, selection, focus,
brand moments) rather than decoration sprayed everywhere. Energy comes from one
well-placed accent and crisp motion, not from many competing colors.

## Anti-references

- The default shadcn/neutral look with no point of view (generic, templated).
- AI-template "slop": oversized samey headings, everything `text-xs`, gradient
  text, decorative glows, side-stripe borders, an eyebrow over every section.
- The previous eight pastel theme presets competing for attention (dawn, cloud,
  blossom, matcha, lagoon, peach, aurora) — variety mistaken for design.
- Bright accent colors used as decoration on inactive/idle UI.

## Design Principles

1. **Hierarchy through scale + weight, not size inflation.** Every heading level
   is visibly distinct; body text is calm and readable. One family per script.
2. **One brand accent, used with intent.** Violet/fuchsia marks primary action,
   current selection, focus, and brand moments — never idle decoration.
3. **Restraint is the floor; energy is a moment.** Quiet surfaces and neutral
   structure by default; vibrancy where it guides attention.
4. **8px rhythm.** Spacing, padding, and gaps follow a consistent scale so the
   layout reads as intentional, not "slightly off."
5. **Accessible by construction.** Text/background combinations meet WCAG AA;
   every interactive control has full default/hover/focus/active/disabled states.

## Accessibility & Inclusion

- Target WCAG 2.1 AA: body text ≥ 4.5:1, large/bold text ≥ 3:1, including
  placeholder and muted text and all button states.
- Honor `prefers-reduced-motion` for every animation (crossfade/instant
  fallback).
- Bilingual legibility (Thai + Latin) at every size in both light and dark.
- Don't encode meaning in color alone (pair with icon/text/shape).
