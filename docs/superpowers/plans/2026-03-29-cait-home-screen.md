# CAIT Home Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the default Expo starter template with the CAIT home screen so the brand design is visible on a physical device via Expo Go.

**Architecture:** Static/mock data only — no backend calls yet. Build the visual layer: CAIT colour tokens, custom fonts (DM Serif Display + Plus Jakarta Sans), four-tab navigation, and the home dashboard screen with its three components (balance header, CAIT insight card, category rows, Ask CAIT CTA).

**Tech Stack:** React Native 0.81, Expo SDK 54, expo-router v6, expo-font, @expo-google-fonts/dm-serif-display, @expo-google-fonts/plus-jakarta-sans, @expo/vector-icons (Ionicons)

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `apps/mobile/constants/theme.ts` | CAIT colour tokens + font family names |
| Modify | `apps/mobile/app/_layout.tsx` | Load custom fonts before rendering |
| Modify | `apps/mobile/app/(tabs)/_layout.tsx` | 4 CAIT tabs with Ionicons |
| Modify | `apps/mobile/app/(tabs)/index.tsx` | CAIT home/dashboard screen |
| Create | `apps/mobile/components/cait-insight-card.tsx` | Dark insight card ("CAIT says") |
| Create | `apps/mobile/components/category-row.tsx` | Spending category row with progress bar |
| Create | `apps/mobile/app/(tabs)/transactions.tsx` | Placeholder screen |
| Create | `apps/mobile/app/(tabs)/ask-cait.tsx` | Placeholder screen |
| Create | `apps/mobile/app/(tabs)/settings.tsx` | Placeholder screen |

> No test framework is configured in this project. Visual verification via Expo Go on device is the test for each task.

---

## Task 1: Install Google Fonts packages

**Files:**
- Modify: `apps/mobile/package.json` (via npm install)

- [ ] **Step 1: Install the font packages**

Run this from inside `apps/mobile/`:
```bash
npx expo install @expo-google-fonts/dm-serif-display @expo-google-fonts/plus-jakarta-sans
```

Expected output: packages installed, `package.json` updated with both font packages as dependencies.

- [ ] **Step 2: Commit**
```bash
cd apps/mobile
git add package.json package-lock.json
git commit -m "feat: install DM Serif Display and Plus Jakarta Sans font packages"
```

---

## Task 2: Replace colour tokens with CAIT palette

**Files:**
- Modify: `apps/mobile/constants/theme.ts`

- [ ] **Step 1: Replace the file contents**

Replace the entire file with:

```typescript
export const Colors = {
  background: '#fff9f7',
  coral: '#e8785c',
  coralDark: '#c96a50',
  coralTint: '#fde8e3',
  dark: '#1a0a06',
  cardWhite: '#ffffff',
  textMuted: '#888888',
};

export const Fonts = {
  serif: 'DMSerifDisplay_400Regular',
  sans: 'PlusJakartaSans_500Medium',
  sansBold: 'PlusJakartaSans_700Bold',
  sansExtraBold: 'PlusJakartaSans_800ExtraBold',
};

export const Shadows = {
  card: {
    shadowColor: '#c96a50',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardElevated: {
    shadowColor: '#c96a50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
};
```

- [ ] **Step 2: Commit**
```bash
git add apps/mobile/constants/theme.ts
git commit -m "feat: replace default colours with CAIT design tokens"
```

---

## Task 3: Load custom fonts in root layout

**Files:**
- Modify: `apps/mobile/app/_layout.tsx`

- [ ] **Step 1: Replace the root layout to load fonts**

Replace the entire file with:

```typescript
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import {
  DMSerifDisplay_400Regular,
} from '@expo-google-fonts/dm-serif-display';
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    DMSerifDisplay_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: Colors.background }} />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="dark" backgroundColor={Colors.background} />
    </ThemeProvider>
  );
}
```

- [ ] **Step 2: Verify it starts without crashing**

