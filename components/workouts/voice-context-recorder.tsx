"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useDevUser } from "@/hooks/use-dev-user";
import { validateTranscriptBeforeProcessing } from "@/lib/agents/context-validator";

interface VoiceContextRecorderProps {
  workoutId: Id<"workouts">;
  onContextSubmitted?: () => void;
}

export function VoiceContextRecorder({
  workoutId,
  onContextSubmitted,
}: VoiceContextRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [processingStep, setProcessingStep] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { toast } = useToast();
  const { userId } = useDevUser();
  const createContext = useMutation(api.workoutContext.createContext);

  const handleStartRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Collect audio chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);

      toast({
        title: "Recording Started",
        description: "Speak about your workout experience...",
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Microphone Error",
        description: "Please grant microphone permissions to use voice recording.",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    setIsRecording(false);
    setIsProcessing(true);
    setProcessingStep("Transcribing audio...");

    // Stop recording
    mediaRecorderRef.current.stop();

    // Stop all audio tracks
    mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());

    // Wait for the stop event and process audio
    mediaRecorderRef.current.onstop = async () => {
      try {
        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        // Send to transcription endpoint
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");

        const transcribeResponse = await fetch("/api/openai/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!transcribeResponse.ok) {
          throw new Error("Transcription failed");
        }

        const { transcript: transcribedText } = await transcribeResponse.json();
        setTranscript(transcribedText);

        toast({
          title: "Transcription Complete",
          description: "Review and edit the transcript if needed, then save.",
        });
      } catch (error) {
        console.error("Error processing audio:", error);
        toast({
          title: "Processing Error",
          description: "Failed to transcribe audio. Please try again or type manually.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
        setProcessingStep("");
      }
    };
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

    if (!userId) {
      toast({
        title: "Authentication Error",
        description: "User not found. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessingStep("Extracting workout context with AI...");

    try {
      // Step 1: Extract structured data from transcript using Claude
      const extractResponse = await fetch("/api/workouts/extract-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      if (!extractResponse.ok) {
        throw new Error("Context extraction failed");
      }

      const extractedData = await extractResponse.json();

      setProcessingStep("Generating semantic embeddings...");

      // Step 2: Generate embedding for semantic search
      const embedResponse = await fetch("/api/openai/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });

      if (!embedResponse.ok) {
        throw new Error("Embedding generation failed");
      }

      const { embedding } = await embedResponse.json();

      setProcessingStep("Saving to database...");

      // Step 3: Save to Convex and Pinecone
      const saveResponse = await fetch("/api/workouts/save-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workoutId,
          userId,
          transcript,
          extractedData,
          embedding,
        }),
      });

      if (!saveResponse.ok) {
        throw new Error("Failed to save context");
      }

      toast({
        title: "Context Saved Successfully",
        description: "Workout has been marked as resolved with AI insights.",
      });

      // Reset form
      setTranscript("");
      onContextSubmitted?.();
    } catch (error) {
      console.error("Error saving context:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save workout context.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
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
        {/* Helpful prompts for better context */}
        <div className="bg-muted/50 p-3 rounded-lg space-y-2">
          <p className="text-sm font-medium">Quick tips for quality insights:</p>
          <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
            <li><strong>Intensity:</strong> How hard was it? (1-10 or easy/moderate/hard)</li>
            <li><strong>Body parts:</strong> What did you work? (legs, chest, etc.)</li>
            <li><strong>Energy/Mood:</strong> How did you feel before/during?</li>
            <li><em>Bonus:</em> Any pain? What went well or was challenging?</li>
          </ul>
        </div>

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
          <label className="text-sm font-medium">
            {transcript ? "Review & Edit Transcript:" : "Or type manually:"}
          </label>
          <Textarea
            placeholder="Example: Did a 5k tempo run this morning. Felt great for the first 3k but struggled with pacing in the last 2k. Left knee felt a bit tight on the downhills. Overall energy was good, RPE around 7/10."
            value={transcript}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setTranscript((e.target as HTMLTextAreaElement).value)
            }
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
              {processingStep || "Processing with AI..."}
            </>
          ) : (
            "Save Context & Mark Resolved"
          )}
        </Button>

        {isProcessing && processingStep && (
          <p className="text-xs text-center text-muted-foreground">
            {processingStep}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
