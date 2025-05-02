'use client';

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function ClientEventBlocker() {
  const { toast } = useToast();

  useEffect(() => {
    const preventAction = (e: ClipboardEvent | DragEvent) => {
      // Allow copy/cut/paste within input fields and textareas
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Allow default behavior for specific elements
         // Check if it's a copy/cut event and text is selected within the allowed element
         if ((e.type === 'copy' || e.type === 'cut') && window.getSelection()?.toString().length === 0) {
             // If nothing is selected, still prevent default to avoid copying placeholder or similar
             e.preventDefault();
             // Optionally show a toast, or just silently prevent
             // toast({ ... });
             return;
         }
         // For paste, or copy/cut with selection, allow the default action
         return;
      }

      // For all other elements, prevent the action
      e.preventDefault();
      toast({
        title: 'Action Disabled',
        description: `${e.type.charAt(0).toUpperCase() + e.type.slice(1)}ing is disabled outside of input fields.`,
        variant: 'destructive',
        duration: 2000,
      });
    };

    document.addEventListener('copy', preventAction);
    document.addEventListener('cut', preventAction);
    document.addEventListener('paste', preventAction);

    return () => {
      document.removeEventListener('copy', preventAction);
      document.removeEventListener('cut', preventAction);
      document.removeEventListener('paste', preventAction);
    };
  }, [toast]); // Include toast in dependency array

  return null; // This component doesn't render anything itself
}