Run from `apps/mobile/`:
```bash
npx expo start
```

Open Expo Go on your phone and scan the QR code. You should see a blank warm-white screen (the fonts are loading, no content yet). No red error screen.

- [ ] **Step 3: Commit**
```bash
git add apps/mobile/app/_layout.tsx
git commit -m "feat: load DM Serif Display and Plus Jakarta Sans at app root"
```

---

## Task 4: Update tab navigation to 4 CAIT tabs

**Files:**
- Modify: `apps/mobile/app/(tabs)/_layout.tsx`

- [ ] **Step 1: Replace the tab layout**

Replace the entire file with:

```typescript
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.coral,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.cardWhite,
          borderTopColor: 'rgba(201, 106, 80, 0.08)',
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'PlusJakartaSans_500Medium',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'list' : 'list-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ask-cait"
        options={{
          title: 'Ask CAIT',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 2: Create the three placeholder tab screens**

Create `apps/mobile/app/(tabs)/transactions.tsx`:
```typescript
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

export default function TransactionsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Transactions</Text>
      <Text style={styles.sub}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 20,
    color: Colors.dark,
  },
  sub: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 6,
  },
});
```

Create `apps/mobile/app/(tabs)/ask-cait.tsx`:
```typescript
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

export default function AskCaitScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Ask CAIT</Text>
      <Text style={styles.sub}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 20,
    color: Colors.dark,
  },
  sub: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 6,
  },
});
```

Create `apps/mobile/app/(tabs)/settings.tsx`:
```typescript
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Settings</Text>
      <Text style={styles.sub}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 20,
    color: Colors.dark,
  },
  sub: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 6,
  },
});
```

- [ ] **Step 3: Verify on device**

Save all files. In Expo Go you should see 4 tabs at the bottom: Home, Transactions, Ask CAIT, Settings — each with a coral active icon. Tapping each shows "Coming soon" except Home (still has old content).

- [ ] **Step 4: Commit**
```bash
git add apps/mobile/app/(tabs)/_layout.tsx \
        apps/mobile/app/(tabs)/transactions.tsx \
        apps/mobile/app/(tabs)/ask-cait.tsx \
        apps/mobile/app/(tabs)/settings.tsx
git commit -m "feat: set up 4-tab CAIT navigation with placeholder screens"
```

---

## Task 5: Build the CaitInsightCard component

**Files:**
- Create: `apps/mobile/components/cait-insight-card.tsx`

- [ ] **Step 1: Create the component**

Create `apps/mobile/components/cait-insight-card.tsx`:

```typescript
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

type Props = {
  text: string;
  highlightedAmounts?: string[];
};

export function CaitInsightCard({ text, highlightedAmounts = [] }: Props) {
  // Split text into parts so we can highlight amounts inline
  const parts = text.split(new RegExp(`(${highlightedAmounts.join('|')})`, 'g'));

  return (
    <View style={styles.card}>
      <Text style={styles.label}>✦ CAIT says</Text>
      <Text style={styles.body}>
        {parts.map((part, index) =>
          highlightedAmounts.includes(part) ? (
            <Text key={index} style={styles.highlight}>
              {part}
            </Text>
          ) : (
            <Text key={index}>{part}</Text>
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
    color: Colors.coral,
    marginBottom: 8,
  },
  body: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 20,
    color: '#ffffff',
  },
  highlight: {
    fontFamily: Fonts.sansBold,
    color: Colors.coral,
  },
});
```

- [ ] **Step 2: Commit**
```bash
git add apps/mobile/components/cait-insight-card.tsx
git commit -m "feat: add CaitInsightCard component"
```

---

## Task 6: Build the CategoryRow component

**Files:**
- Create: `apps/mobile/components/category-row.tsx`

- [ ] **Step 1: Create the component**

Create `apps/mobile/components/category-row.tsx`:

```typescript
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
    backgroundColor: Colors.coralTint,
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
    backgroundColor: Colors.coralTint,
    borderRadius: 2,
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.coral,
    borderRadius: 2,
  },
  amount: {
    fontFamily: Fonts.sansBold,
    fontSize: 12,
    color: Colors.dark,
  },
});
```

- [ ] **Step 2: Commit**
```bash
git add apps/mobile/components/category-row.tsx
git commit -m "feat: add CategoryRow component with progress bar"
```

---

## Task 7: Build the CAIT home screen

**Files:**
- Modify: `apps/mobile/app/(tabs)/index.tsx`

- [ ] **Step 1: Replace the home screen**

Replace the entire file with:

```typescript
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { CaitInsightCard } from '@/components/cait-insight-card';
import { CategoryRow } from '@/components/category-row';
import { Colors, Fonts, Shadows } from '@/constants/theme';

