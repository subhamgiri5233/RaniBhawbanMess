import { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { FileText, Download, Calendar, User, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import api from '../../lib/api';
import { useData } from '../../context/DataContext';

const Reports = () => {
    const { user } = useAuth();
    const { globalMonth } = useData();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);

    // Fetch all reports
    const fetchReports = async () => {
        try {
            const response = await api.get('/reports');
            setReports(response.data || []);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    // Download report
    const handleDownload = async (reportId, fileName) => {
        try {
            const response = await api.get(`/reports/${reportId}`);
            const report = response.data;

            // Convert base64 to blob and download
            const pdfBlob = base64ToBlob(report.pdfData, 'application/pdf');
            const url = window.URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading report:', error);
            alert('Failed to download report');
        }
    };

    // Delete report (admin only)
    const handleDelete = async (reportId) => {
        if (!window.confirm('Are you sure you want to delete this report?')) return;

        try {
            await api.delete(`/reports/${reportId}`);
            alert('Report deleted successfully');
            fetchReports();
        } catch (error) {
            console.error('Error deleting report:', error);
            alert('Failed to delete report');
        }
    };

    // Helper function to convert base64 to blob
    const base64ToBlob = (base64, type) => {
        const binaryString = window.atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return new Blob([bytes], { type });
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        const kb = bytes / 1024;
        const mb = kb / 1024;
        return mb >= 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
    };

    // Format month
    const formatMonth = (monthStr) => {
        if (!monthStr) return 'Unknown Period';
        const [year, month] = monthStr.split('-');
        const date = new Date(year, month - 1);
        return format(date, 'MMMM yyyy');
    };

    const filteredReports = showAll
        ? reports
        : reports.filter(r => r.month === globalMonth);

    const monthLabel = formatMonth(globalMonth);

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-12"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 shadow-premium p-8 rounded-[2rem] border border-slate-100 dark:border-white/5">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Report Archive</h1>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Access generated monthly balance sheets and audit logs</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border",
                            showAll
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/30"
                                : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/5"
                        )}
                    >
                        {showAll ? 'Show Selected Month' : 'Show All Archives'}
                    </button>
                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                        <FileText size={16} className="text-indigo-500" />
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{filteredReports.length} Documents</span>
                    </div>
                </div>
            </div>

            {!showAll && (
                <div className="flex items-center gap-2 px-6 py-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-500/10 rounded-2xl text-amber-700 dark:text-amber-400">
                    <Calendar size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        Filtering by: {monthLabel}
                    </span>
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center p-24 bg-white dark:bg-slate-900 shadow-premium rounded-[2rem] border border-slate-100 dark:border-white/5">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-6">Indexing reports...</p>
                </div>
            ) : reports.length === 0 ? (
                <Card className="p-24 text-center shadow-premium border-white/5">
                    <div className="w-24 h-24 bg-slate-50 dark:bg-slate-950/40 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-dashed border-slate-200 dark:border-white/10">
                        <FileText size={40} className="text-slate-300 dark:text-slate-800" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Vault Empty</h3>
                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500 mt-2 max-w-sm mx-auto">
                        Reports are auto-generated when the administrator finalizes the monthly calculation cycle.
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence>
                        {filteredReports.map((report, idx) => (
                            <motion.div
                                key={report._id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Card className="p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 bg-white dark:bg-slate-900 shadow-premium border-white/5 group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity translate-x-4 -translate-y-4">
                                        <FileText size={120} />
                                    </div>

                                    <div className="flex items-start justify-between mb-8 relative z-10">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:rotate-6 transition-transform duration-500">
                                            <FileText className="text-white" size={28} />
                                        </div>
                                        {user.role === 'admin' && (
                                            <button
                                                onClick={() => handleDelete(report._id)}
                                                className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors"
                                                title="Secure Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-1">Monthly Ledger</p>
                                        <h3 className="font-black text-2xl text-slate-900 dark:text-slate-50 tracking-tight mb-6">
                                            {formatMonth(report.month)}
                                        </h3>

                                        <div className="space-y-4 mb-8">
                                            <div className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-950/40 flex items-center justify-center">
                                                    <Calendar size={14} className="text-slate-400" />
                                                </div>
                                                <span>{format(new Date(report.createdAt), 'dd MMM yyyy')}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-950/40 flex items-center justify-center">
                                                    <User size={14} className="text-slate-400" />
                                                </div>
                                                <span>{report.generatedByName || 'System Auto'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-4">
                                                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-950/60 rounded-lg text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border border-slate-200/50 dark:border-white/5">
                                                    PDF ARCHIVE
                                                </span>
                                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-auto">
                                                    {formatFileSize(report.fileSize)}
                                                </span>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={() => handleDownload(report._id, report.fileName)}
                                            className="w-full py-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 active:scale-95 transition-all font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3"
                                        >
                                            <Download size={18} />
                                            Download Asset
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
    );
};

export default Reports;
