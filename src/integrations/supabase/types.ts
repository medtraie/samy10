export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accounting_accounts: {
        Row: {
          account_type: string
          class: number
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          nature: string
          notes: string | null
          parent_code: string | null
          updated_at: string
        }
        Insert: {
          account_type?: string
          class: number
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          nature?: string
          notes?: string | null
          parent_code?: string | null
          updated_at?: string
        }
        Update: {
          account_type?: string
          class?: number
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          nature?: string
          notes?: string | null
          parent_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      accounting_entries: {
        Row: {
          created_at: string
          description: string
          entry_date: string
          entry_number: string
          fiscal_year_id: string
          id: string
          journal_id: string
          reference: string | null
          source_id: string | null
          source_type: string | null
          status: string
          total_credit: number
          total_debit: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          entry_date: string
          entry_number: string
          fiscal_year_id: string
          id?: string
          journal_id: string
          reference?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
          total_credit?: number
          total_debit?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          entry_date?: string
          entry_number?: string
          fiscal_year_id?: string
          id?: string
          journal_id?: string
          reference?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
          total_credit?: number
          total_debit?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounting_entries_fiscal_year_id_fkey"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "accounting_fiscal_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_entries_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "accounting_journals"
            referencedColumns: ["id"]
          },
        ]
      }
      accounting_entry_lines: {
        Row: {
          account_id: string
          created_at: string
          credit: number
          debit: number
          entry_id: string
          id: string
          label: string
          tva_amount: number | null
          tva_rate: number | null
        }
        Insert: {
          account_id: string
          created_at?: string
          credit?: number
          debit?: number
          entry_id: string
          id?: string
          label: string
          tva_amount?: number | null
          tva_rate?: number | null
        }
        Update: {
          account_id?: string
          created_at?: string
          credit?: number
          debit?: number
          entry_id?: string
          id?: string
          label?: string
          tva_amount?: number | null
          tva_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "accounting_entry_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounting_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_entry_lines_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "accounting_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      accounting_fiscal_years: {
        Row: {
          created_at: string
          end_date: string
          id: string
          name: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          name: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      accounting_journals: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          journal_type: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          journal_type?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          journal_type?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      accounting_tva_declarations: {
        Row: {
          created_at: string
          credit_report: number
          id: string
          notes: string | null
          period_end: string
          period_start: string
          regime: string
          status: string
          tva_collected_10: number
          tva_collected_14: number
          tva_collected_20: number
          tva_collected_7: number
          tva_deductible_charges: number
          tva_deductible_immobilisations: number
          tva_due: number
          tva_to_pay: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          credit_report?: number
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          regime?: string
          status?: string
          tva_collected_10?: number
          tva_collected_14?: number
          tva_collected_20?: number
          tva_collected_7?: number
          tva_deductible_charges?: number
          tva_deductible_immobilisations?: number
          tva_due?: number
          tva_to_pay?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          credit_report?: number
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          regime?: string
          status?: string
          tva_collected_10?: number
          tva_collected_14?: number
          tva_collected_20?: number
          tva_collected_7?: number
          tva_deductible_charges?: number
          tva_deductible_immobilisations?: number
          tva_due?: number
          tva_to_pay?: number
          updated_at?: string
        }
        Relationships: []
      }
      approvisionnements: {
        Row: {
          citerne_id: string
          cout: number
          created_at: string
          date: string
          fournisseur: string | null
          id: string
          notes: string | null
          quantite: number
        }
        Insert: {
          citerne_id: string
          cout?: number
          created_at?: string
          date?: string
          fournisseur?: string | null
          id?: string
          notes?: string | null
          quantite: number
        }
        Update: {
          citerne_id?: string
          cout?: number
          created_at?: string
          date?: string
          fournisseur?: string | null
          id?: string
          notes?: string | null
          quantite?: number
        }
        Relationships: [
          {
            foreignKeyName: "approvisionnements_citerne_id_fkey"
            columns: ["citerne_id"]
            isOneToOne: false
            referencedRelation: "citernes"
            referencedColumns: ["id"]
          },
        ]
      }
      chantiers: {
        Row: {
          address: string | null
          city: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          gps_lat: number | null
          gps_lng: number | null
          id: string
          name: string
          notes: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          name: string
          notes?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          name?: string
          notes?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      citernes: {
        Row: {
          capacite_totale: number
          created_at: string
          id: string
          name: string
          quantite_actuelle: number
          updated_at: string
        }
        Insert: {
          capacite_totale?: number
          created_at?: string
          id?: string
          name?: string
          quantite_actuelle?: number
          updated_at?: string
        }
        Update: {
          capacite_totale?: number
          created_at?: string
          id?: string
          name?: string
          quantite_actuelle?: number
          updated_at?: string
        }
        Relationships: []
      }
      drivers: {
        Row: {
          created_at: string
          id: string
          license_expiry: string
          license_type: string
          name: string
          phone: string
          status: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          license_expiry: string
          license_type?: string
          name: string
          phone: string
          status?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          license_expiry?: string
          license_type?: string
          name?: string
          phone?: string
          status?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: []
      }
      facture_lines: {
        Row: {
          created_at: string
          description: string
          facture_id: string
          id: string
          quantity: number
          total_price: number
          unit: string
          unit_price: number
          voyage_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          facture_id: string
          id?: string
          quantity?: number
          total_price?: number
          unit?: string
          unit_price?: number
          voyage_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          facture_id?: string
          id?: string
          quantity?: number
          total_price?: number
          unit?: string
          unit_price?: number
          voyage_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facture_lines_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facture_lines_voyage_id_fkey"
            columns: ["voyage_id"]
            isOneToOne: false
            referencedRelation: "voyages"
            referencedColumns: ["id"]
          },
        ]
      }
      factures: {
        Row: {
          chantier_id: string | null
          client_address: string | null
          client_name: string
          created_at: string
          date_from: string
          date_to: string
          facture_number: string
          id: string
          notes: string | null
          status: string
          tax_amount: number
          tax_rate: number
          total_amount: number
          total_tonnage: number
          total_trips: number
          total_with_tax: number
          updated_at: string
        }
        Insert: {
          chantier_id?: string | null
          client_address?: string | null
          client_name: string
          created_at?: string
          date_from: string
          date_to: string
          facture_number: string
          id?: string
          notes?: string | null
          status?: string
          tax_amount?: number
          tax_rate?: number
          total_amount?: number
          total_tonnage?: number
          total_trips?: number
          total_with_tax?: number
          updated_at?: string
        }
        Update: {
          chantier_id?: string | null
          client_address?: string | null
          client_name?: string
          created_at?: string
          date_from?: string
          date_to?: string
          facture_number?: string
          id?: string
          notes?: string | null
          status?: string
          tax_amount?: number
          tax_rate?: number
          total_amount?: number
          total_tonnage?: number
          total_trips?: number
          total_with_tax?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "factures_chantier_id_fkey"
            columns: ["chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_logs: {
        Row: {
          created_at: string
          driver_id: string | null
          id: string
          liters: number
          log_date: string
          mileage: number
          price_per_liter: number
          station: string
          total_cost: number | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          driver_id?: string | null
          id?: string
          liters: number
          log_date: string
          mileage: number
          price_per_liter: number
          station: string
          total_cost?: number | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          driver_id?: string | null
          id?: string
          liters?: number
          log_date?: string
          mileage?: number
          price_per_liter?: number
          station?: string
          total_cost?: number | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_logs_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance: {
        Row: {
          cost: number | null
          created_at: string
          id: string
          maintenance_date: string
          maintenance_type: string
          notes: string | null
          status: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          id?: string
          maintenance_date: string
          maintenance_type: string
          notes?: string | null
          status?: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          id?: string
          maintenance_date?: string
          maintenance_type?: string
          notes?: string | null
          status?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: []
      }
      missions: {
        Row: {
          arrival_zone: string
          created_at: string
          departure_zone: string
          driver_id: string | null
          cash_amount: number | null
          extra_fees: number | null
          fuel_quantity: number | null
          price_per_liter: number | null
          fuel_cost: number | null
          discount_rate: number | null
          discount_amount: number | null
          tax_rate: number | null
          tax_amount: number | null
          total_before_cap: number | null
          max_total_cost: number | null
          id: string
          mission_date: string
          notes: string | null
          status: string
          total_cost: number | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          arrival_zone: string
          created_at?: string
          departure_zone: string
          driver_id?: string | null
          cash_amount?: number | null
          extra_fees?: number | null
          fuel_quantity?: number | null
          price_per_liter?: number | null
          fuel_cost?: number | null
          discount_rate?: number | null
          discount_amount?: number | null
          tax_rate?: number | null
          tax_amount?: number | null
          total_before_cap?: number | null
          max_total_cost?: number | null
          id?: string
          mission_date: string
          notes?: string | null
          status?: string
          total_cost?: number | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          arrival_zone?: string
          created_at?: string
          departure_zone?: string
          driver_id?: string | null
          cash_amount?: number | null
          extra_fees?: number | null
          fuel_quantity?: number | null
          price_per_liter?: number | null
          fuel_cost?: number | null
          discount_rate?: number | null
          discount_amount?: number | null
          tax_rate?: number | null
          tax_amount?: number | null
          total_before_cap?: number | null
          max_total_cost?: number | null
          id?: string
          mission_date?: string
          notes?: string | null
          status?: string
          total_cost?: number | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "missions_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      passenger_baggage: {
        Row: {
          baggage_number: string
          created_at: string
          description: string | null
          fee_amount: number
          id: string
          status: string
          ticket_id: string | null
          trip_id: string
          weight_kg: number | null
        }
        Insert: {
          baggage_number: string
          created_at?: string
          description?: string | null
          fee_amount?: number
          id?: string
          status?: string
          ticket_id?: string | null
          trip_id: string
          weight_kg?: number | null
        }
        Update: {
          baggage_number?: string
          created_at?: string
          description?: string | null
          fee_amount?: number
          id?: string
          status?: string
          ticket_id?: string | null
          trip_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "passenger_baggage_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "passenger_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passenger_baggage_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "passenger_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      passenger_fares: {
        Row: {
          created_at: string
          fare_amount: number
          from_station_id: string
          id: string
          line_id: string
          to_station_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fare_amount?: number
          from_station_id: string
          id?: string
          line_id: string
          to_station_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fare_amount?: number
          from_station_id?: string
          id?: string
          line_id?: string
          to_station_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "passenger_fares_from_station_id_fkey"
            columns: ["from_station_id"]
            isOneToOne: false
            referencedRelation: "passenger_stations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passenger_fares_line_id_fkey"
            columns: ["line_id"]
            isOneToOne: false
            referencedRelation: "passenger_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passenger_fares_to_station_id_fkey"
            columns: ["to_station_id"]
            isOneToOne: false
            referencedRelation: "passenger_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      passenger_lines: {
        Row: {
          arrival_city: string
          code: string
          created_at: string
          departure_city: string
          distance_km: number | null
          estimated_duration_minutes: number | null
          id: string
          name: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          arrival_city: string
          code: string
          created_at?: string
          departure_city: string
          distance_km?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          name: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          arrival_city?: string
          code?: string
          created_at?: string
          departure_city?: string
          distance_km?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          name?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      passenger_stations: {
        Row: {
          city: string
          created_at: string
          distance_from_start_km: number | null
          gps_lat: number | null
          gps_lng: number | null
          id: string
          line_id: string
          name: string
          sequence_order: number
        }
        Insert: {
          city: string
          created_at?: string
          distance_from_start_km?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          line_id: string
          name: string
          sequence_order?: number
        }
        Update: {
          city?: string
          created_at?: string
          distance_from_start_km?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          line_id?: string
          name?: string
          sequence_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "passenger_stations_line_id_fkey"
            columns: ["line_id"]
            isOneToOne: false
            referencedRelation: "passenger_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      passenger_tickets: {
        Row: {
          created_at: string
          fare_amount: number
          from_station_id: string
          id: string
          issue_date: string
          notes: string | null
          status: string
          ticket_number: string
          to_station_id: string
          trip_id: string
        }
        Insert: {
          created_at?: string
          fare_amount: number
          from_station_id: string
          id?: string
          issue_date?: string
          notes?: string | null
          status?: string
          ticket_number: string
          to_station_id: string
          trip_id: string
        }
        Update: {
          created_at?: string
          fare_amount?: number
          from_station_id?: string
          id?: string
          issue_date?: string
          notes?: string | null
          status?: string
          ticket_number?: string
          to_station_id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "passenger_tickets_from_station_id_fkey"
            columns: ["from_station_id"]
            isOneToOne: false
            referencedRelation: "passenger_stations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passenger_tickets_to_station_id_fkey"
            columns: ["to_station_id"]
            isOneToOne: false
            referencedRelation: "passenger_stations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passenger_tickets_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "passenger_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      passenger_trips: {
        Row: {
          arrival_time: string | null
          available_seats: number | null
          created_at: string
          departure_time: string
          driver_id: string | null
          id: string
          line_id: string
          notes: string | null
          status: string
          trip_date: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          arrival_time?: string | null
          available_seats?: number | null
          created_at?: string
          departure_time: string
          driver_id?: string | null
          id?: string
          line_id: string
          notes?: string | null
          status?: string
          trip_date: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          arrival_time?: string | null
          available_seats?: number | null
          created_at?: string
          departure_time?: string
          driver_id?: string | null
          id?: string
          line_id?: string
          notes?: string | null
          status?: string
          trip_date?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "passenger_trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passenger_trips_line_id_fkey"
            columns: ["line_id"]
            isOneToOne: false
            referencedRelation: "passenger_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      personnel: {
        Row: {
          id: string
          first_name: string
          last_name: string
          cin: string | null
          role: string
          phone: string | null
          email: string | null
          address: string | null
          cnss_number: string | null
          birth_date: string | null
          hire_date: string | null
          contract_type: string | null
          status: string
          photo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          cin?: string | null
          role?: string
          phone?: string | null
          email?: string | null
          address?: string | null
          cnss_number?: string | null
          birth_date?: string | null
          hire_date?: string | null
          contract_type?: string | null
          status?: string
          photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          cin?: string | null
          role?: string
          phone?: string | null
          email?: string | null
          address?: string | null
          cnss_number?: string | null
          birth_date?: string | null
          hire_date?: string | null
          contract_type?: string | null
          status?: string
          photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      personnel_documents: {
        Row: {
          id: string
          personnel_id: string
          title: string
          document_type: string
          document_number: string | null
          issue_date: string | null
          expiry_date: string | null
          file_url: string | null
          notes: string | null
          status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          personnel_id: string
          title: string
          document_type: string
          document_number?: string | null
          issue_date?: string | null
          expiry_date?: string | null
          file_url?: string | null
          notes?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          personnel_id?: string
          title?: string
          document_type?: string
          document_number?: string | null
          issue_date?: string | null
          expiry_date?: string | null
          file_url?: string | null
          notes?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "personnel_documents_personnel_id_fkey"
            columns: ["personnel_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          }
        ]
      }
      app_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      driving_licenses: {
        Row: {
          id: string
          personnel_id: string
          license_number: string
          categories: string[] | null
          issue_date: string | null
          expiry_date: string
          scan_url: string | null
          status: string | null
          points_balance: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          personnel_id: string
          license_number: string
          categories?: string[] | null
          issue_date?: string | null
          expiry_date: string
          scan_url?: string | null
          status?: string | null
          points_balance?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          personnel_id?: string
          license_number?: string
          categories?: string[] | null
          issue_date?: string | null
          expiry_date?: string
          scan_url?: string | null
          status?: string | null
          points_balance?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driving_licenses_personnel_id_fkey"
            columns: ["personnel_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          }
        ]
      }
      finance_cash_registers: {
        Row: {
          id: string
          name: string
          description: string | null
          currency: string | null
          initial_balance: number
          current_balance: number
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          currency?: string | null
          initial_balance?: number
          current_balance?: number
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          currency?: string | null
          initial_balance?: number
          current_balance?: number
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      finance_bank_accounts: {
        Row: {
          id: string
          bank_name: string
          account_number: string | null
          rib: string | null
          initial_balance: number
          current_balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bank_name: string
          account_number?: string | null
          rib?: string | null
          initial_balance?: number
          current_balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bank_name?: string
          account_number?: string | null
          rib?: string | null
          initial_balance?: number
          current_balance?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      finance_checkbooks: {
        Row: {
          id: string
          bank_account_id: string
          series_start: string
          series_end: string
          current_number: string | null
          is_active: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          bank_account_id: string
          series_start: string
          series_end: string
          current_number?: string | null
          is_active?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          bank_account_id?: string
          series_start?: string
          series_end?: string
          current_number?: string | null
          is_active?: boolean | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_checkbooks_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "finance_bank_accounts"
            referencedColumns: ["id"]
          }
        ]
      }
      finance_payments: {
        Row: {
          id: string
          payment_type: string
          payment_method: string
          amount: number
          payment_date: string
          reference_number: string | null
          entity_name: string | null
          invoice_id: string | null
          cash_register_id: string | null
          bank_account_id: string | null
          status: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          payment_type: string
          payment_method: string
          amount: number
          payment_date?: string
          reference_number?: string | null
          entity_name?: string | null
          invoice_id?: string | null
          cash_register_id?: string | null
          bank_account_id?: string | null
          status?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          payment_type?: string
          payment_method?: string
          amount?: number
          payment_date?: string
          reference_number?: string | null
          entity_name?: string | null
          invoice_id?: string | null
          cash_register_id?: string | null
          bank_account_id?: string | null
          status?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_payments_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "finance_cash_registers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_payments_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "finance_bank_accounts"
            referencedColumns: ["id"]
          }
        ]
      }
      finance_cash_transactions: {
        Row: {
          id: string
          cash_register_id: string
          payment_id: string | null
          transaction_type: string
          amount: number
          balance_after: number
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          cash_register_id: string
          payment_id?: string | null
          transaction_type: string
          amount: number
          balance_after: number
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          cash_register_id?: string
          payment_id?: string | null
          transaction_type?: string
          amount?: number
          balance_after?: number
          description?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_cash_transactions_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "finance_cash_registers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_cash_transactions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "finance_payments"
            referencedColumns: ["id"]
          }
        ]
      }
      medical_visits: {
        Row: {
          id: string
          personnel_id: string
          visit_date: string
          visit_type: string
          next_visit_date: string | null
          doctor_name: string | null
          diagnosis: string | null
          fitness_status: string
          document_url: string | null
          cost: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          personnel_id: string
          visit_date: string
          visit_type: string
          next_visit_date?: string | null
          doctor_name?: string | null
          diagnosis?: string | null
          fitness_status?: string
          document_url?: string | null
          cost?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          personnel_id?: string
          visit_date?: string
          visit_type?: string
          next_visit_date?: string | null
          doctor_name?: string | null
          diagnosis?: string | null
          fitness_status?: string
          document_url?: string | null
          cost?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_visits_personnel_id_fkey"
            columns: ["personnel_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          }
        ]
      }
      infractions: {
        Row: {
          id: string
          personnel_id: string
          vehicle_id: string | null
          infraction_date: string
          infraction_type: string
          location: string | null
          amount: number
          points_deducted: number | null
          status: string | null
          payment_date: string | null
          document_url: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          personnel_id: string
          vehicle_id?: string | null
          infraction_date: string
          infraction_type: string
          location?: string | null
          amount: number
          points_deducted?: number | null
          status?: string | null
          payment_date?: string | null
          document_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          personnel_id?: string
          vehicle_id?: string | null
          infraction_date?: string
          infraction_type?: string
          location?: string | null
          amount?: number
          points_deducted?: number | null
          status?: string | null
          payment_date?: string | null
          document_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "infractions_personnel_id_fkey"
            columns: ["personnel_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          }
        ]
      }
      pleins_exterieur: {
        Row: {
          cout: number
          created_at: string
          date: string
          driver_id: string | null
          id: string
          kilometrage: number
          notes: string | null
          quantite: number
          station: string | null
          vehicle_id: string
        }
        Insert: {
          cout?: number
          created_at?: string
          date?: string
          driver_id?: string | null
          id?: string
          kilometrage?: number
          notes?: string | null
          quantite: number
          station?: string | null
          vehicle_id: string
        }
        Update: {
          cout?: number
          created_at?: string
          date?: string
          driver_id?: string | null
          id?: string
          kilometrage?: number
          notes?: string | null
          quantite?: number
          station?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pleins_exterieur_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      recharges: {
        Row: {
          citerne_id: string
          created_at: string
          date: string
          driver_id: string | null
          id: string
          kilometrage: number
          notes: string | null
          quantite: number
          vehicle_id: string
        }
        Insert: {
          citerne_id: string
          created_at?: string
          date?: string
          driver_id?: string | null
          id?: string
          kilometrage: number
          notes?: string | null
          quantite: number
          vehicle_id: string
        }
        Update: {
          citerne_id?: string
          created_at?: string
          date?: string
          driver_id?: string | null
          id?: string
          kilometrage?: number
          notes?: string | null
          quantite?: number
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recharges_citerne_id_fkey"
            columns: ["citerne_id"]
            isOneToOne: false
            referencedRelation: "citernes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recharges_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_items: {
        Row: {
          category: string
          created_at: string
          id: string
          last_restocked: string | null
          location: string | null
          min_quantity: number
          name: string
          quantity: number
          reference: string | null
          supplier_id: string | null
          unit: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          last_restocked?: string | null
          location?: string | null
          min_quantity?: number
          name: string
          quantity?: number
          reference?: string | null
          supplier_id?: string | null
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          last_restocked?: string | null
          location?: string | null
          min_quantity?: number
          name?: string
          quantity?: number
          reference?: string | null
          supplier_id?: string | null
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "stock_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_suppliers: {
        Row: {
          address: string | null
          categories: string[] | null
          city: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          rating: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          categories?: string[] | null
          city?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          rating?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          categories?: string[] | null
          city?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          rating?: number
          updated_at?: string
        }
        Relationships: []
      }
      stock_transactions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          item_id: string
          new_quantity: number | null
          notes: string | null
          previous_quantity: number | null
          quantity: number
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          item_id: string
          new_quantity?: number | null
          notes?: string | null
          previous_quantity?: number | null
          quantity: number
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          item_id?: string
          new_quantity?: number | null
          notes?: string | null
          previous_quantity?: number | null
          quantity?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
        ]
      }
      tms_clients: {
        Row: {
          address: string | null
          city: string | null
          company: string | null
          created_at: string
          email: string | null
          ice: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          ice?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          ice?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tms_devis: {
        Row: {
          amount_ht: number
          amount_ttc: number
          client_id: string | null
          created_at: string
          delivery_address: string
          devis_number: string
          distance_km: number
          id: string
          merchandise_type: string | null
          notes: string | null
          pickup_address: string
          status: string
          tarif_id: string | null
          tax_amount: number
          tax_rate: number
          updated_at: string
          valid_until: string | null
          weight_tons: number
        }
        Insert: {
          amount_ht?: number
          amount_ttc?: number
          client_id?: string | null
          created_at?: string
          delivery_address: string
          devis_number: string
          distance_km?: number
          id?: string
          merchandise_type?: string | null
          notes?: string | null
          pickup_address: string
          status?: string
          tarif_id?: string | null
          tax_amount?: number
          tax_rate?: number
          updated_at?: string
          valid_until?: string | null
          weight_tons?: number
        }
        Update: {
          amount_ht?: number
          amount_ttc?: number
          client_id?: string | null
          created_at?: string
          delivery_address?: string
          devis_number?: string
          distance_km?: number
          id?: string
          merchandise_type?: string | null
          notes?: string | null
          pickup_address?: string
          status?: string
          tarif_id?: string | null
          tax_amount?: number
          tax_rate?: number
          updated_at?: string
          valid_until?: string | null
          weight_tons?: number
        }
        Relationships: [
          {
            foreignKeyName: "tms_devis_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "tms_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tms_devis_tarif_id_fkey"
            columns: ["tarif_id"]
            isOneToOne: false
            referencedRelation: "tms_tarifs"
            referencedColumns: ["id"]
          },
        ]
      }
      tms_invoice_lines: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          order_id: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          order_id?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          order_id?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "tms_invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "tms_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tms_invoice_lines_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "tms_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      tms_invoices: {
        Row: {
          amount_ht: number
          amount_ttc: number
          client_id: string | null
          created_at: string
          date_from: string
          date_to: string
          id: string
          invoice_number: string
          notes: string | null
          profit: number
          status: string
          tax_amount: number
          tax_rate: number
          total_cost: number
          total_distance_km: number
          total_orders: number
          total_weight_tons: number
          updated_at: string
        }
        Insert: {
          amount_ht?: number
          amount_ttc?: number
          client_id?: string | null
          created_at?: string
          date_from: string
          date_to: string
          id?: string
          invoice_number: string
          notes?: string | null
          profit?: number
          status?: string
          tax_amount?: number
          tax_rate?: number
          total_cost?: number
          total_distance_km?: number
          total_orders?: number
          total_weight_tons?: number
          updated_at?: string
        }
        Update: {
          amount_ht?: number
          amount_ttc?: number
          client_id?: string | null
          created_at?: string
          date_from?: string
          date_to?: string
          id?: string
          invoice_number?: string
          notes?: string | null
          profit?: number
          status?: string
          tax_amount?: number
          tax_rate?: number
          total_cost?: number
          total_distance_km?: number
          total_orders?: number
          total_weight_tons?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tms_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "tms_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      tms_orders: {
        Row: {
          amount_ht: number
          client_id: string | null
          created_at: string
          delivery_address: string
          delivery_date: string | null
          devis_id: string | null
          distance_km: number
          driver_cost: number
          driver_id: string | null
          fuel_cost: number
          id: string
          merchandise_type: string | null
          notes: string | null
          order_number: string
          other_costs: number
          pickup_address: string
          pickup_date: string
          status: string
          tarif_id: string | null
          toll_cost: number
          total_cost: number
          updated_at: string
          vehicle_id: string | null
          weight_tons: number
        }
        Insert: {
          amount_ht?: number
          client_id?: string | null
          created_at?: string
          delivery_address: string
          delivery_date?: string | null
          devis_id?: string | null
          distance_km?: number
          driver_cost?: number
          driver_id?: string | null
          fuel_cost?: number
          id?: string
          merchandise_type?: string | null
          notes?: string | null
          order_number: string
          other_costs?: number
          pickup_address: string
          pickup_date: string
          status?: string
          tarif_id?: string | null
          toll_cost?: number
          total_cost?: number
          updated_at?: string
          vehicle_id?: string | null
          weight_tons?: number
        }
        Update: {
          amount_ht?: number
          client_id?: string | null
          created_at?: string
          delivery_address?: string
          delivery_date?: string | null
          devis_id?: string | null
          distance_km?: number
          driver_cost?: number
          driver_id?: string | null
          fuel_cost?: number
          id?: string
          merchandise_type?: string | null
          notes?: string | null
          order_number?: string
          other_costs?: number
          pickup_address?: string
          pickup_date?: string
          status?: string
          tarif_id?: string | null
          toll_cost?: number
          total_cost?: number
          updated_at?: string
          vehicle_id?: string | null
          weight_tons?: number
        }
        Relationships: [
          {
            foreignKeyName: "tms_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "tms_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tms_orders_devis_id_fkey"
            columns: ["devis_id"]
            isOneToOne: false
            referencedRelation: "tms_devis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tms_orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tms_orders_tarif_id_fkey"
            columns: ["tarif_id"]
            isOneToOne: false
            referencedRelation: "tms_tarifs"
            referencedColumns: ["id"]
          },
        ]
      }
      tms_tarifs: {
        Row: {
          client_id: string | null
          created_at: string
          currency: string
          id: string
          min_price: number
          name: string
          notes: string | null
          price_per_km: number
          price_per_ton: number
          status: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          min_price?: number
          name: string
          notes?: string | null
          price_per_km?: number
          price_per_ton?: number
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          min_price?: number
          name?: string
          notes?: string | null
          price_per_km?: number
          price_per_ton?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tms_tarifs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "tms_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      tourism_clients: {
        Row: {
          address: string | null
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tourism_invoices: {
        Row: {
          billing_type: string
          client_id: string | null
          created_at: string
          custom_lines: Json | null
          due_date: string | null
          flat_rate: number | null
          hourly_rate: number | null
          hours_worked: number | null
          id: string
          invoice_date: string
          invoice_number: string
          kilometers: number | null
          mission_id: string | null
          notes: string | null
          per_km_rate: number | null
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          billing_type?: string
          client_id?: string | null
          created_at?: string
          custom_lines?: Json | null
          due_date?: string | null
          flat_rate?: number | null
          hourly_rate?: number | null
          hours_worked?: number | null
          id?: string
          invoice_date?: string
          invoice_number: string
          kilometers?: number | null
          mission_id?: string | null
          notes?: string | null
          per_km_rate?: number | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          billing_type?: string
          client_id?: string | null
          created_at?: string
          custom_lines?: Json | null
          due_date?: string | null
          flat_rate?: number | null
          hourly_rate?: number | null
          hours_worked?: number | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          kilometers?: number | null
          mission_id?: string | null
          notes?: string | null
          per_km_rate?: number | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tourism_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "tourism_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tourism_invoices_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "tourism_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      tourism_missions: {
        Row: {
          client_id: string | null
          created_at: string
          description: string | null
          driver_id: string | null
          driver_instructions: string | null
          dropoff_location: string | null
          end_date: string
          end_time: string | null
          id: string
          mission_type: string
          notes: string | null
          passengers_count: number | null
          pickup_location: string | null
          priority: string | null
          reference: string
          start_date: string
          start_time: string | null
          status: string
          title: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          driver_id?: string | null
          driver_instructions?: string | null
          dropoff_location?: string | null
          end_date: string
          end_time?: string | null
          id?: string
          mission_type?: string
          notes?: string | null
          passengers_count?: number | null
          pickup_location?: string | null
          priority?: string | null
          reference: string
          start_date: string
          start_time?: string | null
          status?: string
          title: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          driver_id?: string | null
          driver_instructions?: string | null
          dropoff_location?: string | null
          end_date?: string
          end_time?: string | null
          id?: string
          mission_type?: string
          notes?: string | null
          passengers_count?: number | null
          pickup_location?: string | null
          priority?: string | null
          reference?: string
          start_date?: string
          start_time?: string | null
          status?: string
          title?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tourism_missions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "tourism_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tourism_missions_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      tourism_waypoints: {
        Row: {
          actual_arrival: string | null
          actual_departure: string | null
          address: string | null
          created_at: string
          distance_from_previous_km: number | null
          duration_from_previous_minutes: number | null
          gps_lat: number | null
          gps_lng: number | null
          id: string
          location_name: string
          mission_id: string
          notes: string | null
          planned_arrival: string | null
          planned_departure: string | null
          sequence_order: number
        }
        Insert: {
          actual_arrival?: string | null
          actual_departure?: string | null
          address?: string | null
          created_at?: string
          distance_from_previous_km?: number | null
          duration_from_previous_minutes?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          location_name: string
          mission_id: string
          notes?: string | null
          planned_arrival?: string | null
          planned_departure?: string | null
          sequence_order?: number
        }
        Update: {
          actual_arrival?: string | null
          actual_departure?: string | null
          address?: string | null
          created_at?: string
          distance_from_previous_km?: number | null
          duration_from_previous_minutes?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          location_name?: string
          mission_id?: string
          notes?: string | null
          planned_arrival?: string | null
          planned_departure?: string | null
          sequence_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "tourism_waypoints_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "tourism_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      trajets: {
        Row: {
          created_at: string
          destination_chantier_id: string | null
          distance_km: number | null
          estimated_duration_minutes: number | null
          id: string
          name: string
          notes: string | null
          origin_chantier_id: string | null
          price_per_ton: number
          price_per_trip: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          destination_chantier_id?: string | null
          distance_km?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          name: string
          notes?: string | null
          origin_chantier_id?: string | null
          price_per_ton?: number
          price_per_trip?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          destination_chantier_id?: string | null
          distance_km?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          name?: string
          notes?: string | null
          origin_chantier_id?: string | null
          price_per_ton?: number
          price_per_trip?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trajets_destination_chantier_id_fkey"
            columns: ["destination_chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trajets_origin_chantier_id_fkey"
            columns: ["origin_chantier_id"]
            isOneToOne: false
            referencedRelation: "chantiers"
            referencedColumns: ["id"]
          },
        ]
      }
      achats_delivery_note_items: {
        Row: {
          created_at: string
          delivery_id: string
          description: string
          id: string
          quantity: number
          total_price: number
          unit: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          delivery_id: string
          description: string
          id?: string
          quantity?: number
          total_price?: number
          unit?: string
          unit_price?: number
        }
        Update: {
          created_at?: string
          delivery_id?: string
          description?: string
          id?: string
          quantity?: number
          total_price?: number
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "achats_delivery_note_items_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "achats_delivery_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      achats_delivery_notes: {
        Row: {
          created_at: string
          delivery_date: string
          delivery_number: string
          id: string
          notes: string | null
          order_number: string | null
          status: string
          supplier_name: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_date?: string
          delivery_number: string
          id?: string
          notes?: string | null
          order_number?: string | null
          status?: string
          supplier_name: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_date?: string
          delivery_number?: string
          id?: string
          notes?: string | null
          order_number?: string | null
          status?: string
          supplier_name?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      achats_purchase_order_items: {
        Row: {
          created_at: string
          description: string
          id: string
          order_id: string
          quantity: number
          total_price: number
          unit: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          order_id: string
          quantity?: number
          total_price?: number
          unit?: string
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          order_id?: string
          quantity?: number
          total_price?: number
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "achats_purchase_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "achats_purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      achats_purchase_orders: {
        Row: {
          created_at: string
          expected_delivery_date: string | null
          id: string
          notes: string | null
          order_date: string
          order_number: string
          status: string
          subtotal: number
          supplier_name: string
          tax_amount: number
          tax_rate: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          status?: string
          subtotal?: number
          supplier_name: string
          tax_amount?: number
          tax_rate?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          status?: string
          subtotal?: number
          supplier_name?: string
          tax_amount?: number
          tax_rate?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      achats_purchase_request_items: {
        Row: {
          created_at: string
          description: string
          id: string
          quantity: number
          request_id: string
          total_price: number
          unit: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          quantity?: number
          request_id: string
          total_price?: number
          unit?: string
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          quantity?: number
          request_id?: string
          total_price?: number
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "achats_purchase_request_items_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "achats_purchase_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      achats_purchase_requests: {
        Row: {
          created_at: string
          id: string
          needed_date: string | null
          notes: string | null
          request_date: string
          request_number: string
          requester_name: string | null
          status: string
          supplier_name: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          needed_date?: string | null
          notes?: string | null
          request_date?: string
          request_number: string
          requester_name?: string | null
          status?: string
          supplier_name?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          needed_date?: string | null
          notes?: string | null
          request_date?: string
          request_number?: string
          requester_name?: string | null
          status?: string
          supplier_name?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      achats_supplier_invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          total_price: number
          unit: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          total_price?: number
          unit?: string
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          total_price?: number
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "achats_supplier_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "achats_supplier_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      achats_supplier_invoices: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          status: string
          subtotal: number
          supplier_name: string
          tax_amount: number
          tax_rate: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number: string
          notes?: string | null
          status?: string
          subtotal?: number
          supplier_name: string
          tax_amount?: number
          tax_rate?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          status?: string
          subtotal?: number
          supplier_name?: string
          tax_amount?: number
          tax_rate?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      voyages: {
        Row: {
          arrival_time: string | null
          bon_number: string | null
          created_at: string
          departure_time: string | null
          driver_id: string | null
          id: string
          material_type: string | null
          notes: string | null
          status: string
          tonnage: number
          trajet_id: string | null
          updated_at: string
          vehicle_id: string
          voyage_date: string
        }
        Insert: {
          arrival_time?: string | null
          bon_number?: string | null
          created_at?: string
          departure_time?: string | null
          driver_id?: string | null
          id?: string
          material_type?: string | null
          notes?: string | null
          status?: string
          tonnage?: number
          trajet_id?: string | null
          updated_at?: string
          vehicle_id: string
          voyage_date: string
        }
        Update: {
          arrival_time?: string | null
          bon_number?: string | null
          created_at?: string
          departure_time?: string | null
          driver_id?: string | null
          id?: string
          material_type?: string | null
          notes?: string | null
          status?: string
          tonnage?: number
          trajet_id?: string | null
          updated_at?: string
          vehicle_id?: string
          voyage_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "voyages_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voyages_trajet_id_fkey"
            columns: ["trajet_id"]
            isOneToOne: false
            referencedRelation: "trajets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
