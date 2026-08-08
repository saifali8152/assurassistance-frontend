import { useState, useEffect, useRef } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Menu,
  X,
  ChevronDown,
  User,
  Lock,
  LogOut,
  BarChart3,
  Layers,
  Activity,
  UsersRound,
  ScrollText,
} from "lucide-react";
import LanguageSelector from "./LanguageSelector";
import CurrencySelector from "./CurrencySelector";
import { useTranslation } from "react-i18next"; // <-- Add this

const UserLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { t } = useTranslation(); // <-- Add this
  const { user, logout } = useAuth();

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

  useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  const NavLink = ({ to, icon: Icon, children }: { to: string, icon: React.ElementType, children: React.ReactNode }) => {
    const isActive =
      location.pathname === to ||
      (to !== "/user" && location.pathname.startsWith(`${to}/`));
    return (
      <Link
        to={to}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors w-full text-left text-sm ${isActive
          ? 'bg-[#E4590F]/10 text-[#E4590F] border border-[#E4590F]/30 font-medium'
          : 'hover:bg-secondary/30 text-text-secondary hover:text-[#E4590F] border border-transparent'
          }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="font-normal leading-snug">{children}</span>
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
              type="button"
              onClick={toggleSidebar}
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
              aria-expanded={sidebarOpen}
              className="lg:hidden p-2 rounded-lg bg-[#D9D9D9] border border-[#D9D9D9] hover:bg-[#B8B8B8] transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-text-secondary" />
              ) : (
                <Menu className="w-5 h-5 text-text-secondary" />
              )}
            </button>
            <div className="flex items-center">
              <img src='/full-logo.png' alt="AssureAssistance" className="h-8 sm:h-10 object-contain" />
            </div>
          </div>

          {/* Right side - Notifications and Profile */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center">
              <span className="text-[#2B2B2B]/60 text-xs capitalize font-normal px-3 py-1.5 bg-[#E4590F]/10 rounded-lg border border-[#E4590F]/20">
                {user?.role || "Agent"}
              </span>
            </div>
            <CurrencySelector />
            <LanguageSelector />
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className={`flex items-center space-x-2 p-1 rounded-full border-2 transition-all duration-200 cursor-pointer ${
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
                <ChevronDown
                  className={`w-4 h-4 text-text-secondary/60 transition-transform duration-200 hidden sm:block ${
                    profileDropdownOpen ? "rotate-180 text-[#E4590F]" : ""
                  }`}
                />
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
                        <p className="text-[#E4590F] text-xs font-normal capitalize mt-0.5">{user?.role || "Agent"}</p>
                      </div>
                    </div>
                  </div>
                  {/* Menu Items */}
                  <div className="py-2">
                    <Link to="/user/profile" onClick={() => setProfileDropdownOpen(false)} className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-secondary/30 transition-colors duration-150 text-text-secondary cursor-pointer"><User className="w-4 h-4 text-[#E4590F]" /> <span className="text-sm font-normal">{t("profile.profile", "Profile")}</span></Link>
                    <Link to="/user/edit-password" onClick={() => setProfileDropdownOpen(false)} className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-secondary/30 transition-colors duration-150 text-text-secondary cursor-pointer"><Lock className="w-4 h-4 text-[#E4590F]" /> <span className="text-sm font-normal">{t("profile.editPassword", "Edit Password")}</span></Link>
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

      <div className="flex h-[calc(100vh-4.5rem)] sm:h-[calc(100vh-4.75rem)] relative">
        {sidebarOpen && (
          <div
            className="fixed inset-0 top-[4.5rem] sm:top-[4.75rem] z-30 lg:hidden bg-black/40"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <aside
          className={`
            fixed lg:relative z-40
            top-[4.5rem] sm:top-[4.75rem] lg:top-0
            bottom-0 left-0
            w-[min(18rem,85vw)] lg:w-64
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          <div className="h-full flex flex-col bg-white border-r border-[#D9D9D9]">
            <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[#EEEEEE] shrink-0">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#1A1A1A] truncate">
                  {user?.name || t("user.name", "Name")}
                </p>
                <p className="text-xs text-text-secondary truncate capitalize">{user?.role || "Agent"}</p>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-secondary/30 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-2 pb-6 space-y-2">
              <div className="space-y-1">
                <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-text-secondary/70">
                  {t("sidebar.sectionOverview", "Overview")}
                </p>
                <div className="space-y-0.5">
                  <NavLink to="/user" icon={BarChart3}>{t("userLayout.dashboard", "Dashboard")}</NavLink>
                </div>
              </div>
              <div className="space-y-1">
                <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-text-secondary/70">
                  {t("sidebar.sectionOperations", "Operations")}
                </p>
                <div className="space-y-0.5">
                  <NavLink to="/user/createCase" icon={Layers}>{t("userLayout.createCase", "Create Case")}</NavLink>
                  <NavLink to="/user/createGroupCase" icon={UsersRound}>{t("userLayout.createGroupCase", "Create group case")}</NavLink>
                  <NavLink to="/user/cases" icon={Layers}>{t("userLayout.myCases", "My Cases")}</NavLink>
                </div>
              </div>
              <div className="space-y-1">
                <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-text-secondary/70">
                  {t("sidebar.sectionFinance", "Finance & reports")}
                </p>
                <div className="space-y-0.5">
                  <NavLink to="/user/ledger" icon={Activity}>{t("userLayout.salesLedger", "Sales Ledger")}</NavLink>
                </div>
              </div>
              <div className="space-y-1">
                <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-text-secondary/70">
                  {t("sidebar.sectionSystem", "System")}
                </p>
                <div className="space-y-0.5">
                  <NavLink to="/user/contractual-docs" icon={ScrollText}>
                    {t("sidebar.contractualDocs", "Contractual Documentation Download")}
                  </NavLink>
                </div>
              </div>
            </nav>
          </div>
        </aside>

        <main className="flex-1 min-w-0 overflow-auto p-4 lg:p-6 bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserLayout;