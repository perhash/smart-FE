import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, MapPin, LogOut, ArrowLeft, Droplet, Package, Loader2, Plus, Trash2, Edit2, User, Eye, EyeOff, Image as ImageIcon, X } from "lucide-react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const Settings = () => {
  const { logout, user } = useAuth();
  
  // Admin Profile State
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  
  // Company Setup State
  const [agencyName, setAgencyName] = useState("");
  const [agencyAddress, setAgencyAddress] = useState("");
  const [agencyPhoneNumber, setAgencyPhoneNumber] = useState("");
  const [agencyLogo, setAgencyLogo] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [isLogoDialogOpen, setIsLogoDialogOpen] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  
  // Delivery Areas State (part of company setup)
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
        setLogoPreview(res.data.agencyLogo || "");
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

  const handlePasswordUpdate = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }

    setPasswordUpdating(true);
    
    try {
      const response = await apiService.updatePassword({
        currentPassword,
        newPassword
      }) as any;
      
      if (response?.success) {
        toast.success("Password updated successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setIsPasswordDialogOpen(false);
      } else {
        toast.error(response?.message || "Failed to update password");
      }
    } catch (error) {
      console.error('Password update error:', error);
      toast.error("Failed to update password. Please try again.");
    } finally {
      setPasswordUpdating(false);
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, or GIF)");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    setLogoFile(file);

    // Read and preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setLogoPreview(base64String);
      setAgencyLogo(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview("");
    setAgencyLogo("");
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
          {/* Admin Profile Card */}
          <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-5 w-5 text-blue-600" />
              <p className="font-bold text-gray-900">Admin Profile</p>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="adminName" className="text-sm text-gray-700">Name</Label>
                <Input
                  id="adminName"
                  value={(user as any)?.profile?.name || (user as any)?.adminProfile?.name || "Admin User"}
                  disabled
                  className="h-11 bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail" className="text-sm text-gray-700">Email</Label>
                <Input
                  id="adminEmail"
                  value={user?.email || ""}
                  disabled
                  className="h-11 bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminPhone" className="text-sm text-gray-700">Phone</Label>
                <Input
                  id="adminPhone"
                  value={user?.phone || ""}
                  disabled
                  className="h-11 bg-gray-50"
                />
              </div>
              <Button 
                onClick={() => setIsPasswordDialogOpen(true)}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Change Password
              </Button>
            </div>
          </div>

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
                <Textarea
                  id="address"
                  placeholder="Enter business address"
                  value={agencyAddress}
                  onChange={(e) => setAgencyAddress(e.target.value)}
                  rows={2}
                  className="min-h-[80px]"
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

              {/* Logo Section */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-700">Logo</Label>
                {logoPreview ? (
                  <div className="relative inline-block">
                    <img 
                      src={logoPreview} 
                      alt="Agency Logo" 
                      className="h-24 w-24 object-contain border border-gray-200 rounded-lg"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveLogo}
                      className="absolute top-0 right-0 h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    className="w-full h-24 border-2 border-dashed border-gray-300"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                      <span className="text-sm text-gray-600">Upload Logo</span>
                    </div>
                  </Button>
                )}
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif"
                  onChange={handleLogoSelect}
                  className="hidden"
                />
              </div>

              {/* Delivery Areas Section */}
              <div className="space-y-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-purple-600" />
                  <p className="text-sm font-semibold text-gray-900">Delivery Areas</p>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add delivery area"
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddArea()}
                    className="h-10"
                  />
                  <Button onClick={handleAddArea} className="h-10 bg-purple-600 hover:bg-purple-700 text-white">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {areasOperated.map((area, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                      <span className="text-sm font-medium text-gray-900">{area}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveArea(area)}
                        className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {areasOperated.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-2">No delivery areas added yet</p>
                  )}
                </div>
              </div>

              <Button 
                onClick={handleSaveCompany} 
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {companySetupId ? "Update Company Details" : "Save Company Details"}
              </Button>
            </div>
          </div>

          {/* Bottle Categories Card - Only show if company setup exists */}
          {companySetupId && (
            <div className="bg-gradient-to-br from-white to-cyan-50/30 rounded-2xl p-4 border border-cyan-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-cyan-600" />
                  <p className="font-bold text-gray-900">Bottle Categories</p>
                </div>
                <Button
                  onClick={handleAddCategory}
                  size="sm"
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
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
          )}

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
                <User className="h-5 w-5" />
                Admin Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminName">Name</Label>
                <Input
                  id="adminName"
                  value={(user as any)?.profile?.name || (user as any)?.adminProfile?.name || "Admin User"}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Email</Label>
                <Input
                  id="adminEmail"
                  value={user?.email || ""}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminPhone">Phone</Label>
                <Input
                  id="adminPhone"
                  value={user?.phone || ""}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <Button onClick={() => setIsPasswordDialogOpen(true)} variant="outline">
                Change Password
              </Button>
            </CardContent>
          </Card>

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
                <Textarea
                  id="address"
                  placeholder="Enter business address"
                  value={agencyAddress}
                  onChange={(e) => setAgencyAddress(e.target.value)}
                  rows={2}
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

              {/* Logo Section */}
              <div className="space-y-2">
                <Label>Logo</Label>
                {logoPreview ? (
                  <div className="relative inline-block">
                    <img 
                      src={logoPreview} 
                      alt="Agency Logo" 
                      className="h-24 w-24 object-contain border border-gray-200 rounded-lg"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveLogo}
                      className="absolute top-0 right-0 h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('logo-upload-desktop')?.click()}
                    className="w-full h-24 border-2 border-dashed border-gray-300"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                      <span className="text-sm text-gray-600">Upload Logo</span>
                    </div>
                  </Button>
                )}
                <input
                  id="logo-upload-desktop"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif"
                  onChange={handleLogoSelect}
                  className="hidden"
                />
              </div>

              {/* Delivery Areas Section */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-purple-600" />
                  <Label className="text-base font-semibold">Delivery Areas</Label>
                </div>
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
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {areasOperated.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-2">No delivery areas added yet</p>
                  )}
                </div>
              </div>

              <Button onClick={handleSaveCompany} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {companySetupId ? "Update Company Details" : "Save Company Details"}
              </Button>
            </CardContent>
          </Card>

          {companySetupId && (
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
          )}

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

      {/* Password Change Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password *</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password *</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordUpdate} disabled={passwordUpdating}>
              {passwordUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
