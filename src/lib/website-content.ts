// src/lib/website-content.ts
// Comprehensive TypeScript interfaces & default production configuration for the PGSetu Website CMS

export interface AnnouncementBarContent {
  enabled: boolean
  text: string
  badge: string
  linkText: string
  linkUrl: string
}

export interface HeroSearchContent {
  badge: string
  headline: string
  highlightText: string
  subtitle: string
  stats: Array<{
    value: string
    label: string
  }>
  quickChips: Array<{
    label: string
    filterKey: string
  }>
}

export interface TrustPillarCard {
  id: string
  title: string
  description: string
  badge: string
  icon: string
}

export interface TrustSectionContent {
  badge: string
  title: string
  subtitle: string
  cards: TrustPillarCard[]
}

export interface CityCardContent {
  id: string
  name: string
  state: string
  listingCount: number
  startingPrice: number
  image: string
  popularLocalities: string[]
  featured?: boolean
}

export interface PopularCitiesContent {
  badge: string
  title: string
  subtitle: string
  cities: CityCardContent[]
}

export interface ComparisonRowContent {
  id: string
  feature: string
  traditional: string
  pgSetu: string
}

export interface WhyChooseUsContent {
  badge: string
  title: string
  subtitle: string
  rows: ComparisonRowContent[]
  stats: Array<{
    value: string
    label: string
  }>
}

export interface OwnerCtaContent {
  badge: string
  title: string
  subtitle: string
  bulletPoints: string[]
  primaryBtnText: string
  primaryBtnLink: string
  secondaryBtnText: string
  secondaryBtnLink: string
}

export interface ErpModuleContent {
  id: string
  name: string
  badge: string
  headline: string
  description: string
  benefits: string[]
  previewMetrics: Array<{
    label: string
    val: string
  }>
}

export interface PricingTierContent {
  id: string
  name: string
  tagline: string
  badge?: string
  bedsLimit: string
  popular?: boolean
  monthlyPrice: number
  annualPrice: number
  features: string[]
}

export interface FaqItemContent {
  id: string
  question: string
  answer: string
  category?: string
}

export interface TestimonialContent {
  id: string
  name: string
  role: string
  pgName: string
  city: string
  beds: number
  quote: string
  rating: number
  avatar: string
}

export interface SoftwarePageContent {
  badge: string
  heroHeadline: string
  heroSubtitle: string
  primaryCtaText: string
  secondaryCtaText: string
  modules: ErpModuleContent[]
  pricingTiers: PricingTierContent[]
  faqs: FaqItemContent[]
  testimonials: TestimonialContent[]
}

export interface FooterContent {
  aboutText: string
  guaranteeText: string
  phone: string
  email: string
  address: string
  workingHours: string
  copyrightText: string
  socialLinks: {
    whatsapp?: string
    twitter?: string
    linkedin?: string
    instagram?: string
    youtube?: string
  }
}

export interface WebsiteContent {
  announcement: AnnouncementBarContent
  hero: HeroSearchContent
  trust: TrustSectionContent
  cities: PopularCitiesContent
  whyChooseUs: WhyChooseUsContent
  ownerCta: OwnerCtaContent
  softwarePage: SoftwarePageContent
  footer: FooterContent
  lastUpdated?: string
  updatedBy?: string
}

