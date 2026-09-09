import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
const [pin] = process.argv.slice(2); if (!pin || !/^\d{4}$/.test(pin)) throw new Error("Usage: npm run admin:set-pin -- 1234");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY; if (!url || !key) throw new Error("Supabase environment variables are missing");
const db = createClient(url, key, { auth: { persistSession: false } }); const admin_pin_hash = await bcrypt.hash(pin, 12);
const { error } = await db.from("admin_config").update({ admin_pin_hash, updated_at: new Date().toISOString() }).eq("singleton", true); if (error) throw error; console.log("Administrator PIN updated.");
