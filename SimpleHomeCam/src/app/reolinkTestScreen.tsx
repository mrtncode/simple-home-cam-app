import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  DetectionState,
  LightState,
  PtzPreset,
  ReolinkClient,
} from '../utils/reolink';

const camera = new ReolinkClient({
  host: '192.168.178.50',
  username: 'admin',
  password: 'your-password',
});

export function ReolinkTestScreen() {
  const [presets, setPresets] = useState<PtzPreset[]>([]);
  const [light, setLight] = useState<LightState | null>(null);
  const [detection, setDetection] =
    useState<DetectionState | null>(null);

  const [loading, setLoading] = useState(false);
  const [sirenEnabled, setSirenEnabled] = useState(false);

  const run = useCallback(async (action: () => Promise<void>) => {
    try {
      setLoading(true);
      await action();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error';

      Alert.alert('Reolink error', message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPresets = useCallback(async () => {
    await run(async () => {
      const result = await camera.ptz.getPresets();
      setPresets(result);
    });
  }, [run]);

  const loadLight = useCallback(async () => {
    await run(async () => {
      const result = await camera.light.get();
      setLight(result);
    });
  }, [run]);

  const loadDetection = useCallback(async () => {
    await run(async () => {
      const result = await camera.detection.getState();
      setDetection(result);
    });
  }, [run]);

  const refresh = useCallback(async () => {
    await Promise.all([
      loadPresets(),
      loadLight(),
      loadDetection(),
    ]);
  }, [loadDetection, loadLight, loadPresets]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleLight = async () => {
    if (!light) {
      return;
    }

    await run(async () => {
      const enabled = !light.enabled;

      await camera.light.set({
        enabled,
        brightness: light.brightness,
      });

      setLight({
        ...light,
        enabled,
      });
    });
  };

  const changeBrightness = async (brightness: number) => {
    await run(async () => {
      await camera.light.set({
        brightness,
      });

      setLight((current) =>
        current
          ? {
              ...current,
              brightness,
            }
          : current,
      );
    });
  };

  const toggleSiren = async () => {
    const nextValue = !sirenEnabled;

    await run(async () => {
      await camera.siren.set(nextValue);
      setSirenEnabled(nextValue);
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Reolink Test</Text>

        <Text style={styles.subtitle}>
          API playground
        </Text>

        {loading && (
          <View style={styles.loading}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>
              Request running...
            </Text>
          </View>
        )}

        <Section title="PTZ Presets">
          <Button
            title="Reload presets"
            onPress={loadPresets}
          />

          {presets.length === 0 ? (
            <Text style={styles.muted}>
              No presets found.
            </Text>
          ) : (
            presets.map((preset) => (
              <Button
                key={preset.id}
                title={`Go to ${preset.name} (#${preset.id})`}
                onPress={() =>
                  run(() =>
                    camera.ptz.gotoPreset(preset.id),
                  )
                }
              />
            ))
          )}
        </Section>

        <Section title="Siren">
          <StatusRow
            label="Status"
            value={sirenEnabled ? 'ON' : 'OFF'}
          />

          <Button
            title={
              sirenEnabled
                ? 'Turn siren off'
                : 'Turn siren on'
            }
            onPress={toggleSiren}
          />
        </Section>

        <Section title="Light">
          {light ? (
            <>
              <StatusRow
                label="Status"
                value={
                  light.enabled ? 'ON' : 'OFF'
                }
              />

              <StatusRow
                label="Brightness"
                value={`${light.brightness}%`}
              />

              <Button
                title={
                  light.enabled
                    ? 'Turn light off'
                    : 'Turn light on'
                }
                onPress={toggleLight}
              />

              <Text style={styles.label}>
                Brightness
              </Text>

              <View style={styles.row}>
                {[25, 50, 75, 100].map(
                  (brightness) => (
                    <Pressable
                      key={brightness}
                      style={styles.smallButton}
                      onPress={() =>
                        changeBrightness(
                          brightness,
                        )
                      }
                    >
                      <Text style={styles.buttonText}>
                        {brightness}%
                      </Text>
                    </Pressable>
                  ),
                )}
              </View>
            </>
          ) : (
            <Text style={styles.muted}>
              Loading light state...
            </Text>
          )}
        </Section>

        <Section title="Detection">
          <Button
            title="Refresh detection"
            onPress={loadDetection}
          />

          {detection && (
            <>
              <StatusRow
                label="Motion"
                value={
                  detection.motion
                    ? 'DETECTED'
                    : 'None'
                }
              />

              <StatusRow
                label="Person"
                value={
                  detection.person
                    ? 'DETECTED'
                    : 'None'
                }
              />
            </>
          )}
        </Section>

        <Section title="Everything">
          <Button
            title="Refresh all"
            onPress={refresh}
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

function Section({
  title,
  children,
}: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
}

type ButtonProps = {
  title: string;
  onPress: () => void;
};

function Button({
  title,
  onPress,
}: ButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
    >
      <Text style={styles.buttonText}>
        {title}
      </Text>
    </Pressable>
  );
}

type StatusRowProps = {
  label: string;
  value: string;
};

function StatusRow({
  label,
  value,
}: StatusRowProps) {
  return (
    <View style={styles.statusRow}>
      <Text style={styles.statusLabel}>
        {label}
      </Text>

      <Text style={styles.statusValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  container: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
  },

  subtitle: {
    marginTop: 4,
    marginBottom: 24,
    fontSize: 15,
    color: '#777',
  },

  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },

  loadingText: {
    color: '#666',
  },

  section: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
  },

  sectionTitle: {
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },

  sectionContent: {
    gap: 10,
  },

  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#222',
  },

  buttonPressed: {
    opacity: 0.7,
  },

  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  smallButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#222',
  },

  row: {
    flexDirection: 'row',
    gap: 8,
  },

  label: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },

  muted: {
    fontSize: 14,
    color: '#888',
  },

  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },

  statusLabel: {
    fontSize: 15,
    color: '#555',
  },

  statusValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },
});