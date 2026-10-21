import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { I18nProvider } from '@/utils/i18n';
import { FontSizeProvider } from '@/utils/font-size';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <I18nProvider>
        <FontSizeProvider>
          <AnimatedSplashOverlay />
          <Stack screenOptions={{ headerShown: false }} initialRouteName="index" />
        </FontSizeProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
