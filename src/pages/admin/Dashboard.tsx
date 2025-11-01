import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, TruckIcon, Package, DollarSign, Plus, Receipt, Calendar, Wallet, CheckCircle, AlertTriangle, ArrowRight, Wallet as WalletIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CreateOrderDialog } from "@/components/admin/CreateOrderDialog";
import { AddCustomerDialog } from "@/components/admin/AddCustomerDialog";
import { ClearBillDialog } from "@/components/admin/ClearBillDialog";
import { CloseCounterDialog } from "@/components/admin/CloseCounterDialog";
import { apiService } from "@/services/api";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Droplet } from "lucide-react";
import { formatPktRelativeTime, formatPktDateTime12Hour, formatPktTime12Hour } from "@/utils/timezone";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const adminName = (user as any)?.profile?.name || "Admin";

  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dailySummary, setDailySummary] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setLoadingSummary(true);
        const [activitiesResponse, summaryResponse] = await Promise.all([
          apiService.getRecentActivities(),
          apiService.getDailyClosingSummary()
        ]);

        if ((activitiesResponse as any).success) {
          // Format activity times in PKT with relative time and add formatted deliveredAt
          const activities = (activitiesResponse as any).data.map((activity: any) => ({
            ...activity,
            time: activity.time ? formatPktRelativeTime(activity.time) : 'Unknown time',
            deliveredAtFormatted: activity.deliveredAt ? formatPktTime12Hour(activity.deliveredAt) : null
          }));
          setRecentActivities(activities);
        }

        if ((summaryResponse as any).success) {
          setDailySummary((summaryResponse as any).data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setRecentActivities([]);
      } finally {
        setLoading(false);
        setLoadingSummary(false);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleReceivableClick = () => {
    navigate('/admin/customers?filter=receivable');
  };

  const handlePayableClick = () => {
    navigate('/admin/customers?filter=payable');
  };

  const handleBadgeClick = () => {
    setCloseDialogOpen(true);
  };

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Top Section - Blue Gradient Header */}
        <div className="bg-gradient-to-br from-cyan-900 via-cyan-500 to-cyan-900 p-6">
          {/* Welcome Section */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Droplet className="h-8 w-8 text-cyan-600" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome back</h1>
              <p className="text-white/90">{adminName}</p>
            </div>
          </div>

          {/* Badge Section - Ready to Close / Orders in Progress */}
          {loadingSummary ? (
            <div className="mb-4 bg-white/10 backdrop-blur-sm rounded-3xl p-4 border border-white/30">
              <div className="flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
                <p className="ml-2 text-sm text-white/80">Loading status...</p>
              </div>
            </div>
          ) : dailySummary && (
            <div 
              onClick={handleBadgeClick}
              className={`mb-4 rounded-3xl p-4 border-2 shadow-lg transition-all active:scale-[0.98] ${
                dailySummary.canClose 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 border-white/50 cursor-pointer hover:from-emerald-600 hover:to-green-600' 
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 border-white/50 cursor-pointer hover:from-orange-600 hover:to-amber-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {dailySummary.canClose ? (
                    <CheckCircle className="h-6 w-6 text-white" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-white" />
                  )}
                  <div>
                    <p className="text-lg font-bold text-white">
                      {dailySummary.canClose ? 'Ready to Close' : 'Orders in Progress'}
                    </p>
                    <p className="text-xs text-white/90">
                      {dailySummary.canClose 
                        ? 'Tap to close counter' 
                        : `${dailySummary.inProgressOrdersCount || 0} order${(dailySummary.inProgressOrdersCount || 0) !== 1 ? 's' : ''} pending`
                      }
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-white" />
              </div>
            </div>
          )}

          {/* Today's Progress Cards */}
          {loadingSummary ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white/20 backdrop-blur-sm rounded-3xl p-4 border border-white/30">
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  </div>
                </div>
              ))}
            </div>
          ) : dailySummary ? (
            <>
              {/* Row 1: Receivable & Payable (Clickable) */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div 
                  onClick={handleReceivableClick}
                  className="bg-white/20 backdrop-blur-sm rounded-3xl p-4 border-2 border-white/50 cursor-pointer active:scale-[0.98] transition-all hover:bg-white/30"
                >
                  <div className="flex flex-col items-start">
                    <WalletIcon className="h-6 w-6 text-white mb-2" />
                    <p className="text-xs text-white/80 mb-1">Receivable</p>
                    <p className="text-2xl font-bold text-white">RS. {formatCurrency(dailySummary.customerReceivable || 0)}</p>
                    <p className="text-xs text-white/70 mt-1 flex items-center gap-1">
                      Tap to view <ArrowRight className="h-3 w-3" />
                    </p>
                  </div>
                </div>
                <div 
                  onClick={handlePayableClick}
                  className="bg-white/20 backdrop-blur-sm rounded-3xl p-4 border-2 border-white/50 cursor-pointer active:scale-[0.98] transition-all hover:bg-white/30"
                >
                  <div className="flex flex-col items-start">
                    <WalletIcon className="h-6 w-6 text-white mb-2" />
                    <p className="text-xs text-white/80 mb-1">Payable</p>
                    <p className="text-2xl font-bold text-white">RS. {formatCurrency(dailySummary.customerPayable || 0)}</p>
                    <p className="text-xs text-white/70 mt-1 flex items-center gap-1">
                      Tap to view <ArrowRight className="h-3 w-3" />
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 2: Orders & Bottles */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-4 border border-white/30">
                  <div className="flex flex-col">
                    <Package className="h-6 w-6 text-white mb-2" />
                    <p className="text-xs text-white/80 mb-1">Orders</p>
                    <p className="text-2xl font-bold text-white">{dailySummary.totalOrders || 0}</p>
                    <p className="text-xs text-white/70 mt-1">Today</p>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-4 border border-white/30">
                  <div className="flex flex-col">
                    <Droplet className="h-6 w-6 text-white mb-2" fill="currentColor" />
                    <p className="text-xs text-white/80 mb-1">Bottles</p>
                    <p className="text-2xl font-bold text-white">{dailySummary.totalBottles || 0}</p>
                    <p className="text-xs text-white/70 mt-1">Today</p>
                  </div>
                </div>
              </div>

              {/* Row 3: Order Amount & Paid Amount */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-4 border border-white/30">
                  <div className="flex flex-col">
                    <DollarSign className="h-6 w-6 text-white mb-2" />
                    <p className="text-xs text-white/80 mb-1">Order Amount</p>
                    <p className="text-2xl font-bold text-white">RS. {formatCurrency(dailySummary.totalCurrentOrderAmount || 0)}</p>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-4 border border-white/30">
                  <div className="flex flex-col">
                    <CheckCircle className="h-6 w-6 text-white mb-2" />
                    <p className="text-xs text-white/80 mb-1">Paid Amount</p>
                    <p className="text-2xl font-bold text-white">RS. {formatCurrency(dailySummary.totalPaidAmount || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Balance Cleared - Full Width */}
              <div className={`rounded-3xl p-4 border-2 mb-3 ${
                (dailySummary.balanceClearedToday || 0) >= 0 
                  ? 'bg-red-500/90 border-red-300/50' 
                  : 'bg-green-500/90 border-green-300/50'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white mb-1">
                      {(dailySummary.balanceClearedToday || 0) >= 0 ? 'Udhaar' : 'Recovery'}
                    </p>
                    <p className="text-xs text-white/90">Balance Cleared Today</p>
                  </div>
                  <p className="text-3xl font-bold text-white">
                    RS. {formatCurrency(Math.abs(dailySummary.balanceClearedToday || 0))}
                  </p>
                </div>
              </div>

              {/* Optional: Walk-in & Clear Bill if > 0 */}
              {(dailySummary.walkInAmount > 0 || dailySummary.clearBillAmount > 0) && (
                <div className="grid grid-cols-2 gap-3">
                  {dailySummary.walkInAmount > 0 && (
                    <div className="bg-cyan-500/80 backdrop-blur-sm rounded-3xl p-4 border border-cyan-300/50">
                      <div className="flex flex-col">
                        <Users className="h-5 w-5 text-white mb-1" />
                        <p className="text-xs text-white/90 mb-1">Walk-in</p>
                        <p className="text-lg font-bold text-white">RS. {formatCurrency(dailySummary.walkInAmount)}</p>
                      </div>
                    </div>
                  )}
                  {dailySummary.clearBillAmount > 0 && (
                    <div className="bg-indigo-500/80 backdrop-blur-sm rounded-3xl p-4 border border-indigo-300/50">
                      <div className="flex flex-col">
                        <Receipt className="h-5 w-5 text-white mb-1" />
                        <p className="text-xs text-white/90 mb-1">Clear Bill</p>
                        <p className="text-lg font-bold text-white">RS. {formatCurrency(dailySummary.clearBillAmount)}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* White Section Below */}
        <div className="bg-white rounded-t-3xl -mt-5 p-6">
          {/* Quick Actions Section */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Quick Actions</h2>
            
            {/* 3 Buttons: 2 columns top, 1 full width bottom */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <CreateOrderDialog trigger={
                  <Button className="h-20 flex-col gap-2 bg-gradient-to-br from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white shadow-lg active:scale-[0.97] transition-all">
                    <Plus className="h-6 w-6" />
                    <span className="text-sm font-semibold">Create Order</span>
                  </Button>
                } />
                <ClearBillDialog trigger={
                  <Button variant="outline" className="h-20 flex-col gap-2 border-2 border-cyan-200 hover:bg-cyan-50 active:scale-[0.97] transition-all">
                    <Receipt className="h-6 w-6 text-cyan-600" />
                    <span className="text-sm font-semibold text-gray-900">Clear Bill</span>
                  </Button>
                } />
              </div>
              <AddCustomerDialog trigger={
                <Button variant="outline" className="w-full h-20 flex-row gap-3 border-2 border-cyan-200 hover:bg-cyan-50 active:scale-[0.97] transition-all">
                  <Plus className="h-6 w-6 text-cyan-600" />
                  <span className="text-sm font-semibold text-gray-900">Add Customer</span>
                </Button>
              } />
            </div>
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
                  // orderType comes from backend as enum: WALKIN, DELIVERY, CLEARBILL
                  const orderType = activity.orderType || 'DELIVERY';
                  
                  // Convert to display name
                  const orderTypeDisplay = orderType === 'WALKIN' ? 'Walk-in' : 
                                         orderType === 'CLEARBILL' ? 'Clear Bill' : 
                                         'Delivery';

                  // Ensure amounts are numbers
                  const totalAmount = typeof activity.totalAmount === 'number' ? activity.totalAmount : parseFloat(activity.totalAmount) || 0;
                  const paidAmount = typeof activity.paidAmount === 'number' ? activity.paidAmount : parseFloat(activity.paidAmount) || 0;

                  return (
                    <div key={activity.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                              {activity.text}
                            </p>
                            <Badge variant={orderType === "WALKIN" ? "secondary" : orderType === "CLEARBILL" ? "outline" : "default"} className="text-xs shrink-0">
                              {orderTypeDisplay}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500">
                              {activity.time}
                              {activity.date && (
                                <span className="ml-1 text-gray-400">
                                  • {activity.date}
                                </span>
                              )}
                            </p>
                            {activity.deliveredAtFormatted && (
                              <p className="text-xs text-green-600 font-medium">
                                Delivered: {activity.deliveredAtFormatted}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-gray-600">
                                Total: <span className="font-semibold text-gray-900">RS. {totalAmount.toFixed(2)}</span>
                              </span>
                              <span className="text-gray-600">
                                Paid: <span className="font-semibold text-green-600">RS. {paidAmount.toFixed(2)}</span>
                              </span>
                            </div>
                          </div>
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
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl">
              <Droplet className="h-12 w-12 text-cyan-600" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Welcome back, {adminName}</h1>
            </div>
          </div>

          {/* Badge Section - Ready to Close / Orders in Progress */}
          {loadingSummary ? (
            <div className="mb-6 bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/30">
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
                <p className="ml-3 text-base text-white/80">Loading status...</p>
              </div>
            </div>
          ) : dailySummary && (
            <div 
              onClick={handleBadgeClick}
              className={`mb-6 rounded-3xl p-6 border-2 shadow-xl transition-all cursor-pointer hover:scale-[1.02] ${
                dailySummary.canClose 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 border-white/50 hover:from-emerald-600 hover:to-green-600' 
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 border-white/50 hover:from-orange-600 hover:to-amber-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {dailySummary.canClose ? (
                    <CheckCircle className="h-8 w-8 text-white" />
                  ) : (
                    <AlertTriangle className="h-8 w-8 text-white" />
                  )}
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {dailySummary.canClose ? 'Ready to Close' : 'Orders in Progress'}
                    </p>
                    <p className="text-sm text-white/90 mt-1">
                      {dailySummary.canClose 
                        ? 'Click to close counter' 
                        : `${dailySummary.inProgressOrdersCount || 0} order${(dailySummary.inProgressOrdersCount || 0) !== 1 ? 's' : ''} pending`
                      }
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-white" />
              </div>
            </div>
          )}

          {/* Today's Progress Cards - Desktop */}
          {loadingSummary ? (
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 border border-white/30">
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                </div>
              ))}
            </div>
          ) : dailySummary ? (
            <>
              {/* Row 1: Receivable, Payable, Orders, Bottles */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div 
                  onClick={handleReceivableClick}
                  className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 border-2 border-white/50 cursor-pointer transition-all hover:bg-white/30 hover:scale-[1.02]"
                >
                  <div className="flex flex-col">
                    <WalletIcon className="h-8 w-8 text-white mb-3" />
                    <p className="text-sm text-white/80 mb-2">Receivable</p>
                    <p className="text-3xl font-bold text-white mb-2">RS. {formatCurrency(dailySummary.customerReceivable || 0)}</p>
                    <p className="text-xs text-white/70 flex items-center gap-1">
                      Click to view <ArrowRight className="h-3 w-3" />
                    </p>
                  </div>
                </div>
                <div 
                  onClick={handlePayableClick}
                  className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 border-2 border-white/50 cursor-pointer transition-all hover:bg-white/30 hover:scale-[1.02]"
                >
                  <div className="flex flex-col">
                    <WalletIcon className="h-8 w-8 text-white mb-3" />
                    <p className="text-sm text-white/80 mb-2">Payable</p>
                    <p className="text-3xl font-bold text-white mb-2">RS. {formatCurrency(dailySummary.customerPayable || 0)}</p>
                    <p className="text-xs text-white/70 flex items-center gap-1">
                      Click to view <ArrowRight className="h-3 w-3" />
                    </p>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 border border-white/30">
                  <div className="flex flex-col">
                    <Package className="h-8 w-8 text-white mb-3" />
                    <p className="text-sm text-white/80 mb-2">Orders</p>
                    <p className="text-3xl font-bold text-white">{dailySummary.totalOrders || 0}</p>
                    <p className="text-xs text-white/70 mt-2">Today</p>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 border border-white/30">
                  <div className="flex flex-col">
                    <Droplet className="h-8 w-8 text-white mb-3" fill="currentColor" />
                    <p className="text-sm text-white/80 mb-2">Bottles</p>
                    <p className="text-3xl font-bold text-white">{dailySummary.totalBottles || 0}</p>
                    <p className="text-xs text-white/70 mt-2">Today</p>
                  </div>
                </div>
              </div>

              {/* Row 2: Order Amount, Paid Amount, Walk-in, Clear Bill */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 border border-white/30">
                  <div className="flex flex-col">
                    <DollarSign className="h-8 w-8 text-white mb-3" />
                    <p className="text-sm text-white/80 mb-2">Order Amount</p>
                    <p className="text-3xl font-bold text-white">RS. {formatCurrency(dailySummary.totalCurrentOrderAmount || 0)}</p>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 border border-white/30">
                  <div className="flex flex-col">
                    <CheckCircle className="h-8 w-8 text-white mb-3" />
                    <p className="text-sm text-white/80 mb-2">Paid Amount</p>
                    <p className="text-3xl font-bold text-white">RS. {formatCurrency(dailySummary.totalPaidAmount || 0)}</p>
                  </div>
                </div>
                {dailySummary.walkInAmount > 0 ? (
                  <div className="bg-cyan-500/80 backdrop-blur-sm rounded-3xl p-6 border border-cyan-300/50">
                    <div className="flex flex-col">
                      <Users className="h-8 w-8 text-white mb-3" />
                      <p className="text-sm text-white/90 mb-2">Walk-in</p>
                      <p className="text-3xl font-bold text-white">RS. {formatCurrency(dailySummary.walkInAmount)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 opacity-50">
                    <div className="flex flex-col">
                      <Users className="h-8 w-8 text-white/50 mb-3" />
                      <p className="text-sm text-white/50 mb-2">Walk-in</p>
                      <p className="text-3xl font-bold text-white/50">RS. 0</p>
                    </div>
                  </div>
                )}
                {dailySummary.clearBillAmount > 0 ? (
                  <div className="bg-indigo-500/80 backdrop-blur-sm rounded-3xl p-6 border border-indigo-300/50">
                    <div className="flex flex-col">
                      <Receipt className="h-8 w-8 text-white mb-3" />
                      <p className="text-sm text-white/90 mb-2">Clear Bill</p>
                      <p className="text-3xl font-bold text-white">RS. {formatCurrency(dailySummary.clearBillAmount)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20 opacity-50">
                    <div className="flex flex-col">
                      <Receipt className="h-8 w-8 text-white/50 mb-3" />
                      <p className="text-sm text-white/50 mb-2">Clear Bill</p>
                      <p className="text-3xl font-bold text-white/50">RS. 0</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Balance Cleared - Full Width Row */}
              <div className={`mt-4 rounded-3xl p-6 border-2 ${
                (dailySummary.balanceClearedToday || 0) >= 0 
                  ? 'bg-red-500/90 border-red-300/50' 
                  : 'bg-green-500/90 border-green-300/50'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white mb-1">
                      {(dailySummary.balanceClearedToday || 0) >= 0 ? 'Udhaar' : 'Recovery'}
                    </p>
                    <p className="text-sm text-white/90">Balance Cleared Today</p>
                  </div>
                  <p className="text-5xl font-bold text-white">
                    RS. {formatCurrency(Math.abs(dailySummary.balanceClearedToday || 0))}
                  </p>
                </div>
              </div>
            </>
          ) : null}
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
                  // orderType comes from backend as enum: WALKIN, DELIVERY, CLEARBILL
                  const orderType = activity.orderType || 'DELIVERY';
                  
                  // Convert to display name
                  const orderTypeDisplay = orderType === 'WALKIN' ? 'Walk-in' : 
                                         orderType === 'CLEARBILL' ? 'Clear Bill' : 
                                         'Delivery';

                  // Ensure amounts are numbers
                  const totalAmount = typeof activity.totalAmount === 'number' ? activity.totalAmount : parseFloat(activity.totalAmount) || 0;
                  const paidAmount = typeof activity.paidAmount === 'number' ? activity.paidAmount : parseFloat(activity.paidAmount) || 0;

                  return (
                    <div key={activity.id} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 ${bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-1">
                              <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                                {activity.text}
                              </p>
                              <Badge variant={orderType === "WALKIN" ? "secondary" : orderType === "CLEARBILL" ? "outline" : "default"} className="text-xs shrink-0">
                                {orderTypeDisplay}
                              </Badge>
                            </div>
                            <Badge variant={activity.status === "success" ? "default" : activity.status === "new" ? "secondary" : "outline"}>
                              {activity.status}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500">
                              {activity.time}
                              {activity.date && (
                                <span className="ml-1 text-gray-400">
                                  • {activity.date}
                                </span>
                              )}
                            </p>
                            {activity.deliveredAtFormatted && (
                              <p className="text-xs text-green-600 font-medium">
                                Delivered: {activity.deliveredAtFormatted}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs">
                              <span className="text-gray-600">
                                Total: <span className="font-semibold text-gray-900">RS. {totalAmount.toFixed(2)}</span>
                              </span>
                              <span className="text-gray-600">
                                Paid: <span className="font-semibold text-green-600">RS. {paidAmount.toFixed(2)}</span>
                              </span>
                            </div>
                          </div>
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

      {/* Close Counter Dialog - Controlled by badge click */}
      <CloseCounterDialog 
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
      />
    </div>
  );
};

export default AdminDashboard;
