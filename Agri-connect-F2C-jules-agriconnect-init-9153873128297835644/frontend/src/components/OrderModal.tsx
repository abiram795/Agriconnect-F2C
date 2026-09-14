import { useState, useEffect } from "react";
import { X, CheckCircle2, ShoppingBag, AlertCircle, Plus, MapPin, Navigation } from "lucide-react";
import AddressForm from "./AddressForm";
import { getApiUrl } from "../config/api";

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  quantity_available: number;
  farmer_id: string;
  delivery_preference: string;
  farmers: {
    users: {
      name: string;
      phone: string;
    }
  };
}

interface Address {
  id: string;
  consumer_id: string;
  title?: string;
  label?: string;
  full_name?: string;
  mobile_number?: string;
  address_line: string;
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  is_default?: boolean;
}

interface OrderModalProps {
  product: Product;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OrderModal({ product, onClose, onSuccess }: OrderModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null);
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const consumerId = localStorage.getItem("agriconnect_user_id") || "00000000-0000-0000-0000-000000000000";
  const deliveryOptions = product.delivery_preference ? product.delivery_preference.split(',').map(s => s.trim()) : [];

  useEffect(() => {
    const fetchAddresses = async () => {
      setIsLoadingAddresses(true);
      try {
        const res = await fetch(getApiUrl(`/api/addresses/${consumerId}`));
        if (res.ok) {
          const data = await res.json();
          setAddresses(data);
          const defAddr = data.find((a: any) => a.is_default);
          if (defAddr) {
            setSelectedAddress(defAddr);
          } else if (data.length > 0) {
            setSelectedAddress(data[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load addresses", err);
      } finally {
        setIsLoadingAddresses(false);
      }
    };
    fetchAddresses();
  }, [consumerId]);

  const handleAddressSuccess = (newAddress: Address) => {
    setAddresses([...addresses, newAddress]);
    setSelectedAddress(newAddress);
    setShowAddressForm(false);
  };

  const isBulkRequest = quantity > 50;
  const [logisticsPlan, setLogisticsPlan] = useState<any>(null);

  useEffect(() => {
    const fetchGeoLogistics = async () => {
      try {
        const res = await fetch(getApiUrl('/api/logistics/evaluate-route'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            farmer_location: { locality: product.farmers?.users?.name || "Farmer Network" },
            consumer_location: selectedAddress ? {
              latitude: selectedAddress.latitude,
              longitude: selectedAddress.longitude,
              locality: selectedAddress.locality,
              city: selectedAddress.city,
              district: selectedAddress.state
            } : null,
            quantity_kg: quantity,
            number_of_farmers: isBulkRequest ? 3 : 1
          })
        });
        if (res.ok) {
          const plan = await res.json();
          setLogisticsPlan(plan);
        }
      } catch (e) {
        console.error("Failed to evaluate route", e);
      }
    };
    fetchGeoLogistics();
  }, [product, selectedAddress, quantity, isBulkRequest]);

  const handleOrder = async () => {
    if (!selectedDelivery) {
      setError("Please select a delivery method.");
      return;
    }
    if ((selectedDelivery === "Farmer Delivery" || selectedDelivery === "Delivery Partner") && !selectedAddress) {
      setError("Please select a delivery address.");
      return;
    }
    if (quantity > product.quantity_available) {
      setError("Insufficient quantity available.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const endpoint = isBulkRequest ? "/api/orders/bulk" : "/api/orders";
      
      let payload: any;
      if (isBulkRequest) {
        payload = {
          consumer_id: consumerId,
          farmer_id: product.farmer_id,
          product_id: product.id,
          quantity: quantity
        };
      } else {
        payload = {
          consumer_id: consumerId,
          farmer_id: product.farmer_id,
          product_id: product.id,
          quantity: quantity,
          total_amount: quantity * product.price,
          fulfillment_method: selectedDelivery,
          delivery_address: selectedAddress ? { 
            id: selectedAddress.id,
            label: selectedAddress.label,
            full_name: selectedAddress.full_name,
            mobile_number: selectedAddress.mobile_number,
            address_line: selectedAddress.address_line,
            locality: selectedAddress.locality,
            city: selectedAddress.city,
            state: selectedAddress.state,
            pincode: selectedAddress.pincode,
            latitude: selectedAddress.latitude,
            longitude: selectedAddress.longitude
          } : null
        };
      }

      const token = localStorage.getItem("agriconnect_token") || "";

      const res = await fetch(getApiUrl(endpoint), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let errorMsg = "Failed to place order.";
        try {
          const errData = await res.json();
          if (errData.detail) {
            if (typeof errData.detail === 'string') {
              errorMsg = errData.detail;
            } else if (Array.isArray(errData.detail)) {
              errorMsg = errData.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
            } else {
              errorMsg = JSON.stringify(errData.detail);
            }
          }
        } catch(e) {
           errorMsg = `Server error: ${res.status}`;
        }
        throw new Error(errorMsg);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800">
          <X className="w-6 h-6" />
        </button>
        
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="text-green-600" /> Complete Your Order
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h3 className="font-bold text-lg">{product.name}</h3>
            <p className="text-gray-600 text-sm mb-3">from {product.farmers.users.name}</p>
            
            <div className="flex items-center justify-between mt-4">
              <div>
                <label className="text-sm text-gray-500 block mb-1">Quantity ({product.unit})</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    min="1" 
                    max={product.quantity_available} 
                    value={quantity} 
                    onChange={e => setQuantity(Number(e.target.value))}
                    className="w-20 p-2 border border-gray-300 rounded text-center"
                  />
                  <span className="text-sm text-gray-500">/ {product.quantity_available} available</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-500 block">Total Price</span>
                <span className="text-2xl font-bold text-green-700">₹{quantity * product.price}</span>
              </div>
            </div>
          </div>

          {logisticsPlan && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-2 text-xs text-blue-900">
              <div className="flex items-center justify-between font-bold text-sm text-blue-950 border-b border-blue-200/60 pb-2">
                <span className="flex items-center gap-1.5"><Navigation className="w-4 h-4 text-blue-600"/> FULFILLMENT PLAN & SMART GEO-LOGISTICS</span>
                <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider uppercase">{logisticsPlan.fulfillment_type}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-gray-500 block">📍 Source:</span>
                  <span className="font-semibold text-gray-800">{product.farmers?.users?.name || "Farmer Network"}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">📏 Approx. Distance:</span>
                  <span className="font-semibold text-gray-800">{typeof logisticsPlan.distance_km === 'number' ? `${logisticsPlan.distance_km} km` : logisticsPlan.distance_km}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">🚚 Route:</span>
                  <span className="font-semibold text-blue-800">{logisticsPlan.fulfillment_title}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">👨‍🌾 Farmers:</span>
                  <span className="font-semibold text-gray-800">{logisticsPlan.number_of_farmers || 1} verified farmer(s)</span>
                </div>
              </div>
              {logisticsPlan.collection_hub && (
                <div className="bg-white/80 p-2 rounded border border-blue-200 text-xs">
                  <span className="font-bold text-blue-900 block">AgriConnect Collection Hub:</span>
                  <span>{logisticsPlan.collection_hub.name} ({logisticsPlan.collection_hub.locality})</span>
                </div>
              )}
              <p className="text-[11px] text-blue-800 italic pt-1 border-t border-blue-100">{logisticsPlan.reason}</p>
            </div>
          )}

          <div>
            <h3 className="font-bold text-gray-800 mb-3">Select Fulfillment Method</h3>
            <div className="space-y-3">
              {deliveryOptions.map(opt => (
                <label key={opt} className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${selectedDelivery === opt ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input 
                    type="radio" 
                    name="delivery_method" 
                    value={opt} 
                    checked={selectedDelivery === opt} 
                    onChange={() => setSelectedDelivery(opt)}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-bold block text-gray-800">{opt}</span>
                    <span className="text-sm text-gray-500">
                      {opt === "Self Pickup" && "You will collect this directly from the farmer."}
                      {opt === "Farmer Delivery" && "The farmer will deliver this to your address."}
                      {opt === "Delivery Partner" && "A third-party partner will deliver this to you."}
                    </span>
                  </div>
                </label>
              ))}
              {deliveryOptions.length === 0 && (
                <p className="text-sm text-red-500">This farmer has not set up any delivery preferences.</p>
              )}
            </div>
          </div>

          {selectedDelivery && selectedDelivery !== "Self Pickup" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800">Delivery Address</h3>
                {addresses.length < 3 && !showAddressForm && (
                  <button 
                    onClick={() => setShowAddressForm(true)}
                    className="text-sm font-bold text-green-600 flex items-center gap-1 hover:text-green-700"
                  >
                    <Plus className="w-4 h-4" /> Add New
                  </button>
                )}
              </div>
              
              {isLoadingAddresses ? (
                <p className="text-sm text-gray-500">Loading addresses...</p>
              ) : (
                <div className="space-y-3">
                  {addresses.map(addr => (
                    <label key={addr.id} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${selectedAddress?.id === addr.id ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input 
                        type="radio" 
                        name="address" 
                        checked={selectedAddress?.id === addr.id} 
                        onChange={() => setSelectedAddress(addr)}
                        className="mt-1"
                      />
                      <div>
                        <span className="font-bold block text-gray-800 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-600" /> {addr.title}
                        </span>
                        <span className="text-sm text-gray-600 block mt-1 whitespace-pre-wrap">
                          {addr.address_line}
                        </span>
                      </div>
                    </label>
                  ))}
                  
                  {addresses.length === 0 && !showAddressForm && (
                    <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg text-center">
                      No saved addresses found. Please add a new address.
                    </p>
                  )}
                </div>
              )}

              {(showAddressForm || addresses.length === 0) && (
                <AddressForm 
                  consumerId={consumerId} 
                  onSuccess={handleAddressSuccess} 
                  onCancel={() => setShowAddressForm(false)} 
                />
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-4">
          <button onClick={onClose} className="flex-1 py-3 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">
            Cancel
          </button>
          <button 
            onClick={handleOrder} 
            disabled={isLoading || !selectedDelivery || ((selectedDelivery === "Farmer Delivery" || selectedDelivery === "Delivery Partner") && !selectedAddress && !showAddressForm)}
            className="flex-[2] py-3 font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg flex justify-center items-center gap-2"
          >
            {isLoading ? "Processing..." : (
              isBulkRequest ? <>Request Bulk Quote <CheckCircle2 className="w-5 h-5" /></> : <>Place Order <CheckCircle2 className="w-5 h-5" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
