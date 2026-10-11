import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import WebView, { type WebViewProps } from 'react-native-webview';

import { loadCameraSettings } from '@/utils/cameraSettings';
import streamHtml from '@/assets/stream-webview.html';

const { width } = Dimensions.get('window');
const VIDEO_HEIGHT = (width * 9) / 16; 

const TypedWebView = WebView as unknown as React.ComponentType<
  WebViewProps & React.RefAttributes<WebView>
>;

export function CameraStream() {
  const [error, setError] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string>('Warte auf Initialisierung...');
  const [cameraFlvUrl, setCameraFlvUrl] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    let mounted = true;
    let activeToken: string | null = null;
    let cameraHost: string | null = null;
    let isHttps = false;

    const startSessionAndStream = async () => {
      try {
        setDebugLog('Load camera settings...');
        const settings = await loadCameraSettings();
        if (!mounted) return;

        if (!settings) {
          setError('Please add a camera in the settings first.');
          return;
        }

        cameraHost = settings.host;
        isHttps = settings.https;
        const protocol = isHttps ? 'https' : 'http';

        setDebugLog(`Verbinde mit Hub: ${protocol}://${cameraHost} ...`);

        const loginUrl = `${protocol}://${cameraHost}/cgi-bin/api.cgi?cmd=Login`;
        const loginPayload = [{
          cmd: "Login",
          param: { User: { userName: settings.username, password: settings.password } }
        }];

        const response = await fetch(loginUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginPayload),
        });

        const json = await response.json();
        const token = json?.[0]?.value?.Token?.name || json?.value?.Token?.name;

        if (!token) {
          setDebugLog('Login fehlgeschlagen: Kein Token vom Hub erhalten. Passwort falsch?');
          setError('Authentifizierung am Reolink Hub fehlgeschlagen.');
          return;
        }

        activeToken = token;
        setDebugLog('Login erfolgreich! Token generiert. Baue Stream auf...');

        const params = new URLSearchParams({
          token: token,
          port: '1935',
          app: 'bcs',
          stream: `channel${settings.channel}_sub.bcs`,
        });

        const streamUrl = `${protocol}://${cameraHost}/flv?${params.toString()}`;
        setDebugLog(`Stream-URL bereitgestellt. URL: ${streamUrl}`);
        
        if (mounted) {
          setCameraFlvUrl(streamUrl);
        }

      } catch (err: any) {
        if (mounted) {
          setDebugLog(`Netzwerkfehler beim CGI-Login: ${err?.message || err}`);
          setError('Verbindung zum Reolink Hub fehlgeschlagen.');
        }
      }
    };

    startSessionAndStream();

    return () => {
      mounted = false;
      if (activeToken && cameraHost) {
        const protocol = isHttps ? 'https' : 'http';
        fetch(`${protocol}://${cameraHost}/cgi-bin/api.cgi?cmd=Logout&token=${activeToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([{ cmd: "Logout", param: {} }]),
        }).catch(() => {});
      }
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

  if (!cameraFlvUrl) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#208AEF" />
        <Text style={styles.debugText}>{debugLog}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.videoContainer, { height: VIDEO_HEIGHT }]}>
        <TypedWebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={streamHtml as any}
          style={styles.webview}
          allowsInlineMediaPlayback={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="always"
          allowFileAccess={true}
          onLoadEnd={() => {
            if (cameraFlvUrl && webViewRef.current) {
              webViewRef.current.postMessage(cameraFlvUrl);
            }
          }}
          onReceivedSslError={(event) => {
            console.warn('SSL-Error in WebView:', event.nativeEvent.description);
            if (event.preventDefault) {
              event.preventDefault(); 
            }
          }}
          onMessage={(event) => {
            const msg = event.nativeEvent.data;
            if (msg.startsWith('WEBVIEW_LOG: ')) {
              setDebugLog(msg.replace('WEBVIEW_LOG: ', ''));
            } else {
              setError(msg);
            }
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            setDebugLog(`WebView-Core-Fehler: ${nativeEvent.description}`);
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
  container: { flex: 1, backgroundColor: '#111', justifyContent: 'center' },
  videoContainer: { width: '100%', backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  liveDebugLabel: { color: '#888', fontSize: 12, paddingHorizontal: 16, marginTop: 20, fontWeight: 'bold' },
  debugTerminal: { padding: 12, color: '#f1c40f', backgroundColor: '#000', margin: 16, borderRadius: 6, fontSize: 11, fontFamily: 'monospace' },
  error: { padding: 16, color: '#c0392b', textAlign: 'center', fontWeight: 'bold' },
  debugText: { color: '#aaa', fontSize: 12, textAlign: 'center', paddingHorizontal: 20 },
});