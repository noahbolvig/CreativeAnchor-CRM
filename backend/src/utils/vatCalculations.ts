// Utility functions for EU VAT calculations

export interface InvoiceItemWithVAT {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  amount: number; // excluding VAT
}

export interface InvoiceCalculation {
  subtotal: number;    // Total before VAT
  vatAmount: number;   // Total VAT
  total: number;       // Total including VAT
  reverseCharge: boolean;
}

// Calculate invoice totals with VAT
export function calculateInvoiceTotals(
  items: InvoiceItemWithVAT[],
  reverseCharge: boolean = false
): InvoiceCalculation {
  // Calculate subtotal (before VAT)
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  
  // Calculate VAT (0 if reverse charge)
  let vatAmount = 0;
  if (!reverseCharge) {
    vatAmount = items.reduce((sum, item) => {
      const itemVAT = item.amount * (item.vatRate / 100);
      return sum + itemVAT;
    }, 0);
  }
  
  // Total = subtotal + VAT
  const total = subtotal + vatAmount;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    reverseCharge,
  };
}

// Determine if reverse charge applies
export function shouldApplyReverseCharge(
  yourCountry: string,
  clientCountry: string,
  clientHasVAT: boolean
): boolean {
  // Reverse charge applies for B2B transactions between different EU countries
  const euCountries = [
    'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic',
    'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece',
    'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg',
    'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia',
    'Slovenia', 'Spain', 'Sweden'
  ];
  
  const yourInEU = euCountries.includes(yourCountry);
  const clientInEU = euCountries.includes(clientCountry);
  const differentCountries = yourCountry !== clientCountry;
  
  // Reverse charge if:
  // - Both in EU
  // - Different countries
  // - Client has VAT number (B2B)
  return yourInEU && clientInEU && differentCountries && clientHasVAT;
}

// Get standard VAT rate for EU country
export function getStandardVATRate(country: string): number {
  const vatRates: Record<string, number> = {
    'Austria': 20,
    'Belgium': 21,
    'Bulgaria': 20,
    'Croatia': 25,
    'Cyprus': 19,
    'Czech Republic': 21,
    'Denmark': 25,
    'Estonia': 22,
    'Finland': 25.5,
    'France': 20,
    'Germany': 19,
    'Greece': 24,
    'Hungary': 27,
    'Ireland': 23,
    'Italy': 22,
    'Latvia': 21,
    'Lithuania': 21,
    'Luxembourg': 17,
    'Malta': 18,
    'Netherlands': 21,
    'Poland': 23,
    'Portugal': 23,
    'Romania': 19,
    'Slovakia': 20,
    'Slovenia': 22,
    'Spain': 21,
    'Sweden': 25,
  };
  
  return vatRates[country] || 21; // Default to 21%
}

// Validate EU VAT number format (basic check)
export function validateVATNumber(vatNumber: string, country: string): boolean {
  if (!vatNumber) return false;
  
  // Remove spaces and convert to uppercase
  const cleaned = vatNumber.replace(/\s/g, '').toUpperCase();
  
  // Basic format check (country code + numbers)
  const patterns: Record<string, RegExp> = {
    'Netherlands': /^NL\d{9}B\d{2}$/,
    'Germany': /^DE\d{9}$/,
    'France': /^FR[A-Z0-9]{2}\d{9}$/,
    'Belgium': /^BE0?\d{9}$/,
    'Spain': /^ES[A-Z0-9]\d{7}[A-Z0-9]$/,
    'Italy': /^IT\d{11}$/,
    // Add more as needed
  };
  
  const pattern = patterns[country];
  if (!pattern) return cleaned.length > 0; // Basic check if no pattern
  
  return pattern.test(cleaned);
}

// Format VAT number for display
export function formatVATNumber(vatNumber: string): string {
  if (!vatNumber) return '';
  
  const cleaned = vatNumber.replace(/\s/g, '').toUpperCase();
  
  // Add spaces for readability
  // Example: NL123456789B01 -> NL 1234.5678.9B.01
  if (cleaned.startsWith('NL')) {
    return cleaned.replace(/^(NL)(\d{4})(\d{4})(\d{1})([B])(\d{2})$/, '$1 $2.$3.$4$5.$6');
  }
  
  return cleaned;
}