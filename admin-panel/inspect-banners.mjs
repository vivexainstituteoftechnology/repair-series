import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import fs from 'fs';

let envText = '';
try { envText = fs.readFileSync('../website/.env.local', 'utf8'); } catch(e){}
if (!envText) {
  try { envText = fs.readFileSync('../website/.env', 'utf8'); } catch(e){}
}
const config = {};
envText.split('\n').forEach(line => {
  const parts = line.trim().split('=');
  const k = parts[0];
  const val = parts.slice(1).join('=').replace(/^['"]|['"]$/g, '');
  if (k === 'NEXT_PUBLIC_FIREBASE_API_KEY') config.apiKey = val;
  if (k === 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN') config.authDomain = val;
  if (k === 'NEXT_PUBLIC_FIREBASE_PROJECT_ID') config.projectId = val;
  if (k === 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET') config.storageBucket = val;
  if (k === 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID') config.messagingSenderId = val;
  if (k === 'NEXT_PUBLIC_FIREBASE_APP_ID') config.appId = val;
});

const app = initializeApp(config);
const db = getFirestore(app);

async function inspectAndEnrich() {
  const snap = await getDocs(collection(db, 'homeSections'));
  for (const d of snap.docs) {
    const data = d.data();
    const isBanner = data.contentType === 'banners' || data.contentType === 'fullWidthBanner' || data.layout === 'autoSlider';
    if (isBanner && data.images && data.images.length > 0) {
      console.log(`Found Banner Section: ${d.id} | Title: "${data.title}" | type: ${data.serviceTypeId || 'GLOBAL'} | layout: ${data.layout} | slides: ${data.images.length}`);
      // Check if any slide already has a title
      const hasTitle = data.images.some(img => img.title);
      console.log(`  -> hasTitle configured? ${hasTitle}`);
    }
  }
}

inspectAndEnrich().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
