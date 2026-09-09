import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
const entries=process.argv.slice(2);if(!entries.length||entries.some((entry)=>!/^.{1,40}:\d{4}$/.test(entry)))throw new Error('Usage: npm run players:create -- "Zoheb:1234" "Divya:2345"');
const db=createClient(url,key,{auth:{persistSession:false}});for(const entry of entries){const split=entry.lastIndexOf(":");const name=entry.slice(0,split).trim();const pin_hash=await bcrypt.hash(entry.slice(split+1),12);const{error}=await db.from("players").upsert({name,pin_hash,active:true,archived_at:null},{onConflict:"name"});if(error)throw error;console.log(`Created or updated ${name}`);}
