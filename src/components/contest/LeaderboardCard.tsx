'use client';

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Clock, Crown, GitCompare, Lock, Star, Trophy } from 'lucide-react';
import { ContestTeam, ExpandedPlayerState, TeamPlayer } from './types';

interface LeaderboardCardProps {
  teams: ContestTeam[];
  expandedTeamId: string | null;
  expandedPlayerId: ExpandedPlayerState | null;
  loadingScores: boolean;
  isFromCache: boolean;
  lastScoreUpdate: Date | null;
  onOpenCompare: () => void;
  onToggleTeamExpand: (team: ContestTeam) => void;
  onSetExpandedPlayer: (value: ExpandedPlayerState | null) => void;
  getPlayerPoints: (player: TeamPlayer) => number;
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Batting': return 'bg-info-bg/30 text-info-text';
    case 'Bowling': return 'bg-danger-bg/30 text-danger-text';
    case 'Fielding': return 'bg-success-bg/30 text-success-text';
    case 'Milestone': return 'bg-warning-bg/40 text-warning-text';
    case 'Strike Rate': return 'bg-card-purple/50 text-text-primary';
    case 'Economy': return 'bg-orange-500/20 text-orange-400';
    case 'Other': return 'bg-gray-500/20 text-gray-400';
    case 'Multiplier': return 'bg-warning-bg/35 text-warning-text';
    default: return 'bg-gray-500/20 text-gray-400';
  }
};

export function LeaderboardCard({
  teams,
  expandedTeamId,
  expandedPlayerId,
  loadingScores,
  isFromCache,
  lastScoreUpdate,
  onOpenCompare,
  onToggleTeamExpand,
  onSetExpandedPlayer,
  getPlayerPoints,
}: LeaderboardCardProps) {
  return (
    <Card className="order-1 relative overflow-hidden border border-accent/40 shadow-xl shadow-accent/10">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent pointer-events-none" />
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy size={20} className="text-accent" />
            Leaderboard
          </CardTitle>
          {teams.length >= 2 && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onOpenCompare}
            >
              <GitCompare size={14} className="mr-1" />
              Compare Teams
            </Button>
          )}
        </div>
        {lastScoreUpdate && (
          <div className="flex items-center gap-2 mt-2 text-xs text-text-secondary">
            {isFromCache ? (
              <>
                <Trophy size={12} className="text-success-text" />
                <span className="text-success-text">Final Results • Match Completed</span>
              </>
            ) : (
              <>
                <Clock size={12} />
                <span>Scores updated: {lastScoreUpdate.toLocaleString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}</span>
              </>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {teams.length === 0 ? (
          <p className="text-text-secondary text-center py-4">No teams have joined yet</p>
        ) : (
          <div className="space-y-3">
            {teams.map((team, index) => {
              const rank = index + 1;
              const isExpanded = expandedTeamId === team._id;
              const isTeamLocked = !!team.isTeamLocked;
              const rankStyles = {
                1: 'bg-warning-bg/40 text-warning-text border-warning-border',
                2: 'bg-gray-300/20 text-gray-300 border-gray-300',
                3: 'bg-warning-bg/25 text-warning-text border-warning-border',
              };
              const rankStyle = rankStyles[rank as keyof typeof rankStyles];

              return (
                <div key={team._id}>
                  <div
                    onClick={() => onToggleTeamExpand(team)}
                    className={`flex items-center gap-4 p-3 rounded-lg bg-surface cursor-pointer hover:bg-surface/80 transition-colors ${rank <= 3 ? 'border' : ''} ${rankStyle || ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${rank <= 3 ? rankStyle : 'bg-surface text-text-secondary'}`}>
                      {rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary truncate">
                        {team.user?.displayName || 'Unknown Player'}
                      </p>
                      <p className="text-sm text-text-secondary truncate">
                        {team.name}
                      </p>
                      {isTeamLocked && (
                        <div className="mt-1 inline-flex items-center gap-1 text-xs text-warning-text">
                          <Lock size={12} />
                          Team hidden until match goes live
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-accent">{team.score ?? 0}</p>
                      <p className="text-xs text-text-secondary">pts</p>
                    </div>
                    <div className="text-text-secondary">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-2 p-3 bg-surface/50 rounded-lg">
                      <p className="text-sm font-medium text-text-secondary mb-2">Team Players</p>
                      {isTeamLocked ? (
                        <div className="rounded-lg border border-warning-border/30 bg-warning-bg/20 p-3">
                          <p className="text-sm text-warning-text flex items-center gap-2">
                            <Lock size={14} />
                            Opponent team is locked before match start.
                          </p>
                          <p className="text-xs text-text-secondary mt-1">
                            Player picks will be revealed once the match status becomes Live or Completed.
                          </p>
                          <p className="text-xs text-text-secondary mt-2">
                            Hidden players: {team.playerCount ?? 11}
                          </p>
                        </div>
                      ) : loadingScores ? (
                        <p className="text-text-secondary text-sm">Loading scores...</p>
                      ) : (
                        <div className="space-y-1">
                          {team.players.map((player) => {
                            const isCaptain = player.isCaptain || player.playerId === team.captainId;
                            const isViceCaptain = player.isViceCaptain || player.playerId === team.viceCaptainId;
                            const playerPoints = getPlayerPoints(player);
                            const isPlayerExpanded = expandedPlayerId?.teamId === team._id && expandedPlayerId?.playerId === player.playerId;

                            return (
                              <div key={player.playerId}>
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (player.breakdown && player.breakdown.length > 0) {
                                      onSetExpandedPlayer(isPlayerExpanded ? null : { teamId: team._id, playerId: player.playerId });
                                    }
                                  }}
                                  className={cn(
                                    'flex items-center justify-between p-2 bg-surface rounded cursor-pointer transition-colors',
                                    player.breakdown && player.breakdown.length > 0 && 'hover:bg-surface-light cursor-pointer'
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                      {isCaptain && <Crown size={14} className="text-accent" />}
                                      {isViceCaptain && <Star size={14} className="text-warning-text" />}
                                    </div>
                                    <div>
                                      <p className="text-sm text-text-primary">{player.name}</p>
                                      <p className="text-xs text-text-secondary capitalize">{player.role.replace('-', ' ')}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {player.breakdown && player.breakdown.length > 0 && (
                                      <span className="text-xs text-text-secondary">
                                        {isPlayerExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                      </span>
                                    )}
                                    <div className="text-right">
                                      <p className={cn(
                                        'font-bold font-mono',
                                        isCaptain ? 'text-accent' : isViceCaptain ? 'text-warning-text' : 'text-text-primary'
                                      )}>
                                        {playerPoints}
                                      </p>
                                      {isCaptain && <p className="text-xs text-accent">2x</p>}
                                      {isViceCaptain && <p className="text-xs text-warning-text">1.5x</p>}
                                    </div>
                                  </div>
                                </div>

                                {isPlayerExpanded && player.breakdown && player.breakdown.length > 0 && (
                                  <div className="ml-4 mt-1 p-2 bg-background rounded border border-primary/20 mb-2">
                                    <p className="text-xs font-semibold text-text-secondary mb-2">Points Breakdown</p>
                                    <div className="space-y-1">
                                      {player.breakdown.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs">
                                          <div className="flex items-center gap-2">
                                            <Badge className={getCategoryColor(item.category)} variant="default">
                                              {item.category}
                                            </Badge>
                                            <span className="text-text-primary text-xs">{item.description}</span>
                                          </div>
                                          <span className={item.points >= 0 ? 'text-success-text' : 'text-danger-text'}>
                                            {item.points >= 0 ? '+' : ''}{item.points}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
