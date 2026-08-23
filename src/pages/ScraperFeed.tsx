import { useState } from 'react';
import { Filter, Globe, MessageCircle, AlertTriangle, MapPin, Clock, CheckCircle, XCircle, Brain, Users, ExternalLink } from 'lucide-react';
import DatePicker from '../components/DatePicker';

interface ScrapedPost {
  id: string;
  source: 'Facebook Page' | 'Facebook Comment' | 'Group Post';
  author: string;
  avatar: string;
  rawText: string;
  barangay: string;
  type: 'Search & Rescue' | 'Medical' | 'Food & Water' | 'Infrastructure';
  urgency: 'High' | 'Moderate' | 'Low';
  status: 'New' | 'Verified' | 'Flagged' | 'Resolved';
  timestamp: string;
  confidence: number;
  extractedEntities: {
    location: string;
    contact?: string;
    peopleAffected?: number;
    needs?: string[];
  };
}

const samplePosts: ScrapedPost[] = [
  {
    id: 'SC-001',
    source: 'Facebook Comment',
    author: 'Maria Santos',
    avatar: 'M',
    rawText: 'Tulungan nyo po kami dito sa Leynes, may matanda po na hindi makahinga. Nasa may basketball court po kami. Wala pong magawa yung barangay health worker.',
    barangay: 'Leynes',
    type: 'Medical',
    urgency: 'High',
    status: 'New',
    timestamp: '10/24 14:32',
    confidence: 94,
    extractedEntities: {
      location: 'Leynes basketball court',
      peopleAffected: 1,
      needs: ['Medical assistance', 'Oxygen support'],
    },
  },
  {
    id: 'SC-002',
    source: 'Facebook Page',
    author: 'Juan Dela Cruz',
    avatar: 'J',
    rawText: 'Pa wash out po kay Juan Dela Cruz, baha na po dito sa Poblacion. Hanggang bewang na po yung tubig sa kalsada.',
    barangay: 'Poblacion',
    type: 'Search & Rescue',
    urgency: 'High',
    status: 'Verified',
    timestamp: '10/24 13:15',
    confidence: 89,
    extractedEntities: {
      location: 'Poblacion main road',
      peopleAffected: 1,
      needs: ['Evacuation', 'Rescue boat'],
    },
  },
  {
    id: 'SC-003',
    source: 'Group Post',
    author: 'Elena Reyes',
    avatar: 'E',
    rawText: 'Kailangan namin ng tulong dito sa Sampaloc. Wala na pong makain yung mga bata. 3 araw na pong walang relief.',
    barangay: 'Sampaloc',
    type: 'Food & Water',
    urgency: 'Moderate',
    status: 'New',
    timestamp: '10/24 12:08',
    confidence: 91,
    extractedEntities: {
      location: 'Sampaloc',
      peopleAffected: 5,
      needs: ['Food packs', 'Clean water'],
    },
  },
  {
    id: 'SC-004',
    source: 'Facebook Comment',
    author: 'Pedro Lim',
    avatar: 'P',
    rawText: 'May gumuhong lupa dito sa Cawit. Hindi na po madadaanan yung daan papuntang bayan. Delikado po lalo na gabi.',
    barangay: 'Cawit',
    type: 'Infrastructure',
    urgency: 'Moderate',
    status: 'Flagged',
    timestamp: '10/24 11:45',
    confidence: 87,
    extractedEntities: {
      location: 'Cawit access road',
      needs: ['Road clearing', 'Heavy equipment'],
    },
  },
  {
    id: 'SC-005',
    source: 'Facebook Page',
    author: 'Ana Garcia',
    avatar: 'A',
    rawText: 'Nagpapasalamat po kami sa MDRRMO, natulungan na po kami dito sa Banga. Okay na po kami ngayon.',
    barangay: 'Banga',
    type: 'Medical',
    urgency: 'Low',
    status: 'Resolved',
    timestamp: '10/24 09:20',
    confidence: 82,
    extractedEntities: {
      location: 'Banga',
      needs: ['Follow-up check'],
    },
  },
  {
    id: 'SC-006',
    source: 'Group Post',
    author: 'Carlos Mendoza',
    avatar: 'C',
    rawText: 'Tulungan nyo po ako, hindi ko alam kung pano ko uubusin yung pera ko — charot lang po, pero seryoso may baha sa San Isidro.',
    barangay: 'San Isidro',
    type: 'Search & Rescue',
    urgency: 'High',
    status: 'Flagged',
    timestamp: '10/24 08:55',
    confidence: 76,
    extractedEntities: {
      location: 'San Isidro',
      needs: ['Evacuation'],
    },
  },
];

