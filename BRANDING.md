# PlayDooh Software Branding

This document is the shared source of truth for PlayDooh software and UI work. It translates the 2025 brand guide into implementation rules for applications. When a general-purpose section of the PDF conflicts with this software-specific guidance, follow this document.

## Brand character

PlayDooh interfaces should feel modern, minimal, premium, polished, confident, and approachable. Prefer purposeful whitespace, strong hierarchy, concise copy, restrained decoration, and clear interaction states. The result should feel technology-led without becoming visually noisy or gimmicky.

New tools must feel like part of the same PlayDooh software suite. Use the existing `Technician Tool`, `PlayDooh Ad Tool`, and `PlayDooh Onboarding Tool` as read-only references for spacing, cards, inputs, buttons, login screens, headers, loading states, and responsive behaviour. These tools are references rather than permission to introduce colours or treatments outside this document.

## Logo

The approved software logo source is:

`_PlayDooh Brand/playdooh-logo.png`

- Use the approved file as supplied. Do not redraw or recreate it.
- Do not distort, stretch, squash, crop, rotate, recolour, outline, add shadows to, fill with a pattern or photograph, remove elements from, resize individual elements of, or rearrange the logo.
- Preserve the source aspect ratio and render it sharply.
- Maintain clear space on every side at least equal to the height of the logo mark (the location-pin/play-button symbol). Keep text, imagery, borders, controls, and other logos outside that area.
- Place the logo only where its supplied colours remain clear and legible. Do not improvise an alternate colourway to solve a background problem; change the surrounding treatment instead.
- The supplied file is the approved lockup for software. Do not extract the mark or wordmark as a new standalone asset unless an approved asset is separately provided.

## Colour palette

Decorative UI must use only the approved PlayDooh palette. Do not introduce arbitrary accent colours.

| Role | Brand colour | Hex | Recommended software use |
|---|---|---:|---|
| Primary | Coral Blaze | `#F2735A` | Primary calls to action, active emphasis, selected accents, and small high-energy highlights |
| Primary | Midnight Signal | `#293241` | Main text, navigation, headers, dark surfaces, and the grounding colour of the interface |
| Primary treatment | Urban Pulse | See below | Branded hero areas, login panels, or other deliberate feature surfaces |
| Secondary | Deep Signal | `#3C5B81` | Secondary actions, supporting dark-blue surfaces, charts, and layered emphasis |
| Secondary | Cloud Pulse | `#98C0D9` | Calm highlights, focus treatments, supporting information, and light-blue surfaces |
| Secondary | Neon Mist | `#E1FBFD` | Subtle tinted backgrounds, informational panels, and gentle selected states |
| Secondary | Silver Drift | `#DBDBDB` | Dividers, borders, disabled/supporting surfaces, and neutral polish |

White and transparent space may be used as neutral canvas space. Dark or light tonal adjustments needed for readable text, borders, hover states, or disabled states should be minimal and derived from the palette rather than used as new decorative accents.

Existing semantic colours for errors, warnings, and success may be used when necessary for usability. Keep them scoped to status communication, pair colour with an icon or text label, and do not reuse them as decorative brand accents.

### Urban Pulse gradient

Urban Pulse is the approved vertical gradient treatment shown in the brand guide: Midnight Signal at the top transitioning downward into Cloud Pulse.

```css
linear-gradient(180deg, #293241 0%, #98C0D9 100%)
```

This CSS is the standard software interpretation of the guide's treatment. Keep the direction and endpoints intact. Do not turn Urban Pulse into a rainbow, add unapproved intermediate hues, rotate it arbitrarily, or use it across every surface. Reserve it for intentional branded moments and keep content contrast accessible.

### Colour balance in UI

- Let Midnight Signal and neutral canvas space carry most layouts and content.
- Use Coral Blaze selectively so primary actions and key moments retain impact.
- Use Urban Pulse as a feature treatment, not a default page background.
- Use Deep Signal for supporting structure and secondary emphasis.
- Use Cloud Pulse and Neon Mist for calm, low-intensity highlights and panels.
- Use Silver Drift sparingly for separation and neutral support.
- The brand guide's overall reference ratio is Coral Blaze 25%, Midnight Signal 25%, Urban Pulse 15%, Deep Signal 10%, Cloud Pulse 10%, Neon Mist 10%, and Silver Drift 5%. Treat this as a composition guide, not a required pixel calculation for every screen. Usability, legibility, and hierarchy come first.

