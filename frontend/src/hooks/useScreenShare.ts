import { useState, useRef, useCallback, useEffect } from 'react';

export function useScreenShare() {
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      if (stream) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [stream, isSharing]);

  const start = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' } as any,
        audio: false,
      });

      mediaStream.getVideoTracks()[0].addEventListener('ended', () => {
        setIsSharing(false);
        setStream(null);
      });

      setStream(mediaStream);
      setIsSharing(true);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to share screen');
      }
      setIsSharing(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setIsSharing(false);
  }, [stream]);

  const toggle = useCallback(() => {
    if (isSharing) {
      stop();
    } else {
      start();
    }
  }, [isSharing, start, stop]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return { isSharing, error, videoRef, start, stop, toggle };
}
