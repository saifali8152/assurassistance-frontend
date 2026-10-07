import { useState, useEffect, useRef, Children, type ReactNode } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Menu,
  X,
  BarChart3,
  Users,
  User,
  Lock,
  LogOut,
  FilePlus,
  Activity,
  Layers,
  ReceiptText,
  UsersRound,
  GitBranch,
  Shield,
  Globe2,
  Building2,
  ScrollText,
  Landmark,
  MessageCircle,
  Map,
  MessagesSquare,
  KeyRound,
  Wallet,
  Receipt,
} from "lucide-react";
import LanguageSelector from "./LanguageSelector";
import CurrencySelector from "./CurrencySelector";
import { useTranslation } from "react-i18next";

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { t } = useTranslation();

  const toggleSidebar = () => setSidebarOpen((open) => !open);
  const closeSidebar = () => setSidebarOpen(false);

  const isAdmin = user?.role === "admin";
  const isSubAdmin = user?.role === "sub_admin";
  const isInsurerSupervisor = user?.role === "insurer_supervisor";
  const isStaff = isAdmin || isSubAdmin || isInsurerSupervisor;

  const roleLabel = (() => {
    if (!user?.role) return t("role.admin", "Admin");
    if (user.role === "sub_admin") return t("role.subAdmin", "Sub-administrator");
    if (user.role === "insurer_supervisor") {
      const key = (user as { partner_insurer?: string | null }).partner_insurer;
      const base = t("role.insurerSupervisor", "Insurer supervisor");
      return key ? `${base} (${String(key).toUpperCase()})` : base;
    }
    if (user.role === "admin") return t("role.admin", "Admin");
    return t("role.agent", "Agent");
  })();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile sidebar on navigation / resize to desktop
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  const NavLink = ({
    to,
    icon: Icon,
    children,
  }: {
    to: string;
    icon: React.ElementType;
    children: React.ReactNode;
  }) => {
    const isActive =
      location.pathname === to ||
      (to !== "/admin" && location.pathname.startsWith(`${to}/`));
    return (
      <Link
        to={to}
        onClick={closeSidebar}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors w-full text-left text-sm ${
          isActive
            ? "bg-[#E4590F]/10 text-[#E4590F] border border-[#E4590F]/30 font-medium"
            : "hover:bg-secondary/30 text-text-secondary hover:text-[#E4590F] border border-transparent"
        }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="font-normal leading-snug">{children}</span>
      </Link>
    );
  };

  const NavSection = ({ title, children }: { title: string; children: ReactNode }) => {
    const items = Children.toArray(children).filter(Boolean);
    if (items.length === 0) return null;
    return (
      <div className="space-y-1">
        <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-text-secondary/70">
          {title}
        </p>
        <div className="space-y-0.5">{items}</div>
      </div>
    );
  };

  return (
    <div className="w-full h-screen fixed inset-0 overflow-hidden bg-white">
      {/* Top Navigation Bar */}
      <nav className="relative z-50 bg-white border-b border-[#D9D9D9]">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
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
              <img
                src="/full-logo.png"
                alt="AssureAssistance"
                className="h-8 sm:h-10 object-contain"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center">
              <span className="text-[#2B2B2B]/60 text-xs font-normal px-3 py-1.5 bg-[#E4590F]/10 rounded-lg border border-[#E4590F]/20">
                {roleLabel}
              </span>
            </div>
            <CurrencySelector />
            <LanguageSelector />

            <div ref={dropdownRef} className="relative">
              <button
                type="button"
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
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-[#D9D9D9] rounded-2xl z-50 overflow-hidden animate-fadeIn">
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
                        <p className="text-text-secondary text-sm font-medium truncate">
                          {user?.name || t("user.name", "Name")}
                        </p>
                        <p className="text-text-secondary/60 text-xs font-normal truncate">
                          {user?.email || t("user.email", "Email")}
                        </p>
                        <p className="text-[#E4590F] text-xs font-normal mt-0.5">{roleLabel}</p>
                      </div>
                    </div>
                  </div>
                  <div className="py-2">
                    <Link
                      to="/admin/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-secondary/30 transition-colors duration-150 text-text-secondary cursor-pointer"
                    >
                      <User className="w-4 h-4 text-[#E4590F]" />
                      <span className="text-sm font-normal">{t("profile.profile", "Profile")}</span>
                    </Link>
                    <Link
                      to="/admin/change-password"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-secondary/30 transition-colors duration-150 text-text-secondary cursor-pointer"
                    >
                      <Lock className="w-4 h-4 text-[#E4590F]" />
                      <span className="text-sm font-normal">
                        {t("profile.changePassword", "Change Password")}
                      </span>
                    </Link>
                    <div className="border-t border-[#D9D9D9] my-1" />
                    <button
                      type="button"
                      onClick={async () => {
                        setProfileDropdownOpen(false);
                        await logout();
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-secondary/30 transition-colors duration-150 text-red-600 hover:text-red-700 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-normal">{t("profile.logout", "Logout")}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-4.5rem)] sm:h-[calc(100vh-4.75rem)] relative">
        {/* Mobile overlay — sits under the drawer, above page content */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 top-[4.5rem] sm:top-[4.75rem] z-30 lg:hidden bg-black/40"
            onClick={closeSidebar}
            aria-hidden="true"
          />
        )}

        {/* Sidebar: drawer on mobile, static column on desktop */}
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
            {/* Mobile drawer header */}
            <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[#EEEEEE] shrink-0">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#1A1A1A] truncate">
                  {user?.name || t("user.name", "Name")}
                </p>
                <p className="text-xs text-text-secondary truncate">{roleLabel}</p>
              </div>
              <button
                type="button"
                onClick={closeSidebar}
                className="p-2 rounded-lg hover:bg-secondary/30 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            {/* Scrollable nav sections */}
            <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-2 pb-6 space-y-2">
              <NavSection title={t("sidebar.sectionOverview", "Overview")}>
                {isAdmin && (
                  <NavLink to="/admin" icon={BarChart3}>
                    {t("sidebar.dashboard", "Dashboard")}
                  </NavLink>
                )}
              </NavSection>

              <NavSection title={t("sidebar.sectionPeople", "People & partners")}>
                <NavLink to="/admin/users" icon={Users}>
                  {t("sidebar.agents", "Agents")}
                </NavLink>
                {isAdmin && (
                  <NavLink to="/admin/sub-admins" icon={Shield}>
                    {t("sidebar.subAdmins", "Sub-administrators")}
                  </NavLink>
                )}
                {isAdmin && (
                  <NavLink to="/admin/insurer-supervisors" icon={Landmark}>
                    {t("sidebar.insurerSupervisors", "Insurer supervisors")}
                  </NavLink>
                )}
                {isAdmin && (
                  <NavLink to="/admin/agent-hierarchy" icon={GitBranch}>
                    {t("sidebar.agentHierarchy", "Agent hierarchy")}
                  </NavLink>
                )}
                {isAdmin && (
                  <NavLink to="/admin/partners" icon={Building2}>
                    {t("sidebar.partnersByType", "Partners by type")}
                  </NavLink>
                )}
              </NavSection>

              <NavSection title={t("sidebar.sectionOperations", "Operations")}>
                {isAdmin && (
                  <NavLink to="/admin/createPlan" icon={FilePlus}>
                    {t("sidebar.createPlan", "Create Plan")}
                  </NavLink>
                )}
                {isStaff && (
                  <NavLink to="/admin/createCase" icon={Layers}>
                    {t("sidebar.createCase", "Create Case")}
                  </NavLink>
                )}
                {isStaff && (
                  <NavLink to="/admin/createGroupCase" icon={UsersRound}>
                    {t("sidebar.createGroupCase", "Create group case")}
                  </NavLink>
                )}
                <NavLink to="/admin/cases" icon={FilePlus}>
                  {t("sidebar.allCases", "All Cases")}
                </NavLink>
              </NavSection>

              <NavSection title={t("sidebar.sectionFinance", "Finance & reports")}>
                <NavLink to="/admin/ledger" icon={Activity}>
                  {t("sidebar.salesLedger", "Sales Ledger")}
                </NavLink>
                <NavLink to="/admin/invoices-by-region" icon={Globe2}>
                  {t("sidebar.invoicesByRegion", "Invoices by region")}
                </NavLink>
                {(isAdmin || isSubAdmin) && (
                  <NavLink to="/admin/partner-invoices" icon={ReceiptText}>
                    {t("sidebar.partnerInvoices", "Partner invoices")}
                  </NavLink>
                )}
                {isAdmin && (
                  <NavLink to="/admin/Reconciliation" icon={ReceiptText}>
                    {t("sidebar.reconciliation", "Reconciliation Table")}
                  </NavLink>
                )}
              </NavSection>

              <NavSection title={t("sidebar.sectionSystem", "System")}>
                <NavLink to="/admin/contractual-docs" icon={ScrollText}>
                  {t("sidebar.contractualDocs", "Contractual Documentation Download")}
                </NavLink>
                {isAdmin && (
                  <NavLink to="/admin/activity-log" icon={Activity}>
                    {t("sidebar.activityLog", "Activity Log")}
                  </NavLink>
                )}
                {isAdmin && (
                  <NavLink to="/admin/whatsapp-settings" icon={MessageCircle}>
                    {t("sidebar.whatsappSettings", "WhatsApp Settings")}
                  </NavLink>
                )}
                {isAdmin && (
                  <NavLink to="/admin/whatsapp-conversations" icon={MessagesSquare}>
                    {t("sidebar.whatsappConversations", "WhatsApp Conversations")}
                  </NavLink>
                )}
                {isAdmin && (
                  <NavLink to="/admin/destination-zones" icon={Map}>
                    {t("sidebar.destinationZones", "Destination Zones")}
                  </NavLink>
                )}
                {isAdmin && (
                  <NavLink to="/admin/api-keys" icon={KeyRound}>
                    {t("sidebar.apiKeys", "API Keys")}
                  </NavLink>
                )}
                {isAdmin && (
                  <NavLink to="/admin/payments" icon={Receipt}>
                    {t("sidebar.payments", "Payments")}
                  </NavLink>
                )}
                {isAdmin && (
                  <NavLink to="/admin/payment-settings" icon={Wallet}>
                    {t("sidebar.paymentSettings", "Payment Settings")}
                  </NavLink>
                )}
              </NavSection>
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

export default Layout;
