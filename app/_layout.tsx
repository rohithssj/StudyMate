import { Stack } from 'expo-router';
import './global.css';
import { View } from 'react-native';

export default function Layout() {
  return (
    <View className="flex-1 bg-bg">
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#09090B' } }} />
    </View>
  );
}
