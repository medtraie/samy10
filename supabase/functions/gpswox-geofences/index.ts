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

interface Geofence {
  id: number;
  name: string;
  group_id: number;
  polygon_color: string;
  active: boolean;
  coordinates?: string;
}

interface GeofenceGroup {
  id: number;
  title: string;
  items: Geofence[];
}

type GeofencesResponse = GeofenceGroup[] | {
  status?: number;
  items?: {
    geofences?: Geofence[];
  } | Geofence[];
  message?: string;
};

// Cache for API hash to avoid repeated logins
let cachedApiHash: string | null = null;
let cacheExpiry: number = 0;

// Utility function for fetch with retry and timeout
async function fetchWithRetry(
  url: string, 
  options: RequestInit = {}, 
  maxRetries = 3, 
  timeoutMs = 15000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`Fetch attempt ${attempt}/${maxRetries} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error("All fetch attempts failed");
}

async function getApiHash(apiUrl: string, email: string, password: string): Promise<string> {
  // Check if we have a valid cached hash
  if (cachedApiHash && Date.now() < cacheExpiry) {
    console.log("Using cached API hash for geofences");
    return cachedApiHash;
  }

  console.log("Logging in to GPSwox API for geofences...");
  
  const loginUrl = `${apiUrl}/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
  
  const response = await fetchWithRetry(loginUrl, {
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

async function getGeofences(apiUrl: string, apiHash: string): Promise<Geofence[]> {
  console.log("Fetching geofences from GPSwox API...");
  const geofencesUrl = `${apiUrl}/get_geofences?user_api_hash=${apiHash}`;
  console.log("Geofences URL:", geofencesUrl);

  const response = await fetchWithRetry(geofencesUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  const responseText = await response.text();
  console.log("Geofences raw response:", responseText.substring(0, 500));
  
  let data: GeofencesResponse;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    console.error("Failed to parse geofences response as JSON");
    throw new Error("Invalid response format from geofences API");
  }
  
  // Handle array format (groups with items)
  if (Array.isArray(data)) {
    const allGeofences: Geofence[] = [];
    for (const group of data) {
      if (group.items && Array.isArray(group.items)) {
        allGeofences.push(...group.items);
      }
    }
    console.log("Extracted geofences from groups:", allGeofences.length);
    return allGeofences;
  }
  
  // Handle object format with nested items.geofences
  if (data.items && 'geofences' in data.items && Array.isArray(data.items.geofences)) {
    console.log("Extracted geofences from items.geofences:", data.items.geofences.length);
    return data.items.geofences;
  }
  
  // Handle object format with items as array
  if (data.items && Array.isArray(data.items)) {
    console.log("Geofences from items array:", data.items.length);
    return data.items;
  }
  
  // Handle object format with status
  console.log("Geofences response status:", data.status, "- trying to extract geofences");

  // Return empty array if we got here (unexpected format)
  console.log("Unexpected response format, returning empty array");
  return [];
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

    // Fetch geofences
    const geofences = await getGeofences(apiUrl, apiHash);

    // Transform to simplified format
    const formattedGeofences = geofences.map((geo) => ({
      id: String(geo.id),
      name: geo.name,
      groupId: geo.group_id,
      color: geo.polygon_color,
      active: geo.active,
    }));

    console.log(`Successfully fetched ${formattedGeofences.length} geofences`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        geofences: formattedGeofences,
        timestamp: new Date().toISOString(),
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    console.error("GPSwox Geofences API error:", error);
    
    // Clear cache on error to force re-login
    cachedApiHash = null;
    cacheExpiry = 0;

    const errorMessage = error instanceof Error ? error.message : "Failed to fetch geofences";

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
