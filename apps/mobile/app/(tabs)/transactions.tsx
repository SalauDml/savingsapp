import { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, SectionList, RefreshControl, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { periodStart, type BudgetPeriod } from '@/lib/budget-period';
import { CategoryRow } from '@/components/category-row';

type Transaction = {
  id: string;
  merchant_name: string;
  amount: number;
  currency: string;
  transaction_at: string;
  category_id: string | null;
  category: { name: string; kind: string } | null;
};

// The category filter is either: show everything (null), show only
// transactions with no category yet ('uncategorised'), or a specific
// category's id. It's its own type so a stray string can't sneak in.
type CategoryFilter = string | 'uncategorised' | null;

type Category = {
  id: string;
  name: string;
};

type BudgetHeaderCategory = { category_id: string; name: string; amount: number };

// Categories have no emoji column — this is a display-only fallback map,
// same idea as MerchantIcon falling back to a plain initial when there's no
// real logo. Anything not listed here (a personal category the user added)
// gets the generic 💰.
const CATEGORY_EMOJI: Record<string, string> = {
  Groceries: '🛒',
  'Eating Out': '🍔',
  Transport: '🚌',
  'Bills & Subscriptions': '📺',
  Entertainment: '🎬',
  Shopping: '🛍️',
  Health: '💊',
  'Fees & Charges': '💸',
};

type Section = {
  title: string;
  total: number;
  data: Transaction[];
};

function formatAmount(pence: number): string {
  const sign = pence < 0 ? '−' : '+';
  return sign + '£' + (Math.abs(pence) / 100).toFixed(2);
}

function formatSectionTotal(pence: number): string {
  return '£' + (pence / 100).toFixed(2);
}

function formatSectionTitle(isoDate: string): string {
  const date = new Date(isoDate);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'today · ' + date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }).toLowerCase();
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'yesterday · ' + date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toLowerCase();
  }
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toLowerCase();
}

function groupByDate(transactions: Transaction[]): Section[] {
  const map = new Map<string, Transaction[]>();

  for (const tx of transactions) {
    const dateKey = new Date(tx.transaction_at).toDateString();
    if (!map.has(dateKey)) map.set(dateKey, []);
    map.get(dateKey)!.push(tx);
  }

  return Array.from(map.entries()).map(([, txs]) => ({
    title: formatSectionTitle(txs[0].transaction_at),
    total: txs.reduce((sum, tx) => sum + tx.amount, 0),
    data: txs,
  }));
}

function MerchantIcon({ name }: { name: string }) {
  const initial = (name || '?')[0].toUpperCase();
  const bgColors = [Colors.dark, Colors.accent, Colors.accentDark];
  const bg = bgColors[name.charCodeAt(0) % bgColors.length];
  return (
    <View style={[styles.icon, { backgroundColor: bg }]}>
      <Text style={styles.iconText}>{initial}</Text>
    </View>
  );
}

