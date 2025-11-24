# Workout Assistant - Frontend Overview

## Design System
- **UI Library**: Shadcn UI + Tailwind CSS
- **Icons**: Lucide React
- **Theme**: Light/Dark mode support
- **Color Scheme**: Blue primary, gradient backgrounds (blue-50 to indigo-100)

---

## Page Layouts

### 1. Landing Page (`/`)
**Purpose**: Marketing/authentication entry point

**Layout**:
- Full-screen centered hero
- Gradient background (blue-50 to indigo-100, dark: gray-900 to gray-800)
- Activity icon (16x16) centered above title
- Main heading: "Workout Assistant"
- Subheading: "AI-powered workout tracking and coaching with voice-first interface"
- Two CTAs: "Get Started" (primary) and "Sign In" (outline)

---

### 2. Dashboard (`/dashboard`)
**Purpose**: Main workspace for resolving unresolved workouts

**Layout**: Split-panel (3-column grid on desktop)

**Left Panel (1/3 width)**:
- **Header**: "Needs Context" with count badge and AlertCircle icon
- **Workout List**: Scrollable cards showing:
  - Date (e.g., "Tuesday, October 29")
  - Duration, heart rate, calories
  - Distance/pace (if available)
  - Clickable to select
  - Active state highlighting

**Right Panel (2/3 width)**:
- **When no workout selected**:
  - Empty state with CheckCircle icon
  - "Select a workout to add context"

- **When workout selected**:
  - **Top Section**: Detailed workout metrics card
    - Heart rate zones visualization
    - Calories, distance, pace, elevation
    - Duration, training load
  - **Bottom Section**: Voice/text context recorder
    - Microphone button (red when recording)
    - Real-time transcription display
    - Text input fallback
    - Submit button

**Features**:
- Real-time updates via Convex
- Loading states with spinner
- Auto-deselect after context submission

---

### 3. Insights Page (`/insights`)
**Purpose**: AI-generated workout analysis and pattern recognition

**Layout**: Single column with expandable workout cards

**Header**:
- Title: "Training Log & Insights"
- Description: "Generate AI insights by analyzing your complete workout history. Each insight is a snapshot of your training at that moment."

**Workout Cards** (for each resolved workout):
- **Card Header**:
  - Activity icon + workout type + date
  - Duration, avg HR, calories, distance
  - "Generate Insights" button (Brain icon)
    - Shows "Analyzing..." when loading
    - Text changes to "Create New Checkpoint" if insights exist

- **Card Body** (2-column grid):
  - **Left Column - Objective Metrics**:
    - Duration (Clock icon)
    - Avg/Max heart rate (Heart icon)
    - Calories (Zap icon)
    - Distance/pace (Target/TrendingUp icons)

  - **Right Column - Subjective Context**:
    - RPE score (/10)
    - Mood (capitalized)
    - Energy level (capitalized)
    - Theme badges (max 3 shown)
    - Pain points count (AlertTriangle icon, red)
    - "View/Hide full notes" toggle
    - Voice transcript (italic, in muted box)

- **Insights Section** (if generated):
  - Separator line
  - "Insight Checkpoints (X)" header
  - Metadata: "Based on X workout(s)"
  - **Individual Insight Badges**:
    - Priority icon (high/medium/low with color)
    - Category badge (pattern/recovery/injury_risk/performance/recommendation)
    - Confidence percentage
    - Insight text (2-4 sentences)
    - Related theme/body part tags

**Color Coding**:
- Performance: Blue
- Recovery: Green
- Injury Risk: Red
- Pattern: Purple
- Recommendation: Orange

---

### 4. Plans Page (`/plans`)
**Purpose**: Training plan management (placeholder)

**Layout**:
- DashboardShell wrapper
- "Training Plans" heading
- Coming soon message or plan list

---

### 5. Settings Page (`/settings`)
**Purpose**: User preferences and account management

**Layout**:
- DashboardShell wrapper
- "Settings" heading
- Form sections for user preferences

---

### 6. New Workout Page (`/workouts/new`)
**Purpose**: Manual workout creation

**Layout**:
- DashboardShell wrapper
- Form for manual workout entry
- Fields for duration, HR, calories, etc.

---

### 7. Auth Pages (`/login`, `/register`)
**Purpose**: Authentication

**Layout**:
- Centered forms
- BetterAuth integration
- Email/password fields
- Social login options (if configured)

---

## Shared Components

### DashboardShell
- **Sidebar Navigation**:
  - Logo/branding
  - Nav items: Dashboard, Insights, Plans, Settings
  - Active state styling
  - User profile section
  - Logout button

- **Main Content Area**:
  - Padding and max-width constraints
  - Responsive layout

### UnresolvedWorkoutCard
- Compact card design
- Date header
- Metric row (duration, HR, calories)
- Distance/pace row (conditional)
- Hover/active states
- Click handler

