import { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { 
    Calculator as CalculatorIcon, Download, Save, TrendingUp, Sparkles, 
    Users, Activity, TrendingDown, CheckCircle2, AlertCircle, RefreshCw,
    UserRound, Wifi, Zap, Flame, Newspaper, Coffee, FileText, Coins
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
        fund: 0,
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
            spices: 0, houseRent: 0, electric: 0, fund: 0, others: 0
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
        const fundTotal = sumCat('fund');

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
            fund: fundTotal,
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
                    ['Fund', (bills.fund || 0).toFixed(2)],
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
                ['Electric', `₹${bills.electric}`], ['Fund', `₹${bills.fund}`], 
                ['Others', `₹${bills.others}`],
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
        <div className="space-y-6 sm:space-y-8 pb-12">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 border-l-4 border-l-indigo-600 shadow-sm p-6 sm:p-8 rounded-2xl md:rounded-[1.5rem] border border-slate-200/80 dark:border-white/5 backdrop-blur-xl transition-colors">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400 animate-pulse" />
                        <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Revenue & Expense Reconciliation</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight flex flex-wrap items-center gap-3">
                        Monthly Calculator
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 uppercase tracking-wider">
                            {globalMonth}
                        </span>
                    </h1>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
                        Finalize shared expenses and generate individual member accounting
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Per Head Metrics */}
                <Card className="p-5 md:p-6 shadow-sm border border-slate-200/80 dark:border-white/5">
                    <h2 className="text-lg font-extrabold mb-6 flex items-center gap-3 text-slate-900 dark:text-slate-50">
                        <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400"><CalculatorIcon size={18} /></div>
                        Shared Subscriptions
                    </h2>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mb-6">
                        {Object.keys(bills).map(key => {
                            const isAutoFetched = ['gas', 'wifi', 'electric', 'spices', 'others'].includes(key);
                            return (
                                <div key={key} className="space-y-1">
                                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-0.5">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name={key}
                                            value={bills[key] === 0 ? '' : bills[key]}
                                            onChange={handleBillChange}
                                            onFocus={(e) => e.target.select()}
                                            readOnly={isAutoFetched}
                                            className={cn(
                                                "w-full bg-slate-50 dark:bg-slate-800/60 border rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all outline-none",
                                                isAutoFetched 
                                                    ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-400" 
                                                    : "border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                                            )}
                                        />
                                        {isAutoFetched && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500" title="Auto-fetched" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-white/5 mb-4">
                        <div>
                            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Active Population</p>
                            <p className="text-base font-extrabold text-slate-900 dark:text-slate-50">{members.length} Members</p>
                        </div>
                        <Button 
                            onClick={calculatePerHead}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 px-5 font-extrabold uppercase text-xs tracking-wider shadow-sm"
                        >
                            Process All
                        </Button>
                    </div>

                    {perHeadResult && (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-md text-center">
                            <p className="text-[9px] font-extrabold text-indigo-200 uppercase tracking-wider mb-1">Aggregate Per Head Liability</p>
                            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight">₹{perHeadResult.perHeadAmount.toFixed(2)}</p>
                            <p className="text-[10px] font-bold text-indigo-200/70 mt-0.5">Total Shared: ₹{perHeadResult.totalAmount.toFixed(0)}</p>
                        </div>
                    )}
                </Card>

                {/* Meal Charge Section */}
                <Card className="p-5 md:p-6 shadow-sm border border-slate-200/80 dark:border-white/5">
                    <h2 className="text-lg font-extrabold mb-6 flex items-center gap-3 text-slate-900 dark:text-slate-50">
                        <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400"><TrendingUp size={18} /></div>
                        Meal Unit Value
                    </h2>

                    <div className="space-y-3.5 mb-6">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1 col-span-2">
                                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-0.5">Aggregate Market (₹)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={mealInputs.totalMarket}
                                        readOnly
                                        className="w-full bg-slate-50 dark:bg-slate-800/60 border border-emerald-500/30 rounded-xl px-3.5 py-2 text-xs font-extrabold text-emerald-700 dark:text-emerald-400"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-0.5">Rice (₹)</label>
                                <input
                                    type="number"
                                    value={mealInputs.rice}
                                    readOnly
                                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs font-extrabold text-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-0.5">Guest Adj. (₹)</label>
                                <input
                                    type="number"
                                    value={mealInputs.guest}
                                    readOnly
                                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs font-extrabold text-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="space-y-1 col-span-2">
                                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-0.5">Standardized Meal Units</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={mealInputs.totalMeal}
                                        readOnly
                                        className="w-full bg-slate-50 dark:bg-slate-800/60 border border-amber-500/30 rounded-xl px-3.5 py-2 text-xs font-extrabold text-amber-700 dark:text-amber-400"
                                    />
                                    <p className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-extrabold text-amber-600 dark:text-amber-500 uppercase tracking-wider">
                                        Includes {MIN_MEALS}+ Min
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end mb-4">
                        <Button 
                            onClick={calculateMealCharge}
                            className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl h-10 px-6 font-extrabold uppercase text-xs tracking-wider shadow-sm"
                        >
                            Sync Units
                        </Button>
                    </div>

                    {mealChargeResult && (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 text-white shadow-md text-center">
                            <p className="text-[9px] font-extrabold text-white/70 uppercase tracking-wider mb-1">Standard Meal Charge</p>
                            <p className="text-2xl sm:text-3xl font-extrabold">₹{mealChargeResult.mealCharge.toFixed(2)}</p>
                        </div>
                    )}
                </Card>
            </div>

            {(perHeadResult && mealChargeResult) && (
                <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20"><Users size={16} /></div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-50">Institutional Audit Ledger</h3>
                    </div>

                    <Card className="p-0 overflow-hidden shadow-sm border border-slate-200/80 dark:border-white/5">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full border-collapse min-w-[900px] text-left">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-900/80 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200/80 dark:border-white/5">
                                        <th className="p-3.5 pl-5 sticky left-0 bg-slate-50 dark:bg-slate-900 z-20">Identity</th>
                                        <th className="p-3.5 text-center">Meal Units</th>
                                        <th className="p-3.5 text-center">Market Allocation</th>
                                        <th className="p-3.5 text-center">Guest Units</th>
                                        <th className="p-3.5 text-center">Shared Liability</th>
                                        <th className="p-3.5 text-center">Capital Deposit</th>
                                        <th className="p-3.5 text-right pr-6">Month End Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {(calculatedData?.data || []).map(item => {
                                        const memberId = item?._id || item?.id;
                                        if (!memberId) return null;
                                        
                                        return (
                                            <tr key={memberId} className="group hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                                                <td className="p-3.5 pl-5 sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-colors z-10">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-white/5 flex items-center justify-center text-slate-700 dark:text-slate-200 text-xs font-extrabold">
                                                            {(item?.name || item?.memberName || '?').charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-extrabold text-slate-900 dark:text-white leading-none mb-0.5">{item?.name || item?.memberName}</div>
                                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{item?.role || 'Member'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3.5 text-center">
                                                    <div className={cn(
                                                        "px-2.5 py-1 rounded-lg border inline-block",
                                                        item?.isBelowMinimum 
                                                            ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20" 
                                                            : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                                    )}>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-extrabold">{(Number(item?.meals) || 0)} Units</span>
                                                            <span className="text-[8px] font-bold opacity-60 uppercase">Min: {MIN_MEALS}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3.5 text-center">
                                                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">₹{(Number(item?.marketExpense) || 0).toLocaleString()}</span>
                                                </td>
                                                <td className="p-3.5 text-center">
                                                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{Number(item?.guest) || 0}</span>
                                                </td>
                                                <td className="p-3.5 text-center text-xs font-extrabold text-slate-600 dark:text-slate-400">
                                                    ₹{(Number(perHeadResult?.perHeadAmount) || 0).toFixed(0)}
                                                </td>
                                                <td className="p-3.5">
                                                    <div className="flex flex-col gap-1 items-center">
                                                        <input
                                                            type="number"
                                                            value={item?.deposit === 0 ? '' : (item?.deposit || '')}
                                                            onChange={(e) => handleIndividualChange(memberId, 'deposit', e.target.value)}
                                                            className="w-20 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs font-extrabold text-center focus:ring-2 focus:ring-indigo-500 outline-none"
                                                            placeholder="0"
                                                        />
                                                        <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">GEN: ₹{Number(item?.genDeposit) || 0}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3.5 text-right pr-6">
                                                    <div className={cn(
                                                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-extrabold text-xs border",
                                                        (Number(item?.balance) || 0) > 0 
                                                            ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20" 
                                                            : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                                    )}>
                                                        ₹{Math.abs(Math.round(Number(item?.balance) || 0))}
                                                        <span className="text-[8px] font-bold uppercase opacity-70">{(Number(item?.balance) || 0) > 0 ? 'PAY' : 'GET'}</span>
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

            {/* Bottom Actions Section */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 p-6 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-white/5">
                <Button 
                    onClick={generatePDF} 
                    disabled={!perHeadResult || !mealChargeResult} 
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-white/10 font-extrabold text-xs uppercase tracking-wider hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <Download size={16} />
                    Download Analysis PDF
                </Button>

                <Button
                    onClick={handleSubmitToMonthlyReport}
                    disabled={submittingReport || !perHeadResult || !mealChargeResult}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <Save size={16} />
                    {submittingReport ? 'Finalizing...' : 'Submit to Monthly Report'}
                </Button>
            </div>
        </div>
    );
};

export default Calculator;


