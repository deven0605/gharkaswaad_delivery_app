import { useCallback, useEffect, useState } from 'react';

/** Second-resolution countdown timer. Restarts by calling `restart()`, which
 * defaults back to the initial duration. Used for OTP-resend cooldowns. */
export function useCountdown(initialSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [secondsLeft <= 0]);

  const restart = useCallback(
    (seconds: number = initialSeconds) => setSecondsLeft(seconds),
    [initialSeconds]
  );

  return { secondsLeft, isActive: secondsLeft > 0, restart };
}

export function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
