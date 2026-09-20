// RHCM 9-21-2026
// Central handling for the "session no longer valid" response the CCService
// endpoints return:
//
//   <ErrorNumber>202</ErrorNumber>
//   <Result>Fail</Result>
//   <Message>...</Message>
//
// Every screen parses its own XML, so rather than repeat the redirect logic in
// ~30 places each call site calls checkSessionExpired(result) right after
// parsing. The first one to see a 202 clears the stored credentials and wakes
// the SessionExpiredModal mounted in the root layout, which sends the user back
// to the sign-in screen.

import AsyncStorage from '@react-native-async-storage/async-storage';

export const SESSION_EXPIRED_ERROR_NUMBER = 202;

export const DEFAULT_SESSION_EXPIRED_MESSAGE =
  'Your session has expired. Please sign in again.';

// Keys written by the sign-in flow (index.tsx / SecurityCodeScreen.tsx).
const SESSION_STORAGE_KEYS = ['authorizationCode', 'location'];

type SessionExpiredListener = (message: string) => void;

let listeners: SessionExpiredListener[] = [];

// Guards against a burst of parallel requests all returning 202 and stacking up
// several modals / redirects. Cleared by resetSessionExpired() once the user
// acknowledges the modal.
let isHandlingExpiry = false;

export const subscribeToSessionExpired = (
  listener: SessionExpiredListener
): (() => void) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((existing) => existing !== listener);
  };
};

export const clearSessionStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(SESSION_STORAGE_KEYS);
  } catch (error) {
    console.error('Error clearing session storage:', error);
    // Fall back to wiping everything rather than leaving a stale auth code
    // behind, which would silently log the user back in on next launch.
    try {
      await AsyncStorage.clear();
    } catch (clearError) {
      console.error('Error clearing AsyncStorage:', clearError);
    }
  }
};

/**
 * Clears stored credentials and notifies the modal. Safe to call more than
 * once - only the first call in an expiry cycle does anything.
 */
export const triggerSessionExpired = (message?: string): void => {
  if (isHandlingExpiry) return;
  isHandlingExpiry = true;

  const text =
    typeof message === 'string' && message.trim().length > 0
      ? message.trim()
      : DEFAULT_SESSION_EXPIRED_MESSAGE;

  // Fire-and-forget: the modal should not wait on storage to be shown.
  void clearSessionStorage();

  listeners.forEach((listener) => {
    try {
      listener(text);
    } catch (error) {
      console.error('Session expired listener failed:', error);
    }
  });
};

/** Called once the user acknowledges the modal, so a later 202 can fire again. */
export const resetSessionExpired = (): void => {
  isHandlingExpiry = false;
};

/**
 * True when a parsed CCService response carries ErrorNumber 202. Accepts either
 * the whole parsed document or a bare ResultInfo node, since call sites hold
 * one or the other.
 */
export const isSessionExpired = (parsed: any): boolean => {
  const info = parsed?.ResultInfo ?? parsed;
  if (!info || typeof info !== 'object') return false;

  const errorNumber = Number(info.ErrorNumber);
  if (errorNumber !== SESSION_EXPIRED_ERROR_NUMBER) return false;

  // A 202 always comes back as a failure, but don't let an unexpected
  // "Success" body log someone out.
  const resultCode = String(info.Result ?? '').trim().toLowerCase();
  return resultCode !== 'success';
};

/**
 * Guard for API call sites. Returns true when the session has expired, in which
 * case the caller should bail out - the modal and redirect are already handled.
 *
 *   const result = parser.parse(data);
 *   if (checkSessionExpired(result)) return;
 */
export const checkSessionExpired = (parsed: any): boolean => {
  if (!isSessionExpired(parsed)) return false;

  const info = parsed?.ResultInfo ?? parsed;
  triggerSessionExpired(info?.Message);
  return true;
};
