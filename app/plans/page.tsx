"use client";

import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlansPage() {
  return (
    <DashboardShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Training Plans</h1>
          <p className="text-muted-foreground mt-2">
            AI-generated personalized training plans
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              AI-generated training plans will be available once you complete your fitness profile.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
