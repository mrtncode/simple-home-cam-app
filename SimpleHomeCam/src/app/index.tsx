import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddCamera, CameraConnection } from '@/components/modal/AddCamera';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import {
  clearCameraSettings,
  loadCameraSettings,
  saveCameraSettings,
} from '@/utils/cameraSettings';
import { ReolinkClient } from '@/utils/reolink';
import { useI18n } from '@/utils/i18n';

export default function HomeScreen() {
  const [addCameraVisible, setAddCameraVisible] = useState(false);
  const [camera, setCamera] = useState<CameraConnection | null>(null);
  const { t, language, setLanguage } = useI18n();

  useEffect(() => {
    loadCameraSettings().then((settings) => {
      if (settings) {
        setCamera({ ...settings, client: new ReolinkClient(settings) });
      }
    });
  }, []);

  const handleAddCamera = async (connection: CameraConnection) => {
    await saveCameraSettings(connection);
    setCamera(connection);
    setAddCameraVisible(false);
  };

  const handleLogout = () => {
    Alert.alert(
      t('home.logoutTitle'),
      t('home.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('home.logout'),
          style: 'destructive',
          onPress: async () => {
            await clearCameraSettings();
            setCamera(null);
          },
        },
      ],
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{t('home.title')}</Text>
            </View>
          </View>

          {camera ? (
            <View style={styles.cameraCard}>
              <View style={styles.cardTopline}>
                <View style={styles.cameraIcon}><Text style={styles.cameraIconText}>◉</Text></View>
                <View style={styles.connectedBadge}><View style={styles.connectedDot} /><Text style={styles.connectedText}>{t('home.connected')}</Text></View>
              </View>
              <Text style={styles.cameraName}>{camera.host}</Text>
              <Text style={styles.cameraMeta}>{camera.https ? 'HTTPS' : 'HTTP'} · port {camera.port} · {camera.username}</Text>
              <View style={styles.cardDivider} />
              <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={() => setAddCameraVisible(true)}>
                <Text style={styles.secondaryButtonText}>{t('home.replace')}</Text>
              </Pressable>
              <Pressable style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>{t('home.logout')}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>+</Text></View>
              <Text style={styles.emptyTitle}>{t('home.noCamera')}</Text>
              <Text style={styles.emptyDescription}>{t('home.empty')}</Text>
              <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={() => setAddCameraVisible(true)}>
                <Text style={styles.primaryButtonText}>{t('home.add')}</Text>
                <Text style={styles.primaryButtonArrow}>→</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.languageCard}>
            <Text style={styles.languageLabel}>{t('home.language')}</Text>
            <View style={styles.languageChoices}>
              {(['en', 'de'] as const).map((option) => (
                <Pressable key={option} onPress={() => setLanguage(option)} style={[styles.languageChoice, language === option && styles.languageChoiceSelected]}>
                  <Text style={[styles.languageChoiceText, language === option && styles.languageChoiceTextSelected]}>{option === 'en' ? t('home.english') : t('home.german')}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
        <AddCamera visible={addCameraVisible} onClose={() => setAddCameraVisible(false)} onAdd={handleAddCamera} />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    color: '#002c9c',
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
  logoutButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 3,
  },
  logoutButtonText: {
    color: '#e08a7a',
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
  languageCard: {
    marginTop: 28,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2ddd2',
    borderRadius: 14,
    backgroundColor: '#fffdf9',
  },
  languageLabel: { color: '#20241f', fontSize: 14, fontWeight: '700' },
  languageChoices: { flexDirection: 'row', gap: 6 },
  languageChoice: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 10 },
  languageChoiceSelected: { backgroundColor: '#20241f' },
  languageChoiceText: { color: '#77796f', fontSize: 13, fontWeight: '700' },
  languageChoiceTextSelected: { color: '#fffdf9' },
  pressed: {
    opacity: 0.75,
  },
});
