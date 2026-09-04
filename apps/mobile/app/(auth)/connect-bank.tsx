import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Fonts } from '@/constants/theme'
import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'

const clientId = process.env.EXPO_PUBLIC_MONZO_CLIENT_ID

// Registered with Monzo as this OAuth client's redirect_uri - has to match
// exactly (including the trailing slash) what's in exchange-token's token
// exchange call and what's set in Monzo's Developer Tools. This is NOT
// cait://auth/callback directly: Monzo requires http(s) redirect_uris, and
// its login-continuation email breaks (silently, as a "#ZgotmplZ" non-link)
// if asked to eventually reach a custom scheme. This page is a real https
// URL Monzo is happy with, which then hands off to cait://auth/callback
// itself from inside the browser.
//
// Hosted as a static GitHub Pages site (github.com/SalauDml/cait-oauth-
// redirect), not a Supabase Edge Function/Storage file - Supabase force-
// rewrites HTML responses to text/plain on the free tier (to stop arbitrary
// rendering pages being hosted under the trusted supabase.co domain), which
// silently broke the first version of this: the browser just showed the
// page's source text instead of running it.
const REDIRECT_URI = 'https://salaudml.github.io/cait-oauth-redirect/'

async function handleConnect() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  // No scope param here (unlike TrueLayer) - Monzo's developer API doesn't
  // use OAuth scopes to gate what you can read, access is all-or-nothing
  // per account. `state` is Monzo's recommended CSRF guard; callback.tsx
  // doesn't verify it back yet, so treat this as a placeholder for that,
  // not real protection yet.
  //
  // redirect_uri is deliberately NOT encodeURIComponent()'d here, unlike an
  // earlier version of this line. The browser navigation to it worked fine
  // either way, but that's not proof the value Monzo internally associated
  // with the issued code was identical to what got sent back at token-
  // exchange time - and this app's original, working cait:// redirect_uri
  // was always sent as a plain, unencoded string. Testing whether matching
  // that removes the redirect_uri_mismatch error - not confirmed yet.
  const url = `https://auth.monzo.com/?client_id=${clientId}&redirect_uri=${REDIRECT_URI}&response_type=code&state=${session.user.id}`
  await Linking.openURL(url)
}

export default function ConnectBankScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>

        {/* Step indicator */}
        <Text style={styles.step}>step 3 of 3</Text>

        {/* Heading */}
        <Text style={styles.heading}>connect{'\n'}your bank.</Text>

        <Text style={styles.subtext}>
          powered by <Text style={styles.bold}>Monzo</Text>. read-only — we can never move your money.
        </Text>

        {/* Single provider card - Monzo's developer API is a first-party,
            one-bank-at-a-time connection, not a "pick from 50+ banks"
            aggregator like TrueLayer was. A grid of banks that all quietly
            did the same thing regardless of which one you tapped would be
            actively misleading now, not just an unfinished feature. */}
        <TouchableOpacity
          style={styles.connectCard}
          onPress={handleConnect}
          activeOpacity={0.85}>
          <View style={[styles.bankIcon, { backgroundColor: '#FF4F40' }]}>
            <Text style={styles.bankInitial}>M</Text>
          </View>
          <View style={styles.connectMiddle}>
            <Text style={styles.bankName}>Monzo</Text>
            <Text style={styles.connectHint}>tap to connect</Text>
          </View>
          <Text style={styles.connectArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />

        {/* Trust footer */}
        <View style={styles.trustRow}>
          <Text style={styles.trustIcon}>🔒</Text>
          <Text style={styles.trustText}>
            bank-grade encryption. your credentials never touch our servers. ever.
          </Text>
        </View>

        {/* Skip */}
        <TouchableOpacity style={styles.skip} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.skipText}>I'll do this later</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 28,
  },
  step: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: 8,
  },
  heading: {
    fontFamily: Fonts.black,
    fontSize: 28,
    lineHeight: 30,
    letterSpacing: -0.8,
    color: Colors.dark,
    marginBottom: 8,
  },
  subtext: {
    fontFamily: Fonts.sans,
    fontSize: 13.5,
    color: Colors.accentDark,
    lineHeight: 20,
    marginBottom: 20,
  },
  bold: {
    fontFamily: Fonts.sansBold,
  },
  connectCard: {
    backgroundColor: Colors.cardWhite,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  bankIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankInitial: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 18,
    color: '#ffffff',
  },
  connectMiddle: {
    flex: 1,
    gap: 2,
  },
  bankName: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    color: Colors.dark,
  },
  connectHint: {
    fontFamily: Fonts.sans,
    fontSize: 12.5,
    color: Colors.textMuted,
  },
  connectArrow: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 18,
    color: Colors.accent,
  },
  spacer: {
    flex: 1,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  trustIcon: {
    fontSize: 16,
  },
  trustText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
    flex: 1,
  },
  skip: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.textMuted,
  },
})
