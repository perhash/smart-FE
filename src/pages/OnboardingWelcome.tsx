import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Droplet, Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { TESTING_MODE } from "@/config/api";

interface BottleCategory {
  id?: string;
  categoryName: string;
  price: string;
}

const OnboardingWelcome = () => {
  const navigate = useNavigate();
  const { setAuthToken, setAuthUser } = useAuth();
  
  // Step tracking
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Company Setup Data
  const [companySetup, setCompanySetup] = useState({
    agencyName: "",
    agencyAddress: "",
    agencyPhoneNumber: "",
    agencyLogo: "",
    areasOperated: [] as string[]
  });
  
  // Bottle Categories
  const [bottleCategories, setBottleCategories] = useState<BottleCategory[]>([
    { categoryName: "", price: "" },
    { categoryName: "", price: "" }
  ]);
  const [newArea, setNewArea] = useState("");
  
  // Admin User
  const [adminUser, setAdminUser] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  // Check if admin already exists (only in production mode)
  useEffect(() => {
    const checkAdmin = async () => {
      // Skip check in testing mode
      if (TESTING_MODE) {
        return;
      }
      
      try {
        const response = await apiService.checkAdminExists();
        if (response.success && response.data.hasAdmin) {
          // Redirect to login if admin exists
          toast.info("Agency already set up! Redirecting to login...");
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking admin:', error);
      }
    };
    
    checkAdmin();
  }, [navigate]);

  // Add area
  const handleAddArea = () => {
    if (newArea.trim() && !companySetup.areasOperated.includes(newArea.trim())) {
      setCompanySetup({
        ...companySetup,
        areasOperated: [...companySetup.areasOperated, newArea.trim()]
      });
      setNewArea("");
    }
  };

  // Remove area
  const handleRemoveArea = (area: string) => {
    setCompanySetup({
      ...companySetup,
      areasOperated: companySetup.areasOperated.filter(a => a !== area)
    });
  };

  // Add bottle category
  const handleAddBottleCategory = () => {
    setBottleCategories([...bottleCategories, { categoryName: "", price: "" }]);
  };

  // Remove bottle category
  const handleRemoveBottleCategory = (index: number) => {
    if (bottleCategories.length > 1) {
      setBottleCategories(bottleCategories.filter((_, i) => i !== index));
    }
  };

  // Update bottle category
  const handleUpdateBottleCategory = (index: number, field: keyof BottleCategory, value: string) => {
    const updated = [...bottleCategories];
    updated[index][field] = value;
    setBottleCategories(updated);
  };

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file");
        return;
      }
      
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanySetup({
          ...companySetup,
          agencyLogo: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Validate step 1
  const validateStep1 = () => {
    if (!companySetup.agencyName || !companySetup.agencyAddress || !companySetup.agencyPhoneNumber) {
      toast.error("Please fill in all company details");
      return false;
    }
    if (!companySetup.agencyLogo) {
      toast.error("Please upload a company logo");
      return false;
    }
    if (companySetup.areasOperated.length === 0) {
      toast.error("Please add at least one service area");
      return false;
    }
    return true;
  };

  // Validate step 2
  const validateStep2 = () => {
    for (const category of bottleCategories) {
      if (!category.categoryName || !category.price) {
        toast.error("Please fill in all bottle categories");
        return false;
      }
      if (isNaN(parseFloat(category.price)) || parseFloat(category.price) <= 0) {
        toast.error("Please enter valid prices for all categories");
        return false;
      }
    }
    return true;
  };

  // Validate step 3
  const validateStep3 = () => {
    if (!adminUser.name || !adminUser.email || !adminUser.phone || !adminUser.password) {
      toast.error("Please fill in all admin details");
      return false;
    }
    if (adminUser.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return false;
    }
    if (adminUser.password !== adminUser.confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminUser.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    return true;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateStep3()) return;
    
    setLoading(true);
    
    try {
      const onboardingData = {
        companySetup: {
          agencyName: companySetup.agencyName,
          agencyAddress: companySetup.agencyAddress,
          agencyPhoneNumber: companySetup.agencyPhoneNumber,
          agencyLogo: companySetup.agencyLogo,
          areasOperated: companySetup.areasOperated
        },
        bottleCategories: bottleCategories.map(cat => ({
          categoryName: cat.categoryName,
          price: cat.price
        })),
        adminUser: {
          name: adminUser.name,
          email: adminUser.email,
          phone: adminUser.phone,
          password: adminUser.password
        }
      };
      
      const response = await apiService.completeOnboarding(onboardingData);
      
      if (response.success && response.data.token) {
        // Save token and user
        setAuthToken(response.data.token);
        setAuthUser(response.data.adminUser);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.adminUser));
        
        toast.success("Agency setup completed successfully!");
        setTimeout(() => {
          navigate('/admin');
        }, 1500);
      } else {
        toast.error(response.message || "Failed to complete setup");
      }
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast.error(error.message || "Failed to complete setup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-900 via-cyan-500 to-cyan-900 pb-6">
      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Header */}
        <div className="p-6 pb-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Welcome!</h1>
          <p className="text-white/90">Let's set up your agency</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-t-3xl -mt-4 p-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  currentStep === step 
                    ? 'bg-cyan-600 text-white' 
                    : currentStep > step 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {currentStep > step ? '✓' : step}
                </div>
                {step < 3 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    currentStep > step ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Company Setup */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-4">Company Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="agencyName">Agency Name *</Label>
                    <Input
                      id="agencyName"
                      placeholder="Enter agency name"
                      value={companySetup.agencyName}
                      onChange={(e) => setCompanySetup({...companySetup, agencyName: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="agencyAddress">Agency Address *</Label>
                    <Input
                      id="agencyAddress"
                      placeholder="Enter complete address"
                      value={companySetup.agencyAddress}
                      onChange={(e) => setCompanySetup({...companySetup, agencyAddress: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="agencyPhone">Phone Number *</Label>
                    <Input
                      id="agencyPhone"
                      type="tel"
                      placeholder="+92 300 1234567"
                      value={companySetup.agencyPhoneNumber}
                      onChange={(e) => setCompanySetup({...companySetup, agencyPhoneNumber: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label>Company Logo *</Label>
                    <div className="mt-2">
                      {companySetup.agencyLogo ? (
                        <div className="relative">
                          <img 
                            src={companySetup.agencyLogo} 
                            alt="Logo" 
                            className="w-32 h-32 object-contain rounded-lg border-2 border-gray-200"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute top-0 right-0"
                            onClick={() => setCompanySetup({...companySetup, agencyLogo: ""})}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500">Click to upload logo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoUpload}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Service Areas *</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Add area (e.g., Downtown)"
                        value={newArea}
                        onChange={(e) => setNewArea(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddArea()}
                      />
                      <Button type="button" onClick={handleAddArea} size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {companySetup.areasOperated.map((area, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full"
                        >
                          <span className="text-sm">{area}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-cyan-200"
                            onClick={() => handleRemoveArea(area)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => validateStep1() && setCurrentStep(2)}
                className="w-full bg-cyan-600 hover:bg-cyan-700"
              >
                Next
              </Button>
            </div>
          )}

          {/* Step 2: Bottle Categories */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-4">Bottle Categories & Prices</h2>
                
                <div className="space-y-4">
                  {bottleCategories.map((category, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">Category {index + 1}</span>
                        {bottleCategories.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveBottleCategory(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor={`category-${index}`}>Category Name *</Label>
                        <Input
                          id={`category-${index}`}
                          placeholder="e.g., 19 Liter Bottle"
                          value={category.categoryName}
                          onChange={(e) => handleUpdateBottleCategory(index, 'categoryName', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`price-${index}`}>Price (RS.) *</Label>
                        <Input
                          id={`price-${index}`}
                          type="number"
                          placeholder="90"
                          value={category.price}
                          onChange={(e) => handleUpdateBottleCategory(index, 'price', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddBottleCategory}
                    className="w-full border-dashed"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={() => validateStep2() && setCurrentStep(3)}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Admin User */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-4">Create Admin Account</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="adminName">Full Name *</Label>
                    <Input
                      id="adminName"
                      placeholder="Enter your name"
                      value={adminUser.name}
                      onChange={(e) => setAdminUser({...adminUser, name: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="adminEmail">Email *</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      placeholder="admin@agency.com"
                      value={adminUser.email}
                      onChange={(e) => setAdminUser({...adminUser, email: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="adminPhone">Phone Number *</Label>
                    <Input
                      id="adminPhone"
                      type="tel"
                      placeholder="+92 300 1234567"
                      value={adminUser.phone}
                      onChange={(e) => setAdminUser({...adminUser, phone: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="adminPassword">Password *</Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      placeholder="At least 6 characters"
                      value={adminUser.password}
                      onChange={(e) => setAdminUser({...adminUser, password: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter password"
                      value={adminUser.confirmPassword}
                      onChange={(e) => setAdminUser({...adminUser, confirmPassword: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="flex-1"
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Setting Up...
                    </>
                  ) : (
                    "Complete Setup"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex min-h-screen">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-2xl">
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <div className="bg-gradient-to-br from-cyan-600 to-cyan-500 rounded-full p-5">
                    <Droplet className="h-12 w-12 text-white" fill="white" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold mb-2">Welcome to Smart Supply!</h1>
                <p className="text-gray-600">Let's set up your agency in 3 simple steps</p>
              </div>

              {/* Step Indicator */}
              <div className="flex items-center justify-between mb-8">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      currentStep === step 
                        ? 'bg-cyan-600 text-white' 
                        : currentStep > step 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {currentStep > step ? '✓' : step}
                    </div>
                    {step < 3 && (
                      <div className={`flex-1 h-1 mx-2 ${
                        currentStep > step ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Steps content - same as mobile */}
              {/* Step 1 */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold mb-4">Company Information</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="agencyName">Agency Name *</Label>
                        <Input
                          id="agencyName"
                          placeholder="Enter agency name"
                          value={companySetup.agencyName}
                          onChange={(e) => setCompanySetup({...companySetup, agencyName: e.target.value})}
                        />
                      </div>

                      <div>
                        <Label htmlFor="agencyPhone">Phone Number *</Label>
                        <Input
                          id="agencyPhone"
                          type="tel"
                          placeholder="+92 300 1234567"
                          value={companySetup.agencyPhoneNumber}
                          onChange={(e) => setCompanySetup({...companySetup, agencyPhoneNumber: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <Label htmlFor="agencyAddress">Agency Address *</Label>
                      <Input
                        id="agencyAddress"
                        placeholder="Enter complete address"
                        value={companySetup.agencyAddress}
                        onChange={(e) => setCompanySetup({...companySetup, agencyAddress: e.target.value})}
                      />
                    </div>

                    <div className="mt-4">
                      <Label>Company Logo *</Label>
                      <div className="mt-2">
                        {companySetup.agencyLogo ? (
                          <div className="relative inline-block">
                            <img 
                              src={companySetup.agencyLogo} 
                              alt="Logo" 
                              className="w-32 h-32 object-contain rounded-lg border-2 border-gray-200"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute top-0 right-0"
                              onClick={() => setCompanySetup({...companySetup, agencyLogo: ""})}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-500">Click to upload logo</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleLogoUpload}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <Label>Service Areas *</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          placeholder="Add area (e.g., Downtown)"
                          value={newArea}
                          onChange={(e) => setNewArea(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddArea()}
                        />
                        <Button type="button" onClick={handleAddArea} size="icon">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {companySetup.areasOperated.map((area, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full"
                          >
                            <span className="text-sm">{area}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-cyan-200"
                              onClick={() => handleRemoveArea(area)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => validateStep1() && setCurrentStep(2)}
                    className="w-full bg-cyan-600 hover:bg-cyan-700"
                  >
                    Next
                  </Button>
                </div>
              )}

              {/* Step 2 */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold mb-4">Bottle Categories & Prices</h2>
                    <div className="space-y-4">
                      {bottleCategories.map((category, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-700">Category {index + 1}</span>
                            {bottleCategories.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveBottleCategory(index)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`category-${index}`}>Category Name *</Label>
                              <Input
                                id={`category-${index}`}
                                placeholder="e.g., 19 Liter Bottle"
                                value={category.categoryName}
                                onChange={(e) => handleUpdateBottleCategory(index, 'categoryName', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`price-${index}`}>Price (RS.) *</Label>
                              <Input
                                id={`price-${index}`}
                                type="number"
                                placeholder="90"
                                value={category.price}
                                onChange={(e) => handleUpdateBottleCategory(index, 'price', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddBottleCategory}
                        className="w-full border-dashed"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Category
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={() => validateStep2() && setCurrentStep(3)}
                      className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold mb-4">Create Admin Account</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="adminName">Full Name *</Label>
                        <Input
                          id="adminName"
                          placeholder="Enter your name"
                          value={adminUser.name}
                          onChange={(e) => setAdminUser({...adminUser, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="adminPhone">Phone Number *</Label>
                        <Input
                          id="adminPhone"
                          type="tel"
                          placeholder="+92 300 1234567"
                          value={adminUser.phone}
                          onChange={(e) => setAdminUser({...adminUser, phone: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="adminEmail">Email *</Label>
                        <Input
                          id="adminEmail"
                          type="email"
                          placeholder="admin@agency.com"
                          value={adminUser.email}
                          onChange={(e) => setAdminUser({...adminUser, email: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="adminPassword">Password *</Label>
                        <Input
                          id="adminPassword"
                          type="password"
                          placeholder="At least 6 characters"
                          value={adminUser.password}
                          onChange={(e) => setAdminUser({...adminUser, password: e.target.value})}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="confirmPassword">Confirm Password *</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Re-enter password"
                          value={adminUser.confirmPassword}
                          onChange={(e) => setAdminUser({...adminUser, confirmPassword: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                      className="flex-1"
                      disabled={loading}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Setting Up...
                        </>
                      ) : (
                        "Complete Setup"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWelcome;

