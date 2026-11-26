/**
 * Complete Gurgaon (Gurugram), Haryana Local SEO Dataset.
 * Encompasses all 9 service zones and 188 unique sectors/localities.
 * Tailored for high-intent searches: local, near me, and appliance + location combinations.
 */

export type GurgaonZone = {
  id: string;
  zoneNumber: number;
  name: string;
  slug: string;
  description: string;
  pincodes: string[];
  landmarks: string[];
};

export type GurgaonLocation = {
  id: string;
  name: string;
  slug: string;
  aliases?: string[];
  zoneId: string;
  secondaryZoneIds?: string[];
  pincode: string;
  responseTime: string;
  landmarks: string[];
  nearbySlugs: string[];
  highlight: string;
};

export type ApplianceService = {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  categorySlug: string;
  startingPrice: number;
  avgDuration: string;
  warranty: string;
  commonIssues: string[];
  subServices: string[];
  typesSupported: string[];
  faqTemplates: Array<{ q: string; a: string }>;
  image?: string;
  rating?: number;
  reviewCount?: string;
};

export const GURGAON_ZONES: GurgaonZone[] = [
  {
    id: "zone-1",
    zoneNumber: 1,
    name: "Palam Vihar & Nearby",
    slug: "palam-vihar-nearby",
    description: "North-West Gurgaon covering Palam Vihar, Bajghera, Dundahera, Ashok Vihar, and Sectors 4, 5, 7, 9, 10, 17, 18, 20, 21, 22, 23.",
    pincodes: ["122017", "122001"],
    landmarks: ["Palam Triangle", "Vyapar Kendra Palam Vihar", "Chiranjiv Bharati School", "Ansal Plaza", "Columbia Asia / Manipal Hospital", "Bajghera Flyover"],
  },
  {
    id: "zone-2",
    zoneNumber: 2,
    name: "Old Gurgaon",
    slug: "old-gurgaon",
    description: "Central and historic Gurgaon encompassing Sectors 1 to 19, Basai, Civil Lines, Railway Road, Jyoti Park, and Sector 37.",
    pincodes: ["122001"],
    landmarks: ["Sheetla Mata Mandir", "Gurgaon Railway Station", "Sadar Bazar Gurgaon", "Civil Hospital", "Kamla Nehru Park", "Mor Chowk"],
  },
  {
    id: "zone-3",
    zoneNumber: 3,
    name: "DLF, MG Road & Udyog Vihar",
    slug: "dlf-mg-road-udyog-vihar",
    description: "Prime commercial and residential hubs including DLF Phase 1 to 5, Cyber City, Udyog Vihar, MG Road, and Sectors 24 to 30.",
    pincodes: ["122002"],
    landmarks: ["DLF CyberHub", "Galleria Market", "MG Road Metro Station", "Sikanderpur Metro", "Ambience Mall", "DLF Club 5"],
  },
  {
    id: "zone-4",
    zoneNumber: 4,
    name: "Golf Course Road",
    slug: "golf-course-road",
    description: "Luxury corridor spanning Sectors 42, 43, 52, 53, 54, 55, 56, 57, Sushant Lok 1-3, and Sun City.",
    pincodes: ["122003", "122011"],
    landmarks: ["One Horizon Center", "South Point Mall", "Sector 54 Chowk Metro", "Sector 56 Rapid Metro", "Central Plaza", "Sushant Arcade"],
  },
  {
    id: "zone-5",
    zoneNumber: 5,
    name: "Golf Course Extension Road",
    slug: "golf-course-extension-road",
    description: "Modern high-rise residential belt including Sectors 58 through 75, AIPL Joy Street, M3M Urbana, and WorldMark Gurgaon.",
    pincodes: ["122011", "122101"],
    landmarks: ["AIPL Joy Street", "M3M Urbana", "WorldMark Gurgaon", "Emaar Palm Drive", "Grand Hyatt Gurgaon", "St. Xavier High School"],
  },
  {
    id: "zone-6",
    zoneNumber: 6,
    name: "Sohna Road & Subhash Chowk",
    slug: "sohna-road-subhash-chowk",
    description: "Established residential and corporate zone covering Sectors 33 to 51, Nirvana Country, Malibu Towne, South City 1 & 2, and Badshahpur.",
    pincodes: ["122018"],
    landmarks: ["Subhash Chowk", "Omaxe Celebration Mall", "Vatika City Market", "Nirvana Courtyard", "ILD Trade Centre", "Medanta The Medicity"],
  },
  {
    id: "zone-7",
    zoneNumber: 7,
    name: "New Gurgaon",
    slug: "new-gurgaon",
    description: "Rapidly expanding township comprising Sectors 76 to 95B, Sapphire 83, Vatika India Next, and Rampur Chowk.",
    pincodes: ["122004"],
    landmarks: ["Sapphire 83 Mall", "Vatika Town Square", "Khedki Daula Toll", "Rampur Chowk", "Miracles Apollo Cradle Hospital", "DLF New Town Heights"],
  },
  {
    id: "zone-8",
    zoneNumber: 8,
    name: "Dwarka Expressway",
    slug: "dwarka-expressway",
    description: "Northern expressway corridor covering Sectors 99 to 115, Sector 36A, 37D, and Sobha City.",
    pincodes: ["122006", "122505"],
    landmarks: ["Dwarka Expressway Toll Plaza", "Conscient One", "Signature Global Solera", "Indiabulls Enigma", "BPTP Amstoria", "Sobha City"],
  },
  {
    id: "zone-9",
    zoneNumber: 9,
    name: "Southern Peripheral Road (SPR)",
    slug: "spr-southern-peripheral-road",
    description: "Strategic arterial belt connecting Golf Course Ext Rd and NH-48 covering Sectors 62 to 79.",
    pincodes: ["122004", "122011"],
    landmarks: ["SPR Cloverleaf Flyover", "Tata Primanti", "DLF Alameda", "Vatika Crossover", "AIPL Peaceful Homes", "Elan Epic"],
  },
];

