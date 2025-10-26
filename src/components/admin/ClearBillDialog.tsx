import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { apiService } from "@/services/api";

interface ClearBillDialogProps {
  trigger?: React.ReactNode;
}

export function ClearBillDialog({ trigger }: ClearBillDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [customerResults, setCustomerResults] = useState<any[]>([]);

  // Debounced customer search
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!searchQuery) {
        setCustomerResults([]);
        return;
      }
      try {
        setLoadingCustomers(true);
        const res = await apiService.searchCustomers(searchQuery);
        if ((res as any).success) {
          setCustomerResults((res as any).data);
        } else {
          setCustomerResults([]);
        }
      } catch (e) {
        setCustomerResults([]);
      } finally {
        setLoadingCustomers(false);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleClearBill = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      setIsClearing(true);

      const response = await apiService.clearBill({
        customerId: selectedCustomer.id,
        paidAmount: parseFloat(paymentAmount),
        paymentMethod,
        paymentNotes: paymentNotes || undefined,
      });

      if ((response as any).success) {
        toast.success(`Bill cleared successfully! Amount: RS. ${paymentAmount}`);
        
        // Reset form
        setSelectedCustomer(null);
        setSearchQuery("");
        setPaymentAmount("");
        setPaymentMethod("CASH");
        setPaymentNotes("");
        setOpen(false);
        
        // Refresh page or specific data
        window.location.reload();
      } else {
        toast.error((response as any).message || 'Failed to clear bill');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to clear bill');
    } finally {
      setIsClearing(false);
    }
  };

  const customerBalance = selectedCustomer?.currentBalance ?? 0;
  const isReceivable = customerBalance > 0;
  const isPayable = customerBalance < 0;
  const hasBill = customerBalance !== 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <DollarSign className="mr-2 h-4 w-4" />
            Clear Bills
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Clear Customer Bill</DialogTitle>
          <DialogDescription>
            Search for customer and clear their outstanding bill
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleClearBill} className="space-y-6">
          {/* Customer Search */}
          <div className="space-y-2">
            <Label>
              Search Customer (by name, phone, WhatsApp, or house number)
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, WhatsApp, or house number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {searchQuery && !selectedCustomer && (
              <div className="mt-2 max-h-48 overflow-y-auto border rounded-md">
                {loadingCustomers ? (
                  <p className="p-3 text-sm text-muted-foreground">Searching...</p>
                ) : customerResults.length > 0 ? (
                  customerResults
                    .filter(customer => customer.currentBalance !== 0) // Only show customers with bills
                    .map((customer) => (
                      <div
                        key={customer.id}
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setSearchQuery("");
                          setPaymentAmount(Math.abs(customer.currentBalance).toString());
                        }}
                        className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-sm text-muted-foreground">{customer.phone}</p>
                          </div>
                          <Badge variant={customer.currentBalance < 0 ? "destructive" : "default"}>
                            {customer.currentBalance < 0 ? "Payable" : "Receivable"}
                          </Badge>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="p-3 text-sm text-muted-foreground">No customers found</p>
                )}
              </div>
            )}
          </div>

          {/* Selected Customer Info */}
          {selectedCustomer && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{selectedCustomer.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                </div>
                <div className="text-right">
                  <Badge variant={customerBalance < 0 ? "destructive" : "default"}>
                    {isReceivable ? "Receivable" : isPayable ? "Payable" : "Clear"}
                  </Badge>
                  <p className="text-lg font-bold mt-1">RS. {Math.abs(customerBalance)}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setSelectedCustomer(null);
                  setPaymentAmount("");
                }}
              >
                Change Customer
              </Button>
            </div>
          )}

          {/* Bill Information */}
          {selectedCustomer && hasBill && (
            <div className="space-y-2">
              <Label>Outstanding Bill Information</Label>
              <div className="rounded-lg border bg-primary/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {isReceivable ? "Customer Owes" : "We Owe Customer"}
                  </span>
                  <span className="text-2xl font-bold">
                    RS. {Math.abs(customerBalance)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* No Bill Message */}
          {selectedCustomer && !hasBill && (
            <div className="rounded-lg border bg-yellow-50 p-4">
              <p className="text-sm text-yellow-800">
                This customer has no outstanding bills to clear.
              </p>
            </div>
          )}

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="paymentAmount">Payment Amount *</Label>
            <Input
              id="paymentAmount"
              type="number"
              placeholder="Enter amount to clear"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              min="0"
              step="0.01"
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter the amount to clear for this {isReceivable ? "receivable" : isPayable ? "payable" : "bill"}
            </p>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method *</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="paymentMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="JAZZCASH">JazzCash</SelectItem>
                <SelectItem value="EASYPAISA">EasyPaisa</SelectItem>
                <SelectItem value="NAYA_PAY">Naya Pay</SelectItem>
                <SelectItem value="SADAPAY">SadaPay</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Notes */}
          <div className="space-y-2">
            <Label htmlFor="paymentNotes">Payment Notes (Optional)</Label>
            <Textarea
              id="paymentNotes"
              placeholder="Add any notes about this payment..."
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isClearing}>
              Cancel
            </Button>
            <Button type="submit" disabled={isClearing || !hasBill || !selectedCustomer}>
              {isClearing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing Bill...
                </>
              ) : (
                "Clear Bill"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

