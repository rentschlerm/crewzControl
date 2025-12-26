//RHCM 12/22/2025
// Simple debug utility to toggle global console output.
// Set `debug_flag` to 1 to enable logs, 0 to disable.
// Import and call `initDebug()` early (e.g., in app/_layout.tsx).

export let debug_flag = 0; // 1 = enabled, 0 = disabled

const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

function noop(..._args: any[]) {}

export function applyDebugFlag() {
  if (debug_flag === 1) {
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.debug = originalConsole.debug;
  } else {
    console.log = noop as any;
    console.info = noop as any;
    console.warn = noop as any;
    console.error = noop as any;
    console.debug = noop as any;
  }
}

export function setDebugFlag(val: number) {
  debug_flag = val === 1 ? 1 : 0;
  applyDebugFlag();
}

export function initDebug() {
  // Apply immediately based on current flag
  applyDebugFlag();
}

export default { debug_flag, initDebug, setDebugFlag };
