"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Calendar, Loader2, Search, XCircle, RefreshCw, Users, Activity } from "lucide-react";

import { fetchAppointmentDentist } from "@/API/Authenticated/appointment/FetchAppointment";
import { UpdateDentistAppointment } from "@/API/Authenticated/appointment/EditAppointmentAPI";
import { getReminder, saveReminder } from "@/API/Authenticated/Dentist/Reminder";
import Alert from "@/components/_myComp/Alerts";

import AppointmentModal from "./appointment/AppointmentModal";
import AppointmentsGrid from "./appointment/AppointmentsGrid";
import {
  TIME_INTERVAL_MINUTES,
  formatMinutesAsTime,
  generateTimeOptions,
  getLocalDateString,
  timeToMinutes,
} from "./appointment/config";
import type {
  AlertState,
  AppointmentItem,
  ModalMode,
  ReminderDay,
  ReminderSlot,
} from "./appointment/types";

const createEmptyReminderDay = (): ReminderDay => ({
  id: crypto.randomUUID(),
  date: "",
  slots: [{ startTime: "", endTime: "", message: "" }],
});

interface AppointmentsProps {
  refreshTrigger?: number;
}

export default function Appointments({ refreshTrigger }: AppointmentsProps) {
  const [appointmentsData, setAppointmentsData] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewAppointment, setViewAppointment] = useState<AppointmentItem | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>("details");
  const [isUpdating, setIsUpdating] = useState(false);

  const [reminderSchedule, setReminderSchedule] = useState<ReminderDay[]>([]);
  const [isSavingReminder, setIsSavingReminder] = useState(false);
  const [todayDate] = useState(getLocalDateString());
  const [timeOptions] = useState(generateTimeOptions());
  const [searchQuery, setSearchQuery] = useState("");

  const [alert, setAlert] = useState<AlertState>({
    show: false,
    type: "info",
    title: "",
    message: "",
  });

  const filteredAppointments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return appointmentsData;

    return appointmentsData.filter((appointment) =>
      appointment.patient_name.toLowerCase().includes(query)
    );
  }, [appointmentsData, searchQuery]);

  // --- 1. Extracted Data Fetcher for Background Refreshing ---
  const refreshAppointmentsData = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setLoading(true);
      setError(null);

      const data = await fetchAppointmentDentist();
      if (data?.status === "ok" && Array.isArray(data.appointments)) {
        const formatted: AppointmentItem[] = data.appointments.map((item: any) => {
          const appt = item.appointment;
          const patient = item.patient || {};
          const schedule = item.schedule || {};

          return {
            id: String(appt.id),
            date: appt.user_set_date,
            time: appt.appointment_date?.split(" ")[1],
            day_of_week: schedule.day_of_week,
            time_slot: schedule.time_slot,
            status: appt.status || "Pending",
            appointment_type_id: Number(appt.appointment_type_id) || 1,
            patient_name:
              patient.first_name && patient.last_name
                ? `${patient.first_name} ${patient.last_name}`
                : "Unknown Patient",
            email: patient.email,
            phone: patient.phone || "Not provided",
            emergency: appt.emergency,
            message: appt.message,
            created_at: appt.created_at,
            appointment_date: appt.appointment_date,
            service_name: appt.service_name,
          };
        });

        setAppointmentsData(formatted);
      } else {
        setAppointmentsData([]);
      }
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setError("Failed to load appointments. Please check your connection and try again.");
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  }, []);

  // --- 2. Initial Fetch on Mount ---
  useEffect(() => {
    refreshAppointmentsData(true);
  }, [refreshAppointmentsData]);

  // --- 3. Watch for Global WebSocket Triggers passed from UserDashboard.tsx ---
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      // Trigger a silent background fetch (no loading screen)
      refreshAppointmentsData(false);
    }
  }, [refreshTrigger, refreshAppointmentsData]);

  const handleMode = async (mode: ModalMode) => {
    if (!viewAppointment) return;

    try {
      const reminderResponse = await getReminder(viewAppointment.id);

      if (reminderResponse.status === "success" && Array.isArray(reminderResponse.data)) {
        const formattedSchedule: ReminderDay[] = reminderResponse.data.map((day: any) => ({
          id: String(day.id ?? crypto.randomUUID()),
          date: day.date || "",
          slots: Array.isArray(day.slots)
            ? day.slots.map((slot: any) => ({
                startTime: slot.startTime || "",
                endTime: slot.endTime || "",
                message: slot.message || "",
              }))
            : [{ startTime: "", endTime: "", message: "" }],
        }));

        setReminderSchedule(formattedSchedule.length ? formattedSchedule : [createEmptyReminderDay()]);
      } else {
        setReminderSchedule([createEmptyReminderDay()]);
      }

      setModalMode(mode);
    } catch (modeError) {
      console.error("Failed to fetch reminders:", modeError);
      setAlert({
        show: true,
        type: "error",
        title: "Load Failed",
        message: "Failed to load reminders. Please try again.",
      });
    }
  };

  const handleView = (appointment: AppointmentItem) => {
    setModalMode("details");
    setReminderSchedule([createEmptyReminderDay()]);
    setViewAppointment(appointment);
  };

  const closeViewModal = () => {
    setViewAppointment(null);
    setModalMode("details");
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      setIsUpdating(true);
      const update = await UpdateDentistAppointment(id, newStatus);

      if (update.status === "success") {
        setAlert({
          show: true,
          type: "success",
          title: "Status Updated",
          message: `Appointment status successfully changed to ${newStatus}.`,
        });

        setAppointmentsData((prev) =>
          prev.map((appointment) =>
            appointment.id === id ? { ...appointment, status: newStatus } : appointment
          )
        );

        setViewAppointment((prev) => (prev ? { ...prev, status: newStatus } : prev));
      }
    } catch (updateError) {
      console.error("Error updating appointment:", updateError);
      setAlert({
        show: true,
        type: "error",
        title: "Update Failed",
        message: "Could not update the appointment. Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const addDay = () => setReminderSchedule((prev) => [...prev, createEmptyReminderDay()]);
  const removeDay = (dayId: string) => setReminderSchedule((prev) => prev.filter((day) => day.id !== dayId));

  const updateDayDate = (dayId: string, newDate: string) => {
    if (newDate && newDate < todayDate) {
      setAlert({
        show: true,
        type: "warning",
        title: "Invalid Date",
        message: "You cannot select a past date for a reminder.",
      });
      return;
    }
    setReminderSchedule((prev) => prev.map((day) => (day.id === dayId ? { ...day, date: newDate } : day)));
  };

  const addTimeSlot = (dayId: string) => {
    setReminderSchedule((prev) =>
      prev.map((day) =>
        day.id === dayId ? { ...day, slots: [...day.slots, { startTime: "", endTime: "", message: "" }] } : day
      )
    );
  };

  const removeTimeSlot = (dayId: string, slotIndex: number) => {
    setReminderSchedule((prev) =>
      prev.map((day) =>
        day.id === dayId ? { ...day, slots: day.slots.filter((_, index) => index !== slotIndex) } : day
      )
    );
  };

  const updateTimeSlot = (dayId: string, slotIndex: number, field: keyof ReminderSlot, value: string) => {
    setReminderSchedule((prev) =>
      prev.map((day) => {
        if (day.id !== dayId) return day;

        const updatedSlots = [...day.slots];
        const nextSlot = { ...updatedSlots[slotIndex], [field]: value };

        if (field === "startTime" && nextSlot.endTime) {
          const startMinutes = timeToMinutes(nextSlot.startTime);
          const endMinutes = timeToMinutes(nextSlot.endTime);
          if (endMinutes <= startMinutes) {
            const nextEndMinutes = startMinutes + TIME_INTERVAL_MINUTES;
            nextSlot.endTime = nextEndMinutes < 24 * 60 ? formatMinutesAsTime(nextEndMinutes) : "";
          }
        }

        updatedSlots[slotIndex] = nextSlot;
        return { ...day, slots: updatedSlots };
      })
    );
  };

  const handleSaveReminder = async () => {
    if (!viewAppointment) return;

    const isValid = reminderSchedule.every(
      (day) => day.date && day.slots.every((slot) => slot.startTime && slot.endTime && slot.message)
    );

    const hasPastDate = reminderSchedule.some((day) => day.date < todayDate);
    const hasInvalidRange = reminderSchedule.some((day) =>
      day.slots.some(
        (slot) => !!slot.startTime && !!slot.endTime && timeToMinutes(slot.endTime) <= timeToMinutes(slot.startTime)
      )
    );

    if (!isValid || reminderSchedule.length === 0) {
      setAlert({ show: true, type: "error", title: "Incomplete Details", message: "Please fill out all reminder fields." });
      return;
    }
    if (hasPastDate) {
      setAlert({ show: true, type: "error", title: "Invalid Date", message: "One or more reminder dates are in the past." });
      return;
    }
    if (hasInvalidRange) {
      setAlert({ show: true, type: "error", title: "Invalid Time", message: "End time must be after start time." });
      return;
    }

    try {
      setIsSavingReminder(true);
      await saveReminder(reminderSchedule, viewAppointment.id);

      setAlert({ show: true, type: "success", title: "Reminder Scheduled", message: "The reminder has been set successfully." });
      setModalMode("details");
    } catch (saveError) {
      console.error(saveError);
      setAlert({ show: true, type: "error", title: "Error Saving", message: "Failed to schedule the reminder. Please try again." });
    } finally {
      setIsSavingReminder(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] w-full bg-slate-50/50 rounded-xl">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <span className="text-slate-600 font-medium tracking-wide">Retrieving patient schedule...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] px-4 w-full">
        <div className="bg-white border border-red-100 shadow-sm rounded-2xl p-8 max-w-md text-center">
          <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h3>
          <p className="text-gray-500 mb-8 leading-relaxed">{error}</p>
          <button
            onClick={() => refreshAppointmentsData(true)}
            className="w-full flex justify-center items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!appointmentsData.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4 bg-white rounded-2xl border border-gray-100 shadow-sm m-6">
        <div className="bg-blue-50/50 rounded-full p-6 mb-6">
          <Calendar className="h-12 w-12 text-blue-400" strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Appointments Scheduled</h3>
        <p className="text-gray-500 max-w-sm leading-relaxed">
          Your schedule is currently clear. Incoming patient bookings will automatically appear here.
        </p>
        <button
          onClick={() => refreshAppointmentsData(true)}
          className="mt-8 flex items-center gap-2 px-5 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Schedule
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="p-2 md:p-4 max-w-[1400px] mx-auto space-y-8">

        {/* Controls Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium border border-blue-100/50">
              <Users className="h-4 w-4" />
              {searchQuery.trim()
                ? `Showing ${filteredAppointments.length} of ${appointmentsData.length}`
                : `Total Appointments: ${appointmentsData.length}`}
            </div>
            
            <button
              onClick={() => refreshAppointmentsData(true)}
              className="group flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
              Reload
            </button>
          </div>

          <div className="relative w-full lg:w-96">
            <Search className="h-4 w-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by patient name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50/50 text-sm text-gray-700 placeholder:text-gray-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Content Section */}
        {filteredAppointments.length ? (
          <AppointmentsGrid appointments={filteredAppointments} onView={handleView} />
        ) : (
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-12 text-center">
            <div className="mx-auto bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No matching patients</h3>
            <p className="text-sm text-gray-500">
              We couldn't find any appointments matching "{searchQuery}".
            </p>
            <button 
              onClick={() => setSearchQuery("")}
              className="mt-6 text-sm text-blue-600 font-medium hover:text-blue-700 hover:underline"
            >
              Clear search filter
            </button>
          </div>
        )}
      </div>

      <AppointmentModal
        viewAppointment={viewAppointment}
        modalMode={modalMode}
        isUpdating={isUpdating}
        isSavingReminder={isSavingReminder}
        reminderSchedule={reminderSchedule}
        todayDate={todayDate}
        timeOptions={timeOptions}
        onClose={closeViewModal}
        onBackToDetails={() => setModalMode("details")}
        onApprove={() => viewAppointment && handleStatusUpdate(viewAppointment.id, "Approved")}
        onReject={() => viewAppointment && handleStatusUpdate(viewAppointment.id, "Rejected")}
        onOpenReminder={() => handleMode("reminder")}
        onAddDay={addDay}
        onRemoveDay={removeDay}
        onUpdateDayDate={updateDayDate}
        onAddTimeSlot={addTimeSlot}
        onRemoveTimeSlot={removeTimeSlot}
        onUpdateTimeSlot={updateTimeSlot}
        onCancelReminder={() => setModalMode("details")}
        onSaveReminder={handleSaveReminder}
      />

      <Alert
        isOpen={alert.show}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert((prev) => ({ ...prev, show: false }))}
      />
    </>
  );
}