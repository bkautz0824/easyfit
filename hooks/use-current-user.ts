"use client";

import { useAuthToken } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useCurrentUser() {
  const token = useAuthToken();
  const viewer = useQuery(api.users.viewer);

  return {
    user: viewer,
    session: viewer ? { user: viewer } : null,
    isLoading: viewer === undefined,
    isAuthenticated: !!token,
  };
}
