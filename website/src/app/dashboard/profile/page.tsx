"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  Headphones,
  MapPin,
  Settings,
  Star,
  ShieldCheck,
  FileText,
  Info,
  LogOut,
  ChevronRight,
  User,
  Phone,
  Mail,
  Camera,
  X,
  Loader2,
  Check,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Container } from "@/components/container";
import { useAuth } from "@/hooks/use-auth";
import { logOut } from "@/lib/firebase/auth-actions";
import { getDb } from "@/lib/firebase/firestore";
import { updateCustomerProfile } from "@/lib/firebase/customer";
import { uploadImage } from "@/lib/media/upload";

// Application version
const APP_VERSION = "v1.0.4";

export default function ProfilePage() {
  const router = useRouter();
  const { user, customer } = useAuth();
  const db = useMemo(() => getDb(), []);

  // Profile data
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [photoURL, setPhotoURL] = useState("");

  // Modals & States
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Edit form states
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const rawName = customer?.name || user?.displayName || "";
    const rawPhone =
      customer?.phone ||
      String((customer as Record<string, unknown> | null)?.mobile || "") ||
      user?.phoneNumber ||
      "";
    const rawEmail = customer?.email || user?.email || "";
    const rawPhoto =
      customer?.photoURL ||
      String((customer as Record<string, unknown> | null)?.photoUrl || "") ||
      user?.photoURL ||
      "";

    setName(rawName);
    setPhone(rawPhone);
    setEmail(rawEmail);
    setPhotoURL(rawPhoto);

    setEditName(rawName);
    setEditEmail(rawEmail);
  }, [customer, user]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logOut();
      setShowLogoutModal(false);
      router.replace("/");
    } catch {
      setLoggingOut(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user) return;
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const trimmedName = editName.trim();
      const trimmedEmail = editEmail.trim().toLowerCase();
      if (!trimmedName) throw new Error("Name cannot be empty");

      await updateCustomerProfile(db, user.uid, {
        name: trimmedName,
        email: trimmedEmail,
        ...(photoURL ? { photoURL, photoUrl: photoURL } : {}),
      });

      setName(trimmedName);
      setEmail(trimmedEmail);
      setProfileMsg({ type: "success", text: "Profile details updated successfully!" });
      setTimeout(() => setShowSettingsModal(false), 800);
    } catch (err) {
      setProfileMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update profile",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePhotoUpload = async (file: File | null) => {
    if (!file || !db || !user) return;
    setUploadingPhoto(true);
    setProfileMsg(null);
    try {
      const token = await user.getIdToken();
      const uploaded = await uploadImage(file, { kind: "profile-user", token });
      setPhotoURL(uploaded.url);
      await updateCustomerProfile(db, user.uid, {
        photoURL: uploaded.url,
        photoUrl: uploaded.url,
      });
      setProfileMsg({ type: "success", text: "Profile photo updated!" });
    } catch (err) {
      setProfileMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Photo upload failed",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Avatar initial letter
  const initial = (name || user?.email || "U").slice(0, 1).toUpperCase();

  // Menu items for Account Settings Container
  const accountSettingsItems = [
    {
      id: "addresses",
      name: "Manage Addresses",
      desc: "Saved home, office and other service addresses",
      icon: MapPin,
      iconColor: "text-amber-600 bg-amber-50",
      href: "/dashboard/addresses",
    },
    {
      id: "settings",
      name: "Settings",
      desc: "Update your name, email and preferences",
      icon: Settings,
      iconColor: "text-blue-600 bg-blue-50",
      onClick: () => setShowSettingsModal(true),
    },
    {
      id: "rating",
      name: "My Rating",
      desc: "View your verified repair service ratings",
      icon: Star,
      iconColor: "text-yellow-600 bg-yellow-50",
      onClick: () => setShowRatingModal(true),
    },
    {
      id: "privacy",
      name: "Privacy & Policy",
      desc: "How Repair Series protects and handles your data",
      icon: ShieldCheck,
      iconColor: "text-emerald-600 bg-emerald-50",
      href: "/privacy-policy",
    },
    {
      id: "terms",
      name: "Terms & Conditions",
      desc: "Service terms, warranties and customer rights",
      icon: FileText,
      iconColor: "text-purple-600 bg-purple-50",
      href: "/terms",
    },
    {
      id: "about",
      name: "About RS",
      desc: "Repair Series mission, cities and standards",
      icon: Info,
      iconColor: "text-slate-600 bg-slate-100",
      href: "/about",
    },
  ];

  return (
    <div className="min-h-full py-4 sm:py-8 lg:py-12 bg-[#F8FAFC]">
      <Container className="max-w-4xl px-4 sm:px-6">

        {/* ============================================================== */}
        {/* MOBILE VIEW (< lg)                                            */}
        {/* ============================================================== */}
        <div className="block lg:hidden space-y-5 animate-in fade-in duration-300">
          
          {/* A. Profile Header */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <h1 className="text-xl font-black tracking-tight text-slate-900 mb-4">
              My Profile
            </h1>
            <div className="flex items-center gap-4">
              <div className="relative size-16 shrink-0 rounded-full bg-gradient-to-br from-[#C45508] to-[#9A3412] p-0.5 shadow-sm">
                <div className="size-full overflow-hidden rounded-full bg-white flex items-center justify-center">
                  {photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoURL} alt={name} className="size-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black text-[#C45508]">{initial}</span>
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-lg font-bold text-slate-900">
                  {name || "Customer"}
                </div>
                <div className="truncate text-xs font-semibold text-slate-500 mt-0.5">
                  {phone || "Phone not linked"}
                </div>
                {email ? (
                  <div className="truncate text-[11px] font-medium text-slate-400 mt-0.5">
                    {email}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* B. Quick Access Cards (Side-by-Side) */}
          <div className="grid grid-cols-2 gap-3">
            {/* 1. My Bookings */}
            <Link
              href="/dashboard/bookings"
              className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all active:scale-[0.98] hover:border-slate-300 hover:shadow-sm"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-orange-50 text-[#C45508] border border-orange-100/80 mb-3 group-hover:scale-105 transition-transform">
                <CalendarCheck className="size-5.5" />
              </div>
              <div>
                <span className="block text-sm font-bold text-slate-900 leading-snug">
                  My Bookings
                </span>
                <span className="block text-[11px] font-medium text-slate-400 mt-0.5">
                  View past & active
                </span>
              </div>
            </Link>

            {/* 2. Help & Support */}
            <Link
              href="/contact"
              className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all active:scale-[0.98] hover:border-slate-300 hover:shadow-sm"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100/80 mb-3 group-hover:scale-105 transition-transform">
                <Headphones className="size-5.5" />
              </div>
              <div>
                <span className="block text-sm font-bold text-slate-900 leading-snug">
                  Help & Support
                </span>
                <span className="block text-[11px] font-medium text-slate-400 mt-0.5">
                  Assistance 24/7
                </span>
              </div>
            </Link>
          </div>

          {/* C. Account Settings Container (Rounded Container with 6 items: Icon + Name + Right Arrow) */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs divide-y divide-slate-100">
            {accountSettingsItems.map((item) => {
              const Icon = item.icon;
              const content = (
                <div className="flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-slate-50/80 active:bg-slate-100">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${item.iconColor}`}>
                      <Icon className="size-4.5" />
                    </div>
                    <div className="truncate">
                      <span className="block text-sm font-bold text-slate-800 leading-tight">
                        {item.name}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-slate-400" />
                </div>
              );

              if (item.href) {
                return (
                  <Link key={item.id} href={item.href} className="block cursor-pointer">
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  className="w-full text-left cursor-pointer"
                >
                  {content}
                </button>
              );
            })}
          </div>

          {/* D. Logout Button (Full-width red outline + red text + logout icon) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-red-500 bg-white py-3.5 text-sm font-bold text-red-600 shadow-xs transition-all active:scale-[0.98] hover:bg-red-50/50"
            >
              <LogOut className="size-4.5" />
              <span>Logout</span>
            </button>
          </div>

          {/* E. App Version */}
          <div className="pt-2 pb-6 text-center">
            <span className="text-xs font-semibold text-slate-400 tracking-wide">
              App Version {APP_VERSION}
            </span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* DESKTOP VIEW (>= lg)                                           */}
        {/* ============================================================== */}
        <div className="hidden lg:block animate-in fade-in duration-300">
          
          {/* Dedicated Profile Header Card */}
          <div className="mb-8 rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="relative size-20 shrink-0 rounded-full bg-gradient-to-br from-[#C45508] to-[#9A3412] p-0.5 shadow-sm">
                  <div className="size-full overflow-hidden rounded-full bg-white flex items-center justify-center">
                    {photoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoURL} alt={name} className="size-full object-cover" />
                    ) : (
                      <span className="text-3xl font-black text-[#C45508]">{initial}</span>
                    )}
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900">
                    {name || "Customer Profile"}
                  </h1>
                  <div className="mt-1 flex items-center gap-4 text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Phone className="size-3.5 text-[#C45508]" />
                      {phone || "No phone added"}
                    </span>
                    {email ? (
                      <span className="flex items-center gap-1.5">
                        <Mail className="size-3.5 text-slate-400" />
                        {email}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-800 shadow-xs transition hover:bg-white hover:border-slate-300 active:scale-95"
              >
                <Settings className="size-3.5 text-[#C45508]" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Balanced 2-Column Panel Layout */}
          <div className="grid grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Quick Cards & Account Info (Col 5) */}
            <div className="col-span-5 space-y-6">
              
              {/* Quick Access Cards */}
              <div className="space-y-3">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
                  Quick Actions
                </h2>

                {/* My Bookings Card */}
                <Link
                  href="/dashboard/bookings"
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all hover:border-[#C45508]/30 hover:shadow-sm"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#C45508] border border-orange-100 group-hover:scale-105 transition-transform">
                    <CalendarCheck className="size-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900 group-hover:text-[#C45508] transition-colors">
                      My Bookings
                    </div>
                    <div className="text-xs font-medium text-slate-500 truncate">
                      Track active, scheduled & past repair services
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                {/* Help & Support Card */}
                <Link
                  href="/contact"
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all hover:border-blue-500/30 hover:shadow-sm"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:scale-105 transition-transform">
                    <Headphones className="size-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      Help & Support
                    </div>
                    <div className="text-xs font-medium text-slate-500 truncate">
                      Get customer support, call, or chat with us
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {/* Logout & App Version Box */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(true)}
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-red-500 bg-white py-2.5 text-sm font-bold text-red-600 shadow-xs transition hover:bg-red-50 active:scale-95"
                >
                  <LogOut className="size-4" />
                  <span>Log Out</span>
                </button>
                <div className="text-center">
                  <span className="text-xs font-medium text-slate-400">
                    Repair Series {APP_VERSION}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Organized Account Settings Container (Col 7) */}
            <div className="col-span-7">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1 mb-3">
                Account Settings
              </h2>
              <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs divide-y divide-slate-100">
                {accountSettingsItems.map((item) => {
                  const Icon = item.icon;
                  const inner = (
                    <div className="flex items-center justify-between p-4.5 transition-colors hover:bg-slate-50/80">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${item.iconColor}`}>
                          <Icon className="size-5" />
                        </div>
                        <div className="truncate">
                          <span className="block text-sm font-bold text-slate-900 leading-snug">
                            {item.name}
                          </span>
                          <span className="block text-xs font-normal text-slate-500 truncate mt-0.5">
                            {item.desc}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-slate-400 ml-3" />
                    </div>
                  );

                  if (item.href) {
                    return (
                      <Link key={item.id} href={item.href} className="block cursor-pointer">
                        {inner}
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={item.onClick}
                      className="w-full text-left cursor-pointer"
                    >
                      {inner}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </Container>

      {/* ============================================================== */}
      {/* LOGOUT CONFIRMATION POPUP MODAL                                */}
      {/* ============================================================== */}
      {showLogoutModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-4 border border-red-100">
              <LogOut className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Confirm Logout</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
              Are you sure you want to log out of your Repair Series account on this device?
            </p>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                disabled={loggingOut}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-red-700 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loggingOut ? <Loader2 className="size-4 animate-spin" /> : null}
                <span>{loggingOut ? "Logging out..." : "Yes, Log Out"}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ============================================================== */}
      {/* SETTINGS / EDIT PROFILE MODAL                                  */}
      {/* ============================================================== */}
      {showSettingsModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Account Settings</h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
              {/* Photo Upload row */}
              <div className="flex items-center gap-4">
                <div className="relative size-16 shrink-0 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                  {photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoURL} alt="" className="size-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-slate-400">{initial}</span>
                  )}
                  {uploadingPhoto ? (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                      <Loader2 className="size-5 animate-spin" />
                    </div>
                  ) : null}
                </div>
                <div>
                  <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer">
                    <Camera className="size-3.5" />
                    <span>Change Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => void handlePhotoUpload(e.target.files?.[0] || null)}
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1">PNG, JPG or WEBP (Max 5MB)</p>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-[#C45508] focus:ring-2 focus:ring-[#C45508]/15 outline-none transition"
                  placeholder="Enter your name"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-[#C45508] focus:ring-2 focus:ring-[#C45508]/15 outline-none transition"
                  placeholder="name@example.com"
                />
              </div>

              {/* Phone (read-only for security) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone || "Not linked"}
                  disabled
                  className="w-full rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-500 outline-none cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Contact support to update your verified mobile number.
                </span>
              </div>

              {profileMsg ? (
                <div
                  className={`rounded-xl p-3 text-xs font-semibold flex items-center gap-2 ${
                    profileMsg.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {profileMsg.type === "success" ? <Check className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
                  <span>{profileMsg.text}</span>
                </div>
              ) : null}

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex-1 rounded-xl bg-[#C45508] py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-[#a84706] transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {savingProfile ? <Loader2 className="size-4 animate-spin" /> : null}
                  <span>{savingProfile ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* ============================================================== */}
      {/* MY RATING MODAL                                                */}
      {/* ============================================================== */}
      {showRatingModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-yellow-50 text-yellow-600 mx-auto mb-4 border border-yellow-200">
              <Star className="size-7 fill-yellow-500 text-yellow-500" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Customer Rating</h3>
            <div className="mt-2 text-3xl font-black text-slate-900">
              4.9 <span className="text-base text-slate-400 font-semibold">/ 5.0</span>
            </div>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              Based on your completed doorstep services, on-time arrivals, and feedback from verified technicians.
            </p>
            <div className="mt-5 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 font-medium border border-slate-100">
              Thank you for being a valued Repair Series member!
            </div>
            <button
              type="button"
              onClick={() => setShowRatingModal(false)}
              className="mt-6 w-full rounded-xl bg-slate-900 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 transition"
            >
              Done
            </button>
          </div>
        </div>
      ) : null}

    </div>
  );
}
