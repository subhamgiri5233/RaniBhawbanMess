import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminDashboard({ navigation }) {
    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        navigation.replace('Login');
    };

    return (
        <View className="flex-1 bg-slate-50 items-center justify-center p-6">
            <Text className="text-2xl font-black text-slate-900 mb-2 text-center">Admin Dashboard</Text>
            <Text className="text-slate-500 mb-8 font-bold text-center">Welcome back, Manager!</Text>

            <TouchableOpacity
                onPress={handleLogout}
                className="bg-rose-500 px-6 py-3 rounded-xl"
            >
                <Text className="text-white font-black uppercase text-xs tracking-wider">Logout</Text>
            </TouchableOpacity>
        </View>
    );
}
