# AI_TEACHER_COPILOT_UI_UX_KNOWLEDGE

## 1. Executive Summary

AI Teacher Copilot’s frontend is a strong example of a product that feels calm, modern, and trustworthy without becoming flashy or visually noisy. The design language is consistent across marketing pages, dashboard shell, chat UI, and AI workflows. It relies on a restrained visual system built around clean whites, green/emerald primary accents, subtle borders, soft shadows, and generous spacing.

The most important UX pattern is not “beautiful design” in the abstract. It is clarity + trust + momentum:
- the dashboard immediately communicates state and next actions,
- the AI chat keeps the user grounded in the task,
- the generation UI exposes process and confidence visually,
- the layout prevents cognitive overload by using card groups, muted surfaces, and strong hierarchy.

From a frontend architecture standpoint, the app is organized as a classic “marketing shell + authenticated dashboard + feature pages” structure. The visual system is mostly defined by Tailwind tokens in `tailwind.config.js` and `src/index.css`, while reusable UI primitives live under `src/components/ui` and the app shell lives under `src/layouts`.

This is a strong reference pattern for a Teacher Copilot product because it emphasizes:
- clear product shell and navigation,
- controlled use of accent color,
- confident but not noisy interactive states,
- streaming AI feedback without visual chaos,
- grounded answer UX through citations and source UI,
- a calm, productivity-driven aesthetic rather than a “show-off” AI aesthetic.

## 2. Frontend Architecture Map

### App shell

File:
- `frontend/src/App.tsx`
- `frontend/src/layouts/DashboardLayout.tsx`
- `frontend/src/layouts/PublicLayout.tsx`

Pattern:
- split between public marketing routes and authenticated dashboard routes,
- consistent route-level shell with `ProtectedRoute` and `GuestRoute`,
- dashboard shell with fixed sidebar + sticky header + main content area.

Evidence:
- `App.tsx` defines public pages (`/`, `/features`, `/about`, `/blog`, `/login`, etc.) and protected dashboard pages.
- `DashboardLayout.tsx` creates a fixed sidebar, mobile overlay, sticky top header, and a main content region.
- `PublicLayout.tsx` wraps public pages with `Header` and `Footer`.

Why it matters:
- Multi-view product architecture is easy to navigate and predictable.
- The shell is stable even as feature pages change.

Transferability:
- HIGH — a Teacher Copilot product should maintain a predictable shell for workspace, generation, and document views.

### Feature-level structure

Evidence from app structure:
- `frontend/src/pages/dashboard/*` contains distinct feature pages
- `frontend/src/components/landing/*` contains public-facing marketing UI
- `frontend/src/components/ui/*` contains reusable primitives
- `frontend/src/services/*` contains API wrappers
- `frontend/src/stores/*` contains data state management

Feature map:

App Shell
├── Public marketing pages
├── Auth pages
├── Dashboard sidebar + header
├── Feature pages
│   ├── content workspaces
│   ├── AI chat
│   ├── problem-solving
│   ├── research
│   ├── settings
│   └── analytics
├── Shared UI primitives
└── API / store layer

### Shared UI primitives

Files:
- `frontend/src/components/ui/button.tsx`
- `frontend/src/components/ui/card.tsx`
- `frontend/src/components/ui/input.tsx`
- `frontend/src/components/ui/badge.tsx`
- `frontend/src/components/ui/spinner.tsx`

These primitives are intentionally thin and composable, which creates a consistent branded foundation without heavy custom component architecture.

## 3. Design System

### Overall visual philosophy

Evidence:
- `frontend/src/index.css`
- `frontend/tailwind.config.js`
- `frontend/src/components/landing/Header.tsx`
- `frontend/src/pages/dashboard/TeacherWorkspacePage.tsx`

AI Teacher Copilot uses a “soft productivity” aesthetic:
- off-white/light-gray backgrounds,
- primary color in green/emerald,
- low-noise surfaces,
- strong but not overpowering contrast,
- mostly flat surfaces with subtle borders and authority from shadows.

This is not a high-saturation “AI futuristic” style. It is a trust-first learning UI: clean, educational, and professional.

### Typography

File:
- `frontend/tailwind.config.js`
- `frontend/src/components/ui/card.tsx`
- `frontend/src/components/landing/Header.tsx`

Evidence:
- `fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }`
- headings use classes such as `text-2xl font-semibold`, `text-xl font-bold`, `text-sm font-medium`
- secondary content uses `text-muted-foreground`

