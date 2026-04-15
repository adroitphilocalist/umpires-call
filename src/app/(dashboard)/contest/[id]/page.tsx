'use client';

import { useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import {
  Navbar,
  Button,
  PageLoader
} from '@/components/ui';
import { ArrowLeft, Pause, Play } from 'lucide-react';
import { ContestOverviewCard } from '@/components/contest/ContestOverviewCard';
import { MatchDetailsCard } from '@/components/contest/MatchDetailsCard';
import { InviteCodeCard } from '@/components/contest/InviteCodeCard';
import { MatchCountdownCard } from '@/components/contest/MatchCountdownCard';
import { ContestStatusCard } from '@/components/contest/ContestStatusCard';
import { CompareTeamsModal } from '@/components/contest/CompareTeamsModal';
import { LeaderboardCard } from '@/components/contest/LeaderboardCard';
import { LiveScorecardCard } from '@/components/contest/LiveScorecardCard';
import { useContestDetailData } from '@/hooks/useContestDetailData';

export default function ContestDetailPage() {
  const params = useParams();
  const contestId = params.id as string;
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const handleJoinSuccess = useCallback(() => {
    router.push(`/my-team/${contestId}`);
  }, [contestId, router]);

  const {
    contest,
    userTeam,
    teams,
    isLoading,
    isJoining,
    copied,
    joinLinkCopied,
    expandedTeamId,
    expandedPlayerId,
    loadingScores,
    showCompare,
    compareTeam1,
    compareTeam2,
    compareRevealReady,
    lastScoreUpdate,
    isFromCache,
    match,
    matchDate,
    isMatchStarted,
    countdown,
    countdownProgressPct,
    isUrgent,
    isSoon,
    liveScorecard,
    loadingScorecardPanel,
    scorecardPanelError,
    isAutoReloadPaused,
    hasJoined,
    getPlayerPoints,
    toggleTeamExpand,
    handleJoin,
    copyInviteCode,
    copyJoinLink,
    setExpandedPlayerId,
    setShowCompare,
    setCompareTeam1,
    setCompareTeam2,
    toggleAutoReloadPaused,
  } = useContestDetailData({
    contestId,
    user,
    onJoinSuccess: handleJoinSuccess,
  });

  if (authLoading || isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <Image
              src="/brand-logo.png"
              alt="Umpire's Call"
              width={72}
              height={72}
              className="mx-auto mb-4 rounded-xl border border-primary/30"
              priority
            />
            <h1 className="text-2xl font-bold text-text-primary">Contest not found</h1>
            <Link href="/dashboard">
              <Button className="mt-4">Go to Dashboard</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>

          <Button variant="secondary" size="sm" onClick={toggleAutoReloadPaused}>
            {isAutoReloadPaused ? <Play size={14} className="mr-1" /> : <Pause size={14} className="mr-1" />}
            {isAutoReloadPaused ? 'Resume Auto-Reload' : 'Pause Auto-Reload'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 flex flex-col gap-6">
            <ContestOverviewCard contest={contest} matchDate={matchDate} />

            {match && (
              <MatchDetailsCard match={match} matchDate={matchDate} />
            )}

            {contest.inviteCode && (
              <InviteCodeCard
                inviteCode={contest.inviteCode}
                copied={copied}
                joinLinkCopied={joinLinkCopied}
                onCopyInviteCode={copyInviteCode}
                onCopyJoinLink={copyJoinLink}
              />
            )}

            <LeaderboardCard
              teams={teams}
              expandedTeamId={expandedTeamId}
              expandedPlayerId={expandedPlayerId}
              loadingScores={loadingScores}
              isFromCache={isFromCache}
              lastScoreUpdate={lastScoreUpdate}
              onOpenCompare={() => setShowCompare(true)}
              onToggleTeamExpand={toggleTeamExpand}
              onSetExpandedPlayer={setExpandedPlayerId}
              getPlayerPoints={getPlayerPoints}
            />

            <LiveScorecardCard
              loadingScorecardPanel={loadingScorecardPanel}
              liveScorecard={liveScorecard}
              scorecardPanelError={scorecardPanelError}
            />
          </div>

          <div className="space-y-6">
            {matchDate && (
              <MatchCountdownCard
                matchDate={matchDate}
                isMatchStarted={isMatchStarted}
                isUrgent={isUrgent}
                isSoon={isSoon}
                countdownProgressPct={countdownProgressPct}
                countdown={countdown}
              />
            )}

            <ContestStatusCard
              hasJoined={hasJoined}
              userTeam={userTeam}
              contestId={contestId}
              contest={contest}
              isMatchStarted={isMatchStarted}
              isJoining={isJoining}
              onJoin={handleJoin}
            />

          </div>
        </div>

        <CompareTeamsModal
          isOpen={showCompare}
          teams={teams}
          compareTeam1={compareTeam1}
          compareTeam2={compareTeam2}
          compareRevealReady={compareRevealReady}
          setCompareTeam1={setCompareTeam1}
          setCompareTeam2={setCompareTeam2}
          onClose={() => {
            setShowCompare(false);
            setCompareTeam1(null);
            setCompareTeam2(null);
          }}
          getPlayerPoints={getPlayerPoints}
        />
      </main>
    </div>
  );
}