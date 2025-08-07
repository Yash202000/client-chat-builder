import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, StopCircle, Play, Trash2, Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';

interface AudioRecorderProps {
  onRecordingChange: (blob: Blob | null) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingChange }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        onRecordingChange(blob);
        chunksRef.current = [];
        if (timerRef.current) clearInterval(timerRef.current);
        setDuration(0);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error starting recording:", err);
      alert("Could not start recording. Please ensure you have given microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playRecording = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    onRecordingChange(null);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
      {!audioBlob ? (
        <>
          <div className="flex items-center gap-3">
            <Mic className={`h-5 w-5 ${isRecording ? 'text-red-500' : 'text-gray-500'}`} />
            <div>
              <p className="font-medium text-sm">{isRecording ? 'Recording...' : 'Record a sample'}</p>
              <p className="text-xs text-gray-500">Click the button to start recording</p>
            </div>
          </div>
          {isRecording ? (
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="animate-pulse">REC</Badge>
              <p className="text-sm font-mono">{formatTime(duration)}</p>
              <Button onClick={stopRecording} size="sm" variant="destructive">
                <StopCircle className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button onClick={startRecording} size="sm" variant="outline">
              Start
            </Button>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <Play className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-sm">Recording ready</p>
              <p className="text-xs text-gray-500">Ready to be used for training</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={playRecording} size="sm" variant="outline">
              Preview
            </Button>
            <Button onClick={deleteRecording} size="sm" variant="ghost">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default AudioRecorder;