Pattern:
- sans-serif system with strong clarity
- headings are bold and direct, not ornamental
- body text is compact and readable
- metadata is small, subdued, and secondary

Typography system:
- Page titles: large and high-contrast, e.g. `text-2xl` / `text-3xl` leading patterns
- Section headings: `font-semibold` + medium scale
- Body: `text-sm` and `text-base` with reading-friendly spacing
- Metadata: muted small labels, e.g. `text-xs text-muted-foreground`

### Color system

File:
- `frontend/src/index.css`
- `frontend/tailwind.config.js`

Evidence:
- `--background: 150 30% 99%`
- `--foreground: 150 20% 10%`
- `--primary: 152 69% 40%`
- `--primary-foreground: 0 0% 100%`
- `--muted: 210 40% 96.1%`
- `--muted-foreground: 215.4 16.3% 46.9%`
- `--border: 214.3 31.8% 91.4%`

Semantic interpretation:
- primary = green/emerald, used for confidence, success, call-to-action, active states
- background = warm off-white; highly readable
- surface = white cards over off-white base
- border = cool gray; subtle and light
- text primary = near-black/charcoal
- text secondary = muted gray
- success/AI-related states lean toward green and soft mint backgrounds, e.g. from `TeacherWorkspacePage` and `Header`

Dark mode is supported via `.dark` tokens in `src/index.css`, but the primary visible variant is the light theme.

### Spacing system

Evidence:
- `container` padding is `2rem`
- cards use `p-4`, `p-5`, `p-6`
- layout uses `gap-3`, `space-y-1`, `gap-4`, `px-4`, `p-4` consistently
- `DashboardLayout` uses `p-4 lg:p-6` for main content wrapper
- `Header` uses `px-6 sm:px-8 lg:px-12 xl:px-16`

Pattern:
- spacing is generous but not excessive
- system is disciplined: 4px / 8px / 12px / 16px / 24px scale is clear in classes
- not dense; each card and tile has room to breathe

### Shape

Evidence:
- CSS root `--radius: 0.5rem`
- Tailwind `borderRadius: { lg, md, sm }`
- `Button` uses `rounded-xl`
- cards use `rounded-xl` and `rounded-lg`
- inputs use `rounded-md`

Pattern:
- medium-soft corners, not fully rounded pills
- enough softness for friendliness without looking playful
- a “rounded but structured” visual language

### Elevation

Evidence:
- `shadow-sm` in `Card`
- `shadow-lg` on homepage CTA and dropdowns
- `Header` uses `shadow-sm` and `backdrop-blur-xl`
- `DashboardLayout` uses `shadow-lg` in user menu dropdown

Pattern:
- depth is subtle and primarily border + shadow combination
- not heavy, glassy, or dramatic
- the visual system prefers trust and readability over “luxury” depth

## 4. Component Library

### Button

File:
- `frontend/src/components/ui/button.tsx`

Component:
- `Button`

Props/Variants:
- `variant`: default, destructive, outline, secondary, ghost, link
- `size`: default, sm, lg, icon

States:
- default gradient green CTA, hover darkening gradient, disabled opacity 50%
- focus ring via `focus-visible:ring-2 focus-visible:ring-ring`

Behavior:
- uses `Slot` for `asChild` composition
- transition-colors only, no heavy motion

Accessibility:
- focus-visible ring, keyboard-visible state

Teacher Copilot applicability:
- HIGH — primary actions, save, generate, send, continue, export can all use this pattern.

### Card

File:
- `frontend/src/components/ui/card.tsx`

Pattern:
- white surface, border, shadow-sm, `rounded-lg`
- header content and footer sections

Usage evidence:
- dashboard stat cards and quick action cards use aligned card grid patterns

Teacher Copilot relevance:
- suits lesson cards, document cards, generation result cards, review items.

### Input / Textarea-like controls

File:
- `frontend/src/components/ui/input.tsx`

Pattern:
- `h-10` height,
- border + background,
- focus ring,
- muted placeholder,
- disabled opacity reduction

Behavior:
- simple, minimal, standard form control

Teacher Copilot relevance:
- good for prompt boxes, search fields, form inputs, document rename fields.

### Badge

File:
- `frontend/src/components/ui/badge.tsx`

Pattern:
- pill shape, borderless filled backgrounds,
- subtle semantic variants

Teacher Copilot applicability:
- great for status labels, tags, feature status, source labels.

### Spinner

File:
- `frontend/src/components/ui/spinner.tsx`

Pattern:
- `Loader2` with `animate-spin`
- size scale (`sm`, `md`, `lg`)

