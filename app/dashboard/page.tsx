"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { UnresolvedWorkoutCard } from "@/components/workouts/unresolved-workout-card";
import { WorkoutDetailView } from "@/components/workouts/workout-detail-view";
import { VoiceContextRecorder } from "@/components/workouts/voice-context-recorder";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

export default function DashboardPage() {
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<Id<"workouts"> | null>(null);

  // TEMP: Hardcoded user ID for testing (auth disabled)
  const userId = "test-user-123";

  const unresolvedWorkouts = useQuery(api.workouts.getUnresolvedWorkouts, { userId });
  const selectedWorkout = unresolvedWorkouts?.find(w => w._id === selectedWorkoutId);

  const handleWorkoutClick = (workoutId: Id<"workouts">) => {
    setSelectedWorkoutId(workoutId);
  };

  const handleContextSubmitted = () => {
    // Reset selection and refetch will happen automatically via Convex reactivity
    setSelectedWorkoutId(null);
  };

  return (
    <DashboardShell>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Workout Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Review and add context to your recent workouts
          </p>
        </div>

        {/* Split Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[calc(100vh-12rem)]">
          {/* Left Panel - Unresolved Workouts */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Needs Context
                {unresolvedWorkouts && unresolvedWorkouts.length > 0 && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({unresolvedWorkouts.length})
                  </span>
                )}
              </h2>
            </div>

            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="space-y-3 pr-4">
                {!unresolvedWorkouts && (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        Loading workouts...
                      </p>
                    </CardContent>
                  </Card>
                )}

                {unresolvedWorkouts && unresolvedWorkouts.length === 0 && (
                  <Card>
                    <CardContent className="py-8 text-center space-y-2">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                      <p className="text-sm font-medium">All caught up!</p>
                      <p className="text-xs text-muted-foreground">
                        No workouts need context right now.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {unresolvedWorkouts && unresolvedWorkouts.map((workout) => (
                  <UnresolvedWorkoutCard
                    key={workout._id}
                    workout={workout}
                    isSelected={selectedWorkoutId === workout._id}
                    onClick={() => handleWorkoutClick(workout._id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel - Workout Details & Voice Context */}
          <div className="lg:col-span-2">
            {!selectedWorkout ? (
              <Card className="h-full">
                <CardContent className="flex items-center justify-center h-full min-h-[400px]">
                  <div className="text-center space-y-2">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="text-lg font-medium">Select a workout</p>
                    <p className="text-sm text-muted-foreground">
                      Click on a workout from the left to view details and add context
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[calc(100vh-12rem)]">
                <div className="space-y-6 pr-4">
                  {/* Workout Details */}
                  <WorkoutDetailView workout={selectedWorkout} />

                  {/* Voice Context Recorder */}
                  <VoiceContextRecorder
                    workoutId={selectedWorkout._id}
                    onContextSubmitted={handleContextSubmitted}
                  />
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
