import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { periodStart } from '@/lib/budget-period';
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

type BudgetSummary = {
  budgeted: number; // pence
  spent: number; // pence, absolute value
  period: 'weekly' | 'monthly';
};

// Loads whichever budget is actually active and sums real spend against it
// — overall mode defaults to kind='spending' the same way Ask CAIT's schema
// prompt does; category mode sums only the categories that have a budget
// row, not every spending category, since that's what's actually being
// tracked. Returns null when the active mode has no budget set yet.
async function loadBudgetSummary(userId: string): Promise<BudgetSummary | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('active_budget_mode, category_budget_period')
    .eq('id', userId)
    .single();

  const mode = profile?.active_budget_mode ?? 'overall';

  if (mode === 'overall') {
    const { data: overall } = await supabase
      .from('overall_budgets')
      .select('amount, period')
      .eq('user_id', userId)
      .maybeSingle();
    if (!overall) return null;

    const { data: rows } = await supabase
      .from('transactions')
      .select('amount, category:categories(kind)')
      .gte('transaction_at', periodStart(overall.period as 'weekly' | 'monthly'))
      .overrideTypes<{ amount: number; category: { kind: string } | null }[], { merge: false }>();

    const spent = (rows ?? [])
      .filter((t) => t.category?.kind === 'spending')
      .reduce((sum, t) => sum + t.amount, 0);

    return { budgeted: overall.amount, spent: Math.abs(spent), period: overall.period as 'weekly' | 'monthly' };
  }

  const period = (profile?.category_budget_period as 'weekly' | 'monthly') ?? 'weekly';
  const { data: budgetRows } = await supabase.from('budgets').select('category_id, amount').eq('user_id', userId);
  if (!budgetRows || budgetRows.length === 0) return null;

  const budgeted = budgetRows.reduce((sum, r) => sum + r.amount, 0);
  const categoryIds = new Set(budgetRows.map((r) => r.category_id));

  const { data: txRows } = await supabase
    .from('transactions')
    .select('amount, category_id')
    .gte('transaction_at', periodStart(period));

  const spent = (txRows ?? [])
    .filter((t) => t.category_id && categoryIds.has(t.category_id))
    .reduce((sum, t) => sum + t.amount, 0);

  return { budgeted, spent: Math.abs(spent), period };
}

export default function HomeScreen() {
  const [name, setName] = useState('');
  const [balanceVisible, setBalanceVisible] = useState(false);
  // null = not checked yet, so we render neither the balance nor the prompt.
  const [hasBank, setHasBank] = useState<boolean | null>(null);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [budgetChecked, setBudgetChecked] = useState(false);
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

        if (connection) {
          loadBudgetSummary(session.user.id).then((summary) => {
            if (!active) return;
            setBudgetSummary(summary);
            setBudgetChecked(true);
          });
        }

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

  // Derived display values for the real balance card — computed once per
  // render rather than inline in JSX, same reasoning as sections/filterLabel
  // in transactions.tsx being useMemo'd rather than recomputed ad hoc.
  const left = budgetSummary ? budgetSummary.budgeted - budgetSummary.spent : 0;
  const isOver = left < 0;
  const displayPence = Math.abs(left);
  const leftPounds = Math.floor(displayPence / 100);
  const leftPence = displayPence % 100;
  const periodWord = budgetSummary?.period === 'monthly' ? 'month' : 'week';
  const resetLabel = budgetSummary?.period === 'monthly' ? 'resets on the 1st' : 'resets monday';
  const percentSpent = budgetSummary && budgetSummary.budgeted > 0
    ? Math.round((budgetSummary.spent / budgetSummary.budgeted) * 100)
    : 0;
  const progressWidth = Math.min(100, percentSpent);
  const statusWord = isOver ? 'over budget' : percentSpent >= 90 ? 'cutting it close' : 'on track';

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

        {/* Bank connected but the active mode has no budget yet */}
        {hasBank === true && budgetChecked && !budgetSummary && (
          <View style={styles.balanceWrap}>
            <TouchableOpacity
              style={styles.budgetEmptyCard}
              onPress={() => router.push('/budget')}
              activeOpacity={0.85}>
              <View style={styles.budgetEmptyMain}>
                <Text style={styles.budgetEmptyTitle}>let's set a budget.</Text>
                <Text style={styles.budgetEmptySub}>one number, or split by category — takes a minute.</Text>
              </View>
              <View style={styles.budgetEmptyPill}>
                <Text style={styles.budgetEmptyPillText}>create budget →</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Balance strip — real spend vs the active budget */}
        {hasBank === true && budgetSummary && (
        <View style={styles.balanceWrap}>
          {balanceVisible ? (
            <View style={styles.balanceRevealed}>
              <View style={styles.balanceMain}>
                <View style={styles.balanceTopRow}>
                  <Text style={styles.balanceEyebrow}>{isOver ? `over this ${periodWord}` : `left this ${periodWord}`}</Text>
                  <TouchableOpacity onPress={() => router.push('/budget')} hitSlop={8}>
                    <Text style={styles.editBudgetLink}>edit budget</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.balanceRow}>
                  <Text style={styles.balancePound}>£{leftPounds}</Text>
                  <Text style={styles.balancePence}>.{leftPence.toString().padStart(2, '0')}</Text>
                </View>
                <View style={styles.balanceSubRow}>
                  <Text style={styles.balanceSub}>of £{Math.round(budgetSummary.budgeted / 100)} · {resetLabel}</Text>
                  <TouchableOpacity onPress={() => setBalanceVisible(false)}>
                    <Text style={styles.hideLabel}>hide 👁</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progressWidth}%` }, isOver && styles.progressFillOver]} />
                </View>
                <Text style={styles.progressLabel}>{percentSpent}% of the {periodWord} spent · {statusWord}</Text>
              </View>
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
  },
  balanceMain: { gap: 3 },
  balanceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceEyebrow: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 10.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#c4a898',
  },
  editBudgetLink: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 11,
    color: '#c4a898',
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
  balanceSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 3,
    marginBottom: 10,
  },
  balanceSub: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
  },
  hideLabel: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 11,
    color: '#c4a898',
    letterSpacing: 0.3,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  progressFillOver: {
    backgroundColor: '#A05840',
  },
  progressLabel: {
    fontFamily: Fonts.sans,
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 6,
  },

  budgetEmptyCard: {
    backgroundColor: Colors.dark,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  budgetEmptyMain: { flex: 1 },
  budgetEmptyTitle: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 15,
    color: '#fff',
  },
  budgetEmptySub: {
    fontFamily: Fonts.sans,
    fontSize: 12.5,
    color: 'rgba(247,244,240,0.6)',
    marginTop: 3,
  },
  budgetEmptyPill: {
    backgroundColor: Colors.accent,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetEmptyPillText: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 12.5,
    color: '#fff',
  },
});