This is representative of the product’s restrained motion system.

### Header / navigation dropdown

File:
- `frontend/src/components/landing/Header.tsx`

Pattern:
- feature dropdown with `AnimatePresence` + `motion.div`
- `easeOut` timing and hover/focus state changes
- dropdown panel appears to the center of the nav

Interaction principle:
- secure and subtle menu reveal, not flashy

### Sidebar

File:
- `frontend/src/layouts/DashboardLayout.tsx`

Pattern:
- fixed left panel on desktop,
- full-screen overlay on mobile,
- active nav gets green highlight,
- hover state uses muted background

### Notification / user menu

File:
- `frontend/src/layouts/DashboardLayout.tsx`

Pattern:
- sticky header control cluster,
- dropdown anchored to the right,
- subtle shadow and border,
- grouped actions with separators

### Alert / dialog-like patterns

Files:
- `frontend/src/components/ui/alert.tsx`
- `frontend/src/components/ui/alert-dialog.tsx`

These indicate a consistent modal/alert system with clear semantic colors, border, and spacing.

## 5. Page and Layout Patterns

### Dashboard home page

File:
- `frontend/src/pages/dashboard/TeacherWorkspacePage.tsx`

Layout:
- left sidebar, top header, main centered content area
- hero greeting at top, then stat cards, then quick actions
- cards are aligned in a clean grid and are visually grouped by purpose

Hierarchy:
- primary action is “Study now” or “Create new study set”
- secondary actions are cards in a grid
- analytics and progress metrics remain secondary but visible

Evidence from screenshot:
- top card has large heading “Good afternoon, Test!”
- stat cards are equal-width blocks with green accent icons and small labels
- quick actions are all same card style with icon box + title + description

### AI chat page

File:
- `frontend/src/pages/dashboard/LessonPlannerPage.tsx`
- `frontend/src/services/chat.ts`

Layout:
- left sidebar for conversation history
- right panel for messages and composer
- empty state center aligned when there are no chats
- composer pinned to bottom with input and send button

Pattern:
- empty state is intentionally calm and sparse
- suggested prompt cards appear centrally before conversation starts
- the AI assistant is framed as a helpful study buddy, not a “chatbot” background color explosion

### AI Generation Page

File:
- `frontend/src/modules/generation/...` and screenshot evidence in `.github/screenshots/generation.png`

Pattern:
- a single large problem box at top,
- three “agent stages” in stacked cards,
- arrow connector between stages,
- state is made legible through text and spinner styling

This is a very transferable pattern for an AI Teacher Copilot: expose the workflow as a transparent process, not as a single hidden model response.

### Marketing / public landing pages

File:
- `frontend/src/components/landing/Header.tsx`
- `frontend/src/pages/.../HomePage.tsx` (not read in full, but evident by structure)

Pattern:
- hero with large headings and CTA buttons,
- feature dropdown and highlight cards,
- soft backgrounds + green accent,
- a polished but restrained SaaS landing style

## 6. Interaction Patterns

### Hover

Evidence:
- `Header.tsx`: nav links have `hover:bg-muted` and `transition-all`
- `TeacherWorkspacePage.tsx`: quick action cards use `hover:border-green-500/50 hover:shadow-lg transition-all`
- `DashboardLayout.tsx`: sidebar items use `hover:bg-muted hover:text-foreground`

Pattern:
- hover is usually low-noise: background fill, border accent, slight shadow increase
- neither heavy motion nor aggressive color shifts

### Active / selected states

Evidence:
- `DashboardLayout.tsx`: active nav item uses `bg-green-500/10 text-green-600`
- `Header.tsx`: active nav item uses `text-green-600 dark:text-green-400`

Pattern:
- green accent is reserved for “current state” and meaningful actions
- consistent semantic signal: active = green, muted = neutral

### Focus / keyboard states

Evidence:
- `button.tsx`: focus-visible ring and ring offset
- `input.tsx`: focus-visible ring and ring offset

Pattern:
- focus is explicit but subtle; matches the neutral branding rather than pure blue or neon.

### Disabled states

Evidence:
- `button.tsx`: `disabled:pointer-events-none disabled:opacity-50`
- `input.tsx`: `disabled:cursor-not-allowed disabled:opacity-50`

Pattern:
- disabled states are visually quiet; no heavy contrast reduction beyond opacity.

### Hover + reveal patterns

Evidence:
- navigation dropdown in `Header.tsx`
- chat citation panel in `LessonPlannerPage.tsx`
- user menu dropdown in `DashboardLayout.tsx`

