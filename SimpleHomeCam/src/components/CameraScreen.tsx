import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { VLCPlayer } from 'react-native-vlc-media-player';

import { loadCameraSettings } from '@/utils/cameraSettings';

export function CameraStream() {
  const [cameraRtspUrl, setCameraRtspUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string>('Warte auf Initialisierung...');

  useEffect(() => {
    let mounted = true;

    const prepareStream = async () => {
      try {
        setDebugLog('Lade Kameraeinstellungen...');
        const settings = await loadCameraSettings();
        if (!mounted) return;

        if (!settings) {
          setError('Please add a camera in the settings first!');
          return;
        }

        const channel = String(settings.channel + 1).padStart(2, '0');
        const username = encodeURIComponent(settings.username);
        const password = encodeURIComponent(settings.password);
        const streamUrl = `rtsp://${username}:${password}@${settings.host}:554/Preview_${channel}_sub`;
        setDebugLog(`RTSP-Stream bereit: Kanal ${channel} ...`);
        
        if (mounted) {
          setCameraRtspUrl(streamUrl);
        }

      } catch (err: unknown) {
        if (mounted) {
          const message = err instanceof Error ? err.message : String(err);
          setDebugLog(`Fehler beim Laden der Kameraeinstellungen: ${message}`);
          setError('Kameraeinstellungen konnten nicht geladen werden.');
        }
      }
    };

    prepareStream();

    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
        <Text style={styles.debugText}>Letzter Status: {debugLog}</Text>
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
          onLoad={() => setDebugLog('RTSP-Stream geladen.')}
          onPlaying={() => setDebugLog('Stream läuft.')}
          onBuffering={() => setDebugLog('Stream puffert...')}
          onError={() => {
            setDebugLog('VLC konnte den RTSP-Stream nicht öffnen.');
            setError('RTSP-Stream konnte nicht gestartet werden.');
          }}
        />
      </View>
      <Text style={styles.liveDebugLabel}>Echtzeit-Debugging:</Text>
      <Text style={styles.debugTerminal}>{debugLog}</Text>
    </View>
  );
}

export default CameraStream;

const styles = StyleSheet.create({
  container: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#111', justifyContent: 'center' },
  videoContainer: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  player: { flex: 1 },
  liveDebugLabel: { color: '#888', fontSize: 12, paddingHorizontal: 16, marginTop: 20, fontWeight: 'bold' },
  debugTerminal: { padding: 12, color: '#f1c40f', backgroundColor: '#000', margin: 16, borderRadius: 6, fontSize: 11, fontFamily: 'monospace' },
  error: { padding: 16, color: '#c0392b', textAlign: 'center', fontWeight: 'bold' },
  debugText: { color: '#aaa', fontSize: 12, textAlign: 'center', paddingHorizontal: 20 },
});
