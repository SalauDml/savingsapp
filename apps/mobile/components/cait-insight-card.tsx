import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

type Props = {
  text: string;
  highlightedAmounts?: string[];
};

export function CaitInsightCard({ text, highlightedAmounts = [] }: Props) {
  if (highlightedAmounts.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.label}>✦ CAIT says</Text>
        <Text style={styles.body}>{text}</Text>
      </View>
    );
  }

  const escapedAmounts = highlightedAmounts.map(amount =>
    amount.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  const parts = text.split(new RegExp(`(${escapedAmounts.join('|')})`, 'g'));

  return (
    <View style={styles.card}>
      <Text style={styles.label}>✦ CAIT says</Text>
      <Text style={styles.body}>
        {parts.map((part, index) =>
          highlightedAmounts.includes(part) ? (
            <Text key={`${index}:${part}`} style={styles.highlight}>
              {part}
            </Text>
          ) : (
            <Text key={`${index}:${part}`}>{part}</Text>
          )
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 18,
    marginTop: 16,
  },
  label: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.accent,
    marginBottom: 8,
  },
  body: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.cardWhite,
  },
  highlight: {
    fontFamily: Fonts.sansBold,
    color: Colors.accent,
  },
});
