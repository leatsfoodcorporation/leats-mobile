import { Redirect } from 'expo-router';
import { useState, useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

export default function Index() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  // Safety: force hide after 3 seconds no matter what
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      SplashScreen.hideAsync();
      setIsReady(true);
    }, 3000);
    return () => clearTimeout(safetyTimer);
  }, []);

  if (!isReady) {
    return null;
  }

  return <Redirect href="/(tabs)/home" />;
}
