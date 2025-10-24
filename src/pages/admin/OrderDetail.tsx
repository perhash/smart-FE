import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, TruckIcon, Package, CreditCard } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { apiService } from "@/services/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [riders, setRiders] = useState<any[]>([]);
  const [selectedRider, setSelectedRider] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching order with ID:', id);
        const [orderRes, ridersRes] = await Promise.all([
          apiService.getOrderById(id as string) as any,
          apiService.getRiders() as any,
        ]);
        console.log('Order response:', orderRes);
        console.log('Riders response:', ridersRes);
        if (orderRes?.success) {
          setOrder(orderRes.data);
          console.log('Order set:', orderRes.data);
        } else {
          console.error('Order fetch failed:', orderRes);
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

  const handleAssign = async () => {
    if (!selectedRider) return;
    try {
      setAssigning(true);
      const res = await apiService.updateOrderStatus(id as string, 'ASSIGNED', selectedRider) as any;
      if (res?.success) {
        setOrder(res.data);
      }
    } finally {
      setAssigning(false);
    }
  };

  const timeline = [
    { status: "Created", time: "09:00 AM", completed: true },
    { status: "Assigned", time: "09:15 AM", completed: true },
    { status: "In Transit", time: "-", completed: false },
    { status: "Delivered", time: "-", completed: false },
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/admin/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Order Not Found</h1>
            <p className="text-muted-foreground">Order with ID {id} could not be found</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              The order you're looking for doesn't exist or you don't have permission to view it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Order #{order.id.slice(-4)}</h1>
          <p className="text-muted-foreground">Order Details</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={order.status === "delivered" ? "default" : "secondary"}>
            {order.status}
          </Badge>
          <Badge variant={
            order.paymentStatus === "paid" ? "default" : 
            order.paymentStatus === "refund" ? "secondary" : 
            "destructive"
          }>
            {order.paymentStatus}
          </Badge>
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
              <p className="font-medium">{order.customer.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{order.customer.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{[order.customer.houseNo, order.customer.streetNo, order.customer.area, order.customer.city].filter(Boolean).join(' ')}</p>
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
          <CardContent className="space-y-2">
            {order.rider ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{order.rider.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{order.rider.phone}</p>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">No rider assigned</p>
                <div className="flex gap-2 items-center">
                  <Select value={selectedRider} onValueChange={setSelectedRider}>
                    <SelectTrigger className="w-[240px]">
                      <SelectValue placeholder="Select rider" />
                    </SelectTrigger>
                    <SelectContent>
                      {riders.map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAssign} disabled={!selectedRider || assigning}>Assign</Button>
                </div>
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
          <div className="flex justify-between">
            <span className="text-muted-foreground">Price per bottle</span>
            <span className="font-medium">-</span>
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

      <Card>
        <CardHeader>
          <CardTitle>Delivery Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timeline.map((step, index) => (
              <div key={step.status} className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  step.completed ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${step.completed ? "" : "text-muted-foreground"}`}>
                    {step.status}
                  </p>
                  <p className="text-sm text-muted-foreground">{step.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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
        alert(`Walk-in order completed successfully!`);
        onComplete(); // Refresh the order data
      } else {
        alert((res as any)?.message || 'Failed to complete walk-in order');
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to complete walk-in order');
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
            <label className="text-sm font-medium">
              {isPayable ? "Amount to Refund" : "Amount Received"}
            </label>
            <input
              type="number"
              placeholder={isPayable ? "Enter refund amount" : "Enter amount"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={isPayable ? 0 : 0}
              max={isPayable ? Math.abs(totalAmount) : totalAmount}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="text-sm font-medium">Payment Method</label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
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
            <label className="text-sm font-medium">Notes (Optional)</label>
            <textarea
              placeholder="Add any notes about this payment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
