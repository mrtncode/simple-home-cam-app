import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';

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
import { ScaledText as Text, useFontSize } from '@/utils/font-size';

export default function HomeScreen() {
  const [addCameraVisible, setAddCameraVisible] = useState(false);
  const [camera, setCamera] = useState<CameraConnection | null>(null);
  const { t, language, setLanguage } = useI18n();
  const { fontScale, decreaseFontSize, increaseFontSize } = useFontSize();

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
            <View style={styles.headerContent}>
              <Pressable accessibilityRole="button" accessibilityLabel={t('home.backToCamera')} onPress={() => router.replace('/')} style={styles.backButton}>
                <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} tintColor="#20241f" size={21} />
              </Pressable>
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
                <SymbolView name={{ ios: 'arrow.triangle.2.circlepath', android: 'swap_horiz', web: 'swap_horiz' }} tintColor="#9ba2f0" size={17} />
                <Text style={styles.secondaryButtonText}>{t('home.replace')}</Text>
              </Pressable>
              <Pressable style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]} onPress={handleLogout}>
                <SymbolView name={{ ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' }} tintColor="#232cb0" size={17} />
                <Text style={styles.logoutButtonText}>{t('home.logout')}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>+</Text></View>
              <Text style={styles.emptyTitle}>{t('home.noCamera')}</Text>
              <Text style={styles.emptyDescription}>{t('home.empty')}</Text>
              <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={() => setAddCameraVisible(true)}>
                <SymbolView name={{ ios: 'video.badge.plus', android: 'add_a_photo', web: 'add_a_photo' }} tintColor="#fff" size={19} />
                <Text style={styles.primaryButtonText}>{t('home.add')}</Text>
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
          <View style={styles.fontSizeCard}>
            <View style={styles.fontSizeDescription}>
              <Text style={styles.languageLabel}>{t('home.fontSize')}</Text>
              <Text style={styles.fontSizeValue}>{Math.round(fontScale * 100)}%</Text>
            </View>
            <View style={styles.fontSizeControls}>
              <Pressable accessibilityRole="button" accessibilityLabel={t('home.decreaseFontSize')} disabled={fontScale <= 0.85} onPress={decreaseFontSize} style={[styles.fontSizeButton, fontScale <= 0.85 && styles.fontSizeButtonDisabled]}>
                <Text style={styles.fontSizeButtonText}>−</Text>
              </Pressable>
              <Text style={styles.fontPreview}>{t('home.fontPreview')}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={t('home.increaseFontSize')} disabled={fontScale >= 1.4} onPress={increaseFontSize} style={[styles.fontSizeButton, fontScale >= 1.4 && styles.fontSizeButtonDisabled]}>
                <Text style={styles.fontSizeButtonText}>+</Text>
              </Pressable>
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
    flex: 1
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
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  backButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#f0f0ee' },
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
    backgroundColor: '#002791',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 58,
    borderWidth: 1,
    borderColor: '#e2ddd2',
    borderRadius: 24,
    backgroundColor: '#f7f7f691',
  },
  emptyIcon: {
    width: 66,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    borderRadius: 33,
    backgroundColor: '#4692dd',
  },
  emptyIconText: {
    marginTop: -4,
    color: '#f6f9fe',
    fontSize: 34,
    fontWeight: '700',
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
    minWidth: 220,
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 28,
    paddingHorizontal: 22,
    borderRadius: 14,
    backgroundColor: '#004bc3',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
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
    color: '#9ba4f0',
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
    color: '#f7f7f691',
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
    minHeight: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    alignItems: 'center',
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: '#9ba2f0',
    fontSize: 16,
    fontWeight: '800',
  },
  logoutButton: {
    minHeight: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  logoutButtonText: {
    color: '#232cb0',
    fontSize: 16,
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
    backgroundColor: '#f7f7f691',
  },
  languageLabel: { color: '#20241f', fontSize: 14, fontWeight: '700' },
  languageChoices: { flexDirection: 'row', gap: 6 },
  languageChoice: { minHeight: 48, minWidth: 54, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderRadius: 10 },
  languageChoiceSelected: { backgroundColor: '#20241f' },
  languageChoiceText: { color: '#77796f', fontSize: 14, fontWeight: '700' },
  languageChoiceTextSelected: { color: '#f7f7f691' },
  fontSizeCard: { marginTop: 14, padding: 14, borderWidth: 1, borderColor: '#e2ddd2', borderRadius: 14, backgroundColor: '#f7f7f691' },
  fontSizeDescription: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fontSizeValue: { color: '#77796f', fontSize: 14, fontWeight: '700' },
  fontSizeControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, gap: 14 },
  fontSizeButton: { width: 56, minHeight: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#20241f' },
  fontSizeButtonDisabled: { opacity: 0.4 },
  fontSizeButtonText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  fontPreview: { flex: 1, color: '#20241f', fontSize: 18, textAlign: 'center' },
  pressed: {
    opacity: 0.75,
  },
});
