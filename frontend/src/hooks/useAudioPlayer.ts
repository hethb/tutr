import { useState, useRef, useCallback, useEffect } from 'react';

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const volumeIntervalRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      clearInterval(volumeIntervalRef.current);
    };
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return;
    if (!window.speechSynthesis) {
      console.warn('SpeechSynthesis not supported in this browser');
      return;
    }

    window.speechSynthesis.cancel();
    clearInterval(volumeIntervalRef.current);

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) =>
        v.name.includes('Samantha') ||
        v.name.includes('Karen') ||
        v.name.includes('Google US English') ||
        v.name.includes('Microsoft Zira') ||
        (v.lang.startsWith('en') && v.name.includes('Female')),
    );
    if (preferred) {
      utterance.voice = preferred;
    } else {
      const englishVoice = voices.find((v) => v.lang.startsWith('en'));
      if (englishVoice) utterance.voice = englishVoice;
    }

    utterance.rate = 1.18;
    utterance.pitch = 1.02;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsSpeaking(true);
      volumeIntervalRef.current = window.setInterval(() => {
        setVolume(0.3 + Math.random() * 0.5);
      }, 120);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsSpeaking(false);
      setVolume(0);
      clearInterval(volumeIntervalRef.current);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsSpeaking(false);
      setVolume(0);
      clearInterval(volumeIntervalRef.current);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    clearInterval(volumeIntervalRef.current);
    setIsPlaying(false);
    setIsSpeaking(false);
    setVolume(0);
  }, []);

  return { isPlaying, isSpeaking, volume, speak, stop };
}
