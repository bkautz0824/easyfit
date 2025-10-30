"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDevUser } from "@/hooks/use-dev-user";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Sparkles, TrendingUp, Heart, AlertTriangle, Target, Award, Activity, Clock, Zap, Brain } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

export default function InsightsPage() {
  const { userId } = useDevUser();
  const [generatingForWorkout, setGeneratingForWorkout] = useState<string | null>(null);

  // Fetch resolved workouts (workouts with context)
  const resolvedWorkouts = useQuery(
    api.workouts.getResolvedWorkouts,
    userId ? { userId } : "skip"
  );

  // Fetch all insights
  const allInsights = useQuery(
    api.insights.getInsights,
    userId ? { userId, limit: 100 } : "skip"
  );

  const handleGenerateInsight = async (workoutId: Id<"workouts">) => {
    if (!userId) {
      toast.error("Please log in to generate insights");
      return;
    }

    setGeneratingForWorkout(workoutId);
    try {
      const response = await fetch("/api/insights/generate-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, workoutId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Insight generated successfully!");
      } else {
        toast.error(data.error || "Failed to generate insight");
      }
    } catch (error) {
      console.error("Error generating insight:", error);
      toast.error("Failed to generate insight");
    } finally {
      setGeneratingForWorkout(null);
    }
  };

  // Get insights for a specific workout
  const getWorkoutInsights = (workoutId: Id<"workouts">) => {
    return allInsights?.filter((insight) =>
      insight.workoutIds.includes(workoutId)
    ) || [];
  };

  return (
    <DashboardShell>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Training Log & Insights</h1>
          <p className="text-muted-foreground mt-2">
            Generate AI insights by analyzing your complete workout history. Each insight is a snapshot of your training at that moment.
          </p>
        </div>

        {/* Workouts List */}
        {!resolvedWorkouts ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : resolvedWorkouts.length > 0 ? (
          <div className="space-y-6">
            {resolvedWorkouts.map((workout) => (
              <WorkoutInsightCard
                key={workout._id}
                workout={workout}
                userId={userId!}
                insights={getWorkoutInsights(workout._id)}
                onGenerateInsight={handleGenerateInsight}
                isGenerating={generatingForWorkout === workout._id}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Resolved Workouts Yet</CardTitle>
              <CardDescription>
                Add context to your workouts on the dashboard to see them here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Once you add voice or text context to your wearable workouts, they'll appear here where you can generate AI insights.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}

// Workout card that shows objective + subjective data together
function WorkoutInsightCard({
  workout,
  userId,
  insights,
  onGenerateInsight,
  isGenerating,
}: {
  workout: any;
  userId: string;
  insights: any[];
  onGenerateInsight: (workoutId: Id<"workouts">) => void;
  isGenerating: boolean;
}) {
  const [showContext, setShowContext] = useState(false);

  // Fetch context for this workout
  const context = useQuery(
    api.workoutContext.getByWorkout,
    { workoutId: workout._id }
  );

  const hasInsights = insights.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {workout.type || "Workout"} - {new Date(workout.date).toLocaleDateString()}
            </CardTitle>
            <CardDescription className="mt-1">
              {workout.duration} min • {workout.avgHeartRate} avg HR • {workout.caloriesBurned} cal
              {workout.distance && ` • ${workout.distance.toFixed(2)} mi`}
            </CardDescription>
          </div>
          <Button
            onClick={() => onGenerateInsight(workout._id)}
            disabled={isGenerating || !context}
            size="sm"
            className="gap-2"
            title="Analyze all workouts and create an insight checkpoint"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4" />
                {hasInsights ? "Create New Checkpoint" : "Generate Insights"}
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Objective + Subjective Data */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Objective Data */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Objective Metrics
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{workout.duration} min</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Avg HR:</span>
                <span className="font-medium">{workout.avgHeartRate} bpm</span>
              </div>
              {workout.maxHeartRate && (
                <div className="flex items-center gap-2">
                  <Heart className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Max HR:</span>
                  <span className="font-medium">{workout.maxHeartRate} bpm</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Calories:</span>
                <span className="font-medium">{workout.caloriesBurned}</span>
              </div>
              {workout.distance && (
                <div className="flex items-center gap-2">
                  <Target className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Distance:</span>
                  <span className="font-medium">{workout.distance.toFixed(2)} mi</span>
                </div>
              )}
              {workout.avgPace && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Pace:</span>
                  <span className="font-medium">{workout.avgPace}/mi</span>
                </div>
              )}
            </div>
          </div>

          {/* Subjective Context */}
          {context ? (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Subjective Context
              </h4>
              <div className="space-y-2 text-sm">
                {context.perceivedExertion && (
                  <div>
                    <span className="text-muted-foreground">RPE:</span>{" "}
                    <span className="font-medium">{context.perceivedExertion}/10</span>
                  </div>
                )}
                {context.mood && (
                  <div>
                    <span className="text-muted-foreground">Mood:</span>{" "}
                    <span className="font-medium capitalize">{context.mood}</span>
                  </div>
                )}
                {context.energyLevel && (
                  <div>
                    <span className="text-muted-foreground">Energy:</span>{" "}
                    <span className="font-medium capitalize">{context.energyLevel}</span>
                  </div>
                )}
                {context.themes && context.themes.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {context.themes.slice(0, 3).map((theme: string) => (
                      <Badge key={theme} variant="secondary" className="text-xs">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                )}
                {context.painPoints && context.painPoints.length > 0 && (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="text-xs">{context.painPoints.length} pain point(s)</span>
                  </div>
                )}
                {context.voiceTranscript && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowContext(!showContext)}
                    className="text-xs h-auto p-1"
                  >
                    {showContext ? "Hide" : "View"} full notes
                  </Button>
                )}
              </div>
              {showContext && context.voiceTranscript && (
                <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                  <p className="italic text-muted-foreground">"{context.voiceTranscript}"</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center text-muted-foreground text-sm">
              <p>No subjective context added</p>
            </div>
          )}
        </div>

        {/* Generated Insights */}
        {hasInsights && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Insight Checkpoints ({insights.length})
                </h4>
                {insights[0]?.metadata?.analysisSnapshot && (
                  <span className="text-xs text-muted-foreground">
                    Based on {insights[0].metadata.analysisSnapshot.totalWorkoutsAnalyzed} workout(s)
                  </span>
                )}
              </div>
              {insights.map((insight) => (
                <InsightBadge key={insight._id} insight={insight} />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Small insight display component
function InsightBadge({ insight }: { insight: any }) {
  const categoryColors: Record<string, string> = {
    performance: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    recovery: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    injury_risk: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    pattern: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    recommendation: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  };

  const priorityIcons: Record<string, React.ReactNode> = {
    high: <AlertTriangle className="h-3 w-3 text-red-500" />,
    medium: <TrendingUp className="h-3 w-3 text-yellow-500" />,
    low: <Sparkles className="h-3 w-3 text-blue-500" />,
  };

  return (
    <div className="p-3 border rounded-lg space-y-2">
      <div className="flex items-center gap-2">
        {insight.priority && priorityIcons[insight.priority]}
        <Badge className={categoryColors[insight.category] || "bg-gray-100 text-gray-800"}>
          {insight.category.replace("_", " ")}
        </Badge>
        {insight.confidence && (
          <span className="text-xs text-muted-foreground">
            {Math.round(insight.confidence * 100)}% confidence
          </span>
        )}
      </div>
      <p className="text-sm">{insight.insightText}</p>
      {insight.metadata && (insight.metadata.relatedThemes?.length > 0 || insight.metadata.relatedBodyParts?.length > 0) && (
        <div className="flex gap-2 flex-wrap text-xs">
          {insight.metadata.relatedThemes?.map((theme: string) => (
            <Badge key={theme} variant="outline" className="text-xs">
              {theme}
            </Badge>
          ))}
          {insight.metadata.relatedBodyParts?.map((part: string) => (
            <Badge key={part} variant="outline" className="text-xs text-red-600">
              {part}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
