import { useState, useEffect, useCallback, useRef } from 'react';

export interface WakeLockState {
  isSupported: boolean;
  isActive: boolean;
  request: () => Promise<boolean>;
  release: () => Promise<void>;
  toggle: () => Promise<boolean>;
  error: string | null;
}

export function useWakeLock(): WakeLockState {
  const [isSupported] = useState<boolean>(
    () => typeof navigator !== 'undefined' && 'wakeLock' in navigator
  );
  const [isActive, setIsActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const wakeLockSentinel = useRef<any>(null);

  const release = useCallback(async () => {
    if (wakeLockSentinel.current) {
      try {
        await wakeLockSentinel.current.release();
      } catch (err) {
        console.warn('Wake Lock release error:', err);
      } finally {
        wakeLockSentinel.current = null;
        setIsActive(false);
      }
    }
  }, []);

  const request = useCallback(async (): Promise<boolean> => {
    if (!('wakeLock' in navigator)) {
      setError('Wake Lock API אינו נתמך בדפדפן זה');
      return false;
    }

    try {
      setError(null);
      const sentinel = await (navigator as any).wakeLock.request('screen');
      wakeLockSentinel.current = sentinel;
      setIsActive(true);

      sentinel.addEventListener('release', () => {
        wakeLockSentinel.current = null;
        setIsActive(false);
      });

      return true;
    } catch (err: any) {
      setError(err.message || 'שגיאה בהפעלת שמירת מסך פעיל');
      setIsActive(false);
      return false;
    }
  }, []);

  const toggle = useCallback(async (): Promise<boolean> => {
    if (isActive) {
      await release();
      return false;
    } else {
      return await request();
    }
  }, [isActive, release, request]);

  // Re-acquire lock if tab becomes visible again and lock was active
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isActive && !wakeLockSentinel.current) {
        await request();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockSentinel.current) {
        wakeLockSentinel.current.release().catch(() => {});
      }
    };
  }, [isActive, request]);

  return {
    isSupported,
    isActive,
    request,
    release,
    toggle,
    error,
  };
}
