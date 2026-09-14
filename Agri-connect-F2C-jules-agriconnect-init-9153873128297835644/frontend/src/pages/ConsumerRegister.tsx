import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, ArrowRight, MapPin, Eye, EyeOff } from "lucide-react";

export default function ConsumerRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    address_line: "",
    locality: "",
    city: "",
    state: "",
    pincode: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.password) {
      setError("Please enter a password.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (formData.phone.length < 10) {
      setError("Please enter a valid mobile number.");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/consumers/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || "Registration failed. Please try again.");
      }
      
      // Save credentials to auto-login
      localStorage.setItem("agriconnect_user_id", data.id);
      localStorage.setItem("agriconnect_user_role", data.role);
      
      alert("Registration successful!");
      navigate("/consumer");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-8 pt-8 pb-6 bg-green-50 border-b border-green-100 text-center">
          <UserPlus className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-slate-800">Consumer Registration</h2>
          <p className="text-sm text-slate-600 mt-1">Join AgriConnect and buy directly from farmers</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input
                  required
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number *</label>
                <input
                  required
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    minLength={6}
                    className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password *</label>
                <div className="relative">
                  <input
                    required
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    minLength={6}
                    className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 mt-6 transition-colors"
              >
                Next: Setup Address <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-4 text-green-700 font-medium">
                <MapPin className="w-5 h-5" />
                <span>Primary Delivery Address</span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Address (House, Building, Street) *</label>
                <input
                  required
                  type="text"
                  name="address_line"
                  value={formData.address_line}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="123 Main Street, Appt 4B"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Area / Locality</label>
                  <input
                    type="text"
                    name="locality"
                    value={formData.locality}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Downtown"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                  <input
                    required
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Chennai"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State *</label>
                  <input
                    required
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Tamil Nadu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pincode *</label>
                  <input
                    required
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="600001"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  {loading ? "Registering..." : "Complete Registration"}
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-200 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">
              Log in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
