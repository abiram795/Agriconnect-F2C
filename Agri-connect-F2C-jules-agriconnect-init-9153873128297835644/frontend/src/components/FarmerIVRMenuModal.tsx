import { useState, useEffect } from "react";
import { X, Phone, Globe, Volume2, Key, Info, ShieldCheck, RefreshCw } from "lucide-react";
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
}

const MENU_STEPS = [
  { key: "1", title: "Add Vegetables", ta: "காய்கறிகளை சேர்க்க", icon: "🥦" },
  { key: "2", title: "Add Fruits", ta: "பழங்களை சேர்க்க", icon: "🍎" },
  { key: "3", title: "Add Grains & Millets", ta: "தானியங்களை சேர்க்க", icon: "🌾" },
  { key: "4", title: "Check Today's Orders", ta: "இன்றைய ஆர்டர்கள்", icon: "📦" },
  { key: "5", title: "Help & Helpline", ta: "உதவி மையம்", icon: "🎧" },
];

export default function FarmerIVRMenuModal({
  isOpen,
  onClose,
  ivrData
}: FarmerIVRMenuModalProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<"Tamil" | "English">("Tamil");
  const [currentStep, setCurrentStep] = useState<string>("MAIN_MENU");
  const [simulatedPrompt, setSimulatedPrompt] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pressedDigits, setPressedDigits] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      resetSimulation();
    }
  }, [isOpen, selectedLanguage]);

  const resetSimulation = () => {
    setCurrentStep("MAIN_MENU");
    setPressedDigits("");
    setSelectedCategory("");
    if (selectedLanguage === "Tamil") {
      setSimulatedPrompt("வணக்கம்! அக்ரிகனெக்ட் விவசாய சேவைக்கு வரவேற்கிறோம். காய்கறிகளை சேர்க்க 1 அழுத்தவும். பழங்களை சேர்க்க 2 அழுத்தவும். தானியங்களை சேர்க்க 3 அழுத்தவும். இன்றைய ஆர்டர்களை பார்க்க 4 அழுத்தவும். உதவிக்கு 5 அழுத்தவும்.");
    } else {
      setSimulatedPrompt("Welcome to AgriConnect Farmer Service. Press 1 to add vegetables, 2 for fruits, 3 for grains & millets, 4 to check today's orders, 5 for help.");
    }
  };

  const handleKeyPress = async (digit: string) => {
    setPressedDigits((prev) => prev + digit);
    setIsLoading(true);

    try {
      const farmerId = localStorage.getItem("agriconnect_user_id") || "";
      const res = await fetch(getApiUrl("/api/ivr/interactive-menu"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmer_id: farmerId,
          digits: digit,
          state: currentStep,
          language: selectedLanguage,
          category: selectedCategory
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.text) {
          setSimulatedPrompt(data.text);
        }
        if (data.state) {
          setCurrentStep(data.state);
        }
        if (data.data?.category) {
          setSelectedCategory(data.data.category);
        }
      } else {
        // Local fallback calculation for menu preview
        simulateLocalKey(digit);
      }
    } catch (err) {
      simulateLocalKey(digit);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateLocalKey = (digit: string) => {
    if (digit === "1") {
      setCurrentStep("PRODUCT_SELECT");
      setSelectedCategory("VEGETABLES");
      setSimulatedPrompt(selectedLanguage === "Tamil" 
        ? "தக்காளிக்கு 1, வெங்காயத்திற்கு 2, உருளைக்கிழங்கிற்கு 3, கேரட்டிற்கு 4 அழுத்தவும்." 
        : "Press 1 for Tomato, 2 for Onion, 3 for Potato, 4 for Carrot.");
    } else if (digit === "2") {
      setCurrentStep("PRODUCT_SELECT");
      setSelectedCategory("FRUITS");
      setSimulatedPrompt(selectedLanguage === "Tamil"
        ? "வாழைப்பழத்திற்கு 1, மாம்பழத்திற்கு 2, ஆப்பிளுக்கு 3, தேங்காய்க்கு 4 அழுத்தவும்."
        : "Press 1 for Banana, 2 for Mango, 3 for Apple, 4 for Coconut.");
    } else if (digit === "3") {
      setCurrentStep("PRODUCT_SELECT");
      setSelectedCategory("GRAINS");
      setSimulatedPrompt(selectedLanguage === "Tamil"
        ? "அரிசிக்கு 1, கேழ்வரகிற்கு 2, தினைகளுக்கு 3, சோளத்திற்கு 4 அழுத்தவும்."
        : "Press 1 for Rice, 2 for Ragi, 3 for Thinai, 4 for Cholam.");
    } else if (digit === "4") {
      setCurrentStep("COMPLETED");
      setSimulatedPrompt(selectedLanguage === "Tamil"
        ? "உங்களுக்கு இன்று 2 புதிய ஆர்டர்கள் உள்ளன. தக்காளி: 20 கிலோ கிராம்."
        : "You have 2 new orders today. Tomato: 20 kilograms.");
    } else if (digit === "5") {
      setCurrentStep("COMPLETED");
      setSimulatedPrompt(selectedLanguage === "Tamil"
        ? "எங்கள் வாடிக்கையாளர் சேவை மையம் 1800-AGRI-CONNECT. எங்கள் பிரதிநிதி விரைவில் தொடர்பு கொள்வார்."
        : "Our helpline is 1800-AGRI-CONNECT. An agent will contact you shortly.");
    } else {
      setSimulatedPrompt(selectedLanguage === "Tamil"
        ? "தவறான பதிவு. தயவுசெய்து 1 முதல் 5 வரை அழுத்தவும்."
        : "Invalid key. Please press a key between 1 and 5.");
    }
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
              <p className="text-xs text-green-100 font-medium">Interactive Keypad & Voice Flow Demonstration</p>
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
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* Farmer IVR Identity Card */}
          {ivrData && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50/50 p-4 rounded-xl border border-green-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-green-800 uppercase tracking-wider">Assigned IVR Identity</span>
                <div className="text-lg font-extrabold text-gray-900 flex items-center mt-0.5">
                  <ShieldCheck className="w-5 h-5 text-green-700 mr-1.5" />
                  {ivrData.ivr_identifier}
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  Linked Mobile: <strong>{ivrData.registered_mobile}</strong>
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <Info className="w-3.5 h-3.5 mr-1 text-amber-700" />
                  {ivrData.status_label}
                </span>
                <p className="text-[11px] text-gray-500 mt-1 italic">
                  Phone Type: Basic Button Phone & Smartphone Ready
                </p>
              </div>
            </div>
          )}

          {/* Demonstration Notice Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">IVR Menu Demonstration: </strong>
              This modal demonstrates the exact automated voice responses that farmers will experience when calling the assigned IVR phone number. Farmers on basic button phones dial the number and use keypad numbers; smartphone farmers can preview or test the flow here. No actual phone call is placed.
            </div>
          </div>

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
                  Simulated Audio Prompt Response
                </span>
              </div>
              <button
                onClick={resetSimulation}
                className="text-slate-400 hover:text-white text-xs flex items-center"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Reset Flow
              </button>
            </div>

            <div className="min-h-[70px] flex items-center">
              {isLoading ? (
                <div className="flex items-center space-x-2 text-slate-400 text-sm">
                  <RefreshCw className="w-4 h-4 animate-spin text-green-400" />
                  <span>Processing keypad input...</span>
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
                <span>Current State: <code className="text-slate-300">{currentStep}</code></span>
              </div>
            )}
          </div>

          {/* Expected Main Menu Options List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center">
              <Key className="w-4 h-4 text-green-700 mr-1.5" /> Keypad Navigation Options
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {MENU_STEPS.map((step) => (
                <button
                  key={step.key}
                  onClick={() => handleKeyPress(step.key)}
                  className="p-3 bg-white hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-xl flex items-center justify-between text-left transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-lg bg-green-100 text-green-800 font-extrabold text-sm flex items-center justify-center group-hover:bg-green-700 group-hover:text-white transition-colors">
                      {step.key}
                    </span>
                    <div>
                      <span className="text-sm font-bold text-gray-900 block">{step.title}</span>
                      <span className="text-xs text-gray-500 font-medium">{step.ta}</span>
                    </div>
                  </div>
                  <span className="text-xl">{step.icon}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-gray-100 p-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">
            AgriConnect F2C Phone-Independent IVR Architecture
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white font-medium text-sm rounded-lg transition-colors"
          >
            Close Menu Preview
          </button>
        </div>

      </div>
    </div>
  );
}
