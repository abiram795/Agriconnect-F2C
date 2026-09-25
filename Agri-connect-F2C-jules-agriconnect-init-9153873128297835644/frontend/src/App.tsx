import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import FarmerDashboard from "./pages/FarmerDashboard";
import ConsumerHome from "./pages/ConsumerHome";
import FarmerSelection from "./pages/FarmerSelection";
import FarmerRegister from "./pages/FarmerRegister";
import FarmerAddProduct from "./pages/FarmerAddProduct";
import AdminDashboard from "./pages/AdminDashboard";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import DeliveryRegister from "./pages/DeliveryRegister";
import ConsumerRegister from "./pages/ConsumerRegister";
import HubDashboard from "./pages/HubDashboard";

// New Pages for SIH26132
import UnifiedLogin from "./pages/UnifiedLogin";
import FarmerPriceDiscovery from "./pages/FarmerPriceDiscovery";
import FarmerBuyers from "./pages/FarmerBuyers";
import Marketplace from "./pages/Marketplace";
import LogisticsManagement from "./pages/LogisticsManagement";
import NetProfitCalculator from "./pages/NetProfitCalculator";
import AIAssistant from "./pages/AIAssistant";
import Transactions from "./pages/Transactions";
import FarmerListings from "./pages/FarmerListings";
import OrdersList from "./pages/OrdersList";
import FarmerDecisionCenter from "./pages/FarmerDecisionCenter";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/farmer-login" element={<Login role="farmer" />} />
        <Route path="/consumer-login" element={<Login role="consumer" />} />
        <Route path="/delivery-login" element={<Login role="delivery" />} />
        <Route path="/hub-login" element={<Login role="hub" />} />
        <Route path="/farmer-select" element={<FarmerSelection />} />
        <Route path="/farmer-register" element={<FarmerRegister />} />
        <Route path="/delivery-register" element={<DeliveryRegister />} />
        <Route path="/consumer-register" element={<ConsumerRegister />} />
        <Route path="/farmer" element={<FarmerDashboard />} />
        <Route path="/farmer/add-product" element={<FarmerAddProduct />} />
        <Route path="/consumer" element={<ConsumerHome />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/delivery" element={<DeliveryDashboard />} />
        <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
        <Route path="/hub/dashboard" element={<HubDashboard />} />

        {/* New Routes for SIH26132 */}
        <Route path="/login" element={<UnifiedLogin />} />
        <Route path="/register" element={<UnifiedLogin isRegister={true} />} />
        <Route path="/farmer/dashboard" element={<FarmerDashboard />} />
        <Route path="/farmer/decision-center" element={<FarmerDecisionCenter />} />
        <Route path="/farmer/listings" element={<FarmerListings />} />
        <Route path="/farmer/price-discovery" element={<FarmerPriceDiscovery />} />
        <Route path="/farmer/buyers" element={<FarmerBuyers />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/buyer/dashboard" element={<ConsumerHome />} />
        <Route path="/orders" element={<OrdersList />} />
        <Route path="/logistics" element={<LogisticsManagement />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/calculator" element={<NetProfitCalculator />} />
        <Route path="/assistant" element={<AIAssistant />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
