import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

export type BudgetPeriod = 'weekly' | 'monthly';

type Props = {
  value: BudgetPeriod;
  onChange: (period: BudgetPeriod) => void;
};

const OPTIONS: { value: BudgetPeriod; label: string }[] = [
  { value: 'weekly', label: 'per week' },
  { value: 'monthly', label: 'per month' },
];

// Two call sites reuse this exact control: the overall screen (one budget,
// one period) and the category screen (one period shared across every
// category row — there's no per-row equivalent, per the confirmed design).
export function BudgetPeriodChip({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {OPTIONS.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}>
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  pillActive: {
    backgroundColor: Colors.dark,
  },
  pillInactive: {
    backgroundColor: Colors.cardWhite,
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  label: {
    fontFamily: Fonts.sansBold,
    fontSize: 12,
    color: Colors.accentDark,
  },
  labelActive: {
    color: '#ffffff',
  },
});
