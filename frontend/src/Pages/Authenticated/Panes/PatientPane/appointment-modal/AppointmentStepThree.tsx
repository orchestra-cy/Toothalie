import React,{useEffect} from "react";
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  Stethoscope,
  User,
  Users,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

type AppointmentType = {
  id: number;
  appointment_name: string;
};

type SelectService = {
  serviceTypeName: string;
  serviceID: string | number | null;
  serviceName: string;
};

type AppointmentStepThreeProps = {
  selectService: SelectService;
  selectedDentist: any;
  formatServiceTypeName: (typeName: string) => string;
  date?: Date;
  pickTime: string;
  pickDay: string;
  isEmergency: boolean;
  setIsEmergency: (value: boolean) => void;
  appointmentTypes: AppointmentType[];
  selectedAppointmentTypeId: number | null;
  setSelectedAppointmentTypeId: (value: number) => void;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  setContactFirstName: (value: string) => void;
  setContactLastName: (value: string) => void;
  setContactEmail: (value: string) => void;
  message: string;
  setMessage: (value: string) => void;
  acknowledge: boolean;
  setAcknowledge: (value: boolean) => void;
  error: string | null;
};

export default function AppointmentStepThree({
  selectService,
  selectedDentist,
  formatServiceTypeName,
  date,
  pickTime,
  pickDay,
  isEmergency,
  setIsEmergency,
  appointmentTypes,
  selectedAppointmentTypeId,
  setSelectedAppointmentTypeId,
  contactFirstName,
  contactLastName,
  contactEmail,
  setContactFirstName,
  setContactLastName,
  setContactEmail,
  message,
  setMessage,
  acknowledge,
  setAcknowledge,
  error,
}: AppointmentStepThreeProps) {
  const ToothalieUser =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("ToothalieUser") || "null")
      : null;
  useEffect(() => {
    if (ToothalieUser) {
      setContactFirstName(ToothalieUser.firstName ?? "");
      setContactLastName(ToothalieUser.lastName ?? "N/A");
      setContactEmail(ToothalieUser.email ?? "");
    }
  }, []);
  return (
    <div className="p-6 space-y-6">
      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold">
              Appointment summary
            </h4>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3">
                <Stethoscope className="w-4 h-4 text-blue-600" />
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">
                    {selectService.serviceName}
                  </span>{" "}
                  <span className="text-slate-400">
                    ({formatServiceTypeName(selectService.serviceTypeName)})
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-blue-600" />
                <p className="text-sm text-slate-700">
                  {selectedDentist
                    ? `Dr. ${selectedDentist.first_name} ${selectedDentist.last_name}`
                    : "Dentist not selected"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-4 h-4 text-blue-600" />
                <p className="text-sm text-slate-700">
                  {date ? date.toLocaleDateString() : "Date not selected"} •{" "}
                  {pickTime || "Time not selected"} ({pickDay || "Day"})
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3">
              Appointment preferences
            </h4>
            <div className="grid gap-3">
              <label
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  isEmergency
                    ? "bg-rose-50 border-rose-200 ring-1 ring-rose-200"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <Checkbox
                  id="emergency"
                  checked={isEmergency}
                  onCheckedChange={(c) => setIsEmergency(c === true)}
                  className="data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
                />
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <AlertTriangle
                    size={16}
                    className={isEmergency ? "text-rose-600" : "text-slate-400"}
                  />
                  Emergency
                </div>
              </label>

              {appointmentTypes.map((type) => (
                <label
                  key={type.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedAppointmentTypeId === type.id
                      ? "bg-blue-50 border-blue-200 ring-1 ring-blue-200"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="appointmentType"
                    checked={selectedAppointmentTypeId === type.id}
                    onChange={() => setSelectedAppointmentTypeId(type.id)}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Users
                      size={16}
                      className={
                        selectedAppointmentTypeId === type.id
                          ? "text-blue-600"
                          : "text-slate-400"
                      }
                    />
                    {type.appointment_name}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 font-ceramon">
            Please enter your details
          </h3>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="First name*"
              value={contactFirstName}
              onChange={(e) => setContactFirstName(e.target.value)}
              readOnly={!!ToothalieUser}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Last name*"
              value={contactLastName}
              onChange={(e) => setContactLastName(e.target.value)}
              readOnly={!!ToothalieUser}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Email*"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              readOnly={!!ToothalieUser}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <textarea
              placeholder="Optional message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[250px]"
            />
          </div>

          {/*<label className="flex items-center gap-3 text-sm text-slate-500">
            <Checkbox
              id="acknowledge"
              checked={acknowledge}
              onCheckedChange={(c) => setAcknowledge(c === true)}
              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            We are available and will respond within a day.
          </label>*/}

          {error && (
            <div className="rounded-xl border border-rose-100 bg-rose-50 text-rose-700 px-4 py-3 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
