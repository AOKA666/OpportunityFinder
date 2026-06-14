export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProductScale =
  | "micro_tool"
  | "single-purpose_site"
  | "browser_extension"
  | "template_tool"
  | "small_saas"
  | "platform"
  | "enterprise_saas"
  | "marketplace"
  | "agency_service"
  | "content_media"
  | "generic_chatbot_platform";

export type Complexity = "low" | "medium" | "high";
export type FounderFit = "good" | "maybe" | "bad";
export type Potential = "high" | "medium" | "low";
export type ReviewStatus = "keep" | "watch" | "pass";
export type OpportunityVerdict = "build" | "watch" | "pass";

export interface Database {
  public: {
    Tables: {
      ranking_sources: {
        Row: {
          id: string;
          name: string;
          base_url: string | null;
          source_type: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          base_url?: string | null;
          source_type: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          base_url?: string | null;
          source_type?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          domain: string | null;
          website_url: string | null;
          tagline: string | null;
          description: string | null;
          logo_url: string | null;
          pricing_type: string | null;
          first_seen_at: string;
          last_seen_at: string;
          product_scale: ProductScale | null;
          is_blocked: boolean;
          block_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          domain?: string | null;
          website_url?: string | null;
          tagline?: string | null;
          description?: string | null;
          logo_url?: string | null;
          pricing_type?: string | null;
          first_seen_at?: string;
          last_seen_at?: string;
          product_scale?: ProductScale | null;
          is_blocked?: boolean;
          block_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      product_rankings: {
        Row: {
          id: string;
          product_id: string;
          source_name: string;
          source_url: string | null;
          list_name: string | null;
          list_type: string | null;
          category: string | null;
          rank_position: number | null;
          upvotes: number | null;
          comments: number | null;
          rating: number | null;
          snapshot_date: string;
          raw_data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          source_name: string;
          source_url?: string | null;
          list_name?: string | null;
          list_type?: string | null;
          category?: string | null;
          rank_position?: number | null;
          upvotes?: number | null;
          comments?: number | null;
          rating?: number | null;
          snapshot_date?: string;
          raw_data?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_rankings"]["Insert"]>;
        Relationships: [];
      };
      product_patterns: {
        Row: {
          id: string;
          product_id: string;
          input_type: string | null;
          output_type: string | null;
          target_user: string | null;
          job_to_be_done: string | null;
          product_format: string | null;
          mvp_complexity: Complexity | null;
          cultural_dependency: Complexity | null;
          solo_founder_fit: FounderFit | null;
          seo_potential: Potential | null;
          standalone_potential: Potential | null;
          reason_summary: string | null;
          pass_reasons: string[] | null;
          tags: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          input_type?: string | null;
          output_type?: string | null;
          target_user?: string | null;
          job_to_be_done?: string | null;
          product_format?: string | null;
          mvp_complexity?: Complexity | null;
          cultural_dependency?: Complexity | null;
          solo_founder_fit?: FounderFit | null;
          seo_potential?: Potential | null;
          standalone_potential?: Potential | null;
          reason_summary?: string | null;
          pass_reasons?: string[] | null;
          tags?: string[] | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_patterns"]["Insert"]>;
        Relationships: [];
      };
      review_labels: {
        Row: {
          id: string;
          product_id: string;
          status: ReviewStatus;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          status: ReviewStatus;
          note?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["review_labels"]["Insert"]>;
        Relationships: [];
      };
      opportunities: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          source_product_ids: string[] | null;
          main_keyword: string | null;
          long_tail_keywords: string[] | null;
          competitor_urls: string[] | null;
          mvp_summary: string | null;
          standalone_score: number | null;
          founder_fit_score: number | null;
          buildability_score: number | null;
          verdict: OpportunityVerdict | null;
          risk_summary: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          source_product_ids?: string[] | null;
          main_keyword?: string | null;
          long_tail_keywords?: string[] | null;
          competitor_urls?: string[] | null;
          mvp_summary?: string | null;
          standalone_score?: number | null;
          founder_fit_score?: number | null;
          buildability_score?: number | null;
          verdict?: OpportunityVerdict | null;
          risk_summary?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["opportunities"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type TableName = keyof Database["public"]["Tables"];
export type Row<T extends TableName> = Database["public"]["Tables"][T]["Row"];
export type Insert<T extends TableName> =
  Database["public"]["Tables"][T]["Insert"];
