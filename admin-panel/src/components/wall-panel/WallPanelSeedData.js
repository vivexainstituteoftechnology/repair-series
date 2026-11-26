import { doc, writeBatch, serverTimestamp, getDocs, collection } from 'firebase/firestore'

export const DEFAULT_WALL_PANEL_BANNERS = [
  {
    id: 'banner-1',
    imageUrl:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=80',
    title: 'Luxury Wall Panels & Architectural Studio',
    subtitle: 'Architect-grade acoustic fluting, charcoal louvers & Italian marble acrylics.',
    ctaText: 'Book Consultation – ₹49',
    ctaLink: '/wall-panel/book',
    active: true,
    sortOrder: 1,
  },
  {
    id: 'banner-2',
    imageUrl:
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&auto=format&fit=crop&q=80',
    title: 'Transform Any Room in Under 48 Hours',
    subtitle: 'Precision laser measurement, doorstep material samples & 10-year warranty.',
    ctaText: 'Explore Collections',
    ctaLink: '#collections',
    active: true,
    sortOrder: 2,
  },
]

export const DEFAULT_WALL_PANEL_CATEGORIES = [
  {
    id: 'wooden-louvers',
    name: 'Wooden Louvers',
    title: 'Wooden Louvers',
    description: 'Solid fluted natural timber & engineered oak slats with acoustic backing.',
    image:
      'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800&auto=format&fit=crop&q=80',
    tags: ['Wooden', 'Louvers', 'Acoustic'],
    active: true,
    sortOrder: 1,
  },
  {
    id: 'marble-acrylic',
    name: 'Marble & High-Gloss Acrylic',
    title: 'Marble & High-Gloss Acrylic',
    description: 'Seamless UV marble sheets & ultra high-gloss acrylic panels with metallic trims.',
    image:
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&auto=format&fit=crop&q=80',
    tags: ['Marble', 'Acrylic', 'Luxury'],
    active: true,
    sortOrder: 2,
  },
  {
    id: 'charcoal-fluted',
    name: 'Charcoal & Fluted Panels',
    title: 'Charcoal & Fluted Panels',
    description: 'Deep noir charcoal fluted accents with moisture-resistant polymer cores.',
    image:
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&auto=format&fit=crop&q=80',
    tags: ['Charcoal', 'Fluted', 'Modern'],
    active: true,
    sortOrder: 3,
  },
  {
    id: 'acoustic-slats',
    name: 'Acoustic Slat Panels',
    title: 'Acoustic Slat Panels',
    description: 'Sound-dampening felt-backed wood slats engineered for studios and home theaters.',
    image:
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&fit=crop&q=80',
    tags: ['Acoustic', 'Studio', 'Soundproof'],
    active: true,
    sortOrder: 4,
  },
]

