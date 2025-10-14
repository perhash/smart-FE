import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface AddRiderDialogProps {
  trigger?: React.ReactNode;
}

export function AddRiderDialog({ trigger }: AddRiderDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    status: "active",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Please enter rider name");
      return;
    }
    
    if (!formData.phone.trim()) {
      toast.error("Please enter phone number");
      return;
    }

    if (!formData.password.trim() || formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    // Phone validation
    const phoneRegex = /^[+]?[\d\s-()]+$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    toast.success(`Rider "${formData.name}" added successfully!`);
    
    // Reset form
    setFormData({
      name: "",
      phone: "",
      password: "",
      status: "active",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Rider
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Rider</DialogTitle>
          <DialogDescription>
            Create a new rider account for deliveries
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Rider Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Enter full name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password <span className="text-destructive">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">
              Status <span className="text-destructive">*</span>
            </Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Rider</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