Pattern:
- reveal is immediate and controlled, no dramatic scaling or cover-up animations.

## 7. Micro-Interactions

### 1. Hover color change

File:
- `frontend/src/layouts/DashboardLayout.tsx`
- `frontend/src/components/landing/Header.tsx`

Trigger:
- mouseover nav element or action card

Property:
- background color and text color

Duration:
- not explicitly defined in code as numerical value, but uses `transition-colors` and `transition-all` in utility classes

Purpose:
- create immediate feedback without visual interruption

### 2. Dropdown reveal animation

File:
- `frontend/src/components/landing/Header.tsx`

Evidence:
- `motion.div` with `initial={{ opacity: 0, y: 8, scale: 0.96 }}`
- `animate={{ opacity: 1, y: 0, scale: 1 }}`
- `transition={{ duration: 0.15, ease: 'easeOut' }}`

Pattern:
- subtle pop-in, not heavy motion

### 3. Sidebar slide in / out

File:
- `frontend/src/layouts/DashboardLayout.tsx`

Evidence:
- `transform transition-transform duration-200`
- mobile overlay fades in with `bg-black/50`

Pattern:
- layer-based motion; toggles from left edge

### 4. Button gradient shift

File:
- `frontend/src/components/ui/button.tsx`

Evidence:
- `bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700`

Pattern:
- button CTA stays confident but becomes subtly darker on hover

### 5. Spinner + AI thinking state

File:
- `frontend/src/components/ui/spinner.tsx`
- `frontend/src/pages/dashboard/LessonPlannerPage.tsx`
- `frontend/src/pages/dashboard/GenerationProgressPage.tsx` (if present)

Pattern:
- spinner is small and consistent; no oversaturation

### 6. Streaming content update

File:
- `frontend/src/services/chat.ts`
- `frontend/src/pages/dashboard/LessonPlannerPage.tsx`

Pattern:
- incremental `streamingContent` updates while conversation is in progress
- user sees text appear in real time without waiting for final message flush

### 7. Citation badge click reveal

File:
- `frontend/src/pages/dashboard/LessonPlannerPage.tsx`

Pattern:
- `[1]` markers become clickable badges
- clicking opens a side panel showing source context

This is one of the strongest AI UX patterns in the project.

## 8. Animation / Motion System

### Animation philosophy

The code strongly suggests a functional and restrained motion philosophy rather than decorative or cinematic motion.

Evidence:
- `framer-motion` is used in `Header.tsx`, `TeacherWorkspacePage.tsx`, and `LessonPlannerPage.tsx` but in moderate, low-intensity forms
- CSS transitions are mostly short and utility-based
- emphasis is on clarity and responsiveness rather than dramatic motion

Pattern:
- there is motion, but it is used to reinforce state, not to “wow” the user

### Motion hierarchy

Evidence from code:
- nav dropdown: `duration: 0.15`
- sidebar transform: `duration-200`
- cards: `transition-all`
- general UI uses `transition-colors`/`transition-transform` with no heavy animation stacks

This aligns with a hierarchy of:
- Micro: brief feedback and hover states
- Component: dropdown and side panel motion
- Page: subtle route transitions and scroll-to-top; not overly cinematic

### Observed motion examples

File:
- `frontend/src/components/landing/Header.tsx`
- `frontend/src/pages/dashboard/TeacherWorkspacePage.tsx`
- `frontend/src/pages/dashboard/LessonPlannerPage.tsx`

Examples:
- motion dropdown reveal
- motion card entrance from opacity/y translation
- spinner rotation
- streaming content update

There is no evidence of highly elaborate keyframe suites beyond lightweight utility animation (`animate-spin`, `animate-pulse` for cursor/pulse) and Framer Motion basic enter/exit transitions.

## 9. AI UX Patterns

### AI generation UX

Evidence:
- `LessonPlannerPage.tsx`: `streamingContent`, `streamingCitations`, `isSending`
- `chatService.sendMessageStream()` in `frontend/src/services/chat.ts`
- backend `sendMessageStream()` in `backend/src/modules/chat/chat.controller.ts`

Pattern:
- user enters prompt,
- message is appended instantly,
- assistant content streams into a live text area,
- citations emerge as they are delivered,
- final assistant message is committed when the stream ends.

### Problem-solving workflow UX

Evidence:
- screenshot `.github/screenshots/generation.png`
- `backend/src/modules/generation/generation.service.ts`

