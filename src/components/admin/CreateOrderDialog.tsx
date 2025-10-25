import { useEffect, useMemo, useState } from "react";
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
import { Search, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiService } from "@/services/api";

interface CreateOrderDialogProps {
  trigger?: React.ReactNode;
}

export function CreateOrderDialog({ trigger }: CreateOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [bottles, setBottles] = useState("");
  const [pricePerBottle, setPricePerBottle] = useState("90");
  const [selectedRider, setSelectedRider] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState("medium");
  const [orderType, setOrderType] = useState("delivery");
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingRiders, setLoadingRiders] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  

  // Load riders when dialog opens
  useEffect(() => {
    const loadRiders = async () => {
      if (!open) return;
      try {
        setLoadingRiders(true);
        const res = await apiService.getRiders();
        if ((res as any).success) {
          setRiders((res as any).data);
        } else {
          setRiders([]);
        }
      } catch (e) {
        setRiders([]);
      } finally {
        setLoadingRiders(false);
      }
    };
    loadRiders();
  }, [open]);

  // Reset loading state when dialog closes
  useEffect(() => {
    if (!open) {
      setIsCreating(false);
    }
  }, [open]);

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

  const filteredCustomers = customerResults;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }
    
    if (!bottles || parseInt(bottles) <= 0) {
      toast.error("Please enter valid quantity");
      return;
    }

    if (orderType === 'delivery' && !selectedRider) {
      toast.error("Please select a rider for delivery orders");
      return;
    }
    
    try {
      setIsCreating(true);
      const payload: any = {
        customerId: selectedCustomer.id === 'walkin' ? 'walkin' : selectedCustomer.id,
        numberOfBottles: parseInt(bottles),
        unitPrice: parseInt(pricePerBottle),
        notes: notes || undefined,
        priority: priority === 'high' ? 'HIGH' : priority === 'low' ? 'LOW' : 'NORMAL',
        orderType: orderType.toUpperCase(),
      };
      if (orderType === 'delivery' && selectedRider) {
        payload.riderId = selectedRider;
      }
      const res = await apiService.createOrder(payload);
      if ((res as any).success) {
        const currentOrderAmount = parseInt(bottles) * parseInt(pricePerBottle);
        const customerBalance = selectedCustomer.currentBalance ?? 0;
        const totalAmount = currentOrderAmount + customerBalance;
        
        toast.success(`Order created successfully! Total: RS. ${totalAmount}`);
        
        // Reset form
        setSelectedCustomer(null);
        setSearchQuery("");
        setBottles("");
        setPricePerBottle("90");
        setSelectedRider("");
        setNotes("");
        setPriority('medium');
        setOrderType('delivery');
        setPaymentAmount("");
        setPaymentMethod("CASH");
        setPaymentNotes("");
        setOpen(false);
      } else {
        toast.error((res as any).message || 'Failed to create order');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create order');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Order
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
          <DialogDescription>
            Search for customer and fill in order details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Type Selection */}
          <div className="space-y-2">
            <Label>Order Type</Label>
            <Select value={orderType} onValueChange={setOrderType}>
              <SelectTrigger>
                <SelectValue placeholder="Select order type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="walkin">Walk-in</SelectItem>
              </SelectContent>
            </Select>
          </div>


          {/* Customer Search */}
          <div className="space-y-2">
            <Label>
              Search Customer {orderType === 'walkin' ? '(or select Walk-in Customer for unknown customers)' : '(by name, phone, WhatsApp, or house number)'}
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
            <p className="text-xs text-muted-foreground">
              You can search by customer name, phone number, WhatsApp number, or house number
            </p>
            
            {searchQuery && !selectedCustomer && (
              <div className="mt-2 max-h-48 overflow-y-auto border rounded-md">
                {loadingCustomers ? (
                  <p className="p-3 text-sm text-muted-foreground">Searching...</p>
                ) : filteredCustomers.length > 0 ? (
                  <>
                    {/* Walk-in Customer Option for Walk-in Orders */}
                    {orderType === 'walkin' && (
                      <div
                        onClick={() => {
                          setSelectedCustomer({
                            id: 'walkin',
                            name: 'Walk-in Customer',
                            phone: '000-000-0000',
                            currentBalance: 0
                          });
                          setSearchQuery("");
                        }}
                        className="p-3 hover:bg-muted cursor-pointer border-b bg-blue-50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-blue-700">Walk-in Customer</p>
                            <p className="text-sm text-blue-600">For unknown customers</p>
                          </div>
                          <Badge variant="outline" className="bg-blue-100 text-blue-700">
                            Generic
                          </Badge>
                        </div>
                      </div>
                    )}
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setSearchQuery("");
                        }}
                        className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-sm text-muted-foreground">{customer.phone}</p>
                            {customer.houseNo && (
                              <p className="text-xs text-blue-600 font-medium">House: {customer.houseNo}</p>
                            )}
                            {customer.address && (
                              <p className="text-xs text-muted-foreground">{customer.address}</p>
                            )}
                          </div>
                          <Badge variant={(customer.currentBalance ?? 0) < 0 ? "destructive" : "default"}>
                            {(customer.currentBalance ?? 0) < 0 ? `Payable RS. ${Math.abs(customer.currentBalance)}` : (customer.currentBalance ?? 0) > 0 ? `Receivable RS. ${customer.currentBalance}` : 'Clear'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </>
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
                  {selectedCustomer.address && (
                    <p className="text-sm text-muted-foreground">{selectedCustomer.address}</p>
                  )}
                </div>
                <div className="text-right">
                  <Badge variant={(selectedCustomer.currentBalance ?? 0) < 0 ? "destructive" : "default"}>
                    {(selectedCustomer.currentBalance ?? 0) < 0 ? "Payable" : (selectedCustomer.currentBalance ?? 0) > 0 ? "Receivable" : 'Clear'}
                  </Badge>
                  <p className="text-sm font-medium mt-1">RS. {Math.abs(selectedCustomer.currentBalance ?? 0)}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setSelectedCustomer(null)}
              >
                Change Customer
              </Button>
            </div>
          )}

          {/* Order Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bottles">Bottle Quantity *</Label>
              <Input
                id="bottles"
                type="number"
                min="1"
                placeholder="Enter quantity"
                value={bottles}
                onChange={(e) => setBottles(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price per Bottle (RS. ) *</Label>
              <Input
                id="price"
                type="number"
                min="1"
                placeholder="90"
                value={pricePerBottle}
                onChange={(e) => setPricePerBottle(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Order Amount Summary */}
          {bottles && pricePerBottle && selectedCustomer && (
            <div className="space-y-3">
              {/* Current Order Amount */}
              <div className="rounded-lg border bg-primary/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Current Order Amount</span>
                  <span className="text-2xl font-bold">
                    RS. {parseInt(bottles) * parseInt(pricePerBottle)}
                  </span>
                </div>
              </div>

              {/* Pending Balance */}
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Pending Balance</span>
                  <div className="text-right">
                    <Badge variant={(selectedCustomer.currentBalance ?? 0) < 0 ? "destructive" : "default"}>
                      {(selectedCustomer.currentBalance ?? 0) < 0 ? "Payable" : (selectedCustomer.currentBalance ?? 0) > 0 ? "Receivable" : 'Clear'}
                    </Badge>
                    <p className="text-lg font-semibold mt-1">
                      RS. {Math.abs(selectedCustomer.currentBalance ?? 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Total for Admin Understanding */}
              <div className="rounded-lg border-2 border-primary bg-primary/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg">Total for Admin</span>
                  <span className="text-3xl font-bold text-primary">
                    RS. {(() => {
                      const currentOrderAmount = parseInt(bottles) * parseInt(pricePerBottle);
                      const customerBalance = selectedCustomer.currentBalance ?? 0;
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
                <p className="text-sm text-muted-foreground mt-2">
                  {(() => {
                    const customerBalance = selectedCustomer.currentBalance ?? 0;
                    if (customerBalance < 0) {
                      return `Order amount minus payable balance`;
                    } else if (customerBalance > 0) {
                      return `Order amount plus receivable balance`;
                    } else {
                      return `No balance adjustment needed`;
                    }
                  })()}
                </p>
              </div>
            </div>
          )}

          {/* Rider Assignment - Only for Delivery Orders */}
          {orderType === 'delivery' && (
            <div className="space-y-2">
              <Label htmlFor="rider">Assign Rider (required for delivery)</Label>
              <Select value={selectedRider} onValueChange={setSelectedRider}>
                <SelectTrigger id="rider">
                  <SelectValue placeholder={loadingRiders ? 'Loading riders...' : 'Select a rider'} />
                </SelectTrigger>
                <SelectContent>
                  {riders.map((rider: any) => (
                    <SelectItem key={rider.id} value={rider.id}>
                      <div className="flex items-center gap-2">
                        <span>{rider.name}</span>
                        <Badge variant="outline" className="ml-auto">
                          {rider.isActive ? 'active' : 'inactive'}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger id="priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add delivery instructions or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Order...
                </>
              ) : (
                "Create Order"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
