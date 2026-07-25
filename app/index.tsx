import { useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import { useRouter } from 'expo-router';

export default function SplashScreen() {
  const router = useRouter();
  
  // Minimal placeholder animation hooks could go here.
  // We'll rely on NativeWind for basic styling and simple React Native animation if needed.

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace('/home');
    }, 2000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <View className="flex-1 items-center justify-center bg-bg px-8">
      <View className="relative flex flex-col items-center">
        <View className="flex items-center justify-center mb-6 w-16 h-16 rounded-xl border border-accent/30 bg-accent/10">
          <View className="w-2.5 h-2.5 rounded-full bg-accent" />
        </View>
        <Text className="text-[26px] font-medium text-textPrimary tracking-tight">
          Mentor<Text className="text-accent">AI</Text>
        </Text>
        <View className="mt-3 h-px w-40 overflow-hidden bg-border relative">
          <View className="absolute inset-0 bg-accent w-full" />
        </View>
        <Text className="text-[11px] mt-4 tracking-widest uppercase text-textMuted font-mono">
          Powered by Gemma 4
        </Text>
      </View>
    </View>
  );
}
