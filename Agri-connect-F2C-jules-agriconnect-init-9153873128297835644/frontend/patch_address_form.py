import re

with open("src/components/AddressForm.tsx", "r") as f:
    code = f.read()

# Add latitude and longitude to state
old_state = """  const [title, setTitle] = useState("Home");
  const [addressLine, setAddressLine] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");"""

new_state = """  const [title, setTitle] = useState("Home");
  const [addressLine, setAddressLine] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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
      (err) => {
        setError("Unable to retrieve your location. Please check your browser permissions.");
        setIsLocating(false);
      },
      { timeout: 10000 }
    );
  };"""

# Modify payload to include lat/lon
old_payload = """        body: JSON.stringify({
          consumer_id: consumerId,
          title,
          address_line: addressLine
        })"""

new_payload = """        body: JSON.stringify({
          consumer_id: consumerId,
          title,
          address_line: addressLine,
          latitude,
          longitude
        })"""

# Add button to UI before the address textarea
old_ui = """        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">Full Address</label>
          <textarea"""

new_ui = """        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-gray-700 font-bold">Full Address</label>
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={isLocating}
              className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full flex items-center hover:bg-blue-100 disabled:opacity-50"
            >
              {isLocating ? 'Locating...' : 'Get Current Location'}
            </button>
          </div>
          {latitude && longitude && (
            <p className="text-xs text-green-600 mb-2">Location captured: {latitude.toFixed(4)}, {longitude.toFixed(4)}</p>
          )}
          <textarea"""

code = code.replace(old_state, new_state)
code = code.replace(old_payload, new_payload)
code = code.replace(old_ui, new_ui)

with open("src/components/AddressForm.tsx", "w") as f:
    f.write(code)
