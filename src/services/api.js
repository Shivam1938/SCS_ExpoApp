import { supabase } from './supabase';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STATUS = {
  finding_technician: 'Finding technician',
  technician_assigned: 'Technician assigned',
  on_the_way: 'On the way',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const authMessage = (error) => {
  const message = error?.message || 'Something went wrong. Please try again.';
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) return 'Email or password is incorrect.';
  if (lower.includes('already registered') || lower.includes('already been registered')) return 'An account with this email already exists. Try signing in.';
  if (lower.includes('password') && (lower.includes('weak') || lower.includes('at least') || lower.includes('characters'))) return 'Choose a stronger password with at least 8 characters.';
  if (lower.includes('network') || lower.includes('fetch')) return `Connection error: ${message}`;
  return message;
};

const requireAuthUserId = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error('Sign in is required to continue.');
  return user.id;
};

const isValidUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));

const ensureProfile = async (user, name, requestedRole) => {
  const fullName =
    name?.trim() ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Customer";

  const metadataRole = user.user_metadata?.role;
  const role =
    requestedRole === "technician" || metadataRole === "technician"
      ? "technician"
      : "customer";

  const { data: existingProfile, error: readError } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (readError) throw readError;

  if (existingProfile) {
    const existingName = String(existingProfile.full_name || '').trim();
    const isPlaceholder = !existingName || ['customer', 'user', 'guest'].includes(existingName.toLowerCase());
    if (isPlaceholder && fullName && !['Customer', 'User', 'Guest'].includes(fullName)) {
      const { data: repaired, error: repairError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id)
        .select('id, role, full_name')
        .single();
      if (repairError) throw repairError;
      return repaired;
    }
    return existingProfile;
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      full_name: fullName,
      role,
    })
    .select("id, role")
    .single();

  if (error) throw error;

  return data;
};


const fmtWhen = (iso, time) => `${new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · ${time}`;
const parseFutureSchedule = (date, time) => {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date || ''));
  const timeMatch = /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i.exec(String(time || '').trim());
  if (!dateMatch || !timeMatch) return false;
  const [, y, m, d] = dateMatch;
  const [, h, min, meridiem] = timeMatch;
  let hour = Number(h);
  const minute = Number(min);
  if (Number(m) < 1 || Number(m) > 12 || Number(d) < 1 || Number(d) > 31 || minute > 59) return false;
  if (meridiem) {
    if (hour < 1 || hour > 12) return false;
    hour = (hour % 12) + (meridiem.toUpperCase() === 'PM' ? 12 : 0);
  } else if (hour > 23) return false;
  const scheduled = new Date(Number(y), Number(m) - 1, Number(d), hour, minute);
  return scheduled.getFullYear() === Number(y) && scheduled.getMonth() === Number(m) - 1 && scheduled.getDate() === Number(d) && scheduled.getTime() > Date.now();
};
const timeAgo = (iso) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  return d === 1 ? 'Yesterday' : `${d} days ago`;
};

const mapBooking = (b) => {
  const rawStatus = String(b.status || '').trim().toLowerCase();
  return {
    id: b.code,
    dbId: b.id,
    serviceId: b.service_id,
    service: b.services?.name || 'Service',
    icon: b.services?.icon || 'construct-outline',
    serviceImage: b.services?.image_url || null,
    servicePrice: b.services?.price ?? null,
    rawStatus,
    status: STATUS[rawStatus] || rawStatus.replaceAll('_', ' '),
    when: fmtWhen(b.scheduled_date, b.scheduled_time),
    scheduledDate: b.scheduled_date,
    scheduledTime: b.scheduled_time,
    area: [b.bookingAddress?.city, b.bookingAddress?.pincode].filter(Boolean).join(', ') || String(b.address_line || '').split(',').slice(-2).join(', ').trim(),
    technician: b.technicians || null,
    technicianId: b.technician_id,
    userId: b.user_id,
    customer: b.customer || null,
    createdAt: b.created_at,
    address: b.bookingAddress ? [b.bookingAddress.line, b.bookingAddress.city, b.bookingAddress.pincode].filter(Boolean).join(', ') : b.address_line,
    addressId: b.address_id,
    bookingPhone: b.phone,
    notes: b.notes || '',
    paymentMethod: b.payment_method,
    paymentStatus: b.payment_status || 'pending',
    paymentPaidAt: b.payment_paid_at,
    serviceFee: b.service_fee,
    partsEstimate: b.parts_estimate,
    discount: b.discount,
    total: b.total,
    finalAmountConfirmed: b.final_amount_confirmed === true,
    photos: Array.isArray(b.photos) ? b.photos : [],
  };
};

