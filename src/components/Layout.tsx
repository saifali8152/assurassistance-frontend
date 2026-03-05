import { useState, useEffect, useRef } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Menu,
  // X,
  BarChart3,
  Users,
  User,
  Lock,
  LogOut,
  FilePlus,
  Activity,
  Layers,
  ReceiptText
} from "lucide-react";
import LanguageSelector from "./LanguageSelector";
import CurrencySelector from "./CurrencySelector";
import { useTranslation } from "react-i18next"; // <-- Add this

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { t } = useTranslation(); // <-- Add this

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

  // Close mobile sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const NavLink = ({ to, icon: Icon, children }: { to: string, icon: React.ElementType, children: React.ReactNode }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors w-full text-left ${
          isActive
            ? 'bg-[#E4590F]/10 text-[#E4590F] border border-[#E4590F]/30 font-medium'
            : 'hover:bg-secondary/30 text-text-secondary hover:text-[#E4590F]'
        }`}
      >
        <Icon className="w-5 h-5" />
        <span className="font-normal">{children}</span>
      </Link>
    );
  };

  return (
    <div className="w-full h-screen fixed inset-0 overflow-hidden bg-white">
      {/* Top Navigation Bar */}
      <nav className="relative z-50 bg-white border-b border-[#D9D9D9]">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          {/* Left side - Logo and Menu */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-lg bg-[#D9D9D9] border border-[#D9D9D9] hover:bg-[#B8B8B8] transition-colors"
            >
              <Menu className="w-5 h-5 text-text-secondary" />
            </button>
            <div className="flex items-center">
              <img src='/full-logo.png' alt="AssureAssistance" className="h-8 sm:h-10 object-contain" />
            </div>
          </div>

          {/* Right side - Notifications and Profile */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center">
              <span className="text-[#2B2B2B]/60 text-xs capitalize font-normal px-3 py-1.5 bg-[#E4590F]/10 rounded-lg border border-[#E4590F]/20">
                {user?.role || "Admin"}
              </span>
            </div>
            <CurrencySelector />
            <LanguageSelector />

            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className={`flex items-center space-x-2 rounded-full border-2 transition-all duration-200 cursor-pointer ${
                  profileDropdownOpen 
                    ? "border-[#E4590F] ring-2 ring-[#E4590F]/20" 
                    : "border-[#D9D9D9] hover:border-[#E4590F]/50"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-[#E4590F]/10 flex items-center justify-center overflow-hidden">
                  {(user as any)?.profile_picture ? (
                    <img 
                      src={(user as any).profile_picture} 
                      alt={user?.name || "Profile"} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-[#E4590F]" />
                  )}
                </div>
                {/* <ChevronDown
                  className={`w-4 h-4 text-text-secondary/60 transition-transform duration-200 hidden sm:block ${
                    profileDropdownOpen ? "rotate-180 text-[#E4590F]" : ""
                  }`}
                /> */}
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-[#D9D9D9] rounded-2xl z-50 overflow-hidden animate-fadeIn">
                  {/* Profile Header */}
                  <div className="px-4 py-3 border-b border-[#D9D9D9] bg-[#E4590F]/5">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-[#E4590F]/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {(user as any)?.profile_picture ? (
                          <img 
                            src={(user as any).profile_picture} 
                            alt={user?.name || "Profile"} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-[#E4590F]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-text-secondary text-sm font-medium truncate">{user?.name || t("user.name", "Name")}</p>
                        <p className="text-text-secondary/60 text-xs font-normal truncate">{user?.email || t("user.email", "Email")}</p>
                        <p className="text-[#E4590F] text-xs font-normal capitalize mt-0.5">{user?.role || "Admin"}</p>
                      </div>
                    </div>
                  </div>
                  {/* Menu Items */}
                  <div className="py-2">
                    <Link to="/admin/profile" onClick={() => setProfileDropdownOpen(false)} className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-secondary/30 transition-colors duration-150 text-text-secondary cursor-pointer"><User className="w-4 h-4 text-[#E4590F]" /> <span className="text-sm font-normal">{t("profile.profile", "Profile")}</span></Link>
                    <Link to="/admin/change-password" onClick={() => setProfileDropdownOpen(false)} className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-secondary/30 transition-colors duration-150 text-text-secondary cursor-pointer"><Lock className="w-4 h-4 text-[#E4590F]" /> <span className="text-sm font-normal">{t("profile.changePassword", "Change Password")}</span></Link>
                    <div className="border-t border-[#D9D9D9] my-1"></div>
                    <button type="button" onClick={async () => {
                      setProfileDropdownOpen(false);
                      await logout();
                    }} className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-secondary/30 transition-colors duration-150 text-red-600 hover:text-red-700 cursor-pointer"><LogOut className="w-4 h-4" /> <span className="text-sm font-normal">{t("profile.logout", "Logout")}</span></button>
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
          <div className="h-full bg-white border-r border-[#D9D9D9] p-4">
            {/* <div className="lg:hidden flex justify-between items-center mb-4">
              <div className="flex items-center space-x-3">
                <div>
                  <p className="text-text-secondary text-sm font-normal">{user?.name || t("user.name", "Name")}</p>
                </div>
              </div>
              <button type="button" onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-secondary/30 transition-colors"><X className="w-5 h-5 text-text-secondary" /></button>
            </div> */}
            <nav className="space-y-2">
              <NavLink to="/admin" icon={BarChart3}>{t("sidebar.dashboard", "Dashboard")}</NavLink>
              <NavLink to="/admin/users" icon={Users}>{t("sidebar.agents", "Agents")}</NavLink>
              <NavLink to="/admin/createPlan" icon={FilePlus}>{t("sidebar.createPlan", "Create Plan")}</NavLink>
              <NavLink to="/admin/createCase" icon={Layers}>{t("sidebar.createCase", "Create Case")}</NavLink>
              <NavLink to="/admin/cases" icon={FilePlus}>{t("sidebar.allCases", "All Cases")}</NavLink>
              <NavLink to="/admin/ledger" icon={Activity}>{t("sidebar.salesLedger", "Sales Ledger")}</NavLink>
              <NavLink to="/admin/Reconciliation" icon={ReceiptText}>{t("sidebar.reconciliation", "Reconciliation Table")}</NavLink>
              <NavLink to="/admin/activity-log" icon={Activity}>{t("sidebar.activityLog", "Activity Log")}</NavLink>
            </nav>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 lg:hidden bg-black/20" onClick={toggleSidebar}></div>
        )}

        {/* Main Content Rendered by the Router */}
        <main className="flex-1 overflow-auto p-4 lg:p-6 bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;