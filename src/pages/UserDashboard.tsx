// import React, { useState } from "react";
// import { 
//   TrendingUp, 
//   TrendingDown, 
//   Users, 
//   Calendar, 
//   DollarSign, 
//   Shield, 
//   Clock, 
//   CheckCircle, 
//   AlertCircle, 
//   BarChart3,
//   Eye,
//   MapPin,
//   Star
// } from "lucide-react";

// // Glassmorphism Card Component
// const GlassmorphismCard: React.FC<{ 
//   children: React.ReactNode; 
//   className?: string;
//   hover?: boolean;
// }> = ({ children, className = "", hover = true }) => {
//   return (
//     <div className={`backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl transition-all duration-300 ${
//       hover ? 'hover:bg-white/15 hover:border-white/30' : ''
//     } ${className}`}>
//       {children}
//     </div>
//   );
// };

// // Stat Card Component
// const StatCard: React.FC<{
//   title: string;
//   value: string;
//   change?: string;
//   trend?: 'up' | 'down';
//   icon: React.ElementType;
//   color: string;
// }> = ({ title, value, change, trend, icon: Icon, color }) => {
//   return (
//     <GlassmorphismCard className="p-6">
//       <div className="flex items-start justify-between">
//         <div className="flex-1">
//           <p className="text-white/70 text-sm font-medium mb-1">{title}</p>
//           <p className="text-white text-2xl font-bold mb-2">{value}</p>
//           {change && (
//             <div className={`flex items-center space-x-1 text-sm ${
//               trend === 'up' ? 'text-green-400' : 'text-red-400'
//             }`}>
//               {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
//               <span>{change}</span>
//             </div>
//           )}
//         </div>
//         <div className={`p-3 rounded-2xl ${color}`}>
//           <Icon className="w-6 h-6 text-white" />
//         </div>
//       </div>
//     </GlassmorphismCard>
//   );
// };

// const UserDashboard: React.FC = () => {
//   const [timeFilter, setTimeFilter] = useState('7d');

//   // Mock data
//   const recentBookings = [
//     {
//       id: "TS-10421",
//       destination: "Paris, France",
//       dates: "Apr 12 - Apr 20",
//       premium: "$320",
//       status: "active",
//       customer: "Emily Carter"
//     },
//     {
//       id: "TS-10420", 
//       destination: "London, UK",
//       dates: "Apr 08 - Apr 15",
//       premium: "$280",
//       status: "pending",
//       customer: "David Lee"
//     },
//     {
//       id: "TS-10419",
//       destination: "Tokyo, Japan", 
//       dates: "Apr 02 - Apr 10",
//       premium: "$410",
//       status: "completed",
//       customer: "Noah Patel"
//     },
//     {
//       id: "TS-10418",
//       destination: "Rome, Italy",
//       dates: "Mar 26 - Apr 03", 
//       premium: "$360",
//       status: "completed",
//       customer: "Sophia Nguyen"
//     }
//   ];

//   const quickActions = [
//     { name: "New Booking", icon: Calendar, color: "bg-blue-500/80" },
//     { name: "File Claim", icon: Shield, color: "bg-red-500/80" },
//     { name: "View Policies", icon: Eye, color: "bg-green-500/80" },
//     { name: "Support", icon: Users, color: "bg-purple-500/80" }
//   ];

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'active': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
//       case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
//       case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
//       default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
//     }
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
//         <p className="text-white/70">Welcome back! Here's your travel insurance overview.</p>
//       </div>

//       {/* Stats Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <StatCard
//           title="Active Policies"
//           value="12"
//           change="+2 this month"
//           trend="up"
//           icon={Shield}
//           color="bg-blue-500/80"
//         />
//         <StatCard
//           title="Total Coverage"
//           value="$45,000"
//           change="+8% increase"
//           trend="up" 
//           icon={DollarSign}
//           color="bg-green-500/80"
//         />
//         <StatCard
//           title="Pending Claims"
//           value="2"
//           change="1 new today"
//           trend="up"
//           icon={AlertCircle}
//           color="bg-yellow-500/80"
//         />
//         <StatCard
//           title="Satisfaction"
//           value="4.8★"
//           change="+0.2 improvement"
//           trend="up"
//           icon={Star}
//           color="bg-purple-500/80"
//         />
//       </div>

