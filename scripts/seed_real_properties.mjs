import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ORG_ID = 'edd624d8-f3a0-4f92-b8b9-515c50ed8e98';

const REAL_PROPERTIES = [
  // 1. Bangalore - Koramangala
  {
    name: 'Zolo Stays Koramangala Luxury Coliving',
    address: 'Plot 42, 80 Feet Road, 4th Block, Koramangala',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560034',
    phone: '9453522757',
    email: 'vikramtomar0505@gmail.com',
    description: 'Ultra-modern co-living space with high-speed WiFi, hygienic daily meals, gym, housekeeping, and vibrant community lounge.',
    rentRupees: 8500,
    sharing: 'Double Sharing',
    propertyType: 'pg',
    gender: 'coed',
    locality: 'Koramangala 4th Block',
    metro: '400m from Sony World Signal / Metro',
    landmark: 'Opposite Forum Mall',
    lat: 12.9352,
    lng: 77.6245,
    rating: 4.8,
    reviews: 64,
    images: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=80',
    ],
  },
  // 2. Bangalore - HSR Layout
  {
    name: 'Stanza Living HSR Layout Tech Hub',
    address: '14th Main, Sector 2, HSR Layout',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560102',
    phone: '9453522757',
    email: 'vikramtomar0505@gmail.com',
    description: 'Designed for tech professionals and founders with dedicated work desks, ergonomic chairs, and 24/7 power backup.',
    rentRupees: 7500,
    sharing: 'Double Sharing',
    propertyType: 'pg',
    gender: 'coed',
    locality: 'HSR Layout Sector 2',
    metro: '800m from Silk Board Junction Metro',
    landmark: 'Near BDA Complex HSR',
    lat: 12.9121,
    lng: 77.6446,
    rating: 4.7,
    reviews: 42,
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80',
    ],
  },
  // 3. Gurgaon - DLF Cyber City
  {
    name: 'Cyber Hub Executive Co-Living',
    address: 'DLF Phase 3, Sector 24, Near Cyber City',
    city: 'Gurgaon',
    state: 'Haryana',
    pincode: '122002',
    phone: '9453522757',
    email: 'vikramtomar0505@gmail.com',
    description: 'Premium air-conditioned suites located minutes away from Cyber Hub and DLF corporate towers.',
    rentRupees: 9500,
    sharing: 'Single Room',
    propertyType: 'pg',
    gender: 'coed',
    locality: 'DLF Phase 3',
    metro: '300m from DLF Phase 3 Rapid Metro',
    landmark: 'Near Cyber City Gate 2',
    lat: 28.4909,
    lng: 77.0878,
    rating: 4.9,
    reviews: 88,
    images: [
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1000&q=80',
    ],
  },
  // 4. Gurgaon - Sector 56
  {
    name: 'Golf Course Road Premium Living',
    address: 'Sector 56, Near Sector 55-56 Metro Station',
    city: 'Gurgaon',
    state: 'Haryana',
    pincode: '122011',
    phone: '9453522757',
    email: 'vikramtomar0505@gmail.com',
    description: 'Peaceful green residential locality with high-end amenities, daily chef-prepared meals, and attached balconies.',
    rentRupees: 8200,
    sharing: 'Double Sharing',
    propertyType: 'pg',
    gender: 'coed',
    locality: 'Sector 56',
    metro: '400m from Sector 56 Metro Station',
    landmark: 'Near Huda Market Sector 56',
    lat: 28.4289,
    lng: 77.1068,
    rating: 4.6,
    reviews: 35,
    images: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80',
    ],
  },
  // 5. Noida - Sector 62
  {
    name: 'Settlers Haven Sector 62 IT Park',
    address: 'C-Block, Sector 62, Institutional Area',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201309',
    phone: '9453522757',
    email: 'vikramtomar0505@gmail.com',
    description: 'Ideal stay for techies working in Sector 62 and Sector 63 IT parks with free shuttle and high-speed Wi-Fi.',
    rentRupees: 6800,
    sharing: 'Double Sharing',
    propertyType: 'pg',
    gender: 'coed',
    locality: 'Sector 62',
    metro: '500m from Noida Electronic City Metro',
    landmark: 'Near Stellar IT Park',
    lat: 28.6280,
    lng: 77.3649,
    rating: 4.7,
    reviews: 51,
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80',
    ],
  },
  // 6. Delhi - Saket
  {
    name: 'Olive Co-Living Saket Central',
    address: 'J-Block, Saket, South Delhi',
    city: 'Delhi',
    state: 'Delhi NCR',
    pincode: '110017',
    phone: '9453522757',
    email: 'vikramtomar0505@gmail.com',
    description: 'Prime South Delhi location next to Select Citywalk Mall and Yellow Line Metro with 24x7 security.',
    rentRupees: 7800,
    sharing: 'Double Sharing',
    propertyType: 'pg',
    gender: 'coed',
    locality: 'Saket',
    metro: '350m from Saket Metro Station',
    landmark: 'Behind Select Citywalk Mall',
    lat: 28.5244,
    lng: 77.2167,
    rating: 4.8,
    reviews: 73,
    images: [
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=80',
    ],
  },
  // 7. Pune - Hinjewadi
  {
    name: 'Housr Hinjewadi Phase 1 Tech Campus',
    address: 'Near Blue Ridge Township, Hinjewadi Phase 1',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411057',
    phone: '9453522757',
    email: 'vikramtomar0505@gmail.com',
    description: 'Comfortable living with gaming zone, gym, study pods, and home-cooked meals for IT professionals.',
    rentRupees: 6500,
    sharing: 'Double Sharing',
    propertyType: 'pg',
    gender: 'coed',
    locality: 'Hinjewadi Phase 1',
    metro: '200m from Upcoming Hinjewadi Metro',
    landmark: 'Near Infosys Gate 1',
    lat: 18.5913,
    lng: 73.7389,
    rating: 4.6,
    reviews: 38,
    images: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80',
    ],
  },
  // 8. Hyderabad - Gachibowli
  {
    name: 'Boston Living Gachibowli Financial District',
    address: 'Near Wipro Circle, Gachibowli',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500032',
    phone: '9453522757',
    email: 'vikramtomar0505@gmail.com',
    description: 'State-of-the-art coliving habitat with infinity lounge, rooftop cafeteria, gym, and 350 Mbps fiber.',
    rentRupees: 7200,
    sharing: 'Double Sharing',
    propertyType: 'pg',
    gender: 'coed',
    locality: 'Gachibowli',
    metro: '1.2km from Raidurg Metro Station',
    landmark: 'Near Wipro Circle & DLF Cybercity',
    lat: 17.4401,
    lng: 78.3489,
    rating: 4.9,
    reviews: 67,
    images: [
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=80',
    ],
  },
  // 9. Mumbai - Powai
  {
    name: 'Zolo Powai Elite Lakeside Coliving',
    address: 'Central Avenue, Hiranandani Gardens, Powai',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400076',
    phone: '9453522757',
    email: 'vikramtomar0505@gmail.com',
    description: 'Scenic lakeside luxury living located in the heart of Hiranandani Powai with European architecture and top security.',
    rentRupees: 11500,
    sharing: 'Double Sharing',
    propertyType: 'pg',
    gender: 'coed',
    locality: 'Powai Hiranandani',
    metro: '600m from IIT Bombay / Kanjurmarg',
    landmark: 'Near Galleria Mall Hiranandani',
    lat: 19.1176,
    lng: 72.9060,
    rating: 4.8,
    reviews: 58,
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80',
    ],
  },
];

