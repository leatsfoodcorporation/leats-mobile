import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import policyService from '../../services/policyService';

const PRIMARY_COLOR = '#e63946';

const PolicyComponent = ({ slug, defaultTitle }) => {
  const insets = useSafeAreaInsets();
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPolicy();
  }, [slug]);

  const loadPolicy = async () => {
    try {
      setLoading(true);
      const response = await policyService.getPolicyBySlug(slug);
      
      if (response.success && response.data) {
        setPolicy(response.data);
      }
    } catch (error) {
      console.error('Failed to load policy:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text className="text-gray-600 mt-3">Loading...</Text>
      </View>
    );
  }

  if (!policy) {
    return (
      <ScrollView 
        className="flex-1 bg-gray-50"
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
      >
        <View className="p-4">
          <View className="bg-white rounded-lg p-8">
            <Text className="text-2xl font-bold text-gray-800 text-center mb-4">
              {defaultTitle}
            </Text>
            <Text className="text-gray-500 text-center">
              This policy is currently being updated. Please check back later.
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 16px;
            margin: 0;
            background-color: #f9fafb;
            color: #1f2937;
            font-size: 14px;
            line-height: 1.6;
          }
          h1, h2, h3, h4, h5, h6 {
            color: #111827;
            margin-top: 24px;
            margin-bottom: 12px;
            font-weight: 600;
          }
          h1 { font-size: 24px; }
          h2 { font-size: 20px; }
          h3 { font-size: 18px; }
          p {
            margin-bottom: 12px;
          }
          ul, ol {
            margin-bottom: 12px;
            padding-left: 24px;
          }
          li {
            margin-bottom: 6px;
          }
          a {
            color: #e63946;
            text-decoration: none;
          }
          strong {
            font-weight: 600;
            color: #111827;
          }
          .last-updated {
            color: #6b7280;
            font-size: 12px;
            margin-bottom: 16px;
          }
          .version {
            color: #9ca3af;
            font-size: 12px;
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <h1>${policy.title}</h1>
        ${policy.content}
      </body>
    </html>
  `;

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingBottom: insets.bottom }}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={{ backgroundColor: '#f9fafb' }}
      />
    </View>
  );
};

export default PolicyComponent;
