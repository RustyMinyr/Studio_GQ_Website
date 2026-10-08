import { writeFileSync, mkdirSync } from 'node:fs';
const keys=['CREW_PORTAL_EMAIL','CREW_PORTAL_PASSWORD','CREW_SESSION_SECRET','RESEND_API_KEY','BOOKING_FROM_EMAIL','BOOKING_NOTIFICATION_EMAIL'];
const env={};
for(const key of keys) if(process.env[key]) env[key]=process.env[key];
env.BOOKING_NOTIFICATION_EMAIL ||= 'bookings@studiogq.co.za';
env.BOOKING_FROM_EMAIL ||= 'Studio GQ <web@rooiko.com>';
mkdirSync('.migration',{recursive:true,mode:0o700});
writeFileSync('.migration/runtime.json',JSON.stringify(env),{mode:0o600});
console.log(JSON.stringify({crewConfigured:!!env.CREW_PORTAL_PASSWORD&&!!env.CREW_SESSION_SECRET,mailConfigured:!!env.RESEND_API_KEY}));
