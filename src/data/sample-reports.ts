// src/data/sample-reports.ts
// Initial empty reports array — populated dynamically via Supabase backend
// Barangay names updated to match talisay-barangays.ts GeoJSON
// ─────────────────────────────────────────────────────────────────────────────

export type ReportStatus = 'pending' | 'under_review' | 'verified' | 'rejected' | 'resolved';

export interface Report {
    id: string;
    barangay: string;
    type: string;
    urgency: string;
    source: string;
    time: string;
    status: ReportStatus;
    description: string;
    originalText: string;
    reporter: string;
    contact: string;
    coordinates: string; // "lat, lng"
    landmark: string;
    verifiedBy: string | null;
    verifiedAt: string | null;
    rejectionReason: string | null;
    possibleDuplicateOf: string | null;
}

export const sampleReports: Report[] = [];
