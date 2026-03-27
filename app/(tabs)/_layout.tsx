import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const TAB_BAR_BG = '#111827';
const HEADER_BG = '#1a1a2e';
const ACTIVE = '#5BB8FF';
const INACTIVE = 'rgba(255,255,255,0.45)';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: TAB_BAR_BG,
          borderTopColor: 'rgba(255,255,255,0.08)',
        },
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          ...Platform.select({ web: { fontSize: 10 } }),
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          headerShown: false,
          tabBarLabel: Platform.select({ web: 'Collection', default: 'My Collection' }),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="disc-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add Album',
          headerStyle: { backgroundColor: HEADER_BG },
          headerTintColor: '#fff',
          headerTitleStyle: { color: '#fff' },
          tabBarLabel: 'Add',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore Collections',
          headerStyle: { backgroundColor: HEADER_BG },
          headerTintColor: '#fff',
          headerTitleStyle: { color: '#fff' },
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Settings',
          headerStyle: { backgroundColor: HEADER_BG },
          headerTintColor: '#fff',
          headerTitleStyle: { color: '#fff' },
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
