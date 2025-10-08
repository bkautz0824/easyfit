"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock, Heart, Flame, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface UnresolvedWorkoutCardProps {
  workout: {
    _id: string;
    date: string;
    duration: number;
    avgHeartRate: number;
    caloriesBurned: number;
    distance?: number;
    avgPace?: string;
    avgPower?: number;
    wearableSource?: string;
  };
  isSelected?: boolean;
  onClick?: () => void;
}

export function UnresolvedWorkoutCard({
  workout,
  isSelected,
  onClick,
}: UnresolvedWorkoutCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const getWearableIcon = (source?: string) => {
    switch (source) {
      case "apple":
        return "🍎";
      case "garmin":
        return "🔷";
      case "coros":
        return "🏔️";
      case "fitbit":
        return "💚";
      case "polar":
        return "🐻‍❄️";
      default:
        return "⌚";
    }
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isSelected && "ring-2 ring-primary shadow-md"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {getWearableIcon(workout.wearableSource)}
                </span>
                <h3 className="font-semibold">Unresolved Workout</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(workout.date)}
              </p>
            </div>
            <Badge variant="destructive" className="text-xs">
              Needs Context
            </Badge>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{workout.duration} min</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Heart className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{workout.avgHeartRate} bpm</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Flame className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{workout.caloriesBurned} cal</span>
            </div>

            {workout.distance && (
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">
                  {workout.distance.toFixed(2)} km
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