export const APPLIANCE_SERVICES: ApplianceService[] = [
  {
    id: "ac-repair",
    name: "AC Repair & Service",
    shortName: "AC",
    slug: "ac-repair",
    categorySlug: "ac",
    startingPrice: 199,
    avgDuration: "45–60 mins",
    warranty: "30-Day Service Guarantee + Up to 90 Days on Spare Parts",
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=80",
    rating: 4.82,
    reviewCount: "8.4K",
    commonIssues: [
      "AC not cooling or blowing hot air",
      "Water leakage from indoor unit",
      "Frequent tripping / PCB circuit failure",
      "Gas leakage & refrigerant recharge (R32 / R410A / R22)",
      "Unusual compressor noise, vibration or foul smell",
    ],
    subServices: [
      "Split AC Foam Jet Deep Cleaning",
      "Window AC Power Jet Service",
      "AC Gas Leak Detection & Refilling",
      "Compressor & Inverter PCB Repair",
      "AC Installation & Uninstallation",
    ],
    typesSupported: ["Split AC", "Window AC", "Inverter AC", "Cassette AC", "Tower AC"],
    faqTemplates: [
      {
        q: "How soon can an AC technician reach my home in {area}?",
        a: "Our verified local AC technicians in {area}, Gurgaon typically reach your doorstep within 45 to 60 minutes of booking confirmation.",
      },
      {
        q: "What is included in your AC repair service in {area}?",
        a: "Our service includes complete diagnosis, indoor & outdoor unit inspection, refrigerant gas pressure check, coil inspection, and electrical testing with upfront quotation before any repair work starts.",
      },
      {
        q: "What are your AC visiting and inspection charges in {area}?",
        a: "Our standard AC inspection charge in {area} is ₹199. When you proceed with the repair work, this visiting fee is adjusted in your final bill.",
      },
    ],
  },
  {
    id: "refrigerator-repair",
    name: "Refrigerator Repair & Service",
    shortName: "Refrigerator / Fridge",
    slug: "refrigerator-repair",
    categorySlug: "kitchen_appliances",
    startingPrice: 199,
    avgDuration: "45–60 mins",
    warranty: "30-Day Service Guarantee + Up to 90 Days on Spare Parts",
    image: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=500&auto=format&fit=crop&q=80",
    rating: 4.84,
    reviewCount: "6.2K",
    commonIssues: [
      "Fridge not cooling / freezer cooling but lower compartment warm",
      "Excess ice buildup / defrost timer failure",
      "Water leaking inside or underneath the refrigerator",
      "Constant humming or clicking sound from compressor",
      "Gas leakage, thermostat failure or inverter circuit fault",
    ],
    subServices: [
      "Single Door Fridge Repair",
      "Double Door Frost-Free Refrigerator Repair",
      "Side-by-Side & French Door Fridge Servicing",
      "Refrigerator Compressor Replacement & Gas Charging",
      "Thermostat, Relay, and Inverter PCB Board Repair",
    ],
    typesSupported: ["Single Door", "Double Door", "Side-by-Side", "Inverter Refrigerator", "Deep Freezer"],
    faqTemplates: [
      {
        q: "Do you fix double-door and inverter refrigerators in {area}?",
        a: "Yes. Our technicians in {area} are certified to repair all major brands including Samsung, LG, Whirlpool, Haier, Godrej, Bosch, and Panasonic with genuine OEM spare parts.",
      },
      {
        q: "Is same-day fridge repair available in {area}, Gurgaon?",
        a: "Yes! We offer same-day, doorstep refrigerator repairs across {area} and nearby sectors within 60 minutes of booking.",
      },
    ],
  },
  {
    id: "washing-machine-repair",
    name: "Washing Machine Repair & Service",
    shortName: "Washing Machine",
    slug: "washing-machine-repair",
    categorySlug: "washing_machine",
    startingPrice: 199,
    avgDuration: "45–75 mins",
    warranty: "30-Day Service Guarantee + Up to 90 Days on Spare Parts",
    image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=500&auto=format&fit=crop&q=80",
    rating: 4.81,
    reviewCount: "5.8K",
    commonIssues: [
      "Machine not spinning, draining water, or taking water",
      "Loud vibrating noise during spin cycle",
      "Error codes on digital display (IE, OE, dE, UE, E1, E2)",
      "Drum not rotating / broken drive belt or motor fault",
      "Water leaking from bottom or inlet pipe",
    ],
    subServices: [
      "Front Load Washing Machine Repair",
      "Top Load Fully Automatic Repair",
      "Semi-Automatic Washer & Dryer Servicing",
      "Inlet Valve, Drain Pump, and Belt Replacement",
      "Motherboard / PCB & Drum Bearing Replacement",
    ],
    typesSupported: ["Front Load Automatic", "Top Load Automatic", "Semi-Automatic", "Washer-Dryer Combo"],
    faqTemplates: [
      {
        q: "Which washing machine brands do you service in {area}?",
        a: "We service IFB, LG, Samsung, Whirlpool, Bosch, Godrej, Panasonic, and Siemens with genuine manufacturer-compatible components in {area}.",
      },
      {
        q: "Do you repair washing machine motherboards and motor issues in {area}?",
        a: "Yes, our certified technicians carry modern diagnostic tools to test and repair PCB boards, drive motors, inlet valves, drain pumps, and pressure sensors at your doorstep.",
      },
    ],
  },
  {
    id: "microwave-repair",
    name: "Microwave Oven Repair & Service",
    shortName: "Microwave",
    slug: "microwave-repair",
    categorySlug: "kitchen_appliances",
    startingPrice: 199,
    avgDuration: "30–60 mins",
    warranty: "30-Day Service Guarantee + Genuine Spare Parts",
    image: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=500&auto=format&fit=crop&q=80",
    rating: 4.79,
    reviewCount: "3.1K",
    commonIssues: [
      "Microwave running but not heating food",
      "Sparking or burning smell inside the cavity",
      "Turntable plate not rotating",
      "Touch keypad or display buttons not responding",
      "Door lock sensor or fuse blown",
    ],
    subServices: [
      "Magnetron & High Voltage Diode Replacement",
      "Turntable Motor & Roller Ring Replacement",
      "Touch Membrane & Control Panel Repair",
      "Transformer & Capacitor Testing and Repair",
      "Internal Deep Cavity Cleaning & De-greasing",
    ],
    typesSupported: ["Solo Microwave", "Grill Microwave", "Convection Microwave", "Built-in Microwave"],
    faqTemplates: [
      {
        q: "Can you fix a microwave that isn't heating in {area}?",
        a: "Yes. Non-heating is usually caused by a faulty magnetron, high-voltage diode, or capacitor. Our technicians in {area} carry genuine replacement parts to fix it on the spot.",
      },
    ],
  },
  {
    id: "chimney-repair",
    name: "Kitchen Chimney Cleaning & Repair",
    shortName: "Chimney",
    slug: "chimney-repair",
    categorySlug: "kitchen_appliances",
    startingPrice: 299,
    avgDuration: "60–90 mins",
    warranty: "30-Day Service Guarantee",
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&auto=format&fit=crop&q=80",
    rating: 4.89,
    reviewCount: "4.5K",
    commonIssues: [
      "Low suction power / oil dripping from filters",
      "Loud motor humming noise or vibration",
      "Push button or touch gesture controls not working",
      "Auto-clean heating element malfunction",
      "Exhaust duct pipe blockage or tearing",
    ],
    subServices: [
      "Deep Chemical De-greasing & Foam Wash",
      "Filterless & Baffle Filter Deep Cleaning",
      "Blower & Motor Replacement",
      "PCB Touch Control & Gesture Sensor Repair",
      "Flexible Aluminium Exhaust Duct Pipe Installation",
    ],
    typesSupported: ["Baffle Filter Chimney", "Filterless Chimney", "Auto-Clean Chimney", "Island Chimney", "Curved Glass Chimney"],
    faqTemplates: [
      {
        q: "How often should I get my kitchen chimney serviced in {area}?",
        a: "For Indian cooking with frequent oil and spices, we recommend a professional deep clean every 3 to 4 months to prevent motor overheating and oil fires.",
      },
    ],
  },
  {
    id: "ro-repair",
    name: "RO Water Purifier Repair & Service",
    shortName: "RO Water Purifier",
    slug: "ro-repair",
    categorySlug: "kitchen_appliances",
    startingPrice: 199,
    avgDuration: "30–60 mins",
    warranty: "30-Day Service Guarantee + Genuine Filter Cartridges",
    image: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=80",
    rating: 4.86,
    reviewCount: "7.9K",
    commonIssues: [
      "Slow water flow / tank not filling up",
      "Foul taste, bad odor, or high TDS in purified water",
      "Continuous water leakage from pipes or filter housing",
      "Booster pump not starting or vibrating loudly",
      "UV lamp failure / buzzer beeping continuously",
    ],
    subServices: [
      "RO Membrane & Sediment/Carbon Filter Replacement",
      "Pre-Filter Candle & Housing Servicing",
      "Booster Pump & SMPS Adapter Replacement",
      "TDS Adjustment & Mineral Cartridge Addition",
      "Complete RO Sanitization & Leakage Repair",
    ],
    typesSupported: ["RO + UV + UF Purifier", "Alkaline RO Purifier", "Under-the-Sink RO", "Commercial RO Plant"],
    faqTemplates: [
      {
        q: "What TDS level should I expect after RO servicing in {area}?",
        a: "Groundwater TDS in {area}, Gurgaon can range from 400 to 1800+ ppm. After our certified RO servicing and membrane tuning, we calibrate your output TDS to a healthy, sweet range of 80–120 ppm.",
      },
    ],
  },
  {
    id: "geyser-repair",
    name: "Geyser & Water Heater Repair",
    shortName: "Geyser",
    slug: "geyser-repair",
    categorySlug: "kitchen_appliances",
    startingPrice: 199,
    avgDuration: "40–60 mins",
    warranty: "30-Day Service Guarantee",
    image: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=500&auto=format&fit=crop&q=80",
    rating: 4.83,
    reviewCount: "3.7K",
    commonIssues: [
      "Water not heating or taking too long to heat",
      "Water leaking from tank or inlet/outlet valve",
      "Electric shock or MCB tripping when geyser is turned on",
      "Thermostat not cutting off automatically",
      "Excessive scale / hard water sediment buildup on heating coil",
    ],
    subServices: [
      "Heating Element / Coil Replacement",
      "Thermostat & Thermal Cut-Out Replacement",
      "Tank De-scaling & Anode Rod Replacement",
      "Geyser Installation & Re-installation",
      "Pressure Valve & Safety Valve Replacement",
    ],
    typesSupported: ["Instant Geyser", "Storage Electric Geyser", "Gas Geyser", "Solar Water Heater"],
    faqTemplates: [
      {
        q: "Why is my geyser tripping the electricity MCB in {area}?",
        a: "MCB tripping usually happens due to a damaged heating element coil leaking current into the hard water tank. Our {area} technician will safely test insulation and replace the faulty element.",
      },
    ],
  },
  {
    id: "tv-repair",
    name: "LED & Smart TV Repair",
    shortName: "TV / LED",
    slug: "tv-repair",
    categorySlug: "kitchen_appliances",
    startingPrice: 249,
    avgDuration: "60–90 mins",
    warranty: "30-Day Service Guarantee + Up to 90 Days on Parts",
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&auto=format&fit=crop&q=80",
    rating: 4.78,
    reviewCount: "2.8K",
    commonIssues: [
      "Sound working but no picture / black screen",
      "Horizontal or vertical colored lines on display",
      "TV not turning on / red standby light blinking",
      "HDMI, Wi-Fi or USB ports not responding",
      "Dim or flickering display / backlight LED bar failure",
    ],
    subServices: [
      "LED Backlight Strip Replacement",
      "Motherboard & Power Supply Board Repair",
      "T-Con Board & Ribbon Cable Replacement",
      "TV Wall Mount Installation & Uninstallation",
      "Audio Speaker & HDMI Port Repair",
    ],
    typesSupported: ["Smart TV", "Android TV", "4K UHD TV", "OLED & QLED TV", "Standard LED TV"],
    faqTemplates: [
      {
        q: "Can you fix LED TV backlights on-site in {area}?",
        a: "Yes. For most backlight, power supply, and sound issues, our technician performs doorstep testing and repair in {area}. For specialized bonding panel repairs, we arrange secure lab pickup and drop.",
      },
    ],
  },
  {
    id: "appliance-repair",
    name: "Home Appliance Repair & Maintenance",
    shortName: "All Appliances",
    slug: "appliance-repair",
    categorySlug: "services",
    startingPrice: 199,
    avgDuration: "45–90 mins",
    warranty: "30-Day Service Guarantee",
    image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=500&auto=format&fit=crop&q=80",
    rating: 4.91,
    reviewCount: "12.3K",
    commonIssues: [
      "Electrical appliance not powering on",
      "Strange noise, vibration, or burning smell",
      "Cooling, heating, or motor malfunction",
      "Water leakage, drainage, or filtration problems",
      "Routine preventative seasonal servicing",
    ],
    subServices: [
      "Multi-Appliance Home Inspection",
      "Seasonal Preventative Maintenance Package",
      "Electrical Circuit & Wiring Diagnostics",
      "Appliance Installation & Uninstallation",
      "Commercial & Residential Appliance AMC",
    ],
    typesSupported: ["All Domestic & Commercial Home Appliances"],
    faqTemplates: [
      {
        q: "Do you offer a single technician visit for multiple appliances in {area}?",
        a: "Yes! You can book a multi-appliance visit for your AC, washing machine, fridge, or microwave in {area}, saving time and visiting charges.",
      },
    ],
  },
];

