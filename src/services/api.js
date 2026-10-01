// src/services/api.js  (replaces the mock version; same function names so screens keep working)
import { supabase } from "./supabase";
import * as Location from "expo-location";

const STATUS = {
  finding_technician: "Finding technician",
  technician_assigned: "Technician assigned",
  on_the_way: "On the way",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};
const authMessage = (error) => {
  const message = error?.message || "Something went wrong. Please try again.";
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials"))
    return "Email or password is incorrect.";
  if (
    lower.includes("already registered") ||
    lower.includes("already been registered")
  )
    return "An account with this email already exists. Try signing in.";
  if (
    lower.includes("password") &&
    (lower.includes("weak") ||
      lower.includes("at least") ||
      lower.includes("characters"))
  )
    return "Choose a stronger password with at least 8 characters.";
  if (lower.includes("network") || lower.includes("fetch"))
    // return "Could not connect. Check your internet connection and try again.";
  return `Connection error: ${message}`;
  return message;
};
const ensureProfile = async (user, name) => {
  const fullName =
    name?.trim() ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Customer";
  // New profiles use the database's customer default. Omitting role here also
  // preserves roles assigned by an admin when an existing profile is updated.
  const { error } = await supabase.from("profiles").upsert(
    { id: user.id, full_name: fullName },
    // Sign-in should only repair a missing profile row. An existing profile may
    // have been edited by Admin and must remain the source of truth.
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (error) throw error;
};
const requireAuthUserId = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("Sign in is required to continue.");
  return user.id;
};
const fmtWhen = (iso, time) =>
  `${new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · ${time}`;