const MOCK_CATEGORIES = [
  { emoji: '🍔', name: 'Eating out', amount: '£87.50', progress: 0.68 },
  { emoji: '🚇', name: 'Transport', amount: '£42.00', progress: 0.42 },
  { emoji: '🛒', name: 'Groceries', amount: '£61.30', progress: 0.55 },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        {/* Greeting + Balance */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Good evening</Text>
          <Text style={styles.balance}>£342.80</Text>
          <Text style={styles.monthLabel}>March 2026</Text>
        </View>

        {/* CAIT Insight Card */}
        <CaitInsightCard
          text="You've spent £87.50 on eating out this week. Still in budget — but only just."
          highlightedAmounts={['£87.50']}
        />

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Where it went</Text>
            <Text style={styles.seeAll}>See all →</Text>
          </View>
          <View style={styles.categories}>
            {MOCK_CATEGORIES.map((cat) => (
              <CategoryRow
                key={cat.name}
                emoji={cat.emoji}
                name={cat.name}
                amount={cat.amount}
                progress={cat.progress}
              />
            ))}
          </View>
        </View>

        {/* Ask CAIT CTA */}
        <TouchableOpacity style={styles.askButton} activeOpacity={0.85}>
          <View>
            <Text style={styles.askLabel}>ASK CAIT</Text>
            <Text style={styles.askText}>Can I afford this?</Text>
          </View>
          <View style={styles.askIcon}>
            <Ionicons name="refresh" size={16} color="#fff" />
          </View>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 8,
  },
  greeting: {
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    color: Colors.coralDark,
    marginBottom: 4,
  },
  balance: {
    fontFamily: Fonts.serif,
    fontSize: 42,
    color: Colors.dark,
    lineHeight: 50,
  },
  monthLabel: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionLabel: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.dark,
  },
  seeAll: {
    fontFamily: Fonts.sansBold,
    fontSize: 10,
    color: Colors.coral,
  },
  categories: {
    gap: 7,
  },
  askButton: {
    backgroundColor: Colors.coral,
    borderRadius: 12,
    marginHorizontal: 18,
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.cardElevated,
  },
  askLabel: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 7,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  askText: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 13,
    color: '#ffffff',
  },
  askIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 2: Verify on device**

Save the file. In Expo Go you should see:
- Warm white background
- "Good evening" in coral-dark
- `£342.80` in DM Serif Display at ~42px
- Dark CAIT insight card with coral highlight on the amount
- Three category rows with coral progress bars
- Full-width coral "Ask CAIT" button
- 4-tab bottom nav with coral active state

- [ ] **Step 3: Commit**
```bash
git add apps/mobile/app/(tabs)/index.tsx
git commit -m "feat: build CAIT home screen with mock data"
```

---

## Running on Your Phone

Once all tasks are done:

1. In your terminal, `cd` into `apps/mobile`
2. Run `npx expo start`
3. Install **Expo Go** on your phone (App Store / Play Store) if you haven't
4. Scan the QR code shown in the terminal
5. The CAIT home screen loads on your phone — live reload is on, so any file save updates it instantly