// Raw zone definition data with sectors/localities as specified by user
const RAW_ZONES_CONFIG: Array<{
  zoneId: string;
  rawString: string;
  landmarks: string[];
}> = [
  {
    zoneId: "zone-1",
    rawString: "Palam Vihar, New Palam Vihar Phase 1, New Palam Vihar Phase 2, New Palam Vihar Phase 3, Palam Vihar Extension, Dharam Colony, Choma, Carterpuri, Bajghera, Sector 21, Sector 22, Sector 22A, Sector 23, Sector 23A, Sector 17, Sector 18, Sector 20, Dundahera, Ashok Vihar, Ashok Vihar Phase 1, Ashok Vihar Phase 2, Ashok Vihar Phase 3, Rajendra Park, Sector 5, Sector 4, Sector 7, Sector 9, Sector 10",
    landmarks: ["Palam Triangle", "Vyapar Kendra Palam Vihar", "Chiranjiv Bharati School", "Ansal Plaza", "Columbia Asia / Manipal Hospital", "Bajghera Flyover"],
  },
  {
    zoneId: "zone-2",
    rawString: "Sector 1, Sector 2, Sector 3, Sector 3A, Sector 4, Sector 5, Sector 6, Sector 7, Sector 8, Sector 9, Sector 9A, Sector 10, Sector 10A, Sector 11, Sector 12, Sector 13, Sector 14, Sector 15, Sector 16, Sector 17, Sector 19, Sector 37, Sector 37C, Sector 37D, Basai, Basai Enclave, Jyoti Park, Shivaji Nagar, Laxman Vihar, Bhim Nagar, New Railway Road, Civil Lines, Krishna Colony",
    landmarks: ["Sheetla Mata Mandir", "Gurgaon Railway Station", "Sadar Bazar", "Civil Hospital", "Kamla Nehru Park", "Mor Chowk"],
  },
  {
    zoneId: "zone-3",
    rawString: "DLF Phase 1, DLF Phase 2, DLF Phase 3, DLF Phase 4, DLF Phase 5, Sector 24, Sector 25, Sector 25A, Sector 26, Sector 26A, Sector 27, Sector 28, Sector 29, Sector 30, MG Road, Sikanderpur, DLF Cyber City, Udyog Vihar Phase 1, Udyog Vihar Phase 2, Udyog Vihar Phase 3, Udyog Vihar Phase 4, Udyog Vihar Phase 5, Nathupur, Chakkarpur, Galleria Market",
    landmarks: ["DLF CyberHub", "Galleria Market", "MG Road Metro", "Sikanderpur Metro", "Ambience Mall", "DLF Club 5"],
  },
  {
    zoneId: "zone-4",
    rawString: "Sector 42, Sector 43, Sector 52, Sector 53, Sector 54, Sector 55, Sector 56, Sector 57, Sushant Lok 1, Sushant Lok 2, Sushant Lok 3, Heritage City, Sun City, Wazirabad, Hamilton Court, Ridgewood Estate, Belvedere Park",
    landmarks: ["One Horizon Center", "South Point Mall", "Sector 54 Chowk Metro", "Sector 56 Rapid Metro", "Central Plaza", "Sushant Arcade"],
  },
  {
    zoneId: "zone-5",
    rawString: "Sector 58, Sector 59, Sector 60, Sector 61, Sector 62, Sector 63, Sector 63A, Sector 64, Sector 65, Sector 66, Sector 67, Sector 67A, Sector 68, Sector 69, Sector 70, Sector 70A, Sector 71, Sector 72, Sector 73, Sector 74, Sector 74A, Sector 75, Sector 75A",
    landmarks: ["AIPL Joy Street", "M3M Urbana", "WorldMark Gurgaon", "Emaar Palm Drive", "Grand Hyatt Gurgaon", "St. Xavier High School"],
  },
  {
    zoneId: "zone-6",
    rawString: "Sector 33, Sector 34, Sector 35, Sector 36, Sector 38, Sector 39, Sector 40, Sector 41, Sector 45, Sector 46, Sector 47, Sector 48, Sector 49, Sector 50, Sector 51, Badshahpur, Subhash Chowk, Nirvana Country, Malibu Towne, Rosewood City, Vatika City, South City 1, South City 2, Uppal Southend, Ardee City, Mayfield Garden, Orchid Petals",
    landmarks: ["Subhash Chowk", "Omaxe Celebration Mall", "Vatika City Market", "Nirvana Courtyard", "ILD Trade Centre", "Medanta The Medicity"],
  },
  {
    zoneId: "zone-7",
    rawString: "Sector 76, Sector 77, Sector 78, Sector 79, Sector 80, Sector 81, Sector 82, Sector 83, Sector 84, Sector 85, Sector 86, Sector 87, Sector 88, Sector 89, Sector 90, Sector 91, Sector 92, Sector 93, Sector 94, Sector 95, Sector 95A, Sector 95B",
    landmarks: ["Sapphire 83 Mall", "Vatika Town Square", "Khedki Daula Toll", "Rampur Chowk", "Miracles Apollo Cradle Hospital", "DLF New Town Heights"],
  },
  {
    zoneId: "zone-8",
    rawString: "Sector 99, Sector 100, Sector 101, Sector 102, Sector 102A, Sector 103, Sector 104, Sector 105, Sector 106, Sector 107, Sector 108, Sector 109, Sector 110, Sector 111, Sector 112, Sector 113, Sector 114, Sector 115, Sector 36A, Sector 37D",
    landmarks: ["Dwarka Expressway Toll Plaza", "Conscient One", "Signature Global Solera", "Indiabulls Enigma", "BPTP Amstoria", "Sobha City"],
  },
  {
    zoneId: "zone-9",
    rawString: "Sector 62, Sector 63, Sector 64, Sector 65, Sector 66, Sector 67, Sector 68, Sector 69, Sector 70, Sector 70A, Sector 71, Sector 72, Sector 73, Sector 74, Sector 75, Sector 76, Sector 77, Sector 78, Sector 79",
    landmarks: ["SPR Cloverleaf Flyover", "Tata Primanti", "DLF Alameda", "Vatika Crossover", "AIPL Peaceful Homes", "Elan Epic"],
  },
];

