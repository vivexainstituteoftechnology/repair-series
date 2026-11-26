import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../../config/theme";
import { Button } from "../../components/common/Button";
import { Header } from "../../components/common/Header";
import { GoogleMapPicker } from "../../components/common/GoogleMapPicker";
import { DocumentUploader } from "../../components/common/DocumentUploader";
import { useAuth } from "../../context/AuthContext";
import { PartnerApi } from "../../services/apiClient";
import { APP_INFO } from "../../config/env";

const KYC_DRAFT_KEY = "rs_partner_kyc_draft_v2";

const SERVICE_CATEGORIES = [
  { id: "ac-repair", label: "AC Repair & Service", icon: "snow-outline" },
  { id: "appliance", label: "Appliance Repair", icon: "hardware-chip-outline" },
  { id: "plumber", label: "Plumbing Services", icon: "water-outline" },
  { id: "electrician", label: "Electrician Services", icon: "flash-outline" },
  { id: "wall-panel", label: "Wall Panels & Louvers", icon: "grid-outline" },
  { id: "chimney", label: "Chimney & Hob Repair", icon: "flame-outline" },
];

const OPERATING_CITIES = [
  "Gurugram",
  "Delhi NCR",
  "Noida",
  "Faridabad",
  "Ghaziabad",
];

const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];
const EXPERIENCE_OPTIONS = ["1-2 Years", "3-5 Years", "5-10 Years", "10+ Years"];

