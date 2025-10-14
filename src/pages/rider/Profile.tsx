import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Phone, TruckIcon, LogOut, Award } from "lucide-react";

const RiderProfile = () => {
  const riderInfo = {
    name: "Ali Khan",
    phone: "+91 98765 43215",
    status: "active",
    totalDeliveries: 234,
    thisWeek: 47,
    rating: 4.8,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue={riderInfo.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <Input id="phone" defaultValue={riderInfo.phone} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input id="password" type="password" placeholder="Enter new password" />
          </div>
          <Button>Update Profile</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TruckIcon className="h-5 w-5" />
            Delivery Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold">{riderInfo.totalDeliveries}</p>
              <p className="text-sm text-muted-foreground">Total Deliveries</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold">{riderInfo.thisWeek}</p>
              <p className="text-sm text-muted-foreground">This Week</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-warning" />
              <span className="font-medium">Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{riderInfo.rating}</span>
              <span className="text-muted-foreground">/ 5.0</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <span className="font-medium">Status</span>
            <Badge variant={riderInfo.status === "active" ? "default" : "secondary"}>
              {riderInfo.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <LogOut className="h-5 w-5" />
            Logout
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Sign out of your rider account
          </p>
          <Button variant="destructive">Logout</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiderProfile;
