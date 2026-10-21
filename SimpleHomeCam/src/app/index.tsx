import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { router } from 'expo-router';

import { CameraStream } from '@/components/CameraScreen';
import { DetectionState, LightState, PtzPreset, ReolinkClient } from '@/utils/reolink';
import { getCameraClient, loadCameraSettings } from '@/utils/cameraSettings';
import { localizedError, useI18n } from '@/utils/i18n';
import { ScaledText as Text } from '@/utils/font-size';

const colors = {
  canvas: '#ffffff',
  card: '#eeeeed3e',
  ink: '#20241f',
  muted: '#77796f',
  accent: '#002c9c',
  line: '#e5e0d6',
  good: '#337a51',
};

export default function SimpleViewScreen() {
  const { width } = useWindowDimensions();
  const { t } = useI18n();
  const wide = width >= 900;
  const [presets, setPresets] = useState<PtzPreset[]>([]);
  const [light, setLight] = useState<LightState | null>(null);
  const [detection, setDetection] = useState<DetectionState | null>(null);
  const [sirenEnabled, setSirenEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [streamReloadKey, setStreamReloadKey] = useState(0);

  const getClient = useCallback(async () => {
    const client = await getCameraClient();
    if (!client) throw new Error(t('simple.missingCamera'));
    return client;
  }, []);

  const perform = useCallback(async (action: (client: ReolinkClient) => Promise<void>) => {
    try {
      setLoading(true);
      const client = await getClient();
      await action(client);
    } catch (error) {
      Alert.alert(t('error.controlsTitle'), localizedError(error, t));
    } finally {
      setLoading(false);
    }
  }, [getClient]);

  const refresh = useCallback(() => perform(async (client) => {
    const [nextPresets, nextLight, nextDetection] = await Promise.all([
      client.ptz.getPresets(), client.light.get(), client.detection.getState(),
    ]);
    setPresets(nextPresets);
    setLight(nextLight);
    setDetection(nextDetection);
  }), [perform]);

  const refreshCamera = () => {
    setStreamReloadKey((key) => key + 1);
    void refresh();
  };

  useEffect(() => {
    void loadCameraSettings().then((settings) => {
      if (settings) void refresh();
    });
  }, [refresh]);

  const toggleLight = () => {
    if (!light) return;
    void perform(async (client) => {
      const enabled = !light.enabled;
      await client.light.set({ enabled, brightness: light.brightness });
      setLight({ ...light, enabled });
    });
  };

  const toggleSiren = () => perform(async (client) => {
    const enabled = !sirenEnabled;
    await client.siren.set(enabled);
    setSirenEnabled(enabled);
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('simple.title')}</Text>
        </View>
        <View style={styles.headerActions}>
        <Pressable onPress={() => router.push('/settings')} style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={t('home.settings')}>
          <SymbolView name={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }} tintColor={colors.ink} size={21} />
        </Pressable>
        <Pressable onPress={refreshCamera} style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]} accessibilityRole="button">
          <SymbolView name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }} tintColor="#fff" size={18} />
          <Text style={styles.refreshText}>{t('simple.refresh')}</Text>
        </Pressable>
        </View>
      </View>

      <View style={[styles.content, wide && styles.wideContent]}>
        <View style={[styles.cameraCard, wide && styles.wideCamera]}>
          <CameraStream key={streamReloadKey} />
        </View>
        <ScrollView style={[styles.controlsScroll, wide && styles.wideControls]} contentContainerStyle={styles.controls} showsVerticalScrollIndicator={false}>
          {loading && <View style={styles.loading}><ActivityIndicator color={colors.accent} /><Text style={styles.muted}>{t('simple.updating')}</Text></View>}

          <Panel title={t('simple.ptz')}>
            {presets.length ? presets.map((preset) => (
              <ActionButton key={preset.id} title={preset.name} icon={{ ios: 'mappin.and.ellipse', android: 'bookmark', web: 'bookmark' }} onPress={() => void perform((client) => client.ptz.gotoPreset(preset.id))} />
            )) : <Text style={styles.muted}>{t('simple.noPresets')}</Text>}
          </Panel>

          <Panel title={t('simple.controls')}>
            <ActionButton title={sirenEnabled ? t('simple.sirenOff') : t('simple.sirenOn')} icon={{ ios: 'speaker.wave.3.fill', android: 'notifications_active', web: 'notifications_active' }} detail={sirenEnabled ? t('common.on') : t('common.off')} onPress={() => void toggleSiren()} />
            <ActionButton title={light ? (light.enabled ? t('simple.lightOff') : t('simple.lightOn')) : t('simple.lightUnavailable')} icon={{ ios: 'lightbulb.fill', android: 'lightbulb', web: 'lightbulb' }} detail={light ? (light.enabled ? t('common.on') : t('common.off')) : '—'} onPress={toggleLight} disabled={!light} />
          </Panel>

          <Panel title={t('simple.sensors')}>
            <Sensor label={t('simple.motion')} active={detection?.motion} />
            <Sensor label={t('simple.person')} active={detection?.person} />
          </Panel>
          <Text style={styles.note}>{t('simple.sensorNote')}</Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.panel}><Text style={styles.panelTitle}>{title}</Text><View style={styles.panelContent}>{children}</View></View>;
}

