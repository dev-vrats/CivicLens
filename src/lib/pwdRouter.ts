/**
 * Regional PWD (Public Works Department) WhatsApp number router.
 *
 * Matches GPS coordinates to state/district bounding boxes and returns
 * the official PWD WhatsApp/helpline number for that region.
 *
 * Sources: Official state PWD websites, verified government press releases.
 * Numbers are formatted as: countryCode + number (no spaces, no +).
 *
 * HOW TO ADD MORE DISTRICTS:
 *   1. Find the lat/lng bounding box for the district (use boundingbox.klokantech.com)
 *   2. Add a new entry to PWD_REGIONS before the state-level fallback entry
 *   3. Entries are matched top-to-bottom — district entries must come before state entries
 */

export interface PWDRegion {
  name: string;
  state: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  /** WhatsApp/helpline number: country code + number, no + or spaces */
  number: string;
  /** Human-readable label shown in the UI */
  label: string;
}

export const PWD_REGIONS: PWDRegion[] = [

  // ═══════════════════════════════════════════════════════════
  // UTTAR PRADESH — District level
  // Source: UP PWD Helpline / Jansunwai portal
  // ═══════════════════════════════════════════════════════════
  {
    name: "Lucknow",
    state: "Uttar Pradesh",
    minLat: 26.72, maxLat: 27.00,
    minLng: 80.78, maxLng: 81.10,
    number: "917991995566",
    label: "Lucknow PWD",
  },
  {
    name: "Agra",
    state: "Uttar Pradesh",
    minLat: 26.95, maxLat: 27.35,
    minLng: 77.85, maxLng: 78.20,
    number: "917991995566", // UP PWD central — no district-specific confirmed yet
    label: "Agra PWD (UP)",
  },
  {
    name: "Kanpur",
    state: "Uttar Pradesh",
    minLat: 26.30, maxLat: 26.60,
    minLng: 80.20, maxLng: 80.50,
    number: "917991995566",
    label: "Kanpur PWD (UP)",
  },
  {
    name: "Varanasi",
    state: "Uttar Pradesh",
    minLat: 25.20, maxLat: 25.45,
    minLng: 82.85, maxLng: 83.15,
    number: "917991995566",
    label: "Varanasi PWD (UP)",
  },
  {
    name: "Prayagraj",
    state: "Uttar Pradesh",
    minLat: 25.30, maxLat: 25.55,
    minLng: 81.75, maxLng: 82.00,
    number: "917991995566",
    label: "Prayagraj PWD (UP)",
  },

  // ═══════════════════════════════════════════════════════════
  // DELHI
  // Source: PWD Delhi official — pwddelhi.gov.in
  // WhatsApp: 8130188222 | Toll-free: 1908
  // ═══════════════════════════════════════════════════════════
  {
    name: "Delhi",
    state: "Delhi",
    minLat: 28.40, maxLat: 28.88,
    minLng: 76.84, maxLng: 77.35,
    number: "918130188222",
    label: "Delhi PWD",
  },

  // ═══════════════════════════════════════════════════════════
  // MAHARASHTRA
  // Source: Maharashtra PWD — mahapwd.com
  // ═══════════════════════════════════════════════════════════
  {
    name: "Mumbai",
    state: "Maharashtra",
    minLat: 18.87, maxLat: 19.28,
    minLng: 72.77, maxLng: 73.00,
    number: "911800224515", // Toll-free for Mumbai region
    label: "Mumbai PWD",
  },
  {
    name: "Pune",
    state: "Maharashtra",
    minLat: 18.40, maxLat: 18.65,
    minLng: 73.75, maxLng: 74.00,
    number: "911800224515",
    label: "Pune PWD (Maharashtra)",
  },
  {
    name: "Nagpur",
    state: "Maharashtra",
    minLat: 20.98, maxLat: 21.25,
    minLng: 78.95, maxLng: 79.25,
    number: "9118002330080",
    label: "Nagpur PWD (Maharashtra)",
  },

  // ═══════════════════════════════════════════════════════════
  // WEST BENGAL
  // Source: WB PWD — pwdwb.gov.in
  // WhatsApp: 9088822111
  // ═══════════════════════════════════════════════════════════
  {
    name: "Kolkata",
    state: "West Bengal",
    minLat: 22.45, maxLat: 22.65,
    minLng: 88.25, maxLng: 88.45,
    number: "919088822111",
    label: "Kolkata PWD (WB)",
  },
  {
    name: "West Bengal",
    state: "West Bengal",
    minLat: 21.50, maxLat: 27.25,
    minLng: 85.80, maxLng: 89.90,
    number: "919088822111",
    label: "West Bengal PWD",
  },

  // ═══════════════════════════════════════════════════════════
  // GOA
  // Source: Goa PWD — goapwd.gov.in
  // Verified WhatsApp: 7796667373
  // ═══════════════════════════════════════════════════════════
  {
    name: "Goa",
    state: "Goa",
    minLat: 14.88, maxLat: 15.81,
    minLng: 73.67, maxLng: 74.35,
    number: "917796667373",
    label: "Goa PWD",
  },

  // ═══════════════════════════════════════════════════════════
  // KERALA
  // Source: Kerala PWD — keralapwd.gov.in
  // Uses PWD4U app + WhatsApp helpline
  // ═══════════════════════════════════════════════════════════
  {
    name: "Kerala",
    state: "Kerala",
    minLat: 8.17, maxLat: 12.78,
    minLng: 74.85, maxLng: 77.40,
    number: "916282291232", // Kerala PWD helpdesk
    label: "Kerala PWD",
  },

  // ═══════════════════════════════════════════════════════════
  // KARNATAKA
  // Source: Karnataka PWD — pwd.karnataka.gov.in
  // ═══════════════════════════════════════════════════════════
  {
    name: "Bengaluru",
    state: "Karnataka",
    minLat: 12.82, maxLat: 13.18,
    minLng: 77.45, maxLng: 77.78,
    number: "918792900007",
    label: "BBMP / Karnataka PWD",
  },

  // ═══════════════════════════════════════════════════════════
  // TAMIL NADU
  // Source: TN Highways — highways.tn.gov.in
  // ═══════════════════════════════════════════════════════════
  {
    name: "Chennai",
    state: "Tamil Nadu",
    minLat: 12.90, maxLat: 13.23,
    minLng: 80.08, maxLng: 80.32,
    number: "914428521501",
    label: "Tamil Nadu Highways Dept.",
  },

  // ═══════════════════════════════════════════════════════════
  // RAJASTHAN
  // Source: Rajasthan PWD — pwd.rajasthan.gov.in
  // ═══════════════════════════════════════════════════════════
  {
    name: "Jaipur",
    state: "Rajasthan",
    minLat: 26.78, maxLat: 27.10,
    minLng: 75.70, maxLng: 76.00,
    number: "914141500000",
    label: "Jaipur PWD (Rajasthan)",
  },

  // ═══════════════════════════════════════════════════════════
  // MADHYA PRADESH
  // Source: MP Lokpath / MP PWD — mppwd.gov.in
  // ═══════════════════════════════════════════════════════════
  {
    name: "Bhopal",
    state: "Madhya Pradesh",
    minLat: 23.10, maxLat: 23.40,
    minLng: 77.25, maxLng: 77.55,
    number: "917552441600",
    label: "Bhopal PWD (MP)",
  },

  // ═══════════════════════════════════════════════════════════
  // GUJARAT
  // Source: Gujarat R&B — rnd.gujarat.gov.in
  // ═══════════════════════════════════════════════════════════
  {
    name: "Ahmedabad",
    state: "Gujarat",
    minLat: 22.95, maxLat: 23.15,
    minLng: 72.45, maxLng: 72.70,
    number: "917923250601",
    label: "AMC / Gujarat Roads",
  },
];

