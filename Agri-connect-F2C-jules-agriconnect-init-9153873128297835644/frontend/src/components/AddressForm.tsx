import { useState, useEffect } from "react";
import { X, MapPin } from "lucide-react";
import { getApiUrl } from "../config/api";

interface AddressFormProps {
  onSuccess: (newAddress: any) => void;
  onCancel: () => void;
  consumerId: string;
  existingAddress?: any;
}

export default function AddressForm({ onSuccess, onCancel, consumerId, existingAddress }: AddressFormProps) {
  const [label, setLabel] = useState("Home");
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [locality, setLocality] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (existingAddress) {
      setLabel(existingAddress.label || existingAddress.title || "Home");
      setFullName(existingAddress.full_name || "");
      setMobileNumber(existingAddress.mobile_number || "");
      setAddressLine(existingAddress.address_line || "");
      setLocality(existingAddress.locality || "");
      setCity(existingAddress.city || "");
      setState(existingAddress.state || "");
      setPincode(existingAddress.pincode || "");
      setIsDefault(existingAddress.is_default || false);
      setLatitude(existingAddress.latitude || null);
      setLongitude(existingAddress.longitude || null);
    }
  }, [existingAddress]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setIsLocating(false);
      },
      () => {
        setError("Unable to retrieve your location. Please check your browser permissions.");
        setIsLocating(false);
      },
      { timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!consumerId || consumerId === "00000000-0000-0000-0000-000000000000") {
      setError("Your session has expired. Please login again.");
      return;
    }
    
    if (!fullName.trim() || !mobileNumber.trim() || !addressLine.trim() || !city.trim() || !pincode.trim()) {
      setError("Please fill all required fields.");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      const payload = {
        consumer_id: consumerId,
        label: label,
        full_name: fullName,
        mobile_number: mobileNumber,
        address_line: addressLine,
        locality: locality,
        city: city,
        state: state,
        pincode: pincode,
        latitude: latitude,
        longitude: longitude,
        is_default: isDefault
      };

      const url = existingAddress ? `/api/addresses/${existingAddress.id}` : "/api/addresses";
      const method = existingAddress ? "PUT" : "POST";

      const res = await fetch(getApiUrl(url), {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        let errStr = "Failed to save address";
        try {
          const err = await res.json();
          errStr = err.detail || err.message || errStr;
        } catch (e) {
          errStr = "Server error. Please try again later.";
        }
        throw new Error(errStr);
      }
      
      const data = await res.json();
      onSuccess(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800">{existingAddress ? "Edit Address" : "Add New Address"}</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
      </div>

      {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label>
                <input required type="tel" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"/>
            </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
          <div className="flex gap-4">
            {['Home', 'Work', 'Other'].map(type => (
              <label key={type} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="label"
                  value={type}
                  checked={label === type}
                  onChange={(e) => setLabel(e.target.value)}
                  className="mr-2 text-primary focus:ring-primary"
                />
                {type}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address Line *</label>
          <textarea
            required
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            rows={2}
            placeholder="House/Flat No., Building Name, Street"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Area / Locality</label>
                <input type="text" value={locality} onChange={e => setLocality(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input required type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"/>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input type="text" value={state} onChange={e => setState(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                <input required type="text" value={pincode} onChange={e => setPincode(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"/>
            </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div>
                <p className="text-sm font-medium text-gray-800">Map Location (Optional)</p>
                <p className="text-xs text-gray-500">Helps farmers navigate precisely.</p>
                {latitude && longitude && (
                    <p className="text-xs text-green-600 font-bold mt-1">Location captured: {latitude.toFixed(4)}, {longitude.toFixed(4)}</p>
                )}
            </div>
            <button type="button" onClick={handleGetLocation} disabled={isLocating} className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {isLocating ? "Locating..." : (latitude ? "Update" : "Get Location")}
            </button>
        </div>

        <div className="flex items-center mt-2">
            <input type="checkbox" id="is_default" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} className="mr-2 rounded text-primary focus:ring-primary"/>
            <label htmlFor="is_default" className="text-sm text-gray-700">Set as default address</label>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
          >
            {isLoading ? "Saving..." : "Save Address"}
          </button>
        </div>
      </form>
    </div>
  );
}
