import { Outlet } from "react-router-dom";
import { RiderHeader } from "@/components/rider/RiderHeader";
import { RiderMobileNav } from "@/components/rider/RiderMobileNav";

const RiderLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <RiderHeader />
      
      <main className="flex-1 p-4 pb-20 md:pb-6 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>

      <RiderMobileNav />
    </div>
  );
};

export default RiderLayout;
