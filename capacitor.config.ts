import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.stephenraj.kadaikanakku',
  appName: 'Kadai Kanakku',
  webDir: '.output/public',
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000, // Splash screen 1 second dhan irukkum (kammi pannalam)
      launchAutoHide: true,
      backgroundColor: "#16A34A", // Unga green color
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
