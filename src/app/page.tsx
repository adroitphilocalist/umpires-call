'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui';
import creatorPhoto from '../../Photo-informal.png';
import {
  Trophy,
  Zap,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Github,
  Linkedin,
  Globe,
  ShieldCheck,
  GraduationCap,
  Award,
} from 'lucide-react';

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

            
          </div>
        </div>
      </section>

      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 left-1/4 w-[420px] h-[420px] bg-info/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 right-1/4 w-[420px] h-[420px] bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-surface via-card to-primary/10 p-6 md:p-10 shadow-[0_14px_70px_rgba(0,0,0,0.22)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">
              <div className="lg:col-span-1">
                <div className="relative rounded-2xl border border-accent/30 bg-card/90 p-6">
                  <div className="absolute inset-x-6 -top-4 h-8 rounded-full bg-accent/20 blur-xl" />
                  <div className="relative">
                    <div className="mb-6 rounded-2xl border border-accent/40 bg-gradient-to-br from-primary/20 via-surface to-accent/15 p-2 shadow-[0_10px_35px_rgba(0,0,0,0.25)]">
                      <div className="relative overflow-hidden rounded-xl">
                        <Image
                          src={creatorPhoto}
                          alt="Piyush Saha"
                          priority
                          className="h-72 w-full object-cover object-top"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
                      </div>
                    </div>

                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/40 to-primary/50 flex items-center justify-center mb-5 border border-accent/40">
                      <ShieldCheck className="w-10 h-10 text-accent" />
                    </div>
                    <p className="text-xs uppercase tracking-[0.22em] text-accent font-semibold mb-2">Creator Spotlight</p>
                    <h2 className="text-3xl font-bold text-text-primary font-heading leading-tight">Piyush Saha</h2>
                    <p className="mt-2 text-text-secondary">
                      Cyber Security-focused Computer Science undergraduate building secure, scalable, real-time products.
                    </p>
                  </div>

                  <div className="mt-6 space-y-3 text-sm">
                    <div className="flex items-start gap-3 text-text-secondary">
                      <Mail className="w-4 h-4 mt-0.5 text-accent" />
                      <a href="mailto:sahapiyush5@gmail.com" className="hover:text-text-primary transition-colors">
                        sahapiyush5@gmail.com
                      </a>
                    </div>
                    <div className="flex items-start gap-3 text-text-secondary">
                      <Phone className="w-4 h-4 mt-0.5 text-accent" />
                      <span>(+91) 6291299136</span>
                    </div>
                    <div className="flex items-start gap-3 text-text-secondary">
                      <MapPin className="w-4 h-4 mt-0.5 text-accent" />
                      <span>Kolkata, West Bengal, India</span>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <a
                      href="https://www.linkedin.com/in/piyush-saha-93690a241/"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-surface px-3 py-2 text-sm text-text-primary hover:border-accent/60 transition-colors"
                    >
                      <Linkedin className="w-4 h-4" /> LinkedIn
                    </a>
                    <a
                      href="https://github.com/AdroitPhilocalist"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-surface px-3 py-2 text-sm text-text-primary hover:border-accent/60 transition-colors"
                    >
                      <Github className="w-4 h-4" /> GitHub
                    </a>
                    <a
                      href="https://www.piyushsaha.me/"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-surface px-3 py-2 text-sm text-text-primary hover:border-accent/60 transition-colors"
                    >
                      <Globe className="w-4 h-4" /> Portfolio
                    </a>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-primary/35 bg-surface/70 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">CGPA</p>
                    <p className="text-2xl font-bold text-text-primary mt-1">9.39 / 10</p>
                  </div>
                  <div className="rounded-xl border border-primary/35 bg-surface/70 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Internships</p>
                    <p className="text-2xl font-bold text-text-primary mt-1">4+</p>
                  </div>
                  <div className="rounded-xl border border-primary/35 bg-surface/70 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">Hackathons</p>
                    <p className="text-2xl font-bold text-text-primary mt-1">Top Finishes</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/35 bg-card/80 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <GraduationCap className="w-5 h-5 text-accent" />
                    <h3 className="text-xl font-semibold text-text-primary">Education and Focus</h3>
                  </div>
                  <p className="text-text-secondary leading-relaxed">
                    B.Tech in Computer Science and Engineering at Heritage Institute of Technology and B.S. in Data Science and Applications at IIT Madras.
                    Focused on Cryptography, Network Security, Secure System Design, and applied full-stack engineering.
                  </p>
                </div>

                <div className="rounded-2xl border border-primary/35 bg-card/80 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Award className="w-5 h-5 text-accent" />
                    <h3 className="text-xl font-semibold text-text-primary">Highlights</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Cyber Security',
                      'Next.js + TypeScript',
                      'Node.js + MongoDB',
                      'Kafka + PySpark',
                      'AWS Cloud Foundations',
                      'SQL (Advanced)',
                      'Springer Conference Paper',
                      'Competitive Hackathon Finalist',
                    ].map((item) => (
                      <span
                        key={item}
                        className="px-3 py-1.5 rounded-full text-sm border border-accent/30 bg-accent/10 text-text-primary"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
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