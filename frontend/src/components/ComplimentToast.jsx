import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../api/api";
import { Heart, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ComplimentToast = () => {
  const { user, token } = useAuth();
  const [compliment, setCompliment] = useState(null);

  useEffect(() => {
    // Only run if user is girlfriend and authenticated
    if (!token || !user || user.role !== "girlfriend") {
      return;
    }

    let timeoutId = null;

    const fetchCompliment = async () => {
      try {
        const res = await api.get("/compliments/random");
        // Setting state triggers the entry animation
        setCompliment(res.data);
        
        // Auto-dismiss the active toast after 5 seconds
        timeoutId = setTimeout(() => {
          setCompliment(null);
        }, 5000);
      } catch (err) {
        console.error("Failed to fetch random compliment:", err);
      }
    };

    // First fetch immediately on mount
    fetchCompliment();

    // Set interval to fetch every 15 seconds
    const interval = setInterval(() => {
      // Clear any active dismiss timer before getting the next one
      if (timeoutId) clearTimeout(timeoutId);
      // Dismiss active toast first to avoid stacking
      setCompliment(null);
      // Fetch new compliment
      fetchCompliment();
    }, 15000);

    return () => {
      clearInterval(interval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user, token]);

  if (!user || user.role !== "girlfriend") return null;

  return (
    <AnimatePresence>
      {compliment && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9, x: 50 }}
          animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
          exit={{ opacity: 0, y: 20, scale: 0.95, x: 30 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-20 md:bottom-6 right-6 max-w-sm w-full bg-rose-50/95 backdrop-blur-md border border-rose-200 shadow-xl rounded-2xl p-4 flex items-start gap-3 z-50 pointer-events-auto"
        >
          <div className="h-10 w-10 bg-rose-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-md animate-bounce shadow-rose-200">
            <Heart className="fill-white text-white" size={18} />
          </div>
          
          <div className="flex-1 space-y-1.5">
            <div className="flex justify-between items-start">
              <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">
                A Sweet Note From Romeo 💛
              </span>
              <button
                onClick={() => setCompliment(null)}
                className="text-romantic-gray/40 hover:text-rose-500 rounded-full p-0.5 hover:bg-rose-100/50 transition-all"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-sm font-serif font-bold text-romantic-gray leading-relaxed">
              "{compliment.message}"
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ComplimentToast;
