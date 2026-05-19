import * as React from "react";
import { useState, useRef, useEffect } from "react";
import {
  History,
  LogOut,
  User,
  ChevronRight,
  ChevronLeft,
  Settings,
  Edit,
  Calendar,
  LayoutDashboard,
  Users,
  PersonStanding,
  NotebookPen,
  Clock,
  TableOfContents,
  Sun,
  Moon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Sidebar } from "@/components/ui/sidebar"; // Assuming this is your Shadcn/UI shell, though not strictly needed with this custom implementation

// ==========================================
// Types & Interfaces
// ==========================================
export interface NavItem {
  label: string;
  icon: LucideIcon;
  key: string;
  badge?: string;
}

export interface UserInfo {
  firstName: string;
  lastName: string;
  roles: string[];
}

interface AppSidebarProps extends React.ComponentProps<"aside"> {
  userInfo?: UserInfo;
  navItems: NavItem[];
  currentPane: string;
  setCurrentPane: (pane: string) => void;
  onLogout: () => void;
  setOpenProfile: (open: boolean) => void;
  isOpenProfilePane?: boolean;
}

// ==========================================
// Navigation Data (Kept your existing data)
// ==========================================
export const DentistDashboard: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, key: "Dashboard" },
  { label: "Appointments", icon: Calendar, key: "Appointment" },
  { label: "History", icon: History, key: "History" },
  { label: "Settings", icon: Settings, key: "Settings" },
];

export const PatientDashboard: NavItem[] = [
  { label: "Appointments", icon: Calendar, key: "Appointments" },
  { label: "History", icon: History, key: "History" },
  // { label: "Estrellanes", icon: PersonStanding, key: "Estrellanes" },
];

export const AdminDashboard: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, key: "AdminDashboard" },
  { label: "Users", icon: Users, key: "Users" },
  { label: "Appointments", icon: Calendar, key: "Appointments" },
  { label: "Reminders", icon: NotebookPen, key: "Reminders" },
  { label: "Dentist Services", icon: User, key: "Dentist Services" },
  { label: "Manage Services", icon: User, key: "Manage Services" },
  { label: "Service Types", icon: NotebookPen, key: "ServiceTypes" },
  { label: "Appointment Types", icon: Calendar, key: "AppointmentTypes" },
  { label: "Roles", icon: Users, key: "Roles" },
  { label: "Schedules", icon: Clock, key: "Schedules" },
  { label: "System Logs", icon: TableOfContents, key: "Logs" },
];

