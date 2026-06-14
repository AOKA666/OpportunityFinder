"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { ReviewStatus } from "@/lib/types/database";

const REVIEW_STATUSES = new Set<ReviewStatus>(["keep", "watch", "pass"]);

export async function saveReviewLabel(formData: FormData) {
  const productId = String(formData.get("product_id") ?? "");
  const status = String(formData.get("status") ?? "") as ReviewStatus;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!productId || !REVIEW_STATUSES.has(status)) {
    throw new Error("A valid product and review status are required.");
  }

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from("review_labels").insert({
    product_id: productId,
    status,
    note,
  });

  if (error) {
    throw new Error(`Unable to save review: ${error.message}`);
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
}
