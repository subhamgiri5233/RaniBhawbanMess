import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';
import { 
    Users, 
    UtensilsCrossed, 
    TrendingUp, 
    ShoppingCart, 
    Flame, 
    Wheat, 
    Package, 
    LogOut,
    ChevronRight,
    Search,
    UserCircle
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function AdminDashboard({ navigation }) {
    const [members, setMembers] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const globalMonth = useMemo(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }, []);

    const fetchData = async () => {
        try {
            const [membersRes, expensesRes, mealsRes] = await Promise.all([
                client.get('/members'),
                client.get(`/expenses?month=${globalMonth}`),
                client.get(`/meals?month=${globalMonth}`)
            ]);
            
            setMembers(membersRes.data || []);
            setExpenses(expensesRes.data || []);
            setMeals(mealsRes.data || []);
        } catch (error) {
            console.error('Error fetching admin data:', error);
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

    // Calculate Summary Stats
    const totalMeals = meals.length;
    
    const marketExpenses = useMemo(() => 
        expenses.filter(e => e.category === 'market' && e.paidBy !== 'admin').reduce((sum, e) => sum + (e.amount || 0), 0)
    , [expenses]);

    const spicesExpenses = useMemo(() => 
        expenses.filter(e => e.category === 'spices').reduce((sum, e) => sum + (e.amount || 0), 0)
    , [expenses]);

    const memberSummary = useMemo(() => {
        return members.filter(m => m.role === 'member').map(member => {
            const mId = member._id || member.id;
            const mMeals = meals.filter(m => m.memberId === mId).length;
            const mContribs = expenses.filter(e => 
                (e.paidBy === mId || e.paidBy === member.name) && 
                ['deposit', 'market'].includes(e.category)
            ).reduce((sum, e) => sum + (e.amount || 0), 0);
            
            return { ...member, totalMeals: mMeals, monthlyDeposit: mContribs };
        });
    }, [members, meals, expenses]);

    if (loading && !refreshing) {
        return (
            <View className="flex-1 bg-slate-50 items-center justify-center">
                <ActivityIndicator size="large" color="#6366f1" />
                <Text className="mt-4 text-slate-500 font-bold">Initializing Terminal...</Text>
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
                        <Text className="text-3xl font-black text-slate-900 tracking-tighter">Dashboard</Text>
                        <Text className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Manager Control</Text>
                    </View>
                    <TouchableOpacity 
                        onPress={handleLogout}
                        className="w-10 h-10 bg-rose-100 rounded-full items-center justify-center"
                    >
                        <LogOut size={18} color="#f43f5e" />
                    </TouchableOpacity>
                </View>

                {/* Main Stats */}
                <View className="px-4 flex-row flex-wrap">
                    <StatCard 
                        title="Members" 
                        value={members.length} 
                        icon={Users} 
                        color="#6366f1" 
                        bg="bg-indigo-100" 
                    />
                    <StatCard 
                        title="Meals" 
                        value={totalMeals} 
                        icon={UtensilsCrossed} 
                        color="#f59e0b" 
                        bg="bg-amber-100" 
                    />
                </View>

                {/* Expense Breakdown */}
                <View className="px-6 mt-8">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-sm font-black text-slate-400 uppercase tracking-widest">Expense Audit</Text>
                        <TrendingUp size={16} color="#94a3b8" />
                    </View>
                    
                    <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                        <ExpenseItem label="Market Fund" value={marketExpenses} icon={ShoppingCart} color="#6366f1" />
                        <View className="h-[1px] bg-slate-50 my-4" />
                        <ExpenseItem label="Spices & Gas" value={spicesExpenses} icon={Flame} color="#f97316" />
                        <View className="h-[1px] bg-slate-50 my-4" />
                        <ExpenseItem label="Rice Inventory" value={0} icon={Wheat} color="#10b981" />
                    </View>
                </View>

                {/* Member Summary */}
                <View className="px-6 mt-8">
                    <Text className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Active Ledger</Text>
                    
                    {memberSummary.map((member, idx) => (
                        <TouchableOpacity 
                            key={member._id || member.id}
                            className="bg-white rounded-[2rem] p-5 mb-4 flex-row items-center justify-between shadow-sm border border-slate-100/50"
                            activeOpacity={0.7}
                        >
                            <View className="flex-row items-center gap-4">
                                <View className="w-12 h-12 bg-slate-100 rounded-2xl items-center justify-center">
                                    <UserCircle size={28} color="#94a3b8" />
                                </View>
                                <View>
                                    <Text className="text-base font-black text-slate-900 tracking-tight">{member.name}</Text>
                                    <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{member.totalMeals} Meals Recorded</Text>
                                </View>
                            </View>
                            <View className="items-end">
                                <Text className="font-black text-indigo-600 text-lg">₹{member.monthlyDeposit}</Text>
                                <View className="flex-row items-center gap-1 mt-1">
                                    <Text className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">View Audit</Text>
                                    <ChevronRight size={10} color="#cbd5e1" />
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function StatCard({ title, value, icon: Icon, color, bg }) {
    return (
        <View style={{ width: (width - 32) / 2 }} className="p-2">
            <View className={`p-5 rounded-3xl ${bg} border border-white`}>
                <View className="flex-row items-center justify-between mb-4">
                    <Icon size={20} color={color} />
                    <View className="w-2 h-2 rounded-full bg-white opacity-50" />
                </View>
                <Text className="text-xs font-black text-slate-500 uppercase tracking-widest">{title}</Text>
                <Text className="text-3xl font-black text-slate-900 tracking-tighter mt-1">{value}</Text>
            </View>
        </View>
    );
}

function ExpenseItem({ label, value, icon: Icon, color }) {
    return (
        <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
                <View style={{ backgroundColor: color + '20' }} className="p-2 rounded-lg">
                    <Icon size={16} color={color} />
                </View>
                <Text className="font-bold text-slate-600">{label}</Text>
            </View>
            <Text className="font-black text-slate-900 text-lg">₹{value}</Text>
        </View>
    );
}
