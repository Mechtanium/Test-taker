'use client';

import { useEffect } from 'react';
// import { useToast } from '@/hooks/use-toast'; // No longer needed here

export function ClientEventBlocker() {
  // const { toast } = useToast(); // No longer needed here

  useEffect(() => {
    // Global copy/cut/paste prevention logic removed.
    // Specific prevention is now handled in page.tsx for the answer Textarea.
  }, []); // Empty dependency array

  return null; // This component doesn't render anything itself
}