function ActionButton({ title, detail, icon, onPress, disabled }: { title: string; detail?: string; icon: SymbolViewProps['name']; onPress: () => void; disabled?: boolean }) {
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed, disabled && styles.disabled]}>
    <View style={styles.actionLabel}><SymbolView name={icon} tintColor={colors.accent} size={19} /><Text style={styles.actionText}>{title}</Text></View>{detail && <Text style={styles.actionDetail}>{detail}</Text>}
  </Pressable>;
}

function Sensor({ label, active }: { label: string; active?: boolean }) {
  const { t } = useI18n();
  return <View style={styles.sensorRow}><Text style={styles.sensorLabel}>{label}</Text><Text style={[styles.sensorState, active && styles.sensorActive]}>{active === undefined ? t('simple.unknown') : active ? t('simple.detected') : t('simple.clear')}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  header: { paddingHorizontal: 14, paddingTop: 2, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingsButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#eeeeed' },
  kicker: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  title: { color: colors.ink, fontSize: 20, fontWeight: '800', marginTop: 0 },
  refreshButton: { minHeight: 36, minWidth: 88, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 10, borderRadius: 11, backgroundColor: colors.ink },
  refreshText: { color: '#fffefa', fontSize: 12, fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 16, paddingBottom: 12 },
  wideContent: { flexDirection: 'row', gap: 18, paddingHorizontal: 24 },
  cameraCard: { width: '100%', alignSelf: 'center', overflow: 'hidden', borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, backgroundColor: '#000' },
  wideCamera: { flex: 1, alignSelf: 'center', maxWidth: 1500 },
  controlsScroll: { flex: 1 },
  wideControls: { flexGrow: 0, width: 330, flex: 0 },
  controls: { gap: 12, paddingTop: 14, paddingBottom: 20 },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  muted: { color: colors.muted, fontSize: 14 },
  panel: { padding: 16, borderRadius: 17, borderColor: colors.line, borderWidth: 1, backgroundColor: colors.card },
  panelTitle: { color: colors.ink, fontSize: 17, fontWeight: '800', marginBottom: 12 },
  panelContent: { gap: 9 },
  actionButton: { minHeight: 60, paddingHorizontal: 17, borderRadius: 14, backgroundColor: '#efeff0b4', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionLabel: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  actionText: { flexShrink: 1, color: colors.ink, fontSize: 16, fontWeight: '700' },
  actionDetail: { color: colors.accent, fontSize: 14, fontWeight: '800', marginLeft: 8 },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.55 },
  sensorRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sensorLabel: { color: colors.ink, fontSize: 14, fontWeight: '600' },
  sensorState: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  sensorActive: { color: colors.good },
  note: { color: colors.muted, fontSize: 12, textAlign: 'center', paddingBottom: 6 },
});
