import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { supabase } from '../services/supabase';
import { api } from '../services/api';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [user, setUser] = useState({ name: 'Guest', email: '', phone: '', city: '', avatarUrl: null, role: 'customer' });
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState('');
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState('');
  const [markAllReadLoading, setMarkAllReadLoading] = useState(false);
  const [markingAlertId, setMarkingAlertId] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [bookmarksError, setBookmarksError] = useState('');
  const [pendingBookmarks, setPendingBookmarks] = useState([]);
  const pendingBookmarkIds = useRef(new Set());

  const applyProfile = useCallback((profile) => {
    if (!profile) return;
    setUser((current) => ({
      ...current,
      name: profile.full_name || 'Guest',
      email: profile.email || current.email || '',
      phone: profile.phone || '',
      city: profile.city || '',
      avatarUrl: profile.avatar_url || null,
      role: profile.role || 'customer',
    }));
  }, []);

  const refreshProfile = useCallback(async () => {
    const profile = await api.getProfile();
    applyProfile(profile);
    return profile;
  }, [applyProfile]);

  const refreshServices = useCallback(async () => {
    setServicesLoading(true);
    setServicesError('');
    try { setServices(await api.getServices()); }
    catch (error) { setServicesError('Could not load services. Check your connection and try again.'); console.warn('service refresh failed', error?.message); }
    finally { setServicesLoading(false); }
  }, []);

  const refresh = useCallback(async () => {
    setBookmarksLoading(true);
    setBookmarksError('');
    setBookingsLoading(true);
    setBookingsError('');
    setAlertsLoading(true);
    setAlertsError('');
    const [bookingResult, alertResult, profileResult, bookmarksResult, serviceResult] = await Promise.allSettled([
      api.getBookings(), api.getAlerts(), api.getProfile(), api.getBookmarks(), api.getServices(),
    ]);
    if (bookingResult.status === 'fulfilled') setBookings(bookingResult.value);
    else { setBookingsError('Could not load bookings. Check your connection and try again.'); console.warn('booking refresh failed', bookingResult.reason?.message); }
    if (alertResult.status === 'fulfilled') setAlerts(alertResult.value);
    else { setAlertsError('Could not load alerts. Check your connection and try again.'); console.warn('alert refresh failed', alertResult.reason?.message); }
    if (profileResult.status === 'fulfilled' && profileResult.value) {
      applyProfile(profileResult.value);
    } else if (profileResult.status === 'rejected') console.warn('profile refresh failed', profileResult.reason?.message);
    if (serviceResult.status === 'fulfilled') { setServices(serviceResult.value); setServicesError(''); }
    else { setServicesError('Could not load services. Check your connection and try again.'); console.warn('service refresh failed', serviceResult.reason?.message); }
    if (bookmarksResult.status === 'fulfilled') setBookmarks(bookmarksResult.value);
    else { setBookmarksError('Could not load saved services. Check your connection and try again.'); console.warn('bookmark refresh failed', bookmarksResult.reason?.message); }
    setAlertsLoading(false);
    setBookingsLoading(false);
    setBookmarksLoading(false);
    setServicesLoading(false);
  }, [applyProfile]);

  const refreshAlerts = async () => {
    setAlertsLoading(true); setAlertsError('');
    try { setAlerts(await api.getAlerts()); }
    catch { setAlertsError('Could not load alerts. Check your connection and try again.'); }
    finally { setAlertsLoading(false); }
  };

  const toggleBookmark = async (serviceId) => {
    if (pendingBookmarkIds.current.has(serviceId)) return;
    pendingBookmarkIds.current.add(serviceId);
    setPendingBookmarks((current) => [...current, serviceId]);
    const wasBookmarked = bookmarks.includes(serviceId);
    setBookmarks((current) => wasBookmarked ? current.filter((id) => id !== serviceId) : [...current, serviceId]);
    try {
      if (wasBookmarked) await api.removeBookmark(serviceId);
      else await api.addBookmark(serviceId);
    } catch (error) {
      setBookmarks((current) => wasBookmarked
        ? (current.includes(serviceId) ? current : [...current, serviceId])
        : current.filter((id) => id !== serviceId));
      setBookmarksError('Could not update saved services. Check your connection and try again.');
      throw error;
    } finally {
      pendingBookmarkIds.current.delete(serviceId);
      setPendingBookmarks((current) => current.filter((id) => id !== serviceId));
    }
  };

  const registerPushNotifications = useCallback(async () => {
    if (!Device.isDevice) return;
    // Android remote push requires native FCM configuration. Do not attempt
    // registration when this build intentionally has no Firebase/FCM setup.
    if (Platform.OS === 'android' && !Constants.expoConfig?.android?.googleServicesFile) return;
    try {
      if (Platform.OS === 'android') {
        await Notifications.deleteNotificationChannelAsync('default').catch(() => {});
        await Notifications.setNotificationChannelAsync('default', {
          name: 'SCS Notifications',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
        });
      }
      const permissions = await Notifications.getPermissionsAsync();
      let status = permissions.status;
      if (status !== 'granted') {
        const requested = await Notifications.requestPermissionsAsync();
        status = requested.status;
      }
      if (status !== 'granted') return;
      const token = await Notifications.getExpoPushTokenAsync({ projectId: '04873b85-dac3-4967-b0bd-5550de3e422e' });
      if (token?.data) await api.savePushToken(token.data);
    } catch (error) {
      console.warn('Push notification registration failed:', error?.message);
    }
  }, []);

  useEffect(() => {
    let channel = null;
    const start = () => {
      if (channel) return;
      channel = supabase.channel('fixora-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, refresh)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => { refreshProfile().catch((error) => console.warn('profile refresh failed', error?.message)); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'technicians' }, refresh)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, refresh)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, refresh)
        .subscribe();
    };
    const stop = () => { if (channel) { supabase.removeChannel(channel); channel = null; } };
    supabase.auth.getSession().then(({ data }) => { if (data.session) { refresh(); start(); registerPushNotifications(); } });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) { refresh(); start(); registerPushNotifications(); } else {
      stop(); setBookings([]); setBookingsLoading(false); setBookingsError(''); setServices([]); setServicesLoading(false); setServicesError(''); setAlerts([]); setAlertsLoading(false); setAlertsError(''); setBookmarks([]); setBookmarksError(''); setPendingBookmarks([]); pendingBookmarkIds.current.clear(); setSelectedAddress(null); setUser({ name: 'Guest', email: '', phone: '', city: '', avatarUrl: null, role: 'customer' });
      }
    });
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshProfile().catch((error) => console.warn('profile refresh failed', error?.message));
    });
    return () => { stop(); sub.subscription.unsubscribe(); appStateSub.remove(); };
  }, [refresh, refreshProfile, registerPushNotifications]);

  const addBooking = (b) => setBookings((prev) => [b, ...prev.filter((x) => x.id !== b.id)]);
  const markAllRead = async () => {
    if (markAllReadLoading) return;
    setMarkAllReadLoading(true); setAlertsError('');
    try { await api.markAllRead(); setAlerts((current) => current.map((item) => ({ ...item, unread: false }))); }
    catch { setAlertsError('Could not mark alerts as read. Please try again.'); throw new Error('Could not mark alerts as read.'); }
    finally { setMarkAllReadLoading(false); }
  };
  const markAlertRead = async (id) => {
    const alertItem = alerts.find((item) => item.id === id);
    if (!alertItem?.unread || markingAlertId) return;
    setMarkingAlertId(id); setAlertsError('');
    setAlerts((current) => current.map((item) => item.id === id ? { ...item, unread: false } : item));
    try { await api.markNotificationRead(id); }
    catch {
      setAlerts((current) => current.map((item) => item.id === id ? { ...item, unread: true } : item));
      setAlertsError('Could not mark this alert as read. Please try again.');
      throw new Error('Could not mark this alert as read.');
    } finally { setMarkingAlertId(null); }
  };
  const deleteAlert = async (id) => {
    await api.deleteNotification(id);
    setAlerts((current) => current.filter((alert) => alert.id !== id));
  };

  return <Ctx.Provider value={{ user, setUser, selectedAddress, setSelectedAddress, refreshProfile, bookings, bookingsLoading, bookingsError, addBooking, services, servicesLoading, servicesError, refreshServices, alerts, alertsLoading, alertsError, markAllReadLoading, markingAlertId, markAlertRead, markAllRead, deleteAlert, refreshAlerts, refresh, bookmarks, bookmarksLoading, bookmarksError, pendingBookmarks, toggleBookmark }}>{children}</Ctx.Provider>;
}
