---
version: alpha
name: Avenir
description: Existing glass-and-city market analysis workspace
colors:
  primary: '#8fd9c0'
  secondary: '#d8f3e8'
  background: '#07090c'
  surface: '#0d1218'
  text: '#f1ede4'
  danger: '#ff7a86'
typography:
  sans:
    fontFamily: 'Inter Tight, Manrope, system-ui, sans-serif'
  display:
    fontFamily: 'Fraunces, Georgia, serif'
  mono:
    fontFamily: 'JetBrains Mono, monospace'
rounded:
  DEFAULT: '12px'
  card: '12px'
spacing:
  section-gap: '14px'
  page-max: '1320px'
components:
  button: {}
  card: {}
  input: {}
  table: {}
---

# Avenir Design System

## Overview

### Creative North Star
Preserve the user's supplied Avenir glass panels and requested trading photograph with pointer/touch parallax, with compact market controls and restrained analysis surfaces.

### Product context and register
Audience: users researching all displayed markets. Product register on charts, options and AI; expressive brand register on home. English interface; no inferred jurisdiction. Desktop chart use with stacked mobile forms. No redesign, extra illustrations, or new palette. Runtime tokens in `index.html` are canonical; this document mirrors their existing values. `public/avenir-integration.css` consumes those tokens. Dark/blue/gold themes remain intact.

## Colors
Use primary for selected actions and successful outcomes, secondary for focus, danger for errors, and muted existing text for explanations. Data provenance must be visible independently of color.

## Typography
Existing Inter Tight body and Fraunces headings; mono for copy-once bridge tokens. Data retains tabular numerals. Long reports wrap.

## Layout
Preserve the original navigation, eight screens and chart shell. Gemini uses a separate 460px non-modal panel that fits narrow screens. Forms scroll within the established page container. Native selects/date pickers are intentional platform-owned controls.

## Elevation & Depth
Reuse `.glass`, existing blur, borders and shadows. No new nested overlays or floating panels.

## Shapes
Existing 12px glass cards and compact buttons/fields, compact pills. Maintain focus rings and usable target sizes.

## Components
Reuse `.btn`, `.fld`, `.glass`, `.row` and `.lbl`. New cloud interactions use shared `act`, `api`, `status` helpers. Buttons retain dimensions while busy. Reports show saved status and local timestamps. Account credentials are masked. Empty/error/stale states explain the next action. Input state survives failed requests.

Dedicated identity pages use the same glass surface, trading backdrop, logo and existing tokens. Login is the entry route; account details, review and confirmation are separate screens. The top-left menu owns Account, Notifications and the AvScript reference. The reference uses semantic tables, runnable examples and responsive flow diagrams. No palette or chart-shell redesign is authorized.

## Motion
Preserve existing user-controlled scene. Respect reduced motion for CSS; do not add entrance animation to reports.

## Accessibility
Visible focus, labeled controls, semantic buttons, live status, and non-drag scale controls. Platform pickers retain keyboard behavior. Original chart is a canvas with text controls and data labels.

## Content
Distinguish live MT5 quotes, previous-session options totals, and explicit demo data. Do not claim connected services or executions that have not occurred.

