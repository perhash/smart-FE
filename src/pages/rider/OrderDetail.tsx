import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Phone, Package } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { apiService } from "@/services/api";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const RiderOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [order, setOrder] = useState<any>(null);
  
  // Calculate if we owe customer or customer owes us (after order is loaded)
  const totalAmount = order?.totalAmount ?? 0;
  const isPayable = totalAmount < 0;
  const isReceivable = totalAmount > 0;
  const isClear = totalAmount === 0;

  // Payment method options
  const paymentMethods = [
    { value: "CASH", label: "Cash" },
    { value: "CARD", label: "Card" },
    { value: "BANK_TRANSFER", label: "Bank Transfer" },
    { value: "JAZZCASH", label: "JazzCash" },
    { value: "EASYPAISA", label: "EasyPaisa" },
    { value: "NAYA_PAY", label: "Naya Pay" },
    { value: "SADAPAY", label: "SadaPay" },
  ];

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiService.getOrderById(id as string) as any;
        if (res?.success) setOrder(res.data);
      } catch (e) {
        // If id is short code, try to refetch by translating from dashboard data if available later
        setOrder(null);
      }
    };
    load();
  }, [id]);

  const handleDeliveryComplete = async () => {
    try {
      let paymentAmount = 0;
      
      // Handle different scenarios
      if (isClear) {
        // No payment needed
        paymentAmount = 0;
      } else if (isPayable) {
        // We owe customer - convert positive amount to negative (refund)
        paymentAmount = amount ? parseFloat(amount) : 0;
        if (paymentAmount > 0) {
          paymentAmount = -paymentAmount; // Convert to negative for refund
        }
        // If amount is 0 or negative, keep as is
      } else if (isReceivable) {
        // Customer owes us - amount should be positive
        paymentAmount = amount ? parseFloat(amount) : 0;
      }
      
      const res = await apiService.deliverOrder(id as string, { paymentAmount, paymentMethod, notes });
      if ((res as any)?.success) {
        const action = isPayable ? 'refunded' : 'delivered';
        toast.success(`Order #${(res as any).data.id.slice(-4)} ${action}`);
        navigate("/rider");
      } else {
        toast.error((res as any)?.message || 'Failed to process delivery');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to process delivery');
    }
  };

  const handleCancelOrder = async () => {
    try {
      const res = await apiService.cancelOrder(id as string);
      if ((res as any)?.success) {
        toast.success(`Order #${(res as any).data.id.slice(-4)} cancelled`);
        navigate("/rider");
      } else {
        toast.error((res as any)?.message || 'Failed to cancel order');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to cancel order');
    }
  };

  if (!order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/rider">
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

  // Safety check to prevent rendering errors
  if (!order.id) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/rider">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Order</h1>
            <p className="text-muted-foreground">Order data is incomplete</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/rider">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Order #{order ? order.id.slice(-4) : id}</h1>
          <p className="text-muted-foreground">Mark delivery status</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium text-lg">{order?.customer?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a href={`tel:${order?.customer?.phone}`} className="text-primary underline">
              {order?.customer?.phone}
            </a>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
            <p className="text-muted-foreground">{[order?.customer?.houseNo, order?.customer?.streetNo, order?.customer?.area, order?.customer?.city].filter(Boolean).join(' ')}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Quantity</span>
            <span className="font-medium">{order?.numberOfBottles} bottles</span>
          </div>
          
          {/* Current Order Amount */}
          <div className="flex justify-between items-center text-lg font-bold border-t pt-4">
            <span>Current Order Amount</span>
            <span>RS. {order?.currentOrderAmount ?? 0}</span>
          </div>

          {/* Pending Balance */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Pending Balance</span>
            <div className="text-right">
              <Badge variant={(order?.customerBalance ?? 0) < 0 ? "destructive" : "default"}>
                {(order?.customerBalance ?? 0) < 0 ? "Payable" : (order?.customerBalance ?? 0) > 0 ? "Receivable" : 'Clear'}
              </Badge>
              <p className="text-sm font-semibold mt-1">
                RS. {Math.abs(order?.customerBalance ?? 0)}
              </p>
            </div>
          </div>

          {/* Total Amount */}
          <div className="flex justify-between items-center text-xl font-bold border-t-2 border-primary pt-4 bg-primary/5 p-3 rounded-lg">
            <span>Total Amount</span>
            <span className="text-primary">
              RS. {order?.totalAmount ?? 0}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Current order amount plus pending balance
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {isPayable ? "Refund Details" : isReceivable ? "Payment Details" : "Delivery Details"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                {order && totalAmount !== 0 && (
                  <p className="text-xs text-muted-foreground">
                    {isPayable 
                      ? `We owe customer RS. ${Math.abs(totalAmount || 0)}. Enter refund amount (0 to ${Math.abs(totalAmount || 0)}).`
                      : `Total: RS. ${totalAmount || 0}. Enter 0 to ${totalAmount || 0} for payment.`
                    }
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">
                  {isPayable ? "Refund Method" : "Payment Method"}
                </Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${isPayable ? 'refund' : 'payment'} method`} />
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
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about the delivery"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="w-full" size="lg" variant="default">
              {isPayable ? "Refund & Deliver" : isReceivable ? "Deliver & Collect Payment" : "Deliver (No Payment)"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {isPayable ? "Confirm Refund" : "Confirm Delivery"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {isPayable 
                  ? `Process refund for order #${order?.id?.slice(-4) || 'N/A'}? We owe customer RS. ${Math.abs(totalAmount || 0)}. ${amount ? `Refund amount: RS. ${amount}` : 'No refund will be given.'}`
                  : isReceivable
                  ? `Mark order #${order?.id?.slice(-4) || 'N/A'} as delivered? Payment status will be determined by the amount entered above.`
                  : `Mark order #${order?.id?.slice(-4) || 'N/A'} as delivered? No payment required.`
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeliveryComplete}>
                {isPayable ? "Confirm Refund" : "Confirm Delivery"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="w-full" size="lg" variant="destructive">
              Cancel Order
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Cancellation</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel order #{order.id.slice(-4)}? This will revert the customer's balance.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancelOrder}>
                Confirm Cancellation
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default RiderOrderDetail;
