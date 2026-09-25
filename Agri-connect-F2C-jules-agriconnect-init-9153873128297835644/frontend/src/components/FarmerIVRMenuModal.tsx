import { useState, useEffect } from "react";
import { X, Phone, Globe, Volume2, Key, Info, ShieldCheck, RefreshCw, ArrowLeft, CheckCircle2, ShoppingBag } from "lucide-react";
import { getApiUrl } from "../config/api";

interface IVRAccessData {
  success: boolean;
  farmer_id: string;
  farmer_name: string;
  registered_mobile: string;
  ivr_identifier: string;
  ivr_phone_number: string;
  language: string;
  status_label: string;
  is_demo: boolean;
  provider_name: string;
  phone_independent_note: string;
}

interface FarmerIVRMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  ivrData?: IVRAccessData | null;
  onSuccess?: () => void;
}

const MAIN_MENU_STEPS = [
  { key: "1", title: "Add Vegetables", ta: "காய்கறிகளை சேர்க்க", icon: "🥦", cat: "VEGETABLES" },
  { key: "2", title: "Add Fruits", ta: "பழங்களை சேர்க்க", icon: "🍎", cat: "FRUITS" },
  { key: "3", title: "Add Grains & Millets", ta: "தானியங்களை சேர்க்க", icon: "🌾", cat: "GRAINS" },
  { key: "4", title: "Check Today's Orders", ta: "இன்றைய ஆர்டர்கள்", icon: "📦", cat: "ORDERS" },
  { key: "5", title: "Help & Support", ta: "உதவி மையம்", icon: "🎧", cat: "HELP" },
];

const CATEGORY_ITEMS: Record<string, Array<{ key: string; name: string; ta: string; price: number; icon: string }>> = {
  VEGETABLES: [
    { key: "1", name: "Tomato", ta: "தக்காளி", price: 30, icon: "🍅" },
    { key: "2", name: "Onion", ta: "வெங்காயம்", price: 35, icon: "🧅" },
    { key: "3", name: "Potato", ta: "உருளைக்கிழங்கு", price: 25, icon: "🥔" },
    { key: "4", name: "Carrot", ta: "கேரட்", price: 40, icon: "🥕" },
  ],
  FRUITS: [
    { key: "1", name: "Banana", ta: "வாழைப்பழம்", price: 40, icon: "🍌" },
    { key: "2", name: "Mango", ta: "மாம்பழம்", price: 60, icon: "🥭" },
    { key: "3", name: "Apple", ta: "ஆப்பிள்", price: 100, icon: "🍎" },
    { key: "4", name: "Coconut", ta: "தேங்காய்", price: 30, icon: "🥥" },
  ],
  GRAINS: [
    { key: "1", name: "Rice", ta: "அரிசி", price: 50, icon: "🌾" },
    { key: "2", name: "Ragi", ta: "கேழ்வரகு", price: 45, icon: "🌾" },
    { key: "3", name: "Thinai", ta: "தினை", price: 55, icon: "🌾" },
    { key: "4", name: "Cholam", ta: "சோளம்", price: 40, icon: "🌽" },
  ]
};

