// src/context/ReportsContext.tsx
// Shared state between IncidentReports and GeospatialMap
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { sampleReports, type Report } from '../data/sample-reports';

interface ReportsContextValue {
    reports: Report[];
    updateReport: (id: string, updates: Partial<Report>) => void;
    getVerifiedReports: () => Report[];
    getReportsByBarangay: () => Record<string, Report[]>;
}

const ReportsContext = createContext<ReportsContextValue | null>(null);

export function ReportsProvider({ children }: { children: ReactNode }) {
    const [reports, setReports] = useState<Report[]>(sampleReports);

    const updateReport = useCallback((id: string, updates: Partial<Report>) => {
        setReports((prev) =>
            prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
        );
    }, []);

    const getVerifiedReports = useCallback(() => {
        return reports.filter((r) => r.status === 'verified');
    }, [reports]);

    const getReportsByBarangay = useCallback(() => {
        const map: Record<string, Report[]> = {};
        reports
            .filter((r) => r.status === 'verified' || r.status === 'under_review')
            .forEach((r) => {
                if (!map[r.barangay]) map[r.barangay] = [];
                map[r.barangay].push(r);
            });
        return map;
    }, [reports]);

    return (
        <ReportsContext.Provider value={{ reports, updateReport, getVerifiedReports, getReportsByBarangay }}>
            {children}
        </ReportsContext.Provider>
    );
}

export function useReports() {
    const ctx = useContext(ReportsContext);
    if (!ctx) throw new Error('useReports must be used inside ReportsProvider');
    return ctx;
}