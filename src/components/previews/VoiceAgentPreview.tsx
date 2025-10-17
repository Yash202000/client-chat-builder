'use client';

import React, { useState } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useVoiceAssistant,
  VoiceAssistantControlBar,
  BarVisualizer,
} from '@livekit/components-react';
import { MediaDeviceFailure } from 'livekit-client';
import { Button } from '../ui/button';
import { MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceAgentPreviewProps {
  liveKitToken: string | null;
  shouldConnect: boolean;
  setShouldConnect: (connect: boolean) => void;
  livekitUrl: string;
  customization: any;
  backendUrl?: string;
}

function SimpleVoiceAssistant() {
  const { state, audioTrack } = useVoiceAssistant();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="absolute bottom-6 right-6 w-[300px] 
        rounded-2xl shadow-2xl p-4 flex flex-col items-center justify-between
        backdrop-blur-md border border-white/20"
      style={{
        background: 'rgba(255,255,255,0.85)',
      }}
    >
      {/* Bars */}
      <div className="w-full flex-1 flex items-center justify-center relative mb-3">
        <BarVisualizer
          state={state}
          barCount={9}
          trackRef={audioTrack}
          style={{ width: '90%', height: '50px' }}
        />
        <div className="absolute inset-0 rounded-2xl border-2 border-white/30 animate-pulse pointer-events-none"></div>
      </div>

      {/* Control bar inside the widget */}
      <div className="w-full">
        <VoiceAssistantControlBar />
        <RoomAudioRenderer />
      </div>
    </motion.div>
  );
}

export const VoiceAgentPreview: React.FC<VoiceAgentPreviewProps> = ({
  liveKitToken,
  shouldConnect,
  setShouldConnect,
  customization,
  backendUrl,
}) => {
  const onDeviceFailure = (e?: MediaDeviceFailure) => {
    console.error(e);
    alert(
      'Error acquiring microphone permissions. Please allow mic access and reload the tab.'
    );
  };

  return (
    <div className="h-full w-full relative">
      <LiveKitRoom
        serverUrl={customization.livekit_url}
        token={liveKitToken}
        connect={shouldConnect}
        audio={true}
        video={false}
        onMediaDeviceFailure={onDeviceFailure}
        onDisconnected={() => setShouldConnect(false)}
      >
        {/* Floating button */}
        <AnimatePresence>
          {!shouldConnect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-6 right-6"
            >
              <Button
                className="rounded-full h-16 w-16 shadow-xl hover:scale-110 
                  transition-transform duration-300 flex items-center justify-center
                  bg-gradient-to-br from-purple-600 to-indigo-600 hover:shadow-purple-500/50"
                onClick={() => setShouldConnect(true)}
              >
                {customization.agent_avatar_url ? (
                  <img
                    src={`${backendUrl}/api/v1/proxy/image-proxy?url=${encodeURIComponent(
                      customization.agent_avatar_url
                    )}`}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <MessageSquare className="h-8 w-8 text-white" />
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded Panel */}
        <AnimatePresence>
          {shouldConnect && <SimpleVoiceAssistant />}
        </AnimatePresence>
      </LiveKitRoom>
    </div>
  );
};
