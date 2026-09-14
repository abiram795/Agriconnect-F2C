import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import locationData from "../states-and-districts.json";

export default function FarmerRegister() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [selectedState, setSelectedState] = useState("");
  const [districts, setDistricts] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stateVal = e.target.value;
    setSelectedState(stateVal);
    const foundState = locationData.states.find(s => s.state === stateVal);
    setDistricts(foundState ? foundState.districts : []);
    setSelectedDistrict("");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!password) {
      setErrorMsg("Please enter a password.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      const submitData = new FormData();
      submitData.append("name", formData.get("fullName") as string);
      submitData.append("phone", formData.get("mobileNumber") as string);
      submitData.append("password", password);
      submitData.append("state", selectedState);
      submitData.append("district", selectedDistrict);
      submitData.append("village", formData.get("village") as string);
      submitData.append("farm_size", formData.get("farmSize") as string);
      submitData.append("languages", formData.get("language") as string);
      submitData.append("land_area", formData.get("landArea") as string);
      submitData.append("acreage", formData.get("acreage") as string);
      submitData.append("ownership_status", formData.get("ownershipStatus") as string);
      submitData.append("document_type", formData.get("documentType") as string);
      
      const fileInput = formData.get("landDocument");
      if (fileInput && (fileInput as File).size > 0) {
          submitData.append("document", fileInput);
      }

      const response = await fetch('/api/farmers/register', {
        method: 'POST',
        body: submitData,
      });

      if (!response.ok) {
        let errMsg = "Registration failed. Please check your details and try again.";
        try {
          const errData = await response.json();
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
        throw new Error(errMsg);
      }
      
      const userData = await response.json();
      localStorage.setItem('agriconnect_user_id', userData.id);
      localStorage.setItem('agriconnect_user_role', userData.role);
      localStorage.setItem('agriconnect_user_name', userData.name || '');

      navigate("/farmer", { state: { message: "Welcome to AgriConnect! Your account is pending verification." } });
    } catch (error: any) {
      console.error('Error registering farmer:', error);
      setErrorMsg(error.message || "Registration failed. Please check your details and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex justify-center items-center">
      <div className="w-full max-w-2xl bg-card p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-primary mb-2">Farmer Registration</h1>
        <p className="text-gray-600 mb-8">Join AgriConnect to sell directly to consumers.</p>

        {errorMsg && (
          <div className="mb-6 bg-red-50 text-red-800 p-4 rounded-xl border border-red-200">
             {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input required name="fullName" type="text" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" placeholder="Enter your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
              <input required name="mobileNumber" type="tel" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" placeholder="10-digit number" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
              <div className="relative">
                <input
                  required
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <select required name="state" value={selectedState} onChange={handleStateChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-white">
                <option value="">Select State</option>
                {locationData.states.map((s) => (
                  <option key={s.state} value={s.state}>{s.state}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
              <select required name="district" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} disabled={!selectedState} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-white disabled:bg-gray-100 disabled:text-gray-500">
                <option value="">Select District</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Village / Town</label>
              <input required name="village" type="text" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" placeholder="Your village/town" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Farm Size</label>
              <select name="farmSize" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-white">
                <option value="">Select size...</option>
                <option value="small">Less than 2 acres</option>
                <option value="medium">2 - 5 acres</option>
                <option value="large">More than 5 acres</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Language</label>
              <select name="language" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-white">
                <option value="tamil">Tamil</option>
                <option value="english">English</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Land Details & Verification</h3>
            <div className="grid md:grid-cols-2 gap-6 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Land Area (e.g. Survey No / Plot)</label>
                <input required name="landArea" type="text" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" placeholder="Survey No. 123" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Acreage</label>
                <input required name="acreage" type="number" step="0.1" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" placeholder="Total acreage" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ownership Status</label>
                <select required name="ownershipStatus" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-white">
                  <option value="">Select ownership...</option>
                  <option value="Owned">Owned</option>
                  <option value="Leased">Leased</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                <select required name="documentType" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-white">
                  <option value="">Select document...</option>
                  <option value="Patta">Patta</option>
                  <option value="Chitta">Chitta</option>
                  <option value="Adangal">Adangal</option>
                  <option value="Other">Other Land Document</option>
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Land Document</label>
              <input required name="landDocument" type="file" accept="image/*,.pdf" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-white text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
              <p className="text-xs text-gray-500 mt-1">Please upload a clear picture or PDF of your selected document.</p>
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">What do you usually grow? (Select multiple)</label>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Vegetables', 'Fruits', 'Grains', 'Millets', 'Spices', 'Other'].map((cat) => (
                    <label key={cat} className="flex items-center space-x-2 bg-gray-50 p-2 rounded border border-gray-200 cursor-pointer hover:bg-gray-100">
                        <input type="checkbox" className="rounded text-primary focus:ring-primary" />
                        <span className="text-sm">{cat}</span>
                    </label>
                ))}
             </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <Link to="/farmer-select" className="text-gray-500 hover:text-gray-800 font-medium">Cancel</Link>
            <button type="submit" disabled={isLoading} className="bg-primary hover:bg-secondary text-white font-bold py-3 px-8 rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? "Registering..." : "Register Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
