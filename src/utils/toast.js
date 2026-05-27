import { showToast, hideToast } from '../components/ToastManager';

/**
 * Toast Utility
 * Provides easy-to-use toast notification methods with swipe-to-dismiss
 */

const toast = {
  /**
   * Show success toast
   * @param {string} message - Main message
   * @param {string} description - Optional description
   */
  success: (message, description = '') => {
    showToast({
      type: 'success',
      message,
      description,
    });
  },

  /**
   * Show error toast
   * @param {string} message - Main message
   * @param {string} description - Optional description
   */
  error: (message, description = '') => {
    showToast({
      type: 'error',
      message,
      description,
    });
  },

  /**
   * Show info toast
   * @param {string} message - Main message
   * @param {string} description - Optional description
   */
  info: (message, description = '') => {
    showToast({
      type: 'info',
      message,
      description,
    });
  },

  /**
   * Show warning toast
   * @param {string} message - Main message
   * @param {string} description - Optional description
   */
  warning: (message, description = '') => {
    showToast({
      type: 'warning',
      message,
      description,
    });
  },

  /**
   * Hide current toast
   */
  hide: () => {
    hideToast();
  },
};

export default toast;
