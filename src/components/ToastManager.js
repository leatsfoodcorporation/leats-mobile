import { useState, useEffect } from 'react';
import CustomToast from './CustomToast';

let toastManagerRef = null;

const ToastManager = () => {
  const [toastConfig, setToastConfig] = useState({
    visible: false,
    type: 'info',
    message: '',
    description: '',
  });

  useEffect(() => {
    toastManagerRef = {
      show: (config) => {
        setToastConfig({
          visible: true,
          type: config.type || 'info',
          message: config.message || '',
          description: config.description || '',
        });
      },
      hide: () => {
        setToastConfig((prev) => ({ ...prev, visible: false }));
      },
    };

    return () => {
      toastManagerRef = null;
    };
  }, []);

  const handleHide = () => {
    setToastConfig((prev) => ({ ...prev, visible: false }));
  };

  return (
    <CustomToast
      visible={toastConfig.visible}
      type={toastConfig.type}
      message={toastConfig.message}
      description={toastConfig.description}
      onHide={handleHide}
    />
  );
};

// Export the show and hide functions
export const showToast = (config) => {
  if (toastManagerRef) {
    toastManagerRef.show(config);
  }
};

export const hideToast = () => {
  if (toastManagerRef) {
    toastManagerRef.hide();
  }
};

export default ToastManager;
