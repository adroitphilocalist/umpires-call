'use client';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@/components/ui';
import { Check, Copy, Link2 } from 'lucide-react';

interface InviteCodeCardProps {
  inviteCode: string;
  copied: boolean;
  joinLinkCopied: boolean;
  onCopyInviteCode: () => void;
  onCopyJoinLink: () => void;
}

export function InviteCodeCard({
  inviteCode,
  copied,
  joinLinkCopied,
  onCopyInviteCode,
  onCopyJoinLink,
}: InviteCodeCardProps) {
  return (
    <Card className="order-4 opacity-85 hover:opacity-100 transition-opacity">
      <CardHeader>
        <CardTitle>Invite Code</CardTitle>
        <CardDescription>Share this code with friends to invite them</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Input
            value={inviteCode}
            readOnly
            className="font-mono text-lg tracking-wider"
          />
          <Button
            variant="secondary"
            onClick={onCopyInviteCode}
            className="px-3"
            title="Copy invite code"
          >
            {copied ? <Check size={18} className="text-success-text" /> : <Copy size={18} />}
          </Button>
          <Button
            variant="secondary"
            onClick={onCopyJoinLink}
            className="px-3"
            title="Copy direct join link"
          >
            {joinLinkCopied ? <Check size={18} className="text-success-text" /> : <Link2 size={18} />}
          </Button>
        </div>
        <p className="mt-2 text-xs text-text-secondary">
          Share link: <span className="font-mono text-text-primary">/join?code={inviteCode}</span>
        </p>
      </CardContent>
    </Card>
  );
}
