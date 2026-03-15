# AluGamma Sheet Metal Designer — UX Redesign Brief

## Context & Goal

This document is a brief for redesigning the flange/FREZ creation UX inside the AluGamma DXF Workspace sheet metal designer. The product exports DXF files for sheet metal parts used in the fenestration (windows/doors) industry.

The goal is to make flange creation, removal, and modification as fast and frictionless as possible. Speed is the primary UX metric — operators run through many designs in a session.

---

## What to Leave Untouched

- The **top navbar ribbon** (design name, W/H inputs, Invert X/Y, Offset Cut, Save, Save + Export DXF) — this is already optimized and must not change.
- The **sidebar** (workspace/org/project navigation, design list) — treat it as collapsed or irrelevant; do not touch it.

---

## Current Layout — What Exists Today

The current design page (below the navbar) has this structure:

```
[ Sidebar ]  |  [ Top side panel        ]  [ Live Preview (tall, right half)    ]
             |  [ Bottom side panel      ]  [ Left side panel | Right side panel ]
             |  [ Export Options & Totals ]
```

### Current panel anatomy (each of the 4 sides — Top, Bottom, Left, Right):

Each panel is a card with:
- A header with the side label (e.g. "Top side") + "Add flange" button + "Add FREZ" button (purple)
- A **FLANGES** section:
  - A label showing total mm out (e.g. "40 mm out")
  - One row per flange: `[FLANGE / Step N label] [number input] [Left V-notch radio] [Right V-notch radio] [delete ×]`
  - For Top/Bottom sides: V-notch options are "Left V-notch" and "Right V-notch"
  - For Left/Right sides: V-notch options are "Top V-notch" and "Bottom V-notch"
- A **FREZ** section:
  - A "Max in: Nmm" label
  - Inner / Outer toggle buttons
  - A mm value
  - "No FREZ steps." placeholder or a list of FREZ step rows
- Each side panel is fully expanded at all times

### Pain points with current layout:
- Four fully expanded panels eat enormous vertical space — requires scrolling
- The Live Preview is relatively small, pushed into the right half and bottom-right quadrant
- V-notch controls are radio buttons inside each flange row but visually separated and hard to scan
- Adding a flange and its V-notch config requires multiple deliberate interactions
- Export options and mm-out totals clutter the main workspace with data that is rarely changed mid-session
- No spatial relationship between where a side is on the preview and where its panel lives in the UI — Top side panel is not above the preview, it's to the left of it

---

## Target Layout — The Redesign Vision

### Core principle: **The Live Preview is the center of the universe.**

The preview should occupy the dominant central area of the page. The four side panels should be positioned **spatially around it** — exactly mirroring the physical sides of the sheet metal:

```
              [ TOP SIDE PANEL — above the preview        ]
[ LEFT ]  [        LIVE PREVIEW (large, central)          ]  [ RIGHT ]
          [      BOTTOM SIDE PANEL — below the preview    ]
```

This creates an immediate, intuitive spatial mapping. When a user looks at "Top side", they are literally looking above the sheet. No mental remapping needed.

### Side panel design goals

Each of the four side panels should be:
- **Compact by default** — short enough to not overflow the viewport without scrolling
- **Spatially correct** — positioned on the side of the preview it corresponds to
- **Fast to interact with** — adding a flange, setting a V-notch, and removing a flange should each be one or two clicks maximum
- **Inline V-notch controls** — V-notch checkboxes (not radios) should live directly on the flange row, not in a separate sub-section

### Flange row anatomy (target, per row):

For **Top and Bottom** panels (horizontal, wide panels):
```
[ F1 ] [ ___20___ mm ] [ ☐ Left V ] [ ☐ Right V ] [ × ]
[ F2 ] [ ___20___ mm ] [ ☐ Left V ] [ ☐ Right V ] [ × ]
[ + Add flange ]
```

