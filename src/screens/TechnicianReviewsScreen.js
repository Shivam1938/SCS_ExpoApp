import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Card, Press, ThemedText } from '../components/ui';
import { colors } from '../theme';
import { api } from '../services/api';

const initials = (name) =>
  String(name || 'Customer')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export default function TechnicianReviewsScreen({ navigation }) {
  const [reviews, setReviews] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [technician, rows] = await Promise.all([
        api.getTechnicianProfile(),
        api.getTechnicianReviews(),
      ]);
      setProfile(technician);
      setReviews(rows);
    } catch (e) {
      setError(e?.message || 'Could not load your reviews.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  const hasRating = profile?.rating != null &&
    (Number(profile?.reviews_count || 0) > 0 || Boolean(profile?.rating_is_admin_set));

  return (
    <Screen>
      <Header title="Your reviews" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={colors.teal}
            colors={[colors.teal]}
          />
        }
      >
        <Card style={{ padding: 20 }}>
          <ThemedText style={{ fontSize: 16, fontWeight: '700', color: colors.muted }}>
            Professional performance
          </ThemedText>

          <View style={{ flexDirection: 'row', marginTop: 18 }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <ThemedText style={{ fontSize: 25, fontWeight: '900', color: colors.teal }}>
                {Number(profile?.jobs_completed || 0)}
              </ThemedText>
              <ThemedText style={{ color: colors.muted, marginTop: 4, fontSize: 12 }}>
                Jobs completed
              </ThemedText>
            </View>

            <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: 1, borderColor: colors.border }}>
              {hasRating ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="star" size={18} color={colors.star} />
                    <ThemedText style={{ fontSize: 25, fontWeight: '900', color: colors.orange, marginLeft: 4 }}>
                      {Number(profile.rating).toFixed(1)}
                    </ThemedText>
                  </View>
                  <ThemedText style={{ color: colors.muted, marginTop: 4, fontSize: 12 }}>
                    Rating
                  </ThemedText>
                </>
              ) : (
                <>
                  <ThemedText style={{ fontSize: 18, fontWeight: '800', color: colors.muted }}>
                    Not rated
                  </ThemedText>
                  <ThemedText style={{ color: colors.muted, marginTop: 4, fontSize: 12 }}>
                    Rating
                  </ThemedText>
                </>
              )}
            </View>

            <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: 1, borderColor: colors.border }}>
              <ThemedText style={{ fontSize: 25, fontWeight: '900', color: colors.teal }}>
                {Number(profile?.reviews_count || 0)}
              </ThemedText>
              <ThemedText style={{ color: colors.muted, marginTop: 4, fontSize: 12 }}>
                Reviews
              </ThemedText>
            </View>
          </View>
        </Card>

        {error ? (
          <Card style={{ marginTop: 14 }}>
            <ThemedText style={{ color: colors.danger, lineHeight: 21 }}>{error}</ThemedText>
            <Press onPress={load} style={{ marginTop: 10 }}>
              <ThemedText style={{ color: colors.teal, fontWeight: '800' }}>Try again</ThemedText>
            </Press>
          </Card>
        ) : null}

        {!loading && !error && reviews.length === 0 ? (
          <Card style={{ marginTop: 14, alignItems: 'center', paddingVertical: 34 }}>
            <Ionicons name="chatbubble-ellipses-outline" size={44} color={colors.muted} />
            <ThemedText style={{ color: colors.text, fontSize: 18, fontWeight: '800', marginTop: 12 }}>
              No customer reviews yet
            </ThemedText>
            <ThemedText style={{ color: colors.muted, textAlign: 'center', marginTop: 6, lineHeight: 21 }}>
              Reviews will appear here after customers rate completed services.
            </ThemedText>
          </Card>
        ) : null}

        {reviews.map((review) => {
          const customerName = review.reviewer?.full_name || 'Customer';
          const rating = Number(review.rating || 0);
          const date = review.created_at
            ? new Date(review.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '';

          return (
            <Card key={review.id} style={{ marginTop: 14, padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.tealSoft, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                  {review.reviewer?.avatar_url ? (
                    <Image source={{ uri: review.reviewer.avatar_url }} style={{ width: 46, height: 46 }} />
                  ) : (
                    <ThemedText style={{ color: colors.teal, fontWeight: '900' }}>{initials(customerName)}</ThemedText>
                  )}
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <ThemedText style={{ fontSize: 16, fontWeight: '800' }}>{customerName}</ThemedText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Ionicons
                        key={n}
                        name={n <= rating ? 'star' : 'star-outline'}
                        size={14}
                        color={colors.star}
                        style={{ marginRight: 2 }}
                      />
                    ))}
                    {date ? <ThemedText style={{ color: colors.muted, fontSize: 12, marginLeft: 6 }}>{date}</ThemedText> : null}
                  </View>
                </View>
              </View>

              {review.comment ? (
                <ThemedText style={{ color: colors.text, lineHeight: 21, marginTop: 14 }}>
                  {review.comment}
                </ThemedText>
              ) : null}

              {Array.isArray(review.tags) && review.tags.length ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 }}>
                  {review.tags.map((tag) => (
                    <View key={tag} style={{ backgroundColor: colors.tealSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginRight: 7, marginBottom: 7 }}>
                      <ThemedText style={{ color: colors.teal, fontSize: 12, fontWeight: '700' }}>{tag}</ThemedText>
                    </View>
                  ))}
                </View>
              ) : null}
            </Card>
          );
        })}
      </ScrollView>
    </Screen>
  );
}