export const DEFAULT_WALL_PANEL_PRODUCTS = [
  {
    id: 'noir-radiance-panel',
    name: 'Noir Radiance Fluted Accent',
    title: 'Noir Radiance Fluted Accent',
    tagline: 'Matte charcoal polymer flutes with integrated warm cove lighting channel.',
    categoryId: 'charcoal-fluted',
    categoryName: 'Charcoal & Fluted Panels',
    price: 16999,
    dimensions: '9.5 × 6 ft wall',
    description:
      'The Noir Radiance Wall brings high-end boutique hotel aesthetics directly into your living room or master bedroom. Crafted from charcoal polymer slats that are 100% termite-proof and moisture-resistant.',
    tags: ['Charcoal', 'Fluted', 'Cove Lighting', 'Waterproof'],
    images: [
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
    ],
    components: [
      {
        id: 'comp-base',
        name: 'Base Wall Design',
        description: 'Standard high-density charcoal polymer panels with tongue-and-groove interlocking.',
        icon: 'layers',
        price: 16999,
        isDefault: true,
      },
      {
        id: 'comp-cove',
        name: 'Cove Light Channel',
        description: 'Hidden aluminum extrusion channel with 3000K warm diffused LED strip.',
        icon: 'lightbulb',
        price: 2499,
      },
      {
        id: 'comp-noir',
        name: 'Noir Radiance Edge Trims',
        description: 'Anodized matte black perimeter border edge profiles for clean corner transitions.',
        icon: 'shield',
        price: 1899,
      },
      {
        id: 'comp-sound',
        name: 'Acoustic Backing Underlay',
        description: '9mm recycled PET acoustic felt backing to eliminate room echo and reverb.',
        icon: 'sparkles',
        price: 2999,
      },
    ],
    similarProductIds: ['classic-teak-flutes', 'calacatta-gold-marble', 'nordic-oak-slat'],
    active: true,
    sortOrder: 1,
  },
  {
    id: 'classic-teak-flutes',
    name: 'Classic Teak Architectural Flutes',
    title: 'Classic Teak Architectural Flutes',
    tagline: 'Natural teak wood veneer slats on sound-dampening acoustic felt backing.',
    categoryId: 'wooden-louvers',
    categoryName: 'Wooden Louvers',
    price: 18499,
    dimensions: '10 × 6.5 ft wall',
    description:
      'Timeless warm teak wood slats create organic texture and elegance. Engineered for bedrooms, TV feature walls, and executive home offices.',
    tags: ['Wooden', 'Teak', 'Acoustic', 'Living Room'],
    images: [
      'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1200&auto=format&fit=crop&q=80',
    ],
    components: [
      {
        id: 'comp-base',
        name: 'Base Wall Design',
        description: 'Natural teak wood finish slat panels spanning full wall dimensions.',
        icon: 'layers',
        price: 18499,
        isDefault: true,
      },
      {
        id: 'comp-cove',
        name: 'Cove Light Channel',
        description: 'Indirect top & bottom LED warm glow strip.',
        icon: 'lightbulb',
        price: 2499,
      },
      {
        id: 'comp-trim',
        name: 'Brass Accent Inlays',
        description: 'Brushed gold metallic vertical divider strips between panel groups.',
        icon: 'palette',
        price: 2199,
      },
    ],
    similarProductIds: ['noir-radiance-panel', 'nordic-oak-slat', 'calacatta-gold-marble'],
    active: true,
    sortOrder: 2,
  },
  {
    id: 'calacatta-gold-marble',
    name: 'Calacatta Gold UV Marble Feature',
    title: 'Calacatta Gold UV Marble Feature',
    tagline: 'Seamless Italian Calacatta gold veined UV acrylic panels with champagne gold T-trims.',
    categoryId: 'marble-acrylic',
    categoryName: 'Marble & High-Gloss Acrylic',
    price: 22499,
    dimensions: '10 × 8 ft wall',
    description:
      'Breathtaking high-gloss marble aesthetics without the weight, fragility, or maintenance of real stone. Scratch-resistant, waterproof, and heat-resistant.',
    tags: ['Marble', 'High Gloss', 'Luxury', 'Living Room'],
    images: [
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&auto=format&fit=crop&q=80',
    ],
    components: [
      {
        id: 'comp-base',
        name: 'Base Wall Design',
        description: 'Full height seamless Calacatta Gold UV marble acrylic panels.',
        icon: 'layers',
        price: 22499,
        isDefault: true,
      },
      {
        id: 'comp-cove',
        name: 'Backlit Perimeter Channel',
        description: 'Indirect perimeter warm glow LED framing.',
        icon: 'lightbulb',
        price: 2899,
      },
      {
        id: 'comp-trim',
        name: 'Champagne Gold T-Profiles',
        description: 'Brushed champagne anodized aluminum T-trims.',
        icon: 'shield',
        price: 1999,
      },
    ],
    similarProductIds: ['noir-radiance-panel', 'classic-teak-flutes', 'nordic-oak-slat'],
    active: true,
    sortOrder: 3,
  },
  {
    id: 'nordic-oak-slat',
    name: 'Nordic Oak Acoustic Wall Slat',
    title: 'Nordic Oak Acoustic Wall Slat',
    tagline: 'Minimalist Scandinavian light oak slats mounted on black sound-absorbing felt.',
    categoryId: 'acoustic-slats',
    categoryName: 'Acoustic Slat Panels',
    price: 17499,
    dimensions: '9 × 6 ft wall',
    description:
      'Improves room acoustics while adding clean Scandinavian lines. Ideal for home cinemas, podcast studios, conference rooms, and stylish modern living areas.',
    tags: ['Scandinavian', 'Acoustic', 'Oak', 'Soundproof'],
    images: [
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&auto=format&fit=crop&q=80',
    ],
    components: [
      {
        id: 'comp-base',
        name: 'Base Wall Design',
        description: 'FSC-certified light oak veneer slats with 12mm acoustic felt backing.',
        icon: 'layers',
        price: 17499,
        isDefault: true,
      },
      {
        id: 'comp-cove',
        name: 'Integrated Linear Slat Lights',
        description: 'Slimline LED channels recessed directly between slats.',
        icon: 'lightbulb',
        price: 2799,
      },
    ],
    similarProductIds: ['noir-radiance-panel', 'classic-teak-flutes', 'calacatta-gold-marble'],
    active: true,
    sortOrder: 4,
  },
]