Pattern:
- show the process rather than hiding the work:
  Analysis Agent → Solver Agent → Verifier Agent
- every box clearly communicates its stage and waiting state,
- reduces black-box anxiety

### Citation UX

Evidence:
- `frontend/src/pages/dashboard/LessonPlannerPage.tsx`
- `frontend/src/services/chat.ts`
- `backend/src/modules/chat/chat.service.ts`

Pattern:
- answer text contains numbered markers like `[1]`, `[2]`
- markers are clickable and converted to source badges
- side panel displays the actual cited excerpt
- the model output is anchored to a source rather than floating in abstraction

This is a very high-value pattern for Teacher Copilot.

### AI error handling

Evidence:
- `LessonPlannerPage.tsx` catches `AbortError` and uses fallback content on error paths
- `AiService.complete()` catches provider failures and falls back to OpenAI

Pattern:
- return a meaningful error state instead of silent failure
- preserve as much user trust as possible by explaining the failure and allowing retry

## 10. Streaming UX

File:
- `frontend/src/services/chat.ts`
- `frontend/src/pages/dashboard/LessonPlannerPage.tsx`
- `backend/src/modules/chat/chat.controller.ts`

Stream state model:
- idle
- sending
- streaming content
- citations arriving
- done
- final merge

Observed UX behavior:
- content appears progressively,
- citations are collected and displayed during/after stream,
- the user can cancel the stream with a stop action,
- the UI keeps the chat thread readable while generation continues.

This is one of the most transferable AI UX patterns.

## 11. Document / Knowledge UX

Evidence:
- `DashboardLayout.tsx` includes `Library`, `Search`, and `MessageSquare` navigation
- `TeacherWorkspacePage.tsx` has “Knowledge Base” quick action card
- `README` and app architecture discuss document-workspace, research, and document upload features

Observed design pattern:
- document workflows are treated as system-level, not as a floating “upload modal only” feature
- the product keeps docs, AI chat, and learning actions in one coherent workspace model

The UI architecture clearly favors a workspace-oriented experience instead of isolated feature modules.

## 12. State Machine Patterns

### Core UI state model

Chat pattern:
- Idle → composing → sending → streaming → completed

Problem-solver pattern:
- Idle → problem entered → analysis running → solver running → verifier running → completed

Dashboard pattern:
- loading → empty → populated → active context

This is a good signal that the product avoids overloading any single view with a primitive “one state” design. Instead, the UI presents clear intermediate states.

Examples:
- `LessonPlannerPage.tsx` has `isSending`, `streamingContent`, `activeCitation`, and message list updates.
- `TeacherWorkspacePage.tsx` has loading states for stats and due cards.
- `Header.tsx` has mobile menu and feature dropdown state.

### Loading and empty states

Evidence:
- empty conversation state in screenshot
- spinner in `FullPageSpinner`
- muted text placeholders and simple loader icon

Pattern:
- failure and emptiness are not dramatic; they are calm and contained.

## 13. Responsive Patterns

Evidence from `DashboardLayout.tsx` and `Header.tsx`:
- mobile `sidebarOpen` overlay with transform and fixed positioning
- desktop sidebar remains fixed
- top header stays sticky across layouts
- content is padded differently on desktop vs mobile

Pattern:
- responsive behavior is structural and practical, not the “everything collapses” style
- the dashboard shell remains recognizable regardless of screen width

This is ideal for Teacher Copilot because it keeps the workspace stable on laptop, tablet, and smaller screens.

## 14. Accessibility Patterns

Evidence:
- `button.tsx` uses `focus-visible:ring-2` and `ring-offset-2`
- `input.tsx` uses `focus-visible:outline-none` and `focus-visible:ring-2`
- `DashboardLayout.tsx` mobile menu button has `aria-label="Toggle menu"`
- semantic `button`, `a`, `Link`, structured sections all indicate accessible usage

Pattern:
- emphasis on keyboard-accessible focus rings and clear structure
- no evidence of a major accessibility anti-pattern in the inspected components

## 15. Performance Patterns

Evidence:
- `Header.tsx` uses `queueMicrotask` to close the mobile menu after route changes
- `LessonPlannerPage.tsx` calls `scrollToBottom` on response arrival only when needed
- `TeacherWorkspacePage.tsx` loads Lottie and user metrics only after mount

Pattern:
- lightweight asynchronous rendering state management
- no heavy loading strategy appears to be over-engineered in the visible UI layer
- the app prioritizes predictable, low-latency updates rather than excessive visual complexity

## 16. Top 30 GOLD UI/UX Patterns

