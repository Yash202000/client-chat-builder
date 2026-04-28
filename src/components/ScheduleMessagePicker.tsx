import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Clock, ChevronRight } from 'lucide-react';
import { addMinutes, addHours, setHours, setMinutes, startOfTomorrow, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ScheduleMessagePickerProps {
  onSchedule: (date: Date) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

const QUICK_OPTIONS = [
  { label: 'In 15 minutes', getDate: () => addMinutes(new Date(), 15) },
  { label: 'In 1 hour', getDate: () => addHours(new Date(), 1) },
  { label: 'Tomorrow 9 AM', getDate: () => setMinutes(setHours(startOfTomorrow(), 9), 0) },
  { label: 'Tomorrow 12 PM', getDate: () => setMinutes(setHours(startOfTomorrow(), 12), 0) },
  { label: 'Monday 9 AM', getDate: () => {
    const d = new Date();
    const daysUntilMonday = (8 - d.getDay()) % 7 || 7;
    return setMinutes(setHours(addHours(d, daysUntilMonday * 24), 9), 0);
  }},
];

const ScheduleMessagePicker: React.FC<ScheduleMessagePickerProps> = ({ onSchedule, disabled, children }) => {
  const [open, setOpen] = useState(false);
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');

  const handleQuick = (getDate: () => Date) => {
    onSchedule(getDate());
    setOpen(false);
  };

  const handleCustom = () => {
    if (!customDate || !customTime) return;
    const dt = new Date(`${customDate}T${customTime}`);
    if (isNaN(dt.getTime()) || dt <= new Date()) return;
    onSchedule(dt);
    setOpen(false);
  };

  const tomorrow = format(startOfTomorrow(), 'yyyy-MM-dd');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children || (
          <Button
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Schedule message"
          >
            <Clock className="h-3.5 w-3.5" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2" side="top">
        <div className="mb-2 px-1">
          <p className="text-xs font-semibold text-foreground">Schedule message</p>
          <p className="text-[10px] text-muted-foreground">Pick when this message is sent</p>
        </div>

        <div className="space-y-0.5 mb-2">
          {QUICK_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => handleQuick(opt.getDate)}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <span>{opt.label}</span>
              <span className="text-[10px] text-muted-foreground/60">
                {format(opt.getDate(), 'EEE, MMM d h:mm a')}
              </span>
            </button>
          ))}
        </div>

        <div className="border-t border-border pt-2">
          <p className="text-[10px] font-medium text-muted-foreground px-1 mb-1.5">Custom time</p>
          <div className="flex gap-1.5">
            <input
              type="date"
              value={customDate}
              min={tomorrow}
              onChange={(e) => setCustomDate(e.target.value)}
              className="flex-1 h-7 text-xs border border-border rounded-md px-2 bg-background text-foreground focus:outline-none focus:border-primary"
            />
            <input
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="w-24 h-7 text-xs border border-border rounded-md px-2 bg-background text-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <Button
            size="sm"
            className="w-full mt-2 h-7 text-xs"
            disabled={!customDate || !customTime}
            onClick={handleCustom}
          >
            Schedule
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ScheduleMessagePicker;
