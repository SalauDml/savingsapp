import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { BudgetModeToggle, type BudgetMode } from '@/components/budget-mode-toggle';
import { BudgetPeriodChip, type BudgetPeriod } from '@/components/budget-period-chip';

type Category = { id: string; name: string };
type CategoryBudgetRow = { category_id: string; name: string; amount: number }; // amount in pence

const STEP = 500; // £5 per tap — no long-press-accelerate for v1.

// Deterministic so a category's dot doesn't change colour between renders
// or app opens — same idiom as transactions.tsx's MerchantIcon, which picks
// a background colour from charCodeAt rather than storing one.
const DOT_COLORS = [Colors.accent, '#5E8A5A', '#7C6BA8', '#B58A3A', '#8E7A4E', Colors.accentDark];
function dotColor(id: string): string {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return DOT_COLORS[sum % DOT_COLORS.length];
}

function poundsToPence(pounds: string): number {
  const n = parseInt(pounds, 10);
  return Number.isFinite(n) && n > 0 ? n * 100 : 0;
}

export default function BudgetScreen() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [mode, setMode] = useState<BudgetMode>('overall');
  const [overallHadRow, setOverallHadRow] = useState(false);
  const [overallAmount, setOverallAmount] = useState(''); // pounds, digits only
  const [overallPeriod, setOverallPeriod] = useState<BudgetPeriod>('weekly');

  const [categoryHadRows, setCategoryHadRows] = useState(false);
  const [categoryPeriod, setCategoryPeriod] = useState<BudgetPeriod>('weekly');
  const [categoryRows, setCategoryRows] = useState<CategoryBudgetRow[]>([]);
  const [spendingCategories, setSpendingCategories] = useState<Category[]>([]);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;
      setUserId(uid);

      const [
        { data: profile, error: profileError },
        { data: overall, error: overallError },
        { data: budgetRows, error: budgetRowsError },
        { data: cats, error: catsError },
      ] = await Promise.all([
        supabase.from('profiles').select('active_budget_mode, category_budget_period').eq('id', uid).single(),
        supabase.from('overall_budgets').select('amount, period').eq('user_id', uid).maybeSingle(),
        supabase.from('budgets').select('category_id, amount, category:categories(name)').eq('user_id', uid)
          .overrideTypes<{ category_id: string; amount: number; category: { name: string } | null }[], { merge: false }>(),
        // Uncategorised is a fallback bucket for the categoriser, not a real
        // spending target — excluded from the budget picker the same way
        // Ask CAIT's schema prompt already defaults away from it.
        supabase.from('categories').select('id, name').eq('kind', 'spending').neq('name', 'Uncategorised').order('name'),
      ]);

      // profile carries active_budget_mode, which `mode` below defaults to
      // 'overall' when this read fails — without stopping here, handleSave
      // would go on to unconditionally write that default back to profiles,
      // silently flipping the user's real stored mode on a transient
      // read failure they never saw.
      if (profileError) {
        console.log('profile load failed:', profileError.message);
        setLoadError(true);
        setLoading(false);
        return;
      }
      if (overallError) console.log('overall budget load failed:', overallError.message);
      if (budgetRowsError) console.log('category budgets load failed:', budgetRowsError.message);
      if (catsError) console.log('categories load failed:', catsError.message);

      if (profile) {
        setMode(profile.active_budget_mode as BudgetMode);
        setCategoryPeriod(profile.category_budget_period as BudgetPeriod);
      }
      if (overall) {
        setOverallHadRow(true);
        setOverallAmount(String(Math.round(overall.amount / 100)));
        setOverallPeriod(overall.period as BudgetPeriod);
      }
      const rows = (budgetRows ?? []).map((r) => ({
        category_id: r.category_id,
        name: r.category?.name ?? '?',
        amount: r.amount,
      }));
      setCategoryHadRows(rows.length > 0);
      setCategoryRows(rows);
      setSpendingCategories(cats ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const isNew = mode === 'overall' ? !overallHadRow : !categoryHadRows;

  const availableCategories = useMemo(
    () => spendingCategories.filter((c) => !categoryRows.some((r) => r.category_id === c.id)),
    [spendingCategories, categoryRows]
  );

  const allocatedTotal = useMemo(
    () => categoryRows.reduce((sum, r) => sum + r.amount, 0),
    [categoryRows]
  );

  function adjustRow(categoryId: string, delta: number) {
    setCategoryRows((rows) =>
      rows.map((r) =>
        r.category_id === categoryId
          ? { ...r, amount: Math.max(0, r.amount + delta) }
          : r
      )
    );
  }

  function addCategory(cat: Category) {
    setCategoryRows((rows) => [...rows, { category_id: cat.id, name: cat.name, amount: 0 }]);
    setAddCategoryOpen(false);
  }

  // Batch upsert on Save, not per-keystroke/per-tap — matches sign-up.tsx's
  // collect-then-submit pattern. No try/catch anywhere in this codebase's
  // Supabase calls: destructure { error }, log and bail, matching
  // transactions.tsx's handleSelectCategory exactly.
  async function handleSave() {
    if (!userId) return;
    setSaving(true);

    if (mode === 'overall') {
      const pence = poundsToPence(overallAmount);
      const { error: budgetError } = await supabase
        .from('overall_budgets')
        .upsert({ user_id: userId, amount: pence, period: overallPeriod }, { onConflict: 'user_id' });

      if (budgetError) {
        console.log('overall budget save failed:', budgetError.message);
        setSaving(false);
        return;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ active_budget_mode: 'overall' })
        .eq('id', userId);

      if (profileError) {
        console.log('active_budget_mode update failed:', profileError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: budgetError } = await supabase
        .from('budgets')
        .upsert(
          categoryRows.map((r) => ({ user_id: userId, category_id: r.category_id, amount: r.amount })),
          { onConflict: 'user_id,category_id' }
        );

      if (budgetError) {
        console.log('category budgets save failed:', budgetError.message);
        setSaving(false);
        return;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ active_budget_mode: 'category', category_budget_period: categoryPeriod })
        .eq('id', userId);

      if (profileError) {
        console.log('active_budget_mode update failed:', profileError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    router.back();
  }

  const canSave = mode === 'overall' ? poundsToPence(overallAmount) > 0 : categoryRows.length > 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.muted}>loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.muted}>couldn't load your budget — check your connection and try again.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.back} onPress={() => router.back()} hitSlop={10}>
              <Text style={styles.backIcon}>←</Text>
            </Pressable>
          </View>
          <Text style={styles.eyebrow}>you</Text>
          <Text style={styles.title}>{isNew ? 'set a budget.' : 'edit budget.'}</Text>

          <View style={styles.toggleWrap}>
            <BudgetModeToggle value={mode} onChange={setMode} />
          </View>

          {mode === 'overall' ? (
            <View style={styles.section}>
              <View style={styles.amountRow}>
                <Text style={styles.poundSign}>£</Text>
                <TextInput
                  style={styles.amountInput}
                  value={overallAmount}
                  onChangeText={(t) => setOverallAmount(t.replace(/[^0-9]/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  cursorColor={Colors.accent}
                  selectionColor={Colors.accent}
                />
              </View>

              <View style={styles.periodWrap}>
                <BudgetPeriodChip value={overallPeriod} onChange={setOverallPeriod} />
              </View>

              <Text style={styles.helper}>
                I'll track everything against this — no need to split it up.
              </Text>
            </View>
          ) : (
            <View style={styles.section}>
              <View style={styles.periodWrap}>
                <BudgetPeriodChip value={categoryPeriod} onChange={setCategoryPeriod} />
              </View>

              <View style={styles.rows}>
                {categoryRows.map((row) => (
                  <View key={row.category_id} style={styles.row}>
                    <View style={[styles.dot, { backgroundColor: dotColor(row.category_id) }]} />
                    <Text style={styles.rowName} numberOfLines={1}>{row.name}</Text>
                    <Pressable
                      style={styles.stepper}
                      onPress={() => adjustRow(row.category_id, -STEP)}
                      hitSlop={6}>
                      <Text style={styles.stepperText}>−</Text>
                    </Pressable>
                    <Text style={styles.rowAmount}>£{Math.round(row.amount / 100)}</Text>
                    <Pressable
                      style={styles.stepper}
                      onPress={() => adjustRow(row.category_id, STEP)}
                      hitSlop={6}>
                      <Text style={styles.stepperText}>+</Text>
                    </Pressable>
                  </View>
                ))}

                {availableCategories.length > 0 ? (
                  <Pressable style={styles.addRow} onPress={() => setAddCategoryOpen(true)}>
                    <Text style={styles.addRowText}>+ new category</Text>
                  </Pressable>
                ) : categoryRows.length > 0 ? (
                  <Text style={styles.allAddedNote}>all spending categories added</Text>
                ) : null}
              </View>

              {categoryRows.length > 0 && (
                <Text style={styles.allocated}>£{Math.round(allocatedTotal / 100)} allocated</Text>
              )}
            </View>
          )}

          <Pressable
            style={[styles.button, !canSave && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={!canSave || saving}>
            <Text style={styles.buttonText}>
              {saving ? 'saving…' : isNew ? 'save budget →' : 'save changes →'}
            </Text>
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Add-category sheet — same Modal/nested-Pressable pattern as the
          category picker in transactions.tsx: the inner Pressable's no-op
          onPress absorbs the tap so it never bubbles to the backdrop. */}
      <Modal
        visible={addCategoryOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setAddCategoryOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setAddCategoryOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>add a category</Text>
            <ScrollView style={styles.sheetList} showsVerticalScrollIndicator={false}>
              {availableCategories.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => addCategory(cat)}
                  style={({ pressed }) => [styles.sheetRow, pressed && styles.sheetRowPressed]}>
                  <Text style={styles.sheetRowText}>{cat.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 40,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { fontFamily: Fonts.sans, fontSize: 12, color: Colors.textMuted },

  header: { flexDirection: 'row', marginBottom: 14 },
  back: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 14,
    color: Colors.accentDark,
  },
  eyebrow: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: 3,
  },
  title: {
    fontFamily: Fonts.black,
    fontSize: 22,
    letterSpacing: -0.7,
    color: Colors.dark,
    marginBottom: 20,
  },

  toggleWrap: { marginBottom: 24 },

  section: { alignItems: 'center', marginBottom: 28 },

  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  poundSign: {
    fontFamily: Fonts.black,
    fontSize: 56,
    letterSpacing: -2,
    color: Colors.dark,
  },
  amountInput: {
    fontFamily: Fonts.black,
    fontSize: 64,
    letterSpacing: -3,
    color: Colors.dark,
    minWidth: 60,
    padding: 0,
  },

  periodWrap: { marginBottom: 16 },

  helper: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textMuted,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 250,
  },

  rows: { width: '100%', gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.cardWhite,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    paddingLeft: 14,
  },
  dot: { width: 9, height: 9, borderRadius: 4.5 },
  rowName: {
    flex: 1,
    fontFamily: Fonts.sansBold,
    fontSize: 13.5,
    color: Colors.dark,
  },
  stepper: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: Colors.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 15,
    color: Colors.dark,
  },
  rowAmount: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 13.5,
    color: Colors.dark,
    width: 38,
    textAlign: 'center',
  },
  addRow: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.rule,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  addRowText: {
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    color: Colors.accent,
  },
  allAddedNote: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 8,
  },
  allocated: {
    fontFamily: Fonts.sansBold,
    fontSize: 12.5,
    color: Colors.accentDark,
    marginTop: 14,
  },

  button: {
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 16,
    color: Colors.background,
  },

  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.cardWhite,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  sheetTitle: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 15,
    color: Colors.dark,
    marginBottom: 12,
  },
  sheetList: { maxHeight: 360 },
  sheetRow: {
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.rule,
  },
  sheetRowPressed: { opacity: 0.5 },
  sheetRowText: {
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    color: Colors.dark,
  },
});
