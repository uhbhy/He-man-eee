import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../api/api";
import { Smile, Heart, Meh, Frown, Sparkles, Send, Calendar, Clock, History, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MOOD_OPTIONS = [
  { id: "happy", label: "Happy", color: "text-amber-500 bg-amber-50 border-amber-200 hover:border-amber-400 focus:ring-amber-200", icon: Smile, emoji: "😊" },
  { id: "loved", label: "Loved", color: "text-rose-500 bg-rose-50 border-rose-200 hover:border-rose-400 focus:ring-rose-200", icon: Heart, emoji: "🥰" },
  { id: "meh", label: "Meh", color: "text-slate-500 bg-slate-50 border-slate-200 hover:border-slate-400 focus:ring-slate-200", icon: Meh, emoji: "😐" },
  { id: "sad", label: "Sad", color: "text-blue-500 bg-blue-50 border-blue-200 hover:border-blue-400 focus:ring-blue-200", icon: Frown, emoji: "😢" },
  { id: "excited", label: "Excited", color: "text-violet-500 bg-violet-50 border-violet-200 hover:border-violet-400 focus:ring-violet-200", icon: Sparkles, emoji: "🤩" },
];

const Mood = () => {
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Today's summary & user history
  const [todayMoods, setTodayMoods] = useState({ boyfriend: null, girlfriend: null });
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [todayRes, historyRes] = await Promise.all([
        api.get("/mood/today"),
        api.get("/mood/history?days=14"),
      ]);
      setTodayMoods(todayRes.data);
      setHistory(historyRes.data);

      // Prepopulate form if user already checked in today
      const ownCheckin = user?.role === "boyfriend" ? todayRes.data.boyfriend : todayRes.data.girlfriend;
      if (ownCheckin) {
        setSelectedMood(ownCheckin.mood);
        setNote(ownCheckin.note || "");
      }
    } catch (err) {
      console.error("Failed to load mood data:", err);
      setError("Unable to load mood information. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMood) {
      setError("Please select a mood option.");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess(false);
    try {
      const res = await api.post("/mood", { mood: selectedMood, note: note.trim() || null });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Reload today's moods and history
      const [todayRes, historyRes] = await Promise.all([
        api.get("/mood/today"),
        api.get("/mood/history?days=14"),
      ]);
      setTodayMoods(todayRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      console.error("Failed to check in mood:", err);
      setError(err.response?.data?.detail || "Failed to submit check-in.");
    } finally {
      setSubmitting(false);
    }
  };

  const boyfriendMood = todayMoods.boyfriend;
  const girlfriendMood = todayMoods.girlfriend;
  const partnerRole = user?.role === "boyfriend" ? "girlfriend" : "boyfriend";
  const partnerMood = todayMoods[partnerRole];
  const partnerDisplayName = user?.role === "boyfriend" ? "Juliet" : "Romeo";

  return (
    <div className="space-y-6 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-romantic-gray">Daily Mood Check-in 🌸</h1>
        <p className="text-sm text-romantic-gray/60 mt-1">
          Share your feelings and see how your partner is doing today.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-romantic-rose border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Check-in Form */}
          <div className="bg-white border border-rose-100 shadow-md rounded-2xl p-5 space-y-5 flex flex-col justify-between">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h3 className="font-serif font-bold text-romantic-gray text-lg mb-1">How are you feeling?</h3>
                <p className="text-xs text-romantic-gray/50">Your selection updates instantly if you change your mind.</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-romantic-rose bg-rose-50 border-l-2 border-romantic-rose px-3 py-2 rounded-r-lg">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              {/* Grid of Mood Cards */}
              <div className="grid grid-cols-5 gap-2">
                {MOOD_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = selectedMood === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedMood(opt.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all focus:outline-none focus:ring-2 ${
                        isSelected
                          ? `${opt.color.split(" ")[0]} ${opt.color.split(" ")[1]} border-current ring-2 shadow-sm`
                          : "border-gray-100 bg-gray-50/50 hover:bg-gray-50 text-gray-500"
                      }`}
                    >
                      <span className="text-xl mb-1">{opt.emoji}</span>
                      <span className="text-[10px] font-bold tracking-tight">{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Short Note */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-romantic-gray/60">Add a note (Optional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="block w-full px-3 py-2 rounded-xl border border-rose-100 bg-rose-50/10 text-sm text-romantic-gray placeholder-romantic-gray/40 focus:outline-none focus:ring-2 focus:ring-romantic-rose/20 focus:border-romantic-rose resize-none"
                  placeholder="E.g., Busy morning, but excited for tonight!"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-gradient-to-r from-romantic-rose to-rose-500 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                ) : success ? (
                  <>Checked In! ✨</>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Save Check-in</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Partner Status Card */}
          <div className="bg-white border border-rose-100 shadow-md rounded-2xl p-5 flex flex-col justify-between">
            <div className="space-y-5">
              <div>
                <h3 className="font-serif font-bold text-romantic-gray text-lg mb-1">{partnerDisplayName}'s Mood</h3>
                <p className="text-xs text-romantic-gray/50">See how your partner is feeling today.</p>
              </div>

              {partnerMood ? (
                <div className="space-y-4">
                  {/* Big Mood Display */}
                  <div className="flex items-center gap-4 bg-rose-50/30 border border-rose-100/50 p-4 rounded-2xl">
                    <span className="text-4xl" role="img" aria-label={partnerMood.mood}>
                      {MOOD_OPTIONS.find((m) => m.id === partnerMood.mood)?.emoji || "✨"}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-romantic-gray capitalize">
                        Feeling {partnerMood.mood}!
                      </p>
                      <p className="text-[10px] text-romantic-gray/40 flex items-center gap-1 mt-0.5">
                        <Clock size={11} />
                        Checked in at {new Date(partnerMood.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>

                  {/* Partner's Note */}
                  {partnerMood.note ? (
                    <div className="bg-amber-50/30 border border-amber-100/40 p-4 rounded-xl relative">
                      <p className="text-xs italic text-romantic-gray/70 leading-relaxed font-serif">
                        "{partnerMood.note}"
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-romantic-gray/40 italic">No notes added today.</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-rose-100 rounded-2xl bg-rose-50/10">
                  <Heart className="text-rose-200 mb-3 animate-pulse" size={32} />
                  <p className="text-sm font-medium text-romantic-gray/60">{partnerDisplayName} hasn't checked in yet.</p>
                  <p className="text-xs text-romantic-gray/40 mt-1">Check back later or nudge them!</p>
                </div>
              )}
            </div>

            {/* Toggle History Button */}
            <button
              onClick={() => setShowHistory((h) => !h)}
              className="mt-6 flex items-center justify-center gap-1.5 py-2 px-4 border border-rose-100 text-romantic-rose hover:bg-rose-50 rounded-xl text-xs font-semibold transition-all w-full"
            >
              <History size={14} />
              <span>{showHistory ? "Hide My History" : "View My History"}</span>
            </button>
          </div>
        </div>
      )}

      {/* History Section */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="bg-white border border-rose-100 shadow-md rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-romantic-rose" />
              <h3 className="font-serif font-bold text-romantic-gray text-lg">Your Check-in History</h3>
            </div>

            {history.length === 0 ? (
              <p className="text-xs text-romantic-gray/40 py-4 text-center">No history records found.</p>
            ) : (
              <div className="divide-y divide-rose-50/50 max-h-60 overflow-y-auto pr-1">
                {history.map((h) => (
                  <div key={h.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">
                          {MOOD_OPTIONS.find((m) => m.id === h.mood)?.emoji || "✨"}
                        </span>
                        <span className="text-xs font-semibold text-romantic-gray capitalize">
                          {h.mood}
                        </span>
                        <span className="text-[10px] text-romantic-gray/40 font-mono">
                          {new Date(h.checked_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                        </span>
                      </div>
                      {h.note && (
                        <p className="text-xs text-romantic-gray/60 pl-6 leading-relaxed italic">
                          "{h.note}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Mood;
