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

let cachedApiHash: string | null = null;
let cacheExpiry: number = 0;

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
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt - 1), 5000)));
      }
    }
  }
  throw lastError || new Error("All fetch attempts failed");
}

async function getApiHash(apiUrl: string, email: string, password: string): Promise<string> {
  if (cachedApiHash && Date.now() < cacheExpiry) return cachedApiHash;

  const loginUrl = `${apiUrl}/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
  const response = await fetchWithRetry(loginUrl, { method: 'GET', headers: { 'Accept': 'application/json' } });
  const data: LoginResponse = await response.json();

  if (data.status !== 1 || !data.user_api_hash) {
    throw new Error(data.message || "Login failed");
  }

  cachedApiHash = data.user_api_hash;
  cacheExpiry = Date.now() + (60 * 60 * 1000);
  return data.user_api_hash;
}

async function getEvents(apiUrl: string, apiHash: string, page = 1): Promise<any> {
  // Try multiple event endpoints
  const endpoints = [
    `${apiUrl}/get_events?user_api_hash=${apiHash}&page=${page}`,
    `${apiUrl}/events?user_api_hash=${apiHash}&page=${page}`,
    `${apiUrl}/get_history_events?user_api_hash=${apiHash}&page=${page}`,
  ];

  for (const url of endpoints) {
    console.log("Trying events URL:", url);
    try {
      const response = await fetchWithRetry(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      }, 1, 10000);

      const text = await response.text();
      console.log("Events raw response:", text.substring(0, 500));

      if (text.includes('"statusCode":404') || text.includes('not be found')) {
        console.log("Endpoint not found, trying next...");
        continue;
      }

      const data = JSON.parse(text);
      
      // Handle paginated response with items.events
      if (data.items?.events) {
        return data.items.events;
      }
      
      // Handle direct items array
      if (data.items && Array.isArray(data.items)) {
        return data.items;
      }
      
      // Handle direct array response
      if (Array.isArray(data)) {
        return data;
      }
      
      // Handle data with status
      if (data.status === 1 && data.items) {
        return data.items;
      }

      // Handle paginated with data field
      if (data.data && Array.isArray(data.data)) {
        return data.data;
      }

      console.log("Unrecognized format, trying next...");
    } catch (error) {
      console.log("Endpoint failed:", error);
      continue;
    }
  }

  console.log("No events endpoint found, generating alerts from device data");
  return null;
}

async function getDevicesForAlerts(apiUrl: string, apiHash: string): Promise<any[]> {
  const devicesUrl = `${apiUrl}/get_devices?user_api_hash=${apiHash}`;
  const response = await fetchWithRetry(devicesUrl, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return [];
  }

  if (Array.isArray(data)) {
    const allDevices: any[] = [];
    for (const group of data) {
      if (group.items && Array.isArray(group.items)) {
        allDevices.push(...group.items);
      }
    }
    return allDevices;
  }

  return data.items || [];
}

function generateAlertsFromDevices(devices: any[]): any[] {
  const alerts: any[] = [];
  const now = new Date();

  for (const device of devices) {
    // Offline alert
    if (device.online === 'offline') {
      alerts.push({
        id: `offline-${device.id}`,
        type: 'disconnect',
        severity: 'high',
        device_id: device.id,
        device_name: device.name,
        message: `${device.name} est déconnecté`,
        message_ar: `${device.name} غير متصل`,
        timestamp: device.time || now.toISOString(),
        lat: device.lat || null,
        lng: device.lng || null,
        acknowledged: false,
      });
    }

    // Speed alert (> 100 km/h)
    if (device.speed && device.speed > 100) {
      alerts.push({
        id: `speed-${device.id}`,
        type: 'speed',
        severity: 'high',
        device_id: device.id,
        device_name: device.name,
        message: `${device.name} - Excès de vitesse: ${device.speed} km/h`,
        message_ar: `${device.name} - تجاوز السرعة: ${device.speed} كم/س`,
        timestamp: device.time || now.toISOString(),
        lat: device.lat || null,
        lng: device.lng || null,
        speed: device.speed,
        acknowledged: false,
      });
    }

    // Long stop alert (ack status with very old timestamp)
    if (device.online === 'ack' && device.timestamp) {
      const deviceTime = new Date(device.timestamp * 1000);
      const diffMinutes = (now.getTime() - deviceTime.getTime()) / (1000 * 60);
      if (diffMinutes > 120) { // More than 2 hours stopped
        alerts.push({
          id: `stop-${device.id}`,
          type: 'geofence',
          severity: 'medium',
          device_id: device.id,
          device_name: device.name,
          message: `${device.name} - Arrêt prolongé (${Math.round(diffMinutes / 60)}h)`,
          message_ar: `${device.name} - توقف مطول (${Math.round(diffMinutes / 60)} ساعة)`,
          timestamp: device.time || now.toISOString(),
          lat: device.lat || null,
          lng: device.lng || null,
          acknowledged: false,
        });
      }
    }

    // Low battery from sensors
    if (device.sensors && Array.isArray(device.sensors)) {
      for (const sensor of device.sensors) {
        if (sensor.type === 'battery' && sensor.val !== null && sensor.val !== undefined) {
          const val = typeof sensor.val === 'string' ? parseFloat(sensor.val) : sensor.val;
          if (typeof val === 'number' && val < 20) {
            alerts.push({
              id: `battery-${device.id}`,
              type: 'maintenance',
              severity: 'medium',
              device_id: device.id,
              device_name: device.name,
              message: `${device.name} - Batterie faible: ${val}%`,
              message_ar: `${device.name} - بطارية منخفضة: ${val}%`,
              timestamp: device.time || now.toISOString(),
              lat: device.lat || null,
              lng: device.lng || null,
              acknowledged: false,
            });
          }
        }
      }
    }
  }

  // Sort by severity then timestamp
  const severityOrder = { high: 0, medium: 1, low: 2 };
  alerts.sort((a, b) => {
    const sevDiff = (severityOrder[a.severity as keyof typeof severityOrder] || 2) - (severityOrder[b.severity as keyof typeof severityOrder] || 2);
    if (sevDiff !== 0) return sevDiff;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return alerts;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let apiUrl = Deno.env.get('GPSWOX_API_URL');
    const email = Deno.env.get('GPSWOX_EMAIL');
    const password = Deno.env.get('GPSWOX_PASSWORD');

    if (!apiUrl || !email || !password) {
      return new Response(
        JSON.stringify({ error: "GPSwox credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    console.log("Fetching alerts from GPSwox...");
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

    // Try to get events from GPSwox API first
    const events = await getEvents(apiUrl, apiHash);
    
    let alerts: any[] = [];
    let source = 'devices';

    if (events && Array.isArray(events) && events.length > 0) {
      // Transform GPSwox events to our alert format
      source = 'events';
      alerts = events.map((event: any, index: number) => {
        const alertType = event.alert_type || event.type || 'maintenance';
        let severity = 'medium';
        let type = 'maintenance';

        // Map GPSwox alert types
        const typeStr = String(alertType).toLowerCase();
        if (typeStr.includes('speed') || typeStr.includes('overspeed')) {
          type = 'speed'; severity = 'high';
        } else if (typeStr.includes('geofence') || typeStr.includes('zone')) {
          type = 'geofence'; severity = 'medium';
        } else if (typeStr.includes('offline') || typeStr.includes('disconnect')) {
          type = 'disconnect'; severity = 'high';
        } else if (typeStr.includes('fuel')) {
          type = 'fuel'; severity = 'medium';
        } else if (typeStr.includes('sos') || typeStr.includes('alarm')) {
          type = 'speed'; severity = 'high';
        }

        return {
          id: event.id || `event-${index}`,
          type,
          severity,
          device_id: event.device_id || event.object_id,
          device_name: event.device_name || event.name || `Device ${event.device_id}`,
          message: event.message || event.alert_name || event.description || 'Alerte GPSwox',
          timestamp: event.created_at || event.time || event.timestamp || new Date().toISOString(),
          lat: event.lat || event.latitude || null,
          lng: event.lng || event.longitude || null,
          speed: event.speed || null,
          acknowledged: false,
          raw: event,
        };
      });
    } else {
      // Fallback: generate alerts from device status
      const devices = await getDevicesForAlerts(apiUrl, apiHash);
      alerts = generateAlertsFromDevices(devices);
    }

    console.log(`Returning ${alerts.length} alerts (source: ${source})`);

    return new Response(
      JSON.stringify({
        success: true,
        alerts,
        source,
        total: alerts.length,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
