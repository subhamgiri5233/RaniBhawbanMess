import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

// Import Screens
import Login from './src/screens/Login';
import AdminDashboard from './src/screens/AdminDashboard';
import MemberDashboard from './src/screens/MemberDashboard';

const Stack = createStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userStr = await AsyncStorage.getItem('user');

        if (token && userStr) {
          const user = JSON.parse(userStr);
          setInitialRoute(user.role === 'admin' ? 'AdminDashboard' : 'MemberDashboard');
        } else {
          setInitialRoute('Login');
        }
      } catch (err) {
        setInitialRoute('Login');
      }
    };

    checkUser();
  }, []);

  if (!initialRoute) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900">
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="MemberDashboard" component={MemberDashboard} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
