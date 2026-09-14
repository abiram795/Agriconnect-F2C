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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
