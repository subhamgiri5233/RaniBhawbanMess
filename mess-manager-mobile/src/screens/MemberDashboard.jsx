import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';
import { 
    User, 
    Utensils, 
    CreditCard, 
    Plus, 
    History, 
    LogOut,
    ChevronRight,
    Sparkles,
    Calendar,
    Users
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function MemberDashboard({ navigation }) {
    const [user, setUser] = useState(null);
    const [meals, setMeals] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const globalMonth = useMemo(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }, []);

    const fetchData = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            const currentUser = JSON.parse(userData);
            setUser(currentUser);

            const [mealsRes, expensesRes] = await Promise.all([
                client.get(`/meals?month=${globalMonth}`),
                client.get(`/expenses?month=${globalMonth}`)
            ]);
            
            // Filter data for current user
            const userId = currentUser.id || currentUser._id;
            setMeals((mealsRes.data || []).filter(m => m.memberId === userId));
            setExpenses((expensesRes.data || []).filter(e => e.paidBy === userId));
        } catch (error) {
            console.error('Error fetching member data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        navigation.replace('Login');
    };

    const myMealsCount = meals.length;
    const myTotalDeposit = expenses
        .filter(e => e.category === 'deposit')
        .reduce((sum, e) => sum + (e.amount || 0), 0);

    if (loading && !refreshing) {
        return (
            <View className="flex-1 bg-slate-50 items-center justify-center">
                <ActivityIndicator size="large" color="#6366f1" />
                <Text className="mt-4 text-slate-500 font-bold">Opening Portal...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
            <ScrollView 
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
                }
            >
                {/* Header */}
                <View className="px-6 py-6 flex-row items-center justify-between">
                    <View>
                        <Text className="text-3xl font-black text-slate-900 tracking-tighter">Portal</Text>
                        <Text className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Member Interface</Text>
                    </View>
                    <TouchableOpacity 
                        onPress={handleLogout}
                        className="w-10 h-10 bg-rose-100 rounded-full items-center justify-center"
                    >
                        <LogOut size={18} color="#f43f5e" />
                    </TouchableOpacity>
                </View>

                {/* User Info Card */}
                <View className="px-6">
                    <View className="bg-indigo-600 rounded-[2.5rem] p-6 shadow-xl shadow-indigo-500/40 relative overflow-hidden">
                        <View className="absolute top-0 right-0 p-4 opacity-10">
                            <Sparkles size={100} color="#fff" />
                        </View>
                        
                        <View className="flex-row items-center gap-4">
                            <View className="w-14 h-14 bg-white/20 rounded-2xl items-center justify-center border border-white/30">
                                <User size={32} color="#fff" />
                            </View>
                            <View>
                                <Text className="text-white font-black text-xl tracking-tight">{user?.name || 'Member'}</Text>
                                <Text className="text-indigo-100 font-bold text-[10px] uppercase tracking-widest">Active Resident</Text>
                            </View>
                        </View>

                        <View className="flex-row mt-8 justify-between">
                            <View>
                                <Text className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">Monthly Meals</Text>
                                <Text className="text-white text-3xl font-black tracking-tighter">{myMealsCount}</Text>
                            </View>
                            <View className="items-end">
                                <Text className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">Credit Balance</Text>
                                <Text className="text-white text-3xl font-black tracking-tighter">₹{myTotalDeposit}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                <View className="px-6 mt-8">
                    <Text className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Quick Actions</Text>
                    <View className="flex-row gap-4">
                        <ActionBtn label="Add Meal" icon={Utensils} color="#6366f1" />
                        <ActionBtn label="Guest" icon={Users} color="#10b981" />
                        <ActionBtn label="History" icon={History} color="#f59e0b" />
                    </View>
                </View>

                {/* Recent Activity */}
                <View className="px-6 mt-10">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-sm font-black text-slate-400 uppercase tracking-widest">Recent Logs</Text>
                        <Text className="text-xs font-bold text-indigo-600">View All</Text>
                    </View>
                    
                    {meals.length === 0 && expenses.length === 0 ? (
                        <View className="bg-white rounded-3xl p-10 items-center justify-center border border-slate-100 border-dashed">
                            <Text className="text-slate-400 font-bold text-xs uppercase tracking-widest">No recent logs found</Text>
                        </View>
                    ) : (
                        <View>
                            {meals.slice(0, 3).map((meal, idx) => (
                                <ActivityItem 
                                    key={`meal-${idx}`}
                                    title={`Registered ${meal.type}`} 
                                    date={meal.date} 
                                    icon={Utensils} 
                                    color="#6366f1" 
                                />
                            ))}
                            {expenses.slice(0, 3).map((exp, idx) => (
                                <ActivityItem 
                                    key={`exp-${idx}`}
                                    title={`Deposit: ₹${exp.amount}`} 
                                    date={exp.date} 
                                    icon={CreditCard} 
                                    color="#10b981" 
                                />
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function ActionBtn({ label, icon: Icon, color }) {
    return (
        <TouchableOpacity className="flex-1 items-center">
            <View style={{ backgroundColor: color + '15' }} className="w-full aspect-square rounded-[2rem] items-center justify-center border border-slate-100">
                <Icon size={24} color={color} />
            </View>
            <Text className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-2">{label}</Text>
        </TouchableOpacity>
    );
}

function ActivityItem({ title, date, icon: Icon, color }) {
    return (
        <TouchableOpacity className="bg-white rounded-3xl p-4 mb-3 flex-row items-center justify-between border border-slate-50">
            <View className="flex-row items-center gap-4">
                <View style={{ backgroundColor: color + '10' }} className="w-10 h-10 rounded-xl items-center justify-center">
                    <Icon size={18} color={color} />
                </View>
                <View>
                    <Text className="font-black text-slate-900 tracking-tight">{title}</Text>
                    <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{date}</Text>
                </View>
            </View>
            <ChevronRight size={14} color="#cbd5e1" />
        </TouchableOpacity>
    );
}
