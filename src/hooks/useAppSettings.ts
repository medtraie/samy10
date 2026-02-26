import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ModuleSettings {
  dashboard: boolean;
  vehicles: boolean;
  drivers: boolean;
  personnel: boolean;
  live_map: boolean;
  missions: boolean;
  transport_btp: boolean;
  transport_touristique: boolean;
  transport_voyageurs: boolean;
  transport_tms: boolean;
  fuel: boolean;
  citerne: boolean;
   oil: boolean;
  maintenance: boolean;
  stock: boolean;
  achats: boolean;
  comptabilite: boolean;
  finance: boolean;
  reports: boolean;
  alerts: boolean;
}

const DEFAULT_SETTINGS: ModuleSettings = {
  dashboard: true,
  vehicles: true,
  drivers: true,
  personnel: true,
  live_map: true,
  missions: true,
  transport_btp: true,
  transport_touristique: true,
  transport_voyageurs: true,
  transport_tms: true,
  fuel: true,
  citerne: true,
  oil: true,
  maintenance: true,
  stock: true,
  achats: true,
  comptabilite: true,
  finance: true,
  reports: true,
  alerts: true,
};

export function useAppSettings() {
  const queryClient = useQueryClient();

  const { data: moduleSettings, isLoading } = useQuery({
    queryKey: ['app_settings', 'module_activation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'module_activation')
        .maybeSingle();

      if (error) {
        console.error('Error fetching settings:', error);
        return DEFAULT_SETTINGS;
      }
      
      if (!data) return DEFAULT_SETTINGS;
      
      return data.value as unknown as ModuleSettings;
    },
  });

  const updateModuleSettings = useMutation({
    mutationFn: async (newValue: ModuleSettings) => {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ 
          key: 'module_activation', 
          value: newValue as any, 
          updated_at: new Date().toISOString() 
        }, { onConflict: 'key' });

      if (error) throw error;
      return newValue;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app_settings'] });
      toast.success('Paramètres mis à jour avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour: ' + error.message);
    },
  });

  return {
    moduleSettings,
    isLoading,
    updateModuleSettings,
  };
}