function generateLocationSlug(name: string): string {
  let s = name.toLowerCase().trim();
  s = s.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  // For standard sector names like "Sector 23", add -gurgaon to avoid collision and match user example
  if (/^sector-\d+[a-z]?$/.test(s)) {
    s = `${s}-gurgaon`;
  }
  return s;
}

function buildLocationsDataset(): GurgaonLocation[] {
  const map = new Map<string, GurgaonLocation>();
  const list: GurgaonLocation[] = [];

  RAW_ZONES_CONFIG.forEach((zConf) => {
    const zoneMeta = GURGAON_ZONES.find((z) => z.id === zConf.zoneId);
    const items = zConf.rawString.split(",").map((s) => s.trim()).filter(Boolean);

    items.forEach((item) => {
      const norm = item.toLowerCase();
      if (map.has(norm)) {
        const existing = map.get(norm)!;
        if (!existing.secondaryZoneIds) existing.secondaryZoneIds = [];
        if (!existing.secondaryZoneIds.includes(zConf.zoneId)) {
          existing.secondaryZoneIds.push(zConf.zoneId);
        }
      } else {
        const primarySlug = generateLocationSlug(item);
        const aliases: string[] = [];
        // Add bare sector alias (e.g. "sector-23" for "sector-23-gurgaon")
        if (primarySlug.endsWith("-gurgaon")) {
          aliases.push(primarySlug.replace(/-gurgaon$/, ""));
        }

        const loc: GurgaonLocation = {
          id: `loc_${primarySlug.replace(/-/g, "_")}`,
          name: item,
          slug: primarySlug,
          aliases,
          zoneId: zConf.zoneId,
          secondaryZoneIds: [],
          pincode: zoneMeta?.pincodes[0] || "122001",
          responseTime: "Within 45–60 minutes",
          landmarks: zConf.landmarks.slice(0, 3),
          nearbySlugs: [],
          highlight: `Trusted doorstep appliance repairs and servicing in ${item}, Gurgaon with certified technicians and upfront pricing.`,
        };

        map.set(norm, loc);
        list.push(loc);
      }
    });
  });

  // Cross-link neighbouring areas for rich internal linking
  list.forEach((loc, index) => {
    const sameZone = list.filter((l) => l.zoneId === loc.zoneId && l.slug !== loc.slug);
    const nearby = sameZone.slice(0, 5).map((l) => l.slug);
    if (nearby.length < 4) {
      const others = list.filter((l) => l.slug !== loc.slug && !nearby.includes(l.slug)).slice(0, 4);
      nearby.push(...others.map((l) => l.slug));
    }
    loc.nearbySlugs = nearby.slice(0, 5);
  });

  return list;
}

