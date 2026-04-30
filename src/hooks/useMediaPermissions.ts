import { useState, useEffect } from 'react';

export type MediaPermissionState = 'granted' | 'denied' | 'prompt' | 'unknown';

export interface MediaPermissions {
  camera: MediaPermissionState;
  mic: MediaPermissionState;
  checking: boolean;
}

export function useMediaPermissions(): MediaPermissions {
  const [camera, setCamera] = useState<MediaPermissionState>('unknown');
  const [mic, setMic] = useState<MediaPermissionState>('unknown');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function queryPermissions() {
      setChecking(true);

      // iOS Safari does not support querying camera/microphone permissions via
      // navigator.permissions.query — fall back to 'unknown' in that case.
      if (
        typeof navigator === 'undefined' ||
        typeof navigator.permissions === 'undefined' ||
        typeof navigator.permissions.query !== 'function'
      ) {
        if (!cancelled) {
          setCamera('unknown');
          setMic('unknown');
          setChecking(false);
        }
        return;
      }

      const queryOne = async (
        name: PermissionName,
      ): Promise<MediaPermissionState> => {
        try {
          const result = await navigator.permissions.query({ name });
          return result.state as MediaPermissionState;
        } catch {
          // Some browsers (e.g. iOS Safari) throw when the permission name is
          // not recognised — treat as 'unknown'.
          return 'unknown';
        }
      };

      const [cameraState, micState] = await Promise.all([
        queryOne('camera' as PermissionName),
        queryOne('microphone' as PermissionName),
      ]);

      if (!cancelled) {
        setCamera(cameraState);
        setMic(micState);
        setChecking(false);
      }
    }

    queryPermissions();

    return () => {
      cancelled = true;
    };
  }, []);

  return { camera, mic, checking };
}
