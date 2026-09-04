/**
 * Country-aware address configuration.
 *
 * The checkout form previously asked every shopper for a "State / Province" and
 * a **required** "Postal / ZIP Code". Both are US/UK assumptions, and in the UAE
 * the second one is actively wrong: the Emirates has no postal code system at
 * all. A required field nobody can legitimately fill either blocks the order or
 * trains customers to type "00000" — and a junk postcode then flows into the
 * courier's system on every label.
 *
 * So the shape of an address is data, not markup: each country declares what it
 * calls its regions, whether a postal code exists, and what to dial.
 *
 * Adding a country is adding an entry here. Nothing in this file is specific to
 * one client, so it belongs in MASTER (AGENTS.md sections 8 and 25).
 */

export interface CountryAddressFormat {
  /** ISO 3166-1 alpha-2. */
  code: string;
  name: string;
  /** What this country calls the second-level division. */
  regionLabel: string;
  /** Fixed list of regions, when the country has a short official one. */
  regions?: string[];
  /**
   * Postal codes: 'required' where they are essential to delivery, 'optional'
   * where they exist but are commonly omitted, 'none' where the country has no
   * system (UAE, Hong Kong, Panama, Ireland pre-Eircode…).
   */
  postalCode: "required" | "optional" | "none";
  postalCodeLabel: string;
  /** International dialling prefix, prefilled in the phone field. */
  dialCode: string;
  /** Example phone number, shown as a placeholder. */
  phoneExample: string;
}

/** The seven emirates, in the order they are conventionally listed. */
const UAE_EMIRATES = [
  "Abu Dhabi",
  "Dubai",
  "Sharjah",
  "Ajman",
  "Umm Al Quwain",
  "Ras Al Khaimah",
  "Fujairah",
];

const GCC_AND_COMMON: CountryAddressFormat[] = [
  {
    code: "AE",
    name: "United Arab Emirates",
    regionLabel: "Emirate",
    regions: UAE_EMIRATES,
    // The UAE genuinely has no postal codes. Asking for one is a defect.
    postalCode: "none",
    postalCodeLabel: "PO Box (optional)",
    dialCode: "+971",
    phoneExample: "+971 50 123 4567",
  },
  {
    code: "SA",
    name: "Saudi Arabia",
    regionLabel: "Region",
    regions: [
      "Riyadh",
      "Makkah",
      "Madinah",
      "Eastern Province",
      "Asir",
      "Tabuk",
      "Hail",
      "Northern Borders",
      "Jazan",
      "Najran",
      "Al Bahah",
      "Al Jawf",
      "Qassim",
    ],
    postalCode: "optional",
    postalCodeLabel: "Postal code",
    dialCode: "+966",
    phoneExample: "+966 50 123 4567",
  },
  {
    code: "KW",
    name: "Kuwait",
    regionLabel: "Governorate",
    regions: ["Al Asimah", "Hawalli", "Farwaniya", "Mubarak Al-Kabeer", "Ahmadi", "Jahra"],
    postalCode: "optional",
    postalCodeLabel: "Postal code",
    dialCode: "+965",
    phoneExample: "+965 5012 3456",
  },
  {
    code: "QA",
    name: "Qatar",
    regionLabel: "Municipality",
    regions: [
      "Doha",
      "Al Rayyan",
      "Al Wakrah",
      "Al Khor",
      "Umm Salal",
      "Al Daayen",
      "Al Shamal",
      "Al Shahaniya",
    ],
    postalCode: "none",
    postalCodeLabel: "PO Box (optional)",
    dialCode: "+974",
    phoneExample: "+974 3312 3456",
  },
  {
    code: "OM",
    name: "Oman",
    regionLabel: "Governorate",
    regions: [
      "Muscat",
      "Dhofar",
      "Musandam",
      "Al Buraimi",
      "Ad Dakhiliyah",
      "Al Batinah North",
      "Al Batinah South",
      "Ash Sharqiyah North",
      "Ash Sharqiyah South",
      "Ad Dhahirah",
      "Al Wusta",
    ],
    postalCode: "optional",
    postalCodeLabel: "Postal code",
    dialCode: "+968",
    phoneExample: "+968 9123 4567",
  },
  {
    code: "BH",
    name: "Bahrain",
    regionLabel: "Governorate",
    regions: ["Capital", "Muharraq", "Northern", "Southern"],
    postalCode: "optional",
    postalCodeLabel: "Block number",
    dialCode: "+973",
    phoneExample: "+973 3612 3456",
  },
  {
    code: "IN",
    name: "India",
    regionLabel: "State",
    postalCode: "required",
    postalCodeLabel: "PIN code",
    dialCode: "+91",
    phoneExample: "+91 98765 43210",
  },
  {
    code: "GB",
    name: "United Kingdom",
    regionLabel: "County",
    postalCode: "required",
    postalCodeLabel: "Postcode",
    dialCode: "+44",
    phoneExample: "+44 7700 900123",
  },
  {
    code: "US",
    name: "United States",
    regionLabel: "State",
    postalCode: "required",
    postalCodeLabel: "ZIP code",
    dialCode: "+1",
    phoneExample: "+1 555 123 4567",
  },
];

/** Fallback for a country with no entry: ask for everything, require nothing. */
const GENERIC_FORMAT: CountryAddressFormat = {
  code: "",
  name: "",
  regionLabel: "State / Province / Region",
  postalCode: "optional",
  postalCodeLabel: "Postal code",
  dialCode: "",
  phoneExample: "",
};

/**
 * Countries offered in the address form.
 *
 * Restricted by `NEXT_PUBLIC_SHIPPING_COUNTRIES` (comma-separated ISO codes)
 * when a store only ships to some of them — a country in the dropdown that the
 * store cannot actually deliver to produces orders it has to cancel.
 */
export function getSupportedCountries(): CountryAddressFormat[] {
  const allowList = (process.env.NEXT_PUBLIC_SHIPPING_COUNTRIES || "")
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);

  if (allowList.length === 0) return GCC_AND_COMMON;

  const filtered = GCC_AND_COMMON.filter((country) => allowList.includes(country.code));
  // Never leave the form with an empty dropdown because of a typo in config.
  return filtered.length > 0 ? filtered : GCC_AND_COMMON;
}

/** The country the form starts on. */
export function getDefaultCountry(): CountryAddressFormat {
  const configured = process.env.NEXT_PUBLIC_DEFAULT_COUNTRY?.trim();
  const supported = getSupportedCountries();

  if (configured) {
    const match = supported.find(
      (country) =>
        country.code.toLowerCase() === configured.toLowerCase() ||
        country.name.toLowerCase() === configured.toLowerCase()
    );
    if (match) return match;
  }

  return supported[0] ?? GENERIC_FORMAT;
}

/** Resolve a format from whatever the address record stores (name or code). */
export function getCountryFormat(value: string | null | undefined): CountryAddressFormat {
  if (!value) return getDefaultCountry();

  const needle = value.trim().toLowerCase();
  const match = GCC_AND_COMMON.find(
    (country) => country.code.toLowerCase() === needle || country.name.toLowerCase() === needle
  );

  return match ?? { ...GENERIC_FORMAT, name: value };
}

/**
 * Whether a postal code must be supplied for this country.
 *
 * Server-side validation calls this too, so the rule lives in one place and the
 * form and the API cannot disagree.
 */
export function isPostalCodeRequired(country: string | null | undefined): boolean {
  return getCountryFormat(country).postalCode === "required";
}
