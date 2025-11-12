
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useAuth } from "@/hooks/useAuth";
import { Trash2, UploadCloud } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';

interface VoiceProfile {
    id: number;
    name: string;
    provider_voice_id: string;
}

const VoicesPage: React.FC = () => {
    const { t, isRTL } = useI18n();
    const queryClient = useQueryClient();
    const { authFetch } = useAuth();
    const [voiceName, setVoiceName] = useState('');
    const [files, setFiles] = useState<FileList | null>(null);

    const { data: voiceProfiles, isLoading } = useQuery<VoiceProfile[]>({
        queryKey: ['voiceProfiles'],
        queryFn: async () => {
            const response = await authFetch('/api/v1/voices/');
            if (!response.ok) throw new Error('Failed to fetch voice profiles');
            return response.json();
        },
    });

    const cloneMutation = useMutation({
        mutationFn: async () => {
            if (!files || files.length === 0 || !voiceName) {
                throw new Error("Voice name and at least one audio file are required.");
            }
            const formData = new FormData();
            formData.append('name', voiceName);
            for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i]);
            }
            const response = await authFetch('/api/v1/voices/clone', {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to clone voice');
            }
            return response.json();
        },
        onSuccess: () => {
            toast({ title: t('common.success'), description: t('voices.toasts.cloningStarted') });
            queryClient.invalidateQueries({ queryKey: ['voiceProfiles'] });
            setVoiceName('');
            setFiles(null);
        },
        onError: (e: Error) => toast({ title: t('common.error'), description: e.message, variant: 'destructive' }),
    });

    const deleteMutation = useMutation({
        mutationFn: (voiceProfileId: number) => authFetch(`/api/v1/voices/${voiceProfileId}`, {
            method: 'DELETE',
        }),
        onSuccess: () => {
            toast({ title: t('common.success'), description: t('voices.toasts.voiceDeleted') });
            queryClient.invalidateQueries({ queryKey: ['voiceProfiles'] });
        },
        onError: (e: Error) => toast({ title: t('common.error'), description: e.message, variant: 'destructive' }),
    });

    return (
        <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <Card>
                <CardHeader>
                    <CardTitle>{t('voices.cloneNewVoice')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="voiceName">{t('voices.voiceName')}</Label>
                        <Input
                            id="voiceName"
                            value={voiceName}
                            onChange={(e) => setVoiceName(e.target.value)}
                            placeholder={t('voices.voiceNamePlaceholder')}
                        />
                    </div>
                    <div>
                        <Label htmlFor="audioFiles">{t('voices.audioSamples')}</Label>
                        <Input
                            id="audioFiles"
                            type="file"
                            multiple
                            accept="audio/*"
                            onChange={(e) => setFiles(e.target.files)}
                        />
                    </div>
                    <Button onClick={() => cloneMutation.mutate()} disabled={cloneMutation.isPending}>
                        {cloneMutation.isPending ? t('voices.cloning') : <><UploadCloud className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} /> {t('voices.startCloning')}</>}
                    </Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>{t('voices.yourVoiceLibrary')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? <p>{t('voices.loadingVoices')}</p> : (
                        <ul className="space-y-2">
                            {voiceProfiles?.map(vp => (
                                <li key={vp.id} className={`flex items-center justify-between p-2 border rounded-md ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <span>{vp.name}</span>
                                    <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(vp.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default VoicesPage;
