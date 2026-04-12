'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { LiveScorecardPanel, LiveScorecardData } from '@/components/live/LiveScorecardPanel';

interface LiveScorecardCardProps {
  loadingScorecardPanel: boolean;
  liveScorecard: LiveScorecardData | null;
  scorecardPanelError: string | null;
}

export function LiveScorecardCard({
  loadingScorecardPanel,
  liveScorecard,
  scorecardPanelError,
}: LiveScorecardCardProps) {
  return (
    <Card className="order-5 border border-accent/30 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-card via-surface-light/70 to-card border-b border-accent/20">
        <CardTitle>Deep Live Scorecard</CardTitle>
        <CardDescription>
          Auto-refreshes every 5 minutes and combines scorecard plus over-by-over streams.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {loadingScorecardPanel && !liveScorecard ? (
          <p className="text-sm text-text-secondary">Loading live scorecard...</p>
        ) : scorecardPanelError && !liveScorecard ? (
          <p className="text-sm text-danger-text">{scorecardPanelError}</p>
        ) : liveScorecard ? (
          <LiveScorecardPanel data={liveScorecard} />
        ) : (
          <p className="text-sm text-text-secondary">Live scorecard will appear once match scorecard URL is available.</p>
        )}
      </CardContent>
    </Card>
  );
}
