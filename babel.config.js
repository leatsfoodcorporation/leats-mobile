module.exports = function (api) {
  api.cache(true);
  
  // Determine which .env file to use based on NODE_ENV
  const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
  
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: envFile,
          allowUndefined: false,
          safe: false,
          allowlist: [
            'API_URL',
            'GOOGLE_CLIENT_ID',
            'FIREBASE_API_KEY',
            'FIREBASE_AUTH_DOMAIN',
            'FIREBASE_PROJECT_ID',
            'FIREBASE_STORAGE_BUCKET',
            'FIREBASE_MESSAGING_SENDER_ID',
            'FIREBASE_APP_ID'
          ],
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
