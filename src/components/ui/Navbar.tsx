'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Home, PlusCircle, User, Menu, X, Users, BookOpen, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import RulesModal from './RulesModal';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/join', label: 'Join Contest', icon: Users },
  { href: '/create-contest', label: 'Create', icon: PlusCircle },
  { href: '/profile', label: 'Profile', icon: User },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
      setIsOpen(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <>
      <nav className="bg-surface border-b border-primary/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image
                src="/brand-logo.png"
                alt="Umpire's Call"
                width={32}
                height={32}
                className="rounded-md border border-primary/30"
                priority
              />
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
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors bg-warning-bg/45 text-warning-text hover:bg-warning-bg/60 border border-warning-border"
              >
                <BookOpen size={18} />
                Rules
              </button>
              
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-danger-text hover:bg-danger-bg/20"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              )}

              <ThemeToggle />
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
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors w-full bg-warning-bg/45 text-warning-text hover:bg-warning-bg/60 border border-warning-border"
              >
                <BookOpen size={20} />
                Fantasy Rules
              </button>
              
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors w-full text-danger-text hover:bg-danger-bg/20 text-left"
                >
                  <LogOut size={20} />
                  Logout
                </button>
              )}

              <div className="flex justify-end px-1 pt-1">
                <ThemeToggle />
              </div>
            </div>
          </div>
        )}
      </nav>

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </>
  );
}
