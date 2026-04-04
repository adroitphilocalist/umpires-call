'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import { Trophy, Users, TrendingUp, Zap, ChevronRight, Star } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Trophy className="w-8 h-8 text-accent" />
              <span className="text-xl font-bold text-text-primary font-heading">
                Umpire&apos;s Call
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full mb-6">
              <Zap size={16} className="text-accent" />
              <span className="text-sm text-accent font-medium">Real-time Fantasy Cricket</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-text-primary font-heading mb-6 leading-tight">
              Build Your Dream Team & Dominate the Field
            </h1>

            <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
              Create your fantasy cricket team from real players, join contests, 
              and compete with thousands of cricket fans worldwide. Live scores, 
              real-time updates, and exciting prizes await!
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="group">
                  Start Playing Free
                  <ChevronRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="lg">
                  View Demo
                </Button>
              </Link>
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-text-secondary">
              <div className="text-center">
                <p className="text-3xl font-bold text-accent">50K+</p>
                <p className="text-sm">Active Players</p>
              </div>
              <div className="w-px h-12 bg-primary" />
              <div className="text-center">
                <p className="text-3xl font-bold text-accent">₹1Cr+</p>
                <p className="text-sm">Prizes Won</p>
              </div>
              <div className="w-px h-12 bg-primary" />
              <div className="text-center">
                <p className="text-3xl font-bold text-accent">100+</p>
                <p className="text-sm">Live Matches</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-surface/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text-primary font-heading mb-4">
              Why Choose Umpire&apos;s Call?
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              The ultimate fantasy cricket experience with features designed for true fans
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: 'Create Custom Contests',
                description: 'Host your own contests with friends or join public ones. Set your own rules and prizes.',
              },
              {
                icon: TrendingUp,
                title: 'Real-Time Scoring',
                description: 'Watch your team score update live as the match progresses. Instant points, instant excitement.',
              },
              {
                icon: Trophy,
                title: 'Win Exciting Prizes',
                description: 'Compete for cash prizes, merchandise, and exclusive rewards. Top performers win big!',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group p-6 bg-surface border border-primary/30 rounded-xl hover:border-accent/50 transition-all"
              >
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <feature.icon size={24} className="text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary font-heading mb-2">
                  {feature.title}
                </h3>
                <p className="text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-primary to-primary-light rounded-2xl p-8 md:p-12 border border-primary">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <h2 className="text-3xl font-bold text-text-primary font-heading mb-4">
                  Ready to Play?
                </h2>
                <p className="text-text-secondary max-w-md">
                  Join thousands of cricket enthusiasts and start building your winning team today.
                </p>
              </div>
              <Link href="/register">
                <Button size="lg" className="animate-glow">
                  <Star size={20} className="mr-2" />
                  Create Free Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 bg-surface border-t border-primary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-accent" />
              <span className="text-lg font-bold text-text-primary font-heading">
                Umpire&apos;s Call
              </span>
            </div>
            <p className="text-text-secondary text-sm">
              © 2024 Umpire&apos;s Call. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}