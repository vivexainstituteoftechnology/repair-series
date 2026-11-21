import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
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

async function testUpdate() {
  // Find a section that is on the website
  const sectionId = 'm74KYqW27tyD4caFZDZO'; // b4 for 7pHov9rTHLPpfQHr77Oo (default homepage service type!)
  const ref = doc(db, 'homeSections', sectionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    console.log('Section not found');
    return;
  }
  const data = snap.data();
  console.log('Current section data:', data.title, data.contentType, data.layout);
  const images = (data.images || []).map((img, idx) => ({
    ...img,
    title: `Slideshow Slide #${idx + 1} Title`,
    tagline: `Exclusive Tagline for Slide #${idx + 1}`,
    buttonText: `Explore Slide #${idx + 1}`,
    buttonLink: '/services',
    contentPosition: 'left',
    contentVerticalAlign: 'center',
    elementOrder: ['title', 'tagline', 'button'],
    animations: {
      title: 'slideUp',
      tagline: 'slideUp',
      button: 'fadeIn',
      duration: 0.6,
      stagger: 0.15,
    },
    overlay: {
      enabled: true,
      color: '#000000',
      opacity: 45,
      gradientDirection: 'to-r',
      gradientIntensity: 70,
      backdropBlur: false,
    },
    styling: {
      titleColor: '#FFFFFF',
      titleWeight: '800',
      titleLineHeight: 'tight',
      titleShadow: 'medium',
      titleOutline: false,
      taglineColor: '#F3F4F6',
      taglineWeight: '500',
      taglineLineHeight: 'normal',
      taglineShadow: 'subtle',
      taglineOutline: false,
      buttonBgColor: '#C86A37',
      buttonTextColor: '#FFFFFF',
      buttonRadius: 'rounded-xl',
      contentGap: 12,
      maxWidth: 650,
    },
    responsive: {
      desktop: { titleSize: 32, taglineSize: 16, position: 'left', verticalAlign: 'center', buttonSize: 'md', maxWidth: 650 },
      tablet: { titleSize: 26, taglineSize: 14, position: 'left', verticalAlign: 'center', buttonSize: 'md', maxWidth: 500 },
      mobile: { titleSize: 20, taglineSize: 13, position: 'center', verticalAlign: 'center', buttonSize: 'sm', maxWidth: 340 },
    },
  }));

  await updateDoc(ref, { images });
  console.log('Updated section m74KYqW27tyD4caFZDZO with rich slideshow content successfully!');
  process.exit(0);
}

testUpdate().catch(console.error);
