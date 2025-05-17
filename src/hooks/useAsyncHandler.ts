
'use client';

import { useCallback } from 'react';
import { useLoading } from '@/contexts/LoadingContext'; // Adjusted path

export function useAsyncHandler() {
  const { startLoading, stopLoading } = useLoading();

  return useCallback(
    async <T>(asyncFunc: () => Promise<T>): Promise<T> => {
      startLoading();
      try {
        return await asyncFunc();
      } catch (error) {
        console.error("Async operation error:", error);
        // Optionally, re-throw the error or handle it based on application needs
        // For example, you might want to display a generic error message to the user here
        throw error;
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );
}
