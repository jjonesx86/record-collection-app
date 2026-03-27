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

export default function TermsOfService() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.appName}>Vinyly</Text>
      <Text style={styles.title}>Terms of Service</Text>
      <Text style={styles.updated}>Last updated: {LAST_UPDATED}</Text>

      <Body>
        By downloading or using Vinyly, you agree to these terms. Please read them carefully.
      </Body>

      <Section title="Use of the App">
        <Body>Vinyly is a personal vinyl record collection manager. You may use it to:</Body>
        <Bullet>Catalog and manage your personal vinyl record collection</Bullet>
        <Bullet>Maintain a wish list of records you want to acquire</Bullet>
        <Bullet>Look up album information via the Discogs database</Bullet>
        <Bullet>Share your collection with other Vinyly users</Bullet>
      </Section>

      <Section title="Your Account">
        <Body>
          You are responsible for maintaining the security of your account and password. You must provide a valid email address to register. You may not share your account with others or use someone else's account without permission.
        </Body>
      </Section>

      <Section title="Your Content">
        <Body>
          You own the collection data you enter into Vinyly. We do not claim ownership over your records, notes, or personal information. You grant us a limited licence to store and display your content solely to provide the Vinyly service to you.
        </Body>
      </Section>

      <Section title="Acceptable Use">
        <Body>You agree not to:</Body>
        <Bullet>Use Vinyly for any unlawful purpose</Bullet>
        <Bullet>Attempt to gain unauthorised access to other users' accounts or data</Bullet>
        <Bullet>Reverse engineer or attempt to extract the source code of the app</Bullet>
        <Bullet>Use automated tools to scrape or bulk-download data from the service</Bullet>
      </Section>

      <Section title="Third-Party Services">
        <Body>
          Vinyly uses Discogs for album metadata and Supabase for data storage. Your use of these services through Vinyly is subject to their respective terms of service. We are not responsible for the availability or accuracy of third-party data.
        </Body>
      </Section>

      <Section title="Disclaimer of Warranties">
        <Body>
          Vinyly is provided "as is" without warranty of any kind. We do not guarantee that the app will be error-free, uninterrupted, or that album data from Discogs will always be accurate or complete.
        </Body>
      </Section>

      <Section title="Limitation of Liability">
        <Body>
          To the fullest extent permitted by law, Vinyly shall not be liable for any indirect, incidental, or consequential damages arising from your use of the app, including any loss of data.
        </Body>
      </Section>

      <Section title="Changes to the Service">
        <Body>
          We may modify or discontinue features of Vinyly at any time. We will make reasonable efforts to notify users of significant changes.
        </Body>
      </Section>

      <Section title="Termination">
        <Body>
          You may stop using Vinyly and delete your account at any time. We reserve the right to suspend or terminate accounts that violate these terms.
        </Body>
      </Section>

      <Section title="Contact">
        <Body>
          Questions about these terms? Contact us at legal@vinyly.ai
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
