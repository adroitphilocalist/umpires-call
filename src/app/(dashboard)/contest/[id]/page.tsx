'use client';

import { useCallback, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import {
  Navbar,
  Button,
  PageLoader,
  Modal,
} from '@/components/ui';
import { ArrowLeft, CalendarDays, ClipboardList, Pause, Play, Radio, Share2 } from 'lucide-react';
import { ContestOverviewCard } from '@/components/contest/ContestOverviewCard';
import { MatchDetailsCard } from '@/components/contest/MatchDetailsCard';
import { InviteCodeCard } from '@/components/contest/InviteCodeCard';
import { MatchCountdownCard } from '@/components/contest/MatchCountdownCard';
import { ContestStatusCard } from '@/components/contest/ContestStatusCard';
import { CompareTeamsModal } from '@/components/contest/CompareTeamsModal';
import { LeaderboardCard } from '@/components/contest/LeaderboardCard';
import { LiveScorecardCard } from '@/components/contest/LiveScorecardCard';
import { useContestDetailData } from '@/hooks/useContestDetailData';

type LiveInfoPanel = 'contest' | 'match' | 'invite' | null;

export default function ContestDetailPage() {
  const params = useParams();
  const contestId = params.id as string;
  const [activeLivePanel, setActiveLivePanel] = useState<LiveInfoPanel>(null);
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

  const isLiveCompactMode = isMatchStarted;

  const activePanelTitle =
    activeLivePanel === 'contest'
      ? 'Contest Details'
      : activeLivePanel === 'match'
        ? 'Match Details'
        : activeLivePanel === 'invite'
          ? 'Invite Code'
          : '';

  const renderActiveLivePanel = () => {
    if (activeLivePanel === 'contest') {
      return <ContestOverviewCard contest={contest} matchDate={matchDate} />;
    }

    if (activeLivePanel === 'match') {
      return match ? (
        <MatchDetailsCard match={match} matchDate={matchDate} />
      ) : (
        <p className="text-sm text-text-secondary">Match details unavailable.</p>
      );
    }

    if (activeLivePanel === 'invite') {
      return contest.inviteCode ? (
        <InviteCodeCard
          inviteCode={contest.inviteCode}
          copied={copied}
          joinLinkCopied={joinLinkCopied}
          onCopyInviteCode={copyInviteCode}
          onCopyJoinLink={copyJoinLink}
        />
      ) : (
        <p className="text-sm text-text-secondary">Invite code unavailable for this contest.</p>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className={`${isLiveCompactMode ? 'max-w-[96rem]' : 'max-w-7xl'} mx-auto px-4 sm:px-6 lg:px-8 py-8`}>
        <div className="mb-6 flex items-center justify-between gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            {isLiveCompactMode && (
              <span className="inline-flex items-center gap-1 rounded-full border border-danger-border bg-danger-bg/30 px-2.5 py-1 text-xs font-semibold text-danger-text">
                <Radio size={12} className="animate-pulse" />
                Live
              </span>
            )}
            <Button variant="secondary" size="sm" onClick={toggleAutoReloadPaused}>
              {isAutoReloadPaused ? <Play size={14} className="mr-1" /> : <Pause size={14} className="mr-1" />}
              {isAutoReloadPaused ? 'Resume Auto-Reload' : 'Pause Auto-Reload'}
            </Button>
          </div>
        </div>

        <div className={isLiveCompactMode ? 'grid grid-cols-1 gap-6' : 'grid grid-cols-1 lg:grid-cols-4 gap-6'}>
          <div className={isLiveCompactMode ? 'flex flex-col gap-6 lg:pr-36 xl:pr-40 ml-20' : 'lg:col-span-3 flex flex-col gap-6 ml-20'}>
            {!isLiveCompactMode && <ContestOverviewCard contest={contest} matchDate={matchDate} />}

            {!isLiveCompactMode && match && (
              <MatchDetailsCard match={match} matchDate={matchDate} />
            )}

            {!isLiveCompactMode && contest.inviteCode && (
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

          {!isLiveCompactMode && (
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
          )}
        </div>

        {isLiveCompactMode && (
          <>
            <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-end gap-2">
              <div className="rounded-2xl border border-primary/30 bg-surface/85 backdrop-blur-md px-2 py-2 shadow-[0_14px_35px_rgba(0,0,0,0.3)]">
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setActiveLivePanel('contest')}
                    className="inline-flex items-center gap-2 rounded-xl border border-primary/25 bg-card px-3 py-2 text-xs font-medium text-text-primary hover:border-accent/50 hover:bg-surface-light transition-all"
                  >
                    <ClipboardList size={14} />
                    Contest
                  </button>
                  <button
                    onClick={() => setActiveLivePanel('match')}
                    className="inline-flex items-center gap-2 rounded-xl border border-primary/25 bg-card px-3 py-2 text-xs font-medium text-text-primary hover:border-accent/50 hover:bg-surface-light transition-all"
                  >
                    <CalendarDays size={14} />
                    Match
                  </button>
                  <button
                    onClick={() => setActiveLivePanel('invite')}
                    className="inline-flex items-center gap-2 rounded-xl border border-primary/25 bg-card px-3 py-2 text-xs font-medium text-text-primary hover:border-accent/50 hover:bg-surface-light transition-all"
                  >
                    <Share2 size={14} />
                    Invite
                  </button>
                  {hasJoined && (
                    <Link
                      href={`/my-team/${contestId}`}
                      className="inline-flex items-center justify-center rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent hover:bg-accent/15 transition-colors"
                    >
                      My Team
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <div className="fixed inset-x-3 bottom-4 z-40 md:hidden">
              <div className="rounded-2xl border border-primary/30 bg-surface/90 backdrop-blur-md p-2 shadow-[0_14px_35px_rgba(0,0,0,0.3)]">
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => setActiveLivePanel('contest')}
                    className="inline-flex flex-col items-center justify-center rounded-xl border border-primary/25 bg-card px-2 py-2 text-[11px] font-medium text-text-primary"
                  >
                    <ClipboardList size={14} className="mb-1" />
                    Contest
                  </button>
                  <button
                    onClick={() => setActiveLivePanel('match')}
                    className="inline-flex flex-col items-center justify-center rounded-xl border border-primary/25 bg-card px-2 py-2 text-[11px] font-medium text-text-primary"
                  >
                    <CalendarDays size={14} className="mb-1" />
                    Match
                  </button>
                  <button
                    onClick={() => setActiveLivePanel('invite')}
                    className="inline-flex flex-col items-center justify-center rounded-xl border border-primary/25 bg-card px-2 py-2 text-[11px] font-medium text-text-primary"
                  >
                    <Share2 size={14} className="mb-1" />
                    Invite
                  </button>
                  {hasJoined ? (
                    <Link
                      href={`/my-team/${contestId}`}
                      className="inline-flex flex-col items-center justify-center rounded-xl border border-accent/40 bg-accent/10 px-2 py-2 text-[11px] font-semibold text-accent"
                    >
                      <ClipboardList size={14} className="mb-1" />
                      My Team
                    </Link>
                  ) : (
                    <span className="inline-flex flex-col items-center justify-center rounded-xl border border-danger-border/40 bg-danger-bg/20 px-2 py-2 text-[11px] font-semibold text-danger-text">
                      <Radio size={14} className="mb-1 animate-pulse" />
                      Live
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Modal
              isOpen={!!activeLivePanel}
              onClose={() => setActiveLivePanel(null)}
              title={activePanelTitle}
              className="max-w-3xl"
            >
              <div className="max-h-[75vh] overflow-y-auto pr-1">
                {renderActiveLivePanel()}
              </div>
            </Modal>
          </>
        )}

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