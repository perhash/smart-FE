import { Home, DollarSign, User, Bell } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { NotificationDrawer } from "@/components/NotificationDrawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/contexts/NotificationContext";

export function RiderMobileNav() {
  const navItems = [
    { title: "", url: "/rider", icon: Home },
    // { title: "Payments", url: "/rider/payments", icon: DollarSign },
  ];

  const location = useLocation();
  const { unreadCount } = useNotifications();
  const isDashboard = location.pathname === '/rider';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/90 backdrop-blur-lg md:hidden shadow-2xl">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            end={item.url === "/rider"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-4 transition-colors ${
                isActive ? "text-cyan-600" : "text-gray-500"
              }`
            }
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs font-medium">{item.title}</span>
          </NavLink>
        ))}
        
        {/* Notification Icon */}
        <div className="relative p-4">
          <NotificationDrawer />
        </div>

        {/* User Profile Icon */}
        <NavLink
          to="/rider/profile"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 p-4 transition-colors ${
              isActive ? "text-cyan-600" : "text-gray-500"
            }`
          }
        >
          <User className="h-6 w-6" />
          <span className="text-xs font-medium">Profile</span>
        </NavLink>
      </div>
    </nav>
  );
}
