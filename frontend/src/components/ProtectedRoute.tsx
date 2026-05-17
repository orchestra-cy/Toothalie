import React, { useState, useEffect } from "react";
import { authenticateUser } from "@/API/AuthenticateUser";
import { Navigate } from "react-router-dom";
import { Loader2,ShieldCheck } from "lucide-react";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [hasRole, setHasRole] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const userInfoStr = localStorage.getItem("userInfo");
        if (!userInfoStr) throw new Error("No user info");

        const userInfo = JSON.parse(userInfoStr);
        const token = userInfo?.token;
        if (!token) throw new Error("No token");

        const result = await authenticateUser(token);

        if (result.status === "ok") {
          setIsValid(true);

          const userRoles = result.user.roles || [];

          const allowed = allowedRoles.length === 0 
            ? true 
            : userRoles.some(r => allowedRoles.includes(r));

          setHasRole(allowed);
        } else {
          localStorage.removeItem("userInfo");
          setIsValid(false);
        }
      } catch (err) {
        console.error(err);
        localStorage.removeItem("userInfo");
        setIsValid(false);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [allowedRoles]);

  if (loading) {
    return(
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans">
            
            {/* Central Icon Container */}
            <div className="relative flex items-center justify-center mb-8">
              {/* Outer Ring Pulse */}
              <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-75 h-20 w-20"></div>
              
              {/* Icon Background */}
              <div className="relative bg-white p-6 rounded-full shadow-xl shadow-indigo-100 border border-indigo-50 z-10">
                <ShieldCheck className="h-10 w-10 text-indigo-600" />
              </div>
            </div>
      
            {/* Loading Text & Spinner */}
            <div className="flex flex-col items-center gap-3">
              <h2 className="text-xl font-bold text-slate-800 font-ceramon tracking-tight">
                Please Wait
              </h2>
              <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                <span>Verifying credentials...</span>
              </div>
            </div>
      
            {/* Optional Footer/Branding */}
            <div className="absolute bottom-8 text-xs text-slate-400 font-medium">
              Secure Connection Established
            </div>
          </div>  
    )
  }
 
  if (!isValid) return <Navigate to="/login" replace />;

  // 🔥 If the user is authenticated but doesn't have the correct role
  if (!hasRole) return <Navigate to="/unauthorized" replace />;

  return <>{children}</>;
}