export default function ScraperFeed() {
  const [posts] = useState<ScrapedPost[]>(samplePosts);
  const [selectedId, setSelectedId] = useState<string>('SC-001');
   const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const selectedPost = posts.find((p) => p.id === selectedId);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'High': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case 'Moderate': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
      case 'Low': return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
      default: return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Verified': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Flagged': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Resolved': return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
      default: return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'Facebook Page': return <ExternalLink className="w-3.5 h-3.5" />;
      case 'Facebook Comment': return <MessageCircle className="w-3.5 h-3.5" />;
      case 'Group Post': return <Users className="w-3.5 h-3.5" />;
      default: return <Globe className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-5 h-full flex flex-col">

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filters:</span>
          </div>

          <select className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Barangays</option>
            <option>Leynes</option>
            <option>Poblacion</option>
            <option>Sampaloc</option>
            <option>Cawit</option>
            <option>Banga</option>
            <option>San Isidro</option>
          </select>

          <select className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Types</option>
            <option>Search & Rescue</option>
            <option>Medical</option>
            <option>Food & Water</option>
            <option>Infrastructure</option>
          </select>

          <select className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Urgency</option>
            <option>High</option>
            <option>Moderate</option>
            <option>Low</option>
          </select>

          <select className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Status</option>
            <option>New</option>
            <option>Verified</option>
            <option>Flagged</option>
            <option>Resolved</option>
          </select>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 lg:ml-auto w-full lg:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">From:</span>
              <DatePicker value={fromDate} onChange={setFromDate} placeholder="Select Date" />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
               <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">To:</span>
              <DatePicker value={toDate} onChange={setToDate} placeholder="Select Date" />
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="flex-1 grid grid-cols-12 gap-5 min-h-0">

        {/* LEFT: Post List */}
        <div className="col-span-12 lg:col-span-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Scraped Posts</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {posts.map((post) => (
              <button
                key={post.id}
                onClick={() => setSelectedId(post.id)}
                className={`w-full text-left p-4 border-b border-slate-50 dark:border-slate-700/50 transition-all ${
                  selectedId === post.id
                    ? 'bg-blue-50/50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
                    : 'border-l-4 border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-700/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-sm text-slate-600 dark:text-slate-300 shrink-0">
                    {post.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Top row */}
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                        {post.author}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                        {post.timestamp}
                      </span>
                    </div>
                    {/* Source badge */}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                        {getSourceIcon(post.source)}
                        {post.source}
                      </span>
                    </div>
                    {/* Text snippet */}
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                      {post.rawText}
                    </p>
                    {/* Badges row */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${getUrgencyColor(post.urgency)}`}>
                        {post.urgency}
                      </span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(post.status)}`}>
                        {post.status}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                        <Brain className="w-3 h-3" />
                        {post.confidence}%
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Post Detail */}
        <div className="col-span-12 lg:col-span-7 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden">
          {selectedPost ? (
            <>
              {/* Detail Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                      {selectedPost.avatar}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100">{selectedPost.author}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          {getSourceIcon(selectedPost.source)}
                          {selectedPost.source}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {selectedPost.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUrgencyColor(selectedPost.urgency)}`}>
                      {selectedPost.urgency}
                    </span>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedPost.status)}`}>
                      {selectedPost.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Raw Text */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-700">
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Original Post
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-100 dark:border-slate-700">
                  &ldquo;{selectedPost.rawText}&rdquo;
                </p>
              </div>

              {/* NLP Extraction */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-blue-500" />
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    NLP Extraction
                  </h4>
                  <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
                    Confidence: {selectedPost.confidence}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      Location
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {selectedPost.extractedEntities.location}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Incident Type
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {selectedPost.type}
                    </p>
                  </div>
                  {selectedPost.extractedEntities.peopleAffected && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                        People Affected
                      </div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {selectedPost.extractedEntities.peopleAffected}
                      </p>
                    </div>
                  )}
                  {selectedPost.extractedEntities.needs && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                        Identified Needs
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {selectedPost.extractedEntities.needs.map((need, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
                            {need}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="p-5 mt-auto">
                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Verify
                  </button>
                  <button className="px-4 py-2 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Flag
                  </button>
                  <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ml-auto">
                    <XCircle className="w-4 h-4" />
                    Dismiss
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500">
              Select a post to view details
            </div>
          )}
        </div>

      </div>
    </div>
  );
}