const BOOKING_SELECT = '*, services(name, icon, image_url, price), technicians(*)';

const attachBookingAddresses = async (rows) => {
  const ids = [...new Set(rows.map((row) => row.address_id).filter(Boolean))];
  if (!ids.length) return rows;
  const { data, error } = await supabase.from('addresses').select('id, line, city, pincode, latitude, longitude').in('id', ids);
  if (error) throw error;
  return rows.map((row) => ({ ...row, bookingAddress: data.find((address) => address.id === row.address_id) || null }));
};

const attachCustomerProfiles = async (rows) => {
  const ids = [...new Set(rows.map((row) => row.user_id).filter(Boolean))];
  if (!ids.length) return rows;
  const { data, error } = await supabase.from('profiles').select('id, full_name, phone, avatar_url, city').in('id', ids);
  if (error) throw error;
  return rows.map((row) => ({ ...row, customer: data.find((profile) => profile.id === row.user_id) || null }));
};

const uploadBookingPhotos = async ({ userId, bookingId, photos }) => {
  const paths = [];
  try {
    for (const photo of photos) {
      if (!photo?.uri || !photo?.mimeType?.startsWith('image/')) throw new Error('One of the selected files is not a supported image.');
      if (photo.fileSize && photo.fileSize > 8 * 1024 * 1024) throw new Error('Each image must be smaller than 8 MB.');
      const response = await fetch(photo.uri);
      if (!response.ok) throw new Error('Could not read a selected image. Please choose it again.');
      const body = await response.arrayBuffer();
      if (body.byteLength > 8 * 1024 * 1024) throw new Error('Each image must be smaller than 8 MB.');
      const extension = photo.mimeType.split('/')[1]?.replace(/[^a-z0-9]/gi, '') || 'jpg';
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
      const path = `${userId}/${bookingId}/${filename}`;
      const { error } = await supabase.storage.from('booking-photos').upload(path, body, { contentType: photo.mimeType, upsert: false });
      if (error) throw error;
      paths.push(path);
    }
    const { error } = await supabase.rpc('attach_booking_photos', { p_booking_id: bookingId, p_photos: paths });
    if (error) throw error;
    return { paths };
  } catch (error) {
    if (paths.length) await supabase.storage.from('booking-photos').remove(paths).catch(() => {});
    return { paths: [], error: 'Your booking was saved, but the photos could not be attached. You can still continue.' };
  }
};

const getSignedPhotos = async (booking) => {
  if (!booking?.photos?.length) return booking;
  const { data, error } = await supabase.storage.from('booking-photos').createSignedUrls(booking.photos, 3600);
  if (error) return booking;
  return { ...booking, photoUrls: (data || []).map((item) => item.signedUrl).filter(Boolean) };
};

