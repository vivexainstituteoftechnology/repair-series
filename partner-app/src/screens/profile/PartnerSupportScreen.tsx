import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../../config/theme";
import { Header } from "../../components/common/Header";
import { APP_INFO } from "../../config/env";
import { Button } from "../../components/common/Button";

const FAQS = [
  {
    q: "How are my earnings credited?",
    a: "Every completed job automatically credits your calculated payout (70%-80% of service bill) to your in-app Partner Wallet. You can request direct bank / UPI withdrawal at any time.",
  },
  {
    q: "What should I do if a customer is not at home?",
    a: "Attempt calling the customer twice. If unreachable after 15 minutes, notify support via WhatsApp so operations can verify or reschedule the booking without penalty.",
  },
  {
    q: "How does the customer service OTP work?",
    a: "To protect both you and the customer, every booking has a secure 4-digit code displayed on the customer's app. Enter this code into your Partner App to begin the repair job.",
  },
  {
    q: "What are cash settlement rules?",
    a: "When a customer pays in cash, the entire amount is received by you. The company's platform commission is deducted from your wallet balance or settled via the Cash Settlement screen.",
  },
];

export const PartnerSupportScreen = ({ navigation }: any) => {
  const handleWhatsApp = () => {
    const text = encodeURIComponent("Hello Repair Series Partner Support, I need assistance with my service operations.");
    Linking.openURL(`https://wa.me/${APP_INFO.supportWhatsApp}?text=${text}`);
  };

  const handleCall = () => {
    Linking.openURL(`tel:${APP_INFO.supportPhone.replace(/\s+/g, "")}`);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Partner Support & Helpdesk"
        subtitle="Operations & Technical Guidance"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Support Channels Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>We're here to assist you 24/7</Text>
          <Text style={styles.bannerSubtitle}>
            Reach out to our operations team for assignment assistance, doorstep disputes, or payout queries.
          </Text>

          <View style={styles.channelRow}>
            <Button
              title="Chat on WhatsApp"
              onPress={handleWhatsApp}
              variant="success"
              size="md"
              icon={<Ionicons name="logo-whatsapp" size={18} color={COLORS.textInverse} />}
              style={styles.channelBtn}
            />
            <Button
              title="Call Helpline"
              onPress={handleCall}
              variant="outline"
              size="md"
              icon={<Ionicons name="call" size={18} color={COLORS.primary} />}
              style={styles.channelBtn}
            />
          </View>
        </View>

        {/* Operating Rules */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Standard Operating Guidelines</Text>

          <View style={styles.ruleItem}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            <Text style={styles.ruleText}>Always wear clean attire and your Repair Series ID card.</Text>
          </View>

          <View style={styles.ruleItem}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            <Text style={styles.ruleText}>Inspect the appliance thoroughly before quoting any spare parts.</Text>
          </View>

          <View style={styles.ruleItem}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            <Text style={styles.ruleText}>Collect 4-digit OTP from customer before opening the machine.</Text>
          </View>

          <View style={styles.ruleItem}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            <Text style={styles.ruleText}>Provide unconditional 30-day warranty accountability for all repairs.</Text>
          </View>
        </View>

        {/* FAQs */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Frequently Asked Questions</Text>
          {FAQS.map((faq, idx) => (
            <View key={idx} style={styles.faqItem}>
              <Text style={styles.faqQ}>{faq.q}</Text>
              <Text style={styles.faqA}>{faq.a}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  banner: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  bannerTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 18,
    color: COLORS.text,
  },
  bannerSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: SPACING.md,
  },
  channelRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  channelBtn: {
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  ruleItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  ruleText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    flex: 1,
  },
  faqItem: {
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: SPACING.sm,
  },
  faqQ: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 2,
  },
  faqA: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
