
'use client';

import React, { useEffect, useState } from 'react';
import { myWixClient, saveTokensToCookie } from '@/lib/wix-client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function LoginCallbackPage() {
  const [message, setMessage] = useState('Processing login...');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const processLogin = async () => {
      try {
        const oauthDataString = localStorage.getItem('oauthRedirectData');
        if (!oauthDataString) {
          throw new Error('OAuth redirect data not found in local storage.');
        }
        localStorage.removeItem('oauthRedirectData'); // Clean up immediately

        const oauthData = JSON.parse(oauthDataString);
        const { state } = oauthData; // The SDK needs the state for validation

        if (!window.location.search) {
            throw new Error('Authorization code not found in URL.');
        }
        
        // processOAuthCallback expects the full callback URL and the original state
        const tokens = await myWixClient.auth.processOAuthCallback(window.location.href, state);

        if (tokens && tokens.accessToken && tokens.refreshToken) {
          saveTokensToCookie(tokens);
          myWixClient.auth.setTokens(tokens); // Ensure client instance is updated
          setMessage('Login successful! Redirecting...');
          toast({ title: 'Login Successful', description: 'You are now logged in.' });
          
          // Redirect to the original URI stored in state or fallback to home
          const originalUri = state?.originalUri || '/';
          window.location.href = originalUri;

        } else {
          throw new Error('Failed to obtain tokens after OAuth callback.');
        }
      } catch (err) {
        console.error('Login callback error:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during login.';
        setError(`Login failed: ${errorMessage}`);
        setMessage(`Login failed. ${errorMessage}`);
        toast({
          title: 'Login Failed',
          description: errorMessage,
          variant: 'destructive',
        });
         // Optionally redirect to home or a login failed page
         setTimeout(() => {
            window.location.href = '/'; // Redirect to home after a delay
         }, 3000);
      }
    };

    processLogin();
  }, [toast]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="flex items-center space-x-2">
        {!error && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
        <h1 className="text-2xl font-semibold">{message}</h1>
      </div>
      {error && (
        <p className="mt-4 text-destructive">
          Please try logging in again. If the issue persists, contact support.
        </p>
      )}
    </div>
  );
}
