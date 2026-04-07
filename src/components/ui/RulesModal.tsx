'use client';

import { useEffect } from 'react';
import { X, Crown, Target, Shield, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RulesModal({ isOpen, onClose }: RulesModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Scroll Container */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Scroll Top Ornament */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-8 bg-gradient-to-b from-warning-text to-warning-border rounded-b-3xl shadow-lg z-10 flex items-center justify-center">
          <div className="w-32 h-1 bg-warning-bg/60 rounded-full" />
        </div>

        {/* Scroll Body */}
        <div className="relative pt-8 pb-4">
          {/* Parchment Background */}
          <div className="bg-gradient-to-b from-warning-bg/50 via-surface to-card-yellow/70 rounded-lg shadow-2xl overflow-hidden">
            {/* Decorative Border */}
            <div className="absolute inset-2 border-4 border-warning-border/60 rounded-lg pointer-events-none" />
            <div className="absolute inset-4 border-2 border-warning-border/40 rounded-lg pointer-events-none" />

            {/* Content */}
            <div className="relative px-8 py-6 overflow-y-auto max-h-[calc(90vh-8rem)] scrollbar-thin">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-3 mb-4">
                  <Star className="w-6 h-6 text-warning-text" />
                  <h2 className="text-3xl font-bold text-warning-text font-serif tracking-wide">
                    Fantasy Cricket Rules
                  </h2>
                  <Star className="w-6 h-6 text-warning-text" />
                </div>
                <p className="text-warning-text/70 italic">
                  The Ancient Art of Selecting Champions
                </p>
                <div className="mt-4 h-px bg-gradient-to-r from-transparent via-warning-text to-transparent" />
              </div>

              {/* Team Selection */}
              <div className="mb-8">
                <h3 className="flex items-center gap-2 text-xl font-bold text-warning-text mb-4 font-serif">
                  <Crown className="w-5 h-5" />
                  Team Selection
                </h3>
                <ul className="space-y-2 text-warning-text">
                  <li className="flex items-start gap-2">
                    <span className="text-warning-text mt-1">•</span>
                    <span>Select <strong>11 Players</strong> within a budget of <strong>100 Credits</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-warning-text mt-1">•</span>
                    <span>Choose a <strong>Captain</strong> (earns 2x points) and <strong>Vice-Captain</strong> (earns 1.5x points)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-warning-text mt-1">•</span>
                    <span>Players in announced lineups receive <strong>+4 bonus points</strong></span>
                  </li>
                </ul>
              </div>

              {/* Batting Points */}
              <div className="mb-8">
                <h3 className="flex items-center gap-2 text-xl font-bold text-info-text mb-4 font-serif">
                  <Target className="w-5 h-5" />
                  Batting Points
                </h3>
                <div className="bg-info-bg/25 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-info-text">
                    <span>Run</span>
                    <span className="font-bold">+1</span>
                  </div>
                  <div className="flex justify-between text-info-text">
                    <span>Boundary Bonus (Four)</span>
                    <span className="font-bold">+4</span>
                  </div>
                  <div className="flex justify-between text-info-text">
                    <span>Six Bonus</span>
                    <span className="font-bold">+6</span>
                  </div>
                  <div className="flex justify-between text-info-text">
                    <span>25+ Run Bonus</span>
                    <span className="font-bold">+4</span>
                  </div>
                  <div className="flex justify-between text-info-text">
                    <span>Half-Century (50+ Runs)</span>
                    <span className="font-bold">+8</span>
                  </div>
                  <div className="flex justify-between text-info-text">
                    <span>75+ Run Bonus</span>
                    <span className="font-bold">+12</span>
                  </div>
                  <div className="flex justify-between text-info-text font-bold border-t border-info-border pt-2 mt-2">
                    <span>Century (100+ Runs)</span>
                    <span className="text-success-text">+16</span>
                  </div>
                  <div className="flex justify-between text-danger-text">
                    <span>Duck (if dismissed)</span>
                    <span className="font-bold">-2</span>
                  </div>
                </div>

                {/* Strike Rate */}
                <h4 className="text-lg font-semibold text-info-text mt-4 mb-2">Strike Rate (Min 10 balls)</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between text-info-text">
                    <span>Above 170</span>
                    <span className="font-bold">+6</span>
                  </div>
                  <div className="flex justify-between text-info-text">
                    <span>150.01 - 170</span>
                    <span className="font-bold">+4</span>
                  </div>
                  <div className="flex justify-between text-info-text">
                    <span>130 - 150</span>
                    <span className="font-bold">+2</span>
                  </div>
                  <div className="flex justify-between text-danger-text">
                    <span>60 - 70</span>
                    <span className="font-bold">-2</span>
                  </div>
                  <div className="flex justify-between text-danger-text">
                    <span>50.01 - 59.99</span>
                    <span className="font-bold">-4</span>
                  </div>
                  <div className="flex justify-between text-danger-text">
                    <span>Below 50</span>
                    <span className="font-bold">-6</span>
                  </div>
                </div>
              </div>

              {/* Bowling Points */}
              <div className="mb-8">
                <h3 className="flex items-center gap-2 text-xl font-bold text-danger-text mb-4 font-serif">
                  <Zap className="w-5 h-5" />
                  Bowling Points
                </h3>
                <div className="bg-danger-bg/20 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-danger-text">
                    <span>Dot Ball</span>
                    <span className="font-bold">+1</span>
                  </div>
                  <div className="flex justify-between text-danger-text">
                    <span>Wicket (Excluding Run Out)</span>
                    <span className="font-bold">+30</span>
                  </div>
                  <div className="flex justify-between text-danger-text">
                    <span>LBW / Bowled Bonus</span>
                    <span className="font-bold">+8</span>
                  </div>
                  <div className="flex justify-between text-danger-text">
                    <span>3 Wicket Bonus</span>
                    <span className="font-bold">+4</span>
                  </div>
                  <div className="flex justify-between text-danger-text">
                    <span>4 Wicket Bonus</span>
                    <span className="font-bold">+8</span>
                  </div>
                  <div className="flex justify-between text-success-text font-bold">
                    <span>5 Wicket Haul</span>
                    <span className="font-bold">+12</span>
                  </div>
                  <div className="flex justify-between text-danger-text">
                    <span>Maiden Over</span>
                    <span className="font-bold">+12</span>
                  </div>
                </div>

                {/* Economy Rate */}
                <h4 className="text-lg font-semibold text-danger-text mt-4 mb-2">Economy Rate (Min 2 Overs)</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between text-success-text">
                    <span>Below 5</span>
                    <span className="font-bold">+6</span>
                  </div>
                  <div className="flex justify-between text-success-text">
                    <span>5 - 5.99</span>
                    <span className="font-bold">+4</span>
                  </div>
                  <div className="flex justify-between text-success-text">
                    <span>6 - 7</span>
                    <span className="font-bold">+2</span>
                  </div>
                  <div className="flex justify-between text-danger-text">
                    <span>10 - 11</span>
                    <span className="font-bold">-2</span>
                  </div>
                  <div className="flex justify-between text-danger-text">
                    <span>11.01 - 12</span>
                    <span className="font-bold">-4</span>
                  </div>
                  <div className="flex justify-between text-danger-text">
                    <span>Above 12</span>
                    <span className="font-bold">-6</span>
                  </div>
                </div>
              </div>

              {/* Fielding Points */}
              <div className="mb-8">
                <h3 className="flex items-center gap-2 text-xl font-bold text-success-text mb-4 font-serif">
                  <Shield className="w-5 h-5" />
                  Fielding Points
                </h3>
                <div className="bg-success-bg/20 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-success-text">
                    <span>Catch</span>
                    <span className="font-bold">+8</span>
                  </div>
                  <div className="flex justify-between text-success-text">
                    <span>3+ Catch Bonus</span>
                    <span className="font-bold">+4</span>
                  </div>
                  <div className="flex justify-between text-success-text">
                    <span>Stumping</span>
                    <span className="font-bold">+12</span>
                  </div>
                  <div className="flex justify-between text-success-text">
                    <span>Run Out (Direct Hit)</span>
                    <span className="font-bold">+12</span>
                  </div>
                  <div className="flex justify-between text-success-text">
                    <span>Run Out (Not Direct Hit)</span>
                    <span className="font-bold">+6</span>
                  </div>
                </div>
              </div>

              {/* Special Points */}
              <div className="mb-8">
                <h3 className="flex items-center gap-2 text-xl font-bold text-text-primary mb-4 font-serif">
                  <Star className="w-5 h-5" />
                  Special Points
                </h3>
                <div className="bg-card-purple/35 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-text-primary">
                    <span>Captain (2x multiplier)</span>
                    <span className="font-bold">2X</span>
                  </div>
                  <div className="flex justify-between text-text-primary">
                    <span>Vice-Captain (1.5x multiplier)</span>
                    <span className="font-bold">1.5X</span>
                  </div>
                  <div className="flex justify-between text-text-primary">
                    <span>In Announced Lineups</span>
                    <span className="font-bold">+4</span>
                  </div>
                  <div className="flex justify-between text-text-primary">
                    <span>Concussion/X-Factor/Impact Sub</span>
                    <span className="font-bold">+4</span>
                  </div>
                </div>
              </div>

              {/* Important Notes */}
              <div className="bg-warning-bg/20 border border-warning-border/60 rounded-lg p-4">
                <h4 className="font-bold text-warning-text mb-3 font-serif">Important Notes</h4>
                <ul className="space-y-2 text-warning-text text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-warning-text">⚔️</span>
                    <span>Century overrides all lower milestone bonuses (no 25, 50, 75 run bonuses for centuries)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-warning-text">⚔️</span>
                    <span>Direct hit: Only the fielder who touched the ball after the batter faces the delivery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-warning-text">⚔️</span>
                    <span>Run out points awarded only to the last 2 fielders who touched the ball</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-warning-text">⚔️</span>
                    <span>Low strike rate penalties apply only for SR 70 or below</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-warning-text">⚔️</span>
                    <span>Points are calculated based on real match performance from Cricbuzz data</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Scroll Bottom Ornament */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-8 bg-gradient-to-t from-warning-text to-warning-border rounded-t-3xl shadow-lg z-10 flex items-center justify-center">
            <div className="w-32 h-1 bg-warning-bg/60 rounded-full" />
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-16 right-4 z-20 p-2 bg-warning-bg/50 hover:bg-warning-bg/70 rounded-full shadow-lg transition-colors"
        >
          <X className="w-6 h-6 text-warning-text" />
        </button>
      </div>
    </div>
  );
}
