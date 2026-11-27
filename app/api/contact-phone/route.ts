import { createPhoneHandler } from "../../phone-protection/handler";
import { phoneConfig, phoneRateLimit, verifyPhoneToken } from "../../phone-protection/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;
export const POST = createPhoneHandler({ config: phoneConfig, limit: phoneRateLimit, verify: verifyPhoneToken });

