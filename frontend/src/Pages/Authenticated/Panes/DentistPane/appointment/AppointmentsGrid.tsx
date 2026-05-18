import { Calendar, Clock, Eye, Mail, ChevronRight } from "lucide-react";

import { getAppointmentTypeConfig, getStatusConfig } from "./config";
import type { AppointmentItem } from "./types";

interface AppointmentsGridProps {
  appointments: AppointmentItem[];
  onView: (appointment: AppointmentItem) => void;
}

export default function AppointmentsGrid({ appointments, onView }: AppointmentsGridProps) {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {appointments.map((appointment) => {
        const statusCfg = getStatusConfig(appointment.status);
        const typeCfg = getAppointmentTypeConfig(appointment.appointment_type_id);
        const TypeIcon = typeCfg.icon;

        return (
          <div
            key={appointment.id}
            onClick={() => onView(appointment)}
            className={`group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 hover:border-blue-100 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer ${
              appointment.emergency ? "border-l-4 border-l-red-400" : ""
            }`}
          >
            {/* Minimalist Teeth Background Icon */}
            <svg 
              className="absolute -bottom-4 -right-4 w-32 h-32 text-gray-900 opacity-[0.03] rotate-[-15deg] pointer-events-none transition-transform duration-500 group-hover:scale-110 group-hover:opacity-[0.05]" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M7 2c-1.5 0-3 1.5-3 3 0 1.5.5 2.5 1 4 .5 1.5.5 3-.5 5-1 2-1 4 0 6 1 2 3 2 4 0 1-2 1-4 0-5-.5-1-.5-2.5 0-4s1.5-2 1.5-2c0 0 1 .5 1.5 2s.5 3 0 4c-1 1-1 3 0 5 1 2 3 2 4 0 1-2 0-4-1-6-1-2-1-3.5-.5-5 .5-1.5 1-2.5 1-4 0-1.5-1.5-3-3-3-1.5 0-3 1-4 2-1-1-2.5-2-4-2z" />
            </svg>

            {/* Emergency Indicator Dot (Optional addition for clarity) */}
            {!!appointment.emergency && (
              <span className="absolute top-5 right-5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}

            <div className="p-5 flex flex-col h-full relative z-10">
              {/* Header: Tags */}
              <div className="flex items-center gap-2 mb-4">
                <div
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold ${typeCfg.bg} ${typeCfg.color}`}
                >
                  <TypeIcon className="h-3 w-3" />
                  {typeCfg.name}
                </div>
                <span
                  className={`px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold border ${statusCfg.borderColor} ${statusCfg.badge} bg-transparent`}
                >
                  {appointment.status}
                </span>
              </div>

              {/* Body: Patient Info */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 text-lg tracking-tight truncate mb-1">
                  {appointment.patient_name}
                </h3>
                <div className="flex items-center text-xs text-gray-400 gap-2 truncate font-light">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate">{appointment.email || "No email on file"}</span>
                </div>
              </div>

              {/* Footer: Date & Time */}
              <div className="mt-auto flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <span className="font-medium">{appointment.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{appointment.time_slot || "TBD"}</span>
                  </div>
                </div>

                {/* Minimalist View Button Line */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-400 group-hover:text-blue-600 transition-colors">
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    View Details
                  </span>
                  <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}