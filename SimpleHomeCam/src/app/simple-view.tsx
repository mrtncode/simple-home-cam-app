import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CameraStream } from '@/components/CameraScreen';
import { DetectionState, LightState, PtzPreset, ReolinkClient } from '@/utils/reolink';
import { getCameraClient, loadCameraSettings } from '@/utils/cameraSettings';

const colors = {
  canvas: '#f5f3ed',
  card: '#fffefa',
  ink: '#20241f',
  muted: '#77796f',
  accent: '#cf5c36',
  line: '#e5e0d6',
  good: '#337a51',
};

export default function SimpleViewScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [presets, setPresets] = useState<PtzPreset[]>([]);
  const [light, setLight] = useState<LightState | null>(null);
  const [detection, setDetection] = useState<DetectionState | null>(null);
  const [sirenEnabled, setSirenEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const getClient = useCallback(async () => {
    const client = await getCameraClient();
    if (!client) throw new Error('Add a camera in the Home tab before using controls.');
    return client;
  }, []);

  const perform = useCallback(async (action: (client: ReolinkClient) => Promise<void>) => {
    try {
      setLoading(true);
      const client = await getClient();
      await action(client);
    } catch (error) {
      Alert.alert('Camera control error', error instanceof Error ? error.message : 'Unknown error');
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
          <Text style={styles.kicker}>HOME CAM</Text>
          <Text style={styles.title}>Simple View</Text>
        </View>
        <Pressable onPress={() => void refresh()} style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]} accessibilityRole="button">
          <Text style={styles.refreshText}>Refresh</Text>
        </Pressable>
      </View>

      <View style={[styles.content, wide && styles.wideContent]}>
        <View style={[styles.cameraCard, wide && styles.wideCamera]}>
          <CameraStream />
        </View>
        <ScrollView style={[styles.controlsScroll, wide && styles.wideControls]} contentContainerStyle={styles.controls} showsVerticalScrollIndicator={false}>
          {loading && <View style={styles.loading}><ActivityIndicator color={colors.accent} /><Text style={styles.muted}>Updating camera…</Text></View>}

          <Panel title="PTZ Presets">
            {presets.length ? presets.map((preset) => (
              <ActionButton key={preset.id} title={preset.name} onPress={() => void perform((client) => client.ptz.gotoPreset(preset.id))} />
            )) : <Text style={styles.muted}>No presets available</Text>}
          </Panel>

          <Panel title="Camera controls">
            <ActionButton title={sirenEnabled ? 'Turn siren off' : 'Turn siren on'} detail={sirenEnabled ? 'ON' : 'OFF'} onPress={() => void toggleSiren()} />
            <ActionButton title={light ? (light.enabled ? 'Turn light off' : 'Turn light on') : 'Light status unavailable'} detail={light ? (light.enabled ? 'ON' : 'OFF') : '—'} onPress={toggleLight} disabled={!light} />
          </Panel>

          <Panel title="Sensors">
            <Sensor label="Motion" active={detection?.motion} />
            <Sensor label="Person" active={detection?.person} />
          </Panel>
          <Text style={styles.note}>Sensor readings update when you refresh.</Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.panel}><Text style={styles.panelTitle}>{title}</Text><View style={styles.panelContent}>{children}</View></View>;
}

function ActionButton({ title, detail, onPress, disabled }: { title: string; detail?: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed, disabled && styles.disabled]}>
    <Text style={styles.actionText}>{title}</Text>{detail && <Text style={styles.actionDetail}>{detail}</Text>}
  </Pressable>;
}

function Sensor({ label, active }: { label: string; active?: boolean }) {
  return <View style={styles.sensorRow}><Text style={styles.sensorLabel}>{label}</Text><Text style={[styles.sensorState, active && styles.sensorActive]}>{active === undefined ? 'Unknown' : active ? 'Detected' : 'Clear'}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  header: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  title: { color: colors.ink, fontSize: 28, fontWeight: '800', marginTop: 3 },
  refreshButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 18, borderRadius: 13, backgroundColor: colors.ink },
  refreshText: { color: '#fffefa', fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 16, paddingBottom: 12 },
  wideContent: { flexDirection: 'row', gap: 18, paddingHorizontal: 24 },
  cameraCard: { width: '100%', alignSelf: 'center', overflow: 'hidden', borderRadius: 18, backgroundColor: '#111' },
  wideCamera: { flex: 1, alignSelf: 'center', maxWidth: 1500 },
  controlsScroll: { flex: 1 },
  wideControls: { flexGrow: 0, width: 330, flex: 0 },
  controls: { gap: 12, paddingTop: 14, paddingBottom: 20 },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  muted: { color: colors.muted, fontSize: 14 },
  panel: { padding: 16, borderRadius: 17, borderColor: colors.line, borderWidth: 1, backgroundColor: colors.card },
  panelTitle: { color: colors.ink, fontSize: 17, fontWeight: '800', marginBottom: 12 },
  panelContent: { gap: 9 },
  actionButton: { minHeight: 48, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#f2eee5', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionText: { flexShrink: 1, color: colors.ink, fontSize: 14, fontWeight: '700' },
  actionDetail: { color: colors.accent, fontSize: 12, fontWeight: '800', marginLeft: 8 },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.55 },
  sensorRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sensorLabel: { color: colors.ink, fontSize: 14, fontWeight: '600' },
  sensorState: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  sensorActive: { color: colors.good },
  note: { color: colors.muted, fontSize: 12, textAlign: 'center', paddingBottom: 6 },
});
