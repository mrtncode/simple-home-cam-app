import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddCamera, CameraConnection } from '@/components/modal/AddCamera';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

export default function HomeScreen() {
  const [addCameraVisible, setAddCameraVisible] = useState(false);
  const [camera, setCamera] = useState<CameraConnection | null>(null);

  const handleAddCamera = async (connection: CameraConnection) => {
    setCamera(connection);
    setAddCameraVisible(false);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.kicker}>HOME CAM</Text>
              <Text style={styles.title}>Your cameras</Text>
              <Text style={styles.subtitle}>A quiet view into what matters.</Text>
            </View>
            <View style={styles.liveDot} />
          </View>

          {camera ? (
            <View style={styles.cameraCard}>
              <View style={styles.cardTopline}>
                <View style={styles.cameraIcon}><Text style={styles.cameraIconText}>◉</Text></View>
                <View style={styles.connectedBadge}><View style={styles.connectedDot} /><Text style={styles.connectedText}>CONNECTED</Text></View>
              </View>
              <Text style={styles.cameraName}>{camera.host}</Text>
              <Text style={styles.cameraMeta}>{camera.https ? 'HTTPS' : 'HTTP'} · port {camera.port} · {camera.username}</Text>
              <View style={styles.cardDivider} />
              <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={() => setAddCameraVisible(true)}>
                <Text style={styles.secondaryButtonText}>Replace camera</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>+</Text></View>
              <Text style={styles.emptyTitle}>No camera connected</Text>
              <Text style={styles.emptyDescription}>Add your first Reolink camera to start monitoring your home.</Text>
              <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={() => setAddCameraVisible(true)}>
                <Text style={styles.primaryButtonText}>Add a camera</Text>
                <Text style={styles.primaryButtonArrow}>→</Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.footerNote}>Your credentials stay on this device.</Text>
        </ScrollView>
        <AddCamera visible={addCameraVisible} onClose={() => setAddCameraVisible(false)} onAdd={handleAddCamera} />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f5ee',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  kicker: {
    marginBottom: 8,
    color: '#cf5c36',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    color: '#20241f',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 7,
    color: '#77796f',
    fontSize: 15,
  },
  liveDot: {
    width: 12,
    height: 12,
    marginTop: 8,
    borderRadius: 6,
    backgroundColor: '#cf5c36',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 58,
    borderWidth: 1,
    borderColor: '#e2ddd2',
    borderRadius: 24,
    backgroundColor: '#fffdf9',
  },
  emptyIcon: {
    width: 66,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    borderRadius: 33,
    backgroundColor: '#f0d8c9',
  },
  emptyIconText: {
    marginTop: -4,
    color: '#cf5c36',
    fontSize: 34,
    fontWeight: '300',
  },
  emptyTitle: {
    color: '#20241f',
    fontSize: 22,
    fontWeight: '800',
  },
  emptyDescription: {
    maxWidth: 280,
    marginTop: 10,
    color: '#77796f',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  primaryButton: {
    minWidth: 190,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 28,
    paddingHorizontal: 22,
    borderRadius: 14,
    backgroundColor: '#cf5c36',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  primaryButtonArrow: {
    color: '#fff',
    fontSize: 22,
  },
  cameraCard: {
    padding: 22,
    borderRadius: 24,
    backgroundColor: '#20241f',
  },
  cardTopline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cameraIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#3b4038',
  },
  cameraIconText: {
    color: '#f0b59b',
    fontSize: 22,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  connectedDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#86c59c',
  },
  connectedText: {
    color: '#a9d1b4',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cameraName: {
    marginTop: 24,
    color: '#fffdf9',
    fontSize: 24,
    fontWeight: '800',
  },
  cameraMeta: {
    marginTop: 7,
    color: '#aeb2a8',
    fontSize: 14,
  },
  cardDivider: {
    height: 1,
    marginVertical: 22,
    backgroundColor: '#3b4038',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 3,
  },
  secondaryButtonText: {
    color: '#f0b59b',
    fontSize: 14,
    fontWeight: '800',
  },
  footerNote: {
    marginTop: 'auto',
    paddingTop: 28,
    color: '#9a988e',
    fontSize: 12,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