export const api = {
  // ---------- AUTH ----------
 async signUp(email, password, name, role = "customer") {
  try {
    const selectedRole =
      role === "technician" ? "technician" : "customer";

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name.trim(),
          role: selectedRole,
        },
        emailRedirectTo: "fixora://auth-callback",
      },
    });

    if (error) return { ok: false, error: authMessage(error) };

    if (data.session && data.user) {
      try {
        await ensureProfile(data.user, name, selectedRole);
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
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { ok: false, error: authMessage(error) };
      // await ensureProfile(data.user, data.user.user_metadata?.full_name, data.user.user_metadata?.role);
      await ensureProfile(
  data.user,
  data.user.user_metadata?.full_name,
  data.user.user_metadata?.role,
);
      const profile = await this.getProfile();
      return { ok: true, user: data.user, profile };
    } catch (error) {
      return { ok: false, error: authMessage(error) };
    }
  },
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: 'fixora://reset-password' });
      return error ? { ok: false, error: authMessage(error) } : { ok: true };
    } catch (error) { return { ok: false, error: authMessage(error) }; }
  },
  async updatePassword(password) {
    if (!password || password.length < 8) throw new Error('Password must be at least 8 characters.');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  },
  async updateEmail(email) {
    const nextEmail = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) throw new Error('Enter a valid email address.');

    let role = 'customer';
    try {
      const profile = await this.getProfile();
      if (profile?.role === 'technician') role = 'technician';
    } catch {}

    const { data, error } = await supabase.auth.updateUser(
      { email: nextEmail },
      { emailRedirectTo: 'fixora://email-change' },
    );
    if (error) throw error;

    await AsyncStorage.setItem(
      'scs-pending-email-change',
      JSON.stringify({ email: nextEmail, role }),
    );

    return data?.user || null;
  },

  async getPendingEmailChange() {
    try {
      const raw = await AsyncStorage.getItem('scs-pending-email-change');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async clearPendingEmailChange() {
    try {
      await AsyncStorage.removeItem('scs-pending-email-change');
    } catch {}
  },
  signOut: () => supabase.auth.signOut(),
  getSession: async () => (await supabase.auth.getSession()).data.session,
  async getProfile() {
    const userId = await requireAuthUserId();
    const [{ data, error }, { data: authData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.auth.getUser(),
    ]);
    if (error) throw error;
    return data ? { ...data, email: authData?.user?.email || data.email || '' } : data;
  },
  async savePushToken(token) {
    const userId = await requireAuthUserId();
    const { error } = await supabase.from('profiles').update({ push_token: token }).eq('id', userId);
    if (error) throw error;
  },
  async uploadProfilePhoto(asset) {
    const userId = await requireAuthUserId();
    if (!asset?.uri) throw new Error('Choose a photo and try again.');
    const response = await fetch(asset.uri);
    if (!response.ok) throw new Error('Could not read the selected photo. Please choose it again.');
    const body = await response.arrayBuffer();
    if (!body.byteLength) throw new Error('The selected photo is empty. Choose a different image.');
    if (body.byteLength > 5 * 1024 * 1024) throw new Error('Choose a photo smaller than 5 MB.');
    const path = `${userId}/avatar.jpg`;
    const contentType = asset.mimeType?.startsWith('image/') ? asset.mimeType : 'image/jpeg';
    const { error: uploadError } = await supabase.storage.from('profile-photos').upload(path, body, { contentType, upsert: true, cacheControl: '0' });
    if (uploadError) throw new Error('Could not upload your profile photo. Please try again.');
    const publicUrl = supabase.storage.from('profile-photos').getPublicUrl(path).data.publicUrl;
    const avatarUrl = `${publicUrl}?updated=${Date.now()}`;
    const { error: updateError } = await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', userId).select('id').single();
    if (updateError) throw new Error('Your photo was uploaded, but your profile could not be updated. Please try again.');
    return avatarUrl;
  },

  // ---------- SERVICES ----------
  async getServices() {
    const { data, error } = await supabase.from('services').select('*').eq('active', true).order('sort');
    if (error) throw error;
    return (data || []).map((s) => ({
      ...s,
      image_url: s.image_url
        ? (/^https?:\/\//i.test(String(s.image_url))
          ? String(s.image_url)
          : supabase.storage.from('service-assets').getPublicUrl(String(s.image_url).replace(/^\/+/, '')).data.publicUrl)
        : null,
      desc: s.description || '',
      bookings: s.bookings_count || 0,
      price: s.price || 0,
      tint: s.tint || '#E0F2F5',
      color: s.color || '#1596A6',
      rating: s.rating || 0,
    }));
  },
  async getHomeBanner() {
    const { data, error } = await supabase.from('app_settings').select('home_banner_url').eq('id', 'global').maybeSingle();
    if (error) throw error;
    return data?.home_banner_url || null;
  },
  async getBookmarks() {
    const { data, error } = await supabase.from('service_bookmarks').select('service_id').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((item) => item.service_id);
  },
  async addBookmark(serviceId) {
    const user_id = await requireAuthUserId();
    const { error } = await supabase.from('service_bookmarks').upsert({ user_id, service_id: serviceId }, { onConflict: 'user_id,service_id', ignoreDuplicates: true });
    if (error) throw error;
  },
  async removeBookmark(serviceId) {
    const user_id = await requireAuthUserId();
    const { error } = await supabase.from('service_bookmarks').delete().eq('user_id', user_id).eq('service_id', serviceId);
    if (error) throw error;
  },

  // ---------- ADDRESSES / PROFILE ----------
  async getAddresses() {
    const { data, error } = await supabase.from('addresses').select('*').order('is_default', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async createAddress({ label, line, city, pincode, latitude, longitude, is_default = false }) {
    const user_id = await requireAuthUserId();
    const existing = await this.getAddresses();
    const makeDefault = is_default || existing.length === 0;
    const { data, error } = await supabase.from('addresses').insert({ user_id, label, line, city, pincode: pincode || null, latitude: latitude ?? null, longitude: longitude ?? null, is_default: makeDefault }).select('*').single();
    if (error) throw error;
    if (makeDefault && city?.trim()) {
      const { error: profileError } = await supabase.from('profiles').update({ city: city.trim() }).eq('id', user_id);
      if (profileError) throw profileError;
    }
    return data;
  },
  async updateAddress(id, values) {
    const { data, error } = await supabase.from('addresses').update({ ...values, pincode: values.pincode || null }).eq('id', id).select('*').single();
    if (error) throw error;
    if (data.is_default && data.city?.trim()) {
      const user_id = await requireAuthUserId();
      const { error: profileError } = await supabase.from('profiles').update({ city: data.city.trim() }).eq('id', user_id);
      if (profileError) throw profileError;
    }
    return data;
  },
  async deleteAddress(id) {
    const { error } = await supabase.from('addresses').delete().eq('id', id);
    if (error) throw error;
  },
  async setDefaultAddress(id) {
    const addresses = await this.getAddresses();
    if (!addresses.some((item) => item.id === id)) throw new Error('That saved address could not be found. Refresh the list and try again.');
    const { error: clearError } = await supabase.from('addresses').update({ is_default: false }).in('id', addresses.map((item) => item.id));
    if (clearError) throw clearError;
    const { data, error } = await supabase.from('addresses').update({ is_default: true }).eq('id', id).select('*').single();
    if (error) throw error;
    if (data.city?.trim()) {
      const user_id = await requireAuthUserId();
      const { error: profileError } = await supabase.from('profiles').update({ city: data.city.trim() }).eq('id', user_id);
      if (profileError) throw profileError;
    }
    return data;
  },
  async saveProfile({ fullName, phone }) {
    const name = String(fullName || '').trim();
    const exactPhone = String(phone || '').trim();
    if (!name || name.length > 200) throw new Error('Enter a name with 1 to 200 characters.');
    if (!/^\+?\d{10,15}$/.test(exactPhone)) throw new Error('Enter a valid phone number with 10 to 15 digits. A leading + is optional.');
    const user_id = await requireAuthUserId();
    const { data, error } = await supabase.from('profiles').update({ full_name: name, phone: exactPhone }).eq('id', user_id).select('id, full_name, phone, city, avatar_url, role').single();
    if (error) throw error;
    return data;
  },
  async getCurrentAddress() {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') throw new Error('Location permission is off. Allow location access in Settings, or enter your address manually.');
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) throw new Error('Location services are turned off. Turn them on or enter your address manually.');
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const results = await Location.reverseGeocodeAsync(position.coords);
    const place = results[0];
    if (!place) throw new Error('We could not find a readable address here. Please enter it manually.');
    const line = [place.name, place.street, place.district, place.subregion].filter(Boolean).filter((value, index, all) => all.indexOf(value) === index).join(', ');
    return { id: 'current-location', label: 'Current location', line: line || 'Current location', city: place.city || place.subregion || '', pincode: place.postalCode || '', latitude: position.coords.latitude, longitude: position.coords.longitude };
  },

  // ---------- CUSTOMER BOOKINGS ----------
  async createBooking({ serviceId, date, time, note, addressId, phone: bookingPhone, photos = [], clientRequestId }) {
    const user_id = await requireAuthUserId();
    if (!serviceId || !date || !time || !addressId) throw new Error('Choose a service, date, time, and saved address to continue.');
    if (!parseFutureSchedule(date, time)) throw new Error('Choose a valid date and time in the future.');
    const [{ data: profile, error: profileError }, { data: address, error: addressError }] = await Promise.all([
      supabase.from('profiles').select('phone').eq('id', user_id).single(),
      supabase.from('addresses').select('id, line, city, pincode, user_id').eq('id', addressId).eq('user_id', user_id).single(),
    ]);
    if (profileError) throw profileError;
    if (addressError || !address) throw new Error('Choose one of your saved addresses before booking.');
    const phone = String(bookingPhone || profile?.phone || '').trim();
    if (phone.replace(/\D/g, '').length < 10) throw new Error('Please add a valid phone number to your profile before booking.');
    const addressLine = [address.line, address.city, address.pincode].filter(Boolean).join(', ');
    const payload = { user_id, service_id: serviceId, scheduled_date: date, scheduled_time: time, address_id: address.id, address_line: addressLine, phone, notes: note || null, photos: [], payment_method: 'cash', payment_status: 'pending', service_fee: null, parts_estimate: null, discount: null, total: null, final_amount_confirmed: false, client_request_id: isValidUuid(clientRequestId) ? clientRequestId : null };
    let { data, error } = await supabase.from('bookings').insert(payload).select(BOOKING_SELECT).single();
    let existingBooking = false;
    if (error?.code === '23505' && clientRequestId) {
      const existing = await supabase.from('bookings').select(BOOKING_SELECT).eq('user_id', user_id).eq('client_request_id', clientRequestId).single();
      data = existing.data;
      error = existing.error;
      existingBooking = true;
    }
    if (error || !data) throw error || new Error('Could not create the booking.');
    let photoUploadError;
    if (photos.length && !existingBooking && !(data.photos || []).length) {
      const upload = await uploadBookingPhotos({ userId: user_id, bookingId: data.id, photos });
      data.photos = upload.paths;
      photoUploadError = upload.error;
    }
    return { ...mapBooking(data), photoUploadError };
  },
  async getBookings() {
    const { data, error } = await supabase.from('bookings').select(BOOKING_SELECT).order('created_at', { ascending: false });
    if (error) throw error;
    return (await attachBookingAddresses(data || [])).map(mapBooking);
  },
  async getBooking(codeOrId) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(String(codeOrId || ''));
    const query = supabase.from('bookings').select(BOOKING_SELECT);
    const { data, error } = await (isUuid ? query.eq('id', codeOrId) : query.eq('code', codeOrId)).single();
    if (error) throw error;
    return getSignedPhotos(mapBooking((await attachBookingAddresses([data]))[0]));
  },
  async getBookingById(dbId) {
    const { data, error } = await supabase.from('bookings').select(BOOKING_SELECT).eq('id', dbId).single();
    if (error) throw error;
    return mapBooking((await attachBookingAddresses([data]))[0]);
  },
  async cancelBooking(dbId) {
    const { data, error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', dbId).in('status', ['finding_technician', 'technician_assigned']).select('id').maybeSingle();
    return { ok: !error && Boolean(data), error: error?.message };
  },
  subscribeBooking(dbId, onChange) {
    const ch = supabase.channel(`booking-${dbId}-${Date.now()}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `id=eq.${dbId}` }, onChange).subscribe();
    return () => supabase.removeChannel(ch);
  },

  // ---------- TECHNICIAN ----------
  async getTechnicianProfile() {
    const userId = await requireAuthUserId();
    const { data, error } = await supabase.from('technicians').select('*').eq('profile_id', userId).maybeSingle();
    if (error) throw error;
    return data;
  },
  async updateTechnicianProfile({ name, roleTitle, about, skills, yearsExperience, phone }) {
    const { data, error } = await supabase.rpc('update_my_technician_profile', {
      p_name: name,
      p_role_title: roleTitle,
      p_about: about || '',
      p_skills: skills || [],
      p_years_experience: yearsExperience || 0,
      p_phone: phone || '',
    });
    if (error) throw error;
    return data;
  },
  async getTechnicianBookings() {
    const { data, error } = await supabase.from('bookings').select(BOOKING_SELECT).or('status.eq.finding_technician,technician_id.not.is.null').order('scheduled_date', { ascending: true }).order('scheduled_time', { ascending: true });
    if (error) throw error;
    return (await attachCustomerProfiles(await attachBookingAddresses(data || []))).map(mapBooking);
  },
  async acceptBooking(dbId) {
    const { data, error } = await supabase.rpc('accept_booking', { p_booking_id: dbId });
    if (error) throw error;
    if (!data) throw new Error('This booking has already been accepted by another technician.');
    const row = Array.isArray(data) ? data[0] : data;
    return mapBooking((await attachBookingAddresses([row]))[0]);
  },
  async updateTechnicianBookingStatus(dbId, status) {
    const allowed = ['on_the_way', 'in_progress', 'completed'];
    if (!allowed.includes(status)) throw new Error('That booking status is not available.');
    const technician = await this.getTechnicianProfile();
    if (!technician?.id) throw new Error('Your technician profile is not ready yet.');
    const { data, error } = await supabase.from('bookings').update({ status }).eq('id', dbId).eq('technician_id', technician.id).select(BOOKING_SELECT).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('This booking is no longer assigned to you.');
    return mapBooking((await attachBookingAddresses([data]))[0]);
  },
  async saveFinalCharges({ dbId, serviceFee, parts, discount }) {
    const technician = await this.getTechnicianProfile();
    if (!technician?.id) throw new Error('Your technician profile is not ready yet.');
    const fee = Number(serviceFee);
    const partsValue = Number(parts || 0);
    const discountValue = Number(discount || 0);
    if (!Number.isFinite(fee) || fee < 0 || !Number.isFinite(partsValue) || partsValue < 0 || !Number.isFinite(discountValue) || discountValue < 0) throw new Error('Enter valid charge amounts.');
    const total = Math.max(0, fee + partsValue - discountValue);
    const { data, error } = await supabase.from('bookings').update({ service_fee: fee, parts_estimate: partsValue, discount: discountValue, total, final_amount_confirmed: true }).eq('id', dbId).eq('technician_id', technician.id).select(BOOKING_SELECT).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('This booking is no longer assigned to you.');
    return mapBooking((await attachBookingAddresses([data]))[0]);
  },
  async markPaymentReceived(dbId) {
    const technician = await this.getTechnicianProfile();
    if (!technician?.id) throw new Error('Your technician profile is not ready yet.');
    const { data, error } = await supabase.from('bookings').update({ payment_status: 'paid' }).eq('id', dbId).eq('technician_id', technician.id).eq('status', 'completed').eq('payment_status', 'pending').eq('final_amount_confirmed', true).not('total', 'is', null).select(BOOKING_SELECT).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Payment is already recorded or the final amount has not been added.');
    return mapBooking((await attachBookingAddresses([data]))[0]);
  },

  // ---------- TECHNICIAN REVIEWS ----------
  async getTechnicianReviews() {
    const technician = await this.getTechnicianProfile();
    if (!technician?.id) return [];

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('id, user_id, booking_id, rating, comment, tags, created_at')
      .eq('technician_id', technician.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    const rows = reviews || [];
    const userIds = [...new Set(rows.map((review) => review.user_id).filter(Boolean))];

    let profiles = [];
    if (userIds.length) {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);
      if (profileError) throw profileError;
      profiles = data || [];
    }

    return rows.map((review) => ({
      ...review,
      reviewer: profiles.find((profile) => profile.id === review.user_id) || null,
    }));
  },

  // ---------- APP CONTENT ----------
  async getAppContent() {
    const { data, error } = await supabase
      .from('app_content')
      .select('content_key, title, content, updated_at')
      .order('content_key');
    if (error) throw error;
    return (data || []).reduce((acc, item) => {
      acc[item.content_key] = item;
      return acc;
    }, {});
  },

  async getContactSettings() {
    const { data, error } = await supabase
      .from('contact_settings')
      .select('phone, whatsapp, email, support_email, address, working_hours, website')
      .eq('id', 1)
      .maybeSingle();
    if (error) throw error;
    return data || {};
  },

  // ---------- ALERTS ----------
  async getAlerts() {
    const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    return (data || []).map((n) => ({ id: n.id, icon: n.icon || 'notifications-outline', title: n.title, body: n.body, time: timeAgo(n.created_at), unread: n.unread, tint: '#E0F2F5', bookingId: n.booking_id }));
  },
  async markAllRead() { const { error } = await supabase.from('notifications').update({ unread: false }).eq('unread', true); if (error) throw error; },
  async markNotificationRead(id) { const { error } = await supabase.from('notifications').update({ unread: false }).eq('id', id).eq('unread', true); if (error) throw error; },
  async deleteNotification(id) { const { error } = await supabase.from('notifications').delete().eq('id', id); if (error) throw error; },

  // ---------- REVIEWS ----------
  async submitReview({ bookingId, technicianId, rating, text, tags }) {
    const user_id = await requireAuthUserId();
    const { error } = await supabase.from('reviews').insert({ user_id, booking_id: bookingId, technician_id: technicianId, rating, comment: text, tags });
    return { ok: !error, error: error?.message };
  },
};
