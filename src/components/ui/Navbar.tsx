'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, PlusCircle, User, Menu, X, Users, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import RulesModal from './RulesModal';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/join', label: 'Join Contest', icon: Users },
  { href: '/create-contest', label: 'Create', icon: PlusCircle },
  { href: '/profile', label: 'Profile', icon: User },
];

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [showRules, setShowRules] = useState(false);

  return (
    <>
      <nav className="bg-surface border-b border-primary/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Trophy className="w-8 h-8 text-accent" />
              <span className="text-xl font-bold text-text-primary font-heading">
                Umpire&apos;s Call
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-accent'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-light'
                    )}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={() => setShowRules(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-amber-900/30 text-amber-400 hover:bg-amber-900/50 hover:text-amber-300 border border-amber-700/50"
              >
                <BookOpen size={18} />
                Rules
              </button>
            </div>

            <button
              className="md:hidden p-2 text-text-secondary hover:text-text-primary"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden border-t border-primary/30">
            <div className="px-4 py-3 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-accent'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-light'
                    )}
                  >
                    <Icon size={20} />
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowRules(true);
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors w-full bg-amber-900/30 text-amber-400 hover:bg-amber-900/50 hover:text-amber-300 border border-amber-700/50"
              >
                <BookOpen size={20} />
                Fantasy Rules
              </button>
            </div>
          </div>
        )}
      </nav>

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </>
  );
}
