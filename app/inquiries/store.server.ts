import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { NewInquiryPersistencePlan, SaveNewInquiryResult } from "./persistence.server";

export function createInquiryStore() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secret = process.env.INQUIRY_SUPABASE_SECRET_KEY?.trim();
  if (!url || !secret) return null;

  const client = createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });

  return {
    async saveNewInquiry(plan: NewInquiryPersistencePlan): Promise<SaveNewInquiryResult> {
      const { data, error } = await client.rpc("save_new_inquiry", { submission: plan.inquiry, notification_provider: plan.notificationAttempt?.provider ?? null });
      if (error) throw new Error("Inquiry storage failed");
      if (data?.outcome === "idempotency_conflict") return { outcome: data.outcome };
      if (
        (data?.outcome === "created" || data?.outcome === "replayed")
        && typeof data.inquiryNumber === "string"
        && typeof data.createdAt === "string"
      ) {
        return { outcome: data.outcome, inquiryNumber: data.inquiryNumber, createdAt: data.createdAt };
      }
      throw new Error("Unexpected inquiry storage result");
    },
  };
}
