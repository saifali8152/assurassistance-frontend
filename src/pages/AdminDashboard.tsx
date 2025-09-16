import { useState, useEffect, useRef } from "react";
import {
  Bell,
  Search,
  Menu,
  X,
  BarChart3,
  Users,
  Settings,
  Grid3X3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  ChevronDown,
  User,
  Lock,
  LogOut
} from "lucide-react";


const AdminDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
                className={`
      flex items-center space-x-3 backdrop-blur-xl bg-white/10 border border-white/20 
      rounded-xl px-3 py-2 hover:bg-white/20 transition-all duration-200 cursor-pointer
      ${profileDropdownOpen ? "ring-2 ring-blue-400/50" : ""}
    `}
              >
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
                <div className="hidden sm:block">
                  <p className="text-white text-sm font-medium">Sam Carter</p>
                  <p className="text-white/60 text-xs">sam@travelsafe.io</p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-white/60 transition-transform duration-200 ${profileDropdownOpen ? "rotate-180" : ""
                    }`}
                />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 backdrop-blur-xl bg-[#1E2A3A]/90 border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-white/10 transition-colors duration-150 text-white"
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm font-medium">Profile</span>
                    </button>

                    <button
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-white/10 transition-colors duration-150 text-white"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-sm font-medium">Settings</span>
                    </button>

                    <button
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-white/10 transition-colors duration-150 text-white"
                    >
                      <Lock className="w-4 h-4" />
                      <span className="text-sm font-medium">Change Password</span>
                    </button>

                    <button
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-white/10 transition-colors duration-150 text-white"
                    >
                      <Bell className="w-4 h-4" />
                      <span className="text-sm font-medium">Notifications</span>
                    </button>

                    <button
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-white/10 transition-colors duration-150 text-red-400 hover:text-red-300"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-73px)] relative">
        {/* Left Sidebar */}
        <aside className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          fixed lg:relative z-40 w-64 h-full transition-transform duration-300 ease-in-out
        `}>
          <div className="h-full backdrop-blur-xl bg-white/10 border-r border-white/20 p-4">
            {/* Close button for mobile */}
            <div className="lg:hidden flex justify-end mb-4">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <nav className="space-y-2">
              <a href="#" className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-blue-500/20 text-white">
                <BarChart3 className="w-5 h-5" />
                <span className="font-medium">Dashboard</span>
              </a>

              <a href="#" className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors">
                <Activity className="w-5 h-5" />
                <span className="font-medium">Analytics</span>
              </a>

              <a href="#" className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors">
                <Users className="w-5 h-5" />
                <span className="font-medium">Users</span>
              </a>

              <a href="#" className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
                <span className="font-medium">Settings</span>
              </a>
            </nav>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 lg:hidden bg-black/50"
            onClick={toggleSidebar}
          ></div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
            {/* Total Sales Card */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl transition-all duration-300 ease-in-out 
     hover:shadow-md hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
                <span className="text-green-400 text-sm font-medium flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  12.4%
                </span>
              </div>
              <h3 className="text-white/60 text-sm font-medium mb-1">Total Sales</h3>
              <p className="text-white text-2xl font-bold">$248,900</p>
              <p className="text-white/40 text-xs mt-1">vs last 30 days</p>
            </div>

            {/* Gross Collected Card */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl transition-all duration-300 ease-in-out 
     hover:shadow-md hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Activity className="w-6 h-6 text-blue-400" />
                </div>
                <span className="text-white/60 text-sm font-medium">-</span>
              </div>
              <h3 className="text-white/60 text-sm font-medium mb-1">Gross Collected</h3>
              <p className="text-white text-2xl font-bold">$198,320</p>
              <p className="text-white/40 text-xs mt-1">settlements received</p>
            </div>

            {/* Unpaid Balance Card */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl transition-all duration-300 ease-in-out 
     hover:shadow-md hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <TrendingDown className="w-6 h-6 text-red-400" />
                </div>
                <span className="text-red-400 text-sm font-medium flex items-center">
                  <TrendingDown className="w-4 h-4 mr-1" />
                  4.1%
                </span>
              </div>
              <h3 className="text-white/60 text-sm font-medium mb-1">Unpaid Balance</h3>
              <p className="text-white text-2xl font-bold">$34,780</p>
              <p className="text-white/40 text-xs mt-1">open invoices</p>
            </div>

            {/* Active Users Card */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl transition-all duration-300 ease-in-out 
     hover:shadow-md hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Users className="w-6 h-6 text-green-400" />
                </div>
                <span className="text-green-400 text-sm font-medium flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  2.3%
                </span>
              </div>
              <h3 className="text-white/60 text-sm font-medium mb-1">Active Users</h3>
              <p className="text-white text-2xl font-bold">8,214</p>
              <p className="text-white/40 text-xs mt-1">last 7 days</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
            {/* Sales Trend Chart */}
            <div className="lg:col-span-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white text-lg font-semibold">Sales Trend (12 months)</h3>
                <span className="text-blue-400 text-sm px-3 py-1 rounded-full bg-blue-500/20">Line</span>
              </div>
              <div className="h-64 flex items-center justify-center bg-gradient-to-r from-blue-900/20 to-slate-800/20 rounded-xl">
                <p className="text-white/60">Chart visualization would go here</p>
              </div>
              <div className="flex justify-between text-white/60 text-sm mt-4">
                <span>Jan</span>
                <span>Apr</span>
                <span>Jul</span>
                <span>Oct</span>
              </div>
            </div>

            {/* Product Mix Breakdown */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-white text-lg font-semibold mb-6">Product Mix Breakdown</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/80">Basic</span>
                    <span className="text-white/60">28%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="bg-gray-400 h-2 rounded-full" style={{ width: '28%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/80">Standard</span>
                    <span className="text-white/60">34%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="bg-blue-400 h-2 rounded-full" style={{ width: '34%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/80">Premium</span>
                    <span className="text-white/60">22%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="bg-green-400 h-2 rounded-full" style={{ width: '22%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/80">Family</span>
                    <span className="text-white/60">16%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="bg-cyan-400 h-2 rounded-full" style={{ width: '16%' }}></div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-6 text-xs">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                  <span className="text-white/60">Basic</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  <span className="text-white/60">Standard</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-white/60">Premium</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full mr-2"></div>
                  <span className="text-white/60">Family</span>
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-white text-lg font-semibold mb-6">Recent Users</h3>
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="text-white/60 text-sm">
                    <th className="text-left pb-4">User</th>
                    <th className="text-left pb-4">Sales</th>
                    <th className="text-left pb-4">Gross Collected</th>
                    <th className="text-left pb-4">Unpaid Balance</th>
                    <th className="text-left pb-4">Last Activity</th>
                  </tr>
                </thead>
                <tbody className="text-white text-left">
                  <tr className="border-t border-white/10">
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face"
                          alt="Alex Morgan"
                          className="w-8 h-8 rounded-full"
                        />
                        <span>Alex Morgan</span>
                      </div>
                    </td>
                    <td className="py-4">$24,890</td>
                    <td className="py-4">$21,440</td>
                    <td className="py-4 text-red-400">-$1,230</td>
                    <td className="py-4 text-white/60">2h ago</td>
                  </tr>

                  <tr className="border-t border-white/10">
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src="https://images.unsplash.com/photo-1494790108755-2616b612b043?w=32&h=32&fit=crop&crop=face"
                          alt="Priya Shah"
                          className="w-8 h-8 rounded-full"
                        />
                        <span>Priya Shah</span>
                      </div>
                    </td>
                    <td className="py-4">$18,220</td>
                    <td className="py-4">$16,010</td>
                    <td className="py-4 text-red-400">-$980</td>
                    <td className="py-4 text-white/60">5h ago</td>
                  </tr>

                  <tr className="border-t border-white/10">
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=32&h=32&fit=crop&crop=face"
                          alt="Diego Ramos"
                          className="w-8 h-8 rounded-full"
                        />
                        <span>Diego Ramos</span>
                      </div>
                    </td>
                    <td className="py-4">$15,730</td>
                    <td className="py-4">$13,450</td>
                    <td className="py-4 text-red-400">-$620</td>
                    <td className="py-4 text-white/60">1d ago</td>
                  </tr>

                  <tr className="border-t border-white/10">
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=32&h=32&fit=crop&crop=face"
                          alt="Mai Nguyen"
                          className="w-8 h-8 rounded-full"
                        />
                        <span>Mai Nguyen</span>
                      </div>
                    </td>
                    <td className="py-4">$12,310</td>
                    <td className="py-4">$10,980</td>
                    <td className="py-4 text-red-400">-$410</td>
                    <td className="py-4 text-white/60">2d ago</td>
                  </tr>

                  <tr className="border-t border-white/10">
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"
                          alt="Owen Lee"
                          className="w-8 h-8 rounded-full"
                        />
                        <span>Owen Lee</span>
                      </div>
                    </td>
                    <td className="py-4">$9,840</td>
                    <td className="py-4">$8,300</td>
                    <td className="py-4 text-red-400">-$290</td>
                    <td className="py-4 text-white/60">3d ago</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        @keyframes fly {
          0% {
            transform: translateX(-100px);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          90% {
            opacity: 0.3;
          }
          100% {
            transform: translateX(calc(100vw + 100px));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;