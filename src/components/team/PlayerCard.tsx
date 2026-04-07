'use client';

import { Player } from '@/types';
import { Card, Badge, Button } from '@/components/ui';
import { User, Plus, Crown, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerCardProps {
  player: Player;
  isSelected?: boolean;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  creditsRemaining: number;
  onSelect?: () => void;
  onMakeCaptain?: () => void;
  onMakeViceCaptain?: () => void;
  disabled?: boolean;
}

export function PlayerCard({
  player,
  isSelected,
  isCaptain,
  isViceCaptain,
  creditsRemaining,
  onSelect,
  onMakeCaptain,
  onMakeViceCaptain,
  disabled,
}: PlayerCardProps) {
  const canAfford = player.creditValue <= creditsRemaining;
  const canSelect = !disabled && canAfford;

  const roleColors = {
    batsman: 'bg-info-bg/60 text-info-text',
    bowler: 'bg-danger-bg/60 text-danger-text',
    'all-rounder': 'bg-card-purple/50 text-text-primary',
    'wicket-keeper': 'bg-success-bg/60 text-success-text',
  };

  return (
    <Card
      className={cn(
        'relative transition-all',
        isSelected && 'border-accent ring-1 ring-accent',
        !canSelect && 'opacity-60'
      )}
      padding="sm"
    >
      {isCaptain && (
        <div className="absolute top-2 right-2">
          <Crown size={20} className="text-accent" />
        </div>
      )}
      {isViceCaptain && (
        <div className="absolute top-2 right-2">
          <Star size={20} className="text-warning-text" />
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
          <User size={24} className="text-text-secondary" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-text-primary truncate">{player.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="info" className="text-xs">{player.role}</Badge>
            <span className="text-sm text-text-secondary">{player.team}</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-lg font-bold text-accent">{player.creditValue}</span>
          <p className="text-xs text-text-secondary">credits</p>
        </div>
      </div>

      {isSelected && (
        <div className="mt-3 flex gap-2">
          {!isCaptain && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onMakeCaptain}
              className="flex-1 text-xs"
            >
              <Crown size={14} className="mr-1" />
              Captain
            </Button>
          )}
          {!isViceCaptain && !isCaptain && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onMakeViceCaptain}
              className="flex-1 text-xs"
            >
              <Star size={14} className="mr-1" />
              VC
            </Button>
          )}
        </div>
      )}

      {!isSelected && canSelect && (
        <Button
          size="sm"
          variant="secondary"
          className="mt-3 w-full"
          onClick={onSelect}
        >
          <Plus size={16} className="mr-1" />
          Add to Team
        </Button>
      )}
    </Card>
  );
}

export function PlayerList({
  players,
  selectedPlayers,
  captainId,
  viceCaptainId,
  creditsRemaining,
  onSelectPlayer,
  onMakeCaptain,
  onMakeViceCaptain,
  maxPlayers,
  disabled,
}: {
  players: Player[];
  selectedPlayers: string[];
  captainId?: string;
  viceCaptainId?: string;
  creditsRemaining: number;
  onSelectPlayer: (player: Player) => void;
  onMakeCaptain: (playerId: string) => void;
  onMakeViceCaptain: (playerId: string) => void;
  maxPlayers: number;
  disabled?: boolean;
}) {
  const selectedCount = selectedPlayers.length;
  const isFull = selectedCount >= maxPlayers;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {players.map((player) => {
        const isSelected = selectedPlayers.includes(player._id);
        return (
          <PlayerCard
            key={player._id}
            player={player}
            isSelected={isSelected}
            isCaptain={captainId === player._id}
            isViceCaptain={viceCaptainId === player._id}
            creditsRemaining={creditsRemaining}
            onSelect={() => onSelectPlayer(player)}
            onMakeCaptain={() => onMakeCaptain(player._id)}
            onMakeViceCaptain={() => onMakeViceCaptain(player._id)}
            disabled={disabled || (isFull && !isSelected)}
          />
        );
      })}
    </div>
  );
}