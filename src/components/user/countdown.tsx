
'use client';

import { useState, useEffect } from 'react';

const COOLDOWN_HOURS = 48;

export function Countdown({ lastRequestTimestamp }: { lastRequestTimestamp: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const lastRequestDate = new Date(lastRequestTimestamp);
      const cooldownEndDate = new Date(lastRequestDate.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000);
      const now = new Date();
      
      const difference = cooldownEndDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft('You can now submit a new request.');
        return;
      }

      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const totalHours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft(
        `You can submit a new request in ${String(totalHours).padStart(2, '0')} hours, ${String(minutes).padStart(2, '0')} minutes, and ${String(seconds).padStart(2, '0')} seconds.`
      );
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [lastRequestTimestamp]);

  return (
    <div className="mt-2 font-semibold text-sm">
      {timeLeft}
    </div>
  );
}
