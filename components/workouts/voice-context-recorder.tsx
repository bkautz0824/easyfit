"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceContextRecorderProps {
  workoutId: string;
  onContextSubmitted?: () => void;
}

export function VoiceContextRecorder({
  workoutId,
  onContextSubmitted,
}: VoiceContextRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const { toast } = useToast();

  const handleStartRecording = async () => {
    // TODO: Implement actual voice recording with ElevenLabs/Deepgram
    setIsRecording(true);
    toast({
      title: "Recording Started",
      description: "Speak about your workout experience...",
    });
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    setIsProcessing(true);

    // TODO: Implement actual transcription and Claude processing
    // For now, just simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "Voice Processed",
        description: "Your workout context has been analyzed.",
      });
    }, 2000);
  };

  const handleSubmit = async () => {
    if (!transcript.trim()) {
      toast({
        title: "No Content",
        description: "Please record or type your workout context.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // TODO: Implement actual submission
      // 1. Process transcript with Claude to extract context
      // 2. Save to workoutContext table
      // 3. Update workout status to "resolved"

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast({
        title: "Context Saved",
        description: "Workout has been marked as resolved.",
      });

      onContextSubmitted?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save workout context.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Add Voice Context
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Describe your workout experience: What type of workout was it? How did
          you feel? Any pain points or highlights? What was your energy level?
        </p>

        {/* Voice Recording Controls */}
        <div className="flex gap-2">
          {!isRecording ? (
            <Button
              onClick={handleStartRecording}
              disabled={isProcessing}
              className="flex-1"
            >
              <Mic className="mr-2 h-4 w-4" />
              Start Recording
            </Button>
          ) : (
            <Button
              onClick={handleStopRecording}
              variant="destructive"
              className="flex-1"
            >
              <MicOff className="mr-2 h-4 w-4" />
              Stop Recording
            </Button>
          )}
        </div>

        {isRecording && (
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center gap-2 text-red-500">
              <div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
              <span className="text-sm font-medium">Recording...</span>
            </div>
          </div>
        )}

        {/* Manual Transcript Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Or type manually:</label>
          <Textarea
            placeholder="Example: Did a 5k tempo run this morning. Felt great for the first 3k but struggled with pacing in the last 2k. Left knee felt a bit tight on the downhills. Overall energy was good, RPE around 7/10."
            value={transcript}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTranscript((e.target as HTMLTextAreaElement).value)}
            rows={6}
            disabled={isRecording || isProcessing}
          />
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isProcessing || isRecording || !transcript.trim()}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing with AI...
            </>
          ) : (
            "Save Context & Mark Resolved"
          )}
        </Button>

        {isProcessing && (
          <p className="text-xs text-center text-muted-foreground">
            AI is analyzing your workout context...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
