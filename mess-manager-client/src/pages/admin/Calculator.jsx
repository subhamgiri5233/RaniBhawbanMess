import { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Calculator as CalculatorIcon, Download, Send, Save, MessageCircle, MessageSquare } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cn } from '../../lib/utils';
import { addBengaliFont } from '../../utils/bengaliFont';
import api from '../../lib/api';
import { MESS_CONFIG } from '../../config';

const Calculator = () => {
    const { user } = useAuth();
    const { members, expenses, meals, guestMeals, sendNotification, sendPaymentNotifications, sendBulkWhatsAppOfficial } = useData();
    const MIN_MEALS = MESS_CONFIG.MIN_MEALS_PER_MONTH;

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
    const [sendingNotifications, setSendingNotifications] = useState(false);
    const [savingPDF, setSavingPDF] = useState(false);

    // Individual Member Inputs (Map of memberId -> { meals, deposit, guest })
    const [individualInputs, setIndividualInputs] = useState({});

    // Auto-fetch values from database
    useEffect(() => {
        if (members.length > 0 && (expenses.length > 0 || meals.length > 0 || guestMeals.length > 0)) {
            autoFetchFromDatabase();
        }
    }, [members, expenses, meals, guestMeals]);

    const autoFetchFromDatabase = () => {
        // Fetch approved expenses by category
        const approvedExpenses = expenses.filter(e => e.status === 'approved');

        // Helper to sum by category
        const sumCat = (cat) => approvedExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);

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
        const totalAdjustedMeals = members.reduce((sum, m) => {
            const memberId = m._id || m.id;
            const mealCount = meals.filter(meal =>
                meal.memberId === memberId ||
                meal.memberId === m._id ||
                meal.memberId === m.id
            ).length;
            return sum + Math.max(MIN_MEALS, mealCount);
        }, 0);

        // Guest meal price mapping
        const guestMealPrices = {
            fish: 40,
            egg: 40,
            veg: 35,
            meat: 50
        };

        // Calculate guest adjustment (total guest meal cost)
        const guestAdjustment = guestMeals.reduce((sum, g) => {
            const price = guestMealPrices[g.guestMealType] || 0;
            return sum + price;
        }, 0);

        // Update bills state with fetched values
        setBills(prev => ({
            ...prev,
            gas: gasTotal,
            wifi: wifiTotal,
            electric: electricTotal,
            spices: spicesTotal,
            others: othersTotal,
            // Only overwrite these if there's actual data in the DB, otherwise preserve manual entry
            ...(paperTotal > 0 && { paper: paperTotal }),
            ...(didiTotal > 0 && { didi: didiTotal }),
            ...(houseRentTotal > 0 && { houseRent: houseRentTotal })
        }));

        // Update meal inputs with fetched values
        setMealInputs(prev => ({
            ...prev,
            totalMarket: marketTotal,
            rice: riceTotal,
            totalMeal: totalAdjustedMeals || 1,
            guest: guestAdjustment
        }));
    };

    // Initialize individual inputs when members change, auto-fetch from database
    useEffect(() => {
        const guestMealPrices = MESS_CONFIG.GUEST_CONFIG.PRICES;

        console.log('Auto-fetching individual data...');
        console.log('Members:', members);
        console.log('Meals:', meals);
        console.log('Guest Meals:', guestMeals);
        console.log('Expenses:', expenses);

        setIndividualInputs(prev => {
            const newInputs = { ...prev };

            members.forEach(m => {
                const memberId = m._id || m.id;
                console.log(`Processing member: ${m.name} (ID: ${memberId})`);

                // Calculate meal count for this member - check both _id and id
                const memberMeals = meals.filter(meal =>
                    meal.memberId === memberId ||
                    meal.memberId === m._id ||
                    meal.memberId === m.id
                );
                const mealCount = memberMeals.length;
                console.log(`  - Meals count: ${mealCount}`, memberMeals);

                // Calculate guest meal count and cost for this member
                const memberGuestMeals = guestMeals.filter(g =>
                    g.memberId === memberId ||
                    g.memberId === m._id ||
                    g.memberId === m.id
                );
                const guestCost = memberGuestMeals.reduce((sum, g) => {
                    return sum + (guestMealPrices[g.guestMealType] || 0);
                }, 0);
                console.log(`  - Guest cost: ₹${guestCost}`, memberGuestMeals);

                // Calculate market expenses for this member
                const memberMarketExpenses = expenses.filter(e =>
                    e.category === 'market' &&
                    e.status === 'approved' &&
                    (e.paidBy === memberId || e.paidBy === m._id || e.paidBy === m.id)
                );
                const marketTotal = memberMarketExpenses.reduce((sum, e) => sum + e.amount, 0);
                console.log(`  - Market expenses: ₹${marketTotal}`, memberMarketExpenses);

                // Initialize or update member data
                newInputs[memberId] = {
                    meals: mealCount,
                    deposit: m.deposit || 0,
                    guest: guestCost,
                    marketExpense: marketTotal
                };
            });

            console.log('Final individualInputs:', newInputs);
            return newInputs;
        });
    }, [members, meals, guestMeals, expenses]);

    const handleBillChange = (e) => {
        setBills({ ...bills, [e.target.name]: parseFloat(e.target.value) || 0 });
    };

    const handleMealInputChange = (e) => {
        setMealInputs({ ...mealInputs, [e.target.name]: parseFloat(e.target.value) || 0 });
    };

    const handleIndividualChange = (memberId, field, value) => {
        setIndividualInputs(prev => ({
            ...prev,
            [memberId]: {
                ...prev[memberId],
                [field]: parseFloat(value) || 0
            }
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
                const balance = total - ((inputs.deposit || 0) + (inputs.marketExpense || 0));

                totalMealCost += mealCost;
                totalDeposit += (inputs.deposit || 0);
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

    // -- Send Payment Notifications --
    const handleBulkWhatsAppOfficial = async () => {
        if (!perHeadResult || !mealChargeResult) {
            alert('Please perform calculations first!');
            return;
        }

        if (!confirm('This will send the official mess bill (mess_bill_notification template) to ALL members. Continue?')) {
            return;
        }

        setSendingNotifications(true);
        try {
            const { data } = getCalculatedData();
            const monthText = format(new Date(), 'MMMM yyyy');

            const membersToNotify = data.map(m => ({
                userId: m._id || m.id,
                name: m.name,
                mobile: m.mobile || members.find(member => member._id === (m._id || m.id) || member.id === (m._id || m.id))?.mobile,
                month: monthText,
                meals: m.effectiveMeals,
                mealCharge: mealChargeResult.mealCharge,
                mealCost: m.mealCost,
                fixedCost: m.fixedCost,
                marketContribution: m.marketExpense,
                deposit: m.deposit,
                balance: m.balance
            })).filter(m => m.mobile);

            if (membersToNotify.length === 0) {
                alert('No members with mobile numbers found!');
                return;
            }

            const result = await sendBulkWhatsAppOfficial(membersToNotify);

            if (result.success) {
                const failed = result.results.filter(r => !r.success);
                const successCount = result.results.length - failed.length;

                let message = `Official WhatsApp bulk send completed!\nSuccess: ${successCount}\nFailed: ${failed.length}`;

                if (failed.length > 0) {
                    message += `\n\nFailed member details:\n` +
                        failed.map(f => `- ${f.name}: ${f.error}`).join('\n');
                }

                alert(message);
            } else {
                alert('Failed to send bulk notifications: ' + result.error);
            }
        } catch (error) {
            console.error('Bulk WhatsApp error:', error);
            alert('An unexpected error occurred.');
        } finally {
            setSendingNotifications(false);
        }
    };

    const handleSendNotifications = async () => {
        if (!perHeadResult || !mealChargeResult) {
            alert('Please perform calculations first!');
            return;
        }

        try {
            setSendingNotifications(true);

            // Prepare member payment data
            const memberPayments = calculatedData.data.map(member => ({
                userId: member._id || member.id,
                memberName: member.name,
                amount: member.balance
            }));

            const result = await sendPaymentNotifications(memberPayments);

            if (result.success) {
                alert(`Payment notifications sent to ${result.count} members successfully!`);
            } else {
                alert(`Failed to send notifications: ${result.error}`);
            }
        } catch (error) {
            console.error('Error sending notifications:', error);
            alert('Failed to send payment notifications');
        } finally {
            setSendingNotifications(false);
        }
    };

    const handleWhatsAppClick = (data) => {
        try {
            const memberMobile = data.mobile || members.find(m => m._id === data._id || m.id === data.id)?.mobile;

            if (!memberMobile) {
                alert(`Mobile number not found for ${data.name}. Please add it in Admin > Members first.`);
                return;
            }

            // Clean mobile number (remove spaces, dashes, +, etc.)
            const cleanedMobile = memberMobile.replace(/\D/g, '');
            // Add 91 if not present (assuming Indian numbers)
            const finalMobile = cleanedMobile.length === 10 ? `91${cleanedMobile}` : cleanedMobile;

            const balanceText = `${Math.abs(Math.round(data.balance))} ${data.balance >= 0 ? 'To Pay' : 'To Receive'}`;

            const message = `*Mess Bill Notification - ${format(new Date(), 'MMMM yyyy')}*\n\n` +
                `Hello *${data.name}*, here is your mess bill for this month:\n\n` +
                `• *Meals:* ${data.meals}${data.isBelowMinimum ? ` (40 Min applied)` : ''}\n` +
                `• *Meal Charge:* ₹${(mealChargeResult?.mealCharge || 0).toFixed(2)} / meal\n` +
                `• *Meal Cost:* ₹${data.mealCost.toFixed(2)}\n` +
                `• *Fixed Cost:* ₹${data.fixedCost.toFixed(2)}\n` +
                `• *Market Contribution:* ₹${data.marketExpense.toFixed(2)}\n` +
                `• *Deposit:* ₹${data.deposit.toFixed(2)}\n` +
                `---\n` +
                `*Balance:* ₹*${balanceText}*\n\n` +
                `_Please [Pay/Receive] soon. Thank you!_`;

            const encodedMessage = encodeURIComponent(message);
            const waLink = `https://wa.me/${finalMobile}?text=${encodedMessage}`;

            // Using a temporary anchor tag for maximum compatibility
            const link = document.createElement('a');
            link.href = waLink;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('WhatsApp trigger failed:', error);
            alert('Could not open WhatsApp. Please check your browser settings.');
        }
    };

    const handleSMSClick = (data) => {
        try {
            const memberMobile = data.mobile || members.find(m => m._id === data._id || m.id === data.id)?.mobile;

            if (!memberMobile) {
                alert(`Mobile number not found for ${data.name}.`);
                return;
            }

            const cleanedMobile = memberMobile.replace(/\D/g, '');
            const balanceText = `${Math.abs(Math.round(data.balance))} ${data.balance >= 0 ? 'To Pay' : 'To Receive'}`;

            const message = `Mess Bill - ${format(new Date(), 'MMM yyyy')}\n\n` +
                `Hello ${data.name}, your mess bill:\n` +
                `• Meals: ${data.meals}\n` +
                `• Meal Cost: Rs.${data.mealCost.toFixed(2)}\n` +
                `• Fixed Cost: Rs.${data.fixedCost.toFixed(2)}\n` +
                `• Balance: Rs.${balanceText}\n\n` +
                `Please clear soon. Thanks!`;

            const encodedMessage = encodeURIComponent(message);
            // location.href is often more reliable for protocol handlers like sms:
            window.location.href = `sms:${cleanedMobile}?body=${encodedMessage}`;
        } catch (error) {
            console.error('SMS trigger failed:', error);
            alert('Could not open Messaging app. Error: ' + error.message);
        }
    };

    // -- PDF Generation --

    const generatePDF = async () => {
        try {
            console.log('Generating PDF...');
            if (!perHeadResult || !mealChargeResult) {
                alert('Please perform calculations first!');
                return;
            }

            const doc = new jsPDF('p', 'mm', 'a4');

            // Load Bengali font
            await addBengaliFont(doc);

            // Set Bengali font as default (will fallback to times if not available)
            try {
                doc.setFont('NotoSansBengali', 'normal');
            } catch (e) {
                console.warn('Bengali font not available, using default font');
                doc.setFont('times', 'normal');
            }

            // Title
            doc.setFontSize(14);
            doc.text('Mess Report', 105, 15, { align: 'center' });
            doc.setFontSize(10);
            const dateStr = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
            doc.text(`Generated on: ${dateStr}`, 105, 20, { align: 'center' });

            // 1. Per Head
            console.log('Adding Per Head Table...');
            doc.setFontSize(12);
            doc.text('PER HEAD CALCULATION', 52, 30, { align: 'center' });

            autoTable(doc, {
                startY: 35,
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
                styles: { fontSize: 10, cellPadding: 3 },
                theme: 'grid'
            });

            // 2. Meal Charge
            console.log('Adding Meal Charge Table...');
            doc.setFontSize(12);
            doc.text('MEAL CHARGE CALCULATION', 158, 30, { align: 'center' });

            autoTable(doc, {
                startY: 35,
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
                styles: { fontSize: 10, cellPadding: 3 },
                theme: 'grid'
            });

            // 3. Individual Table
            console.log('Adding Individual Table...');
            const individualStartY = 160;
            doc.setFontSize(12);
            doc.text('INDIVIDUAL BALANCES', 105, individualStartY, { align: 'center' });

            const tableBody = calculatedData.data.map(d => [
                d.name,
                `${d.meals}${d.isBelowMinimum ? ` (${MIN_MEALS})` : ''}`,
                mealChargeResult.mealCharge.toFixed(2),
                d.mealCost.toFixed(2),
                d.fixedCost.toFixed(2),
                d.guest.toFixed(2),
                d.marketExpense.toFixed(2),
                d.deposit.toFixed(2),
                {
                    content: `${Math.abs(Math.round(d.balance))} ${d.balance >= 0 ? 'To Pay' : 'To Receive'}`,
                    styles: { textColor: d.balance >= 0 ? [255, 0, 0] : [0, 128, 0], fontStyle: 'bold' }
                }
            ]);

            autoTable(doc, {
                startY: individualStartY + 5,
                head: [['Name', 'Meals', 'Charge', 'Meal Cost', 'Per Head', 'Guest', 'Market', 'Deposit', 'Status']],
                body: tableBody,
                styles: { fontSize: 9, cellPadding: 2 },
                headStyles: { fillColor: [51, 51, 51], textColor: 255, fontStyle: 'bold' },
                theme: 'grid',
                margin: { bottom: 10 }
            });

            console.log('Saving PDF...');
            doc.save(`Mess_Report_${dateStr.replace(/ /g, '_')}.pdf`);
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
            await addBengaliFont(doc);

            try {
                doc.setFont('NotoSansBengali', 'normal');
            } catch (e) {
                doc.setFont('times', 'normal');
            }

            // Generate same PDF content as downloadable version
            const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

            // Title
            doc.setFontSize(18);
            doc.text('Mess Monthly Report', 105, 20, { align: 'center' });
            doc.setFontSize(12);
            doc.text(dateStr, 105, 28, { align: 'center' });

            let startY = 40;

            // Per Head Section
            doc.setFontSize(14);
            doc.text('Per Head Costs', 14, startY);
            const perHeadData = [
                ['Gas', `৳${bills.gas}`], ['Paper', `৳${bills.paper}`],
                ['WiFi', `৳${bills.wifi}`], ['Didi', `৳${bills.didi}`],
                ['Spices', `৳${bills.spices}`], ['House Rent', `৳${bills.houseRent}`],
                ['Electric', `৳${bills.electric}`], ['Others', `৳${bills.others}`],
                ['Total', `৳${perHeadResult.totalAmount.toFixed(2)}`],
                ['Per Head', `৳${perHeadResult.perHeadAmount.toFixed(2)}`]
            ];
            autoTable(doc, { startY: startY + 5, head: [['Category', 'Amount']], body: perHeadData, styles: { fontSize: 10 }, theme: 'grid' });

            // Meal Charge Section
            const mealStartY = doc.lastAutoTable.finalY + 10;
            doc.text('Meal Charges', 14, mealStartY);
            const mealData = [
                ['Total Market', `৳${mealInputs.totalMarket}`], ['Rice', `৳${mealInputs.rice}`],
                ['Guest Adjustment', `৳${mealInputs.guest}`], ['Total Meals', mealInputs.totalMeal],
                ['Per Meal Charge', `৳${mealChargeResult.mealCharge.toFixed(2)}`]
            ];
            autoTable(doc, { startY: mealStartY + 5, head: [['Category', 'Value']], body: mealData, styles: { fontSize: 10 }, theme: 'grid' });

            // Individual Member Table
            const individualStartY = doc.lastAutoTable.finalY + 10;
            doc.text('Individual Member Details', 14, individualStartY);
            const tableBody = calculatedData.data.map(d => [
                d.name, `${d.meals || 0}${d.isBelowMinimum ? ` (${MIN_MEALS})` : ''}`, `৳${mealChargeResult.mealCharge.toFixed(2)}`,
                `৳${d.mealCost.toFixed(2)}`, `৳${d.fixedCost.toFixed(2)}`,
                `৳${d.guest || 0}`, `৳${d.marketExpense || 0}`, `৳${d.deposit || 0}`,
                d.balance >= 0 ? `Pay ৳${Math.abs(Math.round(d.balance))}` : `Get ৳${Math.abs(Math.round(d.balance))}`
            ]);
            autoTable(doc, {
                startY: individualStartY + 5,
                head: [['Name', 'Meals', 'Charge', 'Meal Cost', 'Per Head', 'Guest', 'Market', 'Deposit', 'Status']],
                body: tableBody,
                styles: { fontSize: 9, cellPadding: 2 },
                headStyles: { fillColor: [51, 51, 51], textColor: 255, fontStyle: 'bold' },
                theme: 'grid'
            });

            // Get PDF as base64
            const pdfBase64 = doc.output('datauristring').split(',')[1];
            const month = new Date().toISOString().slice(0, 7); // YYYY-MM
            const fileName = `Mess_Report_${month}.pdf`;

            console.log('Saving to database...');
            const response = await api.post('/reports', {
                month,
                pdfData: pdfBase64,
                fileName,
                generatedBy: user.id,
                generatedByName: user.name
            });

            if (response.status === 201 || response.status === 200) {
                alert('✅ PDF saved successfully! All members can now download it from the Reports page.');
                console.log('PDF saved:', response.data);
            }
        } catch (error) {
            console.error('Save PDF Failed:', error);
            alert(`Error saving PDF: ${error.message}`);
        } finally {
            setSavingPDF(false);
        }
    };

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 border-l-8 border-l-primary-500 shadow-sm p-8 rounded-[2rem] border border-slate-200 dark:border-white/5 backdrop-blur-xl transition-colors">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Monthly Calculator</h1>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Finalize monthly accounts and revenue</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={generatePDF} disabled={!perHeadResult || !mealChargeResult} className="rounded-2xl shadow-lg active:scale-95 transition-all">
                        <Download size={18} />
                        Download
                    </Button>
                    <Button
                        onClick={savePDFToDatabase}
                        disabled={!perHeadResult || !mealChargeResult || savingPDF}
                        variant="secondary"
                        className="rounded-2xl shadow-lg active:scale-95 transition-all"
                    >
                        <Save size={18} />
                        {savingPDF ? 'Saving...' : 'Share Report'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Per Head Section */}
                <Card className="p-6 border-slate-200/60 dark:border-white/5 bg-white dark:bg-slate-900/40">
                    <h2 className="text-lg font-black text-slate-800 dark:text-slate-50 tracking-tight mb-6 flex items-center gap-2">
                        <CalculatorIcon className="text-primary-600 dark:text-primary-400" size={20} />
                        Per Head Metrics
                    </h2>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {Object.keys(bills).map(key => {
                            const isAutoFetched = ['gas', 'wifi', 'electric', 'spices', 'others'].includes(key);
                            return (
                                <Input
                                    key={key}
                                    label={key.replace(/([A-Z])/g, ' $1').trim().toUpperCase() + " (₹)"}
                                    type="number"
                                    name={key}
                                    value={bills[key]}
                                    onChange={handleBillChange}
                                    readOnly={isAutoFetched}
                                    className={isAutoFetched ? "opacity-90" : ""}
                                    inputClassName={isAutoFetched ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 font-black" : ""}
                                />
                            );
                        })}
                    </div>
                    <div className="bg-primary-50 dark:bg-primary-950/30 p-4 rounded-2xl flex justify-between items-center border border-primary-100 dark:border-primary-900/50">
                        <div className="text-sm font-black text-primary-800 dark:text-primary-300 uppercase tracking-wider">Total Members: {members.length}</div>
                        <Button size="sm" onClick={calculatePerHead}>Calculate</Button>
                    </div>
                    {perHeadResult && (
                        <div className="mt-4 p-5 bg-slate-50 dark:bg-slate-900/80 rounded-2xl text-center border border-slate-100 dark:border-white/5 shadow-inner">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Total Amount: ₹{perHeadResult.totalAmount.toFixed(2)}</p>
                            <p className="text-2xl font-black text-primary-600 dark:text-primary-400 mt-1">Per Head: ₹{perHeadResult.perHeadAmount.toFixed(2)}</p>
                        </div>
                    )}
                </Card>

                {/* Meal Charge Section */}
                <Card className="p-6 border-slate-200/60 dark:border-white/5 bg-white dark:bg-slate-900/40">
                    <h2 className="text-lg font-black text-slate-800 dark:text-slate-50 tracking-tight mb-6 flex items-center gap-2">
                        <CalculatorIcon className="text-amber-600 dark:text-amber-400" size={20} />
                        Meal Unit Value
                    </h2>
                    <div className="space-y-4 mb-4">
                        <Input
                            label="TOTAL MARKET (₹)"
                            type="number"
                            name="totalMarket"
                            value={mealInputs.totalMarket}
                            onChange={handleMealInputChange}
                            readOnly
                            inputClassName="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="RICE (₹)"
                                type="number"
                                name="rice"
                                value={mealInputs.rice}
                                onChange={handleMealInputChange}
                                readOnly
                                inputClassName="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400"
                            />
                            <Input
                                label="GUEST ADJ. (₹)"
                                type="number"
                                name="guest"
                                value={mealInputs.guest}
                                onChange={handleMealInputChange}
                                readOnly
                                inputClassName="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400"
                            />
                        </div>
                        <Input
                            label="TOTAL MEALS (ADJUSTED)"
                            type="number"
                            name="totalMeal"
                            value={mealInputs.totalMeal}
                            onChange={handleMealInputChange}
                            readOnly
                            inputClassName="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400"
                        />
                        <p className="text-[10px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest text-right mt-1">
                            * Includes adjustments for {MIN_MEALS}-meal minimum
                        </p>
                    </div>
                    <div className="flex justify-end mb-4">
                        <Button size="sm" onClick={calculateMealCharge}>Calculate</Button>
                    </div>
                    {mealChargeResult && (
                        <div className="p-5 bg-slate-50 dark:bg-slate-900/80 rounded-2xl text-center border border-slate-100 dark:border-white/5 shadow-inner mt-4">
                            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                                Charge: ₹{mealChargeResult.mealCharge.toFixed(2)} / meal
                            </p>
                        </div>
                    )}
                </Card>
            </div >

            {/* Individual Calculation Section */}
            {
                perHeadResult && mealChargeResult && (
                    <Card className="p-0 overflow-hidden border-slate-100 dark:border-white/5">
                        <div className="p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50">
                            <h2 className="text-lg font-black text-slate-900 dark:text-slate-50 tracking-tight">Individual Breakdown</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-100/50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest text-[11px] border-b border-slate-200 dark:border-white/5">
                                    <tr>
                                        <th className="p-4">Member</th>
                                        <th className="p-4 w-24">Meals</th>
                                        <th className="p-4 w-32">Market (₹)</th>
                                        <th className="p-4 w-28">Guest (₹)</th>
                                        <th className="p-4 w-32">Per Head (₹)</th>
                                        <th className="p-4 w-32">Deposit (₹)</th>
                                        <th className="p-4 text-right">Balance</th>
                                        <th className="p-4 text-center w-28">Notify</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-bold">
                                    {calculatedData.data.map(data => {
                                        const memberId = data._id || data.id;
                                        return (
                                            <tr key={memberId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="p-4 font-black text-slate-900 dark:text-slate-100">{data.name}</td>
                                                <td className="p-4 relative">
                                                    <input
                                                        type="number"
                                                        value={individualInputs[memberId]?.meals || 0}
                                                        readOnly
                                                        className={cn(
                                                            "w-full p-1.5 border rounded-lg text-xs font-black text-center transition-all",
                                                            data.isBelowMinimum
                                                                ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-400"
                                                                : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400"
                                                        )}
                                                        title={data.isBelowMinimum ? `Below ${MIN_MEALS} meal minimum (Effective: ${MIN_MEALS})` : "Auto-fetched from meals database"}
                                                    />
                                                    {data.isBelowMinimum && (
                                                        <div className="absolute -top-1 -right-1">
                                                            <div className="flex items-center justify-center w-5 h-5 bg-rose-500 text-white rounded-full text-[8px] font-black border-2 border-white dark:border-slate-900 shadow-sm" title="Minimum applied">
                                                                {MIN_MEALS}+
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <input
                                                        type="number"
                                                        value={individualInputs[memberId]?.marketExpense || 0}
                                                        readOnly
                                                        className="w-full p-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-lg text-xs font-black text-emerald-700 dark:text-emerald-400 text-center"
                                                        title="Auto-fetched from approved market expenses"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <input
                                                        type="number"
                                                        value={individualInputs[memberId]?.guest || 0}
                                                        readOnly
                                                        className="w-full p-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-lg text-xs font-black text-emerald-700 dark:text-emerald-400 text-center"
                                                        title="Auto-fetched from guest meals"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <input
                                                        type="number"
                                                        value={perHeadResult?.perHeadAmount.toFixed(2) || 0}
                                                        readOnly
                                                        className="w-full p-1.5 bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800/50 rounded-lg text-xs font-black text-primary-700 dark:text-primary-400 text-center"
                                                        title="Per head cost (same for all members)"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <input
                                                        type="number"
                                                        value={individualInputs[memberId]?.deposit || 0}
                                                        onChange={(e) => handleIndividualChange(memberId, 'deposit', e.target.value)}
                                                        className="w-full p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-black text-slate-900 dark:text-slate-100 text-center focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                                                    />
                                                </td>
                                                <td className={`p-4 text-right font-black ${data.balance >= 0 ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                    ₹{Math.abs(Math.round(data.balance))} {data.balance >= 0 ? '(Pay)' : '(Get)'}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleWhatsAppClick(data)}
                                                            className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/20 active:scale-90 transition-all"
                                                            title="WhatsApp"
                                                        >
                                                            <MessageCircle size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleSMSClick(data)}
                                                            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 active:scale-90 transition-all"
                                                            title="Normal SMS"
                                                        >
                                                            <MessageSquare size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Send Notification Buttons */}
                        <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap justify-end gap-3">
                            <Button
                                onClick={handleBulkWhatsAppOfficial}
                                disabled={sendingNotifications}
                                variant="outline"
                                className="border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-2xl"
                            >
                                <MessageCircle size={18} />
                                {sendingNotifications ? 'Sending...' : 'Bulk WhatsApp (Official)'}
                            </Button>
                            <Button
                                onClick={handleSendNotifications}
                                disabled={sendingNotifications}
                                variant="secondary"
                                className="rounded-2xl"
                            >
                                <Send size={18} />
                                {sendingNotifications ? 'Sending...' : 'Send App Notifications'}
                            </Button>
                        </div>
                    </Card>
                )
            }
        </div >
    );
};

export default Calculator;
