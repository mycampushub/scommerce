/**
 * Countries Data Configuration
 * Used for Country of Origin selection in Products and Inventory
 */

export interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode?: string;
  region?: string;
}

export const COUNTRIES: Country[] = [
  // Asia - South Asia
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', dialCode: '+880', region: 'South Asia' },
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91', region: 'South Asia' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', dialCode: '+92', region: 'South Asia' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', dialCode: '+94', region: 'South Asia' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵', dialCode: '+977', region: 'South Asia' },
  { code: 'BT', name: 'Bhutan', flag: '🇧🇹', dialCode: '+975', region: 'South Asia' },
  { code: 'MV', name: 'Maldives', flag: '🇲🇻', dialCode: '+960', region: 'South Asia' },

  // Asia - East Asia
  { code: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86', region: 'East Asia' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81', region: 'East Asia' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', dialCode: '+82', region: 'East Asia' },
  { code: 'KP', name: 'North Korea', flag: '🇰🇵', dialCode: '+850', region: 'East Asia' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼', dialCode: '+886', region: 'East Asia' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', dialCode: '+852', region: 'East Asia' },
  { code: 'MO', name: 'Macau', flag: '🇲🇴', dialCode: '+853', region: 'East Asia' },

  // Asia - Southeast Asia
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', dialCode: '+66', region: 'Southeast Asia' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', dialCode: '+84', region: 'Southeast Asia' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', dialCode: '+60', region: 'Southeast Asia' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65', region: 'Southeast Asia' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', dialCode: '+62', region: 'Southeast Asia' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', dialCode: '+63', region: 'Southeast Asia' },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲', dialCode: '+95', region: 'Southeast Asia' },
  { code: 'KH', name: 'Cambodia', flag: '🇰🇭', dialCode: '+855', region: 'Southeast Asia' },
  { code: 'LA', name: 'Laos', flag: '🇱🇦', dialCode: '+856', region: 'Southeast Asia' },
  { code: 'BN', name: 'Brunei', flag: '🇧🇳', dialCode: '+673', region: 'Southeast Asia' },

  // Asia - Middle East
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', dialCode: '+971', region: 'Middle East' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dialCode: '+966', region: 'Middle East' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', dialCode: '+974', region: 'Middle East' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼', dialCode: '+965', region: 'Middle East' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭', dialCode: '+973', region: 'Middle East' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲', dialCode: '+968', region: 'Middle East' },
  { code: 'IR', name: 'Iran', flag: '🇮🇷', dialCode: '+98', region: 'Middle East' },
  { code: 'IQ', name: 'Iraq', flag: '🇮🇶', dialCode: '+964', region: 'Middle East' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', dialCode: '+90', region: 'Middle East' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱', dialCode: '+972', region: 'Middle East' },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴', dialCode: '+962', region: 'Middle East' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧', dialCode: '+961', region: 'Middle East' },

  // Asia - Central Asia
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿', dialCode: '+7', region: 'Central Asia' },
  { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿', dialCode: '+998', region: 'Central Asia' },
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫', dialCode: '+93', region: 'Central Asia' },

  // Europe
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44', region: 'Europe' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49', region: 'Europe' },
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33', region: 'Europe' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', dialCode: '+39', region: 'Europe' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', dialCode: '+34', region: 'Europe' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', dialCode: '+31', region: 'Europe' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', dialCode: '+32', region: 'Europe' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', dialCode: '+41', region: 'Europe' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', dialCode: '+43', region: 'Europe' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', dialCode: '+46', region: 'Europe' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', dialCode: '+47', region: 'Europe' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', dialCode: '+45', region: 'Europe' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', dialCode: '+358', region: 'Europe' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', dialCode: '+48', region: 'Europe' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', dialCode: '+420', region: 'Europe' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', dialCode: '+30', region: 'Europe' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', dialCode: '+351', region: 'Europe' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', dialCode: '+36', region: 'Europe' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', dialCode: '+353', region: 'Europe' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴', dialCode: '+40', region: 'Europe' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦', dialCode: '+380', region: 'Europe' },

  // Americas - North America
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1', region: 'North America' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1', region: 'North America' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', dialCode: '+52', region: 'North America' },

  // Americas - Central America
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹', dialCode: '+502', region: 'Central America' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳', dialCode: '+504', region: 'Central America' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻', dialCode: '+503', region: 'Central America' },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮', dialCode: '+505', region: 'Central America' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷', dialCode: '+506', region: 'Central America' },
  { code: 'PA', name: 'Panama', flag: '🇵🇦', dialCode: '+507', region: 'Central America' },

  // Americas - South America
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', dialCode: '+55', region: 'South America' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', dialCode: '+54', region: 'South America' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', dialCode: '+56', region: 'South America' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', dialCode: '+57', region: 'South America' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪', dialCode: '+51', region: 'South America' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪', dialCode: '+58', region: 'South America' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨', dialCode: '+593', region: 'South America' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴', dialCode: '+591', region: 'South America' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾', dialCode: '+598', region: 'South America' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾', dialCode: '+595', region: 'South America' },

  // Africa
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', dialCode: '+20', region: 'Africa' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27', region: 'Africa' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234', region: 'Africa' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', dialCode: '+254', region: 'Africa' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', dialCode: '+233', region: 'Africa' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦', dialCode: '+212', region: 'Africa' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', dialCode: '+255', region: 'Africa' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', dialCode: '+251', region: 'Africa' },

  // Oceania
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61', region: 'Oceania' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', dialCode: '+64', region: 'Oceania' },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯', dialCode: '+679', region: 'Oceania' },
  { code: 'PG', name: 'Papua New Guinea', flag: '🇵🇬', dialCode: '+675', region: 'Oceania' },
];

// Most common countries for Bangladesh market (top of the list)
export const COMMON_COUNTRIES: Country[] = [
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', dialCode: '+880' },
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91' },
  { code: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86' },
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', dialCode: '+971' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dialCode: '+966' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', dialCode: '+66' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', dialCode: '+60' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', dialCode: '+62' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', dialCode: '+92' },
];

// Get country by code
export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find((country) => country.code === code);
}

// Get countries by region
export function getCountriesByRegion(region: string): Country[] {
  return COUNTRIES.filter((country) => country.region === region);
}

// Search countries
export function searchCountries(query: string): Country[] {
  const lowerQuery = query.toLowerCase();
  return COUNTRIES.filter(
    (country) =>
      country.name.toLowerCase().includes(lowerQuery) ||
      country.code.toLowerCase().includes(lowerQuery)
  );
}

// Get all countries grouped by region
export function getCountriesGroupedByRegion(): Record<string, Country[]> {
  const grouped: Record<string, Country[]> = {};

  for (const country of COUNTRIES) {
    const region = country.region || 'Other';
    if (!grouped[region]) {
      grouped[region] = [];
    }
    grouped[region].push(country);
  }

  return grouped;
}
