import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';

export default function Login({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/auth/login', { email, password });

            await AsyncStorage.setItem('token', res.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(res.data.user));

            if (res.data.user.role === 'admin') {
                navigation.replace('AdminDashboard');
            } else {
                navigation.replace('MemberDashboard');
            }
        } catch (err) {
            const message = err.response?.data?.error || 'Login failed. Check backend connection.';
            Alert.alert('Login Failed', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 justify-center px-6 bg-slate-900">
            <View className="mb-10 items-center">
                <Text className="text-3xl font-black text-white text-center tracking-tight">
                    Rani Bhawban Mess
                </Text>
                <Text className="text-slate-400 mt-2 font-bold text-center">
                    Manager & Member Portal
                </Text>
            </View>

            <View className="space-y-4">
                <View>
                    <Text className="text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">
                        Email
                    </Text>
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 border border-slate-700 focus:border-primary-500 font-bold"
                        placeholder="member@ranibhawban.com"
                        placeholderTextColor="#64748B"
                    />
                </View>

                <View>
                    <Text className="text-xs font-black uppercase text-slate-400 mb-2 mt-4 tracking-widest">
                        Password
                    </Text>
                    <TextInput
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 border border-slate-700 focus:border-primary-500 font-bold"
                        placeholder="••••••••"
                        placeholderTextColor="#64748B"
                    />
                </View>

                <TouchableOpacity
                    onPress={handleLogin}
                    disabled={loading}
                    className="w-full bg-primary-600 rounded-xl py-3.5 items-center justify-center mt-6 flex-row"
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-black text-sm uppercase tracking-wider">
                            Sign In
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
