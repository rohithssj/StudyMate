import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, Clock, ArrowUp } from 'lucide-react-native';

function mockGemmaTurn({ mode, topic, step, count }: { mode: string; topic: string; step: number; count: number }) {
  if (step === 0) {
    return { 
      type: 'explain', 
      text: mode === 'mentor'
        ? `${topic} — quick primer: think of it as the mechanism that lets a component keep state across re-renders without a class. We'll build from a definition, then I'll test you.`
        : `Let's start the ${topic} interview. I'll ask ${count} questions, gauge your answers, and adjust difficulty as we go.` 
    };
  }
  return { 
    type: 'question', 
    text: mode === 'mentor'
      ? `Question ${step}/${count} — What problem does this solve that plain variables inside a function body can't?`
      : `Question ${step}/${count} — Walk me through how you'd approach this.` 
  };
}

function mockFeedback() {
  const good = Math.random() > 0.35;
  return good
    ? { verdict: 'good', text: 'Solid — you nailed the core mechanism. One nuance to sharpen: mention why the reference stays stable across renders.' }
    : { verdict: 'partial', text: 'Partially there. You have the right direction, but the explanation of why it persists needs more precision.' };
}

export default function SessionScreen() {
  const router = useRouter();
  const { mode, topic, difficulty, count } = useLocalSearchParams<{ mode: string, topic: string, difficulty: string, count: string }>();
  const totalQuestions = parseInt(count || '5', 10);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [step, setStep] = useState(0);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => { 
    const t = setInterval(() => setSeconds((s) => s + 1), 1000); 
    return () => clearInterval(t); 
  }, []);

  useEffect(() => { 
    pushGemmaTurn(0); 
  }, []);

  function pushGemmaTurn(nextStep: number) {
    setThinking(true);
    setTimeout(() => {
      const turn = mockGemmaTurn({ mode, topic, step: nextStep, count: totalQuestions });
      setMessages((m) => [...m, { from: 'gemma', kind: turn.type, text: turn.text }]);
      setThinking(false);
      if (turn.type === 'explain') {
        setTimeout(() => pushGemmaTurn(1), 500);
      }
    }, 900);
  }

  function handleSend() {
    if (!input.trim()) return;
    setMessages((m) => [...m, { from: 'user', text: input }]);
    setInput('');
    setThinking(true);
    
    setTimeout(() => {
      const fb = mockFeedback();
      setMessages((m) => [...m, { from: 'gemma', kind: 'feedback', verdict: fb.verdict, text: fb.text }]);
      setThinking(false);
      
      if (step + 1 >= totalQuestions) {
        setTimeout(() => {
          router.push({
            pathname: '/results',
            params: { mode, topic }
          });
        }, 900);
      } else {
        setStep((s) => s + 1);
        setTimeout(() => pushGemmaTurn(step + 2), 700);
      }
    }, 1100);
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