/** Fallback number when no region matches */
const FALLBACK: Omit<PWDRegion, "minLat" | "maxLat" | "minLng" | "maxLng"> = {
  name: "National",
  state: "India",
  number: "911800180066", // CPGRAMS national grievance toll-free
  label: "National Helpline (CPGRAMS)",
};

/**
 * Returns the PWDRegion matching the coordinates, or the fallback object.
 */
export function getRegionalPWD(lat: number, lng: number): typeof FALLBACK & Partial<PWDRegion> {
  for (const region of PWD_REGIONS) {
    if (
      lat >= region.minLat &&
      lat <= region.maxLat &&
      lng >= region.minLng &&
      lng <= region.maxLng
    ) {
      return region;
    }
  }
  return FALLBACK;
}

/** Convenience: just the number string */
export function getRegionalPWDNumber(lat: number, lng: number): string {
  return getRegionalPWD(lat, lng).number;
}

/**
 * Builds the wa.me direct-chat URL with a beautifully formatted pre-filled message.
 */
export function buildPWDWhatsAppUrl(
  number: string,
  report: {
    description: string;
    lat: number;
    lng: number;
    imageUrl: string;
    status: string;
    createdAt: Date | null;
  }
): string {
  const mapsUrl = `https://maps.google.com/?q=${report.lat},${report.lng}`;
  const date = report.createdAt
    ? report.createdAt.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Date unknown";

  const lines = [
    `🚨 *URGENT CIVIC ISSUE — IMMEDIATE ACTION NEEDED*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `📋 *Issue Description*`,
    `${report.description}`,
    ``,
    `📍 *Exact GPS Location*`,
    `${report.lat.toFixed(6)}, ${report.lng.toFixed(6)}`,
    `🗺️ View on Maps: ${mapsUrl}`,
    ``,
    `📸 *Photo Evidence*`,
    `${report.imageUrl}`,
    ``,
    `🔴 *Status:* Pending Review`,
    `📅 *Reported on:* ${date}`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    `_Reported via CivicLens — AI-Powered Civic Issue Reporting_`,
    `_Kindly inspect and take action at the earliest._`,
  ];

  return `https://wa.me/${number}?text=${encodeURIComponent(lines.join("\n"))}`;
}