export default function TransactionsScreen() {
  // Raw fetch result, ungrouped and unfiltered — `sections` below is derived
  // from this, so switching the category filter never needs a refetch.
  const [rawTransactions, setRawTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  // The transaction currently open in the category picker sheet; null = closed.
  const [pickerTx, setPickerTx] = useState<Transaction | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Budget summary header — null mode means "not loaded yet", not "no
  // budget", so the header renders nothing rather than flashing an empty
  // state before the real answer comes back.
  const [budgetMode, setBudgetMode] = useState<'overall' | 'category' | null>(null);
  const [budgetPeriod, setBudgetPeriod] = useState<BudgetPeriod>('weekly');
  const [overallBudgetAmount, setOverallBudgetAmount] = useState<number | null>(null);
  const [categoryBudgets, setCategoryBudgets] = useState<BudgetHeaderCategory[]>([]);

  async function fetchTransactions() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('transactions')
      .select('id, merchant_name, amount, currency, transaction_at, category_id, category:categories(name, kind)')
      .order('transaction_at', { ascending: false })
      .limit(200)
      .overrideTypes<Transaction[], { merge: false }>();

    if (error) {
      console.log('transactions fetch error:', error.message);
      return;
    }

    setRawTransactions(data ?? []);
  }

  // Derived, not stored: recomputes only when the fetched rows or the
  // chosen filter change, so picking a category in the sheet is instant —
  // no Supabase round trip, it's just filtering an array already in memory.
  const sections = useMemo(() => {
    let filtered = rawTransactions;
    if (categoryFilter === 'uncategorised') {
      filtered = rawTransactions.filter((tx) => !tx.category_id);
    } else if (categoryFilter !== null) {
      filtered = rawTransactions.filter((tx) => tx.category_id === categoryFilter);
    }
    return groupByDate(filtered);
  }, [rawTransactions, categoryFilter]);

  // Reuses rawTransactions already in memory rather than a second network
  // round trip — same "derive, don't refetch" reasoning as `sections` above.
  const budgetHeaderRows = useMemo(() => {
    if (budgetMode !== 'category' || categoryBudgets.length === 0) return [];
    // Compared as Date values, not raw strings — Postgres's "+00:00" offset
    // and toISOString()'s "Z" suffix don't sort identically as text even
    // when they're the same instant, same reasoning groupByDate above
    // already uses `new Date(...)` rather than string comparison.
    const startTime = new Date(periodStart(budgetPeriod)).getTime();
    return categoryBudgets.map((cb) => {
      const spent = rawTransactions
        .filter((tx) => tx.category_id === cb.category_id && new Date(tx.transaction_at).getTime() >= startTime)
        .reduce((sum, tx) => sum + tx.amount, 0);
      return {
        ...cb,
        spent: Math.abs(spent),
        progress: cb.amount > 0 ? Math.abs(spent) / cb.amount : 0,
      };
    });
  }, [budgetMode, categoryBudgets, budgetPeriod, rawTransactions]);

  const overallHeaderSummary = useMemo(() => {
    if (budgetMode !== 'overall' || overallBudgetAmount === null) return null;
    const startTime = new Date(periodStart(budgetPeriod)).getTime();
    const spent = rawTransactions
      .filter((tx) => new Date(tx.transaction_at).getTime() >= startTime && tx.category?.kind === 'spending')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const absSpent = Math.abs(spent);
    return {
      spent: absSpent,
      budgeted: overallBudgetAmount,
      progress: overallBudgetAmount > 0 ? absSpent / overallBudgetAmount : 0,
    };
  }, [budgetMode, overallBudgetAmount, budgetPeriod, rawTransactions]);

  const filterLabel = useMemo(() => {
    if (categoryFilter === null) return 'filter';
    if (categoryFilter === 'uncategorised') return 'uncategorised';
    return categories.find((c) => c.id === categoryFilter)?.name ?? 'filter';
  }, [categoryFilter, categories]);

  // Category list for the picker sheet — small, stable, global-or-mine (RLS
  // already scopes it), so one load on mount is enough.
  useEffect(() => {
    async function loadCategories() {
      const { data, error } = await supabase.from('categories').select('id, name').order('name');
      if (error) {
        console.log('categories fetch error:', error.message);
        return;
      }
      setCategories(data ?? []);
    }
    loadCategories();
  }, []);

  // One load on mount, same as categories above — the budget itself only
  // ever changes from the budget-setting screen, never from this one.
  useEffect(() => {
    async function loadBudgetHeader() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;

      const { data: profile } = await supabase
        .from('profiles')
        .select('active_budget_mode, category_budget_period')
        .eq('id', uid)
        .single();

      const mode = (profile?.active_budget_mode as 'overall' | 'category') ?? 'overall';
      setBudgetMode(mode);

      if (mode === 'overall') {
        const { data: overall } = await supabase
          .from('overall_budgets')
          .select('amount, period')
          .eq('user_id', uid)
          .maybeSingle();
        if (overall) {
          setOverallBudgetAmount(overall.amount);
          setBudgetPeriod(overall.period as BudgetPeriod);
        }
      } else {
        setBudgetPeriod((profile?.category_budget_period as BudgetPeriod) ?? 'weekly');
        const { data: rows } = await supabase
          .from('budgets')
          .select('category_id, amount, category:categories(name)')
          .eq('user_id', uid)
          .overrideTypes<{ category_id: string; amount: number; category: { name: string } | null }[], { merge: false }>();
        setCategoryBudgets((rows ?? []).map((r) => ({
          category_id: r.category_id,
          name: r.category?.name ?? '?',
          amount: r.amount,
        })));
      }
    }
    loadBudgetHeader();
  }, []);

  // Writes the user's choice straight to the row RLS already lets them touch
  // (bank_connection_id -> their own user_id). categorisation_attempts jumps
  // to the cap so the automatic retry sweep never overwrites a human's
  // explicit choice with a model guess later.
  async function handleSelectCategory(categoryId: string) {
    if (!pickerTx) return;
    setSavingCategory(true);

    const { error } = await supabase
      .from('transactions')
      .update({ category_id: categoryId, categorisation_attempts: 2 })
      .eq('id', pickerTx.id);

    setSavingCategory(false);

    if (error) {
      console.log('category update failed:', error.message);
      return;
    }

    // The transactions-changes UPDATE subscription below already refetches
    // on this write — no need to update local state by hand here.
    setPickerTx(null);
  }

  useEffect(() => {
    fetchTransactions().finally(() => setLoading(false));

    // 1. Create the subscription
    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {event: 'INSERT', schema: 'public', table: 'transactions'},
        (payload) => {
          fetchTransactions();
        }
      )
      .on(
        'postgres_changes',
        {event: 'UPDATE', schema: 'public', table: 'transactions'},
        (payload) => {
          fetchTransactions();
        }
      )
      .subscribe();
    

      return () => {
        supabase.removeChannel(channel);
      };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.muted}>loading transactions…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (rawTransactions.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>no transactions yet</Text>
          <Text style={styles.muted}>connect your bank from the home screen</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>spend</Text>
          <Text style={styles.headerTitle}>every receipt.</Text>
        </View>
        <Pressable onPress={() => setFilterModalVisible(true)} hitSlop={10}>
          <Text style={[styles.filterLink, categoryFilter !== null && styles.filterLinkActive]}>
            {filterLabel}
          </Text>
        </Pressable>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Text style={styles.searchText}>🔍  search merchants</Text>
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
          />
        }
        ListHeaderComponent={
          overallHeaderSummary ? (
            <View style={styles.budgetHeader}>
              <View style={styles.budgetHeaderTopRow}>
                <Text style={styles.budgetHeaderLabel}>
                  {budgetPeriod === 'monthly' ? 'monthly budget' : 'weekly budget'}
                </Text>
                <Text style={styles.budgetHeaderAmounts}>
                  £{(overallHeaderSummary.spent / 100).toFixed(2)}
                  <Text style={styles.budgetHeaderOf}> of £{Math.round(overallHeaderSummary.budgeted / 100)}</Text>
                </Text>
              </View>
              <View style={styles.budgetHeaderTrack}>
                <View style={[
                  styles.budgetHeaderFill,
                  { width: `${Math.min(100, overallHeaderSummary.progress * 100)}%` },
                  overallHeaderSummary.progress > 1 && styles.budgetHeaderFillOver,
                ]} />
              </View>
            </View>
          ) : budgetHeaderRows.length > 0 ? (
            <View style={styles.budgetHeader}>
              {budgetHeaderRows.map((row) => (
                <CategoryRow
                  key={row.category_id}
                  emoji={CATEGORY_EMOJI[row.name] ?? '💰'}
                  name={row.name}
                  amount={`£${(row.spent / 100).toFixed(2)} / £${Math.round(row.amount / 100)}`}
                  progress={row.progress}
                />
              ))}
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyFilterNote}>
            <Text style={styles.muted}>no transactions in "{filterLabel}"</Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>{section.title}</Text>
            <Text style={styles.sectionTotal}>{formatSectionTotal(section.total)}</Text>
          </View>
        )}
        renderItem={({ item, index, section }) => (
          <Pressable
            onPress={() => setPickerTx(item)}
            style={({ pressed }) => [
              styles.row,
              index === section.data.length - 1 && styles.rowLast,
              pressed && styles.rowPressed,
            ]}>
            <MerchantIcon name={item.merchant_name} />
            <View style={styles.middle}>
              <Text style={styles.merchant} numberOfLines={1}>{item.merchant_name}</Text>
              <Text
                style={[styles.category, !item.category && styles.categoryPending]}
                numberOfLines={1}>
                {item.category?.name ?? 'not categorised yet'}
              </Text>
            </View>
            <Text style={styles.amount}>{formatAmount(item.amount)}</Text>
          </Pressable>
        )}
      />

      {/* Category picker sheet */}
      <Modal
        visible={!!pickerTx}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerTx(null)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setPickerTx(null)}>
          {/* Inner Pressable with an empty onPress stops a tap on the sheet
              itself from bubbling up to the backdrop and closing it. */}
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle} numberOfLines={1}>{pickerTx?.merchant_name}</Text>
            <Text style={styles.sheetSubtitle}>choose a category</Text>
            <ScrollView style={styles.sheetList} showsVerticalScrollIndicator={false}>
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  disabled={savingCategory}
                  onPress={() => handleSelectCategory(cat.id)}
                  style={({ pressed }) => [styles.sheetRow, pressed && styles.sheetRowPressed]}>
                  <Text style={styles.sheetRowText}>{cat.name}</Text>
                  {pickerTx?.category?.name === cat.name && (
                    <Text style={styles.sheetCheck}>✓</Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Category filter sheet */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFilterModalVisible(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setFilterModalVisible(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>filter by category</Text>
            <Text style={styles.sheetSubtitle}>showing {sections.reduce((n, s) => n + s.data.length, 0)} of {rawTransactions.length}</Text>
            <ScrollView style={styles.sheetList} showsVerticalScrollIndicator={false}>
              <Pressable
                onPress={() => { setCategoryFilter(null); setFilterModalVisible(false); }}
                style={({ pressed }) => [styles.sheetRow, pressed && styles.sheetRowPressed]}>
                <Text style={styles.sheetRowText}>all transactions</Text>
                {categoryFilter === null && <Text style={styles.sheetCheck}>✓</Text>}
              </Pressable>
              <Pressable
                onPress={() => { setCategoryFilter('uncategorised'); setFilterModalVisible(false); }}
                style={({ pressed }) => [styles.sheetRow, pressed && styles.sheetRowPressed]}>
                <Text style={styles.sheetRowText}>not categorised yet</Text>
                {categoryFilter === 'uncategorised' && <Text style={styles.sheetCheck}>✓</Text>}
              </Pressable>
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => { setCategoryFilter(cat.id); setFilterModalVisible(false); }}
                  style={({ pressed }) => [styles.sheetRow, pressed && styles.sheetRowPressed]}>
                  <Text style={styles.sheetRowText}>{cat.name}</Text>
                  {categoryFilter === cat.id && <Text style={styles.sheetCheck}>✓</Text>}
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
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerEyebrow: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  headerTitle: {
    fontFamily: Fonts.black,
    fontSize: 22,
    letterSpacing: -0.5,
    color: Colors.dark,
    marginTop: 3,
  },
  filterLink: {
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    color: Colors.accent,
    marginBottom: 4,
  },
  filterLinkActive: {
    color: Colors.dark,
    textDecorationLine: 'underline',
  },
  searchWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  searchBar: {
    height: 40,
    backgroundColor: Colors.cardWhite,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: 20,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  searchText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.textMuted,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  budgetHeader: {
    paddingBottom: 6,
    gap: 8,
  },
  budgetHeaderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  budgetHeaderLabel: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 10.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  budgetHeaderAmounts: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 14,
    color: Colors.dark,
  },
  budgetHeaderOf: {
    fontFamily: Fonts.sans,
    color: Colors.textMuted,
  },
  budgetHeaderTrack: {
    height: 7,
    backgroundColor: Colors.rule,
    borderRadius: 4,
  },
  budgetHeaderFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
  budgetHeaderFillOver: {
    backgroundColor: '#A05840',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 15,
    color: Colors.dark,
  },
  muted: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.textMuted,
  },
  emptyFilterNote: {
    alignItems: 'center',
    paddingTop: 40,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionHeader: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  sectionTotal: {
    fontFamily: Fonts.sansBold,
    fontSize: 11.5,
    color: Colors.accentDark,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.rule,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowPressed: {
    opacity: 0.6,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconText: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 15,
    color: '#ffffff',
  },
  middle: {
    flex: 1,
    gap: 2,
  },
  merchant: {
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    color: Colors.dark,
  },
  category: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.textMuted,
  },
  categoryPending: {
    fontStyle: 'italic',
    opacity: 0.6,
  },
  amount: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 15,
    color: Colors.dark,
    letterSpacing: -0.3,
    flexShrink: 0,
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
  },
  sheetSubtitle: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: 12,
  },
  sheetList: {
    maxHeight: 360,
  },
  sheetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.rule,
  },
  sheetRowPressed: {
    opacity: 0.5,
  },
  sheetRowText: {
    fontFamily: Fonts.sansBold,
    fontSize: 14,
    color: Colors.dark,
  },
  sheetCheck: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 14,
    color: Colors.accent,
  },
});
