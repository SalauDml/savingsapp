import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

function TabItem({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={styles.item}>
      <View style={[styles.pill, focused && styles.pillActive]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <Text style={[styles.label, { color: focused ? Colors.dark : Colors.textMuted, fontFamily: focused ? Fonts.sansBold : Fonts.sans }]}>
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabItem emoji="🏠" label="today" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          tabBarIcon: ({ focused }) => <TabItem emoji="💸" label="spend" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="ask-cait"
        options={{
          tabBarIcon: ({ focused }) => <TabItem emoji="✨" label="ask" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => <TabItem emoji="👤" label="you" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.background,
    borderTopColor: Colors.rule,
    borderTopWidth: 1,
    height: 72,
    paddingTop: 4,
    paddingBottom: 0,
  },
  item: {
    alignItems: 'center',
    gap: 3,
    paddingTop: 2,
  },
  pill: {
    width: 44,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  pillActive: {
    backgroundColor: Colors.tint,
  },
  emoji: { fontSize: 16 },
  label: {
    fontSize: 10.5,
  },
});
