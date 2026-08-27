import { useState, useEffect, useCallback, useRef } from 'react';
import { ttsService } from '../services/ttsService';
import { Language } from '../types';

const STORAGE_KEY = 'andam_voice_output_enabled';

export function useTextToSpeech() {
  const [isAutoVoiceEnabled, setIsAutoVoiceEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  const [playbackState, setPlaybackState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  const activeMessageIdRef = useRef<string | null>(null);
  activeMessageIdRef.current = activeMessageId;

  // Persist auto voice preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(isAutoVoiceEnabled));
    }
  }, [isAutoVoiceEnabled]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      ttsService.stop();
    };
  }, []);

  const toggleAutoVoice = useCallback((overrideValue?: boolean) => {
    // Unlock mobile audio on user toggle
    ttsService.unlockAudio();

    setIsAutoVoiceEnabled((prev) => {
      const next = typeof overrideValue === 'boolean' ? overrideValue : !prev;
      if (!next) {
        ttsService.stop();
        setPlaybackState('idle');
        setActiveMessageId(null);
      }
      return next;
    });
  }, []);

  const playMessage = useCallback(
    (messageId: string, text: string, lang: Language) => {
      // Unlock mobile audio on user gesture
      ttsService.unlockAudio();

      setActiveMessageId(messageId);
      setPlaybackState('playing');

      ttsService.speak(messageId, text, lang, {
        onStart: () => {
          setActiveMessageId(messageId);
          setPlaybackState('playing');
        },
        onChunkChange: (current, total) => {
          setProgress({ current: current + 1, total });
        },
        onPause: () => {
          setPlaybackState('paused');
        },
        onResume: () => {
          setPlaybackState('playing');
        },
        onEnd: () => {
          setActiveMessageId(null);
          setPlaybackState('idle');
          setProgress({ current: 0, total: 0 });
        },
        onError: () => {
          setActiveMessageId(null);
          setPlaybackState('idle');
          setProgress({ current: 0, total: 0 });
        },
      });
    },
    []
  );

  const pauseAudio = useCallback(() => {
    ttsService.pause();
    setPlaybackState('paused');
  }, []);

  const resumeAudio = useCallback(() => {
    ttsService.resume();
    setPlaybackState('playing');
  }, []);

  const stopAudio = useCallback(() => {
    ttsService.stop();
    setActiveMessageId(null);
    setPlaybackState('idle');
    setProgress({ current: 0, total: 0 });
  }, []);

  const togglePlayPauseMessage = useCallback(
    (messageId: string, text: string, lang: Language) => {
      if (activeMessageId === messageId) {
        if (playbackState === 'playing') {
          pauseAudio();
        } else if (playbackState === 'paused') {
          resumeAudio();
        } else {
          playMessage(messageId, text, lang);
        }
      } else {
        playMessage(messageId, text, lang);
      }
    },
    [activeMessageId, playbackState, pauseAudio, resumeAudio, playMessage]
  );

  return {
    isAutoVoiceEnabled,
    playbackState,
    activeMessageId,
    progress,
    isSupported: ttsService.isSupported(),
    toggleAutoVoice,
    playMessage,
    pauseAudio,
    resumeAudio,
    stopAudio,
    togglePlayPauseMessage,
    unlockAudio: () => ttsService.unlockAudio(),
  };
}
