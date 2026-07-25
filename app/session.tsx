import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Animated } from 'react-native';
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
  const totalQuestions = 3; // Enforce exactly 3 questions per requirements
  
  const [messages, setMessages] = useState<any[]>([]);
  const [step, setStep] = useState(0);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => { 
    const t = setInterval(() => setSeconds((s) => s + 1), 1000); 
    return () => clearInterval(t); 
  }, []);

  const fetchAIResponse = async (currentMsgs: any[], currentStep: number) => {
    setThinking(true);
    setError(null);
    
    const currentQuestion = currentStep + 1;
    const isFinal = currentQuestion > totalQuestions;
    const conversationHistory = currentMsgs.map(m => ({
      role: m.from === 'user' ? 'user' : 'assistant',
      content: m.text
    }));
    
    const payloadHistory = isFinal ? conversationHistory : conversationHistory.slice(-4);
    const endpoint = mode === 'mentor' ? '/mentor' : '/interview';
    const payload = mode === 'mentor' 
      ? { topic, difficulty, conversationHistory: payloadHistory, currentQuestion }
      : { role: topic, difficulty, conversationHistory: payloadHistory, currentQuestion };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      
      if (data.success === false) {
        throw new Error(data.error || 'The AI returned an invalid response. Please try again.');
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
    }
  };

  useEffect(() => { 
    fetchAIResponse([], 0);
  }, []);

  async function handleSend() {
    if (!input.trim() || thinking) return;
    const userMsg = { from: 'user', text: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
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

  return (
    <View className="flex-1 bg-bg">
      <View className="pt-16 px-5 pb-3 border-b border-border bg-surface">
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

      <ScrollView 
        ref={scrollViewRef}
        className="flex-1 px-5 pt-5 pb-20"
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        <View className="flex-col gap-5 pb-20">
          {messages.map((m, i) => <Bubble key={i} msg={m} />)}
          {thinking && <TypingBubble />}
          {error && (
            <View className="flex-row justify-start">
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
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-3 border-t border-border bg-bg">
        <View className="flex-row items-center gap-2 px-1 py-1 bg-surface border border-border rounded-full">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type your answer…"
            placeholderTextColor="#71717A"
            className="flex-1 bg-transparent text-textPrimary px-4 py-3 text-[15px]"
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            disabled={!input.trim()} 
            onPress={handleSend}
            className={`w-10 h-10 rounded-full items-center justify-center mr-1 ${
              input.trim() ? 'bg-accent' : 'bg-accent/40'
            }`}
          >
            <ArrowUp size={20} color={input.trim() ? '#09090B' : '#00000080'} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
