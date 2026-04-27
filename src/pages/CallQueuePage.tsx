import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CallQueuePanel } from '@/components/CallQueuePanel';
import { PhoneIncoming, Settings, ChevronDown, ChevronUp, Save, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

interface SLAConfig {
  sla_seconds: number;
  overflow_action: string;
  escalate_after_seconds: number;
}

export default function CallQueuePage() {
  const { t } = useTranslation();
  const { authFetch } = useAuth();
  const qc = useQueryClient();
  const [slaOpen, setSlaOpen] = useState(false);
  const [localSLA, setLocalSLA] = useState<SLAConfig | null>(null);

  const { data: slaConfig } = useQuery<SLAConfig>({
    queryKey: ['sla-config'],
    queryFn: async () => {
      const res = await authFetch('/api/v1/voice/queue/sla-config');
      if (!res.ok) throw new Error('Failed');
      const d = await res.json();
      setLocalSLA(d);
      return d;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: SLAConfig) => {
      const res = await authFetch('/api/v1/voice/queue/sla-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sla-config'] });
      toast({ title: t('callQueue.slaUpdated'), variant: 'success' });
    },
    onError: (e: Error) => toast({ title: t('callQueue.slaUpdateFailed'), description: e.message, variant: 'destructive' }),
  });

  const cfg = localSLA ?? slaConfig;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-border/60">
        <PhoneIncoming className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold text-foreground">{t('callQueue.title')}</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* SLA Settings Card */}
        <div className="max-w-2xl mx-auto w-full px-4 pt-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden mb-4">
            <button
              onClick={() => setSlaOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                {t('callQueue.slaSettings')}
              </div>
              {slaOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>

            {slaOpen && cfg && (
              <div className="border-t border-border/60 px-4 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                      {t('callQueue.slaThreshold')} ({t('callQueue.seconds')})
                    </label>
                    <Input
                      type="number"
                      min={10}
                      max={3600}
                      value={cfg.sla_seconds}
                      onChange={e => setLocalSLA({ ...cfg, sla_seconds: Number(e.target.value) })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                      {t('callQueue.escalateAfter')} ({t('callQueue.seconds')})
                    </label>
                    <Input
                      type="number"
                      min={10}
                      max={3600}
                      value={cfg.escalate_after_seconds}
                      onChange={e => setLocalSLA({ ...cfg, escalate_after_seconds: Number(e.target.value) })}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                    {t('callQueue.overflowAction')}
                  </label>
                  <select
                    value={cfg.overflow_action}
                    onChange={e => setLocalSLA({ ...cfg, overflow_action: e.target.value })}
                    className="w-full h-8 text-sm bg-background border border-border rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="voicemail">{t('callQueue.actionVoicemail')}</option>
                    <option value="drop">{t('callQueue.actionDrop')}</option>
                    <option value="escalate">{t('callQueue.actionEscalate')}</option>
                  </select>
                </div>

                <button
                  onClick={() => cfg && saveMutation.mutate(cfg)}
                  disabled={saveMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {t('callQueue.saveSLA')}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-2xl mx-auto w-full">
          <CallQueuePanel />
        </div>
      </div>
    </div>
  );
}
