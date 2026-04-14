import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface TourismCompanyProfile {
  id: string;
  company_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  tax_info: string | null;
  logo_url: string | null;
}

export const TOURISM_COMPANY_ID = '00000000-0000-0000-0000-000000000001';
export const COMPANY_PROFILE_SETTINGS_KEY = 'societe_profile';

const normalizeProfile = (value: any): TourismCompanyProfile | null => {
  if (!value || typeof value !== 'object') return null;
  return {
    id: TOURISM_COMPANY_ID,
    company_name: typeof value.company_name === 'string' ? value.company_name : null,
    contact_email: typeof value.contact_email === 'string' ? value.contact_email : null,
    contact_phone: typeof value.contact_phone === 'string' ? value.contact_phone : null,
    address: typeof value.address === 'string' ? value.address : null,
    tax_info: typeof value.tax_info === 'string' ? value.tax_info : null,
    logo_url: typeof value.logo_url === 'string' ? value.logo_url : null,
  };
};

export async function fetchCompanyProfile(): Promise<TourismCompanyProfile | null> {
  const { data: settingsData, error: settingsError } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', COMPANY_PROFILE_SETTINGS_KEY)
    .maybeSingle();

  if (!settingsError) {
    const fromSettings = normalizeProfile(settingsData?.value);
    if (fromSettings) return fromSettings;
  }

  const { data: singleton, error } = await supabase
    .from('tourism_company_profile')
    .select('*')
    .eq('id', TOURISM_COMPANY_ID)
    .maybeSingle();

  if (error) {
    const { data: latest, error: latestError } = await supabase
      .from('tourism_company_profile')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) throw latestError;
    return latest as TourismCompanyProfile | null;
  }

  return singleton as TourismCompanyProfile | null;
}

export function useTourismCompanyProfile() {
  return useQuery({
    queryKey: ['tourism-company-profile'],
    queryFn: async () => {
      return await fetchCompanyProfile();
    },
  });
}

export function useUpsertTourismCompanyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<TourismCompanyProfile>) => {
      const profilePayload = {
        company_name: payload.company_name ?? null,
        contact_email: payload.contact_email ?? null,
        contact_phone: payload.contact_phone ?? null,
        address: payload.address ?? null,
        tax_info: payload.tax_info ?? null,
        logo_url: payload.logo_url ?? null,
      };

      const { error: settingsError } = await supabase
        .from('app_settings')
        .upsert(
          {
            key: COMPANY_PROFILE_SETTINGS_KEY,
            value: profilePayload as any,
            updated_at: new Date().toISOString(),
            description: 'Profil société global',
          },
          { onConflict: 'key,user_id' }
        );

      if (settingsError) throw settingsError;

      const dataToUpsert = {
        ...payload,
        id: TOURISM_COMPANY_ID,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('tourism_company_profile')
        .upsert(dataToUpsert, { onConflict: 'id' })
        .select()
        .maybeSingle();

      // Some environments enforce RLS on tourism_company_profile.
      // In this case, app_settings already stores the profile and remains the source of truth.
      if (error) {
        const isRlsError =
          (error as { code?: string }).code === '42501' ||
          /row-level security|permission denied|violates/i.test(error.message || '');
        if (!isRlsError) throw error;
      }

      const fromTable = data as TourismCompanyProfile | null;
      if (fromTable) return fromTable;

      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', COMPANY_PROFILE_SETTINGS_KEY)
        .maybeSingle();
      return normalizeProfile(settingsData?.value);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tourism-company-profile'] });
      toast({ title: 'Succès', description: 'Profil entreprise tourisme mis à jour' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
