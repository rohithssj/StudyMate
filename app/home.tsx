import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, Briefcase, ArrowUpRight } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();

  const handleSelectMode = (mode: string) => {
    router.push({ pathname: '/setup', params: { mode } });
  };

  return (
    <View className="flex-1 bg-bg px-6 pt-20 pb-10">
      <View className="mb-10">
        <Text className="text-[11px] tracking-widest uppercase text-textMuted font-mono mb-2">Welcome back</Text>
        <Text className="text-2xl font-medium text-textPrimary leading-8">Your Personal<Text>{"\n"}</Text>AI Mentor</Text>
      </View>

      <View className="flex-col gap-4">
        <ModeCard 
          icon={<BookOpen size={20} color="#F97316" />} 
          title="Mentor Mode" 
          desc="Learn concepts interactively through adaptive questioning." 
          onClick={() => handleSelectMode('mentor')} 
        />
        <ModeCard 
          icon={<Briefcase size={20} color="#F97316" />} 
          title="Interview Mode" 
          desc="Practice real technical interviews with AI." 
          onClick={() => handleSelectMode('interview')} 
        />
      </View>

      <View className="mt-auto pt-8 flex-row items-center justify-center gap-2">
        <View className="w-1.5 h-1.5 rounded-full bg-accent" />
        <Text className="text-[11px] text-textMuted font-mono">Teach → Evaluate → Adapt → Improve</Text>
      </View>
    </View>
  );
}

interface ModeCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}

function ModeCard({ icon, title, desc, onClick }: ModeCardProps) {
  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={onClick} 
      className="w-full p-5 flex-row items-start gap-4 bg-surface border border-border rounded-2xl"
    >
      <View className="flex items-center justify-center shrink-0 w-10 h-10 rounded-xl bg-accent/10">
        {icon}
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-[15px] font-medium text-textPrimary">{title}</Text>
          <ArrowUpRight size={16} color="#F97316" />
        </View>
        <Text className="text-[13px] text-textSecondary leading-5">{desc}</Text>
      </View>
    </TouchableOpacity>
  );
}
