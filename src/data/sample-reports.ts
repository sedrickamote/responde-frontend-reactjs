// src/data/sample-reports.ts
// Shared mock data — used by both IncidentReports and GeospatialMap
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

export const sampleReports: Report[] = [
    // ── Leynes (centroid: 120.9759, 14.0926) ──
    { id: '011', barangay: 'Leynes', type: 'Search & Rescue', urgency: 'Low', source: 'Scraper', time: '10/24 10:57', status: 'pending', description: 'Missing person reported near the riverbank. Last seen wearing a red shirt.', originalText: 'May nawawala daw malapit sa ilog, naka pula daw ang damit.', reporter: 'Juan Dela Cruz', contact: '0912-345-6789', coordinates: '14.0935, 120.9755', landmark: 'Near riverbank', verifiedBy: null, verifiedAt: null, rejectionReason: null, possibleDuplicateOf: null },
    { id: '013', barangay: 'Leynes', type: 'Food & Water', urgency: 'Low', source: 'Scraper', time: '10/24 10:57', status: 'verified', description: 'Request for water supply delivery due to pipe maintenance.', originalText: 'Kailangan ng tubig dito, sira daw ang tubo.', reporter: 'Pedro Reyes', contact: '0917-876-5432', coordinates: '14.0920, 120.9762', landmark: 'Barangay hall', verifiedBy: 'Officer Cruz', verifiedAt: '10/24 11:15', rejectionReason: null, possibleDuplicateOf: null },
    { id: '015', barangay: 'Leynes', type: 'Search & Rescue', urgency: 'Low', source: 'Scraper', time: '10/24 10:57', status: 'rejected', description: 'Stranded dog on rooftop during flooding. Owner requesting assistance.', originalText: 'May aso na stranded sa bubong, tulungan nyo po.', reporter: 'Carlos Tan', contact: '0915-987-6543', coordinates: '14.0940, 120.9748', landmark: 'Rooftop', verifiedBy: null, verifiedAt: null, rejectionReason: 'not_disaster_related', possibleDuplicateOf: null },
    { id: '017', barangay: 'Leynes', type: 'Search & Rescue', urgency: 'Low', source: 'Scraper', time: '10/24 10:57', status: 'pending', description: 'Boat capsized near the shore. Two fishermen accounted for, one missing.', originalText: 'May bumagsak na bangka, may nawawalang isda.', reporter: 'Ramon Garcia', contact: '0913-222-3333', coordinates: '14.0918, 120.9770', landmark: 'Shoreline', verifiedBy: null, verifiedAt: null, rejectionReason: null, possibleDuplicateOf: '011' },
    { id: '018', barangay: 'Leynes', type: 'Food & Water', urgency: 'Low', source: 'Bot', time: '10/24 10:57', status: 'under_review', description: 'Relief goods distribution needed for 15 families affected by flash flood.', originalText: 'Kailangan ng relief goods para sa 15 pamilya.', reporter: 'Liza Mendoza', contact: '0914-555-6666', coordinates: '14.0928, 120.9743', landmark: 'Evacuation center', verifiedBy: null, verifiedAt: null, rejectionReason: null, possibleDuplicateOf: null },
    { id: '029', barangay: 'Leynes', type: 'Medical', urgency: 'High', source: 'Scraper', time: '10/24 13:45', status: 'pending', description: 'Multiple residents showing symptoms of leptospirosis after wading through floodwater.', originalText: 'Maraming may sakit sa leptospirosis, lumusong sa baha.', reporter: 'Dr. Emmanuel Cruz', contact: '0930-222-3334', coordinates: '14.0912, 120.9758', landmark: 'Leynes clinic', verifiedBy: null, verifiedAt: null, rejectionReason: null, possibleDuplicateOf: null },

    // ── Poblacion Barangay 1 (centroid: 121.0237, 14.0959) ──
    { id: '012', barangay: 'Poblacion Barangay 1', type: 'Medical', urgency: 'High', source: 'Bot', time: '10/24 10:57', status: 'under_review', description: 'Elderly resident collapsed at the market. Needs immediate medical attention.', originalText: 'May matandang natumba sa palengke, kailangan ng tulong medikal.', reporter: 'Maria Santos', contact: '0918-234-5678', coordinates: '14.0955, 121.0240', landmark: 'Public market', verifiedBy: null, verifiedAt: null, rejectionReason: null, possibleDuplicateOf: null },

    // ── Caloocan (centroid: 120.9788, 14.1024) ──
    { id: '014', barangay: 'Caloocan', type: 'Infrastructure', urgency: 'Moderate', source: 'Scraper', time: '10/24 10:57', status: 'resolved', description: 'Road partially blocked by fallen tree after heavy rains.', originalText: 'May punong bumagsak sa daan, hindi makadaan ang mga sasakyan.', reporter: 'Ana Lim', contact: '0919-123-4567', coordinates: '14.1020, 120.9795', landmark: 'Main road Caloocan', verifiedBy: 'Officer Cruz', verifiedAt: '10/24 11:00', rejectionReason: null, possibleDuplicateOf: null },
    { id: '027', barangay: 'Caloocan', type: 'Food & Water', urgency: 'Low', source: 'Scraper', time: '10/24 13:15', status: 'pending', description: 'Barangay hall requesting additional water containers for evacuation center.', originalText: 'Kailangan ng lagayan ng tubig sa evacuation.', reporter: 'Ricardo Tan', contact: '0928-888-9990', coordinates: '14.1030, 120.9780', landmark: 'Caloocan barangay hall', verifiedBy: null, verifiedAt: null, rejectionReason: null, possibleDuplicateOf: null },
    { id: '034', barangay: 'Caloocan', type: 'Search & Rescue', urgency: 'High', source: 'Bot', time: '10/24 15:00', status: 'under_review', description: 'Landslide reported near hillside residences. Three houses affected.', originalText: 'May landslide, tatlong bahay naapektuhan.', reporter: 'Patricia Lim', contact: '0935-222-3335', coordinates: '14.1010, 120.9800', landmark: 'Hillside Caloocan', verifiedBy: null, verifiedAt: null, rejectionReason: null, possibleDuplicateOf: null },

    // ── Santa Maria (centroid: 121.0022, 14.0903) ──
    { id: '016', barangay: 'Santa Maria', type: 'Medical', urgency: 'Low', source: 'Bot', time: '10/24 10:57', status: 'pending', description: 'Child with high fever, parents requesting transport to health center.', originalText: 'Anak ko may lagnat, paabot po sa health center.', reporter: 'Elena Cruz', contact: '0916-456-7890', coordinates: '14.0910, 121.0018', landmark: 'Health center', verifiedBy: null, verifiedAt: null, rejectionReason: null, possibleDuplicateOf: null },
    { id: '028', barangay: 'Santa Maria', type: 'Infrastructure', urgency: 'Moderate', source: 'Bot', time: '10/24 13:30', status: 'under_review', description: 'Barangay road eroded after continuous rain. Motorcycles can no longer pass.', originalText: 'Nasira ang daan, hindi na makadaan ang motor.', reporter: 'Marites Garcia', contact: '0929-000-1111', coordinates: '14.0895, 121.0028', landmark: 'Santa Maria road', verifiedBy: null, verifiedAt: null, rejectionReason: null, possibleDuplicateOf: null },
    { id: '035', barangay: 'Santa Maria', type: 'Food & Water', urgency: 'Low', source: 'Scraper', time: '10/24 15:15', status: 'pending', description: 'Request for hygiene kits and potable water for 30 families.', originalText: 'Kailangan ng hygiene kits at tubig para sa 30 pamilya.', reporter: 'Roberto Garcia', contact: '0936-444-5557', coordinates: '14.0900, 121.0030', landmark: 'Santa Maria tent area', verifiedBy: null, verifiedAt: null, rejectionReason: null, possibleDuplicateOf: null },

    // ── Banga (centroid: 121.0094, 14.0982) ──
    { id: '019', barangay: 'Banga', type: 'Medical', urgency: 'High', source: 'Bot', time: '10/24 11:15', status: 'verified', description: 'Pregnant woman in labor needing immediate transport to hospital.', originalText: 'Manganganak na po, kailangan ng ambulansya papuntang ospital.', reporter: 'Josefina Reyes', contact: '0920-111-2222', coordinates: '14.0985, 121.0090', landmark: 'Banga health center', verifiedBy: 'Officer Samson', verifiedAt: '10/24 11:20', rejectionReason: null, possibleDuplicateOf: null },
    { id: '023', barangay: 'Banga', type: 'Search & Rescue', urgency: 'Moderate', source: 'Scraper', time: '10/24 12:15', status: 'rejected', description: 'Trapped residents on rooftop after sudden rise in water level.', originalText: 'Nakaipit sa bubong, tumataas na ang tubig.', reporter: 'Rodelio Cruz', contact: '0924-888-9999', coordinates: '14.0975, 121.0100', landmark: 'Rooftop', verifiedBy: null, verifiedAt: null, rejectionReason: 'duplicate', possibleDuplicateOf: '021' },
    { id: '030', barangay: 'Banga', type: 'Food & Water', urgency: 'Moderate', source: 'Bot', time: '10/24 14:00', status: 'verified', description: '20 families in temporary shelter need hot meals and blankets.', originalText: '20 pamilya sa temporary shelter, kailangan ng pagkain at kumot.', reporter: 'Helena Mendoza', contact: '0931-444-5556', coordinates: '14.0990, 121.0080', landmark: 'Banga shelter', verifiedBy: 'Officer Samson', verifiedAt: '10/24 14:10', rejectionReason: null, possibleDuplicateOf: null },

    // ── Tranca (centroid: 121.0502, 14.1286) ──
    { id: '020', barangay: 'Tranca', type: 'Infrastructure', urgency: 'High', source: 'Scraper', time: '10/24 11:30', status: 'pending', description: 'Bridge collapsed due to heavy rainfall. Alternative route needed.', originalText: 'Bumagsak ang tulay, kailangan ng ibang daanan.', reporter: 'Miguel Santos', contact: '0921-333-4444', coordinates: '14.1280, 121.0505', landmark: 'Tranca bridge', verifiedBy: null, verifiedAt: null, rejectionReason: null, possibleDuplicateOf: null },
    { id: '024', barangay: 'Tranca', type: 'Medical', urgency: 'Low', source: 'Bot', time: '10/24 12:30', status: 'resolved', description: 'Senior citizen with hypertension needs maintenance medication.', originalText: 'Matandang may high blood, kailangan ng gamot.', reporter: 'Lourdes Reyes', contact: '0925-111-2223', coordinates: '14.1295, 121.0495', landmark: 'Barangay health station', verifiedBy: 'Officer Samson', verifiedAt: '10/24 12:35', rejectionReason: null, possibleDuplicateOf: null },
    { id: '031', barangay: 'Tranca', type: 'Search & Rescue', urgency: 'Low', source: 'Scraper', time: '10/24 14:15', status: 'rejected', description: 'Livestock stranded in flooded pasture.', originalText: 'Naiwan ang mga hayop sa baha, tulungan nyo po.', reporter: 'Domingo Reyes', contact: '0932-666-7778', coordinates: '14.1270, 121.0515', landmark: 'Pasture', verifiedBy: null, verifiedAt: null, rejectionReason: 'not_disaster_related', possibleDuplicateOf: null },

    // ── Sampaloc (centroid: 120.9656, 14.0899) ──
    { id: '021', barangay: 'Sampaloc', type: 'Search & Rescue', urgency: 'Moderate', source: 'Bot', time: '10/24 11:45', status: 'under_review', description: 'Family trapped on second floor due to flash flooding.', originalText: 'May pamilyang nakaipit sa second floor, baha na po.', reporter: 'Carmen Villanueva', contact: '0922-555-6666', coordinates: '14.0895, 120.9660', landmark: 'Residential area', verifiedBy: null, verifiedAt: null, rejectionReason: null, possibleDuplicateOf: null },
    { id: '025', barangay: 'Sampaloc', type: 'Infrastructure', urgency: 'High', source: 'Scraper', time: '10/24 12:45', status: 'pending', description: 'Power lines down near elementary school. Area needs immediate clearing.', originalText: 'May poste ng kuryenteng bumagsak malapit sa school.', reporter: 'Fernando Lim', contact: '0926-444-5555', coordinates: '14.0905, 120.9650', landmark: 'Sampaloc elementary', verifiedBy: null, verifiedAt: null, rejectionReason: null, possibleDuplicateOf: null },
    { id: '032', barangay: 'Sampaloc', type: 'Medical', urgency: 'Moderate', source: 'Bot', time: '10/24 14:30', status: 'resolved', description: 'Child with asthma attack, inhaler supply depleted.', originalText: 'Anak ko hinika, wala nang inhaler.', reporter: 'Cecilia Villanueva', contact: '0933-888-9991', coordinates: '14.0885, 120.9668', landmark: 'Sampaloc health center', verifiedBy: 'Officer Cruz', verifiedAt: '10/24 14:40', rejectionReason: null, possibleDuplicateOf: null },

    // ── Poblacion Barangay 2 (centroid: 121.0239, 14.0912) ──
    { id: '022', barangay: 'Poblacion Barangay 2', type: 'Food & Water', urgency: 'Moderate', source: 'Scraper', time: '10/24 12:00', status: 'verified', description: 'Evacuation center needs 50 food packs and clean drinking water.', originalText: 'Kailangan ng pagkain at tubig sa evacuation center, 50 pamilya.', reporter: 'Antonio dela Cruz', contact: '0923-777-8888', coordinates: '14.0910, 121.0242', landmark: 'Poblacion gym', verifiedBy: 'Officer Cruz', verifiedAt: '10/24 12:10', rejectionReason: null, possibleDuplicateOf: null },

    // ── Poblacion Barangay 3 (centroid: 121.022, 14.095) ──
    { id: '026', barangay: 'Poblacion Barangay 3', type: 'Search & Rescue', urgency: 'High', source: 'Bot', time: '10/24 13:00', status: 'verified', description: 'Vehicle swept away by flash flood near the bridge. Driver still inside.', originalText: 'May sasakyang inanod, may tao pa loob, kailangan ng rescue.', reporter: 'Gloria Santos', contact: '0927-666-7777', coordinates: '14.0948, 121.0222', landmark: 'Poblacion bridge', verifiedBy: 'Officer Cruz', verifiedAt: '10/24 13:05', rejectionReason: null, possibleDuplicateOf: null },

    // ── Poblacion Barangay 4 (centroid: 121.0226, 14.0908) ──
    { id: '033', barangay: 'Poblacion Barangay 4', type: 'Infrastructure', urgency: 'Low', source: 'Scraper', time: '10/24 14:45', status: 'pending', description: 'Drainage system clogged with debris causing minor flooding.', originalText: 'Barado ang kanal, bumabaha sa kalsada.', reporter: 'Alberto dela Cruz', contact: '0934-000-1112', coordinates: '14.0905, 121.0228', landmark: 'Main street', verifiedBy: null, verifiedAt: null, rejectionReason: null, possibleDuplicateOf: null },
];