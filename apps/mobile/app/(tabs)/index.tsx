import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { router, useFocusEffect } from 'expo-router';

const QUESTIONS = [
  { q: 'can I go out tonight?',    a: 'yes! 🍻',         bg: Colors.dark,      fg: '#fff'              },
  { q: 'will I make end of term?', a: 'looking good 📅', bg: Colors.accent,    fg: '#fff'              },
  { q: 'how am I vs last week?',   a: '↓ 18% 📉',        bg: Colors.tint,      fg: Colors.dark         },
  { q: 'anything I should know?',  a: 'nope ✨',          bg: Colors.cardWhite, fg: Colors.accentDark, border: true },
];

function getDayLabel() {
  const now = new Date();
  const day = now.toLocaleDateString('en-GB', { weekday: 'short' }).toLowerCase();
  return `${day} · week 3 of term`;
}

export default function HomeScreen() {
  const [name, setName] = useState('');
  const [balanceVisible, setBalanceVisible] = useState(false);
  // null = not checked yet, so we render neither the balance nor the prompt.
  const [hasBank, setHasBank] = useState<boolean | null>(null);
  const syncStarted = useRef(false);

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single();

      if (data?.full_name) {
        setName(data.full_name.split(' ')[0]);
      }
    }
    loadUser();
  }, []);

  // Re-checked on every focus so returning from connect-bank swaps the
  // prompt for the balance strip without a reload.
  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function checkBankConnection() {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // RLS also scopes this to auth.uid(); the filter is belt-and-braces.
        const { data: connection } = await supabase
          .from('bank_connections')
          .select('id')
          .eq('user_id', session.user.id)
          .limit(1)
          .maybeSingle();

        if (!active) return;
        setHasBank(!!connection);

        // Only sync once per app session, not on every tab switch.
        if (connection && !syncStarted.current) {
          syncStarted.current = true;
          supabase.functions.invoke('fetch-transactions', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }).then(() => {
            supabase.functions.invoke('categorise-transactions', {
              headers: { Authorization: `Bearer ${session.access_token}` },
            }).catch(() => {});
          }).catch(() => {});
        }
      }

      checkBankConnection();
      return () => { active = false; };
    }, [])
  );

  const firstName = name || 'there';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header row */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>hi {firstName} 👋</Text>
            <Text style={styles.dayLabel}>{getDayLabel()}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>C</Text>
          </View>
        </View>

        {/* Question cards */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>your week so far</Text>
          <View style={styles.cards}>
            {QUESTIONS.map((item) => (
              <TouchableOpacity
                key={item.q}
                style={[styles.card, { backgroundColor: item.bg }, item.border && styles.cardBorder]}
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/ask-cait')}>
                <Text style={[styles.cardQuestion, { color: item.fg }]}>{item.q}</Text>
                <Text style={[styles.cardAnswer, { color: item.fg }]}>{item.a}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* No bank linked yet — prompt takes the balance strip's place */}
        {hasBank === false && (
          <View style={styles.balanceWrap}>
            <TouchableOpacity
              style={styles.connectCard}
              onPress={() => router.push('/(auth)/connect-bank')}
              activeOpacity={0.85}>
              <View style={styles.connectMain}>
                <Text style={styles.connectEyebrow}>no bank linked</Text>
                <Text style={styles.connectTitle}>connect your bank</Text>
                <Text style={styles.connectSub}>read-only. takes about a minute.</Text>
              </View>
              <View style={styles.connectArrow}>
                <Text style={styles.connectArrowText}>→</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Balance strip */}
        {hasBank === true && (
        <View style={styles.balanceWrap}>
          {balanceVisible ? (
            <View style={styles.balanceRevealed}>
              <View>
                <Text style={styles.balanceEyebrow}>left this week</Text>
                <View style={styles.balanceRow}>
                  <Text style={styles.balancePound}>£47</Text>
                  <Text style={styles.balancePence}>.20</Text>
                </View>
                <Text style={styles.balanceSub}>of £165 · resets sunday</Text>
              </View>
              <TouchableOpacity onPress={() => setBalanceVisible(false)}>
                <Text style={styles.hideLabel}>hide 👁</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.balanceHidden} onPress={() => setBalanceVisible(true)} activeOpacity={0.8}>
              <View style={styles.balanceHiddenLeft}>
                <Text style={styles.balanceStars}>✦ ✦ ✦</Text>
                <Text style={styles.balanceHiddenLabel}>show me the number</Text>
              </View>
              <Text style={styles.eyeIcon}>👁</Text>
            </TouchableOpacity>
          )}
        </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 32 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
  },
  greeting: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 17,
    letterSpacing: -0.5,
    color: Colors.dark,
  },
  dayLabel: {
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 15,
    color: '#fff',
  },

  section: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionLabel: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 10.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: 9,
  },
  cards: { gap: 9 },
  card: {
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardBorder: {
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  cardQuestion: {
    fontFamily: Fonts.sansBold,
    fontSize: 13.5,
    lineHeight: 18,
    flex: 1,
  },
  cardAnswer: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 14,
    flexShrink: 0,
  },

  balanceWrap: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },

  connectCard: {
    backgroundColor: Colors.accent,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  connectMain: { flex: 1 },
  connectEyebrow: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 10.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  connectTitle: {
    fontFamily: Fonts.black,
    fontSize: 20,
    letterSpacing: -0.6,
    color: '#fff',
  },
  connectSub: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 3,
  },
  connectArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectArrowText: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 16,
    color: '#fff',
  },
  balanceHidden: {
    backgroundColor: Colors.cardWhite,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceHiddenLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  balanceStars: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 16,
    letterSpacing: 4,
    color: Colors.textMuted,
  },
  balanceHiddenLabel: {
    fontFamily: Fonts.sansBold,
    fontSize: 12,
    color: Colors.textMuted,
  },
  eyeIcon: { fontSize: 17 },

  balanceRevealed: {
    backgroundColor: Colors.dark,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  balanceEyebrow: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 10.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#c4a898',
    marginBottom: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  balancePound: {
    fontFamily: Fonts.black,
    fontSize: 36,
    color: '#fff',
    letterSpacing: -1.5,
    lineHeight: 40,
  },
  balancePence: {
    fontFamily: Fonts.black,
    fontSize: 20,
    color: '#c4a898',
    letterSpacing: -0.5,
  },
  balanceSub: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 3,
  },
  hideLabel: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 11,
    color: '#c4a898',
    letterSpacing: 0.3,
  },
});