const parseFutureSchedule = (date, time) => {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date || ""));
  const timeMatch = /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i.exec(
    String(time || "").trim(),
  );
  if (!dateMatch || !timeMatch) return false;
  const [, yearText, monthText, dayText] = dateMatch;
  const [, hourText, minuteText, meridiem] = timeMatch;
  const year = Number(yearText),
    month = Number(monthText),
    day = Number(dayText);
  let hour = Number(hourText);
  const minute = Number(minuteText);
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    hour > (meridiem ? 12 : 23) ||
    hour < (meridiem ? 1 : 0) ||
    minute > 59
  )
    return false;
  if (meridiem) hour = (hour % 12) + (meridiem.toUpperCase() === "PM" ? 12 : 0);
  const scheduled = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    scheduled.getFullYear() !== year ||
    scheduled.getMonth() !== month - 1 ||
    scheduled.getDate() !== day
  )
    return false;
  return scheduled.getTime() > Date.now();
};
const timeAgo = (iso) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "Yesterday" : `${d} days ago`;
};
const mapBooking = (b) => ({
  id: b.code,
  dbId: b.id,
  service: b.services?.name,
  icon: b.services?.icon,
  ...(() => {
    const rawStatus = String(b.status || "")
      .trim()
      .toLowerCase();
    return {
      rawStatus,
      status: STATUS[rawStatus] || rawStatus.replaceAll("_", " "),
    };
  })(),
  when: fmtWhen(b.scheduled_date, b.scheduled_time),
  area:
    [b.bookingAddress?.city, b.bookingAddress?.pincode]
      .filter(Boolean)
      .join(", ") || b.address_line.split(",").slice(-2).join(", ").trim(),
  technician: b.technicians,
  technicianId: b.technician_id,
  createdAt: b.created_at,
  address: b.bookingAddress
    ? [b.bookingAddress.line, b.bookingAddress.city, b.bookingAddress.pincode]
        .filter(Boolean)
        .join(", ")
    : b.address_line,
  addressId: b.address_id,
  bookingPhone: b.phone,
  paymentMethod: b.payment_method,
  paymentStatus: b.payment_status,
  paymentPaidAt: b.payment_paid_at,
  serviceFee: b.service_fee,
  partsEstimate: b.parts_estimate,
  discount: b.discount,
  total: b.total,
  photos: Array.isArray(b.photos) ? b.photos : [],
});
const BOOKING_SELECT = "*, services(name, icon), technicians(*)";
const attachBookingAddresses = async (rows) => {
  const ids = [...new Set(rows.map((row) => row.address_id).filter(Boolean))];
  if (!ids.length) return rows;
  const { data, error } = await supabase
    .from("addresses")
    .select("id, line, city, pincode, latitude, longitude")
    .in("id", ids);
  if (error) throw error;
  return rows.map((row) => ({
    ...row,
    bookingAddress:
      data.find((address) => address.id === row.address_id) || null,
  }));
};
const uploadBookingPhotos = async ({ userId, bookingId, photos }) => {
  const paths = [];
  try {
    for (const photo of photos) {
      if (!photo?.uri || !photo?.mimeType?.startsWith("image/"))
        throw new Error("One of the selected files is not a supported image.");
      if (photo.fileSize && photo.fileSize > 8 * 1024 * 1024)
        throw new Error("Each image must be smaller than 8 MB.");
      const response = await fetch(photo.uri);
      if (!response.ok)
        throw new Error(
          "Could not read a selected image. Please choose it again.",
        );
      const body = await response.arrayBuffer();
      if (body.byteLength > 8 * 1024 * 1024)
        throw new Error("Each image must be smaller than 8 MB.");
      const extension =
        photo.mimeType.split("/")[1]?.replace(/[^a-z0-9]/gi, "") || "jpg";
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
      const path = `${userId}/${bookingId}/${filename}`;
      const { error } = await supabase.storage
        .from("booking-photos")
        .upload(path, body, {
          contentType: photo.mimeType,
          upsert: false,
        });
      if (error) throw error;
      paths.push(path);
    }
    // const { error: updateError } = await supabase.from('bookings').update({ photos: paths }).eq('id', bookingId).select('id').single();
    // if (updateError) throw updateError;

   const { error: updateError } = await supabase.rpc(
  'attach_booking_photos',
  {
    p_booking_id: bookingId,
    p_photos: paths,
  }
);

    if (updateError) throw updateError;
    return { paths };
  } catch (error) {
    if (paths.length) {
      const { error: cleanupError } = await supabase.storage
        .from("booking-photos")
        .remove(paths);
      if (cleanupError)
        console.warn(
          "Could not remove an incomplete booking photo upload:",
          cleanupError.message,
        );
    }
    console.warn("Booking photos could not be uploaded:", error.message);
    return {
      paths: [],
      error:
        "Your booking was saved, but the photos could not be attached. You can still continue.",
    };
  }
};

