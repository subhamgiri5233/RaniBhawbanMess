import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { 
    Calculator as CalculatorIcon, Download, Save, TrendingUp, Sparkles, 
    Users, Activity, TrendingDown, CheckCircle2, AlertCircle, RefreshCw,
    UserRound, Home, Wifi, Zap, Flame, Newspaper, Coffee, FileText, Coins
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cn } from '../../lib/utils';
import { addBengaliFont } from '../../utils/bengaliFont';
import api from '../../lib/api';
import { MESS_CONFIG } from '../../config';

const Calculator = () => {
    const { user } = useAuth();
    const {
        members, expenses, meals, guestMeals, globalMonth, settings
    } = useData();

    // Dynamic Settings with Fallbacks
    const getSettingValue = (key, fallback) => {
        const s = (settings || []).find(item => item.key === key);
        return s ? Number(s.value) : fallback;
    };

    const MIN_MEALS = getSettingValue('min_meals_month', MESS_CONFIG.MIN_MEALS_PER_MONTH);
    const guestMealPrices = {
        fish: getSettingValue('guest_price_fish', MESS_CONFIG.GUEST_CONFIG.PRICES.fish),
        meat: getSettingValue('guest_price_meat', MESS_CONFIG.GUEST_CONFIG.PRICES.meat),
        veg: getSettingValue('guest_price_veg', MESS_CONFIG.GUEST_CONFIG.PRICES.veg),
        egg: getSettingValue('guest_price_egg', MESS_CONFIG.GUEST_CONFIG.PRICES.egg)
    };

    // -- State for Inputs --

    // Per Head Inputs
    const [bills, setBills] = useState({
        gas: 0,
        paper: 0,
        wifi: 0,
        didi: 0,
        spices: 0,
        houseRent: 0,
        electric: 0,
        others: 0,
    });

    // Meal Charge Inputs
    const [mealInputs, setMealInputs] = useState({
        totalMarket: 0,
        rice: 0,
        guest: 0,
        totalMeal: 1, // Avoid division by zero
    });

    // Calculated Results
    const [perHeadResult, setPerHeadResult] = useState(null); // { totalAmount, perHeadAmount }
    const [mealChargeResult, setMealChargeResult] = useState(null); // { mealCharge }
    const [submittingReport, setSubmittingReport] = useState(false);

    // Individual Member Inputs (Map of memberId -> { meals, deposit, genDeposit, genDepositDate, guest, marketExpense })
    const [individualInputs, setIndividualInputs] = useState({});
    const [monthlySummaries, setMonthlySummaries] = useState([]);
    const [loadingSummaries, setLoadingSummaries] = useState(false);
    const [savingPDF, setSavingPDF] = useState(false);

    // Fetch values and monthly snapshots from database
    useEffect(() => {
        const fetchData = async () => {
            setLoadingSummaries(true);
            try {
                // Fetch summaries for the selected month to get accurate deposit snapshots
                const summaryRes = await api.get(`/summary/${globalMonth}`);
                setMonthlySummaries(summaryRes.data.members || []);
            } catch (err) {
                console.error('Failed to fetch monthly summaries:', err);
            } finally {
                setLoadingSummaries(false);
                autoFetchFromDatabase();
            }
        };
        fetchData();
    }, [members, expenses, meals, guestMeals, globalMonth]);

    const autoFetchFromDatabase = () => {
        // Reset to default/zero before fetching
        const resetBills = {
            gas: 0, paper: 0, wifi: 0, didi: 0,
            spices: 0, houseRent: 0, electric: 0, others: 0
        };
        const resetMealInputs = {
            totalMarket: 0, rice: 0, guest: 0, totalMeal: 1
        };

        // Fetch approved expenses by category
        const relevantExpenses = (expenses || []).filter(e => e?.status === 'approved');

        // Helper to sum by category
        const sumCat = (cat) => relevantExpenses.filter(e => e?.category === cat).reduce((sum, e) => sum + (Number(e?.amount) || 0), 0);

        const spicesTotal = sumCat('spices');
        const othersTotal = sumCat('others');
        const riceTotal = sumCat('rice');
        const marketTotal = sumCat('market');

        // New shared categories
        const gasTotal = sumCat('gas');
        const paperTotal = sumCat('paper');
        const wifiTotal = sumCat('wifi');
        const didiTotal = sumCat('didi');
        const houseRentTotal = sumCat('houseRent');
        const electricTotal = sumCat('electric');

        // Calculate total meals
        // Calculate total meals (Adjusted with minimum)
        const totalAdjustedMeals = (members || []).reduce((sum, m) => {
            const memberId = m._id || m.id;
            const mealCount = (meals || []).filter(meal =>
                meal.memberId === memberId ||
                meal.memberId === m._id ||
                meal.memberId === m.id
            ).length;
            return sum + Math.max(MIN_MEALS, mealCount);
        }, 0);

        // Guest meal price mapping - already defined above at component level
        // const guestMealPrices = { ... };

        // Calculate guest adjustment (total guest meal cost)
        const guestAdjustment = (guestMeals || []).reduce((sum, g) => {
            const price = guestMealPrices[g?.guestMealType] || 0;
            return sum + price;
        }, 0);

        // Update bills state - reset first
        setBills(resetBills);
        setBills(prev => ({
            ...prev,
            gas: gasTotal,
            wifi: wifiTotal,
            electric: electricTotal,
            spices: spicesTotal,
            others: othersTotal,
            ...(paperTotal > 0 && { paper: paperTotal }),
            ...(didiTotal > 0 && { didi: didiTotal }),
            ...(houseRentTotal > 0 && { houseRent: houseRentTotal })
        }));

        // Update meal inputs - reset first
        setMealInputs(resetMealInputs);
        setMealInputs(prev => ({
            ...prev,
            totalMarket: marketTotal,
            rice: riceTotal,
            totalMeal: totalAdjustedMeals || 1,
            guest: guestAdjustment
        }));
    };

    //    // Initialize individual inputs when members change, auto-fetch from database
    useEffect(() => {
        // guestMealPrices and MIN_MEALS are already defined at the component level via settings
        
        console.log('Auto-fetching individual data...');
        console.log('Members:', members);
        console.log('Meals:', meals);
        console.log('Guest Meals:', guestMeals);
        console.log('Expenses:', expenses);

        setIndividualInputs(() => {
            const newInputs = {}; // Start fresh for each month

            (members || []).forEach(m => {
                if (!m) return;
                const memberId = m._id || m.id;
                if (!memberId) return;

                // Calculate meal count for this member - check both _id and id
                const memberMeals = (meals || []).filter(meal =>
                    meal?.memberId === memberId ||
                    meal?.memberId === m._id ||
                    meal?.memberId === m.id
                );
                const mealCount = memberMeals.length;

                // Calculate guest meal count and cost for this member
                const memberGuestMeals = (guestMeals || []).filter(g =>
                    g?.memberId === memberId ||
                    g?.memberId === m._id ||
                    g?.memberId === m.id
                );
                const guestCost = memberGuestMeals.reduce((sum, g) => {
                    return sum + (guestMealPrices[g?.guestMealType] || 0);
                }, 0);

                // Calculate market expenses for this member (approved)
                const memberMarketExpenses = (expenses || []).filter(e =>
                    e?.category === 'market' &&
                    e?.status === 'approved' &&
                    (e?.paidBy === memberId || e?.paidBy === m._id || e?.paidBy === m.id)
                );
                const marketTotal = memberMarketExpenses.reduce((sum, e) => sum + (Number(e?.amount) || 0), 0);

                // Calculate bill payments for this member (Gas, Wifi, Electric) - approved
                const memberBillExpenses = (expenses || []).filter(e =>
                    ['gas', 'wifi', 'electric'].includes(e?.category) &&
                    e?.status === 'approved' &&
                    (e?.paidBy === memberId || e?.paidBy === m._id || e?.paidBy === m.id)
                );
                const gasPaid = memberBillExpenses.filter(e => e?.category === 'gas').reduce((sum, e) => sum + (Number(e?.amount) || 0), 0);
                const wifiPaid = memberBillExpenses.filter(e => e?.category === 'wifi').reduce((sum, e) => sum + (Number(e?.amount) || 0), 0);
                const electricPaid = memberBillExpenses.filter(e => e?.category === 'electric').reduce((sum, e) => sum + (Number(e?.amount) || 0), 0);
                const totalBillsPaid = gasPaid + wifiPaid + electricPaid;

                // Get the snapshot deposit if it exists for this month, else default to 0
                const summary = (monthlySummaries || []).find(ps => 
                    ps?.memberId?.toString() === memberId?.toString() || ps?.userId === m?.userId
                );
                
                const snapshotDeposit = summary ? (Number(summary?.depositBalance) || 0) : 0;
                const snapshotDepositDate = summary ? summary?.depositDate : (m?.depositDate || '');

                // Calculate general deposit for this member from expenses (approved)
                const memberDepositExpenses = (expenses || []).filter(e =>
                    e?.category === 'deposit' &&
                    e?.status === 'approved' &&
                    (e?.paidBy === memberId || e?.paidBy === m._id || e?.paidBy === m.id || e?.paidBy === m.name)
                );
                const generalDeposit = memberDepositExpenses.reduce((sum, e) => sum + (Number(e?.amount) || 0), 0);

                // Initialize or update member data
                newInputs[memberId] = {
                    meals: mealCount,
                    deposit: snapshotDeposit + totalBillsPaid,
                    genDeposit: generalDeposit,
                    genDepositDate: snapshotDepositDate,
                    guest: guestCost,
                    marketExpense: marketTotal,
                    marketDays: summary ? (Number(summary?.marketDays) || 4) : 4 // Snapshot or default 4
                };
            });

            return newInputs;
        });
    }, [members, meals, guestMeals, expenses, globalMonth]);

    const handleBillChange = (e) => {
        const val = e.target.value;
        const num = parseFloat(val);
        setBills({ ...bills, [e.target.name]: isNaN(num) ? 0 : num });
    };

    const handleMealInputChange = (e) => {
        const val = e.target.value;
        const num = parseFloat(val);
        setMealInputs({ ...mealInputs, [e.target.name]: isNaN(num) ? 0 : num });
    };

    const handleIndividualChange = (memberId, field, value) => {
        const num = parseFloat(value);
        setIndividualInputs(prev => ({
            ...prev,
            [memberId]: { ...prev[memberId], [field]: isNaN(num) ? 0 : num }
        }));
    };

    // Auto-sum total meals from individual inputs
    const syncTotalMeals = () => {
        const total = Object.values(individualInputs).reduce((sum, curr) => sum + Math.max(MIN_MEALS, curr.meals || 0), 0);
        setMealInputs(prev => ({ ...prev, totalMeal: total || 1 }));
    };

    // -- Calculations --

    const calculatePerHead = () => {
        const totalAmount = Object.values(bills).reduce((a, b) => a + b, 0);
        const perHeadAmount = totalAmount / (members.length || 1);
        setPerHeadResult({ totalAmount, perHeadAmount });
    };

    const calculateMealCharge = () => {
        const { totalMarket, rice, guest, totalMeal } = mealInputs;
        const mealCharge = (totalMarket + rice - guest) / (totalMeal || 1);
        setMealChargeResult({ mealCharge });
    };

    const handleSubmitToMonthlyReport = async () => {
        if (!confirm('Submit these shared expenses to the monthly report? This will create or update expense records for Gas, Paper, WiFi, etc.')) {
            return;
        }
        setSubmittingReport(true);
        const { data: finalCalculatedData } = getCalculatedData();
        const memberBalances = finalCalculatedData.map(m => ({
            memberId: m._id || m.id,
            memberName: m.name,
            meals: m.meals || 0,
            isBelowMinimum: m.isBelowMinimum || false,
            mealCost: Math.round(m.mealCost || 0),
            sharedCost: Math.round(m.fixedCost || 0),
            marketCost: Math.round(m.marketExpense || 0),
            guestCost: Math.round(m.guest || 0),
            totalCost: Math.round(m.total || 0),
            balance: Math.round(Math.abs(m.balance)),
            type: m.balance >= 0 ? 'Pay' : 'Get'
        }));

        try {
            await api.post('/expenses/bulk-shared', {
                month: globalMonth,
                bills: bills,
                mealInputs: mealInputs,
                perHeadResult: perHeadResult,
                mealChargeResult: mealChargeResult,
                memberBalances: memberBalances
            });
            alert('Shared expenses submitted to monthly report successfully!');
        } catch (error) {
            console.error('Submission error:', error);
            alert('Failed to submit: ' + (error.response?.data?.message || error.message));
        } finally {
            setSubmittingReport(false);
        }
    };

    // Calculate Balances for Table
    const getCalculatedData = useCallback(() => {
        try {
            if (!perHeadResult || !mealChargeResult || !members) {
                return {
                    data: [],
                    summary: { totalMealCost: 0, totalDeposit: 0, totalBalance: 0 }
                };
            }

            let totalMealCost = 0;
            let totalDeposit = 0;
            let totalBalance = 0;

            const data = members.map(m => {
                const memberId = m._id || m.id;
                const inputs = individualInputs[memberId] || { meals: 0, deposit: 0, guest: 0, marketExpense: 0 };
                const effectiveMeals = Math.max(MIN_MEALS, inputs.meals || 0);
                const mealCost = effectiveMeals * (mealChargeResult.mealCharge || 0);
                const fixedCost = perHeadResult.perHeadAmount || 0;
                const total = mealCost + fixedCost + (inputs.guest || 0);
                const balance = total - ((inputs.deposit || 0) + (inputs.genDeposit || 0) + (inputs.marketExpense || 0));

                totalMealCost += mealCost;
                totalDeposit += (inputs.deposit || 0) + (inputs.genDeposit || 0);
                totalBalance += balance;

                return {
                    ...m,
                    ...inputs,
                    effectiveMeals,
                    isBelowMinimum: (inputs.meals || 0) < MIN_MEALS,
                    mealCost,
                    fixedCost,
                    total,
                    balance
                };
            });

            return { data, summary: { totalMealCost, totalDeposit, totalBalance } };
        } catch (error) {
            console.error('getCalculatedData error:', error);
            return { data: [], summary: { totalMealCost: 0, totalDeposit: 0, totalBalance: 0 } };
        }
    }, [members, individualInputs, perHeadResult, mealChargeResult, MIN_MEALS]);

    const calculatedData = useMemo(() => getCalculatedData(), [getCalculatedData]);

    // -- PDF Generation --

    const generatePDF = async () => {
        try {
            console.log('Generating PDF...');
            if (!perHeadResult || !mealChargeResult) {
                alert('Please perform calculations first!');
                return;
            }

            const doc = new jsPDF('p', 'mm', 'a4');

            const [y, m] = globalMonth.split('-').map(Number);
            const reportMonthText = format(new Date(y, m - 1), 'MMMM yyyy');
            const dateStr = format(new Date(), 'yyyy-MM-dd');
            const pw = doc.internal.pageSize.getWidth();

            // ── Banner ──
            doc.setFillColor(67, 56, 202);
            doc.rect(0, 0, pw, 28, 'F');
            doc.setFillColor(99, 102, 241);
            doc.rect(0, 24, pw, 4, 'F');
            try {
                doc.setFont('NotoSansBengali', 'bold');
            } catch (e) {
                doc.setFont('helvetica', 'bold');
            }
            doc.setFontSize(16);
            doc.setTextColor(255, 255, 255);
            doc.text('RANI BHAWBAN MESS', pw / 2, 12, { align: 'center' });
            doc.setFontSize(9);
            try {
                doc.setFont('NotoSansBengali', 'normal');
            } catch (e) {
                doc.setFont('helvetica', 'normal');
            }
            doc.text('MONTHLY INVOICE', pw / 2, 19, { align: 'center' });

            // ── Meta ──
            doc.setFontSize(9); doc.setTextColor(30, 30, 60); 
            try {
                doc.setFont('NotoSansBengali', 'bold');
            } catch (e) {
                doc.setFont('helvetica', 'bold');
            }
            doc.text(`Month: ${reportMonthText}`, 14, 36);
            doc.text(`Generated: ${dateStr}`, pw - 14, 36, { align: 'right' });

            // Load Bengali font
            await addBengaliFont(doc);

            // Set Bengali font as default (will fallback to times if not available)
            try {
                doc.setFont('NotoSansBengali', 'normal');
            } catch (e) {
                console.warn('Bengali font not available, using default font');
                doc.setFont('times', 'normal');
            }
            doc.setTextColor(0, 0, 0); // Reset color

            // 1. Per Head
            console.log('Adding Per Head Table...');
            doc.setFontSize(12);
            doc.setTextColor(16, 185, 129); // emerald-500
            doc.text('PER HEAD CALCULATION', 52, 45, { align: 'center' });
            doc.setTextColor(0, 0, 0);

            autoTable(doc, {
                startY: 48,
                head: [['Category', 'Amount']],
                headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
                columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold' }, 1: { cellWidth: 30 } },
                body: [
                    ['Gas', (bills.gas || 0).toFixed(2)],
                    ['Paper', (bills.paper || 0).toFixed(2)],
                    ['WiFi', (bills.wifi || 0).toFixed(2)],
                    ['Didi', (bills.didi || 0).toFixed(2)],
                    ['Spices', (bills.spices || 0).toFixed(2)],
                    ['House Rent', (bills.houseRent || 0).toFixed(2)],
                    ['Electric', (bills.electric || 0).toFixed(2)],
                    ['Others', (bills.others || 0).toFixed(2)],
                    ['', ''],
                    ['TOTAL', perHeadResult.totalAmount.toFixed(2)],
                    ['Per Head', perHeadResult.perHeadAmount.toFixed(2)]
                ],
                margin: { left: 15 },
                styles: { fontSize: 10, cellPadding: 3, font: 'NotoSansBengali' },
                theme: 'grid'
            });
            const perHeadFinalY = doc.lastAutoTable.finalY;

            // 2. Meal Charge
            console.log('Adding Meal Charge Table...');
            doc.setFontSize(12);
            doc.setTextColor(245, 158, 11); // amber-500
            doc.text('MEAL CHARGE CALCULATION', 158, 45, { align: 'center' });
            doc.setTextColor(0, 0, 0);

            autoTable(doc, {
                startY: 48,
                head: [['Item', 'Amount']],
                headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: 'bold' },
                columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' }, 1: { cellWidth: 30 } },
                body: [
                    ['Total Market', (mealInputs.totalMarket || 0).toFixed(2)],
                    ['Rice', (mealInputs.rice || 0).toFixed(2)],
                    ['Guest Adj.', (mealInputs.guest || 0).toFixed(2)],
                    ['Total Meals', mealInputs.totalMeal],
                    ['', ''],
                    ['MEAL CHARGE', mealChargeResult.mealCharge.toFixed(2)]
                ],
                margin: { left: 110 },
                styles: { fontSize: 10, cellPadding: 3, font: 'NotoSansBengali' },
                theme: 'grid'
            });

            // 3. Individual Table
            console.log('Adding Individual Table...');
            const mealChargeFinalY = doc.lastAutoTable.finalY;
            const individualStartY = Math.max(perHeadFinalY, mealChargeFinalY) + 15;
            doc.setFontSize(14);
            doc.setTextColor(63, 131, 248); // blue-500
            doc.text('INDIVIDUAL BALANCES', 105, individualStartY, { align: 'center' });
            doc.setTextColor(0, 0, 0);

            const tableBody = calculatedData.data.map(d => [
                d.name,
                `${d.meals}${d.isBelowMinimum ? ` (${MIN_MEALS})` : ''}`,
                mealChargeResult.mealCharge.toFixed(2),
                d.mealCost.toFixed(2),
                d.marketDays || 4,
                d.fixedCost.toFixed(2),
                d.guest.toFixed(2),
                d.marketExpense.toFixed(2),
                ((d.deposit || 0) + (d.genDeposit || 0)).toFixed(0),
                {
                    content: `${Math.abs(Math.round(d.balance))} ${d.balance >= 0 ? 'To Pay' : 'To Receive'}`,
                    styles: { textColor: d.balance >= 0 ? [255, 0, 0] : [0, 128, 0], fontStyle: 'bold' }
                }
            ]);

            autoTable(doc, {
                startY: individualStartY + 5,
                head: [['Name', 'Meals', 'Charge', 'Meal Cost', 'M.Days', 'Per Head', 'Guest', 'Market', 'Deposit', 'Status']],
                body: tableBody,
                styles: { fontSize: 9, cellPadding: 2, font: 'NotoSansBengali' },
                headStyles: { fillColor: [63, 131, 248], textColor: 255, fontStyle: 'bold', font: 'NotoSansBengali' }, // blue-500
                theme: 'grid',
                margin: { bottom: 10 }
            });

            console.log('Saving PDF...');
            const pdfFileName = `Mess_Report_${globalMonth}_${dateStr.replace(/ /g, '_')}.pdf`;
            doc.save(pdfFileName);
            console.log('PDF Saved!');
        } catch (error) {
            console.error('PDF Generation Failed:', error);
            alert(`Error generating PDF: ${error.message}`);
        }
    };

    // Save PDF to Database for Member Access
    const savePDFToDatabase = async () => {
        if (savingPDF) return;

        try {
            setSavingPDF(true);
            console.log('Generating PDF for database...');

            if (!perHeadResult || !mealChargeResult) {
                alert('Please perform calculations first!');
                return;
            }

            const doc = new jsPDF('p', 'mm', 'a4');
            // Generate same PDF content as downloadable version
            const [y, m] = globalMonth.split('-').map(Number);
            const monthTitleText = format(new Date(y, m - 1), 'MMMM yyyy');
            const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
            const pw = doc.internal.pageSize.getWidth();

            // ── Banner ──
            doc.setFillColor(67, 56, 202);
            doc.rect(0, 0, pw, 28, 'F');
            doc.setFillColor(99, 102, 241);
            doc.rect(0, 24, pw, 4, 'F');
            try {
                doc.setFont('NotoSansBengali', 'bold');
            } catch (e) {
                doc.setFont('helvetica', 'bold');
            }
            doc.setFontSize(16);
            doc.setTextColor(255, 255, 255);
            doc.text('RANI BHAWBAN MESS', pw / 2, 12, { align: 'center' });
            doc.setFontSize(9);
            try {
                doc.setFont('NotoSansBengali', 'normal');
            } catch (e) {
                doc.setFont('helvetica', 'normal');
            }
            doc.text('MONTHLY INVOICE', pw / 2, 19, { align: 'center' });

            // ── Meta ──
            doc.setFontSize(9); doc.setTextColor(30, 30, 60); 
            try {
                doc.setFont('NotoSansBengali', 'bold');
            } catch (e) {
                doc.setFont('helvetica', 'bold');
            }
            doc.text(`Month: ${monthTitleText}`, 14, 36);
            doc.text(`Generated: ${dateStr}`, pw - 14, 36, { align: 'right' });

            await addBengaliFont(doc);

            try {
                doc.setFont('NotoSansBengali', 'normal');
            } catch (e) {
                doc.setFont('times', 'normal');
            }
            doc.setTextColor(0, 0, 0); // Reset

            let startY = 48;

            // Per Head Section
            doc.setFontSize(14);
            doc.setTextColor(16, 185, 129);
            doc.text('Per Head Costs', 14, startY);
            doc.setTextColor(0, 0, 0);
            const perHeadData = [
                ['Gas', `₹${bills.gas}`], ['Paper', `₹${bills.paper}`],
                ['WiFi', `₹${bills.wifi}`], ['Didi', `₹${bills.didi}`],
                ['Spices', `₹${bills.spices}`], ['House Rent', `₹${bills.houseRent}`],
                ['Electric', `₹${bills.electric}`], ['Others', `₹${bills.others}`],
                ['Total', `₹${perHeadResult.totalAmount.toFixed(2)}`],
                ['Per Head', `₹${perHeadResult.perHeadAmount.toFixed(2)}`]
            ];
            autoTable(doc, { 
                startY: startY + 5, 
                head: [['Category', 'Amount']], 
                body: perHeadData, 
                headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', font: 'NotoSansBengali' }, 
                styles: { fontSize: 10, font: 'NotoSansBengali' }, 
                theme: 'grid' 
            });

            // Meal Charge Section
            const mealStartY = doc.lastAutoTable.finalY + 10;
            doc.setFontSize(14);
            doc.setTextColor(245, 158, 11); // amber-500
            doc.text('Meal Charges', 14, mealStartY);
            doc.setTextColor(0, 0, 0);
            const mealData = [
                ['Total Market', `₹${mealInputs.totalMarket}`], ['Rice', `₹${mealInputs.rice}`],
                ['Guest Adjustment', `₹${mealInputs.guest}`], ['Total Meals', mealInputs.totalMeal],
                ['Per Meal Charge', `₹${mealChargeResult.mealCharge.toFixed(2)}`]
            ];
            autoTable(doc, { 
                startY: mealStartY + 5, 
                head: [['Category', 'Value']], 
                body: mealData, 
                headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: 'bold', font: 'NotoSansBengali' }, 
                styles: { fontSize: 10, font: 'NotoSansBengali' }, 
                theme: 'grid' 
            });

            // Individual Member Table
            const individualStartY = doc.lastAutoTable.finalY + 10;
            doc.setFontSize(14);
            doc.setTextColor(63, 131, 248); // blue-500
            doc.text('Individual Member Details', 14, individualStartY);
            doc.setTextColor(0, 0, 0);
            const tableBody = calculatedData.data.map(d => [
                d.name, `${d.meals || 0}${d.isBelowMinimum ? ` (${MIN_MEALS})` : ''}`, `₹${mealChargeResult.mealCharge.toFixed(2)}`,
                `₹${d.mealCost.toFixed(2)}`, `${d.marketDays || 4}`, `₹${d.fixedCost.toFixed(2)}`,
                `₹${d.guest || 0}`, `₹${d.marketExpense || 0}`, `₹${((d.deposit || 0) + (d.genDeposit || 0)).toFixed(0)}`,
                d.balance >= 0 ? `Pay ₹${Math.abs(Math.round(d.balance))}` : `Get ₹${Math.abs(Math.round(d.balance))}`
            ]);
            autoTable(doc, {
                startY: individualStartY + 5,
                head: [['Name', 'Meals', 'Charge', 'Meal Cost', 'M.Days', 'Per Head', 'Guest', 'Market', 'Deposit', 'Status']],
                body: tableBody,
                styles: { fontSize: 9, cellPadding: 2, font: 'NotoSansBengali' },
                headStyles: { fillColor: [63, 131, 248], textColor: 255, fontStyle: 'bold', font: 'NotoSansBengali' },
                theme: 'grid'
            });

            const reportMonthStr = format(new Date(globalMonth.split('-')[0], globalMonth.split('-')[1] - 1), 'MMMM yyyy');
            const fileName = `Mess_Report_${reportMonthStr.replace(' ', '_')}.pdf`;
            doc.save(fileName);
        } catch (error) {
            console.error('Save PDF Failed:', error);
            alert(`Error saving PDF: ${error.message}`);
        }
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Power Banner */}
            <div className="relative overflow-hidden rb-card p-5 md:p-8 group mb-8 transition-all hover:shadow-xl hover:shadow-primary-500/5">
                <div className="absolute inset-0 opacity-10 dark:opacity-[0.03] pointer-events-none overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:20px_20px] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
                </div>

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={14} className="text-primary-500 animate-pulse" />
                            <span className="text-[9px] md:text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.2em] md:tracking-[0.3em]">Institutional Revenue Audit</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl rb-header flex flex-wrap items-center gap-2 md:gap-3">
                            Monthly Calculator
                            <span className="inline-flex items-center px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-indigo-300/40 dark:bg-primary-950/50 text-[9px] md:text-[10px] font-black text-indigo-700 dark:text-primary-400 border border-indigo-300 dark:border-primary-900/50 uppercase tracking-widest whitespace-nowrap">
                                {globalMonth}
                            </span>
                        </h1>
                        <p className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-400 uppercase tracking-widest leading-relaxed">
                            Finalize shared expenses and generate individual member accounting
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
                        <Button 
                            onClick={generatePDF} 
                            disabled={!perHeadResult || !mealChargeResult} 
                            className="h-11 md:h-12 px-5 md:px-6 rounded-2xl shadow-lg bg-indigo-300/40 dark:bg-slate-800 text-indigo-900 dark:text-white border border-indigo-300/30 dark:border-white/10 font-black text-xs uppercase tracking-widest hover:bg-indigo-300/60 dark:hover:bg-slate-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Download size={16} />
                            Download PDF
                        </Button>

                        <Button
                            onClick={handleSubmitToMonthlyReport}
                            disabled={submittingReport || !perHeadResult || !mealChargeResult}
                            className="h-11 md:h-12 px-6 md:px-8 rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all bg-emerald-600 hover:bg-emerald-500 border-none text-white font-black text-xs uppercase tracking-[0.1em] flex items-center justify-center gap-2"
                        >
                            <Save size={16} />
                            {submittingReport ? 'Finalizing...' : 'Submit to Report'}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Per Head Metrics */}
                <Card className="rb-card rb-shadow-blue p-5 md:p-8 relative overflow-hidden group/card">
                    <div className="absolute -right-10 -top-10 opacity-[0.03] dark:opacity-[0.05] group-hover/card:rotate-12 transition-transform duration-700 pointer-events-none">
                        <CalculatorIcon size={200} />
                    </div>

                    <h2 className="text-xl rb-header mb-8 flex items-center gap-3 text-slate-900 dark:text-slate-50">
                        <div className="p-2.5 bg-indigo-300/40 dark:bg-primary-950/50 rounded-2xl text-indigo-700 dark:text-primary-400 shadow-inner"><CalculatorIcon size={20} /></div>
                        Shared Subscriptions
                    </h2>
                    
                    <div className="grid grid-cols-2 gap-x-4 md:gap-x-6 gap-y-6 md:gap-y-8 mb-8">
                        {Object.keys(bills).map(key => {
                            const isAutoFetched = ['gas', 'wifi', 'electric', 'spices', 'others'].includes(key);
                            return (
                                <div key={key} className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            name={key}
                                            value={bills[key] === 0 ? '' : bills[key]}
                                            onChange={handleBillChange}
                                            onFocus={(e) => e.target.select()}
                                            readOnly={isAutoFetched}
                                            className={cn(
                                                "w-full bg-indigo-300/40 dark:bg-slate-800/30 border-none rounded-2xl px-5 py-3.5 text-sm font-black transition-all ring-1 focus:ring-2",
                                                isAutoFetched 
                                                    ? "ring-emerald-400/30 dark:ring-emerald-900/20 text-emerald-700 dark:text-emerald-400" 
                                                    : "ring-indigo-300/30 dark:ring-white/5 focus:ring-primary-500/50 text-slate-900 dark:text-white"
                                            )}
                                        />
                                        {isAutoFetched && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" title="Auto-fetched from vault" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-between p-6 bg-indigo-300/40 dark:bg-slate-900/50 rounded-[1.5rem] border border-indigo-300/30 dark:border-white/5 shadow-inner">
                        <div>
                            <p className="text-[8px] font-black text-slate-700 dark:text-slate-500 uppercase tracking-widest mb-1">Active Population</p>
                            <p className="text-xl font-black text-slate-900 dark:text-slate-50">{members.length} Members</p>
                        </div>
                        <Button 
                            onClick={calculatePerHead}
                            className="bg-primary-600 hover:bg-primary-500 text-white rounded-2xl h-12 px-8 font-black uppercase text-xs tracking-widest shadow-xl shadow-primary-500/10"
                        >
                            Process All
                        </Button>
                    </div>

                    {perHeadResult && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 p-6 rounded-[1.5rem] bg-gradient-to-br from-primary-600 to-indigo-700 text-white shadow-2xl shadow-primary-500/20 relative overflow-hidden"
                        >
                            <div className="relative z-10 text-center">
                                <p className="text-[9px] font-black text-primary-100/60 uppercase tracking-widest mb-2">Aggregate Per Head Liability</p>
                                <p className="text-4xl font-black tracking-tighter">₹{perHeadResult.perHeadAmount.toFixed(2)}</p>
                                <p className="text-[10px] font-bold text-white/50 mt-1">Total Vault Withdrawal: ₹{perHeadResult.totalAmount.toFixed(0)}</p>
                            </div>
                        </motion.div>
                    )}
                </Card>

                {/* Meal Charge Section */}
                <Card className="rb-card rb-shadow-orange p-5 md:p-8 relative overflow-hidden group/meal">
                    <div className="absolute -right-10 -top-10 opacity-[0.03] dark:opacity-[0.05] group-hover/meal:rotate-12 transition-transform duration-700 pointer-events-none text-amber-500">
                        <TrendingUp size={200} />
                    </div>

                    <h2 className="text-xl rb-header mb-8 flex items-center gap-3 text-slate-900 dark:text-slate-50">
                        <div className="p-2.5 bg-amber-200 dark:bg-amber-950/50 rounded-2xl text-amber-700 dark:text-amber-400 shadow-inner"><TrendingUp size={20} /></div>
                        Meal Unit Value
                    </h2>

                    <div className="space-y-6 mb-8">
                        <div className="grid grid-cols-2 gap-4 md:gap-6">
                            <div className="space-y-1.5 col-span-2">
                                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Aggregate Market (₹)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={mealInputs.totalMarket}
                                        readOnly
                                        className="w-full bg-emerald-300/40 dark:bg-emerald-950/20 border-none rounded-2xl px-5 py-4 text-sm font-black text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-400/30 dark:ring-emerald-900/30"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                                </div>
                            </div>
                            
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Rice (₹)</label>
                                <input
                                    type="number"
                                    value={mealInputs.rice}
                                    readOnly
                                    className="w-full bg-indigo-300/40 dark:bg-slate-800/30 border-none rounded-2xl px-5 py-3.5 text-sm font-black text-slate-900 dark:text-white ring-1 ring-indigo-400/30 dark:ring-white/5"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Guest Adj. (₹)</label>
                                <input
                                    type="number"
                                    value={mealInputs.guest}
                                    readOnly
                                    className="w-full bg-indigo-300/40 dark:bg-slate-800/30 border-none rounded-2xl px-5 py-3.5 text-sm font-black text-slate-900 dark:text-white ring-1 ring-indigo-400/30 dark:ring-white/5"
                                />
                            </div>

                            <div className="space-y-1.5 col-span-2">
                                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Standardized Meal Units</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={mealInputs.totalMeal}
                                        readOnly
                                        className="w-full bg-amber-300/40 dark:bg-amber-950/20 border-none rounded-2xl px-5 py-4 text-sm font-black text-amber-700 dark:text-amber-400 ring-1 ring-amber-400/30 dark:ring-amber-900/30"
                                    />
                                    <p className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">
                                        Includes {MIN_MEALS}+ Min
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end mb-6">
                        <Button 
                            onClick={calculateMealCharge}
                            className="bg-amber-600 hover:bg-amber-500 text-white rounded-2xl h-12 px-10 font-black uppercase text-xs tracking-widest shadow-xl shadow-amber-500/10"
                        >
                            Sync Units
                        </Button>
                    </div>

                    {mealChargeResult && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-6 rounded-[1.5rem] bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-2xl shadow-amber-500/20 text-center relative overflow-hidden"
                        >
                            <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1">Standard Meal Charge</p>
                            <p className="text-4xl font-black">₹{mealChargeResult.mealCharge.toFixed(2)}</p>
                        </motion.div>
                    )}
                </Card>
            </div>

                {(perHeadResult && mealChargeResult) && (
                    <div className="mt-12 space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <div className="p-2 bg-indigo-300/40 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl"><Users size={18} /></div>
                        <h3 className="text-lg rb-header">Institutional Audit Ledger</h3>
                    </div>

                    <Card className="rb-card p-0 overflow-hidden mb-12 shadow-2xl">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="bg-slate-900 dark:bg-black text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                        <th className="p-5 text-left sticky left-0 bg-slate-900 dark:bg-black z-20 shadow-xl">Identity</th>
                                        <th className="p-5 text-center">Meal Units</th>
                                        <th className="p-5 text-center">Market Allocation</th>
                                        <th className="p-5 text-center">Guest Units</th>
                                        <th className="p-5 text-center">Shared Liability</th>
                                        <th className="p-5 text-center">Capital Deposit</th>
                                        <th className="p-5 text-right pr-8">Month End Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {(calculatedData?.data || []).map(item => {
                                        const memberId = item?._id || item?.id;
                                        if (!memberId) return null;
                                        
                                        return (
                                            <tr key={memberId} className="group hover:bg-indigo-300/40 dark:hover:bg-white/5 transition-colors duration-200 border-b border-indigo-200/30 last:border-0">
                                                <td className="p-5 sticky left-0 bg-indigo-300/40 dark:bg-slate-900 group-hover:bg-indigo-300/60 transition-colors z-10 shadow-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-white text-xs font-black shadow-lg">
                                                            {(item?.name || item?.memberName || '?').charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-black text-slate-900 dark:text-white leading-none mb-1">{item?.name || item?.memberName}</div>
                                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item?.role || 'Member'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <div className={cn(
                                                        "px-4 py-2 rounded-xl border inline-block min-w-[80px]",
                                                        item?.isBelowMinimum 
                                                            ? "bg-rose-300/40 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 shadow-rose-500/10 border border-rose-200 dark:border-rose-900/20" 
                                                            : "bg-emerald-300/40 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-emerald-500/10 border border-emerald-200 dark:border-emerald-900/20"
                                                    )}>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black">{(Number(item?.meals) || 0)} Units</span>
                                                            <span className="text-[8px] font-bold opacity-60 uppercase tracking-tighter">Min: {MIN_MEALS}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <div className="px-4 py-2 bg-indigo-200/40 dark:bg-black/30 rounded-xl border border-indigo-200/50 dark:border-white/5 text-center">
                                                        <span className="text-xs font-black text-slate-800 dark:text-slate-300">₹{(Number(item?.marketExpense) || 0).toLocaleString()}</span>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <div className="px-4 py-2 bg-indigo-200/40 dark:bg-black/30 rounded-xl border border-indigo-200/50 dark:border-white/5 inline-block min-w-[60px]">
                                                        <span className="text-xs font-black text-slate-800 dark:text-slate-300">{Number(item?.guest) || 0}</span>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-center text-xs font-black text-slate-600 dark:text-slate-400">
                                                    ₹{(Number(perHeadResult?.perHeadAmount) || 0).toFixed(0)}
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex flex-col gap-1.5 items-center">
                                                        <input
                                                            type="number"
                                                            value={item?.deposit === 0 ? '' : (item?.deposit || '')}
                                                            onChange={(e) => handleIndividualChange(memberId, 'deposit', e.target.value)}
                                                            className="w-[100px] bg-indigo-300/40 dark:bg-slate-800 border-2 border-indigo-300/30 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-black text-center focus:border-primary-500 outline-none transition-all shadow-sm"
                                                            placeholder="0"
                                                        />
                                                        <span className="text-[8px] font-black text-primary-600 uppercase tracking-tighter opacity-60">GEN: ₹{Number(item?.genDeposit) || 0}</span>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-right pr-8">
                                                    <div className={cn(
                                                        "inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-xs shadow-lg",
                                                        (Number(item?.balance) || 0) > 0 
                                                            ? "bg-rose-300/40 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 shadow-rose-500/10 border border-rose-200 dark:border-rose-900/20" 
                                                            : "bg-emerald-300/40 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-emerald-500/10 border border-emerald-200 dark:border-emerald-900/20"
                                                    )}>
                                                        ₹{Math.abs(Math.round(Number(item?.balance) || 0))}
                                                        <span className="text-[8px] font-bold uppercase opacity-60">{(Number(item?.balance) || 0) > 0 ? 'PAY' : 'GET'}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Calculator;
