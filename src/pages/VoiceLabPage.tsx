
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Trash2, UploadCloud, Play, Loader2, FileAudio, X, Mic } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import AudioRecorder from '@/components/AudioRecorder';
import VoiceTestDialog from '@/components/VoiceTestDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const VOICE_ENGINE_URL = 'http://localhost:8001';
const DEFAULT_VOICE_ID = 'default';

interface VoiceTask {
    task_id: string;
    voice_name: string;
    status: 'processing' | 'completed' | 'failed';
}

const VoiceLabPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [voiceName, setVoiceName] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
    const [processingTasks, setProcessingTasks] = useState<Map<string, VoiceTask>>(new Map());
    const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
    const [selectedVoice, setSelectedVoice] = useState<string | null>(null);

    const { data: completedVoices = [], isLoading: isLoadingVoices } = useQuery<string[]>({
        queryKey: ['voices'],
        queryFn: async () => {
            const response = await fetch(`${VOICE_ENGINE_URL}/api/v1/voices`);
            if (!response.ok) throw new Error('Failed to fetch voices');
            return response.json();
        },
    });

    useQuery({
        queryKey: ['taskStatus', Array.from(processingTasks.keys())],
        queryFn: async () => {
            if (processingTasks.size === 0) return null;
            const updatedTasks = new Map(processingTasks);
            let needsUpdate = false;
            for (const [taskId, task] of updatedTasks.entries()) {
                if (task.status === 'processing') {
                    const response = await fetch(`${VOICE_ENGINE_URL}/api/v1/voices/${taskId}/status`);
                    if (!response.ok) continue;
                    const data = await response.json();
                    if (data.status === 'SUCCESS' || data.status === 'FAILURE') {
                        updatedTasks.delete(taskId);
                        needsUpdate = true;
                        queryClient.invalidateQueries({ queryKey: ['voices'] });
                    }
                }
            }
            if (needsUpdate) setProcessingTasks(updatedTasks);
            return null;
        },
        enabled: processingTasks.size > 0,
        refetchInterval: 3000,
    });

    const cloneMutation = useMutation({
        mutationFn: async () => {
            if (!file && !recordedAudio) throw new Error("An audio file or a recording is required.");
            if (!voiceName) throw new Error("Voice name is required.");
            
            const formData = new FormData();
            formData.append('voice_name', voiceName);
            const audioFile = file || new File([recordedAudio!], `${voiceName.replace(/\s+/g, '_')}.webm`, { type: 'audio/webm' });
            formData.append('files', audioFile);

            const response = await fetch(`${VOICE_ENGINE_URL}/api/v1/voices`, {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to start training');
            }
            return response.json();
        },
        onSuccess: (data) => {
            toast({ title: 'Training Started', description: `Your new voice "${voiceName}" is being created.` });
            setProcessingTasks(prev => new Map(prev).set(data.task_id, {
                task_id: data.task_id,
                voice_name: voiceName,
                status: 'processing',
            }));
            setVoiceName('');
            setFile(null);
            setRecordedAudio(null);
        },
        onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
    });

    const deleteMutation = useMutation({
        mutationFn: async (voiceId: string) => {
            const response = await fetch(`${VOICE_ENGINE_URL}/api/v1/voices/${voiceId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to delete voice');
            }
        },
        onSuccess: (_, voiceId) => {
            toast({ title: 'Success', description: `Voice "${voiceId}" has been deleted.` });
            queryClient.invalidateQueries({ queryKey: ['voices'] });
        },
        onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
    });

    const allVoices = useMemo(() => {
        const voiceMap = new Map<string, { status: 'completed' | 'processing' }>();
        completedVoices.forEach(name => voiceMap.set(name, { status: 'completed' }));
        for (const task of processingTasks.values()) {
            voiceMap.set(task.voice_name, { status: 'processing' });
        }
        return Array.from(voiceMap.entries()).map(([name, { status }]) => ({ name, status }));
    }, [completedVoices, processingTasks]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setRecordedAudio(null);
        }
    };

    const handleRecordingChange = (blob: Blob | null) => {
        setRecordedAudio(blob);
        if (blob) setFile(null);
    };

    const clearFile = () => {
        setFile(null);
        const fileInput = document.getElementById('audioFiles') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const openTestDialog = (voiceId: string) => {
        setSelectedVoice(voiceId);
        setIsTestDialogOpen(true);
    };

    return (
        <>
            <div className="p-4 md:p-8 space-y-8 bg-gray-50 min-h-full">
                <header>
                    <h1 className="text-3xl font-bold text-gray-800">Voice Lab</h1>
                    <p className="text-gray-600 mt-1">Create, train, and manage custom voices for your AI agents.</p>
                </header>
                <Card className="shadow-lg border-t-4 border-t-blue-600">
                    <CardHeader>
                        <CardTitle>Create a New Voice</CardTitle>
                        <CardDescription>Give your voice a name and provide an audio sample by uploading or recording.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="voiceName" className="font-semibold">Voice Name</Label>
                            <Input
                                id="voiceName"
                                value={voiceName}
                                onChange={(e) => setVoiceName(e.target.value)}
                                placeholder="e.g., 'Friendly Support Agent'"
                                className="max-w-lg"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            <div className="space-y-2">
                                <Label className="font-semibold">Option 1: Upload Audio</Label>
                                {file ? (
                                    <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <FileAudio className="h-5 w-5 text-blue-600" />
                                            <p className="text-sm font-medium truncate">{file.name}</p>
                                        </div>
                                        <Button onClick={clearFile} size="icon" variant="ghost"><X className="h-4 w-4"/></Button>
                                    </div>
                                ) : (
                                    <Input
                                        id="audioFiles"
                                        type="file"
                                        accept="audio/wav,audio/mpeg,audio/webm"
                                        onChange={handleFileChange}
                                        disabled={!!recordedAudio}
                                        className="hover:bg-gray-50 cursor-pointer"
                                    />
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="font-semibold">Option 2: Record Sample</Label>
                                <AudioRecorder onRecordingChange={handleRecordingChange} />
                            </div>
                        </div>
                        <div className="pt-4">
                            <Button 
                                size="lg"
                                onClick={() => cloneMutation.mutate()} 
                                disabled={cloneMutation.isPending || !voiceName || (!file && !recordedAudio)}
                            >
                                {cloneMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Starting Training...</> : <><UploadCloud className="mr-2 h-4 w-4" /> Create and Train Voice</>}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Your Voice Library</CardTitle>
                        <CardDescription>Manage and test your trained voices.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingVoices ? <p>Loading voices...</p> : (
                            <ul className="space-y-3">
                                {allVoices.map(({ name, status }) => (
                                    <li key={name} className="flex items-center justify-between p-4 border rounded-lg bg-background hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-gray-100 rounded-full">
                                                <Mic className="h-5 w-5 text-gray-600" />
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-800">{name}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {status === 'completed' && <Badge variant="default" className="bg-green-600 hover:bg-green-700">Ready</Badge>}
                                                    {status === 'processing' && <Badge variant="secondary">Training</Badge>}
                                                    {name === DEFAULT_VOICE_ID && <Badge variant="outline">Default</Badge>}
                                                </div>
                                            </div>
                                        </div>
                                        {status === 'processing' && (
                                            <div className="flex items-center gap-3 w-1/3">
                                                <Progress value={50} className="h-2" />
                                                <Loader2 className="h-4 w-4 animate-spin text-gray-500"/>
                                            </div>
                                        )}
                                        {status === 'completed' && (
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm" onClick={() => openTestDialog(name)}>
                                                    <Play className="h-4 w-4 mr-2" />
                                                    Test Voice
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" disabled={name === DEFAULT_VOICE_ID}>
                                                            <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the voice "{name}".
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => deleteMutation.mutate(name)}
                                                                disabled={deleteMutation.isPending}
                                                                className="bg-red-600 hover:bg-red-700"
                                                            >
                                                                {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
            <VoiceTestDialog 
                open={isTestDialogOpen}
                onOpenChange={setIsTestDialogOpen}
                voiceId={selectedVoice}
            />
        </>
    );
};

export default VoiceLabPage;
