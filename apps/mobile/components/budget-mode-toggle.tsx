import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

export type BudgetMode = 'overall' | 'category';

type Props = {
  value: BudgetMode;
  onChange: (mode: BudgetMode) => void;
};

const OPTIONS: { value: BudgetMode; label: string }[] = [
  { value: 'overall', label: 'one number' },
  { value: 'category', label: 'by category' },
];

// The either/or switch — only one of these is ever active. Not a Boolean
// prop (isCategory?: boolean) on purpose: a third mode later (or just
// reading the code) is much clearer against a named union than a bool that
// only makes sense by knowing what "false" secretly means.
export function BudgetModeToggle({ value, onChange }: Props) {
  return (
    <View style={styles.track}>
      {OPTIONS.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.segment, active && styles.segmentActive]}>
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: Colors.tint,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 11,
  },
  segmentActive: {
    backgroundColor: Colors.dark,
  },
  label: {
    fontFamily: Fonts.sansBold,
    fontSize: 12.5,
    color: Colors.accentDark,
  },
  labelActive: {
    color: '#ffffff',
  },
});
