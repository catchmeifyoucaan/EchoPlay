import React from 'react';
import { ActivityIndicator, SafeAreaView, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import WelcomeScreen from './screens/Welcome';
import LoginScreen from './screens/Login';
import ModeSelectScreen from './screens/ModeSelect';
import HomeScreen from './screens/Home';
import LobbyScreen from './screens/Lobby';
import LiveMatchScreen from './screens/LiveMatch';
import TournamentsScreen from './screens/Tournaments';
import LeaderboardScreen from './screens/Leaderboard';
import ProfileScreen from './screens/Profile';
import { useAuth } from './hooks/useAuth';
import { useMatchSockets } from './hooks/useMatchSockets';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  ModeSelect: undefined;
  Main: undefined;
  Lobby: { matchId: string } | undefined;
  LiveMatch: { matchId: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator();

const AuthenticatedTabs = () => {
  useMatchSockets();

  return (
    <Tabs.Navigator screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="Play" component={HomeScreen} />
      <Tabs.Screen name="Tournaments" component={TournamentsScreen} />
      <Tabs.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
};

const AuthGate: React.FC = () => {
  const { status } = useAuth();

  if (status === 'idle' || status === 'loading') {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {status === 'authenticated' ? (
        <>
          <Stack.Screen name="Main" component={AuthenticatedTabs} />
          <Stack.Screen name="Lobby" component={LobbyScreen} />
          <Stack.Screen name="LiveMatch" component={LiveMatchScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="ModeSelect" component={ModeSelectScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

const App: React.FC = () => (
  <NavigationContainer>
    <View style={{ flex: 1 }}>
      <AuthGate />
    </View>
  </NavigationContainer>
);

export default App;
