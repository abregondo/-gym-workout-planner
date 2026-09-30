# Gym Workout Planner - FitForge

## Build & Run Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx drizzle-kit push` - Push schema to SQLite
- `npx drizzle-kit studio` - Open Drizzle Studio

## Tech Stack
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- shadcn/ui (base-nova style)
- Drizzle ORM + SQLite
- Better Auth
- Recharts
- Lucide React icons

## Project Structure
- `src/app/(auth)/` - Login and register pages
- `src/app/(dashboard)/` - All dashboard pages (protected)
- `src/components/` - Reusable UI components
- `src/lib/` - Utilities, auth config, database
- `src/lib/db/` - Drizzle schema and database connection
- `data/gym.db` - SQLite database file

## Design Tokens
- Primary: Electric blue (#6366f1 indigo)
- Dark mode: Deep navy with subtle blue tints
- Light mode: Clean white with subtle gray tints
- Accent colors for PRs (yellow), goals (purple), progress (green)