export const DEFAULT_WEBSITE_CONTENT: WebsiteContent = {
  announcement: {
    enabled: true,
    text: '🎉 Summer Coliving Offer: Zero Security Deposit Booking on Verified PGs this month!',
    badge: 'EXCLUSIVE',
    linkText: 'Explore PGs',
    linkUrl: '/#featured-properties',
  },
  hero: {
    badge: '#1 PropTech & PG Rental Network',
    headline: 'Find Your Ideal PG or Flat',
    highlightText: 'Without Brokerage Hassle',
    subtitle:
      'Discover verified PGs, rooms and flats with transparent digital rent passbooks, live electricity meter readings, and zero middleman commissions.',
    stats: [
      { value: '15,000+', label: 'Verified Beds' },
      { value: '99.8%', label: 'Move-in Trust' },
      { value: '₹0', label: 'Zero Brokerage' },
      { value: '24/7', label: 'Verified Hosts' },
    ],
    quickChips: [
      { label: 'Girls Only PG', filterKey: 'girls' },
      { label: 'Boys Only PG', filterKey: 'boys' },
      { label: 'Co-ed Spaces', filterKey: 'coed' },
      { label: '1 BHK Flat', filterKey: '1bhk' },
      { label: 'Zero Brokerage', filterKey: 'zero_brokerage' },
      { label: 'Food Included', filterKey: 'food' },
      { label: 'Near Metro Station', filterKey: 'metro' },
      { label: 'AC with Backup', filterKey: 'ac' },
      { label: 'Fully Furnished', filterKey: 'furnished' },
    ],
  },
  trust: {
    badge: 'The PGSetu Trust Standard',
    title: 'Renting Made Honest, Transparent & Safe',
    subtitle:
      'We eliminated the shady brokers, hidden electricity markups, and unreturned deposits that haunt traditional renting.',
    cards: [
      {
        id: 'trust-1',
        title: '100% Physically Verified',
        description:
          'Every space is personally inspected by our team. Live photos, geo-tagged coordinates, and verified security standards.',
        badge: 'Inspected Spaces',
        icon: 'ShieldCheck',
      },
      {
        id: 'trust-2',
        title: 'Zero Brokerage Direct Connect',
        description:
          'Deal directly with verified owners & hostel managers. No broker interference, no pushy middleman fees.',
        badge: 'Save ₹15,000+',
        icon: 'UserCheck2',
      },
      {
        id: 'trust-3',
        title: 'Digital Rent Passbook & Bills',
        description:
          'Live electricity sub-meter readings, transparent line-item charges, automated receipts, and an official ledger.',
        badge: 'Powered by PG-SETU',
        icon: 'ReceiptText',
      },
      {
        id: 'trust-4',
        title: '24/7 Rapid Tenant Resolution',
        description:
          'Our dedicated concierge team safeguards security deposits, move-in checklists, and speedy maintenance handling.',
        badge: 'Priority Support',
        icon: 'Headphones',
      },
    ],
  },
  cities: {
    badge: 'Top Rental Hubs',
    title: 'Explore Popular Cities',
    subtitle:
      'Find verified PGs, shared rooms, and independent flats across India’s major IT and educational centres.',
    cities: [
      {
        id: 'city-blr',
        name: 'Bangalore',
        state: 'Karnataka',
        listingCount: 2450,
        startingPrice: 7500,
        image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80',
        popularLocalities: ['Koramangala', 'HSR Layout', 'Indiranagar', 'Whitefield', 'Electronic City', 'Bellandur'],
        featured: true,
      },
      {
        id: 'city-ggn',
        name: 'Gurgaon',
        state: 'Haryana',
        listingCount: 1820,
        startingPrice: 8500,
        image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80',
        popularLocalities: ['Cyber City', 'DLF Phase 3', 'Sector 56', 'Golf Course Road', 'Sohna Road'],
        featured: true,
      },
      {
        id: 'city-noida',
        name: 'Noida',
        state: 'Uttar Pradesh',
        listingCount: 1430,
        startingPrice: 6500,
        image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
        popularLocalities: ['Sector 62', 'Sector 15', 'Sector 18', 'Sector 137', 'Sector 76'],
        featured: true,
      },
      {
        id: 'city-del',
        name: 'Delhi',
        state: 'NCR',
        listingCount: 2100,
        startingPrice: 7000,
        image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80',
        popularLocalities: ['Hauz Khas', 'Saket', 'North Campus', 'Laxmi Nagar', 'Dwarka'],
        featured: true,
      },
      {
        id: 'city-pune',
        name: 'Pune',
        state: 'Maharashtra',
        listingCount: 1680,
        startingPrice: 6000,
        image: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=600&q=80',
        popularLocalities: ['Hinjewadi', 'Viman Nagar', 'Kharadi', 'Baner', 'Wakad'],
        featured: true,
      },
      {
        id: 'city-hyd',
        name: 'Hyderabad',
        state: 'Telangana',
        listingCount: 1950,
        startingPrice: 7000,
        image: 'https://images.unsplash.com/photo-1605007493699-ce65834f8a00?auto=format&fit=crop&w=600&q=80',
        popularLocalities: ['Gachibowli', 'Madhapur', 'Hitec City', 'Kondapur', 'Kukatpally'],
        featured: true,
      },
      {
        id: 'city-mum',
        name: 'Mumbai',
        state: 'Maharashtra',
        listingCount: 2900,
        startingPrice: 12000,
        image: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=600&q=80',
        popularLocalities: ['Andheri West', 'Powai', 'Bandra', 'Goregaon', 'Malad'],
        featured: true,
      },
      {
        id: 'city-chn',
        name: 'Chennai',
        state: 'Tamil Nadu',
        listingCount: 1350,
        startingPrice: 6500,
        image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80',
        popularLocalities: ['OMR', 'Velachery', 'Anna Nagar', 'Guindy', 'Thoraipakkam'],
        featured: false,
      },
    ],
  },
  whyChooseUs: {
    badge: 'Why Choose PGSetu',
    title: 'How We Are Rebuilding Renter Trust',
    subtitle:
      'Traditional renting was built around brokers and middlemen. PGSetu is built around tenants and genuine property owners.',
    rows: [
      {
        id: 'row-1',
        feature: 'Brokerage & Commission',
        traditional: '1 to 2 months rent (₹15,000 – ₹40,000 lost)',
        pgSetu: '₹0 Zero Brokerage — Always direct to owner',
      },
      {
        id: 'row-2',
        feature: 'Photo & Amenity Verification',
        traditional: 'Misleading stock photos, surprise roommates',
        pgSetu: '100% In-person verified with actual room photos',
      },
      {
        id: 'row-3',
        feature: 'Electricity & Sub-metering',
        traditional: 'Arbitrary inflated unit rates (₹12 – ₹16/unit)',
        pgSetu: 'Govt. tariff sub-meter readings visible in App passbook',
      },
      {
        id: 'row-4',
        feature: 'Security Deposit Refund',
        traditional: 'Frequent non-refunds and phantom deductions',
        pgSetu: 'Digitized move-in checklist + dispute concierge',
      },
      {
        id: 'row-5',
        feature: 'Official Rent Receipts & HRA',
        traditional: 'Handwritten slips or no receipts for tax exemption',
        pgSetu: 'Automated 1-click tax receipts & HRA statements',
      },
    ],
    stats: [
      { value: '15,000+', label: 'Verified Beds & Flats' },
      { value: '42,000+', label: 'Happy Tenants Moved In' },
      { value: '₹0', label: 'Brokerage Paid By Renters' },
      { value: '4.9 / 5', label: 'Average Trust Rating' },
    ],
  },
  ownerCta: {
    badge: 'For PG Owners, Hostels & Flat Landlords',
    title: 'Fill Vacant Beds 3x Faster & Manage Tenants on Autopilot',
    subtitle:
      'List your property on PGSetu for free and reach 50,000+ monthly tech workers and students. Connect directly with tenants and power your property with our integrated PG-SETU management software.',
    bulletPoints: [
      '100% Free Listing — Zero Commissions',
      'Automated UPI Rent Collection & Reminders',
      'Instant Digital Tenant Passbooks & Receipts',
      'Govt Aadhaar KYC Screening Included',
    ],
    primaryBtnText: 'List Your Property Free',
    primaryBtnLink: '#list-modal',
    secondaryBtnText: 'Explore PG ERP Software',
    secondaryBtnLink: '/software',
  },
  softwarePage: {
    badge: 'Complete PropTech ERP Platform',
    heroHeadline: 'All-in-One PG ERP & Automated Property Management Software',
    heroSubtitle:
      'Eliminate spreadsheets, reconcile electricity sub-meters, collect rent directly via UPI with zero gateway fees, and give your tenants a live digital passbook.',
    primaryCtaText: 'Start Free 14-Day Trial',
    secondaryCtaText: 'Schedule Live Demo',
    modules: [
      {
        id: 'billing',
        name: '1-Click Monthly Billing',
        badge: 'Automated',
        headline: 'Generate 100+ Monthly Invoices in Under 30 Seconds',
        description:
          'Eliminate manual bill writing and calculator errors. PG-SETU automatically detects assigned beds, applies room rents, factors in electricity consumption, and creates official itemized tax invoices.',
        benefits: [
          'Automated invoice generation for all active residents simultaneously',
          'No duplicate billing: Smart checks skip residents with pre-existing bills',
          'Instant sync with each resident’s online passbook and digital ledger',
          'Detailed breakdown: Rent, maintenance, food charges, and amenities',
        ],
        previewMetrics: [
          { label: 'Time Saved', val: '95%' },
          { label: 'Calculation Accuracy', val: '100%' },
          { label: 'Invoices / Minute', val: '500+' },
        ],
      },
      {
        id: 'electricity',
        name: 'Electricity Sub-Meters',
        badge: 'Dispute Free',
        headline: 'Live Digital Meter Readings & Instant Resident Split',
        description:
          'The #1 cause of tenant disputes is unfair electricity charges. PG-SETU allows managers to enter meter readings per room and automatically splits units according to exact days occupied.',
        benefits: [
          'Room-level sub-meter tracking with live tariff calculations',
          'Automatic fair split between room residents based on occupancy duration',
          'Direct ledger debit: Residents see exact meter before & after units',
          'Historical reading logs with photos for 100% tenant verification',
        ],
        previewMetrics: [
          { label: 'Disputes Reduced', val: '98%' },
          { label: 'Units Reconciled', val: 'Live' },
          { label: 'Power Cost Recovered', val: '100%' },
        ],
      },
      {
        id: 'passbook',
        name: 'Tenant Digital Passbook',
        badge: 'Zero Apps Needed',
        headline: 'Live Online Passbook Accessible via WhatsApp Link',
        description:
          'Give residents complete visibility into their account. A secure, tokenized passbook link enables residents to check balances, view payment history, and download HRA tax receipts without installing apps.',
        benefits: [
          'One-click tokenized access without remembering usernames or passwords',
          'Real-time running ledger showing every debit, credit, and balance',
          'Instant PDF statement export for official HRA tax filing',
          'Live UPI payment QR code dynamically encoded with exact due balance',
        ],
        previewMetrics: [
          { label: 'Tenant Satisfaction', val: '4.9★' },
          { label: 'Query Calls', val: '-80%' },
          { label: 'HRA Compliance', val: '100%' },
        ],
      },
      {
        id: 'payments',
        name: 'UPI & Daily Closing',
        badge: 'Real-time',
        headline: 'Direct Bank UPI Collections & Cash Reconciliation',
        description:
          'Collect rent directly into your current account without 2% payment gateway cut. Generate dynamic UPI QR codes and reconcile cash collections with end-of-day daily closing audits.',
        benefits: [
          'Direct UPI QR: Google Pay, PhonePe, Paytm, CRED & BHIM compatible',
          'Automated professional payment receipts with WhatsApp dispatch',
          'Daily cash drawer closing report with supervisor sign-off',
          'Zero payment gateway fees: 100% of rent reaches your bank account',
        ],
        previewMetrics: [
          { label: 'Gateway Cut', val: '₹0 (0%)' },
          { label: 'Settlement Time', val: 'Instant' },
          { label: 'On-time Rent', val: '94%' },
        ],
      },
      {
        id: 'inventory',
        name: 'Rooms & Beds Matrix',
        badge: 'Visual ERP',
        headline: 'Real-Time Campus, Floor, Room & Bed Occupancy',
        description:
          'Visual map of your PG property. Instantly see which beds are occupied, which are vacant, and which are scheduled for cleaning or checkout.',
        benefits: [
          'Multi-building, multi-floor, and room-level hierarchy',
          'Occupancy states: Vacant, Occupied, Maintenance, Reserved',
          'Rapid tenant room transfer with automatic rent balance adjustment',
          '1-click resident check-in with bed allocation and deposit recording',
        ],
        previewMetrics: [
          { label: 'Vacant Bed Fill Rate', val: '3x Faster' },
          { label: 'Bed Inventory Sync', val: 'Real-time' },
          { label: 'Room Transfers', val: '1-Click' },
        ],
      },
      {
        id: 'kyc',
        name: 'Aadhaar KYC Screening',
        badge: 'Govt. Verified',
        headline: 'Instant Digital Aadhaar KYC & Police Verification Pack',
        description:
          'Safeguard your property and comply with local police tenant verification laws. Collect digital Aadhaar OTP verifications, verify identity photos, and generate downloadable police verification forms.',
        benefits: [
          'Govt. UIDAI-compliant OTP tenant verification',
          'Digital document vault: College ID, Office badge, and Permanent Address',
          'Pre-filled police tenant verification PDF ready for submission',
          'Tamper-proof tenant security audit log',
        ],
        previewMetrics: [
          { label: 'Verification Speed', val: '< 2 Mins' },
          { label: 'Police Compliance', val: '100%' },
          { label: 'Paperwork Eliminated', val: '100%' },
        ],
      },
      {
        id: 'whatsapp',
        name: 'WhatsApp Automation',
        badge: 'High Open Rate',
        headline: 'Automated Rent Due Alerts, Receipts & Food Menu Broadcasts',
        description:
          'WhatsApp has a 98% open rate compared to 15% on email. PG-SETU automates payment reminders with personal UPI pay links, payment confirmations, and daily meal menu broadcasts.',
        benefits: [
          'Gentle payment reminder sequences sent 3 days before due date',
          'Instant receipt delivery upon recording any cash or UPI payment',
          'Daily breakfast, lunch & dinner menu broadcast to all residents',
          'Gate curfew warnings and building maintenance notices',
        ],
        previewMetrics: [
          { label: 'Open Rate', val: '98%' },
          { label: 'Payment Velocity', val: '4x Faster' },
          { label: 'Admin Manual Calls', val: '-90%' },
        ],
      },
      {
        id: 'reports',
        name: 'Financial Reports',
        badge: 'Executive',
        headline: 'Automated P&L, Rent Roll, Expense Audit & CA Tax Export',
        description:
          'Know your exact monthly profit and cash position. Track food procurement costs, staff salaries, electricity bills, and generate 1-click reports for your chartered accountant.',
        benefits: [
          'Live Profit & Loss statement categorized by expense heads',
          'Real-time rent roll: Gross rent potential vs actual collections',
          'Track security deposits held in trust separately from operating cash',
          'Excel and CSV export pre-formatted for GST and Income Tax filing',
        ],
        previewMetrics: [
          { label: 'CA Audit Prep', val: '5 Mins' },
          { label: 'Leakage Detected', val: '₹45k/mo' },
          { label: 'Accuracy', val: '100%' },
        ],
      },
    ],
    pricingTiers: [
      {
        id: 'starter',
        name: 'Starter PG',
        tagline: 'Ideal for independent PG operators with up to 30 beds',
        bedsLimit: 'Up to 30 Beds',
        monthlyPrice: 999,
        annualPrice: 799,
        popular: false,
        features: [
          'Up to 30 Active Beds',
          '1-Click Monthly Invoicing',
          'Digital Tenant Passbook',
          'Direct Bank UPI Payments',
          'Electricity Sub-meter splits',
          'WhatsApp Payment Receipts',
          'Standard Email Support',
        ],
      },
      {
        id: 'growth',
        name: 'Growth Campus',
        tagline: 'For mid-size hostels and expanding coliving spaces',
        badge: 'MOST POPULAR',
        bedsLimit: 'Up to 120 Beds',
        monthlyPrice: 2499,
        annualPrice: 1999,
        popular: true,
        features: [
          'Up to 120 Active Beds',
          'Everything in Starter',
          'Multi-building & Floor matrix',
          'Digital Aadhaar KYC Screening',
          'Police Verification Form Generator',
          'Daily Cash Closing Audit',
          'Food Menu Broadcast Automation',
          'Priority WhatsApp Support',
        ],
      },
      {
        id: 'enterprise',
        name: 'Enterprise Chain',
        tagline: 'For coliving franchises, student housing & 100+ bed networks',
        bedsLimit: 'Unlimited Beds',
        monthlyPrice: 5999,
        annualPrice: 4799,
        popular: false,
        features: [
          'Unlimited Beds & Campuses',
          'Everything in Growth',
          'Super Admin Multi-property Portal',
          'Custom Roles & Staff Permissions',
          'Accounting & P&L Tax Export',
          'Dedicated Account Manager',
          'Custom Subdomain & White-labeling',
          '99.9% Uptime SLA Guarantee',
        ],
      },
    ],
    faqs: [
      {
        id: 'faq-1',
        question: 'Do my residents need to download an app to view their passbook or pay?',
        answer:
          'No! PG-SETU passbooks are designed to work seamlessly in any mobile browser. Residents receive a secure tokenized link on WhatsApp that opens instantly without downloading any app or remembering passwords.',
        category: 'Tenants',
      },
      {
        id: 'faq-2',
        question: 'How do UPI payments work? Does PG-SETU take a cut or commission?',
        answer:
          'PG-SETU charges 0% transaction fee. When residents pay via the UPI QR code on their invoice, 100% of the funds go directly into your existing bank account via standard UPI.',
        category: 'Payments',
      },
      {
        id: 'faq-3',
        question: 'How does electricity sub-meter calculation work for sharing rooms?',
        answer:
          'You simply enter the meter reading at the start and end of the billing cycle. The software calculates total units consumed, multiplies by your tariff, and automatically divides the cost among room occupants based on exact days stayed.',
        category: 'Electricity',
      },
      {
        id: 'faq-4',
        question: 'Can I import my existing resident and room data from Excel?',
        answer:
          'Yes, our onboarding team provides a standardized Excel template. You can upload all your rooms, beds, and current residents in one click, or our support team will do it for you for free during setup.',
        category: 'Setup',
      },
      {
        id: 'faq-5',
        question: 'Is my property and financial data secure?',
        answer:
          'All data is encrypted in transit and at rest with enterprise-grade PostgreSQL bank-grade encryption. Each PG organization operates with isolated database security policies.',
        category: 'Security',
      },
    ],
    testimonials: [
      {
        id: 't-1',
        name: 'Rajesh Sharma',
        role: 'Founder & Owner',
        pgName: 'Sri Sai Luxury Coliving (3 Campuses)',
        city: 'Bengaluru',
        beds: 180,
        quote:
          'Earlier, electricity calculation and month-end bill distribution took 4 full days every single month. With PG-SETU, I generate 180 invoices in under 30 seconds and send them on WhatsApp with direct UPI links. Outstanding dues dropped by 70%.',
        rating: 5,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      },
      {
        id: 't-2',
        name: 'Pooja Verma',
        role: 'Managing Director',
        pgName: 'Stanza Living Partner Hostel',
        city: 'Gurgaon',
        beds: 95,
        quote:
          'The Tenant Digital Passbook eliminated all disputes over deposits and unpaid balance. Tenants can check their exact rent breakdown, receipts, and electricity splits on their phone anytime.',
        rating: 5,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      },
      {
        id: 't-3',
        name: 'Sunil Reddy',
        role: 'Proprietor',
        pgName: 'Elite Executive Stays',
        city: 'Hyderabad',
        beds: 140,
        quote:
          'Zero payment gateway fees was the game changer. We were losing nearly ₹30,000 every month on credit card and gateway commissions. With PG-SETU direct UPI, 100% of the rent hits our bank account instantly.',
        rating: 5,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      },
    ],
  },
  footer: {
    aboutText:
      'India’s high-trust PG and rental property discovery platform. Connecting tenants directly with genuine property owners with zero brokerage, verified listings, and automated digital rent passbooks.',
    guaranteeText: 'Certified Safe & Zero Brokerage Guaranteed',
    phone: '+91 98765 43210',
    email: 'support@pgsetu.com',
    address: '100ft Road, Indiranagar, Bengaluru, Karnataka 560038',
    workingHours: 'Mon – Sat: 9:00 AM – 8:00 PM IST',
    copyrightText: '© 2026 PGSetu Technologies Pvt. Ltd. All rights reserved.',
    socialLinks: {
      whatsapp: 'https://wa.me/919876543210',
      twitter: 'https://twitter.com/pgsetu',
      linkedin: 'https://linkedin.com/company/pgsetu',
      instagram: 'https://instagram.com/pgsetu',
      youtube: 'https://youtube.com/@pgsetu',
    },
  },
}
