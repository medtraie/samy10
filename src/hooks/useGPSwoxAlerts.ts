import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GPSwoxAlert {
  id: string;
  type: 'speed' | 'geofence' | 'disconnect' | 'fuel' | 'maintenance';
  severity: 'high' | 'medium' | 'low';
  device_id: number | string;
  device_name: string;
  message: string;
  message_ar?: string;
  timestamp: string;
  lat: number | null;
  lng: number | null;
  speed?: number | null;
  acknowledged: boolean;
  raw?: any;
}

interface GPSwoxAlertsResponse {
  success: boolean;
  alerts: GPSwoxAlert[];
  source: string;
  total: number;
  timestamp: string;
  error?: string;
}

async function fetchGPSwoxAlerts(): Promise<GPSwoxAlertsResponse> {
  const { data, error } = await supabase.functions.invoke<GPSwoxAlertsResponse>("gpswox-alerts");

  if (error) {
    console.error("Error fetching GPSwox alerts:", error);
    throw new Error(error.message || "Failed to fetch alerts");
  }

  if (!data?.success) {
    throw new Error(data?.error || "Failed to fetch alerts");
  }

  return data;
}

export function useGPSwoxAlerts(refetchInterval = 60000) {
  return useQuery({
    queryKey: ["gpswox-alerts"],
    queryFn: fetchGPSwoxAlerts,
    refetchInterval,
    staleTime: 30000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
