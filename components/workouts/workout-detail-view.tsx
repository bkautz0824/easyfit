"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Heart,
  Clock,
  Flame,
  Activity,
  TrendingUp,
  Mountain,
  Zap,
  Timer,
} from "lucide-react";

interface WorkoutDetailViewProps {
  workout: {
    _id: string;
    date: string;
    duration: number;
    startTime?: string;
    endTime?: string;

    // Heart Rate
    avgHeartRate: number;
    maxHeartRate?: number;
    minHeartRate?: number;
    hrZones?: {
      zone1?: number;
      zone2?: number;
      zone3?: number;
      zone4?: number;
      zone5?: number;
    };

    // Energy
    caloriesBurned: number;
    trainingLoad?: number;

    // Distance/Speed
    distance?: number;
    avgPace?: string;
    avgSpeed?: number;

    // Cycling
    avgPower?: number;
    maxPower?: number;
    normalizedPower?: number;
    cadence?: number;

    // Running
    avgCadence?: number;
    strideLength?: number;
    verticalOscillation?: number;
    groundContactTime?: number;

    // Elevation
    elevationGain?: number;
    elevationLoss?: number;

    // Swimming
    strokeCount?: number;
    swimPace?: string;
    swolf?: number;

    wearableSource?: string;
  };
}