export const DEFAULT_WALL_PANEL_SECTIONS = [
  {
    id: 'sec-categories-slider',
    title: 'Explore by Design Style',
    showTitle: true,
    displayType: 'slider',
    contentType: 'categories',
    selectedItemIds: ['wooden-louvers', 'marble-acrylic', 'charcoal-fluted', 'acoustic-slats'],
    active: true,
    sortOrder: 1,
  },
  {
    id: 'sec-featured-products',
    title: 'Bestselling Wall Designs',
    showTitle: true,
    displayType: 'grid',
    contentType: 'products',
    selectedItemIds: [
      'noir-radiance-panel',
      'classic-teak-flutes',
      'calacatta-gold-marble',
      'nordic-oak-slat',
    ],
    active: true,
    sortOrder: 2,
  },
  {
    id: 'sec-custom-curated',
    title: 'Signature Architectural Looks',
    showTitle: true,
    displayType: 'slider',
    contentType: 'customCards',
    customCards: [
      {
        id: 'custom-1',
        title: 'The Penthouse Suite Look',
        serialNumber: '01',
        image:
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',
        productId: 'noir-radiance-panel',
        active: true,
        sortOrder: 1,
      },
      {
        id: 'custom-2',
        title: 'Warm Minimalist Villa Accent',
        serialNumber: '02',
        image:
          'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80',
        productId: 'classic-teak-flutes',
        active: true,
        sortOrder: 2,
      },
      {
        id: 'custom-3',
        title: 'Executive Italian Boardroom Look',
        serialNumber: '03',
        image:
          'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&auto=format&fit=crop&q=80',
        productId: 'calacatta-gold-marble',
        active: true,
        sortOrder: 3,
      },
    ],
    active: true,
    sortOrder: 3,
  },
  {
    id: 'sec-all-products-list',
    title: 'Trending Room Transformations',
    showTitle: true,
    displayType: 'list',
    contentType: 'products',
    selectedItemIds: ['noir-radiance-panel', 'calacatta-gold-marble', 'nordic-oak-slat'],
    active: true,
    sortOrder: 4,
  },
]

export async function seedWallPanelsData(db) {
  if (!db) throw new Error('Firestore instance not available')

  const batch = writeBatch(db)

  // 1. Categories
  for (const cat of DEFAULT_WALL_PANEL_CATEGORIES) {
    const ref = doc(db, 'wallPanelCategories', cat.id)
    batch.set(ref, {
      ...cat,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true })
  }

  // 2. Products
  for (const prod of DEFAULT_WALL_PANEL_PRODUCTS) {
    const ref = doc(db, 'wallPanelProducts', prod.id)
    batch.set(ref, {
      ...prod,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true })
  }

  // 3. Sections
  for (const sec of DEFAULT_WALL_PANEL_SECTIONS) {
    const ref = doc(db, 'wallPanelSections', sec.id)
    batch.set(ref, {
      ...sec,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true })
  }

  // 4. Banners
  for (const banner of DEFAULT_WALL_PANEL_BANNERS) {
    const ref = doc(db, 'wallPanelBanners', banner.id)
    batch.set(ref, {
      ...banner,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true })
  }

  await batch.commit()
}
