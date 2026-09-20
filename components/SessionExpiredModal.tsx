// RHCM 9-21-2026
// Global modal shown when any CCService call comes back with ErrorNumber 202.
// Mounted once in the root layout so it can appear over whichever screen the
// user happens to be on. Storage is already cleared by SessionManager before
// this renders; acknowledging the modal sends the user back to sign-in.

import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  DEFAULT_SESSION_EXPIRED_MESSAGE,
  resetSessionExpired,
  subscribeToSessionExpired,
} from './SessionManager';

const SessionExpiredModal: React.FC = () => {
  const router = useRouter();
  const [visible, setVisible] = useState<boolean>(false);
  const [message, setMessage] = useState<string>(
    DEFAULT_SESSION_EXPIRED_MESSAGE
  );

  useEffect(() => {
    const unsubscribe = subscribeToSessionExpired((text) => {
      setMessage(text);
      setVisible(true);
    });
    return unsubscribe;
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    resetSessionExpired();
    // replace() rather than push() so the back gesture cannot return to a
    // screen that is now running without credentials.
    router.replace('/');
  }, [router]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // Android hardware back should follow the same path as the button.
      onRequestClose={handleDismiss}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Session Expired</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={handleDismiss}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 21,
  },
  button: {
    backgroundColor: '#20D5FF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    minWidth: 160,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SessionExpiredModal;
