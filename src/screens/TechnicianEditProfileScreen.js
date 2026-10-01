import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Screen, Header, Card, Button, ThemedText, ThemedTextInput, styles } from '../components/ui';
import { colors } from '../theme';
import { api } from '../services/api';

export default function TechnicianEditProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [about, setAbout] = useState('');
  const [skills, setSkills] = useState('');
  const [years, setYears] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    api.getTechnicianProfile()
      .then((profile) => {
        setName(profile?.name || '');
        setRoleTitle(profile?.role_title || '');
        setAbout(profile?.about || '');
        setSkills(Array.isArray(profile?.skills) ? profile.skills.join(', ') : '');
        setYears(profile?.years_experience == null ? '' : String(profile.years_experience));
        setPhone(profile?.phone || '');
      })
      .catch((error) => Alert.alert('Could not load profile', error.message || 'Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (saving) return;
    if (!name.trim()) return Alert.alert('Name required', 'Enter your full name.');
    if (!roleTitle.trim()) return Alert.alert('Professional role required', 'Enter your professional role.');
    const yearsValue = years.trim() === '' ? 0 : Number(years);
    if (!Number.isInteger(yearsValue) || yearsValue < 0 || yearsValue > 60) return Alert.alert('Invalid experience', 'Enter years of experience between 0 and 60.');
    const skillList = skills.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 12);
    setSaving(true);
    try {
      await api.updateTechnicianProfile({
        name: name.trim(),
        roleTitle: roleTitle.trim(),
        about: about.trim(),
        skills: skillList,
        yearsExperience: yearsValue,
        phone: phone.trim(),
      });
      Alert.alert('Profile updated', 'Your technician profile has been saved.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error) {
      Alert.alert('Could not update profile', error.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <Header title="Edit technician profile" onBack={() => navigation.goBack()} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Card style={{ marginBottom: 14 }}>
          <ThemedText style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>Complete your profile</ThemedText>
          <ThemedText style={{ color: colors.muted, marginTop: 5, lineHeight: 20 }}>Add your professional details so customers can understand your experience, skills and services.</ThemedText>
        </Card>

        {[
          ['Full name', name, setName, 'Your full name'],
          ['Professional role', roleTitle, setRoleTitle, 'e.g. Computer & CCTV Technician'],
          ['Phone number', phone, setPhone, 'Customer contact number'],
          ['Years of experience', years, setYears, 'e.g. 4'],
        ].map(([label, value, setter, placeholder]) => (
          <View key={label} style={{ marginTop: 12 }}>
            <ThemedText style={{ color: colors.text, fontWeight: '700', marginBottom: 7 }}>{label}</ThemedText>
            <ThemedTextInput value={value} onChangeText={setter} placeholder={placeholder} keyboardType={label === 'Years of experience' ? 'number-pad' : label === 'Phone number' ? 'phone-pad' : 'default'} style={{ backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, borderRadius: 16, minHeight: 54, paddingHorizontal: 16, fontSize: 16 }} />
          </View>
        ))}

        <View style={{ marginTop: 12 }}>
          <ThemedText style={{ color: colors.text, fontWeight: '700', marginBottom: 7 }}>About you</ThemedText>
          <ThemedTextInput value={about} onChangeText={setAbout} placeholder="Tell customers about your experience and expertise" multiline textAlignVertical="top" style={{ backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, borderRadius: 16, minHeight: 120, padding: 16, fontSize: 16, lineHeight: 22 }} />
        </View>

        <View style={{ marginTop: 12 }}>
          <ThemedText style={{ color: colors.text, fontWeight: '700', marginBottom: 7 }}>Skills</ThemedText>
          <ThemedTextInput value={skills} onChangeText={setSkills} placeholder="Windows, CCTV, Networking, Hardware" multiline style={{ backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, borderRadius: 16, minHeight: 82, padding: 16, fontSize: 16 }} />
          <ThemedText style={{ color: colors.muted, fontSize: 12, marginTop: 5 }}>Separate skills with commas.</ThemedText>
        </View>

        <Button title={saving ? 'Saving…' : 'Save profile'} onPress={save} disabled={loading || saving} variant="orange" style={{ marginTop: 22 }} />
      </ScrollView>
    </Screen>
  );
}
