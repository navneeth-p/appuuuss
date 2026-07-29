// Pure logic, no three.js / DOM imports — must stay importable under vitest (node env).

const PLACEHOLDER_PHOTO = 'assets/photos/_placeholder.svg';

/**
 * Filters and normalizes a raw STOPS array from config.js.
 * - Drops entries missing `id` or `title` (warns for each).
 * - Coerces missing/empty `photos` to a single placeholder image.
 * - Defaults missing `caption` to ''.
 *
 * @param {Array<object>} stops
 * @returns {Array<object>} cleaned stops
 */
export function validateStops(stops) {
  if (!Array.isArray(stops)) return [];

  const cleaned = [];
  for (const stop of stops) {
    if (!stop || !stop.id || !stop.title) {
      console.warn('[validateConfig] dropping stop missing id/title:', stop);
      continue;
    }

    const photos = Array.isArray(stop.photos) && stop.photos.length > 0
      ? stop.photos
      : [PLACEHOLDER_PHOTO];

    cleaned.push({
      ...stop,
      photos,
      caption: stop.caption ?? '',
    });
  }

  return cleaned;
}
