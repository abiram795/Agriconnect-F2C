import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Leaf, Eye, EyeOff, User, Lock, Phone } from "lucide-react";
import { getApiUrl } from "../config/api";

interface LoginProps {
  role: "farmer" | "consumer" | "delivery" | "hub";
  onLogin?: () => void;
}

export default function Login({ role, onLogin }: LoginProps) {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!mobile) {
      setErrorMsg("Please enter your mobile number.");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter a password.");
      return;
    }

    try {
      const res = await fetch(getApiUrl("/api/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: mobile, password, role: role === "hub" ? "hub_worker" : role })
      });
      if (res.ok) {
        const user = await res.json();
        localStorage.setItem("agriconnect_user_id", user.id);
        localStorage.setItem("agriconnect_user_role", user.role);
        if (user.name) localStorage.setItem("agriconnect_user_name", user.name);
        if (onLogin) onLogin();
        if (role === "farmer") navigate("/farmer");
        else if (role === "consumer") navigate("/consumer");
        else if (role === "delivery") navigate("/delivery/dashboard");
        else if (role === "hub") navigate("/hub/dashboard");
      } else {
        let errStr = "Invalid phone number or password.";
        try {
          const errData = await res.json();
          if (typeof errData.detail === "string") errStr = errData.detail;
          else if (errData.message) errStr = errData.message;
        } catch (_) {}
        setErrorMsg(errStr);
      }
    } catch (err) {
      setErrorMsg("Error logging in. Please check your network connection.");
    }
  };

  const getRoleConfig = () => {
    switch (role) {
      case "farmer":
        return {
          title: "Empowering Farmers",
          subtitle: "Building a Stronger Food Future",
          description: "Directly connect with customers, get fair prices, and grow your business with AgriConnect F2C.",
          formTitle: "Farmer Login",
          formDesc: "Access your farm, manage your produce, and connect with customers.",
          registerText: "Register as a farmer and start selling your produce directly to customers.",
          registerLink: "/farmer-register",
          imageClass: "bg-green-800", // placeholder for farmer image
        };
      case "consumer":
        return {
          title: "Fresh Produce",
          subtitle: "Direct from Farmers To Your Home",
          description: "Get fresh, healthy and affordable farm produce, directly from local farmers. Support farmers. Eat better. Live healthier.",
          formTitle: "Consumer Login",
          formDesc: "Shop fresh, support farmers, and enjoy healthy food.",
          registerText: "Join now and get fresh produce at the best prices directly from farmers.",
          registerLink: "/consumer-register",
          imageClass: "bg-green-700", // placeholder for consumer image
        };
      case "delivery":
        return {
          title: "Deliver Fresh",
          subtitle: "Earn on Every Delivery",
          description: "Deliver fresh produce locally, help farmers and consumers, and earn money on your own schedule.",
          formTitle: "Delivery Partner Login",
          formDesc: "Access your deliveries, manage your routes, and track your earnings.",
          registerText: "Join our delivery network and start earning today.",
          registerLink: "/delivery-register",
          imageClass: "bg-blue-700", // placeholder for delivery image
        };
      case "hub":
        return {
          title: "AgriConnect City Hub",
          subtitle: "Centralized Quality & Distribution",
          description: "Inspect incoming farmer stock, manage city hub inventory, and ensure transparent distribution.",
          formTitle: "Hub Worker Login",
          formDesc: "Access hub operations, verify stock receipts, and monitor inventory.",
          registerText: "Contact AgriConnect Admin for Hub Worker access credentials.",
          registerLink: "#",
          imageClass: "bg-emerald-900",
        };
      default:
        return {
          title: "AgriConnect F2C",
          subtitle: "Direct Farm to Consumer Platform",
          description: "Connecting local farmers directly with consumers and city hubs.",
          formTitle: "User Login",
          formDesc: "Log in to your AgriConnect account.",
          registerText: "New to AgriConnect? Register today.",
          registerLink: "/consumer-register",
          imageClass: "bg-green-800",
        };
    }
  };

  const config = getRoleConfig();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left side banner */}
      <div className={`hidden md:flex flex-1 ${config.imageClass} text-white p-12 flex-col justify-center relative overflow-hidden`}>
        <div className="absolute top-8 left-8 flex items-center space-x-2">
          <Leaf className="w-8 h-8 text-green-400" />
          <div>
            <h1 className="text-2xl font-bold">AgriConnect F2C</h1>
            <p className="text-xs text-green-200">From Our Farmers • To Your Table</p>
          </div>
        </div>
        
        <div className="z-10 mt-16 max-w-lg">
          <h2 className="text-4xl font-bold mb-2">{config.title}</h2>
          <h3 className="text-3xl font-semibold text-green-200 mb-6">{config.subtitle}</h3>
          <p className="text-lg text-gray-100">{config.description}</p>
        </div>
      </div>

      {/* Right side login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
              <User className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">{config.formTitle}</h2>
            <p className="text-gray-500 mt-2">{config.formDesc}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {errorMsg && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">
                {errorMsg}
              </div>
            )}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder={role === "hub" ? "Email / Username (e.g. hub@agriconnect.demo)" : "Mobile Number (e.g. 9876543210)"}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                />
              </div>
              {role === "hub" && (
                <div className="mt-2 text-xs bg-emerald-50 border border-emerald-200 text-emerald-900 p-2.5 rounded-lg space-y-0.5">
                  <p className="font-bold">SIH Demo Hub Credentials:</p>
                  <p>• Username/Email: <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono font-bold">hub@agriconnect.demo</code></p>
                  <p>• Password: <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono font-bold">AgriHub@2026</code></p>
                  <p>• Hub ID: <span className="font-semibold">COIMBATORE-HUB-001</span></p>
                </div>
              )}
            </div>

            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-gray-600 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary mr-2" />
                Remember me
              </label>
              <a href="#" className="text-primary font-medium hover:underline">Forgot Password?</a>
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-dark transition flex items-center justify-center"
            >
              Login <span className="ml-2">→</span>
            </button>
          </form>

          <div className="mt-8 bg-green-50 p-4 rounded-xl flex items-start space-x-4">
            <div className="bg-green-100 p-2 rounded-full text-primary flex-shrink-0">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 text-sm">
                {role === "hub" ? "AgriConnect Hub Operations" : "New to AgriConnect?"}
              </h4>
              <p className="text-sm text-gray-600 mt-1 mb-3">{config.registerText}</p>
              {role !== "hub" && (
                <Link
                  to={config.registerLink}
                  className="inline-block px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                >
                  Register Now →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
