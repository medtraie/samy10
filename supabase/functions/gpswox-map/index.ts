import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LoginResponse {
  status: number;
  user_api_hash?: string;
  message?: string;
}

// Cache for API hash to avoid repeated logins
let cachedApiHash: string | null = null;
let cacheExpiry: number = 0;

async function getApiHash(apiUrl: string, email: string, password: string): Promise<string> {
  // Check if we have a valid cached hash
  if (cachedApiHash && Date.now() < cacheExpiry) {
    console.log("Using cached API hash for map");
    return cachedApiHash;
  }

  console.log("Logging in to GPSwox API for map...");
  
  const loginUrl = `${apiUrl}/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
  
  const response = await fetch(loginUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  const data: LoginResponse = await response.json();
  console.log("Login response status:", data.status);

  if (data.status !== 1 || !data.user_api_hash) {
    throw new Error(data.message || "Login failed");
  }

  // Cache for 1 hour
  cachedApiHash = data.user_api_hash;
  cacheExpiry = Date.now() + (60 * 60 * 1000);

  return data.user_api_hash;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let apiUrl = Deno.env.get('GPSWOX_API_URL');
    const email = Deno.env.get('GPSWOX_EMAIL');
    const password = Deno.env.get('GPSWOX_PASSWORD');

    if (!apiUrl || !email || !password) {
      console.error("Missing GPSwox credentials");
      return new Response(
        JSON.stringify({ error: "GPSwox credentials not configured", success: false }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure URL has protocol - use https if not specified
    // Ensure URL has protocol - use https if not specified
    if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
      apiUrl = 'https://' + apiUrl;
    }
    
    // Remove trailing slash if present
    apiUrl = apiUrl.replace(/\/$/, '');
    
    // Ensure the URL ends with /api if it doesn't already
    if (!apiUrl.endsWith('/api')) {
      apiUrl = apiUrl + '/api';
    }

    console.log("Using API URL:", apiUrl);

    // Get or refresh API hash
    let apiHash: string;
    try {
      apiHash = await getApiHash(apiUrl, email, password);
    } catch (e) {
      if (apiUrl.startsWith('https://')) {
        const httpUrl = apiUrl.replace('https://', 'http://');
        console.log("Retrying login over HTTP");
        apiHash = await getApiHash(httpUrl, email, password);
        apiUrl = httpUrl;
      } else {
        throw e;
      }
    }

    // Construct the embedded map URL
    // GPSwox/TrackPremier provides a map endpoint that can be embedded
    // The base URL should be the main domain (without /api)
    const baseUrl = apiUrl.replace('/api', '');
    
    // Common GPSwox map URLs:
    // 1. Direct map with hash: /map?user_api_hash=XXX
    // 2. Embedded map: /embed/map?user_api_hash=XXX
    // 3. Public share: /share/map?hash=XXX
    
    const mapUrl = `${baseUrl}/map?user_api_hash=${apiHash}`;
    
    console.log("Generated map URL for embedding");

    return new Response(
      JSON.stringify({ 
        success: true, 
        mapUrl,
        timestamp: new Date().toISOString(),
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    console.error("GPSwox Map API error:", error);
    
    // Clear cache on error to force re-login
    cachedApiHash = null;
    cacheExpiry = 0;

    const errorMessage = error instanceof Error ? error.message : "Failed to get map URL";

    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false,
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
