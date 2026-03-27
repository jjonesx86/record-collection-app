import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const LAST_UPDATED = 'March 26, 2025';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Body({ children }: { children: string }) {
  return <Text style={styles.body}>{children}</Text>;
}

function Bullet({ children }: { children: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

export default function PrivacyPolicy() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.appName}>Vinyly</Text>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.updated}>Last updated: {LAST_UPDATED}</Text>

      <Body>
        Vinyly is a personal vinyl record collection app. This policy explains what information we collect, how we use it, and your rights regarding your data.
      </Body>

      <Section title="Information We Collect">
        <Body>When you create an account and use Vinyly, we collect:</Body>
        <Bullet>Email address and password (used for account authentication)</Bullet>
        <Bullet>Display name and optional profile photo</Bullet>
        <Bullet>Your vinyl record collection data (artist, album, genre, year, label)</Bullet>
        <Bullet>Wish list entries you create</Bullet>
      </Section>

      <Section title="How We Use Your Information">
        <Body>Your information is used solely to provide the Vinyly service:</Body>
        <Bullet>To authenticate you and secure your account</Bullet>
        <Bullet>To store and sync your record collection across your devices</Bullet>
        <Bullet>To display your collection to other users you choose to share with</Bullet>
        <Bullet>We do not sell your personal information to third parties</Bullet>
        <Bullet>We do not use your data for advertising</Bullet>
      </Section>

      <Section title="Camera and Photo Library">
        <Body>
          Vinyly requests access to your camera to scan vinyl record barcodes for quick album lookup. We request access to your photo library only when you choose to set a profile photo. Images are not stored or transmitted beyond your profile.
        </Body>
      </Section>

      <Section title="Third-Party Services">
        <Body>Vinyly uses the following third-party services:</Body>
        <Bullet>Supabase — secure cloud database and authentication. Your data is stored on Supabase-managed servers.</Bullet>
        <Bullet>Discogs — album metadata and cover art lookup. Searches you perform are sent to the Discogs API. Discogs' own privacy policy applies to those requests.</Bullet>
      </Section>

      <Section title="Data Storage and Security">
        <Body>
          Your collection data is stored securely using Supabase, which uses industry-standard encryption in transit and at rest. Your password is never stored in plain text. We retain your data for as long as your account is active.
        </Body>
      </Section>

      <Section title="Your Rights">
        <Body>You have the right to:</Body>
        <Bullet>Access and export your collection data at any time via the CSV export feature</Bullet>
        <Bullet>Update or correct your account information in Settings</Bullet>
        <Bullet>Delete your account and all associated data by contacting us</Bullet>
      </Section>

      <Section title="Children's Privacy">
        <Body>
          Vinyly is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us and we will delete it promptly.
        </Body>
      </Section>

      <Section title="Changes to This Policy">
        <Body>
          We may update this privacy policy from time to time. We will notify you of significant changes by updating the date at the top of this page. Continued use of Vinyly after changes constitutes acceptance of the updated policy.
        </Body>
      </Section>

      <Section title="Contact Us">
        <Body>
          If you have questions about this privacy policy or your data, please contact us at privacy@vinyly.ai
        </Body>
      </Section>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 Vinyly. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
    padding: 24,
    paddingBottom: 60,
  },
  appName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5BB8FF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    marginBottom: 6,
  },
  updated: {
    fontSize: 13,
    color: '#888',
    marginBottom: 24,
  },
  section: {
    marginTop: 28,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  body: {
    fontSize: 15,
    color: '#444',
    lineHeight: 24,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 4,
  },
  bulletDot: {
    fontSize: 15,
    color: '#5BB8FF',
    lineHeight: 24,
  },
  bulletText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 24,
    flex: 1,
  },
  footer: {
    marginTop: 48,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  footerText: {
    fontSize: 13,
    color: '#AAA',
    textAlign: 'center',
  },
});
