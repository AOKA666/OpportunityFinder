import type {
  FounderFit,
  OpportunityVerdict,
  Potential,
  ProductScale,
  ReviewStatus,
  Row,
} from "@/lib/types/database";

export type Product = Row<"products">;
export type ProductRanking = Row<"product_rankings">;
export type ProductPattern = Row<"product_patterns">;
export type ReviewLabel = Row<"review_labels">;
export type Opportunity = Row<"opportunities">;

export interface ProductListItem extends Product {
  latest_ranking: ProductRanking | null;
  latest_pattern: ProductPattern | null;
  latest_review: ReviewLabel | null;
}

export interface ProductDetail extends Product {
  rankings: ProductRanking[];
  patterns: ProductPattern[];
  reviews: ReviewLabel[];
}

export interface ProductFilters {
  source?: string;
  category?: string;
  product_scale?: ProductScale;
  solo_founder_fit?: FounderFit;
  seo_potential?: Potential;
  standalone_potential?: Potential;
  review_status?: ReviewStatus;
}

export interface OpportunityCard extends Opportunity {
  inspired_by: Pick<Product, "id" | "name" | "domain">[];
  verdict: OpportunityVerdict | null;
}
