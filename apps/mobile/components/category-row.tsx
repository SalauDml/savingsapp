import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Shadows } from '@/constants/theme';

type Props = {
  emoji: string;
  name: string;
  amount: string;
  progress: number; // 0 to 1
};

export function CategoryRow({ emoji, name, amount, progress }: Props) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <View style={styles.middle}>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${clampedProgress * 100}%` }]} />
        </View>
      </View>
      <Text style={styles.amount}>{amount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardWhite,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...Shadows.card,
  },
  icon: {
    width: 30,
    height: 30,
    backgroundColor: Colors.tint,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 15,
  },
  middle: {
    flex: 1,
    gap: 5,
  },
  name: {
    fontFamily: Fonts.sansBold,
    fontSize: 12,
    color: Colors.dark,
  },
  track: {
    height: 4,
    backgroundColor: Colors.tint,
    borderRadius: 2,
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  amount: {
    fontFamily: Fonts.sansBold,
    fontSize: 12,
    color: Colors.dark,
  },
});
