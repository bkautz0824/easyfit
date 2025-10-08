"use client";

import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VoiceRecorderComponent } from "@/components/workouts/voice-recorder";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

export default function NewWorkoutPage() {
  const [transcription, setTranscription] = useState("");

  return (
    <DashboardShell>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Log Workout</h1>
          <p className="text-muted-foreground mt-2">
            Use voice or text to log your workout
          </p>
        </div>

        <VoiceRecorderComponent
          onTranscriptionComplete={(text) => setTranscription(text)}
        />

        <Card>
          <CardHeader>
            <CardTitle>Workout Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Describe your workout here..."
              value={transcription}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTranscription((e.target as HTMLTextAreaElement).value)}
              rows={6}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
