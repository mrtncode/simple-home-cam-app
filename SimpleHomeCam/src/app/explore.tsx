import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useI18n } from '@/utils/i18n';

export default function ExploreScreen() {
  const { t } = useI18n();
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>HOME CAM</Text>
        <Text style={styles.title}>{t('explore.title')}</Text>
        <Text style={styles.description}>{t('explore.intro')}</Text>
        <Link href="https://docs.expo.dev" asChild>
          <Pressable style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            <Text style={styles.buttonText}>{t('explore.docs')}</Text>
            <Text style={styles.arrow}>↗</Text>
          </Pressable>
        </Link>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t('tabs.simple')}</Text>
          <Text style={styles.infoText}>{t('explore.feature')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f5ee' },
  content: { flexGrow: 1, width: '100%', maxWidth: 800, alignSelf: 'center', padding: 24, paddingTop: 36, gap: 16 },
  kicker: { color: '#cf5c36', fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  title: { color: '#20241f', fontSize: 32, fontWeight: '800' },
  description: { color: '#77796f', fontSize: 16, lineHeight: 24 },
  button: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderRadius: 14, backgroundColor: '#20241f' },
  buttonText: { color: '#fffdf9', fontSize: 15, fontWeight: '700' },
  arrow: { color: '#fffdf9', fontSize: 20 },
  infoCard: { marginTop: 8, padding: 18, gap: 8, borderRadius: 18, borderWidth: 1, borderColor: '#e2ddd2', backgroundColor: '#fffdf9' },
  infoTitle: { color: '#20241f', fontSize: 18, fontWeight: '800' },
  infoText: { color: '#77796f', fontSize: 14, lineHeight: 21 },
  pressed: { opacity: 0.72 },
});