1. Green-accented productivity theme
2. Light neutral background with white cards
3. Fixed dashboard shell with sidebar + header
4. Sticky top header for global actions
5. Card-based layout grid for dashboards
6. Strong active nav highlighting
7. Soft hover states with minimal motion
8. Strategy of subtle borders before heavy shadows
9. Consistent rounded corners (`rounded-xl`/`rounded-lg`)
10. Data-first dashboard hierarchy
11. Calm empty states with centered layout
12. Low-noise AI chat composer
13. Prompt suggestion cards as onboarding for AI
14. Streaming AI response without black-box waiting
15. Citation badges anchored to sources
16. Source panel for document provenance
17. Process transparency in multi-agent solving
18. Quiet spinner + thinking state patterns
19. Clear mobile sidebar behavior
20. Sticky, predictable app shell
21. Input focus ring with subtle accent color
22. Consistent button variants and sizes
23. Muted metadata labels and secondary text hierarchy
24. Clear status differentiation using color and label
25. Quick action cards for productivity entry points
26. Semantic separation of main actions and secondary actions
27. Trust-building neutral color palette
28. Generous whitespace around important content blocks
29. Contrast-first readability
30. Simple, reusable primitives that scale across features

## 17. AI Teacher Copilot UI Implementation Map

### Teacher Workspace
- use a fixed left navigation for modules like lessons, docs, settings, AI workspace
- keep active modules visually distinctive with green highlight

### Document Library
- use card grids, metadata labels, and inactive/active state cues similar to dashboard cards

### Lesson Planner
- adopt a “panel + card + action” pattern for planning, generation, and summary

### Quiz Generator
- use a clean, bordered result card with concise metadata and action buttons

### Generation Editor
- use a calm result panel similar to `LessonPlannerPage` and `TeacherWorkspacePage` with clear controls and non-noisy success states

### Citation Panel
- directly reuse the pattern of numbered inline markers + side panel source preview

### Generation History
- land on a consistent card-based list rather than raw tables only

### AI streaming
- stream content in place, preserve prompt composer at bottom, show partial content and citations as they arrive

### Export / share
- keep export actions in a flat top-right or contextual action row like the app shell pattern

## 18. Pattern Guidance

### Directly reusable
- fixed shell + sticky header + sidebar
- card-based dashboard and feature surfaces
- primary green CTA system
- button and form primitive design
- citation panel UX
- streaming AI feedback pattern

### Conceptually reusable
- calm AI workflow design
- “show the process” workflow for agentic systems
- clear neutral background + crisp text for trust
- card-based module grouping

### AI Teacher Copilot-specific
- exact document-workspace branding and nav labels
- exact feature naming and product semantics
- local dashboard content for study features
- domain-specific learning quick actions

### Avoid for AI Teacher Copilot
- too much green saturation across every UI surface
- heavy reliance on one accent color for all states
- over-used card-heavy density for complex teacher workflows
- complicated, flashy animation that reduces clarity

## 19. Reference Files (AI Teacher Copilot Frontend)

- `frontend/tailwind.config.js`
- `frontend/src/index.css`
- `frontend/src/App.tsx`
- `frontend/src/layouts/DashboardLayout.tsx`
- `frontend/src/layouts/PublicLayout.tsx`
- `frontend/src/components/landing/Header.tsx`
- `frontend/src/components/ui/button.tsx`
- `frontend/src/components/ui/card.tsx`
- `frontend/src/components/ui/input.tsx`
- `frontend/src/components/ui/badge.tsx`
- `frontend/src/components/ui/spinner.tsx`
- `frontend/src/pages/dashboard/TeacherWorkspacePage.tsx`
- `frontend/src/pages/dashboard/LessonPlannerPage.tsx`
- `frontend/src/services/chat.ts`
- `.github/screenshots/dashboard-home.png`
- `.github/screenshots/ai-chat.png`
- `.github/screenshots/generation.png`

## 20. Final Design Principle for AI Teacher Copilot

The strongest AI Teacher Copilot pattern is not “AI aesthetic.” It is “clear, calm, trustworthy productivity UI.”

For an AI Teacher Copilot, the best adaptation is:
- keep the shell structured and predictable,
- use green as a careful accent rather than the dominant mood,
- show AI work visibly when appropriate,
- keep citations and sources visible,
- let cards, spacing, and focus rings do the communication,
- avoid unnecessary motion and visual noise.

This product teaches that AI software can feel premium not by being flashy, but by being calm, precise, and obvious in intent.
