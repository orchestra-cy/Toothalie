import React, { useEffect, useState, useMemo, useCallback } from "react";
import { fetchAppointmentDentist } from "@/API/Authenticated/appointment/FetchAppointment";

import {
  Users,
  Calendar,
  Activity,
  Clock,
  AlertCircle,
  Briefcase
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";

// --- Sub-Components ---
const StatCard = ({ title, value, icon: Icon, colorClass, bgClass, subtitle }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full group">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-extrabold text-slate-800 font-ceramon group-hover:text-cyan-700 transition-colors">{value}</h3>
      </div>
      <div className={`p-3.5 rounded-2xl ${bgClass} shadow-inner`}>
        <Icon className={`w-6 h-6 ${colorClass}`} />
      </div>
    </div>
    {subtitle && (
      <div className="mt-5 pt-4 border-t border-slate-50 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
        <p className="text-xs font-medium text-slate-500">{subtitle}</p>
      </div>
    )}
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/95 text-white text-xs p-4 rounded-xl shadow-xl border border-slate-700 backdrop-blur-md">
        <p className="font-bold mb-2 border-b border-slate-600 pb-2 text-slate-200">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="flex items-center gap-2 mt-1.5">
            <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color || entry.fill }}></span>
            <span className="text-slate-300 capitalize">{entry.name}:</span> 
            <span className="font-bold text-white text-sm">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// --- Main Component ---
interface MainProps {
  refreshTrigger?: number;
}

