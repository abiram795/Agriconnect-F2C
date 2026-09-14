import { useState, useRef, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Camera, MapPin, Info, RefreshCw, CheckCircle2 } from "lucide-react";
import { getApiUrl } from "../config/api";

export default function FarmerAddProduct() {
  const navigate = useNavigate();
  const [deliveryMethods, setDeliveryMethods] = useState<string[]>(["Self Pickup"]);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const handleDeliveryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setDeliveryMethods(prev => 
          prev.includes(value) ? prev.filter(m => m !== value) : [...prev, value]
      );
  };
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraError, setCameraError] = useState("");
  const [farmerStatus, setFarmerStatus] = useState<string>("Approved");

  useEffect(() => {
    const userId = localStorage.getItem('agriconnect_user_id');
    if (userId) {
      fetch(getApiUrl(`/api/farmers/${userId}`))
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.verification_status) {
            setFarmerStatus(data.verification_status);
            if (data.verification_status !== 'Approved') {
              setErrorMsg(`Your farmer account verification is ${data.verification_status.toLowerCase()}. Product listing is unavailable until approved by an admin.`);
            }
          }
        })
        .catch(err => console.error("Failed to load verification status", err));
    }
  }, []);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const startCamera = async () => {
    setCameraError("");
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      setStream(mediaStream);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraError("Could not access camera. Please allow permissions in your browser.");
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    return () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, [stream]);

  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{
    success: boolean;
    detected_product: string;
    normalized_product: string;
    is_agricultural_product: boolean;
    confidence: number;
    matches_selected_product: boolean;
    message: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPriceWarning, setShowPriceWarning] = useState(false);
  const [productNameInput, setProductNameInput] = useState("");

  const REFERENCE_PRICES: Record<string, number> = {
    "tomato": 40,
    "onion": 30,
    "potato": 25,
    "carrot": 50,
    "cabbage": 20,
    "apple": 100,
    "banana": 40
  };

  const checkPrice = (name: string, price: number) => {
    const key = Object.keys(REFERENCE_PRICES).find(k => name.toLowerCase().includes(k));
    if (key) {
       const refPrice = REFERENCE_PRICES[key];
       if (price > refPrice * 1.3 || price < refPrice * 0.7) {
          return true;
       }
    }
    return false;
  };

  const analyzeImage = async (imgData: string, selectedName: string) => {
    if (!selectedName.trim()) {
      setErrorMsg("Please enter a Product Name first so AI can verify the image matches.");
      return;
    }
    setIsAnalyzingImage(true);
    setErrorMsg("");
    try {
      const res = await fetch(getApiUrl("/api/products/analyze-image"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: imgData,
          selected_product_name: selectedName
        })
      });
      const data = await res.json();
      setAiAnalysisResult(data);

      if (!data.success || !data.matches_selected_product || !data.is_agricultural_product) {
        setErrorMsg(data.message || "Image verification failed.");
        if (!data.is_agricultural_product) {
          // Clear non-agricultural image automatically
          setTimeout(() => {
             setImageSrc(null);
             setAiAnalysisResult(null);
          }, 2500);
        }
      }
    } catch (err: any) {
      console.error("AI image analysis error:", err);
      setErrorMsg("Failed to complete AI image analysis. Please try again.");
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const captureImageWithAnalysis = useCallback(async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      const vw = videoRef.current.videoWidth;
      const vh = videoRef.current.videoHeight;

      if (context && vw > 0 && vh > 0) {
        canvasRef.current.width = vw;
        canvasRef.current.height = vh;
        context.drawImage(videoRef.current, 0, 0, vw, vh);
        
        try {
            const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.7);
            if (dataUrl.length > 50) {
                setImageSrc(dataUrl);
                stopCamera();
                if (productNameInput) {
                  analyzeImage(dataUrl, productNameInput);
                }
            } else {
                alert("Captured image was empty. Retrying...");
            }
        } catch (e) {
            console.error("Error creating data URL", e);
        }
      } else {
        alert("Camera stream not fully ready. Please wait a second and try again.");
      }
    }
  }, [stopCamera, stream, productNameInput]);

  const retakePhoto = () => {
    setImageSrc(null);
    setAiAnalysisResult(null);
    setErrorMsg("");
    startCamera();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (farmerStatus !== 'Approved') {
      setErrorMsg(`Cannot submit listing: Your farmer account verification status is '${farmerStatus}'. Product listing requires admin approval.`);
      return;
    }
    if (!imageSrc) {
        setErrorMsg("Please capture a live photo of your product first.");
        return;
    }

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const name = formData.get("productName") as string;
    const price = parseFloat(formData.get("price") as string);
    
    if (aiAnalysisResult && (!aiAnalysisResult.success || !aiAnalysisResult.matches_selected_product)) {
      setErrorMsg(`Cannot submit listing: ${aiAnalysisResult.message}`);
      return;
    }

    const isOutlier = checkPrice(name, price);
    if (isOutlier && !showPriceWarning) {
        setShowPriceWarning(true);
        return;
    }

    stopCamera();
    setIsLoading(true);

    let finalDescription = "No description";
    if (isOutlier && showPriceWarning) {
        finalDescription += " [Admin Review Required]";
    }

    try {
      const userId = localStorage.getItem('agriconnect_user_id') || "";
      const response = await fetch(getApiUrl('/api/products'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({
          name: name,
          description: finalDescription,
          price: price,
          unit: formData.get("unit"),
          quantity_available: parseFloat(formData.get("quantity") as string),
          farmer_id: userId,
          delivery_preference: deliveryMethods.join(", "),
          image_url: imageSrc
        }),
      });

      if (!response.ok) {
        let errMsg = "Failed to submit product. Please try again.";
        try {
          const errData = await response.json();
          if (typeof errData.detail === 'string') {
            errMsg = errData.detail;
          } else if (Array.isArray(errData.detail)) {
            errMsg = errData.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
          } else if (errData.detail && typeof errData.detail === 'object') {
            errMsg = errData.detail.message || errData.detail.details || JSON.stringify(errData.detail);
          } else if (errData.message) {
            errMsg = errData.message;
          }
        } catch (_) {}
        throw new Error(errMsg);
      }

      navigate("/farmer", { state: { message: "Product listed successfully with AI Verification!" } });
    } catch (error: any) {
      console.error('Error submitting product:', error);
      setErrorMsg(error.message || "Failed to submit product. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto bg-card p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="mb-8 border-b pb-4">
            <h1 className="text-3xl font-bold text-primary">Add New Product</h1>
            <p className="text-gray-600 mt-1">List your produce directly to nearby consumers.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {errorMsg && (
            <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200 font-medium flex items-center justify-between">
               <span>{errorMsg}</span>
            </div>
          )}

          {showPriceWarning && (
            <div className="bg-orange-50 text-orange-800 p-4 rounded-lg border border-orange-200 font-medium">
               This price is outside the current reference range. Please review before publishing.
            </div>
          )}

          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center"><MapPin className="w-5 h-5 mr-2 text-primary"/> 1. Product Details</h2>
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input 
                  required 
                  name="productName" 
                  type="text" 
                  value={productNameInput}
                  onChange={(e) => {
                    setProductNameInput(e.target.value);
                    if (imageSrc && e.target.value.length > 2) {
                      analyzeImage(imageSrc, e.target.value);
                    }
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary/50" 
                  placeholder="e.g., Onion, Tomato, Potato" 
                />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select required name="category" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary/50 bg-white">
                    <option value="">Select category...</option>
                    <option value="vegetables">Vegetables</option>
                    <option value="fruits">Fruits</option>
                    <option value="grains">Grains</option>
                    <option value="millets">Millets / Small Grains</option>
                </select>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Available</label>
                <input required name="quantity" type="number" min="1" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary/50" placeholder="e.g., 50" />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select required name="unit" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary/50 bg-white">
                    <option value="kg">Kilograms (kg)</option>
                    <option value="grams">Grams (g)</option>
                    <option value="pieces">Pieces / Count</option>
                    <option value="bunches">Bunches</option>
                </select>
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹ per unit)</label>
                <input required name="price" type="number" min="1" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary/50" placeholder="e.g., 35" />
                </div>
            </div>
          </div>

          <div className="border-t pt-8 space-y-6">
             <h2 className="text-xl font-semibold text-gray-800 flex items-center"><Camera className="w-5 h-5 mr-2 text-blue-500"/> 2. Live AI Verification</h2>
             <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-800 text-sm">
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>Capture a live photo of your produce. AgriConnect AI will automatically analyze and verify your product to prevent non-agricultural uploads.</p>
             </div>

             {/* Live Camera Implementation */}
             <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-4 flex flex-col items-center justify-center min-h-[300px] overflow-hidden relative">
                  {!stream && !imageSrc && (
                      <div className="flex flex-col items-center justify-center w-full">
                          <button type="button" onClick={startCamera} className="flex flex-col items-center justify-center text-primary hover:text-secondary p-6">
                              <div className="bg-green-100 p-4 rounded-full mb-3"><Camera className="w-8 h-8" /></div>
                              <span className="font-semibold">Open Camera to Verify</span>
                          </button>
                          {cameraError && (
                              <p className="text-red-500 font-semibold mt-2 text-center text-sm px-4 bg-red-50 border border-red-200 py-2 rounded-lg">{cameraError}</p>
                          )}
                      </div>
                  )}

                  {stream && !imageSrc && (
                      <div className="w-full flex flex-col items-center">
                          <video ref={videoRef} autoPlay playsInline muted onLoadedMetadata={() => videoRef.current?.play()} className="max-w-full rounded-lg shadow-sm mb-4" />
                          <button type="button" onClick={captureImageWithAnalysis} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full flex items-center shadow-md">
                              <Camera className="w-5 h-5 mr-2" /> Capture & Analyze Image
                          </button>
                      </div>
                  )}

                {imageSrc && (
                    <div className="w-full flex flex-col items-center">
                        <div className="relative mb-4 inline-block">
                            <img src={imageSrc} alt="Captured product" className="max-w-full max-h-[300px] rounded-lg shadow-sm" />
                            {isAnalyzingImage && (
                              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center text-white font-medium">
                                <RefreshCw className="w-8 h-8 animate-spin mb-2 text-green-400" />
                                <span>Analyzing product image...</span>
                              </div>
                            )}
                        </div>

                        {/* AI Status Badges */}
                        {aiAnalysisResult && (
                          <div className="w-full max-w-md mb-4">
                            {aiAnalysisResult.success && aiAnalysisResult.matches_selected_product ? (
                              <div className="bg-green-100 border border-green-300 text-green-900 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm">
                                <div className="flex items-center">
                                  <CheckCircle2 className="w-6 h-6 mr-2 text-green-600 flex-shrink-0" />
                                  <div>
                                    <span className="font-bold">✓ Product Identified:</span> {aiAnalysisResult.normalized_product}
                                    <p className="text-xs text-green-700 font-medium">Confidence: {(aiAnalysisResult.confidence * 100).toFixed(0)}%</p>
                                  </div>
                                </div>
                                <span className="bg-green-600 text-white text-xs px-2.5 py-1 rounded-full font-bold uppercase">Verified</span>
                              </div>
                            ) : (
                              <div className="bg-red-100 border border-red-300 text-red-900 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm">
                                <div className="flex items-center">
                                  <span className="text-red-600 font-bold text-xl mr-2">✕</span>
                                  <div>
                                    <span className="font-bold">Image Verification Failed</span>
                                    <p className="text-xs text-red-800">{aiAnalysisResult.message}</p>
                                  </div>
                                </div>
                                <span className="bg-red-600 text-white text-xs px-2.5 py-1 rounded-full font-bold uppercase">Rejected</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex gap-4">
                            <button type="button" onClick={retakePhoto} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-full flex items-center">
                                <RefreshCw className="w-5 h-5 mr-2" /> Retake Photo
                            </button>
                            {productNameInput && !isAnalyzingImage && (!aiAnalysisResult || !aiAnalysisResult.success) && (
                              <button type="button" onClick={() => analyzeImage(imageSrc, productNameInput)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full flex items-center">
                                Re-verify Image
                              </button>
                            )}
                        </div>
                    </div>
                )}

                <canvas ref={canvasRef} className="hidden" />
             </div>
          </div>

          <div className="border-t pt-8 space-y-6">
             <h2 className="text-xl font-semibold text-gray-800">3. Delivery Preferences</h2>
             <div className="grid md:grid-cols-3 gap-4">
                <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${deliveryMethods.includes('Self Pickup') ? 'border-primary bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <input type="checkbox" name="delivery" value="Self Pickup" checked={deliveryMethods.includes('Self Pickup')} onChange={handleDeliveryChange} className="hidden" />
                    <span className="block font-bold text-gray-800 mb-1">Self Pickup</span>
                    <span className="text-sm text-gray-600">Customer comes to your farm.</span>
                </label>
                <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${deliveryMethods.includes('Farmer Delivery') ? 'border-primary bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <input type="checkbox" name="delivery" value="Farmer Delivery" checked={deliveryMethods.includes('Farmer Delivery')} onChange={handleDeliveryChange} className="hidden" />
                    <span className="block font-bold text-gray-800 mb-1">I will Deliver</span>
                    <span className="text-sm text-gray-600">You deliver to nearby customers.</span>
                </label>
                <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${deliveryMethods.includes('Delivery Partner') ? 'border-primary bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <input type="checkbox" name="delivery" value="Delivery Partner" checked={deliveryMethods.includes('Delivery Partner')} onChange={handleDeliveryChange} className="hidden" />
                    <span className="block font-bold text-gray-800 mb-1">Delivery Partner</span>
                    <span className="text-sm text-gray-600">Use AgriConnect delivery network.</span>
                </label>
             </div>

             {deliveryMethods.includes('Farmer Delivery') && (
                 <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex items-center justify-between">
                     <span className="font-medium text-green-900">Maximum delivery radius (km):</span>
                     <input type="number" defaultValue="5" min="1" className="w-24 p-2 border border-green-300 rounded focus:ring-primary outline-none" />
                 </div>
             )}
          </div>

          <div className="border-t pt-6 flex items-center justify-between">
            <Link to="/farmer" className="text-gray-500 hover:text-gray-800 font-medium px-4 py-2">Cancel</Link>
            <button type="submit" disabled={isLoading || farmerStatus !== 'Approved'} className="bg-primary hover:bg-secondary text-white font-bold py-3 px-8 rounded-lg shadow-md transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? "Publishing..." : (farmerStatus !== 'Approved' ? "Verification Pending" : "Publish Listing")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