### WorkoutDetailView
- Expandable metrics grid
- Heart rate zone visualization
- Metric cards with icons
- Conditional rendering for optional fields

### VoiceContextRecorder
- Microphone button (circular, red when active)
- Live transcription text area
- Text input fallback
- Character count
- Submit button
- Loading states

---

## Data Flow

### Dashboard
1. User logs in → redirected to `/dashboard`
2. Fetch unresolved workouts (Convex query)
3. User clicks workout → show detail view
4. User records voice/types text → transcribe → extract context → save
5. Workout moves to "resolved" status → removed from list

### Insights
1. User navigates to `/insights`
2. Fetch resolved workouts + existing insights (Convex queries)
3. User clicks "Generate Insights" on a workout
4. API call to `/api/insights/generate-single` with workoutId
5. Claude analyzes ALL workout history
6. Returns 3-8 insights based on data volume
7. Insights saved to Convex with `analysisSnapshot` metadata
8. UI updates reactively to show new insights

---

## Key UX Patterns

### Voice Recording Flow
1. Click microphone → turns red
2. Speak naturally about workout
3. Live transcription appears below
4. Click again to stop → processing
5. Submit to save context

### Insight Generation Flow
1. Button states: "Generate Insights" → "Analyzing..." → "Create New Checkpoint"
2. Loading spinner during API call (20-30s)
3. Success toast: "Insight generated successfully!"
4. Insights appear below workout in expandable section
5. User can generate multiple checkpoints over time

### Data Pairing
- Objective data (wearable) + Subjective data (voice/text) = Complete picture
- Two-column layout emphasizes this pairing
- Icons help distinguish metric types

---

## Responsive Behavior

### Desktop (lg+)
- 3-column grid on dashboard
- 2-column workout card layout
- Full sidebar visible

### Tablet (md)
- 2-column grids collapse to single column
- Sidebar becomes collapsible/drawer

### Mobile (sm)
- All single column
- Hamburger menu for navigation
- Stacked metrics
- Full-width cards

---

## Loading & Error States

### Loading
- Spinner with "Loading..." text
- Centered in container
- Muted foreground color

### Empty States
- Icon + message
- Call-to-action when relevant
- Examples: "No workouts yet", "Select a workout"

### Errors
- Toast notifications (sonner)
- Inline error messages
- Retry buttons where applicable

---

## Animation & Interactions

### Hover States
- Card elevation increase
- Background color change
- Button color transitions

### Active States
- Selected workout: border + background highlight
- Active nav item: background + text color change

### Transitions
- Smooth color transitions (tailwind defaults)
- Loading spinners (animate-spin)
- Expandable sections (smooth height transition)

---

## Icons Usage

- Activity: Workout/fitness
- Brain: AI/insights
- Heart: Heart rate metrics
- Clock: Duration/time
- Zap: Calories/energy
- Target: Distance/goals
- TrendingUp: Performance/pace
- AlertTriangle: Pain/warnings
- Sparkles: AI-generated content
- CheckCircle: Completion/success
- AlertCircle: Needs attention

---

## Color Semantics

### Status Colors
- Success: Green (CheckCircle, recovery)
- Warning: Yellow/Orange (medium priority)
- Error: Red (high priority, injury risk, pain)
- Info: Blue (performance, patterns)
- Neutral: Purple (patterns, general insights)

### UI Colors
- Primary: Blue (CTAs, links, active states)
- Muted: Gray (secondary text, borders)
- Background: White/Dark gray (theme-dependent)
- Card: White/Dark card (elevated surfaces)

---

## Typography Scale

- Headings:
  - H1: 3xl (30px) - Page titles
  - H2: lg (18px) - Section headers
  - H3: base (16px) - Card titles
  - H4: sm (14px) - Subsections

- Body:
  - Default: base (16px)
  - Small: sm (14px) - Metadata, labels
  - Xs: xs (12px) - Badges, tags

---

## Component Hierarchy

```
App
├── Landing (/)
├── Auth (/login, /register)
└── Dashboard Layout (authenticated)
    ├── Sidebar
    ├── Dashboard (/dashboard)
    │   ├── UnresolvedWorkoutCard (list)
    │   ├── WorkoutDetailView
    │   └── VoiceContextRecorder
    ├── Insights (/insights)
    │   └── WorkoutInsightCard (list)
    │       ├── Objective Metrics
    │       ├── Subjective Context
    │       └── Insight Badges (list)
    ├── Plans (/plans)
    ├── Settings (/settings)
    └── New Workout (/workouts/new)
```

---

## Future Enhancements (Not Implemented)

- Training plan generation
- Progress charts/graphs
- Social features (sharing workouts)
- Wearable device direct sync
- Multi-language support
- Export data (CSV, PDF)
- Advanced filtering/search
- Calendar view of workouts
- Goal setting and tracking
- Notification preferences
