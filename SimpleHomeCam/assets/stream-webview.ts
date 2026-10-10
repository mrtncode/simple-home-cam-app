export const streamHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; background-color: black; color: white; overflow: hidden; font-family: sans-serif; }
    video { width: 100%; height: 100%; object-fit: contain; }
    #log { position: absolute; top: 10px; left: 10px; color: #f1c40f; font-size: 11px; z-index: 999; pointer-events: none; background: rgba(0,0,0,0.6); padding: 5px; }
  </style>
  /* <script src="https://cdn.jsdelivr.net/npm/mpegts.js@1.8.0/dist/mpegts.min.js" crossorigin="anonymous"></script> */
</head>
<body>
  <div id="log">Browser-Status: Starte Engine...</div>
  <video id="videoElement" autoplay playsinline></video>

  <script>
    function log(msg) {
      document.getElementById('log').innerText = "Browser-Status: " + msg;
      window.ReactNativeWebView.postMessage("WEBVIEW_LOG: " + msg);
    }

    window.onerror = function(message, source, lineno, colno, error) {
      log("JS-Fehler: " + message);
    };

    window.addEventListener('message', function(event) {
      initPlayer(event.data);
    });
    document.addEventListener('message', function(event) {
      initPlayer(event.data);
    });

    function initPlayer(streamUrl) {
      if (!streamUrl || typeof streamUrl !== 'string') return;
      log("Lade Stream von: " + streamUrl);

      if (typeof mpegts === 'undefined' || !mpegts.getFeatureList) {
        log("Fehler: mpegts-Bibliothek fehlt!");
        return;
      }

      if (mpegts.getFeatureList().mseLivePlayback) {
        var videoElement = document.getElementById('videoElement');
        
        var player = mpegts.createPlayer({
          type: 'flv',
          url: streamUrl,
          isLive: true,
          hasAudio: true
        }, {
          enableStashBuffer: false,
          liveBufferLatencyChasing: true
        });

        player.on(mpegts.Events.ERROR, function(type, detail, info) {
          log("Player-Fehler: " + type + " | Detail: " + detail);
        });

        player.attachMediaElement(videoElement);
        player.load();
        
        player.play().catch(function(e) {
          log("Autoplay blockiert. Tippen zum Starten...");
          document.body.addEventListener('click', function() {
            player.play();
          }, { once: true });
        });
      } else {
        log("Dieses Gerät unterstützt kein MSE Live Playback.");
      }
    }
  </script>
</body>
</html>
`;