export function WorkoutDetailView({ workout }: WorkoutDetailViewProps) {
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return "N/A";
    const time = new Date(timeString);
    return time.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getWearableIcon = (source?: string) => {
    switch (source) {
      case "apple":
        return "🍎 Apple Health";
      case "garmin":
        return "🔷 Garmin";
      case "coros":
        return "🏔️ Coros";
      case "fitbit":
        return "💚 Fitbit";
      case "polar":
        return "🐻‍❄️ Polar";
      default:
        return "⌚ Wearable";
    }
  };

  const hasRunningMetrics =
    workout.avgCadence ||
    workout.strideLength ||
    workout.verticalOscillation ||
    workout.groundContactTime;

  const hasCyclingMetrics =
    workout.avgPower || workout.maxPower || workout.cadence;

  const hasSwimmingMetrics =
    workout.strokeCount || workout.swimPace || workout.swolf;

  const hasElevationMetrics = workout.elevationGain || workout.elevationLoss;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Workout Details</h2>
          <Badge variant="destructive">Needs Voice Context</Badge>
        </div>
        <p className="text-muted-foreground">{formatDateTime(workout.date)}</p>
        <p className="text-sm text-muted-foreground">
          Source: {getWearableIcon(workout.wearableSource)}
        </p>
      </div>

      {/* Time Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Duration & Timing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-semibold">{workout.duration} minutes</span>
          </div>
          {workout.startTime && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start Time</span>
              <span className="font-semibold">
                {formatTime(workout.startTime)}
              </span>
            </div>
          )}
          {workout.endTime && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">End Time</span>
              <span className="font-semibold">
                {formatTime(workout.endTime)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Heart Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Heart Rate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Average</p>
              <p className="text-2xl font-bold">{workout.avgHeartRate}</p>
              <p className="text-xs text-muted-foreground">bpm</p>
            </div>
            {workout.maxHeartRate && (
              <div>
                <p className="text-sm text-muted-foreground">Max</p>
                <p className="text-2xl font-bold">{workout.maxHeartRate}</p>
                <p className="text-xs text-muted-foreground">bpm</p>
              </div>
            )}
            {workout.minHeartRate && (
              <div>
                <p className="text-sm text-muted-foreground">Min</p>
                <p className="text-2xl font-bold">{workout.minHeartRate}</p>
                <p className="text-xs text-muted-foreground">bpm</p>
              </div>
            )}
          </div>

          {workout.hrZones && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Time in HR Zones</p>
                <div className="space-y-2">
                  {workout.hrZones.zone1 !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Zone 1 (Recovery)</span>
                      <span className="text-sm font-semibold">
                        {workout.hrZones.zone1}%
                      </span>
                    </div>
                  )}
                  {workout.hrZones.zone2 !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Zone 2 (Endurance)</span>
                      <span className="text-sm font-semibold">
                        {workout.hrZones.zone2}%
                      </span>
                    </div>
                  )}
                  {workout.hrZones.zone3 !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Zone 3 (Tempo)</span>
                      <span className="text-sm font-semibold">
                        {workout.hrZones.zone3}%
                      </span>
                    </div>
                  )}
                  {workout.hrZones.zone4 !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Zone 4 (Threshold)</span>
                      <span className="text-sm font-semibold">
                        {workout.hrZones.zone4}%
                      </span>
                    </div>
                  )}
                  {workout.hrZones.zone5 !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Zone 5 (Max)</span>
                      <span className="text-sm font-semibold">
                        {workout.hrZones.zone5}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Energy Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            Energy Expenditure
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Calories Burned</span>
            <span className="font-semibold text-lg">
              {workout.caloriesBurned} cal
            </span>
          </div>
          {workout.trainingLoad && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Training Load</span>
              <span className="font-semibold text-lg">
                {workout.trainingLoad}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distance & Speed */}
      {(workout.distance || workout.avgPace || workout.avgSpeed) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Distance & Speed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {workout.distance && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Distance</span>
                <span className="font-semibold">
                  {workout.distance.toFixed(2)} km
                </span>
              </div>
            )}
            {workout.avgPace && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Average Pace</span>
                <span className="font-semibold">{workout.avgPace}</span>
              </div>
            )}
            {workout.avgSpeed && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Average Speed</span>
                <span className="font-semibold">
                  {workout.avgSpeed.toFixed(2)} km/h
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cycling Metrics */}
      {hasCyclingMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Cycling Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {workout.avgPower && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Average Power</span>
                <span className="font-semibold">{workout.avgPower}W</span>
              </div>
            )}
            {workout.maxPower && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Power</span>
                <span className="font-semibold">{workout.maxPower}W</span>
              </div>
            )}
            {workout.normalizedPower && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Normalized Power</span>
                <span className="font-semibold">
                  {workout.normalizedPower}W
                </span>
              </div>
            )}
            {workout.cadence && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cadence</span>
                <span className="font-semibold">{workout.cadence} rpm</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Running Metrics */}
      {hasRunningMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Running Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {workout.avgCadence && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cadence</span>
                <span className="font-semibold">{workout.avgCadence} spm</span>
              </div>
            )}
            {workout.strideLength && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stride Length</span>
                <span className="font-semibold">
                  {workout.strideLength.toFixed(2)}m
                </span>
              </div>
            )}
            {workout.verticalOscillation && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Vertical Oscillation
                </span>
                <span className="font-semibold">
                  {workout.verticalOscillation.toFixed(1)}cm
                </span>
              </div>
            )}
            {workout.groundContactTime && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Ground Contact Time
                </span>
                <span className="font-semibold">
                  {workout.groundContactTime}ms
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Elevation */}
      {hasElevationMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mountain className="h-5 w-5" />
              Elevation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {workout.elevationGain && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Elevation Gain</span>
                <span className="font-semibold">
                  {workout.elevationGain}m ↑
                </span>
              </div>
            )}
            {workout.elevationLoss && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Elevation Loss</span>
                <span className="font-semibold">
                  {workout.elevationLoss}m ↓
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Swimming Metrics */}
      {hasSwimmingMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Swimming Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {workout.strokeCount && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stroke Count</span>
                <span className="font-semibold">{workout.strokeCount}</span>
              </div>
            )}
            {workout.swimPace && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Swim Pace</span>
                <span className="font-semibold">{workout.swimPace}</span>
              </div>
            )}
            {workout.swolf && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">SWOLF</span>
                <span className="font-semibold">{workout.swolf}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
