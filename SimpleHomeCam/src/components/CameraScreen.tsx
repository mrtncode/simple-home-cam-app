import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { VLCPlayer } from 'react-native-vlc-media-player';

import { loadCameraSettings } from '@/utils/cameraSettings';
import { useI18n } from '@/utils/i18n';
import { ScaledText as Text } from '@/utils/font-size';

export function CameraStream() {
  const { t } = useI18n();
  const [cameraRtspUrl, setCameraRtspUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streamLoading, setStreamLoading] = useState(true);
  const hasStartedRef = useRef(false);
  const [debugLog, setDebugLog] = useState<string>(t('camera.waiting'));

  useEffect(() => {
    let mounted = true;

    const prepareStream = async () => {
      try {
        hasStartedRef.current = false;
        setStreamLoading(true);
        setDebugLog(t('camera.loadingSettings'));
        const settings = await loadCameraSettings();
        if (!mounted) return;

        if (!settings) {
          setError(t('camera.addFirst'));
          return;
        }

        const channel = String(settings.channel + 1).padStart(2, '0');
        const username = encodeURIComponent(settings.username);
        const password = encodeURIComponent(settings.password);
        const streamUrl = `rtsp://${username}:${password}@${settings.host}:554/Preview_${channel}_sub`;
        setDebugLog(t('camera.streamReady', { channel }));
        
        if (mounted) {
          setCameraRtspUrl(streamUrl);
        }

      } catch {
        if (mounted) {
          setDebugLog(t('camera.settingsError'));
          setError(t('camera.settingsError'));
        }
      }
    };

    prepareStream();

    return () => {
      mounted = false;
    };
  }, [t]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
        <Text style={styles.debugText}>{t('camera.lastStatus', { status: debugLog })}</Text>
      </View>
    );
  }

  if (!cameraRtspUrl) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#208AEF" />
        <Text style={styles.debugText}>{debugLog}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        <VLCPlayer
          style={styles.player}
          source={{
            uri: cameraRtspUrl,
            initOptions: ['--network-caching=150', '--rtsp-tcp'],
          }}
          autoplay
          volume={100}
          onLoad={() => setDebugLog(t('camera.streamLoaded'))}
          onPlaying={() => {
            hasStartedRef.current = true;
            setDebugLog(t('camera.playing'));
            setStreamLoading(false);
          }}
          onBuffering={() => {
            setDebugLog(t('camera.buffering'));
            if (!hasStartedRef.current) setStreamLoading(true);
          }}
          onError={() => {
            setStreamLoading(false);
            setDebugLog(t('camera.streamError'));
            setError(t('camera.streamError'));
          }}
        />
        {streamLoading && <View style={styles.loadingOverlay} pointerEvents="none"><ActivityIndicator size="large" color="#fff" /></View>}
      </View>
    </View>
  );
}

export default CameraStream;

const styles = StyleSheet.create({
  container: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#111', justifyContent: 'center' },
  videoContainer: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  player: { flex: 1 },
  loadingOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0006' },
  error: { padding: 16, color: '#c0392b', textAlign: 'center', fontWeight: 'bold' },
  debugText: { color: '#aaa', fontSize: 12, textAlign: 'center', paddingHorizontal: 20 },
});
