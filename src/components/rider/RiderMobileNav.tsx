import { Home, User, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { NotificationDrawer } from "@/components/NotificationDrawer";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function RiderMobileNav() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate('/login');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/90 backdrop-blur-lg md:hidden shadow-2xl">
      <div className="flex items-center justify-around">
        {/* Dashboard Button */}
        <NavLink
          to="/rider"
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 p-3 transition-colors ${
              isActive ? "text-cyan-600" : "text-gray-500"
            }`
          }
        >
          <Home className="h-6 w-6" />
          <span className="text-xs font-medium">Dashboard</span>
        </NavLink>
        
        {/* Notification Icon */}
        <div className="flex flex-col items-center gap-1 p-3">
          <div className="relative">
            <NotificationDrawer />
          </div>
          <span className="text-xs font-medium text-gray-500">Notifications</span>
        </div>

        {/* Profile Icon */}
        <NavLink
          to="/rider/profile"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 p-3 transition-colors ${
              isActive ? "text-cyan-600" : "text-gray-500"
            }`
          }
        >
          <User className="h-6 w-6" />
          <span className="text-xs font-medium">Profile</span>
        </NavLink>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 p-3 transition-colors text-gray-500 hover:text-red-600"
        >
          <LogOut className="h-6 w-6" />
          <span className="text-xs font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
}
