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

const clientId = process.env.EXPO_PUBLIC_TRUELAYER_CLIENT_ID

async function handleConnect() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  const url = `https://auth.truelayer-sandbox.com/?response_type=code&client_id=${clientId}&scope=accounts%20transactions%20offline_access&redirect_uri=cait://auth/callback&providers=uk-cs-mock&user_email=${session.user.email}`
  await Linking.openURL(url)
}

const BANKS = [
  { name: 'Monzo',    initial: 'M', color: '#FF4F40' },
  { name: 'Starling', initial: 'S', color: '#7935D2' },
  { name: 'Barclays', initial: 'B', color: '#1E88E5' },
  { name: 'Lloyds',   initial: 'L', color: '#024F36' },
  { name: 'HSBC',     initial: 'H', color: '#DB0011' },
  { name: 'NatWest',  initial: 'N', color: '#5A287D' },
  { name: 'Revolut',  initial: 'R', color: '#0066FF' },
  { name: 'Chase',    initial: 'C', color: '#1B45A8' },
]

export default function ConnectBankScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>

        {/* Step indicator */}
        <Text style={styles.step}>step 3 of 3</Text>

        {/* Heading */}
        <Text style={styles.heading}>connect{'\n'}your bank.</Text>

        <Text style={styles.subtext}>
          powered by <Text style={styles.bold}>TrueLayer</Text>. read-only — we can never move your money.
        </Text>

        {/* Search bar (visual) */}
        <View style={styles.searchBar}>
          <Text style={styles.searchText}>🔍  search 50+ UK banks</Text>
        </View>

        {/* Bank grid — all cards open the TrueLayer OAuth flow */}
        <View style={styles.grid}>
          {BANKS.map(bank => (
            <TouchableOpacity
              key={bank.name}
              style={styles.bankCard}
              onPress={handleConnect}
              activeOpacity={0.75}>
              <View style={[styles.bankIcon, { backgroundColor: bank.color }]}>
                <Text style={styles.bankInitial}>{bank.initial}</Text>
              </View>
              <Text style={styles.bankName}>{bank.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

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
    marginBottom: 14,
  },
  bold: {
    fontFamily: Fonts.sansBold,
  },
  searchBar: {
    height: 42,
    backgroundColor: Colors.cardWhite,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: 21,
    justifyContent: 'center',
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  searchText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    flex: 1,
  },
  bankCard: {
    width: '47.5%',
    backgroundColor: Colors.cardWhite,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: 14,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bankIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankInitial: {
    fontFamily: Fonts.sansExtraBold,
    fontSize: 14,
    color: '#ffffff',
  },
  bankName: {
    fontFamily: Fonts.sansBold,
    fontSize: 13,
    color: Colors.dark,
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