export default function FarmerIVRMenuModal({
  isOpen,
  onClose,
  ivrData,
  onSuccess
}: FarmerIVRMenuModalProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<"Tamil" | "English">("Tamil");
  const [currentStep, setCurrentStep] = useState<string>("MAIN_MENU");
  const [simulatedPrompt, setSimulatedPrompt] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantityKg, setQuantityKg] = useState<number>(5);
  const [customQuantity, setCustomQuantity] = useState<string>("5");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pressedDigits, setPressedDigits] = useState<string>("");
  const [createdProduct, setCreatedProduct] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      resetSimulation();
    }
  }, [isOpen, selectedLanguage]);

  const resetSimulation = () => {
    setCurrentStep("MAIN_MENU");
    setPressedDigits("");
    setSelectedCategory("");
    setSelectedProduct("");
    setQuantityKg(5);
    setCustomQuantity("5");
    setCreatedProduct(null);

    if (selectedLanguage === "Tamil") {
      setSimulatedPrompt("வணக்கம்! அக்ரிகனெக்ட் விவசாய சேவைக்கு வரவேற்கிறோம். காய்கறிகளை சேர்க்க 1 அழுத்தவும். பழங்களை சேர்க்க 2 அழுத்தவும். தானியங்களை சேர்க்க 3 அழுத்தவும். இன்றைய ஆர்டர்களை பார்க்க 4 அழுத்தவும். உதவிக்கு 5 அழுத்தவும்.");
    } else {
      setSimulatedPrompt("Welcome to AgriConnect Farmer Service. Press 1 to add vegetables, 2 for fruits, 3 for grains & millets, 4 to check today's orders, 5 for help.");
    }
  };

  const handleInteractiveInput = async (digits: string, stateOverrider?: string, productOverride?: string, qtyOverride?: number) => {
    setIsLoading(true);
    setPressedDigits((prev) => (prev ? `${prev} → ${digits}` : digits));

    const farmerId = localStorage.getItem("agriconnect_user_id") || ivrData?.farmer_id || "";
    const activeState = stateOverrider || currentStep;

    try {
      const res = await fetch(getApiUrl("/api/ivr/interactive-menu"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmer_id: farmerId,
          digits: digits,
          state: activeState,
          language: selectedLanguage,
          category: selectedCategory,
          product_name: productOverride || selectedProduct,
          quantity_kg: qtyOverride || quantityKg
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.text) setSimulatedPrompt(data.text);
        if (data.state) setCurrentStep(data.state);
        if (data.data?.category) setSelectedCategory(data.data.category);
        if (data.data?.product_name) setSelectedProduct(data.data.product_name);
        if (data.data?.quantity_kg) setQuantityKg(data.data.quantity_kg);
        if (data.data?.created_product) {
          setCreatedProduct(data.data.created_product);
          if (onSuccess) onSuccess();
        }
      } else {
        simulateLocalFallback(digits, activeState, productOverride, qtyOverride);
      }
    } catch (err) {
      simulateLocalFallback(digits, activeState, productOverride, qtyOverride);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateLocalFallback = (digits: string, state: string, productOverride?: string, qtyOverride?: number) => {
    if (state === "MAIN_MENU") {
      if (digits === "1") {
        setCurrentStep("PRODUCT_SELECT");
        setSelectedCategory("VEGETABLES");
        setSimulatedPrompt(selectedLanguage === "Tamil"
          ? "தக்காளிக்கு 1, வெங்காயத்திற்கு 2, உருளைக்கிழங்கிற்கு 3, கேரட்டிற்கு 4 அழுத்தவும்."
          : "Press 1 for Tomato, 2 for Onion, 3 for Potato, 4 for Carrot.");
      } else if (digits === "2") {
        setCurrentStep("PRODUCT_SELECT");
        setSelectedCategory("FRUITS");
        setSimulatedPrompt(selectedLanguage === "Tamil"
          ? "வாழைப்பழத்திற்கு 1, மாம்பழத்திற்கு 2, ஆப்பிளுக்கு 3, தேங்காய்க்கு 4 அழுத்தவும்."
          : "Press 1 for Banana, 2 for Mango, 3 for Apple, 4 for Coconut.");
      } else if (digits === "3") {
        setCurrentStep("PRODUCT_SELECT");
        setSelectedCategory("GRAINS");
        setSimulatedPrompt(selectedLanguage === "Tamil"
          ? "அரிசிக்கு 1, கேழ்வரகிற்கு 2, தினைகளுக்கு 3, சோளத்திற்கு 4 அழுத்தவும்."
          : "Press 1 for Rice, 2 for Ragi, 3 for Thinai, 4 for Cholam.");
      } else if (digits === "4") {
        setCurrentStep("COMPLETED");
        setSimulatedPrompt(selectedLanguage === "Tamil"
          ? "உங்களுக்கு இன்று 2 புதிய ஆர்டர்கள் உள்ளன. தக்காளி: 20 கிலோ கிராம்."
          : "You have 2 new orders today. Tomato: 20 kilograms.");
      } else if (digits === "5") {
        setCurrentStep("COMPLETED");
        setSimulatedPrompt(selectedLanguage === "Tamil"
          ? "எங்கள் வாடிக்கையாளர் சேவை மையம் 1800-AGRI-CONNECT. எங்கள் பிரதிநிதி விரைவில் தொடர்பு கொள்வார்."
          : "Our helpline is 1800-AGRI-CONNECT. An agent will contact you shortly.");
      }
    } else if (state === "PRODUCT_SELECT") {
      const items = CATEGORY_ITEMS[selectedCategory || "VEGETABLES"] || CATEGORY_ITEMS.VEGETABLES;
      const selected = items.find(i => i.key === digits) || items[0];
      const prodName = productOverride || selected.name;
      setSelectedProduct(prodName);
      setCurrentStep("ENTER_QUANTITY");
      setSimulatedPrompt(selectedLanguage === "Tamil"
        ? `${selected.ta} தேர்ந்தெடுக்கப்பட்டது. தயவுசெய்து அளவை கிலோகிராமில் உள்ளிடவும் (எடுத்துக்காட்டாக 5, 10, அல்லது 25).`
        : `Selected ${prodName}. Please enter the quantity in kilograms.`);
    } else if (state === "ENTER_QUANTITY") {
      const qty = qtyOverride || parseFloat(digits) || 5;
      setQuantityKg(qty);
      setCurrentStep("CONFIRM_PRODUCT");
      setSimulatedPrompt(selectedLanguage === "Tamil"
        ? `${selectedProduct || "பொருள்"}, ${qty} கிலோ கிராம். உறுதிப்படுத்த 1 அழுத்தவும். ரத்து செய்ய 2 அழுத்தவும்.`
        : `${selectedProduct || "Produce"}, ${qty} kilograms. Press 1 to confirm. Press 2 to cancel.`);
    } else if (state === "CONFIRM_PRODUCT") {
      if (digits === "1") {
        setCurrentStep("COMPLETED");
        setSimulatedPrompt(selectedLanguage === "Tamil"
          ? "உங்கள் பொருள் சந்தையில் வெற்றிகரமாக சேர்க்கப்பட்டது."
          : "Your product has been added successfully to the marketplace.");
        if (onSuccess) onSuccess();
      } else {
        resetSimulation();
      }
    }
  };

  const submitQuantityForm = (qty: number) => {
    setQuantityKg(qty);
    handleInteractiveInput(String(qty), "ENTER_QUANTITY", selectedProduct, qty);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-green-700 to-teal-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl">
              <Phone className="w-6 h-6 text-green-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">AgriConnect IVR Voice Menu</h2>
              <p className="text-xs text-green-100 font-medium">Phone-Independent Interactive Voice & Keypad Interface</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">

          {/* Farmer IVR Identity Card */}
          {ivrData && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50/50 p-4 rounded-xl border border-green-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-green-800 uppercase tracking-wider">Assigned Farmer IVR Identity</span>
                <div className="text-lg font-extrabold text-gray-900 flex items-center mt-0.5">
                  <ShieldCheck className="w-5 h-5 text-green-700 mr-1.5" />
                  {ivrData.ivr_identifier}
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  Linked Mobile: <strong>{ivrData.registered_mobile}</strong>
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  <Info className="w-3.5 h-3.5 mr-1 text-emerald-700" />
                  {ivrData.status_label || "IVR Active & Ready"}
                </span>
                <p className="text-[11px] text-gray-500 mt-1 font-medium">
                  Compatible with Button Phones & Smartphones
                </p>
              </div>
            </div>
          )}

          {/* Language Selector */}
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center">
              <Globe className="w-4 h-4 text-green-700 mr-1.5" /> Select Preferred Audio Language
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedLanguage("Tamil")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedLanguage === "Tamil"
                    ? "bg-green-700 text-white shadow"
                    : "bg-white text-gray-700 border hover:bg-gray-100"
                }`}
              >
                1 → தமிழ் (Tamil)
              </button>
              <button
                onClick={() => setSelectedLanguage("English")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedLanguage === "English"
                    ? "bg-green-700 text-white shadow"
                    : "bg-white text-gray-700 border hover:bg-gray-100"
                }`}
              >
                2 → English
              </button>
            </div>
          </div>

          {/* Voice Prompt Simulator Box */}
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 shadow-inner border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-green-400 animate-pulse" />
                <span className="text-xs font-bold text-green-400 uppercase tracking-wider">
                  Automated Voice Response
                </span>
              </div>
              <button
                onClick={resetSimulation}
                className="text-slate-400 hover:text-white text-xs flex items-center bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 hover:border-slate-600 transition"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Reset / Start Over
              </button>
            </div>

            <div className="min-h-[60px] flex items-center">
              {isLoading ? (
                <div className="flex items-center space-x-2 text-slate-400 text-sm">
                  <RefreshCw className="w-4 h-4 animate-spin text-green-400" />
                  <span>Processing IVR response...</span>
                </div>
              ) : (
                <p className="text-base font-medium text-slate-50 leading-relaxed">
                  "{simulatedPrompt}"
                </p>
              )}
            </div>

            {pressedDigits && (
              <div className="text-xs text-slate-400 border-t border-slate-800 pt-2 flex items-center justify-between">
                <span>Keypad Entry Sequence: <strong className="text-green-400">{pressedDigits}</strong></span>
                <span>Active State: <code className="text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded">{currentStep}</code></span>
              </div>
            )}
          </div>

          {/* DYNAMIC STATE MACHINE RENDERING */}

          {/* STATE 1: MAIN MENU */}
          {currentStep === "MAIN_MENU" && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center">
                <Key className="w-4 h-4 text-green-700 mr-1.5" /> Select Option (Press Keypad Number 1 to 5)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {MAIN_MENU_STEPS.map((step) => (
                  <button
                    key={step.key}
                    onClick={() => handleInteractiveInput(step.key)}
                    className="p-3.5 bg-white hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-xl flex items-center justify-between text-left transition-all group shadow-sm min-h-[52px]"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-9 h-9 rounded-xl bg-green-100 text-green-800 font-black text-base flex items-center justify-center group-hover:bg-green-700 group-hover:text-white transition-colors flex-shrink-0">
                        {step.key}
                      </span>
                      <div>
                        <span className="text-sm font-bold text-gray-900 block">{step.title}</span>
                        <span className="text-xs text-gray-500 font-medium">{step.ta}</span>
                      </div>
                    </div>
                    <span className="text-2xl ml-2">{step.icon}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STATE 2: PRODUCT_SELECT (Vegetables, Fruits, Grains) */}
          {currentStep === "PRODUCT_SELECT" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-900 flex items-center">
                  <ShoppingBag className="w-4 h-4 text-green-700 mr-1.5" />
                  Select {selectedCategory === "VEGETABLES" ? "Vegetable" : selectedCategory === "FRUITS" ? "Fruit" : "Grain"} Item
                </h4>
                <button
                  onClick={resetSimulation}
                  className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center bg-gray-100 px-3 py-1.5 rounded-lg"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Main Menu
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(CATEGORY_ITEMS[selectedCategory] || CATEGORY_ITEMS.VEGETABLES).map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      setSelectedProduct(item.name);
                      handleInteractiveInput(item.key, "PRODUCT_SELECT", item.name);
                    }}
                    className="p-4 bg-white hover:bg-green-50 border-2 border-gray-200 hover:border-green-500 rounded-xl flex items-center justify-between text-left transition-all shadow-sm group min-h-[60px]"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-9 h-9 rounded-xl bg-green-700 text-white font-black text-base flex items-center justify-center flex-shrink-0">
                        {item.key}
                      </span>
                      <div>
                        <span className="text-base font-bold text-gray-900 block">{item.name}</span>
                        <span className="text-xs text-gray-600 font-medium">{item.ta} • ₹{item.price}/kg</span>
                      </div>
                    </div>
                    <span className="text-3xl">{item.icon}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STATE 3: ENTER_QUANTITY */}
          {currentStep === "ENTER_QUANTITY" && (
            <div className="space-y-4 bg-gray-50 p-5 rounded-2xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">Step 3 of 4: Enter Quantity</span>
                  <h4 className="text-lg font-extrabold text-gray-900 flex items-center mt-0.5">
                    Selected Produce: <span className="text-green-700 ml-1.5">{selectedProduct}</span>
                  </h4>
                </div>
                <button
                  onClick={() => setCurrentStep("PRODUCT_SELECT")}
                  className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center bg-white px-3 py-1.5 rounded-lg border border-gray-300"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
                </button>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700">Available Quantity in Kilograms (kg):</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    value={customQuantity}
                    onChange={(e) => setCustomQuantity(e.target.value)}
                    className="w-32 p-3 text-xl font-bold border-2 border-green-600 rounded-xl focus:ring-2 focus:ring-green-500 text-center outline-none bg-white"
                  />
                  <span className="text-base font-bold text-gray-700">kg</span>
                  <button
                    onClick={() => {
                      const qty = parseFloat(customQuantity) || 5;
                      submitQuantityForm(qty);
                    }}
                    className="flex-1 bg-green-700 hover:bg-green-800 text-white font-bold py-3.5 px-6 rounded-xl shadow transition text-base flex items-center justify-center min-h-[48px]"
                  >
                    Next: Confirm Details →
                  </button>
                </div>

                <div className="pt-2">
                  <span className="text-xs font-bold text-gray-500 block mb-2">Quick Quantity Presets (Press or Tap):</span>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 20, 50].map((qty) => (
                      <button
                        key={qty}
                        onClick={() => {
                          setCustomQuantity(String(qty));
                          submitQuantityForm(qty);
                        }}
                        className="p-2.5 bg-white border border-gray-300 hover:border-green-600 hover:bg-green-50 rounded-xl text-sm font-bold text-gray-800 text-center transition min-h-[44px]"
                      >
                        {qty} kg
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STATE 4: CONFIRM_PRODUCT */}
          {currentStep === "CONFIRM_PRODUCT" && (
            <div className="space-y-4 bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-emerald-950 flex items-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 mr-2" /> Confirm & Add Product Listing
                </h4>
                <button
                  onClick={() => setCurrentStep("ENTER_QUANTITY")}
                  className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center bg-white px-3 py-1.5 rounded-lg border border-gray-300"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Edit Quantity
                </button>
              </div>

              <div className="bg-white p-4 rounded-xl border border-emerald-200 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-gray-500 block font-semibold">Produce Name</span>
                  <span className="font-extrabold text-base text-gray-900">{selectedProduct}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block font-semibold">Quantity</span>
                  <span className="font-extrabold text-base text-emerald-700">{quantityKg} kg</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block font-semibold">Category</span>
                  <span className="font-bold text-gray-800">{selectedCategory || "VEGETABLES"}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block font-semibold">Listing Channel</span>
                  <span className="font-bold text-green-800">IVR Voice Entry</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => handleInteractiveInput("1", "CONFIRM_PRODUCT")}
                  className="flex-1 bg-green-700 hover:bg-green-800 text-white font-extrabold py-3.5 px-6 rounded-xl shadow transition text-base flex items-center justify-center min-h-[48px]"
                >
                  1 → Confirm & Publish Listing
                </button>
                <button
                  onClick={() => handleInteractiveInput("2", "CONFIRM_PRODUCT")}
                  className="px-6 py-3.5 bg-white border border-red-300 text-red-700 hover:bg-red-50 font-bold rounded-xl transition min-h-[48px]"
                >
                  2 → Cancel
                </button>
              </div>
            </div>
          )}

          {/* STATE 5: COMPLETED / SUCCESS CARD */}
          {(currentStep === "COMPLETED" || createdProduct) && (
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-2xl border-2 border-emerald-300 space-y-4 text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-700">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-emerald-950">
                  Produce Added Successfully!
                </h3>
                <p className="text-sm text-emerald-800 mt-1 font-semibold">
                  {selectedProduct ? `${selectedProduct} (${quantityKg} kg)` : "Your listing has been published."}
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-emerald-200 text-left text-xs space-y-1.5 max-w-md mx-auto">
                <div className="flex justify-between">
                  <span className="text-gray-500">Channel:</span>
                  <span className="font-bold text-gray-900">AgriConnect IVR Voice Service</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Marketplace Status:</span>
                  <span className="font-bold text-emerald-700">Available to Nearby Consumers</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={resetSimulation}
                  className="flex-1 bg-white border border-green-700 text-green-800 hover:bg-green-50 font-bold py-3 px-4 rounded-xl transition min-h-[44px]"
                >
                  + Add Another Produce
                </button>
                <button
                  onClick={() => {
                    if (onSuccess) onSuccess();
                    onClose();
                  }}
                  className="flex-1 bg-green-700 hover:bg-green-800 text-white font-bold py-3 px-4 rounded-xl shadow transition min-h-[44px]"
                >
                  View Products & Close
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-gray-100 p-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-xs text-gray-600 font-semibold">
            AgriConnect F2C Phone-Independent IVR Architecture
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white font-bold text-sm rounded-xl transition-colors min-h-[40px]"
          >
            Close Menu
          </button>
        </div>

      </div>
    </div>
  );
}
