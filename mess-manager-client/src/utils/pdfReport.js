import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

export const generateBillPDF = (member, summaryData) => {
    const doc = new jsPDF();
    const today = format(new Date(), 'dd-MM-yyyy');
    const monthYear = summaryData.month || format(new Date(), 'MMMM yyyy');

    // Brand Colors
    const primaryColor = [79, 70, 229]; // Indigo-600
    const secondaryColor = [30, 41, 59]; // Slate-800

    // Header - Brand Section
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('RANI BHAWBAN MESS', 20, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Premium Mess Management & Billing System', 20, 28);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`BILL FOR: ${monthYear.toUpperCase()}`, 140, 24);

    // Bill Details Header
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(16);
    doc.text('INVOICE', 20, 55);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Date Issued: ${today}`, 20, 62);
    doc.text(`Bill To: ${member.name}`, 20, 68);

    // Summary Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(130, 50, 60, 25, 3, 3, 'F');
    doc.setTextColor(...primaryColor);
    doc.setFontSize(8);
    doc.text('TOTAL BALANCE', 135, 58);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const balanceText = `INR ${Math.abs(Math.round(member.balance))}`;
    doc.text(balanceText, 135, 68);
    doc.setFontSize(8);
    doc.text(member.balance >= 0 ? 'STATUS: TO PAY' : 'STATUS: TO RECEIVE', 135, 72);

    // Main Calculations Table
    const tableData = [
        ['Description', 'Count/Rate', 'Amount'],
        ['Total Meals Consumed', member.meals.toString(), '-'],
        ['Meal Charge Rate', `INR ${member.mealCharge.toFixed(2)}`, '-'],
        ['Total Meal Cost', '-', `INR ${member.mealCost.toFixed(2)}`],
        ['Fixed Costs (Electricity/Wifi/Maid)', '-', `INR ${member.fixedCost.toFixed(2)}`],
        ['Market Contribution (Deposited)', '-', `INR ${member.marketContribution.toFixed(2)}`],
        ['Individual Expenses/Payments', '-', `INR ${member.deposit.toFixed(2)}`],
    ];

    doc.autoTable({
        startY: 85,
        head: [tableData[0]],
        body: tableData.slice(1),
        theme: 'striped',
        headStyles: { 
            fillColor: primaryColor, 
            textColor: 255, 
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 40, halign: 'center' },
            2: { cellWidth: 30, halign: 'right' }
        },
        styles: { fontSize: 10, cellPadding: 5 }
    });

    // Final Calculation Row
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.setTextColor(...secondaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('Final Settlement Calculation:', 20, finalY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Meal Cost + Fixed Cost - Contribution - Payments', 20, finalY + 7);

    // Footer - Signature & Note
    const footerY = 270;
    doc.setDrawColor(226, 232, 240);
    doc.line(20, footerY - 20, 190, footerY - 20);
    
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('This is an automatically generated bill from the Rani Bhawban Mess Management App.', 20, footerY - 10);
    doc.text('Please clear your dues by the 5th of next month.', 20, footerY - 5);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Authorized Administrator', 150, footerY - 5);

    // Download the PDF
    doc.save(`Bill_${member.name.replace(/\s/g, '_')}_${monthYear.replace(/\s/g, '_')}.pdf`);
};
