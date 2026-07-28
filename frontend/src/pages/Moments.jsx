import React, { useState, useEffect, useRef } from "react";
import api, { API_ORIGIN } from "../api/api";
import { useAuth } from "../hooks/useAuth";
import { Plus, X, Trash2, Calendar, User, Play, UploadCloud, File, Film } from "lucide-react";

const resolveMediaUrl = (mediaUrl) => {
  if (!mediaUrl) {
    return "";
  }

  if (mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://")) {
    return mediaUrl;
  }

  return `${API_ORIGIN}${mediaUrl}`;
};

const Moments = () => {
  const { user } = useAuth();
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Lightbox & Modal state
  const [lightboxMoment, setLightboxMoment] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  // Form state
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [takenAt, setTakenAt] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);

  const loadMoments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/moments");
      setMoments(res.data);
    } catch (err) {
      console.error("Failed to load moments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMoments();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    setError("");
    if (!selectedFile) return;

    // Enforce 50MB limit
    const MAX_SIZE = 50 * 1024 * 1024;
    if (selectedFile.size > MAX_SIZE) {
      setError("File is too large. Maximum size is 50MB.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a photo or video to upload.");
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    if (caption) formData.append("caption", caption);
    if (takenAt) formData.append("taken_at", takenAt);

    try {
      await api.post("/moments", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      // Reset state and reload
      setFile(null);
      setCaption("");
      setTakenAt("");
      setIsUploadOpen(false);
      await loadMoments();
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to upload moment. Please try again.");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (momentId) => {
    if (!window.confirm("Are you sure you want to delete this moment forever? 😢")) return;

    try {
      await api.delete(`/moments/${momentId}`);
      setLightboxMoment(null);
      await loadMoments();
    } catch (err) {
      console.error("Failed to delete moment:", err);
      alert("Error deleting moment. Only the uploader can delete it.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-romantic-gray">Moments Gallery 📸</h1>
          <p className="text-sm text-romantic-gray/60 mt-1">
            A private visual diary of your favorite memories together
          </p>
        </div>
        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-romantic-rose to-rose-500 text-white rounded-full text-sm font-semibold shadow-md hover:shadow-lg transition-all active:scale-[0.98] self-start md:self-auto"
        >
          <Plus size={18} />
          <span>Upload Moment</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-romantic-rose border-t-transparent"></div>
          <p className="text-sm font-medium text-romantic-gray/60">Opening your gallery...</p>
        </div>
      ) : moments.length === 0 ? (
        <div className="text-center py-20 bg-white border border-rose-100/50 rounded-3xl p-8 shadow-sm">
          <UploadCloud className="mx-auto text-romantic-rose/40 mb-4" size={56} />
          <h2 className="font-serif text-xl font-bold text-romantic-gray">Your gallery is empty</h2>
          <p className="text-sm text-romantic-gray/50 mt-1 max-w-sm mx-auto">
            Share your first photograph or video to begin your visual history together!
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="mt-5 px-6 py-2.5 bg-rose-50 hover:bg-rose-100 text-romantic-rose rounded-full text-sm font-semibold transition-all"
          >
            Add First Moment
          </button>
        </div>
      ) : (
        /* Pinterest Masonry Grid */
        <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
          {moments.map((moment) => (
            <div
              key={moment.id}
              onClick={() => setLightboxMoment(moment)}
              className="break-inside-avoid bg-white border border-rose-100/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] cursor-pointer relative group flex flex-col mb-4"
            >
              {/* Media Thumbnail */}
              <div className="relative overflow-hidden w-full bg-rose-50/20">
                {moment.media_type === "photo" ? (
                  <img
                    src={resolveMediaUrl(moment.media_url)}
                    alt={moment.caption || "Moment"}
                    className="w-full object-cover max-h-[400px] transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="relative">
                    <video
                      src={`${resolveMediaUrl(moment.media_url)}#t=0.5`}
                      preload="metadata"
                      muted
                      playsInline
                      className="w-full object-cover max-h-[400px] transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-white/90 shadow-md flex items-center justify-center text-romantic-rose group-hover:scale-110 transition-transform">
                        <Play size={22} className="fill-romantic-rose ml-0.5" />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Uploader Initials Tag */}
                <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm border border-rose-50 text-[10px] font-bold text-romantic-gray px-2.5 py-1 rounded-full shadow-sm">
                  By {moment.uploader.display_name}
                </div>
              </div>

              {/* Caption Summary if exists */}
              {moment.caption && (
                <div className="p-4 border-t border-rose-50/50">
                  <p className="text-sm font-medium leading-relaxed text-romantic-gray line-clamp-3">
                    {moment.caption}
                  </p>
                  {moment.taken_at && (
                    <div className="flex items-center gap-1 mt-2 text-[10px] font-semibold text-romantic-gray/40">
                      <Calendar size={12} />
                      <span>{new Date(moment.taken_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {lightboxMoment && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Close trigger areas */}
          <button
            onClick={() => setLightboxMoment(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors z-50"
          >
            <X size={24} />
          </button>

          <div className="max-w-4xl w-full bg-white border border-rose-50 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] md:max-h-[80vh] my-auto">
            {/* Left Media Column */}
            <div className="flex-1 bg-black flex items-center justify-center overflow-hidden h-[40vh] md:h-auto">
              {lightboxMoment.media_type === "photo" ? (
                <img
                  src={resolveMediaUrl(lightboxMoment.media_url)}
                  alt={lightboxMoment.caption || "Moment"}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <video
                  src={resolveMediaUrl(lightboxMoment.media_url)}
                  controls
                  autoPlay
                  playsInline
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>

            {/* Right Meta Column */}
            <div className="w-full md:w-80 bg-white p-6 md:p-8 flex flex-col justify-between overflow-y-auto border-t md:border-t-0 md:border-l border-rose-100">
              <div className="space-y-6">
                <div className="space-y-2 border-b border-rose-50 pb-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-romantic-gray/50">
                    <User size={14} />
                    <span>Uploaded by {lightboxMoment.uploader.display_name}</span>
                  </div>
                  {lightboxMoment.taken_at && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-romantic-gray/50">
                      <Calendar size={14} />
                      <span>{new Date(lightboxMoment.taken_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-lg text-romantic-gray">Caption</h3>
                  <p className="text-sm leading-relaxed text-romantic-gray bg-rose-50/20 border border-rose-100/30 p-4 rounded-2xl whitespace-pre-wrap">
                    {lightboxMoment.caption || "No caption added 🤍"}
                  </p>
                </div>
              </div>

              {/* Owner Actions */}
              <div className="mt-8 pt-4 border-t border-rose-50 flex justify-between items-center">
                {lightboxMoment.uploader_id === user?.id ? (
                  <button
                    onClick={() => handleDelete(lightboxMoment.id)}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-romantic-rose rounded-xl text-xs font-semibold transition-all active:scale-[0.98]"
                  >
                    <Trash2 size={14} />
                    <span>Delete Memory</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-romantic-gray/40 italic">Only uploader can delete</span>
                )}
                <button
                  onClick={() => setLightboxMoment(null)}
                  className="px-4 py-2 border border-rose-100 hover:bg-rose-50 text-romantic-gray rounded-xl text-xs font-semibold transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-rose-100 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-6 md:p-8 animate-slide-up relative">
            <button
              onClick={() => setIsUploadOpen(false)}
              className="absolute top-4 right-4 text-romantic-gray/50 hover:text-romantic-gray hover:bg-rose-50 p-1.5 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="font-serif text-2xl font-bold text-romantic-gray mb-1">Add a New Moment</h2>
            <p className="text-xs text-romantic-gray/50 mb-6">
              Select a special photo or short clip to frame on your shared gallery. Max size 50MB.
            </p>

            {error && (
              <div className="mb-4 bg-rose-50 border-l-4 border-romantic-rose p-3.5 rounded-r-xl">
                <p className="text-xs text-romantic-rose font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[140px] ${
                  file
                    ? "border-emerald-300 bg-emerald-50/20"
                    : "border-rose-100 bg-rose-50/10 hover:bg-rose-50/30 hover:border-romantic-rose/40"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                  className="hidden"
                />
                
                {file ? (
                  <div className="space-y-2">
                    <div className="inline-flex h-12 w-12 items-center justify-center bg-emerald-100 text-emerald-600 rounded-full">
                      {file.type.startsWith("video/") ? <Film size={24} /> : <File size={24} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-romantic-gray truncate max-w-[280px]">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-romantic-gray/40">
                        {Math.round(file.size / (1024 * 1024) * 100) / 100} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <UploadCloud className="mx-auto text-romantic-rose/50" size={32} />
                    <p className="text-sm font-medium text-romantic-gray">
                      Drag and drop your file here, or <span className="text-romantic-rose underline">browse</span>
                    </p>
                    <p className="text-[10px] text-romantic-gray/40">
                      Supports PNG, JPG, WEBP, and MP4 up to 50MB
                    </p>
                  </div>
                )}
              </div>

              {/* Caption */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-romantic-gray/60 mb-2">
                  Caption / Memory Notes
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="block w-full px-4 py-3 rounded-2xl border border-rose-100 bg-rose-50/5 text-sm placeholder-romantic-gray/40 focus:outline-none focus:ring-2 focus:ring-romantic-rose/10 focus:border-romantic-rose text-romantic-gray min-h-[80px]"
                  placeholder="Describe this special day..."
                />
              </div>

              {/* Taken At Date */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-romantic-gray/60 mb-2">
                  When was this taken?
                </label>
                <input
                  type="date"
                  value={takenAt}
                  onChange={(e) => setTakenAt(e.target.value)}
                  className="block w-full px-4 py-3 rounded-2xl border border-rose-100 bg-rose-50/5 text-sm focus:outline-none focus:ring-2 focus:ring-romantic-rose/10 focus:border-romantic-rose text-romantic-gray"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  disabled={uploading}
                  className="flex-1 py-3 border border-rose-100 text-romantic-gray hover:bg-rose-50 rounded-2xl text-sm font-semibold transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-3 bg-gradient-to-r from-romantic-rose to-rose-500 text-white rounded-2xl text-sm font-semibold shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  ) : (
                    <span>Add Moment</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Moments;
