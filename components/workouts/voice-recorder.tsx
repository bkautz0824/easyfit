"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Square, Loader2 } from "lucide-react";
import { VoiceRecorder } from "@/lib/voice/recorder";
import { transcribeAudio } from "@/lib/voice/transcription";
import { useToast } from "@/hooks/use-toast";

export function VoiceRecorderComponent({
  onTranscriptionComplete,
}: {
  onTranscriptionComplete: (text: string) => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recorder] = useState(() => new VoiceRecorder());
  const { toast } = useToast();

  const handleStartRecording = async () => {
    try {
      await recorder.startRecording();
      setIsRecording(true);
      toast({
        title: "Recording started",
        description: "Speak naturally about your workout",
      });
    } catch (error) {
      toast({
        title: "Recording failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = async () => {
    try {
      setIsRecording(false);
      setIsProcessing(true);

      const audioBlob = await recorder.stopRecording();
      const { text } = await transcribeAudio(audioBlob);

      onTranscriptionComplete(text);

      toast({
        title: "Transcription complete",
        description: "Your workout has been processed",
      });
    } catch (error) {
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Voice Input</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div className="flex items-center justify-center w-full">
          {!isRecording && !isProcessing && (
            <Button
              onClick={handleStartRecording}
              size="lg"
              className="w-full"
            >
              <Mic className="mr-2 h-5 w-5" />
              Start Recording
            </Button>
          )}

          {isRecording && (
            <Button
              onClick={handleStopRecording}
              size="lg"
              variant="destructive"
              className="w-full"
            >
              <Square className="mr-2 h-5 w-5" />
              Stop Recording
            </Button>
          )}

          {isProcessing && (
            <Button disabled size="lg" className="w-full">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </Button>
          )}
        </div>

        {isRecording && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span>Recording...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
