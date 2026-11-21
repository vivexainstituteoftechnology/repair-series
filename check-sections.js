const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');

let envText = '';
try { envText = fs.readFileSync('website/.env.local', 'utf8'); } catch(e){}
if (!envText) {
  try { envText = fs.readFileSync('website/.env', 'utf8'); } catch(e){}
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

console.log('Firebase Project ID:', config.projectId);
const app = initializeApp(config);
const db = getFirestore(app);

async function check() {
  const snap = await getDocs(collection(db, 'homeSections'));
  console.log('Total homeSections:', snap.docs.length);
  snap.docs.forEach(d => {
    const data = d.data();
    console.log('--- SECTION ---');
    console.log('ID:', d.id);
    console.log('Title:', data.title);
    console.log('contentType:', data.contentType);
    console.log('type:', data.type);
    console.log('layout:', data.layout);
    console.log('images length:', data.images ? data.images.length : 'none');
    if (data.images && data.images.length) {
      console.log('Images:', JSON.stringify(data.images, null, 2));
    }
  });

  const bannerSnap = await getDocs(collection(db, 'banners'));
  console.log('=== BANNERS COLLECTION ===');
  console.log('Total banners in banners collection:', bannerSnap.docs.length);
  bannerSnap.docs.forEach(d => {
    const data = d.data();
    console.log('Banner ID:', d.id, 'Title:', data.title, 'Tagline:', data.tagline, 'buttonText:', data.buttonText);
  });
}
check().catch(e => console.error(e));
