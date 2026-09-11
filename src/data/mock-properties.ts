import { CityInfo, PropertyListing } from '@/types/marketplace'

export const POPULAR_CITIES: CityInfo[] = [
  {
    name: 'Bangalore',
    state: 'Karnataka',
    listingCount: 0,
    startingPrice: 7500,
    image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80',
    popularLocalities: ['Koramangala', 'HSR Layout', 'Indiranagar', 'Whitefield', 'Electronic City', 'Bellandur'],
  },
  {
    name: 'Gurgaon',
    state: 'Haryana',
    listingCount: 0,
    startingPrice: 8500,
    image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80',
    popularLocalities: ['Cyber City', 'DLF Phase 3', 'Sector 56', 'Golf Course Road', 'Sohna Road'],
  },
  {
    name: 'Noida',
    state: 'Uttar Pradesh',
    listingCount: 0,
    startingPrice: 6500,
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
    popularLocalities: ['Sector 62', 'Sector 15', 'Sector 18', 'Sector 137', 'Sector 76'],
  },
  {
    name: 'Delhi',
    state: 'NCR',
    listingCount: 0,
    startingPrice: 7000,
    image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80',
    popularLocalities: ['Hauz Khas', 'Saket', 'North Campus', 'Laxmi Nagar', 'Dwarka'],
  },
  {
    name: 'Pune',
    state: 'Maharashtra',
    listingCount: 0,
    startingPrice: 6000,
    image: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=600&q=80',
    popularLocalities: ['Hinjewadi', 'Viman Nagar', 'Kharadi', 'Baner', 'Wakad'],
  },
  {
    name: 'Hyderabad',
    state: 'Telangana',
    listingCount: 0,
    startingPrice: 7000,
    image: 'https://images.unsplash.com/photo-1605007493699-ce65834f8a00?auto=format&fit=crop&w=600&q=80',
    popularLocalities: ['Gachibowli', 'Madhapur', 'Hitec City', 'Kondapur', 'Kukatpally'],
  },
  {
    name: 'Mumbai',
    state: 'Maharashtra',
    listingCount: 0,
    startingPrice: 12000,
    image: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=600&q=80',
    popularLocalities: ['Andheri West', 'Powai', 'Bandra', 'Goregaon', 'Malad'],
  },
  {
    name: 'Chennai',
    state: 'Tamil Nadu',
    listingCount: 0,
    startingPrice: 6500,
    image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80',
    popularLocalities: ['OMR', 'Velachery', 'Thoraipakkam', 'Guindy', 'Adyar'],
  },
  {
    name: 'Ahmedabad',
    state: 'Gujarat',
    listingCount: 0,
    startingPrice: 5500,
    image: 'https://images.unsplash.com/photo-1609137144822-38605c317f22?auto=format&fit=crop&w=600&q=80',
    popularLocalities: ['SG Highway', 'Prahlad Nagar', 'Navrangpura', 'Bodakdev', 'Vastrapur'],
  },
  {
    name: 'Jaipur',
    state: 'Rajasthan',
    listingCount: 0,
    startingPrice: 5000,
    image: 'https://images.unsplash.com/photo-1603228254119-e6a4d095dc59?auto=format&fit=crop&w=600&q=80',
    popularLocalities: ['Malviya Nagar', 'Vaishali Nagar', 'Mansarovar', 'Tonk Road', 'Raja Park'],
  },
]

/**
 * Empty mock properties array.
 * Production property data is queried dynamically from Supabase database via /api/properties.
 */
export const MOCK_PROPERTIES: PropertyListing[] = []
