import React, { createContext, useContext, useState, useCallback } from 'react';

const TabRefreshContext = createContext();

export const TabRefreshProvider = ({ children }) => {
  const [refreshTriggers, setRefreshTriggers] = useState({});

  /**
   * Triggers a refresh for a specific tab
   * @param {string} tabName - The name of the tab to refresh (e.g., 'home')
   */
  const triggerRefresh = useCallback((tabName) => {
    setRefreshTriggers((prev) => ({
      ...prev,
      [tabName]: (prev[tabName] || 0) + 1,
    }));
  }, []);

  return (
    <TabRefreshContext.Provider value={{ refreshTriggers, triggerRefresh }}>
      {children}
    </TabRefreshContext.Provider>
  );
};

export const useTabRefresh = (tabName, onRefresh) => {
  const context = useContext(TabRefreshContext);
  const triggerValue = context?.refreshTriggers[tabName] || 0;
  const [lastProcessedTrigger, setLastProcessedTrigger] = useState(triggerValue);

  React.useEffect(() => {
    if (triggerValue > lastProcessedTrigger) {
      if (onRefresh) {
        onRefresh();
      }
      setLastProcessedTrigger(triggerValue);
    }
  }, [triggerValue, lastProcessedTrigger, onRefresh]);

  return context;
};

export default TabRefreshContext;
