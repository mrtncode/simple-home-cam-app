import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { Platform } from 'react-native';

export type Language = 'en' | 'de';

const translations = {
  en: {
    'home.title': 'Your cameras', 'home.connected': 'CONNECTED', 'home.settings': 'Settings', 'home.backToCamera': 'Back to camera',
    'home.replace': 'Replace camera', 'home.logout': 'Log out', 'home.noCamera': 'No camera connected',
    'home.empty': 'Add your first Reolink camera to start monitoring your home.', 'home.add': 'Add a camera',
    'home.privacy': 'Your credentials stay on this device.', 'home.logoutTitle': 'Log out',
    'home.logoutConfirm': 'Remove this camera and its saved credentials from this device?',
    'common.cancel': 'Cancel', 'common.on': 'ON', 'common.off': 'OFF', 'home.language': 'Language', 'home.english': 'English', 'home.german': 'Deutsch',
    'home.fontSize': 'Text size', 'home.decreaseFontSize': 'Decrease text size', 'home.increaseFontSize': 'Increase text size', 'home.fontPreview': 'Sample text',
    'setup.eyebrow': 'CAMERA SETUP', 'setup.title': 'Add a camera', 'setup.description': 'Connect directly to your Reolink camera on the local network.',
    'setup.host': 'Camera IP or hostname', 'setup.username': 'Username', 'setup.password': 'Password', 'setup.passwordPlaceholder': 'Camera password',
    'setup.port': 'Port', 'setup.https': 'HTTPS', 'setup.secure': 'Use secure transport', 'setup.connect': 'Connect camera',
    'setup.missing': 'Enter the camera IP, username, and password.', 'setup.invalidPort': 'Port must be a number between 1 and 65535.',
    'error.connection': 'Unable to connect to the camera.', 'error.authTitle': 'Camera connection error',
    'error.auth': 'The camera rejected the login. Check the username and password.', 'error.session': 'The camera session expired. Please try again.',
    'error.timeout': 'The camera did not respond in time.', 'error.network': 'Could not reach the camera. Check the address and network connection.',
    'error.generic': 'Something went wrong. Please try again.', 'error.controlsTitle': 'Camera control error',
    'simple.title': 'Simple View', 'simple.refresh': 'Refresh', 'simple.updating': 'Updating camera…',
    'simple.ptz': 'PTZ Presets', 'simple.noPresets': 'No presets available', 'simple.controls': 'Camera controls',
    'simple.sirenOn': 'Turn siren on', 'simple.sirenOff': 'Turn siren off', 'simple.lightOn': 'Turn light on',
    'simple.lightOff': 'Turn light off', 'simple.lightUnavailable': 'Light status unavailable', 'simple.sensors': 'Sensors',
    'simple.motion': 'Motion', 'simple.person': 'Person', 'simple.unknown': 'Unknown', 'simple.detected': 'Detected',
    'simple.clear': 'Clear', 'simple.sensorNote': 'Sensor readings update when you refresh.', 'simple.missingCamera': 'Add a camera in Settings before using controls.',
    'test.title': 'Camera Test', 'test.subtitle': 'Camera controls and diagnostics', 'test.running': 'Request in progress…',
    'test.reloadPresets': 'Reload presets', 'test.noPresets': 'No presets found.', 'test.goTo': 'Go to {name} (#{id})',
    'test.siren': 'Siren', 'test.light': 'Light', 'test.status': 'Status', 'test.brightness': 'Brightness',
    'test.detection': 'Detection', 'test.refreshDetection': 'Refresh detection', 'test.motionDetected': 'DETECTED',
    'test.none': 'None', 'test.personDetected': 'DETECTED', 'test.everything': 'Everything', 'test.refreshAll': 'Refresh all',
    'test.loadingLight': 'Loading light status…', 'test.addCamera': 'Add a camera before using the controls.',
    'explore.title': 'Explore', 'explore.intro': 'See your live camera view and control your Reolink camera from one place.', 'explore.feature': 'Live view and camera controls in one place.',
    'explore.docs': 'Expo documentation', 'explore.routing': 'File-based routing',
    'explore.routingText': 'This app has two screens: {index} and {explore}.',
    'explore.layoutText': 'The layout file {layout} sets up the tab navigator.', 'explore.learn': 'Learn more',
    'explore.platforms': 'Android, iOS, and web support',
    'explore.platformsText': 'You can open this project on Android, iOS, and the web. To open the web version, press {key} in the terminal running this project.',
    'explore.images': 'Images', 'explore.imagesText': 'For static images, use the {twoX} and {threeX} suffixes to provide files for different screen densities.',
    'explore.theme': 'Light and dark mode components',
    'explore.themeText': 'The {hook} hook lets you inspect the current color scheme so you can adjust the app appearance.',
    'explore.animations': 'Animations', 'explore.animationsText': 'This template uses {component} and {library} for animated collapsible content.',
    'camera.addFirst': 'Please add a camera in Settings.', 'camera.settingsError': 'Could not load camera settings.',
    'camera.streamError': 'Could not start the camera stream.', 'camera.waiting': 'Waiting to initialize…', 'camera.loadingSettings': 'Loading camera settings…',
    'camera.streamReady': 'Stream ready: channel {channel}…', 'camera.streamLoaded': 'Camera stream loaded.',
    'camera.playing': 'Stream is playing.', 'camera.buffering': 'Stream is buffering…', 'camera.debug': 'Live diagnostics',
    'camera.lastStatus': 'Last status: {status}', 'common.docs': 'Docs', 'common.starter': 'Home Cam',
    'hint.edit': 'Try editing',
  },
  de: {
    'home.title': 'Kameras', 'home.connected': 'VERBUNDEN', 'home.settings': 'Einstellungen', 'home.backToCamera': 'Zurück zur Kamera',
    'home.replace': 'Kamera ersetzen', 'home.logout': 'Abmelden', 'home.noCamera': 'Keine Kamera verbunden',
    'home.empty': 'Füge deine erste Reolink-Kamera hinzu, um dein Zuhause im Blick zu behalten.', 'home.add': 'Kamera hinzufügen',
    'home.privacy': 'Deine Zugangsdaten bleiben auf diesem Gerät.', 'home.logoutTitle': 'Abmelden',
    'home.logoutConfirm': 'Diese Kamera und ihre gespeicherten Zugangsdaten von diesem Gerät entfernen?',
    'common.cancel': 'Abbrechen', 'common.on': 'AN', 'common.off': 'AUS', 'home.language': 'Sprache', 'home.english': 'English', 'home.german': 'Deutsch',
    'home.fontSize': 'Textgröße', 'home.decreaseFontSize': 'Text verkleinern', 'home.increaseFontSize': 'Text vergrößern', 'home.fontPreview': 'Beispieltext',
    'setup.eyebrow': 'KAMERAEINRICHTUNG', 'setup.title': 'Kamera hinzufügen', 'setup.description': 'Verbinde dich direkt über das lokale Netzwerk mit deiner Reolink-Kamera.',
    'setup.host': 'Kamera-IP-Adresse oder Hostname', 'setup.username': 'Benutzername', 'setup.password': 'Passwort', 'setup.passwordPlaceholder': 'Kamera-Passwort',
    'setup.port': 'Port', 'setup.https': 'HTTPS', 'setup.secure': 'Sichere Verbindung verwenden', 'setup.connect': 'Kamera verbinden',
    'setup.missing': 'Gib die Kamera-IP-Adresse, den Benutzernamen und das Passwort ein.', 'setup.invalidPort': 'Der Port muss eine Zahl zwischen 1 und 65535 sein.',
    'error.connection': 'Verbindung zur Kamera nicht möglich.', 'error.authTitle': 'Kameraverbindungsfehler',
    'error.auth': 'Die Kamera hat die Anmeldung abgelehnt. Prüfe Benutzername und Passwort.', 'error.session': 'Die Kamerasitzung ist abgelaufen. Bitte versuche es erneut.',
    'error.timeout': 'Die Kamera hat nicht rechtzeitig geantwortet.', 'error.network': 'Kamera nicht erreichbar. Prüfe Adresse und Netzwerkverbindung.',
    'error.generic': 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.', 'error.controlsTitle': 'Kamerasteuerungsfehler',
    'simple.title': 'Kamera Ansicht', 'simple.refresh': 'Aktualisieren', 'simple.updating': 'Kamera wird aktualisiert…',
    'simple.ptz': 'Positionen', 'simple.noPresets': 'Keine Positionen verfügbar', 'simple.controls': 'Kamerasteuerung',
    'simple.sirenOn': 'Sirene einschalten', 'simple.sirenOff': 'Sirene ausschalten', 'simple.lightOn': 'Licht einschalten',
    'simple.lightOff': 'Licht ausschalten', 'simple.lightUnavailable': 'Lichtstatus nicht verfügbar', 'simple.sensors': 'Sensoren',
    'simple.motion': 'Bewegung', 'simple.person': 'Person', 'simple.unknown': 'Unbekannt', 'simple.detected': 'Erkannt',
    'simple.clear': 'Keine Erkennung', 'simple.sensorNote': 'Die Sensorwerte werden beim Aktualisieren abgerufen.', 'simple.missingCamera': 'Füge unter Einstellungen eine Kamera hinzu, um die Steuerung zu verwenden.',
    'test.title': 'Kameratest', 'test.subtitle': 'Kamerasteuerung und Diagnose', 'test.running': 'Anfrage läuft…',
    'test.reloadPresets': 'Positionen neu laden', 'test.noPresets': 'Keine Positionen gefunden.', 'test.goTo': 'Zu {name} wechseln (#{id})',
    'test.siren': 'Sirene', 'test.light': 'Licht', 'test.status': 'Status', 'test.brightness': 'Helligkeit',
    'test.detection': 'Erkennung', 'test.refreshDetection': 'Erkennung aktualisieren', 'test.motionDetected': 'ERKANNT',
    'test.none': 'Keine', 'test.personDetected': 'ERKANNT', 'test.everything': 'Alles', 'test.refreshAll': 'Alles aktualisieren',
    'test.loadingLight': 'Lichtstatus wird geladen…', 'test.addCamera': 'Füge eine Kamera hinzu, bevor du die Steuerung verwendest.',
    'explore.title': 'Entdecken', 'explore.intro': 'Behalte dein Zuhause live im Blick und steuere deine Reolink-Kamera an einem Ort.', 'explore.feature': 'Livebild und Kamerasteuerung an einem Ort.',
    'explore.docs': 'Expo-Dokumentation', 'explore.routing': 'Dateibasiertes Routing',
    'explore.routingText': 'Diese App hat zwei Bildschirme: {index} und {explore}.',
    'explore.layoutText': 'Die Layout-Datei {layout} richtet die Tab-Navigation ein.', 'explore.learn': 'Mehr erfahren',
    'explore.platforms': 'Unterstützung für Android, iOS und Web',
    'explore.platformsText': 'Du kannst dieses Projekt unter Android, iOS und im Web öffnen. Für die Webversion drücke {key} im Terminal, in dem das Projekt läuft.',
    'explore.images': 'Bilder', 'explore.imagesText': 'Verwende für statische Bilder die Endungen {twoX} und {threeX}, um Dateien für verschiedene Pixeldichten bereitzustellen.',
    'explore.theme': 'Komponenten für helles und dunkles Design',
    'explore.themeText': 'Mit dem Hook {hook} kannst du das aktuelle Farbschema erkennen und das Erscheinungsbild der App anpassen.',
    'explore.animations': 'Animationen', 'explore.animationsText': 'Diese Vorlage verwendet {component} und {library} für animierte, aufklappbare Inhalte.',
    'camera.addFirst': 'Bitte füge unter Einstellungen eine Kamera hinzu.', 'camera.settingsError': 'Kameraeinstellungen konnten nicht geladen werden.',
    'camera.streamError': 'Der Kamerastream konnte nicht gestartet werden.', 'camera.waiting': 'Initialisierung läuft…', 'camera.loadingSettings': 'Kameraeinstellungen werden geladen…',
    'camera.streamReady': 'Stream bereit: Kanal {channel}…', 'camera.streamLoaded': 'Kamerastream geladen.',
    'camera.playing': 'Stream wird wiedergegeben.', 'camera.buffering': 'Stream wird gepuffert…', 'camera.debug': 'Live-Diagnose',
    'camera.lastStatus': 'Letzter Status: {status}', 'common.docs': 'Dokumentation', 'common.starter': 'Home Cam',
    'hint.edit': 'Zum Bearbeiten öffnen',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
type Translate = (key: TranslationKey, values?: Record<string, string | number>) => string;
type I18nContextValue = { language: Language; setLanguage: (language: Language) => void; t: Translate };

const LANGUAGE_KEY = 'simple-home-cam.language';
const I18nContext = createContext<I18nContextValue>({ language: 'en', setLanguage: () => undefined, t: (key) => translations.en[key] });

function deviceLanguage(): Language {
  try {
    return /^de(?:-|$)/i.test(Intl.DateTimeFormat().resolvedOptions().locale) ? 'de' : 'en';
  } catch {
    return 'en';
  }
}

async function readSavedLanguage(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(LANGUAGE_KEY);
  }
  return SecureStore.getItemAsync(LANGUAGE_KEY);
}

async function saveLanguage(language: Language): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.setItem(LANGUAGE_KEY, language);
    return;
  }
  await SecureStore.setItemAsync(LANGUAGE_KEY, language);
}

export function I18nProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<Language>(deviceLanguage);

  useEffect(() => {
    void readSavedLanguage().then((saved) => {
      if (saved === 'de' || saved === 'en') setLanguageState(saved);
    }).catch(() => undefined);
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    void saveLanguage(next).catch(() => undefined);
  }, []);

  const value = useMemo<I18nContextValue>(() => ({
    language,
    setLanguage,
    t: (key, values) => {
      let message: string = translations[language][key];
      if (values) message = message.replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? `{${name}}`));
      return message;
    },
  }), [language, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

export function localizedError(error: unknown, t: Translate): string {
  if (error instanceof Error && /add a camera|kamera hinzu/i.test(error.message)) return t('simple.missingCamera');
  if (error instanceof Error && error.name === 'ReolinkAuthenticationError') return t('error.auth');
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? Number((error as { code?: unknown }).code)
    : undefined;
  if (code === -7 || code === -46 || code === -502) return t('error.auth');
  if (code === -6 || code === -21 || code === 401 || code === 403) return t('error.session');
  if (code === -8 || (error instanceof Error && error.name === 'ReolinkTimeoutError')) return t('error.timeout');
  if (error instanceof TypeError) return t('error.network');
  return t('error.generic');
}