export const GURGAON_LOCATIONS: GurgaonLocation[] = buildLocationsDataset();

// Helper lookups
const locationBySlugMap = new Map<string, GurgaonLocation>();
GURGAON_LOCATIONS.forEach((loc) => {
  locationBySlugMap.set(loc.slug, loc);
  if (loc.aliases) {
    loc.aliases.forEach((alias) => locationBySlugMap.set(alias, loc));
  }
});

export function getLocationBySlug(slug: string): GurgaonLocation | null {
  if (!slug) return null;
  const clean = slug.toLowerCase().trim().replace(/^\/|\/$/g, "");
  return locationBySlugMap.get(clean) || null;
}

export function getZoneById(zoneId: string): GurgaonZone | null {
  return GURGAON_ZONES.find((z) => z.id === zoneId) || null;
}

export function getApplianceBySlug(slug: string): ApplianceService | null {
  if (!slug) return null;
  const clean = slug.toLowerCase().trim().replace(/^\/|\/$/g, "");
  return APPLIANCE_SERVICES.find((s) => s.slug === clean) || null;
}

export function getLocationsByZone(zoneId: string): GurgaonLocation[] {
  return GURGAON_LOCATIONS.filter(
    (l) => l.zoneId === zoneId || (l.secondaryZoneIds && l.secondaryZoneIds.includes(zoneId)),
  );
}

