import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DisableAccount from "../ErrorRoute/DisableAccount";

// API Imports
import GetUserInfo from "@/API/Authenticated/GetUserInfoAPI";
import { LogoutUser } from "@/API/Authenticated/Logout";

// Component Imports
import { Main } from "./Panes/DentistPane/Main";
import Appointments from "./Panes/DentistPane/Appointments";
import { SettingsPane } from "./Panes/DentistPane/SettingsPane";
import UpcomingAppointment from "./Panes/PatientPane/UpcomingAppointment";
import AppUser from "./Panes/Admin/AppUser";
import Appointment from "./Panes/Admin/Appointment";
import DentistService from "./Panes/Admin/DentistService";
import ManageService from "./Panes/Admin/ManageService";
import ServiceTypes from "./Panes/Admin/ServiceTypes";
import AppointmentTypes from "./Panes/Admin/AppointmentTypes";
import Roles from "./Panes/Admin/Roles";
import Reminder from "./Panes/Admin/Reminder";
import HistoryPane from "./Panes/All/History";
import { MyProfile } from "./Panes/All/MyProfile";
import { MyAdmin } from "./Panes/Admin/MyAdmin";
import Logs from "./Panes/Admin/Logs";
import Schedule from "./Panes/Admin/Schedule";
// import Estrellanes from "./Panes/Midterm_Requirement/Estrellanes";

// Sidebar Imports
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import {
  AppSidebar,
  DentistDashboard,
  PatientDashboard,
  AdminDashboard,
  type NavItem,
  type UserInfo,
} from "@/components/app-sidebar";

// ==========================================
// Types
// ==========================================
interface DashboardLayoutProps {
  userInfo: UserInfo;
  navItems: NavItem[];
  currentPane: string;
  setCurrentPane: (pane: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
  openProfile: boolean;
  setOpenProfile: (open: boolean) => void;
}

// ==========================================
// Dashboard Layout Component
// ==========================================
const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  userInfo,
  navItems,
  currentPane,
  setCurrentPane,
  onLogout,
  children,
  openProfile,
  setOpenProfile,
}) => {
  const handleProfileClose = () => {
    setOpenProfile(false);
  };

  return (
    <SidebarProvider>
      <div className="flex font-ceramon h-screen bg-gray-50 overflow-hidden font-sans text-slate-800 relative w-full">
        {/* Profile Overlay Modal */}
        {openProfile && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="relative">
              <MyProfile
                onClose={() => {
                  handleProfileClose();
                }}
              />
            </div>
          </div>
        )}

        {/* Sidebar Component */}
        <AppSidebar
          userInfo={userInfo}
          navItems={navItems}
          currentPane={currentPane}
          setCurrentPane={setCurrentPane}
          onLogout={onLogout}
          setOpenProfile={setOpenProfile}
          isOpenProfilePane={openProfile}
        />

        {/* Main Content Area CLINT_JAY */}
        <SidebarInset className="flex-1 overflow-y-auto relative h-full"> 
          <main className="flex-1 overflow-y-auto relative h-full">
            <div className="max-w-13xl mx-auto p-6 lg:p-10">
              {/* Content Header */}
              <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-ceramon font-bold text-gray-900 tracking-tight">
                    {navItems.find((i) => i.key === currentPane)?.label ||
                      "Dashboard"}
                  </h1>
                  <p className="text-gray-500 mt-1 font-ceramon">
                    Welcome back, {userInfo?.firstName}.
                  </p>
                </div>
                <div className="hidden sm:block text-sm text-gray-400 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </header>

              {/* Dynamic Pane Content */}
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {children}
              </section>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

// ==========================================
// PART 2: The Logic Container (Data & State)
// ==========================================
export default function UserDashboard() {
  const navigate = useNavigate();

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [currentPane, setCurrentPane] = useState("Dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [openProfile, setOpenProfile] = useState(false);
  const [isDisable, setIsDisable] = useState(false);

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const data = await GetUserInfo();
        console.log("Fetched User:", data);
        setUserInfo(data.user);
        localStorage.setItem("ToothalieUser", JSON.stringify(data.user));
        if (data.user.disable) {
          console.log("disabled");
          setIsDisable(true);
        }
        if (data.user?.roles) {
          let roles = data.user.roles;
          if (
            roles.length === 1 &&
            typeof roles[0] === "string" &&
            roles[0].startsWith("[")
          ) {
            roles = JSON.parse(roles[0]);
          }
          if (roles.includes("ROLE_ADMIN")) setCurrentPane("AdminDashboard");
          else if (roles.includes("ROLE_DENTIST")) setCurrentPane("Dashboard");
          else if (roles.includes("ROLE_PATIENT")) setCurrentPane("Home");
        }
      } catch (err) {
        console.error(err);
        localStorage.removeItem("userInfo");
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    }
    fetchUserInfo();
  }, [navigate]);

  const handleLogout = async () => {
    const r = await LogoutUser();
    if (r.ok) {
      navigate("/login");
    }
  };

  if (isLoading || !userInfo) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-100 border-t-blue-600"></div>
          <span className="text-gray-500 font-medium animate-pulse">
            Loading Workspace...
          </span>
        </div>
      </div>
    );
  }

  if (isDisable) {
    return <DisableAccount />;
  }

  let roles = userInfo.roles;
  if (
    roles.length === 1 &&
    typeof roles[0] === "string" &&
    roles[0].startsWith("[")
  ) {
    roles = JSON.parse(roles[0]);
  }

  const isAdmin = roles.includes("ROLE_ADMIN");
  const isDentist = roles.includes("ROLE_DENTIST");
  const isPatient = roles.includes("ROLE_PATIENT");

  const navItems = isDentist
    ? DentistDashboard
    : isPatient
      ? PatientDashboard
      : isAdmin
        ? AdminDashboard
        : [];

  const renderPane = () => {
    if (isDentist) {
      switch (currentPane) {
        case "Dashboard":
          return <Main />;
        case "Appointment":
          return <Appointments />;
        case "Settings":
          return <SettingsPane />;
        case "History":
          return <HistoryPane />;
        default:
          return <Main />;
      }
    } else if (isPatient) {
      switch (currentPane) {
        case "Home":
        case "Appointments":
          return <UpcomingAppointment />;
        case "History":
          return <HistoryPane />;
        // case "Estrellanes":
        //   return <Estrellanes />
        default:
          return <UpcomingAppointment />;
      }
    } else if (isAdmin) {
      switch (currentPane) {
        case "AdminDashboard":
          return <MyAdmin />;
        case "Users":
          return <AppUser />;
        case "Appointments":
          return <Appointment />;
        case "Manage Services":
          return <ManageService />;
        case "Dentist Services":
          return <DentistService />;
        case "ServiceTypes":
          return <ServiceTypes />;
        case "AppointmentTypes":
          return <AppointmentTypes />;
        case "Roles":
          return <Roles />;
        case "Reminders":
          return <Reminder />;
        case "Schedules":
          return <Schedule />;
        case "Logs":
          return <Logs />;
        default:
          return <MyAdmin />;
      }
    }
    return (
      <div className="p-10 text-center text-gray-500">
        Access Denied or Unknown Role
      </div>
    );
  };

  return (
    <DashboardLayout
      userInfo={userInfo}
      navItems={navItems}
      currentPane={currentPane}
      setCurrentPane={setCurrentPane}
      onLogout={handleLogout}
      openProfile={openProfile}
      setOpenProfile={setOpenProfile}
    >
      {renderPane()}
    </DashboardLayout>
  );
}
