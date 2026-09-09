import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

type Profile = { full_name: string | null; email: string };

export default function SettingsScreen() {
  const [profile, setProfile] = useState<Profile>({ full_name: null, email: '' });

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single();
      setProfile({ full_name: data?.full_name ?? null, email: session.user.email ?? '' });
    }
    loadProfile();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  const initial = (profile.full_name || profile.email || '?')[0].toUpperCase();
  const displayName = profile.full_name || profile.email;

  const sections = [
    {
      label: 'connected',
      items: [
        { text: 'add your bank →', onPress: () => router.push('/(auth)/connect-bank') },
        { text: 'budget →', onPress: () => router.push('/budget') },
      ],
    },
    {
      label: 'notifications',
      items: [
        { text: 'weekly summary →' },
        { text: 'category milestones →' },
        { text: 'location reminders →' },
      ],
    },
    {
      label: 'privacy',
      items: [
        { text: 'export transactions →' },
        { text: 'privacy policy →' },
        { text: 'sign out', onPress: handleSignOut, muted: true },
        { text: 'delete account', danger: true },
      ],
    },
  ] as const;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Text style={styles.eyebrow}>you</Text>
        <Text style={styles.heading}>settings.</Text>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitial}>{initial}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileSub}>{profile.email}</Text>
          </View>
        </View>

        {/* Sections */}
        {sections.map((section) => (
          <View key={section.label} style={styles.section}>
            <Text style={styles.sectionLabel}>{section.label}</Text>
            {section.items.map((item, i) => (
              <TouchableOpacity
                key={item.text}
                style={[styles.row, i < section.items.length - 1 && styles.rowBorder]}
                activeOpacity={'onPress' in item ? 0.7 : 1}
                onPress={'onPress' in item ? item.onPress : undefined}>
                <Text style={[
                  styles.rowText,
                  'danger' in item && item.danger && styles.rowDanger,
                  'muted' in item && item.muted && styles.rowMuted,
                ]}>
                  {item.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },

  eyebrow: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: 3,
  },
  heading: {
    fontFamily: Fonts.black,
    fontSize: 26,
    letterSpacing: -0.8,
    color: Colors.dark,
    marginBottom: 14,
  },

  profileCard: {
    backgroundColor: Colors.dark,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontFamily: Fonts.black,
    fontSize: 20,
    color: '#fff',
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 18,
    color: '#fff',
    letterSpacing: -0.4,
  },
  profileSub: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: 'rgba(247,244,240,0.45)',
    marginTop: 2,
  },

  section: { marginBottom: 20 },
  sectionLabel: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 10.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: 6,
  },
  row: { paddingVertical: 13 },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.rule,
  },
  rowText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.dark,
  },
  rowDanger: { color: '#C43030' },
  rowMuted: { color: Colors.textMuted },
});