For **Left and Right** panels (vertical, narrow panels):
```
[ F1 ] [ ___20___ mm ] [ ☐ Top V ] [ ☐ Bottom V ] [ × ]
[ + Add flange ]
```

- The number input should be immediately editable (click-to-edit or always active)
- V-notch options should be checkboxes (not radio buttons — a flange can have both notches, one, or neither)
- The delete button should be subtle (×) but visible on hover
- "Add flange" should be a lightweight inline button at the bottom of the flange list, not a prominent button in the header

### FREZ handling

FREZ steps are less frequently added than flanges. They should:
- Be accessible per side via a small "+ FREZ" button or an expandable section inside each side panel
- Not be visible by default if there are no FREZ steps on that side
- Show a compact summary if FREZ steps exist (e.g. a small badge: "2 FREZ")
- Inner / Outer toggle and the mm value should only appear when a FREZ step is being added or edited

### Export options & totals — move to a dialog

Everything currently in "Export Options & Totals" (DXF export settings, include sheet name toggle, include directional arrow toggle, arrow direction selector) should move into a **modal dialog or a slide-out panel**, triggered by a settings icon or a small "Export settings" link near the "Save + Export DXF" button in the navbar. It does not belong in the main workspace canvas.

The per-side mm-out totals (e.g. "40 mm out", "296 mm out") can be shown as small subtle labels inside or below each side panel header — they should be informational, not structural.

---

## Interaction Flow — Target UX

The intended interaction for a power user creating a new sheet metal part should be:

1. Set W and H in the navbar (already good)
2. Click above the preview → Top panel is right there → type flange value → check V-notches if needed
3. Click below the preview → Bottom panel → same
4. Click left/right of the preview → Left/Right panels → same
5. Hit "Save + Export DXF" in the navbar

Total clicks from blank sheet to exported DXF should be minimized. No scrolling. No hunting for panels.

---

## Technical Stack Notes

- The app appears to be a React-based SPA (based on the UI component patterns)
- Dark theme is the default and should be preserved
- Color coding of side labels should be preserved: Top = cyan/teal, Bottom = green, Left = teal, Right = amber/yellow — these help spatial orientation
- The Live Preview renders an SVG/canvas DXF preview — this is a black-box component, do not modify its internals, only its container sizing and placement
- Use the `frontend-design` skill for aesthetic and implementation guidance

---

## Deliverables Expected from the Agent

1. A **full-page layout redesign** of the sheet metal design page (the area below the navbar)
2. The four side panels positioned spatially around the Live Preview
3. Compact, fast flange row components with inline V-notch checkboxes
4. FREZ hidden by default, accessible via lightweight expandable or button
5. Export options removed from the main canvas and placed in a modal/dialog triggered from the navbar area
6. The Live Preview component taking up the dominant central space
7. Everything should fit on a single viewport height (no page scroll) for a typical design with 1–3 flanges per side
8. Responsive enough to handle up to 5 flanges per side without breaking the layout (panels can scroll internally if needed)

---

## Reference — Current mm-out Values in the Sample Design

| Side   | Flanges                | V-notches active         | mm out |
|--------|------------------------|--------------------------|--------|
| Top    | F1=20, F2=20           | None                     | 40 mm  |
| Bottom | F1=296                 | Left V-notch             | 296 mm |
| Left   | F1=20                  | None                     | 20 mm  |
| Right  | F1=100                 | Top V + Bottom V         | 100 mm |

FREZ: 5 active steps total across sides (Inner/Outer, 0 mm in sample)

---

## Summary of Key UX Principles for This Redesign

- **Spatial**: panel position = physical side position relative to the preview
- **Fast**: flange add/edit/remove in ≤2 clicks
- **Inline**: V-notch lives on the flange row, not in a sub-panel
- **Minimal clutter**: FREZ collapsed unless active; export options in a dialog
- **Preview-first**: the live preview is large, always visible, never cropped