import { useState } from 'react';
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TextInput,
	View,
} from 'react-native';

import { ReolinkClient } from '@/utils/reolink';
import { SavedCameraSettings } from '@/utils/cameraSettings';

export type CameraConnection = SavedCameraSettings & {
	client: ReolinkClient;
};

type AddCameraProps = {
	visible: boolean;
	onClose: () => void;
	onAdd: (connection: CameraConnection) => Promise<void>;
};

export function AddCamera({ visible, onClose, onAdd }: AddCameraProps) {
	const [host, setHost] = useState('');
	const [username, setUsername] = useState('admin');
	const [password, setPassword] = useState('');
	const [port, setPort] = useState('80');
	const [https, setHttps] = useState(false);
	const [error, setError] = useState('');
	const [saving, setSaving] = useState(false);

	const reset = () => {
		setHost('');
		setUsername('admin');
		setPassword('');
		setPort('80');
		setHttps(false);
		setError('');
	};

	const close = () => {
		if (!saving) {
			reset();
			onClose();
		}
	};

	const submit = async () => {
		const normalizedHost = host
			.trim()
			.replace(/^https?:\/\//, '')
			.replace(/\/$/, '');
		const parsedPort = Number(port.trim());

		if (!normalizedHost || !username.trim() || !password) {
			setError('Enter the camera IP, username, and password.');
			return;
		}

		if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
			setError('Port must be a number between 1 and 65535.');
			return;
		}

		setError('');
		setSaving(true);

		try {
			const client = new ReolinkClient({
				host: normalizedHost,
				username: username.trim(),
				password,
				port: parsedPort,
				https,
				channel: 0,
			});

			await client.detection.getState();
			await onAdd({
				client,
				host: normalizedHost,
				username: username.trim(),
				password,
				https,
				port: parsedPort,
				channel: 0,
			});
			reset();
		} catch (connectionError) {
			setError(
				connectionError instanceof Error
					? connectionError.message
					: 'Unable to connect to the camera.',
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Modal
			visible={visible}
			animationType="slide"
			transparent
			onRequestClose={close}
		>
			<KeyboardAvoidingView
				style={styles.overlay}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				<View style={styles.sheet}>
					<View style={styles.header}>
						<View>
							<Text style={styles.eyebrow}>CAMERA SETUP</Text>
							<Text style={styles.title}>Add a camera</Text>
						</View>
						<Pressable onPress={close} disabled={saving} style={styles.closeButton}>
							<Text style={styles.closeText}>×</Text>
						</Pressable>
					</View>

					<ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
						<Text style={styles.description}>
							Connect directly to your Reolink camera on the local network.
						</Text>

						<Field
							label="Camera IP or hostname"
							value={host}
							onChangeText={setHost}
							placeholder="192.168.1.42"
							autoCapitalize="none"
							autoCorrect={false}
							keyboardType="url"
						/>
						<Field
							label="Username"
							value={username}
							onChangeText={setUsername}
							placeholder="admin"
							autoCapitalize="none"
							autoCorrect={false}
						/>
						<Field
							label="Password"
							value={password}
							onChangeText={setPassword}
							placeholder="Camera password"
							secureTextEntry
							autoCapitalize="none"
							autoCorrect={false}
						/>

						<View style={styles.inlineFields}>
							<View style={styles.portField}>
								<Field
									label="Port"
									value={port}
									onChangeText={setPort}
									placeholder="80"
									keyboardType="number-pad"
								/>
							</View>
							<View style={styles.protocolRow}>
								<View>
									<Text style={styles.fieldLabel}>HTTPS</Text>
									<Text style={styles.helper}>Use secure transport</Text>
								</View>
								<Switch value={https} onValueChange={setHttps} trackColor={{ false: '#d8d3c8', true: '#cf5c36' }} thumbColor="#fff" />
							</View>
						</View>

						{error ? <Text style={styles.error}>{error}</Text> : null}

						<Pressable
							style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
							onPress={submit}
							disabled={saving}
						>
							{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.addButtonText}>Connect camera</Text>}
						</Pressable>
						<Pressable onPress={close} disabled={saving} style={styles.cancelButton}>
							<Text style={styles.cancelText}>Cancel</Text>
						</Pressable>
					</ScrollView>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}

type FieldProps = {
	label: string;
	value: string;
	onChangeText: (value: string) => void;
	placeholder: string;
	secureTextEntry?: boolean;
	autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
	autoCorrect?: boolean;
	keyboardType?: 'default' | 'url' | 'number-pad';
};

function Field({ label, ...props }: FieldProps) {
	return (
		<View style={styles.field}>
			<Text style={styles.fieldLabel}>{label}</Text>
			<TextInput {...props} style={styles.input} placeholderTextColor="#9b958a" />
		</View>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		justifyContent: 'flex-end',
		backgroundColor: 'rgba(24, 27, 24, 0.5)',
	},
	sheet: {
		maxHeight: '94%',
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		backgroundColor: '#f8f5ee',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
		paddingHorizontal: 24,
		paddingTop: 24,
	},
	eyebrow: {
		marginBottom: 6,
		color: '#cf5c36',
		fontSize: 11,
		fontWeight: '800',
		letterSpacing: 1.5,
	},
	title: {
		color: '#20241f',
		fontSize: 30,
		fontWeight: '800',
	},
	closeButton: {
		width: 36,
		height: 36,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 18,
		backgroundColor: '#e9e4d9',
	},
	closeText: {
		marginTop: -3,
		color: '#55584f',
		fontSize: 28,
		fontWeight: '300',
	},
	content: {
		gap: 16,
		padding: 24,
		paddingBottom: 36,
	},
	description: {
		marginBottom: 4,
		color: '#686b62',
		fontSize: 15,
		lineHeight: 22,
	},
	field: {
		gap: 7,
	},
	fieldLabel: {
		color: '#393d35',
		fontSize: 13,
		fontWeight: '700',
	},
	input: {
		height: 50,
		paddingHorizontal: 15,
		borderWidth: 1,
		borderColor: '#ddd8cc',
		borderRadius: 12,
		backgroundColor: '#fffdf9',
		color: '#20241f',
		fontSize: 16,
	},
	inlineFields: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		gap: 16,
	},
	portField: {
		flex: 1,
	},
	protocolRow: {
		flex: 1.6,
		minHeight: 50,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	helper: {
		marginTop: 3,
		color: '#8a887e',
		fontSize: 12,
	},
	error: {
		color: '#b33d2e',
		fontSize: 13,
		lineHeight: 19,
	},
	addButton: {
		minHeight: 54,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 14,
		backgroundColor: '#cf5c36',
	},
	addButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '800',
	},
	cancelButton: {
		alignItems: 'center',
		paddingVertical: 4,
	},
	cancelText: {
		color: '#686b62',
		fontSize: 14,
		fontWeight: '700',
	},
	pressed: {
		opacity: 0.75,
	},
});
