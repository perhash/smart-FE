import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, User, TruckIcon, Package, CreditCard, CheckCircle, MapPin, Phone, DollarSign, Calendar } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { apiService } from "@/services/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatPktDateTime12Hour, formatPktDate } from "@/utils/timezone";

// Helper function to get payment status badge
const getPaymentStatusBadge = (status?: string) => {
  const paymentStatus = status?.toUpperCase();
  switch (paymentStatus) {
    case 'PAID':
      return { text: 'PAID', className: 'bg-green-100 text-green-700' };
    case 'NOT_PAID':
      return { text: 'NOT PAID', className: 'bg-red-100 text-red-700' };
    case 'PARTIAL':
      return { text: 'PARTIAL', className: 'bg-orange-100 text-orange-700' };
    case 'OVERPAID':
      return { text: 'OVERPAID', className: 'bg-purple-100 text-purple-700' };
    case 'REFUND':
      return { text: 'REFUND', className: 'bg-blue-100 text-blue-700' };
    default:
      return { text: 'NOT PAID', className: 'bg-red-100 text-red-700' };
  }
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [riders, setRiders] = useState<any[]>([]);
  const [selectedRider, setSelectedRider] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [orderRes, ridersRes] = await Promise.all([
          apiService.getOrderById(id as string) as any,
          apiService.getRiders() as any,
        ]);
        if (orderRes?.success) {
          setOrder(orderRes.data);
        }
        if (ridersRes?.success) {
          setRiders(ridersRes.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const loadOrder = async () => {
    try {
      const orderRes = await apiService.getOrderById(id as string) as any;
      if (orderRes?.success) {
        setOrder(orderRes.data);
      }
    } catch (error) {
      console.error('Error reloading order:', error);
    }
  };

  const handleAssign = async () => {
    if (!selectedRider) return;
    try {
      setAssigning(true);
      const res = await apiService.updateOrderStatus(id as string, 'ASSIGNED', selectedRider) as any;
      if (res?.success) {
        setOrder(res.data);
        toast.success(`Order assigned successfully`);
        loadOrder();
      } else {
        toast.error(res?.message || 'Failed to assign order');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to assign order');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-24 md:pb-6">
        <div className="flex items-center gap-4 p-6">
          <Link to="/admin/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Order</h1>
            <p className="text-muted-foreground">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen pb-24 md:pb-6">
        <div className="flex items-center gap-4 p-6">
          <Link to="/admin/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Order Not Found</h1>
            <p className="text-muted-foreground">Order with ID {id} could not be found</p>
          </div>
        </div>
      </div>
    );
  }

  const isDelivered = order.status?.toLowerCase() === 'delivered';
  const hasRider = order.rider && order.rider !== 'Not assigned';
  const isWalkIn = order.orderType === 'WALKIN' || order.customer?.name === 'Walk-in Customer' || order.customer === 'Walk-in Customer';

  // Check if order is delivered - show completed order view
  if (isDelivered) {
    return (
      <div className="min-h-screen pb-24 md:pb-6">
        {/* Mobile Layout - Completed Order */}
        <div className="md:hidden">
          {/* Top Section - Green Gradient Header */}
          <div className="bg-gradient-to-br from-green-700 via-green-600 to-green-800 p-6 space-y-4">
            {/* Back Button */}
            <Link to="/admin/orders">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 mb-4">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" fill="currentColor" />
              </div>
              <div>
                <p className="text-sm text-white/90">Order #</p>
                <p className="text-2xl font-bold text-white">{order.id?.slice(-4)}</p>
              </div>
            </div>
            
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <Badge className="bg-white text-green-700 font-semibold">
                Completed
              </Badge>
            </div>
          </div>

          {/* Content - White Cards */}
          <div className="bg-white rounded-t-3xl -mt-10 p-6 space-y-4">
            {/* Customer Info Card */}
            <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-4 border border-blue-100">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-lg truncate">{order?.customer?.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <a href={`tel:${order?.customer?.phone}`} className="text-sm text-gray-600 truncate">
                      {order?.customer?.phone}
                    </a>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
                <span className="line-clamp-2">
                  {[order?.customer?.houseNo, order?.customer?.streetNo, order?.customer?.area, order?.customer?.city].filter(Boolean).join(' ') || 'Address not available'}
                </span>
              </div>
            </div>

            {/* Order Details Card */}
            <div className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl p-4 border border-green-100">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-5 w-5 text-green-600" />
                <p className="font-bold text-gray-900">Order Details</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Bottles</span>
                  <span className="font-semibold text-gray-900">{order?.numberOfBottles} bottles</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2 mt-2">
                  <span className="text-sm text-gray-600">Order Date</span>
                  <span className="text-sm font-medium text-gray-700">
                    {order?.createdAt ? formatPktDate(order.createdAt) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Summary Card */}
            <div className="bg-gradient-to-br from-white to-amber-50/30 rounded-2xl p-4 border border-amber-100">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-5 w-5 text-amber-600" />
                <p className="font-bold text-gray-900">Payment Summary</p>
              </div>
              <div className="space-y-3">
                <div className="bg-white rounded-xl p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Total Amount</span>
                    <span className="font-bold text-lg text-gray-900">
                      RS. {order?.totalAmount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Paid Amount</span>
                    <span className="font-semibold text-green-700">
                      RS. {order?.paidAmount || 0}
                    </span>
                  </div>
                  {(order?.payable && parseFloat(order.payable) > 0) && (
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm text-red-600">Payable (Customer owes)</span>
                      <span className="font-semibold text-red-700">
                        RS. {order.payable}
                      </span>
                    </div>
                  )}
                  {(order?.receivable && parseFloat(order.receivable) > 0) && (
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm text-blue-600">Receivable (We owe)</span>
                      <span className="font-semibold text-blue-700">
                        RS. {order.receivable}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center gap-2 pt-2 border-t">
                  <Badge className={getPaymentStatusBadge(order?.paymentStatus).className}>
                    {getPaymentStatusBadge(order?.paymentStatus).text}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Rider Info Card */}
            {hasRider && (
              <div className="bg-gradient-to-br from-white to-cyan-50/30 rounded-2xl p-4 border border-cyan-100">
                <div className="flex items-center gap-2 mb-3">
                  <TruckIcon className="h-5 w-5 text-cyan-600" />
                  <p className="font-bold text-gray-900">Rider Information</p>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold text-gray-900">{order.rider?.name || order.rider}</p>
                  </div>
                  {order.rider?.phone && (
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold text-gray-900">{order.rider.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Layout - Completed Order */}
        <div className="hidden md:block max-w-4xl mx-auto px-6">
          {/* Top Section - Green Gradient */}
          <div className="bg-gradient-to-r from-green-500 to-green-700 rounded-3xl p-8 shadow-2xl mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-6">
                <Link to="/admin/orders">
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                    <ArrowLeft className="h-6 w-6" />
                  </Button>
                </Link>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-green-600" fill="currentColor" />
                  </div>
                  <div>
                    <p className="text-white/90 text-sm">Order Details</p>
                    <h1 className="text-3xl font-bold text-white">Order #{order.id?.slice(-4)}</h1>
                  </div>
                </div>
              </div>
              <Badge className="bg-white text-green-700 text-lg px-4 py-2">Completed</Badge>
            </div>
          </div>

          {/* Content Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Customer Info */}
            <Card className="border-blue-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-semibold text-lg">{order?.customer?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${order?.customer?.phone}`} className="text-primary hover:underline">
                    {order?.customer?.phone}
                  </a>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {[order?.customer?.houseNo, order?.customer?.streetNo, order?.customer?.area, order?.customer?.city].filter(Boolean).join(' ') || 'Address not available'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Rider Info */}
            {hasRider ? (
              <Card className="border-cyan-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TruckIcon className="h-5 w-5 text-cyan-600" />
                    Rider Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-semibold text-lg">{order.rider?.name || order.rider}</p>
                  </div>
                  {order.rider?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${order.rider.phone}`} className="text-primary hover:underline">
                        {order.rider.phone}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TruckIcon className="h-5 w-5" />
                    Rider Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">No rider assigned</p>
                </CardContent>
              </Card>
            )}

            {/* Order Details */}
            <Card className="border-green-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-600" />
                  Order Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="font-semibold">{order?.numberOfBottles} bottles</span>
                </div>
                <div className="flex justify-between items-center border-t pt-3">
                  <span className="text-muted-foreground">Order Date</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {order?.createdAt ? formatPktDate(order.createdAt) : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center border-t pt-3">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className="bg-green-100 text-green-700">Delivered</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Payment Summary - Full Width */}
            <Card className="md:col-span-2 border-amber-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-amber-600" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Total Amount</p>
                    <p className="text-3xl font-bold text-gray-900">RS. {order?.totalAmount || 0}</p>
                  </div>
                  <div className="text-center border-x">
                    <p className="text-sm text-muted-foreground mb-2">Paid Amount</p>
                    <p className="text-3xl font-bold text-green-700">RS. {order?.paidAmount || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Status</p>
                    <Badge className={`text-lg px-4 py-2 ${getPaymentStatusBadge(order?.paymentStatus).className}`}>
                      {getPaymentStatusBadge(order?.paymentStatus).text}
                    </Badge>
                  </div>
                </div>
                
                {(order?.payable && parseFloat(order.payable) > 0) || (order?.receivable && parseFloat(order.receivable) > 0) ? (
                  <div className="border-t pt-6 space-y-3">
                    {order?.payable && parseFloat(order.payable) > 0 && (
                      <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <span className="text-sm font-semibold text-red-700">Payable (Customer owes)</span>
                        <span className="text-2xl font-bold text-red-700">RS. {order.payable}</span>
                      </div>
                    )}
                    {order?.receivable && parseFloat(order.receivable) > 0 && (
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm font-semibold text-blue-700">Receivable (We owe)</span>
                        <span className="text-2xl font-bold text-blue-700">RS. {order.receivable}</span>
                      </div>
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Non-delivered order view
  return (
    <div className="min-h-screen pb-32 md:pb-6">
      {/* Mobile Layout - Non-delivered Orders */}
      <div className="md:hidden">
        {/* Top Section - Blue Gradient Header */}
        <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 p-6 space-y-4">
          {/* Back Button */}
          <Link to="/admin/orders">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 mb-4">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" fill="currentColor" />
            </div>
            <div>
              <p className="text-sm text-white/90">Order #</p>
              <p className="text-2xl font-bold text-white">{order.id?.slice(-4)}</p>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge className="bg-white text-blue-700 font-semibold">
              {order.status?.toUpperCase() || 'Active'}
            </Badge>
          </div>
        </div>

        {/* Content - White Cards */}
        <div className="bg-white rounded-t-3xl -mt-10 p-6 space-y-4 pb-32">
          {/* Customer Info Card */}
          <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-4 border border-blue-100">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-lg truncate">{order?.customer?.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <a href={`tel:${order?.customer?.phone}`} className="text-sm text-gray-600 truncate">
                    {order?.customer?.phone}
                  </a>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
              <span className="line-clamp-2">
                {[order?.customer?.houseNo, order?.customer?.streetNo, order?.customer?.area, order?.customer?.city].filter(Boolean).join(' ') || 'Address not available'}
              </span>
            </div>
          </div>

          {/* Order Details Card */}
          <div className="bg-gradient-to-br from-white to-cyan-50/30 rounded-2xl p-4 border border-cyan-100">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-5 w-5 text-cyan-600" />
              <p className="font-bold text-gray-900">Order Information</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Bottles</span>
                <span className="font-semibold text-gray-900">{order?.numberOfBottles} bottles</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2 mt-2">
                <span className="text-sm text-gray-600">Current Amount</span>
                <span className="text-sm font-medium text-gray-700">
                  RS. {order?.currentOrderAmount ?? 0}
                </span>
              </div>
              <div className="flex justify-between items-center border-t pt-2 mt-2">
                <span className="text-sm text-gray-600">Pending Balance</span>
                <span className="text-sm font-medium text-gray-700">
                  RS. {Math.abs(order?.customerBalance ?? 0)}
                </span>
              </div>
              <div className="flex justify-between items-center border-t pt-2 mt-2 bg-cyan-50 rounded-lg p-2">
                <span className="text-sm font-bold text-gray-900">Total Amount</span>
                <span className="text-lg font-bold text-cyan-700">
                  RS. {order?.totalAmount ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* Rider Information Card - Always shown */}
          <div className="bg-gradient-to-br from-white to-cyan-50/30 rounded-2xl p-4 border border-cyan-100">
            <div className="flex items-center gap-2 mb-3">
              <TruckIcon className="h-5 w-5 text-cyan-600" />
              <p className="font-bold text-gray-900">Rider Information</p>
            </div>
            {hasRider ? (
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold text-gray-900">{order.rider?.name || order.rider}</p>
                </div>
                {order.rider?.phone && (
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold text-gray-900">{order.rider.phone}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">No rider assigned</p>
                {!isWalkIn && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="riderSelect" className="text-sm text-gray-700">
                        Select Rider
                      </Label>
                      <Select value={selectedRider} onValueChange={setSelectedRider}>
                        <SelectTrigger id="riderSelect" className="h-11">
                          <SelectValue placeholder="Choose a rider" />
                        </SelectTrigger>
                        <SelectContent>
                          {riders.filter((r: any) => r.isActive).map((r: any) => (
                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleAssign}
                      disabled={!selectedRider || assigning}
                      className="w-full h-12"
                      size="lg"
                    >
                      {assigning ? "Assigning..." : "Assign Rider"}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Walk-in Order Completion Form */}
          {order.orderType === 'WALKIN' && order.status === 'CREATED' && (
            <div className="bg-gradient-to-br from-white to-orange-50/30 rounded-2xl p-4 border border-orange-100">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="h-5 w-5 text-orange-600" />
                <p className="font-bold text-gray-900">Complete Walk-in Order</p>
              </div>
              <WalkInCompletionForm order={order} onComplete={loadOrder} />
            </div>
          )}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block max-w-4xl mx-auto px-6 py-6">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link to="/admin/orders">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Order #{order ? order.id?.slice(-4) : id}</h1>
              <p className="text-muted-foreground">Order Details</p>
            </div>
            <div className="flex gap-2 ml-auto">
              <Badge variant={order.status === "delivered" ? "default" : "secondary"}>
                {order.status}
              </Badge>
              {order.paymentStatus && (
                <Badge className={getPaymentStatusBadge(order.paymentStatus).className}>
                  {getPaymentStatusBadge(order.paymentStatus).text}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{order.customer?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{order.customer?.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{[order.customer?.houseNo, order.customer?.streetNo, order.customer?.area, order.customer?.city].filter(Boolean).join(' ')}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TruckIcon className="h-5 w-5" />
                  Rider Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {hasRider ? (
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{order.rider?.name || order.rider}</p>
                    </div>
                    {order.rider?.phone && (
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{order.rider.phone}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">No rider assigned</p>
                    {!isWalkIn && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="riderSelectDesktop" className="text-sm font-medium">
                            Select Rider
                          </Label>
                          <Select value={selectedRider} onValueChange={setSelectedRider}>
                            <SelectTrigger id="riderSelectDesktop" className="w-full">
                              <SelectValue placeholder="Choose a rider" />
                            </SelectTrigger>
                            <SelectContent>
                              {riders.filter((r: any) => r.isActive).map((r: any) => (
                                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          onClick={handleAssign} 
                          disabled={!selectedRider || assigning}
                          className="w-full"
                          size="lg"
                        >
                          {assigning ? "Assigning..." : "Assign Rider"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity</span>
                <span className="font-medium">{order.numberOfBottles} bottles</span>
              </div>
              
              {/* Current Order Amount */}
              <div className="flex justify-between text-lg font-bold border-t pt-4">
                <span>Current Order Amount</span>
                <span>RS. {order.currentOrderAmount ?? 0}</span>
              </div>

              {/* Pending Balance */}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending Balance</span>
                <div className="text-right">
                  <Badge variant={(order.customerBalance ?? 0) < 0 ? "destructive" : "default"}>
                    {(order.customerBalance ?? 0) < 0 ? "Payable" : (order.customerBalance ?? 0) > 0 ? "Receivable" : 'Clear'}
                  </Badge>
                  <p className="text-sm font-semibold mt-1">
                    RS. {Math.abs(order.customerBalance ?? 0)}
                  </p>
                </div>
              </div>

              {/* Total Amount */}
              <div className="flex justify-between text-xl font-bold border-t-2 border-primary pt-4 bg-primary/5 p-3 rounded-lg">
                <span>Total Amount</span>
                <span className="text-primary">
                  RS. {order.totalAmount ?? 0}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Current order amount plus pending balance
              </p>
              
              {order.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p>{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Walk-in Order Completion Form */}
          {order.orderType === 'WALKIN' && order.status === 'CREATED' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Complete Walk-in Order
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WalkInCompletionForm order={order} onComplete={loadOrder} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// Walk-in Order Completion Form Component
const WalkInCompletionForm = ({ order, onComplete }: { order: any; onComplete: () => void }) => {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [notes, setNotes] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);

  const totalAmount = order?.totalAmount ?? 0;
  const isPayable = totalAmount < 0;
  const isReceivable = totalAmount > 0;
  const isClear = totalAmount === 0;

  const paymentMethods = [
    { value: "CASH", label: "Cash" },
    { value: "CARD", label: "Card" },
    { value: "BANK_TRANSFER", label: "Bank Transfer" },
    { value: "JAZZCASH", label: "JazzCash" },
    { value: "EASYPAISA", label: "EasyPaisa" },
    { value: "NAYA_PAY", label: "Naya Pay" },
    { value: "SADAPAY", label: "SadaPay" },
  ];

  const handleComplete = async () => {
    try {
      setIsCompleting(true);
      
      let paymentAmount = 0;
      
      if (isClear) {
        paymentAmount = 0;
      } else if (isPayable) {
        paymentAmount = amount ? parseFloat(amount) : 0;
        if (paymentAmount > 0) {
          paymentAmount = -paymentAmount; // Convert to negative for refund
        }
      } else if (isReceivable) {
        paymentAmount = amount ? parseFloat(amount) : 0;
      }
      
      const res = await apiService.completeWalkInOrder(order.id, { 
        paymentAmount, 
        paymentMethod, 
        notes: notes || undefined 
      });
      
      if ((res as any)?.success) {
        toast.success(`Walk-in order completed successfully!`);
        onComplete(); // Refresh the order data
      } else {
        toast.error((res as any)?.message || 'Failed to complete walk-in order');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to complete walk-in order');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {isClear ? (
        <div className="text-center py-4">
          <p className="text-muted-foreground">No payment required - balance is clear</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="amount">
              {isPayable ? "Amount to Refund" : "Amount Received"}
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder={isPayable ? "Enter refund amount" : "Enter amount"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={isPayable ? 0 : 0}
              max={isPayable ? Math.abs(totalAmount) : totalAmount}
            />
            {totalAmount !== 0 && (
              <p className="text-xs text-muted-foreground">
                {isPayable 
                  ? `We owe customer RS. ${Math.abs(totalAmount)}. Enter refund amount (0 to ${Math.abs(totalAmount)}).`
                  : `Total: RS. ${totalAmount}. Enter 0 to ${totalAmount} for payment.`
                }
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="paymentMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this payment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </>
      )}
      
      <Button 
        onClick={handleComplete} 
        disabled={isCompleting}
        className="w-full"
        size="lg"
      >
        {isCompleting ? "Completing..." : isPayable ? "Refund & Complete" : isReceivable ? "Complete & Collect Payment" : "Complete Order"}
      </Button>
    </div>
  );
};

export default OrderDetail;