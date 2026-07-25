import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, Clock, ArrowUp } from 'lucide-react-native';

import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost?.split(':')[0] || 'localhost';
const DEFAULT_API_URL = `http://${localhost}:3000`;
const API_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

export default function SessionScreen() {
  const router = useRouter();
  const { mode, topic, difficulty } = useLocalSearchParams<{ mode: string, topic: string, difficulty: string }>();
  const totalQuestions = 3; 
  
  const [messages, setMessages] = useState<any[]>([]);
  const [step, setStep] = useState(0);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => { 
    const t = setInterval(() => setSeconds((s) => s + 1), 1000); 
    return () => clearInterval(t); 
  }, []);

  const fetchAIResponse = async (currentMsgs: any[], currentStep: number) => {
    setThinking(true);
    setError(null);
    scrollToBottom();
    
    const currentQuestion = currentStep + 1;
    const isFinal = currentQuestion > totalQuestions;
    const conversationHistory = currentMsgs.map(m => ({
      role: m.from === 'user' ? 'user' : 'assistant',
      content: m.text
    }));
    
    const payloadHistory = isFinal ? conversationHistory : conversationHistory.slice(-2);
    const endpoint = mode === 'mentor' ? '/mentor' : '/interview';
    const payload = mode === 'mentor' 
      ? { topic, difficulty, conversationHistory: payloadHistory, currentQuestion }
      : { role: topic, conversationHistory: payloadHistory, currentQuestion };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      
      if (data.success === false) {
        throw new Error(data.error);
      }

      if (data.completed && data.report) {
        router.replace({
          pathname: '/results',
          params: { mode, topic, report: JSON.stringify(data.report) }
        });
      } else if (data.response) {
        const appendedMsgs: any[] = [];
        if (data.response.explanation) {
          appendedMsgs.push({ from: 'gemma', text: data.response.explanation });
        }
        if (data.response.evaluation || data.response.feedback) {
          const feedbackText = [data.response.evaluation, data.response.feedback].filter(Boolean).join('\n\n');
          appendedMsgs.push({ from: 'gemma', kind: 'feedback', text: feedbackText, verdict: 'partial' });
        }
        if (data.response.question) {
          appendedMsgs.push({ from: 'gemma', text: data.response.question });
        }
        setMessages([...currentMsgs, ...appendedMsgs]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Network error. Please check the server.');
    } finally {
      setThinking(false);
      scrollToBottom();
    }
  };

  useEffect(() => { 
    fetchAIResponse([], 0);
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  async function handleSend() {
    if (!input.trim() || thinking) return;
    const userMsg = { from: 'user', text: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    scrollToBottom();
    
    const nextStep = step + 1;
    setStep(nextStep);
    await fetchAIResponse(newMessages, nextStep);
  }

  async function handleRetry() {
    await fetchAIResponse(messages, step);
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const progressPct = Math.min(100, (step / totalQuestions) * 100);

  const renderFooter = () => (
    <View className="pb-4">
      {thinking && <TypingBubble />}
      {error && (
        <View className="flex-row justify-start mt-2">
          <View className="max-w-[85%]">
            <View className="flex-row items-center gap-1.5 mb-2">
              <View className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <Text className="font-mono text-[10px] text-red-500 tracking-widest uppercase">System Error</Text>
            </View>
            <View className="px-4 py-3 bg-surfaceAlt rounded-2xl rounded-tl-sm border-l-2 border-red-500">
              <Text className="text-[15px] text-textPrimary leading-6">{error}</Text>
              <TouchableOpacity onPress={handleRetry} className="mt-4 bg-red-500/10 border border-red-500/30 py-2 rounded-lg items-center">
                <Text className="text-red-500 font-semibold text-[14px]">Retry Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView 
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="px-5 py-4 border-b border-border bg-surface">
          <View className="flex-row items-center justify-between mb-3">
            <TouchableOpacity onPress={() => router.replace('/home')} className="p-1">
              <X size={20} color="#A1A1AA" />
            </TouchableOpacity>
            <Text className="font-mono text-[13px] text-textSecondary uppercase tracking-wider">
              Question {Math.min(step, totalQuestions)}/{totalQuestions}
            </Text>
            <View className="flex-row items-center gap-1.5 bg-surfaceAlt px-2 py-1 rounded-md">
              <Clock size={13} color="#A1A1AA" />
              <Text className="font-mono text-[13px] text-textSecondary">{mm}:{ss}</Text>
            </View>
          </View>
          <View className="h-1.5 w-full rounded-full bg-border overflow-hidden">
            <View 
              className="h-full bg-accent rounded-full transition-all" 
              style={{ width: `${progressPct}%` }} 
            />
          </View>
        </View>

        <FlatList 
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => <Bubble msg={item} />}
          contentContainerStyle={{ padding: 20, paddingBottom: 10, gap: 20 }}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />

        <View className="px-5 py-3 border-t border-border bg-bg">
          <View className="flex-row items-end gap-2 px-1 py-1 bg-surface border border-border rounded-3xl">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Type your answer…"
              placeholderTextColor="#71717A"
              className="flex-1 bg-transparent text-textPrimary px-4 py-3 text-[15px]"
              multiline
              maxLength={500}
              style={{ minHeight: 45, maxHeight: 120 }}
            />
            <TouchableOpacity 
              disabled={!input.trim() || thinking} 
              onPress={handleSend}
              className={`w-10 h-10 mb-1 rounded-full items-center justify-center mr-1 ${
                input.trim() && !thinking ? 'bg-accent' : 'bg-accent/40'
              }`}
            >
              <ArrowUp size={20} color={input.trim() && !thinking ? '#09090B' : '#00000080'} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ msg }: { msg: { from: string; kind?: string; text: string; verdict?: string } }) {
  const isUser = msg.from === 'user';
  
  if (isUser) {
    return (
      <View className="flex-row justify-end">
        <View className="max-w-[80%] px-4 py-3 bg-card border border-border rounded-2xl rounded-tr-sm">
          <Text className="text-[15px] text-textPrimary leading-6">{msg.text}</Text>
        </View>
      </View>
    );
  }

  const verdictColor = msg.verdict === 'good' ? '#22C55E' : msg.verdict === 'partial' ? '#EAB308' : '#F97316';
  
  return (
    <View className="flex-row justify-start">
      <View className="max-w-[85%]">
        <View className="flex-row items-center gap-1.5 mb-2">
          <View className="w-1.5 h-1.5 rounded-full bg-accent" />
          <Text className="font-mono text-[10px] text-accent tracking-widest uppercase">Gemma</Text>
        </View>
        <View 
          className="px-4 py-3 bg-surfaceAlt rounded-2xl rounded-tl-sm border-l-2"
          style={{ borderLeftColor: msg.kind === 'feedback' ? verdictColor : '#F97316' }}
        >
          <Text className="text-[15px] text-textPrimary leading-6">{msg.text}</Text>
        </View>
      </View>
    </View>
  );
}

function TypingBubble() {
  return (
    <View className="flex-row justify-start">
      <View className="max-w-[85%]">
        <View className="flex-row items-center gap-1.5 mb-2">
          <View className="w-1.5 h-1.5 rounded-full bg-accent" />
          <Text className="font-mono text-[10px] text-accent tracking-widest uppercase">Gemma</Text>
        </View>
        <View className="px-4 py-4 bg-surfaceAlt rounded-2xl rounded-tl-sm border-l-2 border-accent flex-row items-center gap-1.5">
          <View className="w-1.5 h-1.5 rounded-full bg-textMuted opacity-50" />
          <View className="w-1.5 h-1.5 rounded-full bg-textMuted opacity-50" />
          <View className="w-1.5 h-1.5 rounded-full bg-textMuted opacity-50" />
        </View>
      </View>
    </View>
  );
}
