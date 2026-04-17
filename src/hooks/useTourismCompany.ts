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
  signature_url: string | null;
}

export const TOURISM_COMPANY_ID = '00000000-0000-0000-0000-000000000001';
export const COMPANY_PROFILE_SETTINGS_KEY = 'societe_profile';
const PROFILE_FIELDS = [
  'company_name',
  'contact_email',
  'contact_phone',
  'address',
  'tax_info',
  'logo_url',
  'signature_url',
] as const;

type ProfileField = (typeof PROFILE_FIELDS)[number];

const hasOwn = <T extends object>(value: T, key: PropertyKey) =>
  Object.prototype.hasOwnProperty.call(value, key);

const normalizeProfileField = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeProfile = (value: any): TourismCompanyProfile | null => {
  if (!value || typeof value !== 'object') return null;
  return {
    id: TOURISM_COMPANY_ID,
    company_name: normalizeProfileField(value.company_name),
    contact_email: normalizeProfileField(value.contact_email),
    contact_phone: normalizeProfileField(value.contact_phone),
    address: normalizeProfileField(value.address),
    tax_info: normalizeProfileField(value.tax_info),
    logo_url: normalizeProfileField(value.logo_url),
    signature_url: normalizeProfileField(value.signature_url),
  };
};

const mergeProfiles = (
  primary: TourismCompanyProfile | null,
  fallback: TourismCompanyProfile | null
): TourismCompanyProfile | null => {
  if (!primary && !fallback) return null;
  return {
    id: TOURISM_COMPANY_ID,
    company_name: primary?.company_name ?? fallback?.company_name ?? null,
    contact_email: primary?.contact_email ?? fallback?.contact_email ?? null,
    contact_phone: primary?.contact_phone ?? fallback?.contact_phone ?? null,
    address: primary?.address ?? fallback?.address ?? null,
    tax_info: primary?.tax_info ?? fallback?.tax_info ?? null,
    logo_url: primary?.logo_url ?? fallback?.logo_url ?? null,
    signature_url: primary?.signature_url ?? fallback?.signature_url ?? null,
  };
};

const buildProfilePayload = (
  payload: Partial<TourismCompanyProfile>,
  currentProfile: TourismCompanyProfile | null
) => {
  const nextProfile = {} as Omit<TourismCompanyProfile, 'id'>;

  for (const field of PROFILE_FIELDS) {
    if (hasOwn(payload, field) && payload[field] !== undefined) {
      nextProfile[field] = normalizeProfileField(payload[field]) as TourismCompanyProfile[ProfileField];
      continue;
    }

    nextProfile[field] = currentProfile?.[field] ?? null;
  }

  return nextProfile;
};

const fetchCompanyProfileFromTable = async (): Promise<TourismCompanyProfile | null> => {
  const { data: singleton, error } = await supabase
    .from('tourism_company_profile')
    .select('*')
    .eq('id', TOURISM_COMPANY_ID)
    .maybeSingle();

  if (!error) return (singleton as TourismCompanyProfile | null) ?? null;

  const { data: latest, error: latestError } = await supabase
    .from('tourism_company_profile')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestError) throw latestError;
  return (latest as TourismCompanyProfile | null) ?? null;
};

export async function fetchCompanyProfile(): Promise<TourismCompanyProfile | null> {
  const { data: settingsData, error: settingsError } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', COMPANY_PROFILE_SETTINGS_KEY)
    .maybeSingle();

  if (settingsError) {
    // If settings is unavailable, fallback directly to table profile.
    return await fetchCompanyProfileFromTable();
  }

  const fromSettings = normalizeProfile(settingsData?.value);
  const fromTable = await fetchCompanyProfileFromTable();
  // Root fix: never lose existing company fields when one source is partial.
  return mergeProfiles(fromSettings, fromTable);
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
      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', COMPANY_PROFILE_SETTINGS_KEY)
        .maybeSingle();
      const tableProfile = await fetchCompanyProfileFromTable();
      const fromSettings = normalizeProfile(settingsData?.value);
      const currentProfile = mergeProfiles(fromSettings, tableProfile);
      // Root fix: only fields explicitly present in payload can overwrite current data.
      const profilePayload = buildProfilePayload(payload, currentProfile);

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
        ...profilePayload,
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
      const fromSettings = normalizeProfile(settingsData?.value);
      return mergeProfiles(fromSettings, tableProfile);
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
