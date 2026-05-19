import React, { useState, useEffect } from "react";
import { fetchHistory } from "@/API/Authenticated/appointment/FetchHistory";
import { 
  Clock, 
  Plus, 
  Edit3, 
  XCircle, 
  Info, 
  User, 
  Calendar, 
  AlertCircle, 
  Activity, 
  ChevronDown, 
  ChevronUp,
  History,
  ArrowRight
} from "lucide-react";
import GetUserInfo from "@/API/Authenticated/GetUserInfoAPI";

// --- Configuration Helper ---
const getActionConfig = (action: string) => {
  const normalized = action?.toLowerCase() || '';
  if (normalized.includes('create')) {
    return {
      icon: Plus,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-200",
      ring: "ring-indigo-100",
      label: "Appointment Created",
    };
  }
  if (normalized.includes('update')) {
    return {
      icon: Edit3,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      ring: "ring-amber-100",
      label: "Details Updated",
    };
  }
  if (normalized.includes('cancel')) {
    return {
      icon: XCircle,
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-200",
      ring: "ring-rose-100",
      label: "Appointment Cancelled",
    };
  }
  return {
    icon: Info,
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
    ring: "ring-slate-100",
    label: "System Activity",
  };
};

// --- Single Timeline Item Component ---
function HistoryItem({ log, isLast }: { log: any; isLast: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const config = getActionConfig(log.action);
  const Icon = config.icon;
  
  // Safe JSON Parse
  let snapshot = {};
  try {
    snapshot = log.snapshot ? JSON.parse(log.snapshot) : {};
  } catch (e) { console.error("JSON Parse Error", e); }

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    };
  };

  const { date, time } = formatDate(log.logged_at);

  return (
    <div className="relative pl-8 sm:pl-10 group">
      {/* Timeline Line */}
      {!isLast && (
        <div
          className="absolute left-[11px] sm:left-[15px] top-8 bottom-[-32px] w-0.5 group-hover:bg-slate-300 transition-colors"
          aria-hidden="true"
        />
      )}

      {/* Timeline Dot */}
      <div className={`absolute left-0 sm:left-1 top-1.5 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 ${config.bg} ${config.color}`}>
        <div className={`w-2 h-2 rounded-full ${config.bg.replace('bg-', 'bg-')}-400`}></div>
      </div>

      {/* Card */}
      <div className={`mb-8 bg-white rounded-2xl border ${config.border} shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden`}>
        
        {/* Card Header */}
        <div 
          className="p-5 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${config.bg} ${config.color}`}>
                <Icon size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-ceramon leading-tight">
                  {config.label}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  ID: <span className="font-mono">{log.appointment_id}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 self-start sm:self-auto">
               <Calendar size={12} /> {date}
               <span className="w-px h-3 bg-slate-300"></span>
               <Clock size={12} /> {time}
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
             <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    log.actor_type === 'PATIENT' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                    <User size={10} /> {log.actor_type}
                </span>
                <span className="text-sm text-slate-600 font-medium">
                    {log.actor_type === 'PATIENT' 
                        ? `${log.patient_first_name || ''} ${log.patient_last_name || ''}` 
                        : `Dr. ${log.dentist_first_name || ''} ${log.dentist_last_name || ''}`
                    }
                </span>
             </div>
             
             {/* Expand Arrow */}
             <button className={`p-1 rounded-full text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-slate-100' : ''}`}>
                <ChevronDown size={18} />
             </button>
          </div>
        </div>

        {/* Expandable Details (Snapshot) */}
        <div 
            className={`grid transition-all duration-300 ease-in-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
        >
            <div className="overflow-hidden">
                <div className="px-5 pb-5 pt-0">
                    <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 text-sm">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Activity size={12} /> Data Snapshot
                        </h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8">
                            <div className="flex justify-between border-b border-slate-200/60 pb-1">
                                <span className="text-slate-500">Status</span>
                                <span className="font-medium text-slate-800">{snapshot.status || "—"}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200/60 pb-1">
                                <span className="text-slate-500">Scheduled Date</span>
                                <span className="font-medium text-slate-800">
                                    {snapshot.user_set_date ? new Date(snapshot.user_set_date).toLocaleDateString() : "—"}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200/60 pb-1">
                                <span className="text-slate-500">Dentist ID</span>
                                <span className="font-medium text-slate-800">{snapshot.dentist_id || "—"}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200/60 pb-1">
                                <span className="text-slate-500">Emergency</span>
                                {snapshot.emergency == 1 ? (
                                    <span className="flex items-center gap-1 text-rose-600 font-bold">
                                        <AlertCircle size={12} /> Yes
                                    </span>
                                ) : (
                                    <span className="text-slate-800 font-medium">No</span>
                                )}
                            </div>
                        </div>
                        
                        {log.message && (
                            <div className="mt-4 pt-3 border-t border-slate-200">
                                <span className="text-xs text-slate-400 block mb-1">System Message</span>
                                <p className="text-slate-700 italic">"{log.message}"</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---
export default function HistoryPane() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await GetUserInfo();
        const roleRaw = user?.user?.roles;
        const role = Array.isArray(roleRaw) ? roleRaw[0] : roleRaw;
        
        // Ensure safe role parsing
        const normalizedRole = role ? role.replace(/[\[\]"]+/g, '').replace('ROLE_', '') : 'USER'; 

        const response = await fetchHistory(
          user.user.id,
          normalizedRole
        );
        console.log(response)
        
        if (response?.status === "ok") {
          setHistory(response.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 lg:p-10 font-sans text-slate-900">
      <div className="max-w-12xl mx-auto">
        
        

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 font-ceramon">
            <div className="relative flex items-center justify-center w-20 h-20 mb-4 bg-cyan-50 rounded-full shadow-inner">
              <Activity className="h-10 w-10 text-cyan-500 animate-pulse stroke-[1.5]" />
              <div className="absolute inset-0 border-4 border-cyan-200 rounded-full animate-ping opacity-20"></div>
            </div>
            <p className="text-slate-500 font-medium tracking-wide">Loading Timeline...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && history.length === 0 && (
          <div className=" rounded-3xl shadow-sm border border-dashed border-slate-200 p-16 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 font-ceramon">No History Yet</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              Once you create, update, or cancel appointments, the detailed logs will appear here.
            </p>
          </div>
        )}

        {/* History Feed */}
        {!loading && history.length > 0 && (
          <div className="relative">
             {/* Container specifically for timeline logic */}
             <div className="space-y-0">
                {history.map((log, index) => (
                  <HistoryItem
                    key={log.id || index}
                    log={log}
                    isLast={index === history.length - 1}
                  />
                ))}
             </div>
             
             {/* End of timeline indicator */}
             <div className="flex items-center gap-3 pl-[3px] sm:pl-[7px] mt-2 opacity-50">
                <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Start of Records</span>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}