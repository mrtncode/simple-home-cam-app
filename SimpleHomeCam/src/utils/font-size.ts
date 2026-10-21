import * as SecureStore from 'expo-secure-store';
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { Platform, StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

const FONT_SIZE_KEY = 'simple-home-cam.font-scale';
const MIN_FONT_SCALE = 0.85;
const MAX_FONT_SCALE = 1.4;
const FONT_SCALE_STEP = 0.1;

type FontSizeContextValue = {
	fontScale: number;
	decreaseFontSize: () => void;
	increaseFontSize: () => void;
};

const FontSizeContext = createContext<FontSizeContextValue | null>(null);

export function FontSizeProvider({ children }: PropsWithChildren) {
	const [fontScale, setFontScale] = useState(1);

	useEffect(() => {
		void readSavedFontScale().then((savedScale) => {
			if (savedScale) {
				const parsedScale = Number(savedScale);
				if (Number.isFinite(parsedScale)) {
					setFontScale(Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, parsedScale)));
				}
			}
		}).catch(() => undefined);
	}, []);

	const updateFontScale = useCallback((change: number) => {
		setFontScale((currentScale) => {
			const nextScale = Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, Math.round((currentScale + change) * 100) / 100));
			void saveFontScale(nextScale).catch(() => undefined);
			return nextScale;
		});
	}, []);

	const value = useMemo(() => ({
		fontScale,
		decreaseFontSize: () => updateFontScale(-FONT_SCALE_STEP),
		increaseFontSize: () => updateFontScale(FONT_SCALE_STEP),
	}), [fontScale, updateFontScale]);

	return createElement(FontSizeContext.Provider, { value }, children);
}

export function useFontSize() {
	const context = useContext(FontSizeContext);
	if (!context) throw new Error('useFontSize must be used inside FontSizeProvider');
	return context;
}

export function ScaledText({ style, ...props }: TextProps) {
	const { fontScale } = useFontSize();
	const scaledStyle = scaleTextStyle(StyleSheet.flatten(style), fontScale);
	return createElement(Text, { ...props, style: scaledStyle });
}

async function readSavedFontScale() {
	if (Platform.OS === 'web') return typeof localStorage === 'undefined' ? null : localStorage.getItem(FONT_SIZE_KEY);
	return SecureStore.getItemAsync(FONT_SIZE_KEY);
}

async function saveFontScale(scale: number) {
	if (Platform.OS === 'web') {
		if (typeof localStorage !== 'undefined') localStorage.setItem(FONT_SIZE_KEY, String(scale));
		return;
	}
	await SecureStore.setItemAsync(FONT_SIZE_KEY, String(scale));
}

function scaleTextStyle(style: TextStyle | TextStyle[] | undefined, scale: number): TextStyle {
	if (!style || Array.isArray(style)) return {};
	return {
		...style,
		...(typeof style.fontSize === 'number' ? { fontSize: style.fontSize * scale } : {}),
		...(typeof style.lineHeight === 'number' ? { lineHeight: style.lineHeight * scale } : {}),
	};
}