export const PartnerRegisterScreen = ({ route, navigation }: any) => {
  const { user, partnerDoc, refreshPartnerDoc } = useAuth();
  const initialPhone = route?.params?.initialPhone || partnerDoc?.phone || "";

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [personal, setPersonal] = useState({
    legalName: partnerDoc?.name || "",
    phone: initialPhone.replace(/\D/g, "").slice(-10),
    email: partnerDoc?.email || "",
    dob: partnerDoc?.dob || "",
    gender: partnerDoc?.gender || "Male",
    profileImageUrl: partnerDoc?.profileImage || partnerDoc?.avatar || "",
  });

  const [address, setAddress] = useState({
    houseNumber: partnerDoc?.address?.houseNumber || "",
    street: partnerDoc?.address?.street || partnerDoc?.areaAddress || "",
    city: partnerDoc?.city || "Gurugram",
    state: partnerDoc?.address?.state || "Haryana",
    pincode: partnerDoc?.address?.pincode || "",
    fullAddress: partnerDoc?.address?.fullAddress || partnerDoc?.areaAddress || "",
    latitude: partnerDoc?.latitude ? Number(partnerDoc.latitude) : 28.4595,
    longitude: partnerDoc?.longitude ? Number(partnerDoc.longitude) : 77.0266,
  });

  const [identity, setIdentity] = useState({
    aadhaarNumber: partnerDoc?.identity?.aadhaarNumber || "",
    aadhaarFrontUrl: partnerDoc?.identity?.aadhaarFrontUrl || "",
    aadhaarBackUrl: partnerDoc?.identity?.aadhaarBackUrl || "",
    panNumber: partnerDoc?.identity?.panNumber || "",
    panCardUrl: partnerDoc?.identity?.panCardUrl || "",
  });

  const [bank, setBank] = useState({
    accountHolderName: partnerDoc?.bank?.accountHolderName || partnerDoc?.name || "",
    accountNumber: partnerDoc?.bank?.accountNumber || "",
    confirmAccountNumber: partnerDoc?.bank?.accountNumber || "",
    ifscCode: partnerDoc?.bank?.ifscCode || "",
    bankName: partnerDoc?.bank?.bankName || "",
    chequeOrPassbookUrl: partnerDoc?.bank?.chequeOrPassbookUrl || "",
    upiId: partnerDoc?.bank?.upiId || "",
  });

  const [professional, setProfessional] = useState({
    categoryId: partnerDoc?.categoryId || SERVICE_CATEGORIES[0].id,
    categoryIds: partnerDoc?.categoryIds || [SERVICE_CATEGORIES[0].id],
    experienceYears: partnerDoc?.professional?.experienceYears || EXPERIENCE_OPTIONS[1],
    experienceDetails: partnerDoc?.professional?.experienceDetails || "",
    skills: Array.isArray(partnerDoc?.skills) ? partnerDoc.skills.join(", ") : partnerDoc?.skills || "",
    certificateUrls: partnerDoc?.professional?.certificateUrls || [],
    workPhotoUrls: partnerDoc?.professional?.workPhotoUrls || [],
  });

  const [consents, setConsents] = useState({
    declarationsAccepted: false,
    termsAccepted: false,
    consentAccepted: false,
  });

  // Load saved draft on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(KYC_DRAFT_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.personal) setPersonal((prev) => ({ ...prev, ...parsed.personal }));
          if (parsed.address) setAddress((prev) => ({ ...prev, ...parsed.address }));
          if (parsed.identity) setIdentity((prev) => ({ ...prev, ...parsed.identity }));
          if (parsed.bank) setBank((prev) => ({ ...prev, ...parsed.bank }));
          if (parsed.professional) setProfessional((prev) => ({ ...prev, ...parsed.professional }));
          if (parsed.step) setStep(Math.min(parsed.step, 6));
        }
      } catch {}
    })();
  }, []);

  // Save draft locally & to backend
  const saveDraft = async (silent = false) => {
    setSavingDraft(true);
    try {
      const draftPayload = {
        partnerId: partnerDoc?.id || user?.uid,
        step,
        personal,
        address,
        identity,
        bank,
        professional,
        ...consents,
      };
      await AsyncStorage.setItem(KYC_DRAFT_KEY, JSON.stringify(draftPayload));
      await PartnerApi.saveKycDraft(draftPayload).catch(() => {});
      if (!silent) {
        Alert.alert("Draft Saved", "Your registration progress has been saved. You can continue anytime.");
      }
    } catch {
      if (!silent) Alert.alert("Error", "Could not save draft.");
    } finally {
      setSavingDraft(false);
    }
  };

  // Step Validation Helpers
  const validateStep1 = () => {
    if (personal.legalName.trim().length < 2) return "Please enter your full legal name.";
    if (personal.phone.replace(/\D/g, "").length !== 10) return "Please enter a valid 10-digit mobile number.";
    if (!personal.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email.trim())) return "Please enter a valid email address.";
    if (!personal.dob || personal.dob.trim().length < 4) return "Please enter your date of birth (DD/MM/YYYY).";
    if (!personal.profileImageUrl) return "Please upload your profile photograph.";
    return null;
  };

  const validateStep2 = () => {
    if (!address.houseNumber.trim()) return "House or flat number is required.";
    if (!address.street.trim()) return "Street, road or area is required.";
    if (!address.city.trim()) return "City is required.";
    if (!address.state.trim()) return "State is required.";
    if (address.pincode.replace(/\D/g, "").length !== 6) return "Please enter a valid 6-digit PIN code.";
    if (!address.latitude || !address.longitude) return "Please select your location on Google Maps.";
    return null;
  };

  const validateStep3 = () => {
    const cleanAadhaar = identity.aadhaarNumber.replace(/\D/g, "");
    if (cleanAadhaar.length !== 12) return "Please enter a valid 12-digit Aadhaar number.";
    if (!identity.aadhaarFrontUrl) return "Please upload the front side of your Aadhaar card.";
    if (!identity.aadhaarBackUrl) return "Please upload the back side of your Aadhaar card.";
    const cleanPan = identity.panNumber.trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) return "Please enter a valid 10-character PAN number (e.g. ABCDE1234F).";
    if (!identity.panCardUrl) return "Please upload a clear photo of your PAN card.";
    return null;
  };

  const validateStep4 = () => {
    if (bank.accountHolderName.trim().length < 2) return "Account holder name is required.";
    const cleanAcc = bank.accountNumber.replace(/\s/g, "");
    if (cleanAcc.length < 8 || cleanAcc.length > 20) return "Please enter a valid bank account number.";
    if (cleanAcc !== bank.confirmAccountNumber.replace(/\s/g, "")) return "Bank account numbers do not match.";
    const cleanIfsc = bank.ifscCode.trim().toUpperCase();
    if (cleanIfsc.length !== 11) return "Please enter a valid 11-character IFSC code.";
    if (bank.bankName.trim().length < 2) return "Bank name is required.";
    if (!bank.chequeOrPassbookUrl) return "Please upload a cancelled cheque or bank passbook document.";
    return null;
  };

  const validateStep5 = () => {
    if (professional.categoryIds.length === 0) return "Please select at least one service category you provide.";
    if (!professional.skills.trim()) return "Please describe your trade skills and specialization.";
    return null;
  };

  const handleNext = () => {
    setError(null);
    let stepError: string | null = null;
    if (step === 1) stepError = validateStep1();
    else if (step === 2) stepError = validateStep2();
    else if (step === 3) stepError = validateStep3();
    else if (step === 4) stepError = validateStep4();
    else if (step === 5) stepError = validateStep5();

    if (stepError) {
      setError(stepError);
      return;
    }

    // Auto save draft on advancing step
    saveDraft(true);
    setStep((s) => Math.min(s + 1, 6));
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) {
      setStep((s) => s - 1);
    } else {
      navigation.goBack();
    }
  };

  const toggleCategory = (catId: string) => {
    setProfessional((prev) => {
      const exists = prev.categoryIds.includes(catId);
      const nextIds = exists
        ? prev.categoryIds.filter((id) => id !== catId)
        : [...prev.categoryIds, catId];
      return {
        ...prev,
        categoryIds: nextIds.length > 0 ? nextIds : [catId],
        categoryId: nextIds[0] || catId,
      };
    });
  };

  const handleSubmitKyc = async () => {
    setError(null);
    if (!consents.declarationsAccepted || !consents.termsAccepted || !consents.consentAccepted) {
      setError("You must accept all mandatory declarations and terms to submit KYC.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        partnerId: partnerDoc?.id || user?.uid,
        personal,
        address: {
          ...address,
          fullAddress: address.fullAddress || `${address.houseNumber}, ${address.street}, ${address.city}, ${address.state} - ${address.pincode}`,
        },
        identity,
        bank,
        professional: {
          ...professional,
          skills: professional.skills.trim() || SERVICE_CATEGORIES.find((c) => c.id === professional.categoryId)?.label || "",
        },
        ...consents,
      };

      const res = await PartnerApi.submitKyc(payload);
      await AsyncStorage.removeItem(KYC_DRAFT_KEY);

      Alert.alert(
        "KYC Successfully Submitted",
        "Your KYC application has been received. Our operations team will verify your documents within 24-48 hours. You will be notified once activated.",
        [
          {
            text: "View Status",
            onPress: () => {
              refreshPartnerDoc();
              navigation.navigate("PendingApproval");
            },
          },
        ],
      );
    } catch (err: any) {
      setError(err?.message || "KYC submission failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <Header
        title="Partner KYC Onboarding"
        subtitle={`Step ${step} of 6: ${
          step === 1
            ? "Personal Details"
            : step === 2
              ? "Address & Google Maps"
              : step === 3
                ? "Identity Verification"
                : step === 4
                  ? "Bank Details"
                  : step === 5
                    ? "Professional Credentials"
                    : "Final Review & Submit"
        }`}
        showBack
        onBack={handleBack}
        rightAction={
          <TouchableOpacity onPress={() => saveDraft(false)} disabled={savingDraft}>
            <Text style={styles.draftBtnText}>{savingDraft ? "Saving..." : "Save Draft"}</Text>
          </TouchableOpacity>
        }
      />

      {/* 6-Step Visual Progress Bar */}
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View
            key={i}
            style={[
              styles.progressBarSegment,
              i < step && styles.progressBarDone,
              i === step && styles.progressBarActive,
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        {/* ---------------- STEP 1: PERSONAL DETAILS ---------------- */}
        {step === 1 && (
          <View style={styles.stepSection}>
            <Text style={styles.stepTitle}>Step 1: Personal Details</Text>
            <Text style={styles.stepSubtitle}>
              Please provide your legal name and contact information matching your government ID.
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Full Legal Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter full name as on Aadhaar/PAN"
                placeholderTextColor={COLORS.textTertiary}
                value={personal.legalName}
                onChangeText={(v) => setPersonal({ ...personal, legalName: v })}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Verified Mobile Number *</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.phonePrefix}>
                  <Text style={styles.phonePrefixText}>+91</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.phoneInput]}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={personal.phone}
                  onChangeText={(v) => setPersonal({ ...personal, phone: v })}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="partner@example.com"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                value={personal.email}
                onChangeText={(v) => setPersonal({ ...personal, email: v })}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Date of Birth * (DD/MM/YYYY)</Text>
              <TextInput
                style={styles.input}
                placeholder="DD/MM/YYYY"
                placeholderTextColor={COLORS.textTertiary}
                value={personal.dob}
                onChangeText={(v) => setPersonal({ ...personal, dob: v })}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Gender (Optional)</Text>
              <View style={styles.chipsRow}>
                {GENDER_OPTIONS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setPersonal({ ...personal, gender: g })}
                    style={[styles.chip, personal.gender === g && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, personal.gender === g && styles.chipTextActive]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <DocumentUploader
              label="Profile Photograph"
              description="Upload a clean, well-lit face photo for customer identification"
              value={personal.profileImageUrl}
              onUpload={(uri) => setPersonal({ ...personal, profileImageUrl: uri })}
              onRemove={() => setPersonal({ ...personal, profileImageUrl: "" })}
              aspect={[1, 1]}
            />
          </View>
        )}

        {/* ---------------- STEP 2: ADDRESS & GOOGLE MAPS ---------------- */}
        {step === 2 && (
          <View style={styles.stepSection}>
            <Text style={styles.stepTitle}>Step 2: Residential Address & GPS</Text>
            <Text style={styles.stepSubtitle}>
              Pinpoint your base service location on Google Maps for accurate booking dispatch.
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>House / Flat / Unit Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Flat 402, Block B"
                placeholderTextColor={COLORS.textTertiary}
                value={address.houseNumber}
                onChangeText={(v) => setAddress({ ...address, houseNumber: v })}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Street / Locality / Area *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Sector 48, Sohna Road"
                placeholderTextColor={COLORS.textTertiary}
                value={address.street}
                onChangeText={(v) => setAddress({ ...address, street: v })}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>City *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Gurugram"
                  placeholderTextColor={COLORS.textTertiary}
                  value={address.city}
                  onChangeText={(v) => setAddress({ ...address, city: v })}
                />
              </View>

              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>PIN Code *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="6-digit PIN"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={address.pincode}
                  onChangeText={(v) => setAddress({ ...address, pincode: v })}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>State *</Text>
              <TextInput
                style={styles.input}
                placeholder="Haryana"
                placeholderTextColor={COLORS.textTertiary}
                value={address.state}
                onChangeText={(v) => setAddress({ ...address, state: v })}
              />
            </View>

            {/* Google Maps Location Pin Drop */}
            <GoogleMapPicker
              latitude={address.latitude}
              longitude={address.longitude}
              addressString={address.fullAddress || `${address.houseNumber}, ${address.street}`}
              onLocationSelect={({ latitude, longitude, formattedAddress, city, pincode }) => {
                setAddress((prev) => ({
                  ...prev,
                  latitude,
                  longitude,
                  fullAddress: formattedAddress || prev.fullAddress,
                  city: city || prev.city,
                  pincode: pincode || prev.pincode,
                }));
              }}
            />
          </View>
        )}

        {/* ---------------- STEP 3: IDENTITY VERIFICATION ---------------- */}
        {step === 3 && (
          <View style={styles.stepSection}>
            <Text style={styles.stepTitle}>Step 3: Identity Verification (KYC)</Text>
            <Text style={styles.stepSubtitle}>
              Government-issued identity cards are required for background verification and safety.
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Aadhaar Card Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="12-digit Aadhaar Number"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="number-pad"
                maxLength={12}
                value={identity.aadhaarNumber}
                onChangeText={(v) => setIdentity({ ...identity, aadhaarNumber: v.replace(/\D/g, "") })}
              />
            </View>

            <DocumentUploader
              label="Aadhaar Card Front Image"
              description="Front side showing your name, photo, and Aadhaar number"
              value={identity.aadhaarFrontUrl}
              onUpload={(uri) => setIdentity({ ...identity, aadhaarFrontUrl: uri })}
              onRemove={() => setIdentity({ ...identity, aadhaarFrontUrl: "" })}
            />

            <DocumentUploader
              label="Aadhaar Card Back Image"
              description="Back side showing your address and QR code"
              value={identity.aadhaarBackUrl}
              onUpload={(uri) => setIdentity({ ...identity, aadhaarBackUrl: uri })}
              onRemove={() => setIdentity({ ...identity, aadhaarBackUrl: "" })}
            />

            <View style={[styles.field, { marginTop: SPACING.md }]}>
              <Text style={styles.label}>PAN Card Number *</Text>
              <TextInput
                style={[styles.input, { textTransform: "uppercase" }]}
                placeholder="e.g. ABCDE1234F"
                placeholderTextColor={COLORS.textTertiary}
                autoCapitalize="characters"
                maxLength={10}
                value={identity.panNumber}
                onChangeText={(v) => setIdentity({ ...identity, panNumber: v.toUpperCase() })}
              />
            </View>

            <DocumentUploader
              label="PAN Card Photo"
              description="Clear photo of the original PAN card"
              value={identity.panCardUrl}
              onUpload={(uri) => setIdentity({ ...identity, panCardUrl: uri })}
              onRemove={() => setIdentity({ ...identity, panCardUrl: "" })}
            />
          </View>
        )}

        {/* ---------------- STEP 4: BANK DETAILS ---------------- */}
        {step === 4 && (
          <View style={styles.stepSection}>
            <Text style={styles.stepTitle}>Step 4: Bank Details for Payouts</Text>
            <Text style={styles.stepSubtitle}>
              Your service commissions and job earnings will be deposited directly to this account.
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Account Holder Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Name as registered with the bank"
                placeholderTextColor={COLORS.textTertiary}
                value={bank.accountHolderName}
                onChangeText={(v) => setBank({ ...bank, accountHolderName: v })}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Bank Account Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter bank account number"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="number-pad"
                value={bank.accountNumber}
                onChangeText={(v) => setBank({ ...bank, accountNumber: v })}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirm Account Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter bank account number"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="number-pad"
                value={bank.confirmAccountNumber}
                onChangeText={(v) => setBank({ ...bank, confirmAccountNumber: v })}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>IFSC Code *</Text>
                <TextInput
                  style={[styles.input, { textTransform: "uppercase" }]}
                  placeholder="e.g. HDFC0001234"
                  placeholderTextColor={COLORS.textTertiary}
                  autoCapitalize="characters"
                  maxLength={11}
                  value={bank.ifscCode}
                  onChangeText={(v) => setBank({ ...bank, ifscCode: v.toUpperCase() })}
                />
              </View>

              <View style={[styles.field, { flex: 1.2 }]}>
                <Text style={styles.label}>Bank Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. HDFC Bank"
                  placeholderTextColor={COLORS.textTertiary}
                  value={bank.bankName}
                  onChangeText={(v) => setBank({ ...bank, bankName: v })}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>UPI ID (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. partner@upi"
                placeholderTextColor={COLORS.textTertiary}
                autoCapitalize="none"
                value={bank.upiId}
                onChangeText={(v) => setBank({ ...bank, upiId: v })}
              />
            </View>

            <DocumentUploader
              label="Cancelled Cheque or Passbook"
              description="Upload cancelled cheque or front page of passbook showing account number and IFSC"
              value={bank.chequeOrPassbookUrl}
              onUpload={(uri) => setBank({ ...bank, chequeOrPassbookUrl: uri })}
              onRemove={() => setBank({ ...bank, chequeOrPassbookUrl: "" })}
            />
          </View>
        )}

        {/* ---------------- STEP 5: PROFESSIONAL DETAILS ---------------- */}
        {step === 5 && (
          <View style={styles.stepSection}>
            <Text style={styles.stepTitle}>Step 5: Professional Trade Details</Text>
            <Text style={styles.stepSubtitle}>
              Select the service categories you specialize in and detail your trade background.
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Select Service Categories (Multi-select) *</Text>
              <View style={styles.categoriesGrid}>
                {SERVICE_CATEGORIES.map((cat) => {
                  const selected = professional.categoryIds.includes(cat.id);
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => toggleCategory(cat.id)}
                      style={[styles.categoryCard, selected && styles.categoryCardSelected]}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={22}
                        color={selected ? COLORS.primary : COLORS.textSecondary}
                      />
                      <Text
                        style={[
                          styles.categoryCardText,
                          selected && styles.categoryCardTextSelected,
                        ]}
                      >
                        {cat.label}
                      </Text>
                      {selected ? (
                        <View style={styles.catCheck}>
                          <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Total Work Experience *</Text>
              <View style={styles.chipsRow}>
                {EXPERIENCE_OPTIONS.map((exp) => (
                  <TouchableOpacity
                    key={exp}
                    onPress={() => setProfessional({ ...professional, experienceYears: exp })}
                    style={[styles.chip, professional.experienceYears === exp && styles.chipActive]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        professional.experienceYears === exp && styles.chipTextActive,
                      ]}
                    >
                      {exp}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Trade Skills & Specialization *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g. Copper piping, inverter PCB repair, split AC gas charging, water heater installation"
                placeholderTextColor={COLORS.textTertiary}
                multiline
                numberOfLines={3}
                value={professional.skills}
                onChangeText={(v) => setProfessional({ ...professional, skills: v })}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Previous Work Details (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Mention previous companies, authorized service centers, or projects you have handled"
                placeholderTextColor={COLORS.textTertiary}
                multiline
                numberOfLines={2}
                value={professional.experienceDetails}
                onChangeText={(v) => setProfessional({ ...professional, experienceDetails: v })}
              />
            </View>
          </View>
        )}

        {/* ---------------- STEP 6: FINAL REVIEW & DECLARATIONS ---------------- */}
        {step === 6 && (
          <View style={styles.stepSection}>
            <Text style={styles.stepTitle}>Step 6: Review & Final Submission</Text>
            <Text style={styles.stepSubtitle}>
              Please verify all your details before submitting your mandatory KYC application.
            </Text>

            {/* Summary Review Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Ionicons name="person-circle" size={24} color={COLORS.primary} />
                <Text style={styles.summaryHeaderText}>Personal & Contact</Text>
                <TouchableOpacity onPress={() => setStep(1)} style={styles.editLink}>
                  <Text style={styles.editLinkText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.summaryLine}>Name: {personal.legalName}</Text>
              <Text style={styles.summaryLine}>Phone: +91 {personal.phone}</Text>
              <Text style={styles.summaryLine}>Email: {personal.email}</Text>
              <Text style={styles.summaryLine}>DOB: {personal.dob}</Text>

              <View style={[styles.summaryHeader, { marginTop: SPACING.md }]}>
                <Ionicons name="location" size={22} color={COLORS.primary} />
                <Text style={styles.summaryHeaderText}>Residential & GPS</Text>
                <TouchableOpacity onPress={() => setStep(2)} style={styles.editLink}>
                  <Text style={styles.editLinkText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.summaryLine}>
                Address: {address.houseNumber}, {address.street}, {address.city} - {address.pincode}
              </Text>
              <Text style={styles.summaryLine}>
                GPS: {address.latitude?.toFixed(4)}, {address.longitude?.toFixed(4)}
              </Text>

              <View style={[styles.summaryHeader, { marginTop: SPACING.md }]}>
                <Ionicons name="card" size={22} color={COLORS.primary} />
                <Text style={styles.summaryHeaderText}>Identity & Bank</Text>
                <TouchableOpacity onPress={() => setStep(3)} style={styles.editLink}>
                  <Text style={styles.editLinkText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.summaryLine}>Aadhaar: XXXX XXXX {identity.aadhaarNumber.slice(-4)}</Text>
              <Text style={styles.summaryLine}>PAN: {identity.panNumber}</Text>
              <Text style={styles.summaryLine}>Bank: {bank.bankName} (A/C: XXXXXX{bank.accountNumber.slice(-4)})</Text>
              <Text style={styles.summaryLine}>IFSC: {bank.ifscCode}</Text>

              <View style={[styles.summaryHeader, { marginTop: SPACING.md }]}>
                <Ionicons name="briefcase" size={22} color={COLORS.primary} />
                <Text style={styles.summaryHeaderText}>Trade Credentials</Text>
                <TouchableOpacity onPress={() => setStep(5)} style={styles.editLink}>
                  <Text style={styles.editLinkText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.summaryLine}>
                Services: {professional.categoryIds.map((id) => SERVICE_CATEGORIES.find((c) => c.id === id)?.label || id).join(", ")}
              </Text>
              <Text style={styles.summaryLine}>Experience: {professional.experienceYears}</Text>
            </View>

            {/* Mandatory Checkbox Declarations */}
            <View style={styles.declarationsBox}>
              <TouchableOpacity
                onPress={() => setConsents({ ...consents, declarationsAccepted: !consents.declarationsAccepted })}
                style={styles.checkboxRow}
              >
                <Ionicons
                  name={consents.declarationsAccepted ? "checkbox" : "square-outline"}
                  size={22}
                  color={consents.declarationsAccepted ? COLORS.primary : COLORS.textTertiary}
                />
                <Text style={styles.checkboxText}>
                  I declare that all personal, address, identity, and bank details provided are authentic, true, and valid.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setConsents({ ...consents, consentAccepted: !consents.consentAccepted })}
                style={styles.checkboxRow}
              >
                <Ionicons
                  name={consents.consentAccepted ? "checkbox" : "square-outline"}
                  size={22}
                  color={consents.consentAccepted ? COLORS.primary : COLORS.textTertiary}
                />
                <Text style={styles.checkboxText}>
                  I consent to verification of my trade credentials, documents, and identity by Repair Series Operations.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setConsents({ ...consents, termsAccepted: !consents.termsAccepted })}
                style={styles.checkboxRow}
              >
                <Ionicons
                  name={consents.termsAccepted ? "checkbox" : "square-outline"}
                  size={22}
                  color={consents.termsAccepted ? COLORS.primary : COLORS.textTertiary}
                />
                <Text style={styles.checkboxText}>
                  I agree to the Repair Series Partner Terms & Conditions, Code of Conduct, and Privacy Policy.
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Footer Navigation Buttons */}
        <View style={styles.footerRow}>
          {step > 1 ? (
            <Button
              title="Previous"
              variant="outline"
              size="md"
              onPress={handleBack}
              style={{ flex: 1, marginRight: 8 }}
            />
          ) : null}

          {step < 6 ? (
            <Button
              title="Save & Continue"
              variant="primary"
              size="md"
              onPress={handleNext}
              style={{ flex: 1 }}
            />
          ) : (
            <Button
              title="Submit Complete KYC"
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleSubmitKyc}
              style={{ flex: 1 }}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  draftBtnText: {
    ...TYPOGRAPHY.small,
    fontWeight: "700",
    color: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  progressContainer: {
    flexDirection: "row",
    height: 4,
    backgroundColor: COLORS.border,
    width: "100%",
  },
  progressBarSegment: {
    flex: 1,
    backgroundColor: COLORS.border,
  },
  progressBarActive: {
    backgroundColor: COLORS.primary,
  },
  progressBarDone: {
    backgroundColor: COLORS.success,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: `${COLORS.danger}15`,
    borderColor: `${COLORS.danger}40`,
    borderWidth: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  errorBannerText: {
    ...TYPOGRAPHY.small,
    color: COLORS.danger,
    fontWeight: "700",
    flex: 1,
  },
  stepSection: {
    marginBottom: SPACING.lg,
  },
  stepTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: 4,
  },
  stepSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 18,
  },
  field: {
    marginBottom: SPACING.md,
  },
  label: {
    ...TYPOGRAPHY.caption,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  input: {
    height: 46,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  textArea: {
    height: 80,
    paddingTop: SPACING.sm,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  phoneInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  phonePrefix: {
    height: 46,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderTopLeftRadius: RADIUS.md,
    borderBottomLeftRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 0,
  },
  phonePrefixText: {
    ...TYPOGRAPHY.body,
    fontWeight: "700",
    color: COLORS.text,
  },
  phoneInput: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  chipActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}15`,
  },
  chipText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  chipTextActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryCard: {
    width: "48%",
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    position: "relative",
  },
  categoryCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  categoryCardText: {
    ...TYPOGRAPHY.small,
    fontWeight: "600",
    color: COLORS.text,
    flex: 1,
  },
  categoryCardTextSelected: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  catCheck: {
    position: "absolute",
    right: 6,
    top: 6,
  },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  summaryHeaderText: {
    ...TYPOGRAPHY.caption,
    fontWeight: "800",
    color: COLORS.text,
    flex: 1,
  },
  editLink: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  editLinkText: {
    ...TYPOGRAPHY.small,
    fontWeight: "700",
    color: COLORS.primary,
  },
  summaryLine: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginBottom: 3,
    paddingLeft: 28,
  },
  declarationsBox: {
    backgroundColor: `${COLORS.primary}08`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}25`,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: 12,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  checkboxText: {
    ...TYPOGRAPHY.small,
    color: COLORS.text,
    flex: 1,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.lg,
  },
});
