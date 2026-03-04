# NeuralPlay – AI/ML Gamified Learning Platform

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Homepage with hero section ("Learn AI by Playing"), AI progress tracker, credit system display, featured tasks
- Task Catalogue with Beginner / Intermediate / Advanced categories, each task shows credits reward
- Step-by-Step Task Page with instructions, mini challenges, real-time feedback, reward points system
- AI Credit System Dashboard showing earned credits, badges, level progress bar
- Sign Up / Login page (email-based auth via authorization component)
- About Page with mission, vision, how gamified AI learning works
- Contact Page with form, email, and social links
- Gamification: leaderboard, daily challenges, achievement badges, streak rewards
- Fully mobile-responsive layout

### Modify
- Nothing (new project)

### Remove
- Nothing (new project)

## Implementation Plan

### Backend (Motoko)
- User profile: principal → { username, email, level, credits, streak, badges, completedTasks }
- Task registry: taskId → { title, description, category, difficulty, creditReward, steps }
- Task completion: record completion, award credits, update streak
- Leaderboard: query top users by credits
- Daily challenge: one featured task per day
- Badge system: award badges based on milestones (first task, 10 tasks, streak 7 days, etc.)
- Contact form submission: store messages

### Frontend Pages
1. **Homepage** – Hero, progress bar, credits widget, featured daily challenge, task highlights
2. **Task Catalogue** – Filter tabs (All / Beginner / Intermediate / Advanced), task cards with category badge, credit reward, difficulty
3. **Task Detail / Step-by-Step** – Stepper UI, instructions per step, mini quiz/challenge, submit for credits, real-time feedback
4. **AI Credits Dashboard** – Credits total, level progress, badges grid, streak counter, recent activity
5. **Leaderboard** – Top 10 users ranked by credits, current user position
6. **Auth** – Sign Up / Login form wired to authorization component
7. **About** – Mission/vision sections, how-it-works timeline
8. **Contact** – Form (name, email, message), social links

### Gamification Mechanics
- Credits earned per task completion (varies by difficulty)
- Level thresholds: 0–99 Novice, 100–299 Explorer, 300–599 Practitioner, 600+ Master
- Streak: consecutive days with at least one task completed
- Badges: Welcome, First Task, Streak 3, Streak 7, 10 Tasks, 25 Tasks, Master Level
- Daily challenge highlighted on homepage and catalogue
