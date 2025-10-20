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

  const handleDeliveryComplete = async (status: "paid" | "unpaid" | "overpaid" | "partial") => {
    try {
      const paymentAmount = amount ? parseFloat(amount) : 0;
      const res = await apiService.deliverOrder(id as string, { paymentAmount, paymentMethod, notes });
      if ((res as any)?.success) {
        toast.success(`Order #${(res as any).data.id.slice(-4)} marked delivered`);
        navigate("/rider");
      } else {
        toast.error((res as any)?.message || 'Failed to mark delivered');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to mark delivered');
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
            <span>RS. {order?.totalAmount}</span>
          </div>

          {/* Pending Balance */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Pending Balance</span>
            <div className="text-right">
              <Badge variant={(order?.customer?.currentBalance ?? 0) < 0 ? "destructive" : "default"}>
                {(order?.customer?.currentBalance ?? 0) < 0 ? "Payable" : (order?.customer?.currentBalance ?? 0) > 0 ? "Receivable" : 'Clear'}
              </Badge>
              <p className="text-sm font-semibold mt-1">
                RS. {Math.abs(order?.customer?.currentBalance ?? 0)}
              </p>
            </div>
          </div>

          {/* Total for Admin Understanding */}
          <div className="flex justify-between items-center text-xl font-bold border-t-2 border-primary pt-4 bg-primary/5 p-3 rounded-lg">
            <span>Total for Admin</span>
            <span className="text-primary">
              RS. {(() => {
                const currentOrderAmount = order?.totalAmount ?? 0;
                const customerBalance = order?.customer?.currentBalance ?? 0;
                if (customerBalance < 0) {
                  // Payable - subtract from order amount
                  return currentOrderAmount - Math.abs(customerBalance);
                } else if (customerBalance > 0) {
                  // Receivable - add to order amount
                  return currentOrderAmount + customerBalance;
                } else {
                  // Clear balance - no adjustment
                  return currentOrderAmount;
                }
              })()}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {(() => {
              const customerBalance = order?.customer?.currentBalance ?? 0;
              if (customerBalance < 0) {
                return `Order amount minus payable balance`;
              } else if (customerBalance > 0) {
                return `Order amount plus receivable balance`;
              } else {
                return `No balance adjustment needed`;
              }
            })()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Details (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount Received</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {order && (
              <p className="text-xs text-muted-foreground">
                Total: RS. {order.totalAmount}. Enter less than total for Partial, equal for Paid, more for Overpaid, 0 for Not Paid.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
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
            <Button className="w-full" size="lg" variant="secondary">
              Delivered (Partial Paid)
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Delivery</AlertDialogTitle>
              <AlertDialogDescription>
                Mark order #{order.id.slice(-4)} as delivered with partial payment?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDeliveryComplete("partial")}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="w-full" size="lg" variant="default">
              Delivered (Paid)
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Delivery</AlertDialogTitle>
              <AlertDialogDescription>
                Mark order {order.id} as delivered and payment received?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDeliveryComplete("paid")}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="w-full" size="lg" variant="outline">
              Delivered (Not Paid)
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Delivery</AlertDialogTitle>
              <AlertDialogDescription>
                Mark order {order.id} as delivered but payment not received?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDeliveryComplete("unpaid")}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="w-full" size="lg" variant="secondary">
              Delivered (Overpaid)
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Delivery</AlertDialogTitle>
              <AlertDialogDescription>
                Mark order {order.id} as delivered with overpayment?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDeliveryComplete("overpaid")}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default RiderOrderDetail;
