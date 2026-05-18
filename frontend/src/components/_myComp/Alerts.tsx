import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

// Updated configuration to match the mobile toast colored circular badges
const alertConfig = {
  success: {
    icon: CheckCircle2,
    iconBg: "bg-emerald-50 border-emerald-100",
    iconColor: "text-emerald-500",
  },
  error: {
    icon: XCircle,
    iconBg: "bg-rose-50 border-rose-100",
    iconColor: "text-rose-500",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-50 border-amber-100",
    iconColor: "text-amber-500",
  },
  info: {
    icon: Info,
    iconBg: "bg-sky-50 border-sky-100", // Switched to sky blue to match mobile theme
    iconColor: "text-sky-500",
  },
};

export default function Alert({ 
  isOpen, 
  onClose, 
  type = "info", 
  title, 
  message, 
  autoClose = true,
  duration = 4000 
}) {
  const config = alertConfig[type] || alertConfig.info;
  const Icon = config.icon;

  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, duration, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed top-6 right-6 z-[100] w-full max-w-sm pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            // Mobile-matched styling: White background, soft shadow, slate border, 20px radius
            className="pointer-events-auto bg-white rounded-[20px] shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center p-4"
          >
            {/* Colored Icon Badge */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mr-3 border ${config.iconBg} ${config.iconColor}`}>
              <Icon size={20} strokeWidth={2.5} />
            </div>

            {/* Content matching mobile typography */}
            <div className="flex-1 justify-center">
              {title && (
                <h4 className="text-sm font-extrabold text-slate-800 tracking-wide">
                  {title}
                </h4>
              )}
              {message && (
                <p className="text-xs font-medium text-slate-500 mt-0.5 leading-relaxed">
                  {message}
                </p>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="ml-3 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors shrink-0"
            >
              <X size={16} strokeWidth={3} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}