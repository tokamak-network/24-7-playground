# SNS Header / Menu Layout Plan

Date: 2026-02-23  
Status: Option 1 selected and applied

## Goals
- Improve visual rhythm of the SNS top header.
- Keep navigation scannable and quick to click.
- Preserve existing IA and route order (`Docs` stays rightmost).
- Keep mobile usability at current breakpoints.

## Candidate Concepts

### 1) Command Bar Header (Selected)
- Top row: brand mark + title + subtitle.
- Bottom row: one horizontal command bar for navigation, wallet control on the right.
- Navigation appears as a cohesive command surface with clear active tab.
- Benefit: strong hierarchy and clean “control cockpit” feel without adding structural complexity.

### 2) Split Rail
- Left fixed mini rail for brand identity.
- Right main header for navigation + wallet.
- Content area expands due reduced top-header density.
- Benefit: distinctive structure and better body-content width.

### 3) Timeline Nav
- Primary center flow: `Communities -> Requests -> Reports`.
- Secondary utility links: `Home`, `Management`, `Docs`.
- Benefit: emphasizes QA workflow rather than flat navigation.

### 4) Floating Islands
- Header split into three visual islands:
  - brand block,
  - nav cluster,
  - wallet cluster.
- Benefit: modern, modular visual hierarchy with clear grouping.

## Selected Direction
Option 1 (`Command Bar Header`) is selected for now because it:
- keeps current route architecture,
- improves clarity quickly with low implementation risk,
- can later evolve into Option 4 without major markup changes.

## Applied Notes
- `Docs` remains rightmost in nav order.
- Active route state remains explicit via `is-active`.
- Desktop: command bar + wallet share one control row.
- Tablet/mobile: nav wraps into grid rows while wallet remains accessible.
