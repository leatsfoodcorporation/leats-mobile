import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import orderScheduleService from '../services/orderScheduleService';

const parseTime = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const toHHMMSS = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
};

const to12hr = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const OrderCountdownBanner = () => {
  const [schedule, setSchedule] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef(null);
  const rotationRef = useRef(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await orderScheduleService.getActiveSettings();
        if (response.success && response.data) {
          setSchedule(response.data);
        }
      } catch (error) {
        console.error('Error fetching order schedule:', error);
      }
    };
    fetchSchedule();
  }, []);

  useEffect(() => {
    if (!schedule || !schedule.countdownEnabled) {
      if (schedule && !schedule.countdownEnabled) {
        setMessages(['🎊 Welcome! Explore our latest products and deals']);
      }
      return;
    }

    const tick = () => {
      const now = new Date();
      // Compute IST = UTC + 5:30
      const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
      const currentMinutes = ist.getUTCHours() * 60 + ist.getUTCMinutes();
      const currentSeconds = ist.getUTCHours() * 3600 + ist.getUTCMinutes() * 60 + ist.getUTCSeconds();

      const liveStart = parseTime(schedule.liveOrderStartTime);
      const liveEnd = parseTime(schedule.liveOrderEndTime);
      const preStart = parseTime(schedule.preOrderStartTime);
      const preEnd = parseTime(schedule.preOrderEndTime);

      const activeMessages = [];

      // 1. Process LIVE window status
      if (schedule.liveOrderEnabled) {
        if (currentMinutes >= liveStart && currentMinutes <= liveEnd) {
          const endSec = liveEnd * 60 + 59;
          const remaining = endSec - currentSeconds;
          activeMessages.push(`🔴 ${schedule.liveOrderLabel} closes in ${toHHMMSS(Math.max(0, remaining))}`);
        } else if (currentMinutes < liveStart) {
          const ONE_HOUR = 60;
          if (liveStart - currentMinutes <= ONE_HOUR) {
            const startSec = liveStart * 60;
            activeMessages.push(`⏳ ${schedule.liveOrderLabel} Starts Soon - opens in ${toHHMMSS(Math.max(0, startSec - currentSeconds))}`);
          } else {
            activeMessages.push(`⏳ ${schedule.liveOrderLabel} opens today at ${to12hr(schedule.liveOrderStartTime)}`);
          }
        }
      }

      // 2. Process PRE_ORDER window status
      if (schedule.preOrderEnabled) {
        if (currentMinutes >= preStart && currentMinutes <= preEnd) {
          const endSec = preEnd * 60 + 59;
          const remaining = endSec - currentSeconds;
          activeMessages.push(`📦 ${schedule.preOrderLabel} closes in ${toHHMMSS(Math.max(0, remaining))}`);
        } else if (currentMinutes < preStart) {
          const ONE_HOUR = 60;
          if (preStart - currentMinutes <= ONE_HOUR) {
            const startSec = preStart * 60;
            activeMessages.push(`📦 ${schedule.preOrderLabel} Starts Soon - opens in ${toHHMMSS(Math.max(0, startSec - currentSeconds))}`);
          } else {
            activeMessages.push(`📦 ${schedule.preOrderLabel} opens today at ${to12hr(schedule.preOrderStartTime)}`);
          }
        }
      }

      // 3. Fallback/Tomorrow messages
      if (activeMessages.length === 0) {
        if (schedule.liveOrderEnabled) {
          activeMessages.push(`⏳ ${schedule.liveOrderLabel} opens tomorrow at ${to12hr(schedule.liveOrderStartTime)}`);
        } else if (schedule.preOrderEnabled) {
          activeMessages.push(`📦 ${schedule.preOrderLabel} opens tomorrow at ${to12hr(schedule.preOrderStartTime)}`);
        } else {
          activeMessages.push('🎊 Welcome! Explore our latest products and deals');
        }
      }

      setMessages(activeMessages);
    };

    tick();
    timerRef.current = setInterval(tick, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [schedule]);

  useEffect(() => {
    if (messages.length > 1) {
      rotationRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % messages.length);
      }, 5000); // Rotate every 5 seconds
    } else {
      setCurrentIndex(0);
      if (rotationRef.current) clearInterval(rotationRef.current);
    }

    return () => {
      if (rotationRef.current) clearInterval(rotationRef.current);
    };
  }, [messages.length]);

  const displayMessage = messages[currentIndex] || messages[0] || '';

  if (!displayMessage) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text} numberOfLines={1} key={currentIndex}>
        {displayMessage}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default OrderCountdownBanner;
