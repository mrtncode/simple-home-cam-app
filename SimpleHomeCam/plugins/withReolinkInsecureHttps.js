const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('@expo/config-plugins');

const marker = 'configureReolinkHttps';

function withReolinkInsecureHttps(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const packageName = config.android.package;

      if (!packageName) {
        throw new Error(
          'withReolinkInsecureHttps requires expo.android.package.',
        );
      }

      const applicationFile = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'java',
        ...packageName.split('.'),
        'MainApplication.kt',
      );
      const source = await fs.promises.readFile(
        applicationFile,
        'utf8',
      );

      if (source.includes(marker)) {
        return config;
      }

      const updatedSource = source
        .replace(
          'import android.content.res.Configuration\n',
          `import android.content.res.Configuration
import java.security.SecureRandom
import java.security.cert.X509Certificate
import javax.net.ssl.HostnameVerifier
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManager
import javax.net.ssl.X509TrustManager
`,
        )
        .replace(
          'import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint\n',
          `import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.modules.network.OkHttpClientProvider
`,
        )
        .replace(
          '    super.onCreate()\n',
          `    super.onCreate()
    ${marker}()
`,
        )
        .replace(
          '  override fun onConfigurationChanged(newConfig: Configuration) {',
          `  private fun ${marker}() {
    val trustAllCertificates = arrayOf<TrustManager>(
      object : X509TrustManager {
        override fun checkClientTrusted(chain: Array<out X509Certificate>, authType: String) = Unit
        override fun checkServerTrusted(chain: Array<out X509Certificate>, authType: String) = Unit
        override fun getAcceptedIssuers(): Array<X509Certificate> = emptyArray()
      },
    )

    val sslContext = SSLContext.getInstance("TLS").apply {
      init(null, trustAllCertificates, SecureRandom())
    }
    val trustManager = trustAllCertificates[0] as X509TrustManager

    // Nutzt die RN-Defaults und überschreibt NUR die SSL-Logik
    OkHttpClientProvider.setOkHttpClientFactory {
      OkHttpClientProvider.createClientBuilder()
        .sslSocketFactory(sslContext.socketFactory, trustManager)
        .hostnameVerifier(HostnameVerifier { _, _ -> true })
        .build()
    }
  }

  override fun onConfigurationChanged(newConfig: Configuration) {`,
        );

      await fs.promises.writeFile(applicationFile, updatedSource);
      return config;
    },
  ]);
}

module.exports = withReolinkInsecureHttps;
