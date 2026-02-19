import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GPSwoxGeofence {
  id: string;
  name: string;
  groupId: number;
  color: string;
  active: boolean;
}

interface GPSwoxGeofencesResponse {
  success: boolean;
  geofences: GPSwoxGeofence[];
  timestamp: string;
  error?: string;
}

async function fetchGPSwoxGeofences(): Promise<GPSwoxGeofence[]> {
  const { data, error } = await supabase.functions.invoke<GPSwoxGeofencesResponse>("gpswox-geofences");

  if (error) {
    console.error("Error fetching GPSwox geofences:", error);
    throw new Error(error.message || "Failed to fetch geofences");
  }

  if (!data?.success) {
    throw new Error(data?.error || "Failed to fetch geofences");
  }

  return data.geofences;
}

export function useGPSwoxGeofences() {
  return useQuery({
    queryKey: ["gpswox-geofences"],
    queryFn: fetchGPSwoxGeofences,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes (geofences change rarely)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
