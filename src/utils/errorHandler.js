/**
 * Global Error Handler for Mobile App
 * Logs all errors to console for debugging
 */

// Setup console to log to terminal even from device
const setupRemoteLogging = () => {
  // Store original console methods
  const originalConsoleLog = console.log.bind(console);
  const originalConsoleError = console.error.bind(console);
  const originalConsoleWarn = console.warn.bind(console);
  const originalConsoleInfo = console.info.bind(console);
  const originalConsoleDebug = console.debug.bind(console);

  // Override console methods with device prefix
  console.log = (...args) => {
    originalConsoleLog('[DEVICE LOG]', ...args);
  };

  console.error = (...args) => {
    originalConsoleError('[DEVICE ERROR]', ...args);
  };

  console.warn = (...args) => {
    originalConsoleWarn('[DEVICE WARN]', ...args);
  };

  console.info = (...args) => {
    originalConsoleInfo('[DEVICE INFO]', ...args);
  };

  console.debug = (...args) => {
    originalConsoleDebug('[DEVICE DEBUG]', ...args);
  };
};

// Global error handler for unhandled promise rejections
const setupGlobalErrorHandlers = () => {
  // Setup remote logging first
  setupRemoteLogging();

  // Handle unhandled promise rejections
  const originalPromiseRejection = global.Promise.prototype.catch;
  global.Promise.prototype.catch = function (onRejected) {
    return originalPromiseRejection.call(this, (error) => {
      console.error('🚨 Unhandled Promise Rejection:');
      console.error('📛 Error:', error);
      console.error('📛 Message:', error?.message);
      console.error('📛 Stack:', error?.stack);
      
      if (onRejected) {
        return onRejected(error);
      }
      throw error;
    });
  };

  // Handle global errors
  if (typeof ErrorUtils !== 'undefined') {
    const originalGlobalHandler = ErrorUtils.getGlobalHandler();
    
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      console.error('🚨 Global Error Handler:');
      console.error('📛 Fatal:', isFatal);
      console.error('📛 Error:', error);
      console.error('📛 Name:', error?.name);
      console.error('📛 Message:', error?.message);
      console.error('📛 Stack:', error?.stack);
      
      // Call original handler
      if (originalGlobalHandler) {
        originalGlobalHandler(error, isFatal);
      }
    });
  }

  // Catch unhandled rejections
  if (typeof global.Promise !== 'undefined') {
    global.Promise.onPossiblyUnhandledRejection = (error) => {
      console.error('🚨 Possibly Unhandled Rejection:');
      console.error('📛 Error:', error);
      console.error('📛 Message:', error?.message);
      console.error('📛 Stack:', error?.stack);
    };
  }

  // Log when app starts
  console.log('✅ Global error handlers initialized');
  console.log('✅ Remote logging enabled');
};

// Log app lifecycle events
const logAppLifecycle = () => {
  console.log('═══════════════════════════════════════');
  console.log('📱 Mobile App Starting...');
  console.log('═══════════════════════════════════════');
  console.log('🕐 Time:', new Date().toISOString());
  
  try {
    const Platform = require('react-native').Platform;
    console.log('📍 Platform:', Platform.OS);
    console.log('📍 Version:', Platform.Version);
    
    if (Platform.OS === 'android') {
      console.log('🤖 Android Device');
    } else if (Platform.OS === 'ios') {
      console.log('🍎 iOS Device');
    } else {
      console.log('🌐 Web Browser');
    }
  } catch (e) {
    console.log('📍 Platform: Unknown');
  }
  
  console.log('═══════════════════════════════════════');
};

export { setupGlobalErrorHandlers, logAppLifecycle };
