import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";

const AdminLayout = () => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <AdminSidebar />
        </div>

        <div className="flex flex-1 flex-col w-full">
          <AdminHeader />
          
          <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
            <Outlet />
          </main>

          {/* Mobile Bottom Navigation */}
          <div className="md:hidden">
            <AdminMobileNav />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
