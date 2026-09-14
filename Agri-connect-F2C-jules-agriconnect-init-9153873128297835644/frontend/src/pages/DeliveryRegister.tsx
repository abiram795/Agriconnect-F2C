import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Truck, Upload, Eye, EyeOff } from "lucide-react";

export default function DeliveryRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
    service_area: "",
    vehicle_type: "Bike",
    service_radius_km: 10,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [license, setLicense] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.password) {
      setErrorMsg("Please enter a password.");
      return;
    }
    if (formData.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    
    const data = new FormData();
    data.append("name", formData.name);
    data.append("phone", formData.phone);
    data.append("password", formData.password);
    if (formData.email) data.append("email", formData.email);
    if (formData.address) data.append("address", formData.address);
    if (formData.service_area) data.append("service_area", formData.service_area);
    data.append("vehicle_type", formData.vehicle_type);
    data.append("service_radius_km", formData.service_radius_km.toString());
    if (license) data.append("license_document", license);

    try {
      const res = await fetch("/api/delivery/register", {
        method: "POST",
        body: data,
      });
      if (res.ok) {
        const userData = await res.json();
        localStorage.setItem("agriconnect_user_id", userData.id);
        localStorage.setItem("agriconnect_user_role", userData.role);
        localStorage.setItem("agriconnect_user_name", userData.name);
        navigate("/delivery/dashboard");
      } else {
        let errMsg = "Registration failed. Please check your details.";
        try {
          const errData = await res.json();
          if (typeof errData.detail === 'string') {
            errMsg = errData.detail;
          } else if (Array.isArray(errData.detail)) {
            errMsg = errData.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
          } else if (errData.detail) {
            errMsg = JSON.stringify(errData.detail);
          } else if (errData.message) {
            errMsg = errData.message;
          }
        } catch (_) {}
        setErrorMsg(errMsg);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("A network error occurred. Please check your connection.");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div>
          <Truck className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
            Delivery Partner Registration
          </h2>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">
            {errorMsg}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">Full Name *</label>
              <input id="name" type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="appearance-none rounded relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Mobile Number *</label>
              <input id="phone" type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="appearance-none rounded relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email Address (Optional)</label>
              <input id="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="appearance-none rounded relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password *</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="appearance-none rounded relative block w-full px-3 py-2 pr-10 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">Confirm Password *</label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={formData.confirmPassword}
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  className="appearance-none rounded relative block w-full px-3 py-2 pr-10 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-slate-700">Address</label>
              <textarea id="address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="appearance-none rounded relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="service_area" className="block text-sm font-medium text-slate-700">Service Area (City/Pincode)</label>
              <input id="service_area" type="text" value={formData.service_area} onChange={e => setFormData({...formData, service_area: e.target.value})} className="appearance-none rounded relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="vehicle_type" className="block text-sm font-medium text-slate-700">Vehicle Type</label>
              <select id="vehicle_type" value={formData.vehicle_type} onChange={e => setFormData({...formData, vehicle_type: e.target.value})} className="mt-1 block w-full py-2 px-3 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                <option value="Bike">Bike / Two Wheeler</option>
                <option value="Auto">Auto Rickshaw</option>
                <option value="Mini Truck">Mini Truck</option>
              </select>
            </div>
            <div>
              <label htmlFor="license" className="block text-sm font-medium text-slate-700">Driving License</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-slate-400" />
                  <div className="flex text-sm text-slate-600">
                    <label htmlFor="license_upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Upload a file</span>
                      <input id="license_upload" name="license_upload" type="file" className="sr-only" onChange={e => setLicense(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <p className="text-xs text-slate-500">{license ? license.name : 'PNG, JPG, PDF up to 5MB'}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <button type="submit" disabled={isLoading} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              {isLoading ? 'Registering...' : 'Register'}
            </button>
          </div>
          <div className="text-center">
            <Link to="/" className="font-medium text-blue-600 hover:text-blue-500 text-sm">
              Back to Home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