export function getNearbyLocations(loc: GurgaonLocation, limit = 6): GurgaonLocation[] {
  return loc.nearbySlugs
    .map((s) => locationBySlugMap.get(s))
    .filter((l): l is GurgaonLocation => Boolean(l))
    .slice(0, limit);
}

/** Generate standardized, high-intent local SEO meta tags */
export function generateLocalSeoMeta({
  location,
  appliance,
  path,
}: {
  location: GurgaonLocation;
  appliance?: ApplianceService | null;
  path: string;
}) {
  const area = location.name;
  const siteUrl = "https://www.repairseries.in";
  const canonicalUrl = `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;

  if (appliance) {
    const title = `${appliance.name} in ${area}, Gurgaon | Same-Day Doorstep Service`;
    const description = `Looking for ${appliance.shortName} repair in ${area}, Gurgaon? Repair Series offers certified technicians at your doorstep within 45-60 mins. Starting ₹${appliance.startingPrice}, genuine spare parts & 30-day warranty. Call now!`;
    return {
      title,
      description,
      canonicalUrl,
      h1: `${appliance.name} in ${area}, Gurgaon`,
      ogTitle: `${appliance.name} in ${area}, Gurgaon - Fast Doorstep Repair`,
      ogDescription: description,
    };
  }

  const title = `Home Appliance Repair in ${area}, Gurgaon | Doorstep Service | Repair Series`;
  const description = `Reliable home appliance repair in ${area}, Gurgaon. Same-day AC, washing machine, refrigerator, microwave, RO & geyser service by verified technicians. 30-day warranty & transparent pricing. Book now!`;
  return {
    title,
    description,
    canonicalUrl,
    h1: `Home Appliance Repair & Service in ${area}, Gurgaon`,
    ogTitle: `Home Appliance Repair in ${area}, Gurgaon - Repair Series`,
    ogDescription: description,
  };
}

/** Generate hyper-relevant, non-generic FAQs for a location */
export function generateLocationFaqs(
  location: GurgaonLocation,
  appliance?: ApplianceService | null,
): Array<{ q: string; a: string }> {
  const area = location.name;

  if (appliance) {
    return [
      {
        q: `How quickly can a ${appliance.shortName} technician reach my home in ${area}, Gurgaon?`,
        a: `Our verified technicians are stationed locally across ${area} and nearby sectors, usually reaching your doorstep within 45 to 60 minutes of booking confirmation.`,
      },
      {
        q: `What is the cost of ${appliance.shortName} inspection and repair in ${area}?`,
        a: `Our standard visiting and diagnosis charge is ₹${appliance.startingPrice}. If you proceed with the suggested repair work, the visiting charge is adjusted in the final bill. All spare parts and labor have transparent pricing.`,
      },
      {
        q: `Do you provide a warranty on ${appliance.shortName} repairs in ${area}?`,
        a: `Yes! Every repair in ${area} comes with a comprehensive 30-day service warranty and up to 90 days on specific replacement components.`,
      },
      {
        q: `Which ${appliance.shortName} brands do you repair in ${area}?`,
        a: `We service all leading brands in ${area} including Samsung, LG, Whirlpool, Daikin, Voltas, Hitachi, IFB, Bosch, Haier, Godrej, Panasonic, and Blue Star using genuine spare parts.`,
      },
      {
        q: `Can I schedule an appointment at my preferred time in ${area}?`,
        a: `Absolutely. You can select your preferred same-day or future time slot online or by phone between 8:00 AM and 9:00 PM, 7 days a week.`,
      },
    ];
  }

  return [
    {
      q: `Which home appliance repair services do you provide in ${area}, Gurgaon?`,
      a: `In ${area}, we offer complete doorstep repair and maintenance for Air Conditioners (AC), Refrigerators, Washing Machines, Microwave Ovens, Kitchen Chimneys, RO Water Purifiers, Geysers, and LED/Smart TVs.`,
    },
    {
      q: `How do I book a certified appliance technician in ${area}?`,
      a: `You can book instantly online on our website, call our direct helpline, or message our WhatsApp team. We dispatch the nearest background-verified technician to your address in ${area}.`,
    },
    {
      q: `What are your service visiting charges in ${area}, Gurgaon?`,
      a: `Our standard inspection and diagnosis fee is ₹199. When you approve the repair estimate, the visiting fee is waived or adjusted into your service bill.`,
    },
    {
      q: `Are your technicians verified and experienced in ${area}?`,
      a: `Yes. All Repair Series partners undergo mandatory government KYC verification (Aadhaar & PAN), background checks, and trade skill certifications before handling customer jobs.`,
    },
    {
      q: `What payment options are available after service in ${area}?`,
      a: `You only pay after the job is completed to your satisfaction. We accept UPI (Google Pay, PhonePe, Paytm), cash, and debit/credit cards.`,
    },
  ];
}
