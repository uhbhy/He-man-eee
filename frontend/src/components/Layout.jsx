import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Home, Compass, Camera, CheckSquare, Smile, LogOut, Heart } from "lucide-react";
import ComplimentToast from "./ComplimentToast";

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Quiz", path: "/quiz", icon: Compass },
    { name: "Moments", path: "/moments", icon: Camera },
    { name: "Wishlist", path: "/wishlist", icon: CheckSquare },
    { name: "Mood", path: "/mood", icon: Smile },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-romantic-cream text-romantic-gray pb-24 md:pb-0 md:pt-16 flex flex-col font-sans">
      {/* Desktop Header */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-rose-100 items-center justify-between px-8 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <Heart className="text-romantic-rose fill-romantic-rose animate-pulse" size={24} />
          <span className="font-serif text-xl font-bold tracking-tight text-romantic-gray">
            Couples App
          </span>
        </div>
        
        <nav className="flex items-center gap-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-romantic-rose text-white shadow-sm"
                    : "text-romantic-gray hover:text-romantic-rose hover:bg-rose-50"
                }`}
              >
                <Icon size={16} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-romantic-gray/70">
            {user?.display_name} ({user?.role})
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border border-rose-100 hover:bg-rose-50 text-romantic-rose transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="flex md:hidden sticky top-0 bg-white/90 backdrop-blur-md border-b border-rose-50 h-14 items-center justify-between px-4 z-40 shadow-sm">
        <div className="flex items-center gap-1.5">
          <Heart className="text-romantic-rose fill-romantic-rose animate-pulse" size={18} />
          <span className="font-serif text-lg font-bold tracking-tight text-romantic-gray">
            Couples App
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="p-1.5 text-romantic-rose hover:bg-rose-50 rounded-full transition-colors"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 md:py-8">
        {children}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-rose-100 justify-around items-center px-2 z-50 pb-safe shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                isActive
                  ? "text-romantic-rose font-semibold transform scale-110"
                  : "text-romantic-gray/60 hover:text-romantic-rose"
              }`}
            >
              <Icon size={20} className={isActive ? "fill-romantic-rose/10" : ""} />
              <span className="text-[10px] tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Compliment Toast Overlay */}
      <ComplimentToast />
    </div>
  );
};

export default Layout;
