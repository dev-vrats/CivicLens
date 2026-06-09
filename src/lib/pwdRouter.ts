/**
 * Regional PWD (Public Works Department) WhatsApp number router.
 *
 * Given GPS coordinates, returns the WhatsApp-formatted phone number
 * (country code + number, no spaces or symbols) for the nearest PWD office.
 *
 * HOW TO EXTEND:
 *   Add bounding boxes for real districts below the examples.
 *   Format: [minLat, maxLat, minLng, maxLng] → number string.
 *
 * @param lat - Latitude of the reported issue
 * @param lng - Longitude of the reported issue
 * @returns WhatsApp number string e.g. "919876543210"
 */

interface Region {
  name: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  number: string; // country code + number, no + or spaces
}

const PWD_REGIONS: Region[] = [
  // ── Add real district bounding boxes here ─────────────────────────────
  // Example: Lucknow district approximate bounds
  // { name: "Lucknow PWD",   minLat: 26.7, maxLat: 27.0, minLng: 80.8, maxLng: 81.2, number: "919415000001" },

  // Example: Delhi PWD
  // { name: "Delhi PWD",     minLat: 28.4, maxLat: 28.9, minLng: 76.8, maxLng: 77.4, number: "911123370301" },

  // Example: Mumbai PWD
  // { name: "Mumbai PWD",    minLat: 18.8, maxLat: 19.3, minLng: 72.7, maxLng: 73.1, number: "912222620251" },
  // ──────────────────────────────────────────────────────────────────────
];

/** Default fallback number used during local testing */
const DEFAULT_TEST_NUMBER = "919999999999";

/**
 * Returns the WhatsApp number for the PWD office covering the given coordinates.
 * Falls back to the default test number if no region matches.
 */
export function getRegionalPWDNumber(lat: number, lng: number): string {
  for (const region of PWD_REGIONS) {
    if (
      lat >= region.minLat &&
      lat <= region.maxLat &&
      lng >= region.minLng &&
      lng <= region.maxLng
    ) {
      return region.number;
    }
  }
  return DEFAULT_TEST_NUMBER;
}

/**
 * Builds the full wa.me URL with a beautifully formatted pre-filled message.
 *
 * @param number  - Recipient number from getRegionalPWDNumber()
 * @param report  - Report object with description, lat, lng, imageUrl, createdAt
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
    `🚨 *URGENT CIVIC ISSUE ALERT*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `📋 *Issue Description*`,
    `${report.description}`,
    ``,
    `📍 *Exact Location*`,
    `Coordinates: ${report.lat.toFixed(6)}, ${report.lng.toFixed(6)}`,
    `🗺️ View on Maps: ${mapsUrl}`,
    ``,
    `📸 *Photo Evidence*`,
    `${report.imageUrl}`,
    ``,
    `🔴 *Status:* Pending Review`,
    `📅 *Reported on:* ${date}`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    `_This issue was reported anonymously via CivicLens — AI-Powered Civic Issue Reporting._`,
    `_Kindly inspect and take necessary action at the earliest._`,
  ];

  const text = lines.join("\n");
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
