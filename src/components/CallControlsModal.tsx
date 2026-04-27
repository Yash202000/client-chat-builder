import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import {
  PhoneForwarded, Radio, Loader2, X,
  PhoneCall, Eye, Mic, MicOff, Users,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface Props {
  callSid: string;
  onClose: () => void;
}

type Tab = 'transfer' | 'supervise' | 'conference';

export function CallControlsModal({ callSid, onClose }: Props) {
  const { authFetch } = useAuth();
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('transfer');
  const [destination, setDestination] = useState('');
  const [warm, setWarm] = useState(false);
  const [mode, setMode] = useState<'listen' | 'barge' | 'whisper'>('listen');
  const [participant, setParticipant] = useState('');

  const transferMutation = useMutation({
    mutationFn: async () => {
      const res = await authFetch(`/api/v1/twilio/calls/${callSid}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, warm }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: warm ? t('callControls.callerOnHold') : t('callControls.callTransferred'),
        description: warm
          ? t('callControls.callerOnHoldDesc', { conference: data.conference })
          : t('callControls.callTransferredDesc', { destination }),
        variant: 'success',
      });
      if (!warm) onClose();
    },
    onError: (e: Error) => toast({ title: t('callControls.transferFailed'), description: e.message, variant: 'destructive' }),
  });

  const superviseMutation = useMutation({
    mutationFn: async () => {
      const res = await authFetch(`/api/v1/twilio/calls/${callSid}/supervise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: t('callControls.superviseActive'),
        description: t('callControls.superviseActiveDesc', { mode }),
        variant: 'success',
      });
      onClose();
    },
    onError: (e: Error) => toast({ title: t('callControls.superviseFailed'), description: e.message, variant: 'destructive' }),
  });

  const conferenceMutation = useMutation({
    mutationFn: async () => {
      const res = await authFetch(`/api/v1/twilio/calls/${callSid}/add-participant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participant }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: t('callControls.participantAdded'),
        description: t('callControls.participantAddedDesc', { participant }),
        variant: 'success',
      });
      setParticipant('');
    },
    onError: (e: Error) => toast({ title: t('callControls.conferenceFailed'), description: e.message, variant: 'destructive' }),
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm mx-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">{t('callControls.title')}</span>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border/60">
            {(['transfer', 'supervise', 'conference'] as Tab[]).map(tab_key => (
              <button
                key={tab_key}
                onClick={() => setTab(tab_key)}
                className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
                  tab === tab_key
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab_key === 'transfer'
                  ? t('callControls.transfer')
                  : tab_key === 'supervise'
                  ? t('callControls.supervise')
                  : t('callControls.conference')}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-4">
            {tab === 'transfer' && (
              <>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                    {t('callControls.destination')}
                  </label>
                  <Input
                    placeholder="+1234567890 or client:agent_42"
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    className="h-9 text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {t('callControls.destinationHint')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWarm(!warm)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      warm
                        ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700'
                        : 'bg-muted text-muted-foreground border-border hover:text-foreground'
                    }`}
                  >
                    <Radio className="h-3.5 w-3.5" />
                    {warm ? t('callControls.warmTransfer') : t('callControls.blindTransfer')}
                  </button>
                  <p className="text-[10px] text-muted-foreground">
                    {warm ? t('callControls.warmDesc') : t('callControls.blindDesc')}
                  </p>
                </div>

                <button
                  onClick={() => transferMutation.mutate()}
                  disabled={!destination || transferMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {transferMutation.isPending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <PhoneForwarded className="h-4 w-4" />}
                  {warm ? t('callControls.putOnHold') : t('callControls.transferNow')}
                </button>
              </>
            )}

            {tab === 'supervise' && (
              <>
                <p className="text-xs text-muted-foreground">
                  {t('callControls.superviseDesc')}
                </p>

                <div className="grid grid-cols-3 gap-2">
                  {(['listen', 'barge', 'whisper'] as const).map(m => {
                    const icons = {
                      listen: <Eye className="h-4 w-4" />,
                      barge: <Mic className="h-4 w-4" />,
                      whisper: <MicOff className="h-4 w-4" />,
                    };
                    const labelKeys: Record<string, string> = {
                      listen: t('callControls.listen'),
                      barge: t('callControls.barge'),
                      whisper: t('callControls.whisper'),
                    };
                    const descKeys: Record<string, string> = {
                      listen: t('callControls.listenDesc'),
                      barge: t('callControls.bargeDesc'),
                      whisper: t('callControls.whisperDesc'),
                    };
                    return (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-colors ${
                          mode === m
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                      >
                        {icons[m]}
                        <span>{labelKeys[m]}</span>
                        <span className="text-[9px] font-normal opacity-70">{descKeys[m]}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => superviseMutation.mutate()}
                  disabled={superviseMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {superviseMutation.isPending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Radio className="h-4 w-4" />}
                  {t('callControls.joinAs', { mode })}
                </button>
              </>
            )}

            {tab === 'conference' && (
              <>
                <p className="text-xs text-muted-foreground">
                  {t('callControls.conferenceDesc')}
                </p>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                    {t('callControls.participant')}
                  </label>
                  <Input
                    placeholder="+1234567890 or client:agent_42"
                    value={participant}
                    onChange={e => setParticipant(e.target.value)}
                    className="h-9 text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {t('callControls.participantHint')}
                  </p>
                </div>
                <button
                  onClick={() => conferenceMutation.mutate()}
                  disabled={!participant || conferenceMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {conferenceMutation.isPending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Users className="h-4 w-4" />}
                  {t('callControls.addNow')}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
