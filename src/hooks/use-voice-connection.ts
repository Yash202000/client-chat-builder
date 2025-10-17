
import { useState, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getWebSocketUrl } from '@/config/api';

export const useVoiceConnection = (agentId: number, sessionId: string, voiceId: string = "21m00Tcm4TlvDq8ikWAM") => {
    const { token } = useAuth();
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const voiceWsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioQueue = useRef<ArrayBuffer[]>([]);

    const playNextInQueue = useCallback(async () => {
        if (audioQueue.current.length === 0) {
            setIsPlaying(false);
            return;
        }
        setIsPlaying(true);
        const arrayBuffer = audioQueue.current.shift();
        if (arrayBuffer && audioContextRef.current) {
            try {
                const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
                const source = audioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContextRef.current.destination);
                source.onended = playNextInQueue;
                source.start();
            } catch (e) {
                console.error("Error decoding audio data", e);
                setIsPlaying(false);
            }
        }
    }, []);

    const initVoiceWebSocket = useCallback(() => {
        if (voiceWsRef.current && voiceWsRef.current.readyState === WebSocket.OPEN) return;
        
        const wsUrl = `${getWebSocketUrl()}/api/v1/ws/internal/voice/${agentId}/${sessionId}?user_type=agent&voice_id=${voiceId}&token=${token}`;
        voiceWsRef.current = new WebSocket(wsUrl);

        voiceWsRef.current.onopen = () => {
            console.log('Voice WebSocket connected (internal).');
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
        };

        voiceWsRef.current.onmessage = async (event) => {
            if (event.data instanceof Blob) {
                const arrayBuffer = await event.data.arrayBuffer();
                audioQueue.current.push(arrayBuffer);
                if (!isPlaying) {
                    playNextInQueue();
                }
            }
        };

        voiceWsRef.current.onerror = (error) => console.error('Voice WebSocket error:', error);
        voiceWsRef.current.onclose = () => console.log('Voice WebSocket disconnected.');

    }, [agentId, sessionId, voiceId, token, isPlaying, playNextInQueue]);

    const startRecording = useCallback(async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('Browser does not support audio recording.');
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            
            initVoiceWebSocket();

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0 && voiceWsRef.current && voiceWsRef.current.readyState === WebSocket.OPEN) {
                    voiceWsRef.current.send(event.data);
                }
            };

            mediaRecorderRef.current.onstart = () => setIsRecording(true);
            mediaRecorderRef.current.onstop = () => {
                setIsRecording(false);
                voiceWsRef.current?.close();
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorderRef.current.start(500);
        } catch (err) {
            console.error('Error starting recording:', err);
        }
    }, [initVoiceWebSocket]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    }, []);

    return { isRecording, startRecording, stopRecording };
};
