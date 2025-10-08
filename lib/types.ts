// User types
export interface User {
  userId: string;
  name: string;
  email: string;
  preferences?: UserPreferences;
  fitnessProfile?: FitnessProfile;
  wearables?: WearableConnection[];
}

export interface UserPreferences {
  theme?: string;
  notifications?: boolean;
  weeklyGoal?: number;
  primaryGoal?: string;
}

export interface FitnessProfile {
  height?: number;
  weight?: number;
  activityLevel?: string;
  trainingExperience?: string;
  injuries?: string[];
}

export interface WearableConnection {
  provider: string;
  accessToken: string;
  refreshToken?: string;
  lastSync?: string;
}

// Workout types
export interface Workout {
  _id: string;
  userId: string;
  date: string;
  type?: string;
  duration: number;
  avgHeartRate: number;
  maxHeartRate?: number;
  caloriesBurned: number;
  notes?: string;
}

export interface CreateWorkoutInput {
  userId: string;
  date: string;
  type?: string;
  duration: number;
  avgHeartRate: number;
  maxHeartRate?: number;
  caloriesBurned: number;
  notes?: string;
}

// Insight types
export interface Insight {
  _id: string;
  userId: string;
  workoutIds: string[];
  insightText: string;
  category: "recovery" | "performance" | "pattern" | "warning";
  generatedAt: string;
  confidence?: number;
}

// Training plan types
export interface Exercise {
  name: string;
  sets?: number;
  reps?: string;
  duration?: string;
  notes?: string;
}

export interface TrainingDay {
  day: string;
  workoutType: string;
  title: string;
  description?: string;
  duration: number;
  intensity: number;
  exercises: Exercise[];
}

export interface TrainingPlan {
  _id: string;
  userId: string;
  startDate: string;
  endDate: string;
  focus: string;
  days: TrainingDay[];
  notes?: string;
  generatedAt: string;
}

// Conversation types
export interface Conversation {
  _id: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
