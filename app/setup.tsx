import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

const difficultyMap: Record<string, string> = {
  Easy: '#22C55E',
  Medium: '#EAB308',
  Hard: '#EF4444',
};

const mentorTopicsSeed = ['React Hooks', 'Java OOP', 'DBMS', 'Operating Systems', 'System Design'];
const interviewTypes = ['Frontend', 'React', 'Java Backend', 'DSA', 'System Design', 'Behavioral'];

export default function SetupScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode: string }>();
  const isMentor = mode === 'mentor';
  
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [count, setCount] = useState(5);
  
  const chips = isMentor ? mentorTopicsSeed : interviewTypes;

  const handleStart = () => {
    router.push({
      pathname: '/session',
      params: { mode, topic, difficulty, count: count.toString() }
    });
  };

  return (
    <View className="flex-1 bg-bg">
      <View className="flex-row items-center gap-3 px-6 pt-16 pb-4 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <ChevronLeft size={24} color="#A1A1AA" />
        </TouchableOpacity>
        <Text className="text-[17px] font-medium text-textPrimary">
          {isMentor ? 'Mentor Mode' : 'Interview Mode'}
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6">
        <View className="mb-8">
          <Text className="text-[11px] tracking-widest uppercase text-textMuted font-mono mb-3">
            {isMentor ? 'Topic' : 'Interview Type'}
          </Text>
          <TextInput
            value={topic}
            onChangeText={setTopic}
            placeholder={isMentor ? 'e.g. React Hooks' : 'e.g. Frontend'}
            placeholderTextColor="#71717A"
            className="w-full bg-surface border border-border rounded-xl text-textPrimary px-4 py-3.5 text-[15px]"
          />
          <View className="flex-row flex-wrap gap-2 mt-4">
            {chips.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setTopic(c)}
                className={`px-3.5 py-2 rounded-full border ${
                  topic === c 
                    ? 'border-accent/40 bg-accent/10' 
                    : 'border-border bg-transparent'
                }`}
              >
                <Text className={`text-[13px] ${topic === c ? 'text-accent' : 'text-textSecondary'}`}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {isMentor && (
          <>
            <View className="mb-8">
              <Text className="text-[11px] tracking-widest uppercase text-textMuted font-mono mb-3">
                Difficulty
              </Text>
              <View className="flex-row gap-3">
                {Object.keys(difficultyMap).map((d) => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setDifficulty(d)}
                    className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl border ${
                      difficulty === d 
                        ? 'border-accent/40 bg-accent/10' 
                        : 'border-border bg-surface'
                    }`}
                  >
                    <View 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: difficultyMap[d] }} 
                    />
                    <Text className={`text-[14px] ${difficulty === d ? 'text-accent' : 'text-textSecondary'}`}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="mb-8">
              <Text className="text-[11px] tracking-widest uppercase text-textMuted font-mono mb-3">
                Questions: {count}
              </Text>
              <View className="flex-row gap-3">
                {[3, 5, 8, 10].map((num) => (
                  <TouchableOpacity
                    key={num}
                    onPress={() => setCount(num)}
                    className={`flex-1 items-center justify-center py-2.5 rounded-lg border ${
                      count === num ? 'border-accent bg-accent/20' : 'border-border bg-surface'
                    }`}
                  >
                    <Text className={`text-[14px] ${count === num ? 'text-accent font-medium' : 'text-textSecondary'}`}>
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View className="px-6 pb-10 pt-2">
        <TouchableOpacity
          disabled={!topic}
          onPress={handleStart}
          className={`w-full py-4 rounded-xl items-center justify-center ${
            topic ? 'bg-accent opacity-100' : 'bg-accent/50 opacity-50'
          }`}
        >
          <Text className="text-[#09090B] font-semibold text-[16px]">Start Session</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
