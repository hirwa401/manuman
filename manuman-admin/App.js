import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import BookingsScreen from './src/screens/BookingsScreen';
import FleetScreen from './src/screens/FleetScreen';
import ContactsScreen from './src/screens/ContactsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [authed, setAuthed] = useState(false);

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: { backgroundColor: '#0d1b2a', borderTopColor: 'rgba(245,168,0,0.2)', height: 62, paddingBottom: 8 },
          tabBarActiveTintColor: '#F5A800',
          tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
          tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
          tabBarIcon: ({ color, size }) => {
            const icons = { Dashboard: 'grid', Bookings: 'calendar', Fleet: 'car', Messages: 'chatbubble' };
            return <Ionicons name={icons[route.name]} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Bookings" component={BookingsScreen} />
        <Tab.Screen name="Fleet" component={FleetScreen} />
        <Tab.Screen name="Messages" component={ContactsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
