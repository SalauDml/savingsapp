import { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const SUGGESTIONS = [
  '"how much did I spend on coffee last month?"',
  '"will I make it to end of term?"',
  '"what\'s been eating my budget?"',
  '"compare this week to last week."',
];

type Message = {
  id: string;
  role: 'user' | 'cait';
  text: string;
};

export default function AskCaitScreen() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  function handleSuggestion(s: string) {
    setQuery(s.replace(/^"|"$/g, ''));
  }

  async function handleSend() {
    const question = query.trim();
    if (!question || loading) return;


    const recentHistory = messages.slice(-6).map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text
    }))

    setQuery('');
    setMessages((prev) => [...prev, { id: `${Date.now()}-user`, role: 'user', text: question }]);
    setLoading(true);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-cait`, role: 'cait', text: 'You need to be signed in for me to answer that.' },
      ]);
      setLoading(false);
      return;
    }

    // Same shape as fetch-transactions / categorise-transactions on the home
    // screen: the user's own access token goes in the Authorization header,
    // so the Edge Function's Supabase client — and everything it calls
    // through it, including execute_cait_query via RPC — carries their JWT
    // the whole way down.
    const { data, error } = await supabase.functions.invoke('ask-cait', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { question, history: recentHistory },
    });

    const answer = error
      ? 'Something went wrong on my end — try asking again in a moment.'
      : (data?.answer ?? "I couldn't work that one out — try asking a different way.");

    setMessages((prev) => [...prev, { id: `${Date.now()}-cait`, role: 'cait', text: answer }]);
    setLoading(false);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {messages.length === 0 ? (
            <>
              <Text style={styles.eyebrow}>ask cait</Text>
              <Text style={styles.heading}>what do you{'\n'}want to know?</Text>

              <Text style={styles.tryLabel}>try asking</Text>
              <View style={styles.suggestions}>
                {SUGGESTIONS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={styles.suggestion}
                    activeOpacity={0.75}
                    onPress={() => handleSuggestion(s)}>
                    <Text style={styles.suggestionText}>{s}</Text>
                    <Text style={styles.suggestionArrow}>→</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <View style={styles.thread}>
              {messages.map((m) => (
                <View
                  key={m.id}
                  style={[styles.bubbleRow, m.role === 'user' ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
                  {m.role === 'cait' && <Text style={styles.caitBadge}>CAIT</Text>}
                  <View style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleCait]}>
                    <Text style={[styles.bubbleText, m.role === 'user' && styles.bubbleTextUser]}>
                      {m.text}
                    </Text>
                  </View>
                </View>
              ))}

              {loading && (
                <View style={[styles.bubbleRow, styles.bubbleRowLeft]}>
                  <Text style={styles.caitBadge}>CAIT</Text>
                  <View style={[styles.bubble, styles.bubbleCait]}>
                    <Text style={styles.bubbleText}>cait is thinking...</Text>
                  </View>
                </View>
              )}
            </View>
          )}

        </ScrollView>

        {/* Input bar */}
        <View style={styles.inputBar}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>C</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="ask anything about your money..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            editable={!loading}
          />
          <TouchableOpacity style={styles.sendBtn} activeOpacity={0.8} onPress={handleSend} disabled={loading}>
            <Text style={styles.sendArrow}>→</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },

  eyebrow: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: 8,
  },
  heading: {
    fontFamily: Fonts.black,
    fontSize: 30,
    lineHeight: 32,
    letterSpacing: -1,
    color: Colors.dark,
    marginBottom: 28,
  },

  tryLabel: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 10.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: 10,
  },
  suggestions: { gap: 10 },
  suggestion: {
    backgroundColor: Colors.cardWhite,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  suggestionText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.dark,
    flex: 1,
    fontStyle: 'italic',
  },
  suggestionArrow: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    color: Colors.textMuted,
    marginLeft: 8,
  },

  thread: { gap: 14 },
  bubbleRow: { maxWidth: '85%' },
  bubbleRowLeft: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubbleRowRight: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  caitBadge: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 9.5,
    letterSpacing: 0.5,
    color: '#fff',
    backgroundColor: Colors.accentDark,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 5,
    overflow: 'hidden',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  bubbleUser: {
    backgroundColor: Colors.dark,
    borderBottomRightRadius: 4,
  },
  bubbleCait: {
    backgroundColor: Colors.cardWhite,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 19,
    color: Colors.dark,
  },
  bubbleTextUser: {
    color: '#fff',
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 22,
    paddingTop: 10,
    gap: 10,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.rule,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 15,
    color: '#fff',
  },
  input: {
    flex: 1,
    height: 44,
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.dark,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendArrow: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    color: '#fff',
  },
});
