import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, MapPin, LogOut, ArrowLeft, Droplet, Package, Loader2, Plus, Trash2, Edit2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { apiService } from "@/services/api";
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
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

const Settings = () => {
  const { logout } = useAuth();
  
  // Company Setup State
  const [agencyName, setAgencyName] = useState("");
  const [agencyAddress, setAgencyAddress] = useState("");
  const [agencyPhoneNumber, setAgencyPhoneNumber] = useState("");
  const [agencyLogo, setAgencyLogo] = useState("");
  
  // Delivery Areas State
  const [newArea, setNewArea] = useState("");
  const [areasOperated, setAreasOperated] = useState<string[]>([]);
  
  // Bottle Categories State
  const [bottleCategories, setBottleCategories] = useState<any[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [categoryPrice, setCategoryPrice] = useState("");
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  
  // Loading State
  const [loading, setLoading] = useState(false);
  const [companySetupLoading, setCompanySetupLoading] = useState(true);
  
  // Company Setup ID
  const [companySetupId, setCompanySetupId] = useState<string | null>(null);

  // Load company setup on mount
  useEffect(() => {
    loadCompanySetup();
  }, []);

  // Load bottle categories when company setup exists
  useEffect(() => {
    if (companySetupId) {
      loadBottleCategories();
    }
  }, [companySetupId]);

  const loadCompanySetup = async () => {
    try {
      setCompanySetupLoading(true);
      const res = await apiService.getCompanySetup() as any;
      if (res.success && res.data) {
        setAgencyName(res.data.agencyName || "");
        setAgencyAddress(res.data.agencyAddress || "");
        setAgencyPhoneNumber(res.data.agencyPhoneNumber || "");
        setAgencyLogo(res.data.agencyLogo || "");
        setAreasOperated(Array.isArray(res.data.areasOperated) ? res.data.areasOperated : []);
        setCompanySetupId(res.data.id);
      }
    } catch (error: any) {
      console.error('Error loading company setup:', error);
    } finally {
      setCompanySetupLoading(false);
    }
  };

  const loadBottleCategories = async () => {
    try {
      const res = await apiService.getBottleCategories() as any;
      if (res.success) {
        setBottleCategories(res.data || []);
      }
    } catch (error: any) {
      console.error('Error loading bottle categories:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    window.location.href = '/login';
  };

  const handleAddArea = () => {
    if (newArea.trim()) {
      setAreasOperated([...areasOperated, newArea.trim()]);
      setNewArea("");
    }
  };

  const handleRemoveArea = (areaToRemove: string) => {
    setAreasOperated(areasOperated.filter(area => area !== areaToRemove));
  };

  const handleSaveCompany = async () => {
    try {
      setLoading(true);
      
      // Validate required fields
      if (!agencyName || !agencyAddress || !agencyPhoneNumber) {
        toast.error("Please fill all required fields");
        return;
      }

      const companyData = {
        agencyName,
        agencyAddress,
        agencyPhoneNumber,
        agencyLogo,
        areasOperated
      };

      let res: any;
      if (companySetupId) {
        // Update existing
        res = await apiService.updateCompanySetup(companyData);
      } else {
        // Create new
        res = await apiService.createCompanySetup(companyData);
        if (res.success && res.data) {
          setCompanySetupId(res.data.id);
        }
      }

      if (res.success) {
        toast.success("Company details saved successfully");
      }
    } catch (error: any) {
      console.error('Error saving company setup:', error);
      toast.error(error.message || "Failed to save company details");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryPrice("");
    setIsCategoryDialogOpen(true);
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setCategoryName(category.categoryName);
    setCategoryPrice(category.price.toString());
    setIsCategoryDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    try {
      if (!categoryName || !categoryPrice) {
        toast.error("Please fill all fields");
        return;
      }

      const categoryData = {
        categoryName,
        price: parseFloat(categoryPrice)
      };

      let res: any;
      if (editingCategory) {
        // Update existing
        res = await apiService.updateBottleCategory(editingCategory.id, categoryData);
      } else {
        // Create new
        res = await apiService.createBottleCategory(categoryData);
      }

      if (res.success) {
        toast.success(`Bottle category ${editingCategory ? 'updated' : 'created'} successfully`);
        setIsCategoryDialogOpen(false);
        loadBottleCategories();
      }
    } catch (error: any) {
      console.error('Error saving bottle category:', error);
      toast.error(error.message || "Failed to save bottle category");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const res = await apiService.deleteBottleCategory(id) as any;
      if (res.success) {
        toast.success("Bottle category deleted successfully");
        loadBottleCategories();
      }
    } catch (error: any) {
      console.error('Error deleting bottle category:', error);
      toast.error(error.message || "Failed to delete bottle category");
    }
  };

  if (companySetupLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Mobile Layout */}
      <div className="md:hidden pb-20">
        {/* Top Section - Blue Gradient Header */}
        <div className="bg-gradient-to-br from-cyan-900 via-cyan-500 to-cyan-900 p-6 pb-6">
          <Link to="/admin">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 mb-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <Droplet className="h-6 w-6 text-cyan-600" fill="currentColor" />
            </div>
            <div>
              <p className="text-sm text-white/90">Settings</p>
              <p className="text-2xl font-bold text-white">App Configuration</p>
            </div>
          </div>
        </div>

        {/* Content - White Cards */}
        <div className="bg-white rounded-t-3xl -mt-4 p-6 space-y-4 pb-4">
          {/* Company Details Card */}
          <div className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl p-4 border border-green-100">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-5 w-5 text-green-600" />
              <p className="font-bold text-gray-900">Company Details</p>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm text-gray-700">Company Name *</Label>
                <Input
                  id="company"
                  placeholder="Smart Supply"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm text-gray-700">Business Address *</Label>
                <Input
                  id="address"
                  placeholder="Enter business address"
                  value={agencyAddress}
                  onChange={(e) => setAgencyAddress(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm text-gray-700">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="+92 300 1234567"
                  value={agencyPhoneNumber}
                  onChange={(e) => setAgencyPhoneNumber(e.target.value)}
                  className="h-11"
                />
              </div>
              <Button 
                onClick={handleSaveCompany} 
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          </div>

          {/* Delivery Areas Card */}
          <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5 text-purple-600" />
              <p className="font-bold text-gray-900">Delivery Areas</p>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Manage the areas where you provide delivery services
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Add delivery area"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddArea()}
                  className="h-11"
                />
                <Button onClick={handleAddArea} className="h-11 bg-purple-600 hover:bg-purple-700 text-white">
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {areasOperated.map((area, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <span className="text-sm font-medium text-gray-900">{area}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveArea(area)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottle Categories Card */}
          <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <p className="font-bold text-gray-900">Bottle Categories</p>
              </div>
              <Button
                onClick={handleAddCategory}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Manage different bottle sizes and their prices
              </p>
              <div className="space-y-2">
                {bottleCategories.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No bottle categories yet</p>
                ) : (
                  bottleCategories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{category.categoryName}</p>
                        <p className="text-xs text-gray-500">RS. {parseFloat(category.price).toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Logout Card */}
          <div className="bg-gradient-to-br from-white to-red-50/30 rounded-2xl p-4 border border-red-100">
            <div className="flex items-center gap-2 mb-3">
              <LogOut className="h-5 w-5 text-red-600" />
              <p className="font-bold text-gray-900">Logout</p>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Sign out of your admin account
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full h-12">
                    <LogOut className="h-5 w-5 mr-2" />
                    Logout
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to logout of your admin account?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block max-w-4xl mx-auto px-6 py-6">
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Manage your account and preferences</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company Name *</Label>
                <Input
                  id="company"
                  placeholder="Smart Supply"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Business Address *</Label>
                <Input
                  id="address"
                  placeholder="Enter business address"
                  value={agencyAddress}
                  onChange={(e) => setAgencyAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="+92 300 1234567"
                  value={agencyPhoneNumber}
                  onChange={(e) => setAgencyPhoneNumber(e.target.value)}
                />
              </div>
              <Button onClick={handleSaveCompany} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Areas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Manage the areas where you provide delivery services
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Add delivery area"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddArea()}
                />
                <Button onClick={handleAddArea}>Add Area</Button>
              </div>
              <div className="space-y-2">
                {areasOperated.map((area, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span>{area}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveArea(area)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Bottle Categories
                </CardTitle>
                <Button onClick={handleAddCategory} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Category
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Manage different bottle sizes and their prices
              </p>
              <div className="space-y-2">
                {bottleCategories.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No bottle categories yet</p>
                ) : (
                  bottleCategories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{category.categoryName}</p>
                        <p className="text-sm text-muted-foreground">RS. {parseFloat(category.price).toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
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
                Sign out of your admin account
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Logout</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to logout of your admin account?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottle Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit' : 'Add'} Bottle Category</DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Update the bottle category details' : 'Add a new bottle category with its price'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name *</Label>
              <Input
                id="categoryName"
                placeholder="e.g., 19 Liter Bottle"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryPrice">Price (RS.) *</Label>
              <Input
                id="categoryPrice"
                type="number"
                placeholder="e.g., 90"
                value={categoryPrice}
                onChange={(e) => setCategoryPrice(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategory}>
              {editingCategory ? 'Update' : 'Add'} Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
