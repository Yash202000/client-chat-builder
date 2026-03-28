import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const parseUTCDate = (ts: string) => {
  if (!ts) return new Date(ts);
  return new Date(ts.endsWith('Z') || ts.includes('+') ? ts : ts + 'Z');
};

interface SLATimerProps {
  lastMessageTimestamp: string;
}

const SLATimer: React.FC<SLATimerProps> = ({ lastMessageTimestamp }) => {
  const [minutesAgo, setMinutesAgo] = useState(0);

  useEffect(() => {
    const compute = () => {
      const ms = Date.now() - parseUTCDate(lastMessageTimestamp).getTime();
      setMinutesAgo(Math.floor(ms / 60000));
    };
    compute();
    const id = setInterval(compute, 30_000);
    return () => clearInterval(id);
  }, [lastMessageTimestamp]);

  const colorClass =
    minutesAgo < 5
      ? 'text-green-600 dark:text-green-400'
      : minutesAgo < 30
      ? 'text-amber-500 dark:text-amber-400'
      : 'text-red-500 dark:text-red-400';

  return (
    <span className={`flex items-center gap-1 text-[10px] font-medium ${colorClass}`}>
      {minutesAgo >= 30 && (
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
      )}
      <Clock className="w-3 h-3 flex-shrink-0" />
      {lastMessageTimestamp
        ? formatDistanceToNow(parseUTCDate(lastMessageTimestamp), { addSuffix: true })
        : 'No messages'}
    </span>
  );
};

export default SLATimer;
