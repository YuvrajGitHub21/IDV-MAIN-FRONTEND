import { useState } from "react";

export default function Debug() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testConnection = async (useProxy: boolean) => {
    setLoading(true);
    const baseUrl = useProxy ? "" : "http://10.10.2.133:8080";
    const url = `${baseUrl}/api/auth/login`;
    
    try {
      console.log(`Testing ${useProxy ? 'PROXY' : 'DIRECT'} connection to:`, url);
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "test@example.com",
          password: "123456"
        }),
      });

      const text = await response.text();
      setResult(`${useProxy ? 'PROXY' : 'DIRECT'} - Status: ${response.status}, Response: ${text}`);
    } catch (error) {
      setResult(`${useProxy ? 'PROXY' : 'DIRECT'} - Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Backend Connection Debug</h1>
      
      <div className="space-y-4">
        <button
          onClick={() => testConnection(true)}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded mr-4"
        >
          Test Proxy Connection
        </button>
        
        <button
          onClick={() => testConnection(false)}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Test Direct Connection
        </button>
      </div>

      {loading && <p className="mt-4">Testing...</p>}
      
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <pre>{result}</pre>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Environment Info:</h2>
        <ul className="mt-2">
          <li>DEV Mode: {import.meta.env.DEV ? "Yes" : "No"}</li>
          <li>VITE_API_BASE: {import.meta.env.VITE_API_BASE || "Not set"}</li>
          <li>VITE_API_URL: {import.meta.env.VITE_API_URL || "Not set"}</li>
          <li>Current Origin: {window.location.origin}</li>
        </ul>
      </div>
    </div>
  );
}
