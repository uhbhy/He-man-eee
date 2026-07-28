import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import api from "../api/api";
import { Plus, X, Trash2, Check, MapPin, UtensilsCrossed, Star, Calendar, User, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TABS = [
  { id: "date_idea", label: "Date Ideas", emoji: "🍽️", categories: ["date_idea", "other"], icon: UtensilsCrossed },
  { id: "place", label: "Places to Visit", emoji: "🌍", categories: ["place"], icon: MapPin },
];

const Wishlist = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("date_idea");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addDesc, setAddDesc] = useState("");
  const [addCategory, setAddCategory] = useState("date_idea");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await api.get("/wishlist");
      setItems(res.data);
    } catch (err) {
      console.error("Failed to load wishlist:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadItems(); }, []);

  // Filter items for active tab
  const activeCategories = TABS.find(t => t.id === activeTab)?.categories || [];
  const tabItems = items.filter(item => activeCategories.includes(item.category));

  // Sort: undone first, done at bottom
  const sortedItems = [...tabItems].sort((a, b) => {
    if (a.is_done === b.is_done) return 0;
    return a.is_done ? 1 : -1;
  });

  const handleToggleDone = async (itemId) => {
    setTogglingId(itemId);
    try {
      const res = await api.patch(`/wishlist/${itemId}/done`);
      setItems(prev => prev.map(i => i.id === itemId ? res.data : i));
    } catch (err) {
      console.error("Failed to toggle done:", err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("Remove this from your bucket list?")) return;
    try {
      await api.delete(`/wishlist/${itemId}`);
      setItems(prev => prev.filter(i => i.id !== itemId));
    } catch (err) {
      alert("Only the creator can delete this item.");
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addTitle.trim()) { setAddError("Title is required."); return; }
    setAddLoading(true);
    setAddError("");
    try {
      const res = await api.post("/wishlist", {
        title: addTitle.trim(),
        description: addDesc.trim() || null,
        category: addCategory,
      });
      setItems(prev => [res.data, ...prev]);
      setAddTitle(""); setAddDesc(""); setAddCategory("date_idea");
      setShowAddForm(false);
    } catch (err) {
      setAddError(err.response?.data?.detail || "Failed to add item.");
    } finally {
      setAddLoading(false);
    }
  };

  const undoneCount = items.filter(i => !i.is_done).length;
  const doneCount = items.filter(i => i.is_done).length;

  return (
    <div className="space-y-6 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-romantic-gray">Bucket List 🌟</h1>
          <p className="text-sm text-romantic-gray/60 mt-1">
            {undoneCount} dream{undoneCount !== 1 ? "s" : ""} left &bull; {doneCount} fulfilled
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(v => !v)}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-romantic-rose to-rose-500 text-white rounded-full text-sm font-semibold shadow-md hover:shadow-lg transition-all active:scale-[0.98] self-start"
        >
          {showAddForm ? <X size={18} /> : <Plus size={18} />}
          {showAddForm ? "Cancel" : "Add Dream"}
        </button>
      </div>

      {/* Inline Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAddSubmit} className="bg-white border border-rose-100 shadow-md rounded-2xl p-5 space-y-4">
              <h3 className="font-serif font-bold text-romantic-gray text-lg">Add a New Dream</h3>
              {addError && (
                <p className="text-xs text-romantic-rose bg-rose-50 border-l-2 border-romantic-rose px-3 py-2 rounded-r-lg">{addError}</p>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-romantic-gray/60 mb-1.5">Category</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { v: "date_idea", label: "Date Idea 🍽️" },
                    { v: "place", label: "Place to Visit 🌍" },
                    { v: "other", label: "Other ✨" },
                  ].map(opt => (
                    <button
                      key={opt.v} type="button"
                      onClick={() => setAddCategory(opt.v)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        addCategory === opt.v
                          ? "bg-romantic-rose text-white border-romantic-rose shadow-sm"
                          : "bg-rose-50 text-romantic-gray border-rose-100 hover:border-romantic-rose/50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-romantic-gray/60 mb-1.5">Title *</label>
                <input
                  type="text" required value={addTitle}
                  onChange={e => setAddTitle(e.target.value)}
                  className="block w-full px-4 py-2.5 rounded-xl border border-rose-100 bg-rose-50/10 text-sm text-romantic-gray placeholder-romantic-gray/40 focus:outline-none focus:ring-2 focus:ring-romantic-rose/20 focus:border-romantic-rose"
                  placeholder="E.g. Watch the sunset at the beach"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-romantic-gray/60 mb-1.5">Description</label>
                <textarea
                  value={addDesc}
                  onChange={e => setAddDesc(e.target.value)}
                  className="block w-full px-4 py-2.5 rounded-xl border border-rose-100 bg-rose-50/10 text-sm text-romantic-gray placeholder-romantic-gray/40 focus:outline-none focus:ring-2 focus:ring-romantic-rose/20 focus:border-romantic-rose min-h-[72px]"
                  placeholder="Optional details..."
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2.5 border border-rose-100 text-romantic-gray hover:bg-rose-50 rounded-xl text-sm font-semibold transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={addLoading}
                  className="flex-1 py-2.5 bg-gradient-to-r from-romantic-rose to-rose-500 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {addLoading
                    ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    : "Add to List"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex border-b border-rose-100 gap-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === tab.id
                ? "border-romantic-rose text-romantic-rose"
                : "border-transparent text-romantic-gray/50 hover:text-romantic-rose"
            }`}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              activeTab === tab.id ? "bg-rose-100 text-romantic-rose" : "bg-gray-100 text-gray-400"
            }`}>
              {items.filter(i => tab.categories.includes(i.category) && !i.is_done).length}
            </span>
          </button>
        ))}
      </div>

      {/* Items List */}
      {loading ? (
        <div className="flex items-center justify-center py-12 gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-romantic-rose border-t-transparent"></div>
        </div>
      ) : sortedItems.length === 0 ? (
        <div className="text-center py-16 bg-white border border-rose-100/40 rounded-2xl">
          <Star className="mx-auto text-romantic-rose/30 mb-3" size={48} />
          <p className="font-serif text-lg text-romantic-gray/60">No dreams here yet.</p>
          <p className="text-xs text-romantic-gray/40 mt-1">Add your first one above!</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {sortedItems.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className={`bg-white border rounded-2xl px-4 py-4 flex items-start gap-4 shadow-sm transition-all ${
                  item.is_done
                    ? "border-gray-100 opacity-60"
                    : "border-rose-100/60 hover:shadow-md hover:border-rose-200"
                }`}
              >
                {/* Checkmark Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => handleToggleDone(item.id)}
                  disabled={togglingId === item.id}
                  className={`shrink-0 h-7 w-7 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${
                    item.is_done
                      ? "bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-200"
                      : "border-rose-200 hover:border-romantic-rose hover:bg-rose-50"
                  }`}
                >
                  {item.is_done
                    ? <Check size={14} className="text-white font-bold" strokeWidth={3} />
                    : togglingId === item.id
                    ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-romantic-rose border-t-transparent"></span>
                    : null
                  }
                </motion.button>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className={`text-sm font-semibold leading-snug ${
                    item.is_done ? "line-through text-romantic-gray/40" : "text-romantic-gray"
                  }`}>
                    {item.title}
                  </p>
                  {item.description && (
                    <p className={`text-xs leading-relaxed ${
                      item.is_done ? "text-romantic-gray/30 line-through" : "text-romantic-gray/60"
                    }`}>
                      {item.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-romantic-gray/40">
                      <User size={11} />
                      <span>Added by {item.creator?.display_name}</span>
                    </div>
                    {item.is_done && item.done_at && (
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
                        <Check size={11} />
                        <span>Done {new Date(item.done_at).toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
                      </div>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.category === "place"
                        ? "bg-blue-50 text-blue-500"
                        : item.category === "date_idea"
                        ? "bg-rose-50 text-romantic-rose"
                        : "bg-amber-50 text-amber-600"
                    }`}>
                      {item.category === "date_idea" ? "Date Idea" : item.category === "place" ? "Place" : "Other"}
                    </span>
                  </div>
                </div>

                {/* Owner Delete Button */}
                {item.added_by === user?.id && (
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="shrink-0 p-1.5 text-romantic-gray/30 hover:text-romantic-rose hover:bg-rose-50 rounded-lg transition-all"
                    title="Delete this item"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Wishlist;
