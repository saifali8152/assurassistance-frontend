// import { useState, useEffect, useRef } from "react";
// import { Link, Outlet, useLocation } from "react-router-dom";
// import {
//   Bell,
//   Search,
//   Menu,
//   X,
//   Grid3X3,
//   ChevronDown,
//   User,
//   Lock,
//   LogOut,
//   Settings,
//   BarChart3,
//   Calendar,
//   Users,
//   DollarSign,
// } from "lucide-react";

// const UserLayout: React.FC = () => {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement>(null);
//   const location = useLocation();

//   const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setProfileDropdownOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   useEffect(() => {
//     setSidebarOpen(false);
//   }, [location.pathname]);

//   const NavLink = ({ to, icon: Icon, children }: { to: string, icon: React.ElementType, children: React.ReactNode }) => {
//     const isActive = location.pathname === to;
//     return (
//       <Link
//         to={to}
//         className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors w-full text-left ${
//           isActive
//             ? 'bg-blue-500/20 text-white'
//             : 'hover:bg-white/10 text-white/80 hover:text-white'
//         }`}
//       >
//         <Icon className="w-5 h-5" />
//         <span className="font-medium">{children}</span>
//       </Link>
//     );
//   };

//   return (
//     <div className="w-full h-screen fixed inset-0 overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
//       {/* Animated Background */}
//       <div className="absolute inset-0 opacity-10">
//         <div className="absolute top-4 left-4 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
//         <div className="absolute top-8 right-8 w-1 h-1 bg-white rounded-full animate-ping"></div>
//         <div className="absolute bottom-8 left-8 w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse"></div>
//         <div className="absolute bottom-4 right-4 w-2 h-2 bg-white rounded-full animate-ping"></div>
//       </div>

//       {/* Top Navbar */}
//       <nav className="relative z-50 backdrop-blur-xl bg-white/10 border-b border-white/20">
//         <div className="flex items-center justify-between px-4 py-3 lg:px-6">
//           {/* Left */}
//           <div className="flex items-center space-x-4">
//             <button
//               onClick={toggleSidebar}
//               className="lg:hidden p-2 rounded-lg backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
//             >
//               <Menu className="w-5 h-5 text-white" />
//             </button>
//             <div className="flex items-center space-x-3">
//               <div className="w-8 h-8 rounded-lg bg-blue-500/80 flex items-center justify-center">
//                 <Grid3X3 className="w-5 h-5 text-white" />
//               </div>
//               <span className="text-white font-semibold text-lg hidden sm:block">
//                 AssurAssistance (User)
//               </span>
//             </div>
//           </div>

//           {/* Center Search */}
//           <div className="hidden md:flex flex-1 max-w-md mx-8">
//             <div className="relative w-full">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
//               <input
//                 type="text"
//                 placeholder="Search..."
//                 className="w-full pl-10 pr-4 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
//               />
//             </div>
//           </div>

//           {/* Right */}
//           <div className="flex items-center space-x-3">
//             <button className="p-2 rounded-lg backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-colors relative">
//               <Bell className="w-5 h-5 text-white " />
//               <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
//             </button>

//             <div ref={dropdownRef} className="relative">
//               <button
//                 onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
//                 className={`flex items-center space-x-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl px-3 py-2 hover:bg-white/20 transition-all duration-200 cursor-pointer ${profileDropdownOpen ? "ring-2 ring-blue-400/50" : ""}`}
//               >
//                 <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face" alt="Profile" className="w-8 h-8 rounded-full" />
//                 <div className="hidden sm:block">
//                   <p className="text-white text-sm font-medium">Alex Johnson</p>
//                   <p className="text-white/60 text-xs">agent@travelsafe.io</p>
//                 </div>
//                 <ChevronDown className={`w-4 h-4 text-white/60 transition-transform duration-200 ${profileDropdownOpen ? "rotate-180" : ""}`} />
//               </button>

//               {profileDropdownOpen && (
//                 <div className="absolute right-0 mt-2 w-56 backdrop-blur-xl bg-[#1E2A3A]/90 border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden">
//                   <div className="py-2">
//                     <button className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-white/10 text-white"><User className="w-4 h-4" /> <span className="text-sm font-medium">Profile</span></button>
//                     <button className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-white/10 text-white"><Settings className="w-4 h-4" /> <span className="text-sm font-medium">Settings</span></button>
//                     <button className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-white/10 text-red-400 hover:text-red-300"><LogOut className="w-4 h-4" /> <span className="text-sm font-medium">Logout</span></button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </nav>

//       {/* Page Layout */}
//       <div className="flex h-[calc(100vh-73px)] relative">
//         {/* Sidebar */}
//         <aside className={`fixed lg:relative z-40 w-64 h-full transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
//           <div className="h-full backdrop-blur-xl bg-white/10 border-r border-white/20 p-4">
//             <div className="lg:hidden flex justify-end mb-4">
//               <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-white/20 transition-colors"><X className="w-5 h-5 text-white" /></button>
//             </div>
//             <nav className="space-y-2">
//               <NavLink to="/dashboard" icon={BarChart3}>Dashboard</NavLink>
//               <NavLink to="/bookings" icon={Calendar}>Bookings</NavLink>
//               <NavLink to="/customers" icon={Users}>Customers</NavLink>
//               <NavLink to="/earnings" icon={DollarSign}>Earnings</NavLink>
//             </nav>
//           </div>
//         </aside>

//         {sidebarOpen && (
//           <div className="fixed inset-0 z-30 lg:hidden bg-black/50" onClick={toggleSidebar}></div>
//         )}

//         {/* Main Content */}
//         <main className="flex-1 overflow-auto p-4 lg:p-6">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// };

// export default UserLayout;