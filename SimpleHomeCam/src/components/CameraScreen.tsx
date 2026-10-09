import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

import { loadCameraSettings } from '@/utils/cameraSettings';

const { width } = Dimensions.get('window');
const VIDEO_HEIGHT = (width * 9) / 16; 

export function CameraStream() {
  const [cameraFlvUrl, setCameraFlvUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
    let mounted = true;

    loadCameraSettings()
        .then(async (settings) => {
        if (!mounted) return;
        if (!settings) {
            setError('Add a camera before viewing its stream.');
            return;
        }

        const protocol = settings.https ? 'https' : 'http';
        
        try {
            const loginUrl = `${protocol}://${settings.host}/cgi-bin/api.cgi?cmd=Login`;
            const loginPayload = [
            {
                cmd: "Login",
                param: {
                User: {
                    userName: settings.username,
                    password: settings.password,
                },
                },
            },
            ];

            const response = await fetch(loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginPayload),
            });

            const json = await response.json();
            const token = json[0]?.value?.Token?.name;

            if (!token) {
            setError('Authentifizierung am Hub fehlgeschlagen (Kein Token erhalten).');
            return;
            }

            const params = new URLSearchParams({
            token: token,                         
            port: '1935',
            app: 'bcs',                           
            stream: `channel${settings.channel}_sub.bcs`,
            });

            if (mounted) {
            setCameraFlvUrl(`${protocol}://${settings.host}/flv?${params.toString()}`);
            }

        } catch (err) {
            if (mounted) {
            setError('Connection failed');
            }
        }
        })
        .catch(() => {
        if (mounted) {
            setError('Unable to load the saved camera settings.');
        }
        });

    return () => { mounted = false; };
    }, []);



  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }

  if (!cameraFlvUrl) {
    return <ActivityIndicator style={styles.loader} />;
  }

  const encodedUrl = JSON.stringify(cameraFlvUrl);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <style>
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; background-color: black; overflow: hidden; }
        video { width: 100%; height: 100%; object-fit: contain; }
      </style>
      <script src="https://cdn.jsdelivr.net/npm/mpegts.js@1.8.0/dist/mpegts.min.js"></script>
    </head>
    <body>

      <!-- Wichtig: KEIN 'muted' Tag, damit Audio abgespielt wird! -->
      <video id="videoElement" autoplay playsinline></video>

      <script>
        document.addEventListener("DOMContentLoaded", function() {
          var streamUrl = ${encodedUrl};
          if (window.mpegts && mpegts.getFeatureList().mseLivePlayback) {
            var videoElement = document.getElementById('videoElement');
            var player = mpegts.createPlayer({
              type: 'flv',
              url: streamUrl,
              isLive: true,
              hasAudio: true
            }, {
              enableStashBuffer: false,
              liveBufferLatencyChasing: true,
              maxLiveSyncPlaybackRate: 1.5
            });
            player.attachMediaElement(videoElement);
            player.load();

            player.play().catch(function(error) {
              document.body.addEventListener('click', function() {
                player.play();
              }, { once: true });
            });
          } else {
            window.ReactNativeWebView.postMessage('This device does not support live MSE playback.');
          }
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <View style={[styles.videoContainer, { height: VIDEO_HEIGHT }]}>
        <WebView
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          style={styles.webview}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false} 
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode='always' 
          onMessage={(event) => setError(event.nativeEvent.data)}
          onError={() => setError('The camera stream could not be loaded.')}
        />
      </View>
    </View>
  );
}

export default CameraStream;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', justifyContent: 'center' },
  videoContainer: { width: '100%', backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  loader: { height: VIDEO_HEIGHT },
  error: { padding: 16, color: '#c0392b' },
});