//       {/* Quick Actions */}
//       <GlassmorphismCard className="p-6">
//         <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//           {quickActions.map((action, index) => (
//             <button
//               key={index}
//               className="flex flex-col items-center p-4 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
//             >
//               <div className={`p-3 rounded-xl ${action.color} mb-3 group-hover:scale-110 transition-transform duration-300`}>
//                 <action.icon className="w-6 h-6 text-white" />
//               </div>
//               <span className="text-white/80 text-sm font-medium text-center">{action.name}</span>
//             </button>
//           ))}
//         </div>
//       </GlassmorphismCard>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Recent Bookings */}
//         <div className="lg:col-span-2">
//           <GlassmorphismCard className="p-6">
//             <div className="flex items-center justify-between mb-6">
//               <h2 className="text-xl font-semibold text-white">Recent Bookings</h2>
//               <div className="flex space-x-2">
//                 {['7d', '30d', '90d'].map((period) => (
//                   <button
//                     key={period}
//                     onClick={() => setTimeFilter(period)}
//                     className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
//                       timeFilter === period
//                         ? 'bg-blue-500/80 text-white'
//                         : 'bg-white/10 text-white/70 hover:bg-white/20'
//                     }`}
//                   >
//                     {period}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             <div className="space-y-4">
//               {recentBookings.map((booking) => (
//                 <div key={booking.id} className="flex items-center justify-between p-4 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
//                   <div className="flex items-center space-x-4">
//                     <div className="p-2 rounded-lg bg-blue-500/20">
//                       <MapPin className="w-5 h-5 text-blue-300" />
//                     </div>
//                     <div>
//                       <p className="text-white font-medium">{booking.destination}</p>
//                       <p className="text-white/60 text-sm">{booking.customer} • {booking.dates}</p>
//                     </div>
//                   </div>
//                   <div className="flex items-center space-x-4">
//                     <span className="text-white font-semibold">{booking.premium}</span>
//                     <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
//                       {booking.status}
//                     </span>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             <button className="w-full mt-4 p-3 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white/80 hover:text-white font-medium">
//               View All Bookings
//             </button>
//           </GlassmorphismCard>
//         </div>

//         {/* Activity & Notifications */}
//         <div className="space-y-6">
//           {/* Coverage Summary */}
//           <GlassmorphismCard className="p-6">
//             <h3 className="text-lg font-semibold text-white mb-4">Coverage Summary</h3>
//             <div className="space-y-4">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center space-x-3">
//                   <Shield className="w-5 h-5 text-blue-400" />
//                   <span className="text-white/80">Medical Coverage</span>
//                 </div>
//                 <span className="text-white font-semibold">$25,000</span>
//               </div>
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center space-x-3">
//                   <Calendar className="w-5 h-5 text-green-400" />
//                   <span className="text-white/80">Trip Cancellation</span>
//                 </div>
//                 <span className="text-white font-semibold">$15,000</span>
//               </div>
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center space-x-3">
//                   <DollarSign className="w-5 h-5 text-yellow-400" />
//                   <span className="text-white/80">Baggage Loss</span>
//                 </div>
//                 <span className="text-white font-semibold">$5,000</span>
//               </div>
//             </div>
//           </GlassmorphismCard>

//           {/* Recent Activity */}
//           <GlassmorphismCard className="p-6">
//             <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
//             <div className="space-y-3">
//               <div className="flex items-start space-x-3">
//                 <div className="p-1 rounded-full bg-green-500/20 mt-1">
//                   <CheckCircle className="w-4 h-4 text-green-400" />
//                 </div>
//                 <div>
//                   <p className="text-white/90 text-sm">Policy TS-10421 activated</p>
//                   <p className="text-white/60 text-xs">2 hours ago</p>
//                 </div>
//               </div>
//               <div className="flex items-start space-x-3">
//                 <div className="p-1 rounded-full bg-blue-500/20 mt-1">
//                   <Clock className="w-4 h-4 text-blue-400" />
//                 </div>
//                 <div>
//                   <p className="text-white/90 text-sm">Premium payment processed</p>
//                   <p className="text-white/60 text-xs">1 day ago</p>
//                 </div>
//               </div>
//               <div className="flex items-start space-x-3">
//                 <div className="p-1 rounded-full bg-yellow-500/20 mt-1">
//                   <AlertCircle className="w-4 h-4 text-yellow-400" />
//                 </div>
//                 <div>
//                   <p className="text-white/90 text-sm">Document verification pending</p>
//                   <p className="text-white/60 text-xs">3 days ago</p>
//                 </div>
//               </div>
//             </div>
//           </GlassmorphismCard>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default UserDashboard;