## Typography

Sofia Pro is the primary display and interface-heading font for PlayDooh software. The canonical font files are in `_PlayDooh Brand/Fonts/`, including upright and italic styles from UltraLight through Black. This software rule applies even though the PDF's general typographic-hierarchy section mentions Unitea Sans.

Trebuchet MS Regular is the required body-copy font. Use it for paragraphs, instructions, help text, FAQ answers, captions, and other continuous reading text. Sofia Pro remains the primary face for headings, prominent labels, navigation, buttons, and short interface titles. Do not replace Sofia Pro with Unitea Sans in software.

Recommended software hierarchy:

| Element | Typeface and weight | Guidance |
|---|---|---|
| Page/display title | Sofia Pro Bold or Semi Bold | Clear, compact, and visually dominant |
| Section heading | Sofia Pro Semi Bold | Strong grouping without competing with the page title |
| Card title / subheading | Sofia Pro Medium or Semi Bold | Short and scannable |
| Body copy | Trebuchet MS Regular | Use for paragraphs, instructions, FAQ answers, captions, and continuous reading text with a comfortable line height |
| Form controls | Sofia Pro Regular or Medium | Keep controls clear, consistent, and easy to scan |
| Labels and navigation | Sofia Pro Medium or Regular | Use size and contrast carefully; never rely on all caps alone |
| Metadata and helper text | Trebuchet MS Regular | Keep supporting copy readable and visually secondary |

Avoid excessive weights, oversized headings, long all-caps passages, and overly tight tracking. A compact uppercase label may be used sparingly when it matches the existing suite's visual language.

For web applications, self-host Sofia Pro where practical with `@font-face`, using the copied app-local assets. Declare Trebuchet MS as the body-copy family with Trebuchet and Arial fallbacks. Do not link production CSS to `_PlayDooh Brand/Fonts/` or to an absolute local path.

## UI application

- Use consistent page gutters, vertical rhythm, card padding, control heights, and corner radii within each tool.
- Prefer clean cards and panels with restrained borders or shadows. Avoid ornamental depth and heavy effects.
- Primary buttons normally use Coral Blaze with a clearly legible label. Secondary buttons should use quieter palette treatments. Make hover, focus, active, disabled, and busy states distinct.
- Inputs should have persistent labels, clear boundaries, helpful validation, and a visible keyboard focus treatment. Never communicate an error through colour alone.
- Headers should provide stable identity and navigation, commonly grounded by Midnight Signal or the approved Urban Pulse treatment.
- Login screens should be focused and uncluttered, with the approved logo, one clear primary action, and no unapproved decorative colour.
- Loading states should preserve layout where possible, explain longer operations, prevent duplicate submission, and use a consistent branded spinner, skeleton, or progress treatment.
- Responsive layouts must work on desktop and mobile. Cards should reflow, inputs should remain usable, type should remain readable, and actions must remain reachable without horizontal scrolling.

## Copying and embedding shared assets

The shared brand folder is the canonical source, not a production asset host.

1. Copy `playdooh-logo.png` into the individual application's managed asset directory without editing the image.
2. Copy only the required Sofia Pro `.otf` weights/styles from `_PlayDooh Brand/Fonts/` into the application's managed font directory. The shared Fonts folder remains the canonical source.
3. Reference copied assets through app-relative imports, bundled resource identifiers, or deployed URLs controlled by that application.
4. Package the assets with the build/deployment and verify them in a clean environment that cannot access this workspace.
5. Preserve the original filenames where practical, or maintain an explicit source mapping if the build system requires renamed files.
6. When the canonical shared asset changes, deliberately refresh the app-local copy and test it; do not create a silent runtime dependency on the shared folder.

Production apps must never depend on paths such as `C:\\...`, a developer's installed fonts, or any local workspace path for logo or font delivery.