export const api = {
  // ---------- AUTH ----------
  async signUp(email, password, name) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        // options: { data: { full_name: name.trim() } },
        options: {
  data: { full_name: name.trim() },
  emailRedirectTo: "fixora://auth-callback",
},
      });
      if (error) return { ok: false, error: authMessage(error) };
      if (data.session && data.user) {
        try {
          await ensureProfile(data.user, name);
        } catch (profileError) {
          return {
            ok: true,
            user: data.user,
            needsEmailConfirmation: false,
            profileWarning: profileError.message,
          };
        }
      }
      return {
        ok: true,
        user: data.user,
        needsEmailConfirmation: !data.session,
      };
    } catch (error) {
      return { ok: false, error: authMessage(error) };
    }
  },
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { ok: false, error: authMessage(error) };
      let profileWarning;
      try {
        await ensureProfile(data.user);
      } catch (profileError) {
        profileWarning = profileError.message;
      }
      return { ok: true, user: data.user, profileWarning };
    } catch (error) {
      return { ok: false, error: authMessage(error) };
    }
  },
  // async resetPassword(email) {
  //   try {
  //     const { error } = await supabase.auth.resetPasswordForEmail(email);
  //     return error ? { ok: false, error: authMessage(error) } : { ok: true };
  //   } catch (error) {
  //     return { ok: false, error: authMessage(error) };
  //   }
  // },

  async resetPassword(email) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
    
      redirectTo: "fixora://reset-password",
    });

    return error ? { ok: false, error: authMessage(error) } : { ok: true };
  } catch (error) {
    return { ok: false, error: authMessage(error) };
  }
},


  signOut: () => supabase.auth.signOut(),
  getSession: async () => (await supabase.auth.getSession()).data.session,
  async getProfile() {
    const userId = await requireAuthUserId();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  async uploadProfilePhoto(asset) {
    const userId = await requireAuthUserId();
    if (!asset?.uri) throw new Error("Choose a photo and try again.");
    const response = await fetch(asset.uri);
    if (!response.ok)
      throw new Error(
        "Could not read the selected photo. Please choose it again.",
      );
    const body = await response.arrayBuffer();
    if (!body.byteLength)
      throw new Error("The selected photo is empty. Choose a different image.");
    if (body.byteLength > 5 * 1024 * 1024)
      throw new Error("Choose a photo smaller than 5 MB.");
    const path = `${userId}/avatar.jpg`;
    const contentType = asset.mimeType?.startsWith("image/")
      ? asset.mimeType
      : "image/jpeg";
    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(path, body, {
        contentType,
        upsert: true,
        cacheControl: "0",
      });
    if (uploadError)
      throw new Error("Could not upload your profile photo. Please try again.");
    const publicUrl = supabase.storage.from("profile-photos").getPublicUrl(path)
      .data.publicUrl;
    const avatarUrl = `${publicUrl}?updated=${Date.now()}`;
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", userId)
      .select("id")
      .single();
    if (updateError)
      throw new Error(
        "Your photo was uploaded, but your profile could not be updated. Please try again.",
      );
    return avatarUrl;
  },
  // ---------- SERVICES ----------
  async getServices() {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("active", true)
      .order("sort");
    if (error) throw error;
    return (data || []).map((s) => ({
      ...s,
      desc: s.description || "",
      bookings: s.bookings_count || 0,
      price: s.price || 0,
      tint: s.tint || "#E0F2F5",
      color: s.color || "#1596A6",
      rating: s.rating || 0,
    }));
  },
  async getPaymentSettings() {
    const { data, error } = await supabase
      .from("payment_settings")
      .select("upi_id, upi_enabled, qr_code_url, updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  async getBookmarks() {
    const { data, error } = await supabase
      .from("service_bookmarks")
      .select("service_id")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((item) => item.service_id);
  },
  async addBookmark(serviceId) {
    const user_id = await requireAuthUserId();
    const { error } = await supabase
      .from("service_bookmarks")
      .upsert(
        { user_id, service_id: serviceId },
        { onConflict: "user_id,service_id", ignoreDuplicates: true },
      );
    if (error) throw error;
  },
  async removeBookmark(serviceId) {
    const user_id = await requireAuthUserId();
    const { error } = await supabase
      .from("service_bookmarks")
      .delete()
      .eq("user_id", user_id)
      .eq("service_id", serviceId);
    if (error) throw error;
  },

  async getAddresses() {
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .order("is_default", { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async createAddress({
    label,
    line,
    city,
    pincode,
    latitude,
    longitude,
    is_default = false,
  }) {
    const user_id = await requireAuthUserId();
    const existing = await this.getAddresses();
    const { data, error } = await supabase
      .from("addresses")
      .insert({
        user_id,
        label,
        line,
        city,
        pincode: pincode || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        is_default: is_default || existing.length === 0,
      })
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },
  async updateAddress(id, { label, line, city, pincode, latitude, longitude }) {
    const { data, error } = await supabase
      .from("addresses")
      .update({
        label,
        line,
        city,
        pincode: pincode || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },
  async deleteAddress(id) {
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (error) throw error;
  },
  async setDefaultAddress(id) {
    const addresses = await this.getAddresses();
    if (!addresses.some((item) => item.id === id))
      throw new Error(
        "That saved address could not be found. Refresh the list and try again.",
      );
    const { error: clearError } = await supabase
      .from("addresses")
      .update({ is_default: false })
      .in(
        "id",
        addresses.map((item) => item.id),
      );
    if (clearError) throw clearError;
    const { data, error } = await supabase
      .from("addresses")
      .update({ is_default: true })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },
  async saveProfile({ fullName, phone }) {
    const name = String(fullName || "").trim();
    const exactPhone = String(phone || "").trim();
    if (!name || name.length > 200)
      throw new Error("Enter a name with 1 to 200 characters.");
    if (!/^\+?\d{10,15}$/.test(exactPhone))
      throw new Error(
        "Enter a valid phone number with 10 to 15 digits. A leading + is optional.",
      );
    const user_id = await requireAuthUserId();
    const { data, error } = await supabase
      .from("profiles")
      .update({ full_name: name, phone: exactPhone })
      .eq("id", user_id)
      .select("id, full_name, phone, city, avatar_url")
      .single();
    if (error) throw error;
    return data;
  },
  async getCurrentAddress() {
    let permission;
    try {
      permission = await Location.requestForegroundPermissionsAsync();
    } catch {
      throw new Error(
        "We could not request location access. You can enter your address manually.",
      );
    }
    if (permission.status !== "granted")
      throw new Error(
        "Location permission is off. Allow location access in your device settings, or enter your address manually.",
      );
    let servicesEnabled;
    try {
      servicesEnabled = await Location.hasServicesEnabledAsync();
    } catch {
      throw new Error(
        "We could not check location services. You can enter your address manually.",
      );
    }
    if (!servicesEnabled)
      throw new Error(
        "Location services are turned off. Turn them on or enter your address manually.",
      );
    let position;
    try {
      position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
    } catch {
      throw new Error(
        "We could not get your GPS location. Check that location services are on, or enter your address manually.",
      );
    }
    let results;
    try {
      results = await Location.reverseGeocodeAsync(position.coords);
    } catch {
      throw new Error(
        "We could not turn your location into an address. Please enter it manually.",
      );
    }
    const place = results[0];
    if (!place)
      throw new Error(
        "We could not find a readable address here. Please enter it manually.",
      );
    const line = [place.name, place.street, place.district, place.subregion]
      .filter(Boolean)
      .filter((value, index, all) => all.indexOf(value) === index)
      .join(", ");
    return {
      id: "current-location",
      label: "Current location",
      line: line || "Current location",
      city: place.city || place.subregion || "",
      pincode: place.postalCode || "",
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  },

  // ---------- BOOKINGS ----------
  async createBooking({
    serviceId,
    date,
    time,
    method,
    note,
    addressId,
    phone: bookingPhone,
    photos = [],
  }) {
    const user_id = await requireAuthUserId();
    if (!serviceId || !date || !time || !addressId)
      throw new Error(
        "Choose a service, date, time, and saved address to continue.",
      );
    if (!parseFutureSchedule(date, time))
      throw new Error("Choose a valid date and time in the future.");
    if (method === "upi") {
      const paymentSettings = await this.getPaymentSettings();
      if (
        !paymentSettings?.upi_enabled ||
        !paymentSettings.upi_id ||
        !paymentSettings.qr_code_url
      ) {
        throw new Error(
          "Online UPI payment is unavailable. Choose cash on service.",
        );
      }
    }
    const [
      { data: profile, error: profileError },
      { data: address, error: addressError },
    ] = await Promise.all([
      supabase.from("profiles").select("phone").eq("id", user_id).single(),
      supabase
        .from("addresses")
        .select("id, line, city, pincode, user_id")
        .eq("id", addressId)
        .eq("user_id", user_id)
        .single(),
    ]);
    if (profileError) throw profileError;
    if (addressError || !address)
      throw new Error("Choose one of your saved addresses before booking.");
    const phone = String(bookingPhone || profile?.phone || "").trim();
    if (phone.replace(/\D/g, "").length < 10)
      throw new Error(
        "Please add a valid phone number to your profile before booking.",
      );
    const addressLine = [address.line, address.city, address.pincode]
      .filter(Boolean)
      .join(", ");
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        user_id,
        service_id: serviceId,
        scheduled_date: date,
        scheduled_time: time,
        address_id: address.id,
        address_line: addressLine,
        phone,
        notes: note || null,
        photos: [],
        payment_method: method === "upi" ? "upi" : "cash",
        payment_status: "pending",
        parts_estimate: 800,
        discount: 100,
      })
      .select(BOOKING_SELECT)
      .single();
    if (error) throw error;
    let photoUploadError;
    if (photos.length) {
      const upload = await uploadBookingPhotos({
        userId: user_id,
        bookingId: data.id,
        photos,
      });
      data.photos = upload.paths;
      photoUploadError = upload.error;
    }
    return { ...mapBooking(data), photoUploadError };
  },
  async getBookings() {
    const { data, error } = await supabase
      .from("bookings")
      .select(BOOKING_SELECT)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (await attachBookingAddresses(data || [])).map(mapBooking);
  },
  async getBooking(code) {
    const { data, error } = await supabase
      .from("bookings")
      .select(BOOKING_SELECT)
      .eq("code", code)
      .single();
    if (error) throw error;
    const booking = mapBooking((await attachBookingAddresses([data]))[0]);
    if (booking.photos.length) {
      const { data: signedPhotos, error: photoError } = await supabase.storage
        .from("booking-photos")
        .createSignedUrls(booking.photos, 3600);
      if (photoError)
        console.warn(
          "Could not create private booking photo links:",
          photoError.message,
        );
      booking.photoUrls = (signedPhotos || [])
        .map((photo) => photo.signedUrl)
        .filter(Boolean);
    }
    return booking;
  },
  async getBookingById(dbId) {
    const { data, error } = await supabase
      .from("bookings")
      .select(BOOKING_SELECT)
      .eq("id", dbId)
      .single();
    if (error) throw error;
    return mapBooking((await attachBookingAddresses([data]))[0]);
  },
  async cancelBooking(dbId) {
    const { data, error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", dbId)
      .in("status", ["finding_technician", "technician_assigned"])
      .select("id")
      .maybeSingle();
    return { ok: !error && Boolean(data), error: error?.message };
  },
  // live status updates for the Track screen. Returns an unsubscribe function.
  subscribeBooking(dbId, onChange) {
    const ch = supabase
      .channel(`booking-${dbId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bookings",
          filter: `id=eq.${dbId}`,
        },
        () => onChange(),
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  },

  // ---------- ALERTS ----------
  async getAlerts() {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data || []).map((n) => ({
      id: n.id,
      icon: n.icon,
      title: n.title,
      body: n.body,
      time: timeAgo(n.created_at),
      unread: n.unread,
      tint: "#E0F2F5",
    }));
  },
  async markAllRead() {
    const { error } = await supabase
      .from("notifications")
      .update({ unread: false })
      .eq("unread", true);
    if (error) throw error;
  },
  async markNotificationRead(id) {
    const { error } = await supabase
      .from("notifications")
      .update({ unread: false })
      .eq("id", id)
      .eq("unread", true);
    if (error) throw error;
  },
  async deleteNotification(id) {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  // ---------- REVIEWS ----------
  async submitReview({ bookingId, technicianId, rating, text, tags }) {
    const user_id = await requireAuthUserId();
    const { error } = await supabase
      .from("reviews")
      .insert({
        user_id,
        booking_id: bookingId,
        technician_id: technicianId,
        rating,
        comment: text,
        tags,
      });
    return { ok: !error, error: error?.message };
  },
};
