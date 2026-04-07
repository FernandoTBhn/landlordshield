# LandlordShield — Project Instructions

## What is this?

LandlordShield is a UK landlord compliance SaaS helping landlords manage regulatory obligations (gas safety, EPC, deposit protection, Right to Rent, etc.). The target user persona is 55+ years old, often not tech-savvy, managing 1–5 rental properties.

## Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4 (CSS-based `@theme` in globals.css — NO tailwind.config.ts)
- **Fonts:** Lora (headings) + Source Sans 3 (body) via `next/font/google`
- **Backend:** Supabase (auth + database)
- **Email:** Resend
- **Analytics:** PostHog
- **PDF:** @react-pdf/renderer

## Design Tokens

### Colours
| Token       | Hex       | Usage                              |
|-------------|-----------|-------------------------------------|
| primary     | `#1B365D` | Headers, CTAs, nav, links           |
| success     | `#2D8544` | Compliant status, confirmations     |
| warning     | `#D4A017` | Expiring soon, attention needed     |
| danger      | `#C41E3A` | Overdue, expired, errors            |
| background  | `#F8F6F3` | Page background (warm off-white)    |
| foreground  | `#1A1A1A` | Body text                           |
| muted       | `#6B7280` | Secondary text, placeholders        |
| border      | `#D1D5DB` | Card borders, dividers              |
| card        | `#FFFFFF` | Card surfaces                       |

### Typography
- **Headings:** Lora (serif) — trustworthy, professional feel
- **Body:** Source Sans 3 (sans-serif) — highly readable at all sizes
- **NEVER use:** Inter, Roboto, Arial, or any generic sans-serif as primary font
- **Minimum font size:** 16px (1rem) for body text
- **Line height:** minimum 1.5 for body, 1.2 for headings

### Spacing & Sizing
- **Card padding:** minimum 24px (1.5rem)
- **Button height:** minimum 48px (3rem) — touch-friendly
- **Click targets:** minimum 44×44px (WCAG 2.5.5)
- **Section spacing:** 32px between major sections

### Colours — NEVER
- **NEVER** use pure white (`#FFFFFF`) as page background — always `#F8F6F3`
- **NEVER** use pure black (`#000000`) for text — always `#1A1A1A`

## Accessibility (WCAG AA)

- Contrast ratio: minimum 4.5:1 for normal text, 3:1 for large text
- All interactive elements must have visible focus indicators
- Form inputs must have associated labels
- Images must have alt text
- Buttons must have accessible names
- Mobile-first responsive design
- No reliance on colour alone to convey information

## Persona: 55+ Landlord

- Large, readable text (16px minimum)
- Clear visual hierarchy with serif headings
- Generous padding and spacing
- Obvious, high-contrast buttons
- Simple navigation — no hamburger menus on tablet+
- Status indicators use both colour AND text/icons
- Plain English, no jargon

## File Conventions

- Components: `src/components/` — PascalCase filenames
- Pages: `src/app/` — Next.js App Router conventions
- Lib/utils: `src/lib/`
- Types: `src/lib/types.ts`

## Git

- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`
- One logical change per commit