export function Main({ refreshTrigger }: MainProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Data Parsing Formatter
  const formatAppointment = useCallback((item: any) => {
    const appt = item.appointment || item; 
    const patient = item.patient || {};

    return {
      id: appt.appointment_id,
      date: appt.user_set_date, 
      createdDate: appt.appointment_date, 
      patientName: `${patient.first_name || ""} ${patient.last_name || ""}`.trim() || "Unknown Patient",
      patientId: patient.id,
      service: appt.service_name || "General Checkup",
      type: appt.appointment_type_id === 2 ? "Family" : "Individual",
      status: appt.status || "Pending",
      emergency: appt.emergency === 1,
      message: appt.message
    };
  }, []);

  // 2. Extracted Data Fetcher (So we can reuse it for silent background refetching)
  const refreshDashboardData = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setLoading(true);
      const data = await fetchAppointmentDentist();
      
      if (data?.status === "ok" && Array.isArray(data.appointments)) {
        setAppointments(data.appointments.map(formatAppointment));
      }
    } catch (err) {
      console.error("Dashboard Fetch Data Error:", err);
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  }, [formatAppointment]);

  // 3. Initial Load Mount
  useEffect(() => {
    refreshDashboardData(true);
  }, [refreshDashboardData]);

  // 4. Watch for Global WebSocket Triggers
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      // Trigger a silent background fetch (no loading screen)
      refreshDashboardData(false);
    }
  }, [refreshTrigger, refreshDashboardData]);

  // --- Derived Metrics & Chart Calculations ---
  const stats = useMemo(() => {
    const total = appointments.length;
    const uniquePatients = new Set(appointments.map(a => a.patientId)).size;
    const emergencies = appointments.filter(a => a.emergency).length;
    
    const todayStr = new Date().toISOString().split("T")[0];
    const todayCount = appointments.filter(a => a.date && a.date.startsWith(todayStr)).length;

    return { total, uniquePatients, emergencies, todayCount };
  }, [appointments]);

  const charts = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    appointments.forEach(a => {
        const s = a.status || "Unknown";
        statusCounts[s] = (statusCounts[s] || 0) + 1;
    });
    
    const pieData = Object.keys(statusCounts).map(key => {
        let color = "#94a3b8"; 
        if(key.toLowerCase().includes("approve")) color = "#0ea5e9"; 
        if(key.toLowerCase().includes("pend")) color = "#f59e0b"; 
        if(key.toLowerCase().includes("reject") || key.toLowerCase().includes("cancel")) color = "#f43f5e"; 
        if(key.toLowerCase().includes("complete")) color = "#14b8a6"; 
        return { name: key, value: statusCounts[key], color };
    });

    const timelineMap: Record<string, number> = {};
    appointments.forEach(a => {
        if(!a.date) return;
        const d = new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        timelineMap[d] = (timelineMap[d] || 0) + 1;
    });
    
    const areaData = Object.entries(timelineMap)
        .map(([name, value]) => ({ name, value }))
        .slice(-7);

    const serviceMap: Record<string, number> = {};
    appointments.forEach(a => {
        const s = a.service;
        serviceMap[s] = (serviceMap[s] || 0) + 1;
    });
    const barData = Object.entries(serviceMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a,b) => b.value - a.value)
        .slice(0, 5);

    return { pieData, areaData, barData };
  }, [appointments]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 font-ceramon">
        <div className="relative flex items-center justify-center w-20 h-20 mb-4 bg-cyan-50 rounded-full shadow-inner">
          <Activity className="h-10 w-10 text-cyan-500 animate-pulse stroke-[1.5]" />
          <div className="absolute inset-0 border-4 border-cyan-200 rounded-full animate-ping opacity-20"></div>
        </div>
        <p className="text-slate-500 font-medium tracking-wide">Syncing Real-Time Toothalie Records...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2 md:p-2 font-ceramon text-slate-900 relative">
      <div className="max-w-[100rem] mx-auto space-y-8">
        
        {/* --- 1. Stats Grid --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Appointments" value={stats.total} icon={Calendar} bgClass="bg-blue-50" colorClass="text-blue-500" subtitle="All time records" />
          <StatCard title="Unique Patients" value={stats.uniquePatients} icon={Users} bgClass="bg-cyan-50" colorClass="text-cyan-500" subtitle="Distinct individuals served" />
          <StatCard title="Scheduled Today" value={stats.todayCount} icon={Clock} bgClass="bg-teal-50" colorClass="text-teal-500" subtitle="Visits for today's date" />
          <StatCard title="Emergencies" value={stats.emergencies} icon={AlertCircle} bgClass="bg-rose-50" colorClass="text-rose-500" subtitle="High priority cases" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* --- Left Column: Area Chart & Table --- */}
          <div className="xl:col-span-2 space-y-8">
            <div className="bg-white p-7 rounded-3xl shadow-sm border border-slate-100/60">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Appointment Volume</h3>
                        <p className="text-slate-400 text-sm mt-1">Traffic based on active scheduled dates</p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                       <Activity className="w-5 h-5 text-slate-400" />
                    </div>
                </div>
                <div className="h-72 w-full">
                    {charts.areaData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={charts.areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 500}} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 500}} />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}/>
                                <Area type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={4} fillOpacity={1} fill="url(#colorApps)" activeDot={{ r: 6, fill: '#06b6d4', stroke: '#fff', strokeWidth: 2 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 text-sm italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                            Not enough data to display trend.
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100/60 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white">
                    <h3 className="text-xl font-bold text-slate-800">Recent Requests Log</h3>
                    <span className="text-xs font-bold bg-cyan-50 text-cyan-700 px-3 py-1.5 rounded-full border border-cyan-100">Last 5 Entries</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="px-6 py-4">Patient</th>
                                <th className="px-6 py-4">Requested Service</th>
                                <th className="px-6 py-4">Scheduled For</th>
                                <th className="px-6 py-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {appointments.slice(0, 5).map((appt) => (
                                <tr key={appt.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-sm shrink-0">
                                                {appt.patientName?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 group-hover:text-cyan-700 transition-colors">{appt.patientName}</p>
                                                {appt.emergency && (
                                                    <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5 bg-rose-50 w-fit px-1.5 py-0.5 rounded">
                                                        <AlertCircle size={10} strokeWidth={3}/> Emergency
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-slate-100 rounded-md text-slate-500">
                                              <Briefcase size={14} />
                                            </div>
                                            <span className="text-slate-600 font-medium">{appt.service}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 font-medium">
                                        <div className="flex items-center gap-2">
                                          <Calendar size={14} className="text-slate-400" />
                                          {appt.date ? new Date(appt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end">
                                            <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                                                appt.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                appt.status === 'Rejected' || appt.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                                appt.status === 'Completed' ? 'bg-teal-50 text-teal-600 border-teal-200' :
                                                'bg-amber-50 text-amber-600 border-amber-200'
                                            }`}>
                                                {appt.status}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {appointments.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-slate-400 italic bg-slate-50/30">
                                        No appointment records found yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>

          {/* --- Right Column: Donut & Bar Chart --- */}
          <div className="space-y-8">
            <div className="bg-white p-7 rounded-3xl shadow-sm border border-slate-100/60 flex flex-col items-center">
                <div className="self-start w-full border-b border-slate-50 pb-4 mb-6 flex justify-between items-center">
                   <h3 className="text-lg font-bold text-slate-800">Status Overview</h3>
                </div>
                
                <div className="relative w-full h-56">
                    {charts.pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={charts.pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none">
                                    {charts.pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 text-sm bg-slate-50/50 rounded-full border border-dashed border-slate-200 aspect-square mx-auto">No Data</div>
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-4xl font-extrabold text-slate-800">{stats.total}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Total</span>
                    </div>
                </div>

                <div className="w-full mt-8 space-y-3 px-2">
                    {charts.pieData.map((item) => (
                        <div key={item.name} className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded-lg transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></span>
                                <span className="text-slate-600 font-semibold capitalize">{item.name}</span>
                            </div>
                            <span className="font-bold text-slate-800">{item.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white p-7 rounded-3xl shadow-sm border border-slate-100/60">
                <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-50 pb-4">Top Services</h3>
                <div className="h-52 w-full">
                    {charts.barData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.barData} layout="vertical" barSize={16} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" width={110} tick={{fontSize: 12, fill: '#64748b', fontWeight: 500}} axisLine={false} tickLine={false} interval={0} />
                                <Tooltip cursor={{fill: '#f1f5f9', opacity: 0.5 }} content={<CustomTooltip />} />
                                <Bar dataKey="value" fill="#0ea5e9" radius={[0, 6, 6, 0]}>
                                   {charts.barData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={index === 0 ? '#06b6d4' : '#bae6fd'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 text-sm bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                          No Services Data
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