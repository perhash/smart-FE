import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, TruckIcon, Package, DollarSign, Plus, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CreateOrderDialog } from "@/components/admin/CreateOrderDialog";
import { AddCustomerDialog } from "@/components/admin/AddCustomerDialog";
import { ClearBillDialog } from "@/components/admin/ClearBillDialog";
import { apiService } from "@/services/api";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Droplet } from "lucide-react";
import { formatPktRelativeTime, formatPktDateTime12Hour } from "@/utils/timezone";
import { supabase } from "@/lib/supabase";

const AdminDashboard = () => {
  const { user } = useAuth();
  const adminName = (user as any)?.profile?.name || "Admin";

  const [stats, setStats] = useState([
    {
      title: "Total Customers",
      value: "0",
      icon: Users,
      trend: "Loading...",
      color: "text-primary",
    },
    {
      title: "Total Riders",
      value: "0",
      icon: TruckIcon,
      trend: "Loading...",
      color: "text-success",
    },
    {
      title: "Orders Today",
      value: "0",
      icon: Package,
      trend: "Loading...",
      color: "text-warning",
    },
    {
      title: "Pending Payments",
      value: "RS. 0",
      icon: DollarSign,
      trend: "Loading...",
      color: "text-destructive",
    },
  ]);

  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsResponse, activitiesResponse] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getRecentActivities()
        ]);

        if ((statsResponse as any).success) {
          const statsData = (statsResponse as any).data;
          setStats([
            {
              title: "Total Customers",
              value: statsData.totalCustomers.toString(),
              icon: Users,
              trend: "+12 this month",
              color: "text-primary",
            },
            {
              title: "Total Riders",
              value: statsData.totalRiders.toString(),
              icon: TruckIcon,
              trend: "3 active now",
              color: "text-success",
            },
            {
              title: "Orders Today",
              value: statsData.ordersToday.toString(),
              icon: Package,
              trend: `${statsData.pendingOrders} pending`,
              color: "text-warning",
            },
            {
              title: "Pending Payments",
              value: `RS. ${statsData.pendingPayments}`,
              icon: DollarSign,
              trend: "From customers",
              color: "text-destructive",
            },
          ]);
        }

        if ((activitiesResponse as any).success) {
          // Format activity times in PKT with relative time
          const activities = (activitiesResponse as any).data.map((activity: any) => ({
            ...activity,
            time: activity.time ? formatPktRelativeTime(activity.time) : 'Unknown time'
          }));
          setRecentActivities(activities);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Keep mock data on error
        setStats([
          {
            title: "Total Customers",
            value: "245",
            icon: Users,
            trend: "+12 this month",
            color: "text-primary",
          },
          {
            title: "Total Riders",
            value: "18",
            icon: TruckIcon,
            trend: "3 active now",
            color: "text-success",
          },
          {
            title: "Orders Today",
            value: "47",
            icon: Package,
            trend: "12 pending",
            color: "text-warning",
          },
          {
            title: "Pending Payments",
            value: "RS. 12,450",
            icon: DollarSign,
            trend: "From 23 customers",
            color: "text-destructive",
          },
        ]);
        // Format mock activities with PKT time if needed
        setRecentActivities([
          { id: 1, text: "New order #1234 from Ramesh Kumar", time: "2 mins ago", status: "new" },
          { id: 2, text: "Payment received RS. 500 from Priya Sharma", time: "15 mins ago", status: "success" },
          { id: 3, text: "Rider Ali completed 3 deliveries", time: "1 hour ago", status: "info" },
          { id: 4, text: "New customer added: Vikram Singh", time: "2 hours ago", status: "new" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Set up Supabase real-time subscription for orders
    const channel = supabase
      .channel('dashboard-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('Order change detected on dashboard:', payload);
          
          // Refetch dashboard data when orders change
          fetchDashboardData();
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Cleanup subscription on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const getActivityIcon = (status: string) => {
    switch (status) {
      case 'success':
        return DollarSign;
      case 'new':
        return Package;
      case 'info':
        return TruckIcon;
      default:
        return Package;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-600';
      case 'new':
        return 'bg-blue-100 text-blue-600';
      case 'info':
        return 'bg-cyan-100 text-cyan-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Top Section - Blue Gradient Header */}
        <div className="bg-gradient-to-br from-cyan-900 via-cyan-500 to-cyan-900 p-6">
          {/* Welcome Section */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Droplet className="h-8 w-8 text-cyan-600" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome back</h1>
              <p className="text-white/90">{adminName}</p>
            </div>
          </div>

          {/* 4 Metrics - Grid */}
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => (
              <div key={stat.title} className="bg-white/20 backdrop-blur-sm rounded-3xl p-4 border border-white/30">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <stat.icon className={`h-8 w-8 text-white mb-2`} />
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                  <p className="text-xs text-white/80">{stat.title}</p>
                  <p className="text-xs text-white/70 mt-1">{stat.trend}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* White Section Below */}
        <div className="bg-white rounded-t-3xl -mt-5 p-6">
          {/* 3 Buttons in One Row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <CreateOrderDialog trigger={
              <Button className="h-14 flex-col gap-1">
                <Plus className="h-5 w-5" />
                <span className="text-xs">Create Order</span>
              </Button>
            } />
            <ClearBillDialog trigger={
              <Button variant="outline" className="h-14 flex-col gap-1">
                <Receipt className="h-5 w-5" />
                <span className="text-xs">Clear Bill</span>
              </Button>
            } />
            <AddCustomerDialog trigger={
              <Button variant="outline" className="h-14 flex-col gap-1">
                <Plus className="h-5 w-5" />
                <span className="text-xs">Add Customer</span>
              </Button>
            } />
          </div>

          {/* Recent Activities */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-900">Recent Activities</h2>

            <div className="space-y-3">
              {recentActivities.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No recent activities</p>
                </div>
              ) : (
                recentActivities.map((activity: any) => {
                  const Icon = getActivityIcon(activity.status);
                  const bgColor = getActivityColor(activity.status);

                  return (
                    <div key={activity.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                            {activity.text}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {activity.time}
                            {activity.date && (
                              <span className="ml-1 text-gray-400">
                                • {activity.date}
                              </span>
                            )}
                          </p>
                        </div>
                        <Badge variant={activity.status === "success" ? "default" : activity.status === "new" ? "secondary" : "outline"}>
                          {activity.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Expanded Version */}
      <div className="hidden md:block max-w-7xl mx-auto px-6">
        {/* Top Section - Blue Gradient Header */}
        <div className="bg-gradient-to-br from-cyan-900 via-cyan-500 to-cyan-900 p-8 shadow-2xl rounded-3xl mb-8">
          {/* Welcome Section */}
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl">
              <Droplet className="h-12 w-12 text-cyan-600" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Welcome back, {adminName}</h1>
            </div>
          </div>

          {/* 4 Metrics - Expanded for Desktop */}
          <div className="grid grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.title} className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 border border-white/30">
                <div className="flex flex-col">
                  <div className="w-16 h-16 bg-white/30 rounded-2xl flex items-center justify-center mb-3">
                    <stat.icon className={`h-8 w-8 text-white`} />
                  </div>
                  <p className="text-4xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-white/80 mt-2">{stat.title}</p>
                  <p className="text-xs text-white/70 mt-1">{stat.trend}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section - White Background */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-cyan-100">
          {/* 3 Buttons - Centered */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <CreateOrderDialog />
            <ClearBillDialog />
            <AddCustomerDialog trigger={
              <Button variant="outline" size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Add Customer
              </Button>
            } />
          </div>

          {/* Recent Activities */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Package className="h-6 w-6 text-cyan-600" />
              <h2 className="text-2xl font-bold text-gray-900">Recent Activities</h2>
            </div>
 
            <div className="grid gap-4 md:grid-cols-2 max-h-[250px] overflow-y-auto pr-2">
              {recentActivities.length === 0 ? (
                <div className="col-span-2 text-center py-12">
                  <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No recent activities</p>
                </div>
              ) : (
                recentActivities.map((activity: any) => {
                  const Icon = getActivityIcon(activity.status);
                  const bgColor = getActivityColor(activity.status);

                  return (
                    <div key={activity.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 ${bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                              {activity.text}
                            </p>
                            <Badge variant={activity.status === "success" ? "default" : activity.status === "new" ? "secondary" : "outline"}>
                              {activity.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">
                            {activity.time}
                            {activity.date && (
                              <span className="ml-1 text-gray-400">
                                • {activity.date}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