async function seed() {
  console.log('Seeding real properties into Supabase...');

  // Check if properties already exist
  const { data: existing } = await supabase.from('properties').select('id, name');
  if (existing && existing.length > 0) {
    console.log(`Found ${existing.length} existing properties. Skipping duplicate insertion.`);
    return;
  }

  for (const item of REAL_PROPERTIES) {
    const settings = {
      tagline: item.description.slice(0, 70),
      property_type: item.propertyType,
      gender_preference: item.gender,
      locality: item.locality,
      distance_to_metro: item.metro,
      nearest_landmark: item.landmark,
      coordinates: { lat: item.lat, lng: item.lng },
      images: item.images,
      rating: item.rating,
      review_count: item.reviews,
      super_host: true,
      is_featured: true,
      food_included: true,
      food_details: '3 Times Nutritious Meals Included (North & South Indian)',
      furnishing: 'fully_furnished',
      maintenance_charges: 0,
      lock_in_period: '1 Month',
      notice_period: '30 Days',
      electricity_policy: 'Direct digital sub-meter reading @ ₹9/unit',
      amenities: [
        'High-Speed Wi-Fi (300 Mbps)',
        'Attached Washroom',
        'Daily Housekeeping',
        '24x7 Power Backup',
        'Biometric Smart Entry',
        'RO Purified Water',
        'CCTV Surveillance',
        'Washing Machine & Laundry'
      ],
      rules: [
        'Gate closes at 11:00 PM for safety',
        'No loud music in rooms after 10:00 PM',
        'Visitors welcomed in ground floor lounge area'
      ]
    };

    // 1. Insert property
    const { data: prop, error: propErr } = await supabase
      .from('properties')
      .insert({
        organization_id: ORG_ID,
        name: item.name,
        address: item.address,
        city: item.city,
        state: item.state,
        pincode: item.pincode,
        phone: item.phone,
        email: item.email,
        description: item.description,
        is_active: true,
        settings,
      })
      .select()
      .single();

    if (propErr || !prop) {
      console.error(`Failed to insert property ${item.name}:`, propErr);
      continue;
    }

    console.log(`Created property: ${prop.name} (${prop.id}) in ${prop.city}`);

    // 2. Insert Building
    const { data: bldg } = await supabase
      .from('buildings')
      .insert({
        organization_id: ORG_ID,
        property_id: prop.id,
        name: 'Main Block',
        total_floors: 2,
        is_active: true,
      })
      .select()
      .single();

    if (!bldg) continue;

    // 3. Insert Floors
    for (let f = 0; f < 2; f++) {
      const floorName = f === 0 ? 'Ground Floor' : '1st Floor';
      const { data: floor } = await supabase
        .from('floors')
        .insert({
          organization_id: ORG_ID,
          building_id: bldg.id,
          floor_number: f,
          name: floorName,
        })
        .select()
        .single();

      if (!floor) continue;

      // 4. Insert 3 rooms per floor
      for (let r = 1; r <= 3; r++) {
        const roomNo = `${f}${String(r).padStart(2, '0')}`;
        const capacity = item.sharing === 'Single Room' ? 1 : 2;
        const rentPaise = item.rentRupees * 100;

        const { data: room } = await supabase
          .from('rooms')
          .insert({
            organization_id: ORG_ID,
            floor_id: floor.id,
            room_number: roomNo,
            room_type: capacity === 1 ? 'single' : 'double',
            capacity,
            base_rent_paise: rentPaise,
            is_active: true,
          })
          .select()
          .single();

        if (!room) continue;

        // 5. Insert beds
        const labels = ['A', 'B'];
        for (let b = 0; b < capacity; b++) {
          await supabase.from('beds').insert({
            organization_id: ORG_ID,
            room_id: room.id,
            bed_number: `${roomNo}-${labels[b]}`,
            status: 'available',
            base_rent_paise: rentPaise,
            is_active: true,
          });
        }
      }
    }
  }

  console.log('Seeding completed successfully!');
}

seed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
