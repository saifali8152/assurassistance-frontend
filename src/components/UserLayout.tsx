import { useState, useEffect, useRef } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Bell,
  Search,
  Menu,
  X,
  Grid3X3,
  ChevronDown,
  User,
  Lock,
  LogOut,
  BarChart3,
  Users,
  Calendar,
  CreditCard,
  Settings,
  Layers,
} from "lucide-react";

const UserLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const NavLink = ({ to, icon: Icon, children }: { to: string, icon: React.ElementType, children: React.ReactNode }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors w-full text-left ${isActive
          ? 'bg-blue-500/20 text-white'
          : 'hover:bg-white/10 text-white/80 hover:text-white'
          }`}
      >
        <Icon className="w-5 h-5" />
        <span className="font-medium">{children}</span>
      </Link>
    );
  };

  return (
    <div className="w-full h-screen fixed inset-0 overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 left-4 sm:top-10 sm:left-10 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
        <div className="absolute top-8 right-8 sm:top-20 sm:right-20 w-1 h-1 bg-white rounded-full animate-ping"></div>
        <div className="absolute bottom-8 left-8 sm:bottom-20 sm:left-20 w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse"></div>
        <div className="absolute bottom-4 right-4 sm:bottom-10 sm:right-10 w-2 h-2 bg-white rounded-full animate-ping"></div>
        <div className="hidden md:block absolute top-1/3 left-1/4 w-1 h-1 bg-blue-200 rounded-full animate-pulse"></div>
        <div className="hidden lg:block absolute bottom-1/3 right-1/4 w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
      </div>

      {/* World Map Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-5 bg-repeat w-full h-full"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20h60v60H20z' stroke='%23ffffff' stroke-width='0.5' fill='none'/%3E%3Cpath d='M30 30c10-5 20-5 30 0M25 50c15-10 25-10 40 0M35 70c10-3 15-3 25 0' stroke='%23ffffff' stroke-width='0.3' fill='none'/%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className="absolute top-1/4 left-0 w-full h-1 overflow-hidden">
        <div
          className="absolute left-0 top-0 w-4 h-1 bg-blue-400 opacity-30 animate-pulse"
          style={{
            animation: "fly 20s linear infinite",
            clipPath: "polygon(0 50%, 100% 0, 80% 50%, 100% 100%)"
          }}
        ></div>
      </div>

      {/* Top Navigation Bar */}
      <nav className="relative z-50 backdrop-blur-xl bg-white/10 border-b border-white/20">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          {/* Left side - Logo and Menu */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-lg backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/80 flex items-center justify-center">
                <Grid3X3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-semibold text-lg hidden sm:block">
                AssurAssistance
              </span>
            </div>
          </div>

          {/* Center - Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
              />
            </div>
          </div>

          {/* Right side - Notifications and Profile */}
          <div className="flex items-center space-x-3">
            <button className="p-2 rounded-lg backdrop-blur-xl bg-white/10 cursor-pointer border border-white/20 hover:bg-white/20 transition-colors relative">
              <Bell className="w-5 h-5 text-white " />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>

            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className={`flex items-center space-x-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl px-3 py-2 hover:bg-white/20 transition-all duration-200 cursor-pointer ${profileDropdownOpen ? "ring-2 ring-blue-400/50" : ""}`}
              >
                <img
                  src="https://i.pravatar.cc/32?img=5"
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
                <div className="hidden sm:block">
                  <p className="text-white text-sm font-medium">Emma Johnson</p>
                  <p className="text-white/60 text-xs">emma@travelagency.com</p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-white/60 transition-transform duration-200 ${profileDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>


              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 backdrop-blur-xl bg-[#1E2A3A]/90 border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="py-2">
                    <button onClick={() => setProfileDropdownOpen(false)} className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-white/10 transition-colors duration-150 text-white"><User className="w-4 h-4" /> <span className="text-sm font-medium">Profile</span></button>
                    <button onClick={() => setProfileDropdownOpen(false)} className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-white/10 transition-colors duration-150 text-white"><Settings className="w-4 h-4" /> <span className="text-sm font-medium">Settings</span></button>
                    <button onClick={() => setProfileDropdownOpen(false)} className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-white/10 transition-colors duration-150 text-white"><Lock className="w-4 h-4" /> <span className="text-sm font-medium">Change Password</span></button>
                    <button onClick={() => setProfileDropdownOpen(false)} className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-white/10 transition-colors duration-150 text-white"><Bell className="w-4 h-4" /> <span className="text-sm font-medium">Notifications</span></button>
                    <button onClick={() => setProfileDropdownOpen(false)} className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-white/10 transition-colors duration-150 text-red-400 hover:text-red-300"><LogOut className="w-4 h-4" /> <span className="text-sm font-medium">Logout</span></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-73px)] relative">
        {/* Left Sidebar */}
        <aside className={`fixed lg:relative z-40 w-64 h-full transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="h-full backdrop-blur-xl bg-white/10 border-r border-white/20 p-4">
            <div className="lg:hidden flex justify-end mb-4">
              <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-white/20 transition-colors"><X className="w-5 h-5 text-white" /></button>
            </div>
            <nav className="space-y-2">
              <NavLink to="/" icon={BarChart3}>Dashboard</NavLink>
              <NavLink to="/bookings" icon={Calendar}>My Bookings</NavLink>
              <NavLink to="/user/createCase" icon={Layers}>Create Case</NavLink>
              <NavLink to="/clients" icon={Users}>My Clients</NavLink>
              <NavLink to="/payments" icon={CreditCard}>Payments</NavLink>
              <NavLink to="/settings" icon={Settings}>Settings</NavLink>
            </nav>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 lg:hidden bg-black/50" onClick={toggleSidebar}></div>
        )}

        {/* Main Content Rendered by the Router */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      <style>{`
        @keyframes fly {
          0% { transform: translateX(-100px); opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          100% { transform: translateX(calc(100vw + 100px)); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default UserLayout;