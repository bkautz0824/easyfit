import { useState, useEffect } from "react";
import type { Id } from "@/convex/_generated/dataModel";

interface DevUser {
  userId: Id<"users">;
  email: string;
  name: string;
}

/**
 * Hook to get the current dev user from localStorage
 * This is a temporary solution for development/testing
 */
export function useDevUser() {
  const [devUser, setDevUser] = useState<DevUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get dev user from localStorage
    const storedUser = localStorage.getItem("devUser");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setDevUser(user);
      } catch (error) {
        console.error("Failed to parse dev user:", error);
        localStorage.removeItem("devUser");
      }
    }
    setIsLoading(false);
  }, []);

  return {
    devUser,
    isLoading,
    userId: devUser?.userId || null,
    isAuthenticated: !!devUser,
  };
}
