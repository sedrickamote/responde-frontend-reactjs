import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}

export default function DatePicker({ value, onChange, placeholder = 'Select date' }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [tempDate, setTempDate] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 12 }, (_, i) => currentYear - 6 + i);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return (day + 6) % 7;
  };

  const toDateStr = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    setTempDate(toDateStr(viewDate.getFullYear(), viewDate.getMonth(), day));
  };

  const handleApply = () => {
    if (tempDate) onChange(tempDate);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempDate(value || null);
    setIsOpen(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (value) {
      const [y, m] = value.split('-').map(Number);
      setViewDate(new Date(y, m - 1, 1));
    } else {
      setViewDate(new Date());
    }
    setTempDate(value || null);
  };

  const formatDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}/${y}`;
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const cells = [];

    // Previous month filler days
    const prevDays = getDaysInMonth(year, month - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push(
        <div key={`prev-${i}`} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm text-slate-300">
          {prevDays - i}
        </div>
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = toDateStr(year, month, day);
      const isSelected = tempDate === dateStr || (!tempDate && value === dateStr);
      const todayStr = toDateStr(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
      const isToday = dateStr === todayStr;

      cells.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm flex items-center justify-center transition-colors
            ${isSelected 
              ? 'bg-indigo-600 text-white font-medium shadow-sm' 
              : isToday 
                ? 'text-indigo-600 font-semibold border border-indigo-200 hover:bg-indigo-50'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
        >
          {day}
        </button>
      );
    }

    // Next month filler days
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      cells.push(
        <div key={`next-${i}`} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm text-slate-300">
          {i}
        </div>
      );
    }

    return cells;
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:min-w-[150px] sm:w-auto"
      >
        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
        <span className={`truncate ${value ? 'text-slate-800' : 'text-slate-400'}`}>
          {value ? formatDisplay(value) : placeholder}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 sm:p-5 w-[280px] sm:w-[340px] max-w-[calc(100vw-2rem)] z-50">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div className="flex items-center gap-1">
              <button onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <ChevronLeft className="w-4 h-4 text-slate-500" />
              </button>
              <span className="text-sm font-semibold text-slate-800 min-w-[80px] sm:min-w-[90px] text-center">
                {months[viewDate.getMonth()]}
              </span>
              <button onClick={handleNextMonth} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <select
              value={viewDate.getFullYear()}
              onChange={(e) => setViewDate(new Date(parseInt(e.target.value), viewDate.getMonth(), 1))}
              className="px-2 sm:px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-y-1 gap-x-0.5 mb-1 sm:mb-2">
            {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
              <div key={d} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[10px] sm:text-xs font-semibold text-slate-500">
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-y-1 gap-x-0.5 mb-4 sm:mb-5">
            {renderCalendar()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 sm:pt-4 border-t border-slate-100">
            <button
              onClick={handleCancel}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}