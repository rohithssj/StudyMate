import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, AlertCircle, Sparkles, RotateCcw } from 'lucide-react-native';

const mockReport = {
  score: 78,
  strengths: ['Clear grasp of core concept', 'Answers structured logically'],
  improve: ['Missed edge cases under pressure', 'Explanations run long — tighten to key point first'],
  recommendations: ['Revisit closures before your next session', 'Practice explaining answers in under 30s'],
};

export default function ResultsScreen() {
  const router = useRouter();
  const { mode, topic } = useLocalSearchParams<{ mode: string, topic: string }>();
  const r = mockReport;

  return (
    <View className="flex-1 bg-bg">
      <ScrollView className="flex-1">
        <View className="px-6 pt-20 pb-8 text-center items-center">
          <Text className="font-mono text-[11px] text-textMuted tracking-widest uppercase mb-2">
            {mode === 'interview' ? 'Interview report' : 'Learning report'}
          </Text>
          <Text className="text-2xl font-medium text-textPrimary text-center">
            {topic}
          </Text>
        </View>

        <View className="flex items-center justify-center mb-10">
          <ScoreRing value={r.score} />
        </View>

        <View className="px-6 flex-col gap-5 pb-10">
          <ReportCard 
            icon={<CheckCircle2 size={18} color="#22C55E" />} 
            color="#22C55E" 
            title="Strengths" 
            items={r.strengths} 
          />
          <ReportCard 
            icon={<AlertCircle size={18} color="#EAB308" />} 
            color="#EAB308" 
            title="Areas to improve" 
            items={r.improve} 
          />
          <ReportCard 
            icon={<Sparkles size={18} color="#F97316" />} 
            color="#F97316" 
            title="Recommendations" 
            items={r.recommendations} 
          />
        </View>
      </ScrollView>

      <View className="px-6 pb-10 pt-4 bg-bg border-t border-border">
        <TouchableOpacity 
          onPress={() => router.replace('/home')} 
          className="w-full py-4 bg-accent rounded-xl flex-row items-center justify-center gap-2"
        >
          <RotateCcw size={18} color="#09090B" />
          <Text className="text-[#09090B] font-semibold text-[16px]">Start new session</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ScoreRing({ value }: { value: number }) {
  // A simplified placeholder since SVG isn't cleanly available without react-native-svg
  // For standard React Native without heavy dependencies we can use a stylized view
  return (
    <View className="relative w-36 h-36 items-center justify-center rounded-full border-[8px] border-border">
      <View 
        className="absolute inset-0 rounded-full border-[8px] border-accent" 
        style={{ borderTopColor: 'transparent', borderRightColor: 'transparent', transform: [{ rotate: '-45deg' }] }}
      />
      <View className="absolute inset-0 flex-col items-center justify-center">
        <Text className="text-4xl font-semibold text-textPrimary">{value}</Text>
        <Text className="font-mono text-[11px] text-textMuted tracking-wider uppercase mt-1">score</Text>
      </View>
    </View>
  );
}

interface ReportCardProps {
  icon: React.ReactNode;
  color: string;
  title: string;
  items: string[];
}

function ReportCard({ icon, color, title, items }: ReportCardProps) {
  return (
    <View className="p-5 bg-card border border-border rounded-2xl">
      <View className="flex-row items-center gap-2.5 mb-4">
        {icon}
        <Text className="text-[15px] font-medium text-textPrimary">{title}</Text>
      </View>
      <View className="flex-col gap-3">
        {items.map((it: string, i: number) => (
          <View key={i} className="flex-row items-start gap-3">
            <Text style={{ color }} className="text-[16px] font-bold mt-[-2px]">–</Text>
            <Text className="flex-1 text-[14px] text-textSecondary leading-5">{it}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
