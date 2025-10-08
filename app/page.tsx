import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center space-y-8">
        <div className="flex items-center justify-center mb-8">
          <Activity className="h-16 w-16 text-blue-600" />
        </div>
        <h1 className="text-5xl font-bold mb-4">Workout Assistant</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          AI-powered workout tracking and coaching with voice-first interface
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <Link href="/register">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
