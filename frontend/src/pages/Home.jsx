import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import api from "../api/api";
import { Heart, Compass, Camera, CheckSquare, Smile, MessageCircle, Send, Plus, ArrowRight, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Home = () => {
  const { user } = useAuth();
  
  // Dashboard states
  const [partnerMood, setPartnerMood] = useState(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [quizScore, setQuizScore] = useState(null);
  const [quizStats, setQuizStats] = useState(null);
  
  // Action states
  const [sendingAlert, setSendingAlert] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const partnerDisplayName = user?.role === "boyfriend" ? "Juliet" : "Romeo";

  const loadDashboardData = async () => {
    try {
      const [moodRes, wishlistRes, quizRes, quizStatsRes] = await Promise.all([
        api.get("/mood/today"),
        api.get("/wishlist"),
        api.get("/quiz/history"),
        api.get("/quiz/score"),
      ]);

      // Mood status
      const partnerRole = user?.role === "boyfriend" ? "girlfriend" : "boyfriend";
      setPartnerMood(moodRes.data[partnerRole]);

      // Wishlist items remaining
      const undoneWishlist = wishlistRes.data.filter(i => !i.is_done);
      setWishlistCount(undoneWishlist.length);

      // Latest quiz performance
      const attempts = Array.isArray(quizRes.data) ? quizRes.data : [];
      if (attempts.length > 0) {
        setQuizScore(attempts[0]);
      } else {
        setQuizScore(null);
      }
      setQuizStats(quizStatsRes.data);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const handleSendAlert = async (type) => {
    setSendingAlert(type);
    try {
      await api.post("/notifications/send", { type });
      setToastMessage(`Sent a virtual ${type} to ${partnerDisplayName}! 💕`);
      setTimeout(() => setToastMessage(""), 3500);
    } catch (err) {
      console.error("Failed to send notification email:", err);
      setToastMessage("Failed to send alert. Try again later!");
      setTimeout(() => setToastMessage(""), 3500);
    } finally {
      setSendingAlert(null);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto w-full pb-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-romantic-rose text-white px-5 py-3 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2"
          >
            <Heart size={16} className="fill-white" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Greeting Header */}
      <div className="text-center py-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="inline-block p-3 bg-rose-50 rounded-full mb-3"
        >
          <Heart className="text-romantic-rose fill-romantic-rose animate-pulse" size={36} />
        </motion.div>
        <h1 className="font-serif text-3xl font-bold text-romantic-gray">Hello, {user?.display_name}! ✨</h1>
        <p className="text-sm text-romantic-gray/60 mt-1">
          Welcome back to your private couple space.
        </p>
      </div>

      {/* Interactive Quick Actions Panel (Phase 8: Virtual Hug/Kiss) */}
      <div className="bg-white border border-rose-100 shadow-md rounded-3xl p-6 space-y-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-romantic-gray">Send Love Instantly 💌</h2>
          <p className="text-xs text-romantic-gray/50 mt-0.5">Let your partner know you are thinking of them right now.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSendAlert("hug")}
            disabled={sendingAlert !== null}
            className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-2xl text-center group transition-all"
          >
            <span className="text-3xl mb-1.5 transition-transform group-hover:scale-110">🤗</span>
            <span className="text-sm font-bold text-romantic-gray">Send a Hug</span>
            <span className="text-[10px] text-romantic-gray/40 mt-1">
              {sendingAlert === "hug" ? "Delivering..." : "Instant alert"}
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSendAlert("kiss")}
            disabled={sendingAlert !== null}
            className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-100/50 rounded-2xl text-center group transition-all"
          >
            <span className="text-3xl mb-1.5 transition-transform group-hover:scale-110">😘</span>
            <span className="text-sm font-bold text-romantic-gray">Send a Kiss</span>
            <span className="text-[10px] text-romantic-gray/40 mt-1">
              {sendingAlert === "kiss" ? "Delivering..." : "Instant alert"}
            </span>
          </motion.button>
        </div>
      </div>

      {/* Partner Status & Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Partner Mood Card */}
        <div className="bg-white border border-rose-100 shadow-md rounded-3xl p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-romantic-gray text-base">{partnerDisplayName}'s Current Mood</h3>
            {partnerMood ? (
              <div className="bg-rose-50/30 border border-rose-100/40 p-4 rounded-2xl flex items-center gap-3">
                <span className="text-3xl">
                  {partnerMood.mood === "happy" && "😊"}
                  {partnerMood.mood === "loved" && "🥰"}
                  {partnerMood.mood === "meh" && "😐"}
                  {partnerMood.mood === "sad" && "😢"}
                  {partnerMood.mood === "excited" && "🤩"}
                </span>
                <div>
                  <p className="text-xs font-bold text-romantic-gray capitalize">Feeling {partnerMood.mood} today</p>
                  {partnerMood.note && (
                    <p className="text-[11px] text-romantic-gray/60 italic mt-0.5 line-clamp-2">
                      "{partnerMood.note}"
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-6 border border-dashed border-rose-100 rounded-2xl text-center bg-rose-50/10">
                <p className="text-xs font-semibold text-romantic-gray/50">No check-in today yet.</p>
              </div>
            )}
          </div>
          <Link to="/mood" className="mt-4 text-[11px] font-bold text-romantic-rose hover:underline flex items-center gap-1">
            <span>Update Mood Check-in</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        {/* Dynamic Wishlist Stats Card */}
        <div className="bg-white border border-rose-100 shadow-md rounded-3xl p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-romantic-gray text-base">Your Bucket List 🌟</h3>
            <div className="bg-amber-50/30 border border-amber-100/40 p-4 rounded-2xl flex items-center gap-3">
              <CheckSquare className="text-amber-500" size={24} />
              <div>
                <p className="text-xs font-bold text-romantic-gray">{wishlistCount} active dream{wishlistCount !== 1 ? "s" : ""}</p>
                <p className="text-[10px] text-romantic-gray/50">Items to complete together.</p>
              </div>
            </div>
          </div>
          <Link to="/wishlist" className="mt-4 text-[11px] font-bold text-romantic-rose hover:underline flex items-center gap-1">
            <span>Manage Bucket List</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        {/* Quiz Summary Widget */}
        <div className="bg-white border border-rose-100 shadow-md rounded-3xl p-5 flex flex-col justify-between md:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-romantic-gray text-base">Relationship Trivia 🧠</h3>
              <p className="text-xs text-romantic-gray/50">How well do you know your partner?</p>
            </div>
            {quizStats && quizStats.total > 0 && (
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                <Award size={14} />
                <span>Accuracy: {Math.round(quizStats.percentage)}%</span>
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-rose-50 pt-3">
            <span className="text-[10px] text-romantic-gray/40">
              {quizScore ? `Last attempted: ${new Date(quizScore.attempted_at).toLocaleDateString()}` : "No attempts made yet."}
            </span>
            <Link to="/quiz" className="text-[11px] font-bold text-romantic-rose hover:underline flex items-center gap-1">
              <span>Take Quiz</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