// ==========================================
// Components
// ==========================================
const LogoutConfirmationModal: React.FC<{
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200">
    <div className="bg-white dark:bg-[#1a1d29] rounded-2xl shadow-2xl p-6 w-96 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col items-center text-center">
        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-full mb-4">
          <LogOut className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Confirm Logout
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          Are you sure you want to end your session?
        </p>
        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ==========================================
// Main Component
// ==========================================

export function AppSidebar({
  userInfo,
  navItems,
  currentPane,
  setCurrentPane,
  onLogout,
  setOpenProfile,
  isOpenProfilePane,
  ...props
}: AppSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // const profileClosed = () => {
  //   setOpenProfilePane(false);
  // };

  // Tooltip State
  const [hoveredItem, setHoveredItem] = useState<{
    label: string;
    top: number;
    left: number;
  } | null>(null);

  // Close profile menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Tooltip Positioning
  const handleMouseEnter = (e: React.MouseEvent, label: string) => {
    if (!isCollapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredItem({
      label,
      top: rect.top + rect.height / 2,
      left: rect.right + 10,
    });
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };
  const user_first_name = userInfo.firstName ?? "Guest";
  const user_last_name = userInfo.lastName ?? "N/A"
  const displayName = userInfo
    ? `${user_first_name} ${user_last_name}`
    : "Guest User";
  const roleChecker = userInfo?.roles?.[0]?.replace("ROLE_", "") || "GUEST";
  const role = roleChecker.includes("ADMIN")
    ? "Admin"
    : roleChecker.includes("DENTIST")
      ? "Dentist"
      : "Patient";
  const initials = userInfo
    ? `${user_first_name[0]}${user_last_name[0]}`.toUpperCase()
    : "GU";

  return (
    <div
      className={`${
        isDarkMode ? "dark" : ""
      } h-full flex transition-colors duration-300`}
    >
      {/* --- Tooltip Portal --- */}
      {hoveredItem && isCollapsed && (
        <div
          className="fixed z-[9999] px-3 py-1.5 text-xs font-medium text-white bg-gray-900 dark:bg-gray-800 rounded-md shadow-lg pointer-events-none animate-in fade-in zoom-in-95 duration-150 border border-gray-700"
          style={{
            top: hoveredItem.top,
            left: hoveredItem.left,
            transform: "translateY(-50%)",
          }}
        >
          {hoveredItem.label}
          <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45 border-l border-b border-gray-700" />
        </div>
      )}

      {showLogoutConfirmation && (
        <LogoutConfirmationModal
          onConfirm={() => {
            setShowLogoutConfirmation(false);
            onLogout();
          }}
          onCancel={() => setShowLogoutConfirmation(false)}
        />
      )}

      {/* --- Sidebar Container --- */}
      <aside
        className={`
          relative flex flex-col h-full
          bg-white dark:bg-[#111827]
          border-r border-gray-200 dark:border-gray-800
          transition-all duration-300 ease-in-out shadow-xl
          ${isCollapsed ? "w-[80px]" : "w-72"}
        `}
      >
        {/* Toggle Button */}
        {!isOpenProfilePane && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-9 z-50 w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center text-gray-500 hover:text-indigo-600 shadow-sm transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronLeft size={14} />
            )}
          </button>
        )}

        {/* Company Info */}
        <div className="flex gap-5 items-center flex-row px-4 py-2 border-b border-gray-100 dark:border-gray-800/50">
          <img
            alt="Company Logo"
            src="/logo.png"
            className="w-15 h-15 rounded-s"
          />
          <span
            className={`text-l font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[160px]
            ${isCollapsed ? "hidden" : ""}`}
          >
            Toothalie Dental
          </span>
        </div>

        {/* 2. Navigation List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 space-y-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
          {navItems.map((item) => {
            const isActive = currentPane === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setCurrentPane(item.key)}
                onMouseEnter={(e) => handleMouseEnter(e, item.label)}
                onMouseLeave={handleMouseLeave}
                className={`
                  group flex items-center w-full rounded-lg transition-all duration-200 relative
                  ${isCollapsed ? "justify-center p-3" : "justify-start px-3 py-2.5"}
                  ${
                    isActive
                      ? "bg-blue-800 dark:bg-white text-white dark:text-gray-900 shadow-md"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                  }
                `}
              >
                {/* Icon */}
                <item.icon
                  size={20}
                  className={`
                    shrink-0 transition-colors duration-200
                    ${isActive ? "text-white dark:text-gray-900" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"}
                  `}
                />

                <span
                  className={`
                    text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300
                    ${
                      isCollapsed
                        ? "w-0 ml-0 opacity-0"
                        : "w-auto ml-3 opacity-100 delay-75"
                    }
                  `}
                >
                  {item.label}
                </span>

                {/* Badge */}
                {!isCollapsed && item.badge && (
                  <span className="ml-auto bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 py-0.5 px-2 rounded-full text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="px-4 py-8 border-b border-gray-100 dark:border-gray-800/50">
          <div className="relative" ref={profileRef}>
            {/* Profile Trigger Button */}
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`
                group relative flex items-center w-full outline-none transition-all duration-300
                hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 -mx-2 rounded-xl
                ${isCollapsed ? "justify-center flex-col" : "justify-start gap-3"}
              `}
            >
              {/* Avatar */}
              <div
                className={`
                relative shrink-0 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px]
                transition-all duration-300 ease-in-out
                ${isCollapsed ? "w-10 h-10" : "w-10 h-10"}
              `}
              >
                <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center text-gray-700 dark:text-white font-bold text-sm">
                  {initials}
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
              </div>

              {/* User Info */}
              <div
                className={`
                  flex flex-col items-start transition-all duration-300 overflow-hidden whitespace-nowrap
                  ${
                    isCollapsed
                      ? "w-0 h-0 opacity-0"
                      : "w-auto h-auto opacity-100 delay-75"
                  }
                `}
              >
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[150px]">
                  {displayName}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium capitalize">
                  {role}
                </span>
              </div>
            </button>

            {/* Profile Dropdown (Now popping UP) */}
            {showProfileMenu && (
              <div
                className={`
                  absolute z-50 w-56 p-1.5
                  bg-white dark:bg-[#1f2937] rounded-xl shadow-xl shadow-black/10
                  border border-gray-100 dark:border-gray-700 overflow-hidden
                  animate-in fade-in zoom-in-95 duration-150
                  ${
                    isCollapsed 
                      ? "left-14 bottom-0 origin-bottom-left slide-in-from-left-2" 
                      : "bottom-full mb-3 left-0 origin-bottom-left slide-in-from-bottom-2"
                  }
                `}
              >
                {/* Context Header */}
                {!isCollapsed && (
                  <div className="px-3 py-2 mb-1 border-b border-gray-100 dark:border-gray-700/50">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">
                      {role}
                    </p>
                  </div>
                )}

                <div className="space-y-0.5">
                  <button
                    onClick={() => {
                      setOpenProfile(true);
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-3 transition-colors"
                  >
                    <Edit size={16} className="text-gray-400 dark:text-gray-400" /> 
                    <span>Edit Profile</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowLogoutConfirmation(true);
                    }}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors mt-1"
                  >
                    <LogOut size={16} className="text-red-500 dark:text-red-400" /> 
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
