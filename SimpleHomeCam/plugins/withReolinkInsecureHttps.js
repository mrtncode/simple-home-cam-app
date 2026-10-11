const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('@expo/config-plugins');

const APPLICATION_MARKER = 'configureReolinkHttps';
const WEBVIEW_MARKER = 'REOLINK_LOCAL_SSL_BYPASS';
const FILE_ACCESS_MARKER = 'REOLINK_LOCAL_FILE_ACCESS';
const MIXED_CONTENT_MARKER = 'REOLINK_LOCAL_MIXED_CONTENT';

function patchMainApplication(source) {
  if (source.includes(APPLICATION_MARKER)) {
    return source;
  }

  const configurationImport = 'import android.content.res.Configuration\n';
  const reactImport =
    'import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint\n';

  if (!source.includes(configurationImport)) {
    throw new Error(
      'Could not find Configuration import in MainApplication.kt'
    );
  }

  if (!source.includes(reactImport)) {
    throw new Error(
      'Could not find DefaultNewArchitectureEntryPoint import in MainApplication.kt'
    );
  }

  const imports = [
    'import java.security.SecureRandom',
    'import java.security.cert.X509Certificate',
    'import javax.net.ssl.HostnameVerifier',
    'import javax.net.ssl.SSLContext',
    'import javax.net.ssl.TrustManager',
    'import javax.net.ssl.X509TrustManager',
    'import com.facebook.react.modules.network.OkHttpClientProvider',
  ];

  let updated = source;

  for (const importLine of imports) {
    if (!updated.includes(importLine)) {
      updated = updated.replace(
        reactImport,
        `${reactImport}\n${importLine}`
      );
    }
  }

  const onCreateAnchor = 'super.onCreate()';

  if (!updated.includes(onCreateAnchor)) {
    throw new Error('Could not find super.onCreate() in MainApplication.kt');
  }

  updated = updated.replace(
    onCreateAnchor,
    `${onCreateAnchor}\n    ${APPLICATION_MARKER}()`
  );

  const methodAnchor = 'override fun onConfigurationChanged';

  if (!updated.includes(methodAnchor)) {
    throw new Error(
      'Could not find onConfigurationChanged() in MainApplication.kt'
    );
  }

  const method = `
  private fun ${APPLICATION_MARKER}() {
    val trustAllCerts = arrayOf<TrustManager>(
      object : X509TrustManager {
        override fun checkClientTrusted(
          chain: Array<X509Certificate>,
          authType: String
        ) {}

        override fun checkServerTrusted(
          chain: Array<X509Certificate>,
          authType: String
        ) {}

        override fun getAcceptedIssuers(): Array<X509Certificate> = emptyArray()
      }
    )

    val sslContext = SSLContext.getInstance("TLS")
    sslContext.init(null, trustAllCerts, SecureRandom())

    OkHttpClientProvider.setOkHttpClientFactory {
      OkHttpClientProvider.createClientBuilder()
        .sslSocketFactory(
          sslContext.socketFactory,
          trustAllCerts[0] as X509TrustManager
        )
        .hostnameVerifier(HostnameVerifier { _, _ -> true })
        .build()
    }
  }

`;

  updated = updated.replace(methodAnchor, `${method}${methodAnchor}`);

  return updated;
}

async function patchReolinkWebViewSsl(projectRoot) {
  const packageJson = require.resolve('react-native-webview/package.json', {
    paths: [projectRoot],
  });

  const clientFile = path.join(
    path.dirname(packageJson),
    'android',
    'src',
    'main',
    'java',
    'com',
    'reactnativecommunity',
    'webview',
    'RNCWebViewClient.java'
  );

  let source = await fs.promises.readFile(clientFile, 'utf8');

  // Restore the original anchor when repairing a previous plugin patch.
  if (source.includes(WEBVIEW_MARKER)) {
    source = source.replace(
      new RegExp(
        `// ${WEBVIEW_MARKER}[\\s\\S]*?(?=\\n\\s*int code = error\\.getPrimaryError\\(\\);)`,
        'g'
      ),
      'handler.cancel();\n'
    );
  }

  const methodStart = source.indexOf('onReceivedSslError(');

  if (methodStart === -1) {
    throw new Error('Could not find onReceivedSslError() in RNCWebViewClient.java');
  }

  const cancelIndex = source.indexOf('handler.cancel();', methodStart);

  if (cancelIndex === -1) {
    throw new Error('Could not find handler.cancel() in RNCWebViewClient.java');
  }

  const secureBypassCode = `// ${WEBVIEW_MARKER}
        if (error != null && error.getUrl() != null && error.getUrl().startsWith("https://")) {
            handler.proceed();
        } else {
            handler.cancel();
        }`;

  source =
    source.slice(0, cancelIndex) +
    secureBypassCode +
    source.slice(cancelIndex + 'handler.cancel();'.length);

  await fs.promises.writeFile(clientFile, source, 'utf8');

  const managerFile = path.join(
    path.dirname(packageJson),
    'android',
    'src',
    'main',
    'java',
    'com',
    'reactnativecommunity',
    'webview',
    'RNCWebViewManagerImpl.kt'
  );
  let managerSource = await fs.promises.readFile(managerFile, 'utf8');

  if (!managerSource.includes(FILE_ACCESS_MARKER)) {
    const fileAccessSettings = `        // ${FILE_ACCESS_MARKER}
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.allowFileAccessFromFileURLs = true
        settings.allowUniversalAccessFromFileURLs = true`;
    const settingsAnchor =
      '        settings.allowUniversalAccessFromFileURLs = false';

    if (!managerSource.includes(settingsAnchor)) {
      throw new Error('Could not find WebView file access settings');
    }

    managerSource = managerSource.replace(settingsAnchor, fileAccessSettings);
    await fs.promises.writeFile(managerFile, managerSource, 'utf8');
  }

  if (!managerSource.includes(MIXED_CONTENT_MARKER)) {
    const mixedContentAnchor =
      '        settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW';

    if (!managerSource.includes(mixedContentAnchor)) {
      throw new Error('Could not find WebView mixed-content setting');
    }

    managerSource = managerSource.replace(
      mixedContentAnchor,
      `        // ${MIXED_CONTENT_MARKER}\n        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW`
    );
    await fs.promises.writeFile(managerFile, managerSource, 'utf8');
  }
}

function withReolinkInsecureHttps(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const packageName = config.android.package;

      if (!packageName) {
        throw new Error(
          'Set android.package in app.json or app.config.js before using this plugin.'
        );
      }

      const projectRoot = config.modRequest.projectRoot;

      const applicationFile = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'java',
        ...packageName.split('.'),
        'MainApplication.kt'
      );

      const source = await fs.promises.readFile(applicationFile, 'utf8');
      const updatedSource = patchMainApplication(source);

      if (updatedSource !== source) {
        await fs.promises.writeFile(
          applicationFile,
          updatedSource,
          'utf8'
        );
      }

      await patchReolinkWebViewSsl(projectRoot);

      return config;
    },
  ]);
}

module.exports = withReolinkInsecureHttps;