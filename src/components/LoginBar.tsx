
'use client';

import React from 'react';
import type { Member } from '@wix/members';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, UserCircle2 } from 'lucide-react';

interface LoginBarProps {
  member: Member | null | undefined;
  onLogin: () => void;
  onLogout: () => void;
  isLoading: boolean;
}

const LoginBar: React.FC<LoginBarProps> = ({ member, onLogin, onLogout, isLoading }) => {
  const isLoggedIn = !!member;
  const displayName = member?.profile?.nickname || member?.contact?.firstName || 'User';

  return (
    <div className="flex items-center space-x-2">
      {isLoggedIn && (
        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
          <UserCircle2 className="h-4 w-4" />
          <span>{displayName}</span>
        </div>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={isLoggedIn ? onLogout : onLogin}
        disabled={isLoading}
        className="px-2 py-1 h-auto text-xs"
      >
        {isLoading ? (
          'Processing...'
        ) : isLoggedIn ? (
          <>
            <LogOut className="mr-1 h-3 w-3" /> Logout
          </>
        ) : (
          <>
            <LogIn className="mr-1 h-3 w-3" /> Login
          </>
        )}
      </Button>
    </div>
  );
};

export default LoginBar;
