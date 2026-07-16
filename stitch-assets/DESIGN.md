---
name: Terminal Mono
colors:
  surface: '#141313'
  surface-dim: '#141313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353434'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c6c6c7'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e2e2e2'
  on-primary-container: '#636565'
  inverse-primary: '#5d5f5f'
  secondary: '#c7c6c6'
  on-secondary: '#2f3131'
  secondary-container: '#484949'
  on-secondary-container: '#b8b8b8'
  tertiary: '#ffffff'
  on-tertiary: '#2f3131'
  tertiary-container: '#e2e2e2'
  on-tertiary-container: '#636565'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#e3e2e2'
  secondary-fixed-dim: '#c7c6c6'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#464747'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#141313'
  on-background: '#e5e2e1'
  surface-variant: '#353434'
typography:
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  code-md:
    fontFamily: Geist Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-sm:
    fontFamily: Geist Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 16px
  margin: 24px
---

## Brand & Style

This design system is built on a "Terminal Mono" aesthetic—a high-contrast, monochromatic framework designed for CapstoneAI. It merges the precision of a developer environment with the sophisticated clarity of modern academic publishing.

The personality is utilitarian, focused, and uncompromisingly technical. By stripping away color, the interface relies on structural hierarchy, crisp lines, and rhythmic typography to guide the user. The emotional response is one of serious productivity and intellectual rigor.

The style is a blend of **Minimalism** and **Modern Brutalism**:
- **Strictly Flat:** No gradients or traditional depth metaphors.
- **High Contrast:** Pure whites against near-black backgrounds for maximum legibility.
- **Precision Engineered:** 1px solid borders and sharp corners define the structural grid.
- **Active States:** Presence is felt through subtle white glows rather than color shifts, mimicking an illuminated terminal screen.

## Colors

The palette is restricted to a monochromatic scale to maintain a focused "head-down" environment. 

- **Background (#0A0A0A):** The foundation of the UI, providing a deep, near-black canvas.
- **Surface (#1A1A1A):** Used for distinct containers, cards, and sidebars to create subtle structural separation.
- **Surface Highlight (#262626):** Reserved for interactive borders and hover states.
- **Primary/Text (#FFFFFF):** The default for all primary information and high-emphasis elements.
- **Muted/Secondary (#A3A3A3):** Used for metadata, labels, and secondary body text to reduce visual noise.
- **Accent (#F5F5F5):** An off-white used sparingly for subtle emphasis or "bright" interactive elements.

## Typography

The typography system uses three distinct typefaces to categorize information types:

1.  **Headings (Space Grotesk):** Used for large titles and section headers. Bold weights and tight tracking (-0.02em) give it a modern, architectural feel.
2.  **Body (Geist):** The workhorse for all prose and primary reading. It provides a clean, neutral sans-serif experience that stays out of the user's way.
3.  **Technical/Labels (Geist Mono):** Used for code blocks, data points, and UI labels. This monospaced font reinforces the "terminal" aesthetic and ensures alignment in technical readouts.

Mobile adjustments: `headline-lg` should scale to 32px on mobile devices, while `headline-md` scales to 24px.

## Layout & Spacing

This design system employs a **Fixed Grid** layout for desktop (max-width 1440px) and a fluid 4-column layout for mobile. 

The spacing rhythm is strictly based on a **4px base unit**. All padding, margins, and gaps must be multiples of 4. 
- **Desktop:** 12-column grid with 16px gutters.
- **Tablet:** 8-column grid with 16px gutters.
- **Mobile:** 4-column grid with 12px gutters and 16px side margins.

Content should be separated by hard lines (`#262626`) rather than white space alone to emphasize the "contained" terminal structure. Use `md` (16px) for standard internal padding and `lg` (24px) for section-level separation.

## Elevation & Depth

Depth in this design system is conveyed through **Tonal Layering** and **Bold Outlines**. Traditional drop shadows are strictly forbidden.

- **Level 0 (Background):** `#0A0A0A` – The base.
- **Level 1 (Surfaces):** `#1A1A1A` – Cards and modals, defined by a 1px solid border of `#262626`.
- **Level 2 (Interaction):** When an element is active or focused, it receives a **Pure White Glow** (`box-shadow: 0 0 8px 0px rgba(255, 255, 255, 0.3)`). This is the only "soft" element in the system, representing light emission from a screen.

Separation is achieved by shifting surface colors or adding borders, never by blurs or gradients.

## Shapes

The shape language is defined by **sharpness and precision**. 

While the core `roundedness` is set to 0 to maintain a brutalist feel, specific interactive elements utilize micro-radii to prevent an "unfinished" look:
- **Small (radius-sm):** 2px (Checkboxes, small tags).
- **Medium (radius-md):** 4px (Primary buttons, input fields, cards).

Large elements like sidebars and main containers must remain at 0px radius to ground the layout in a rigid, technical structure.

## Components

### Buttons
- **Primary:** Solid `#FFFFFF` background with `#0A0A0A` text. 4px radius. No shadow.
- **Secondary:** Transparent background with a 1px `#262626` border. Text is `#FFFFFF`.
- **Hover:** Border color shifts to `#FFFFFF`.

### Input Fields
- Background: `#0A0A0A`.
- Border: 1px `#262626`. 
- Focus State: Border color becomes `#FFFFFF` with a subtle white glow.
- Text: Geist Mono for technical input.

### Cards
- Background: `#1A1A1A`.
- Border: 1px `#262626`.
- Header: Separated by a 1px horizontal line, using Space Grotesk bold.

### Chips/Tags
- Small, 2px radius.
- Background: `#262626`.
- Text: `#A3A3A3` in Geist Mono (label-sm).

### Lists
- Each item is separated by a 1px solid line (`#262626`). 
- Hover state: Background changes to `#1A1A1A`.

### Checkboxes & Radios
- Strict 2px radius for checkboxes, circles for radios.
- 1px `#FFFFFF` border when checked. No inner fill; use a small centered dot or "X" for the mark.