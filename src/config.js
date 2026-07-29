// =============================================================================
// A Year in Bloom — content & settings config
// =============================================================================
//
// This is the ONLY file you should need to edit to personalize the journey.
//
// HOW TO EDIT STOPS
// ------------------
// STOPS is an ordered array of "memory stops" the two characters walk past
// along the garden path. There are 7 placeholders below with cute/flirty/
// cheeky captions — replace them with your real memories and photos.
//
// Each stop is an object:
//   {
//     id:      string   — unique, stable identifier (used internally, don't reuse)
//     title:   string   — short headline shown at the top of the memory card
//     photos:  string[] — one or more image paths, relative to the app root,
//                          e.g. 'assets/photos/first-date.jpg'. Multiple photos
//                          become a slideshow (prev/next + swipe on mobile).
//                          If you leave this out or empty, a placeholder tile
//                          is used automatically (see validateConfig.js).
//     caption: string   — the little paragraph under the title.
//   }
//
// Stops are evenly distributed along the path in the order you list them —
// reorder the array to reorder the journey. Add or remove stops freely
// (works with anywhere from ~3 to ~10 without further changes).
//
// HOW TO EDIT SETTINGS
// ---------------------
// walkSpeed:    how fast the characters move along the path per second,
//               in "path progress units" (0..1 is the whole path).
// petalDensity: relative number of falling/drifting petals (physics
//               particles). Higher = more petals, more GPU/CPU cost.
// quality:      'auto' picks a tier from device capability (see quality.js,
//               Task 10). Force it to 'low' | 'medium' | 'high' to override.
// avatarA / avatarB: hex colors for the two characters' primary clothing.
//
// Photos: drop image files into assets/photos/ and reference them by path
// above. Missing/broken images fall back to assets/photos/_placeholder.svg
// automatically — you won't get a broken-image icon.
// =============================================================================

export const STOPS = [
  {
    id: 'lucky-day',
    title: 'The day I got lucky',
    photos: [],
    caption: 'You said hi and I forgot every word I knew. Still do, honestly.',
  },
  {
    id: 'first-date',
    title: "First 'date' (allegedly)",
    photos: [],
    caption: "You swore it wasn't a date. You also held my hand the whole time. Sure, babe.",
  },
  {
    id: 'got-lost',
    title: 'The one where we got lost',
    photos: [],
    caption: "Worst navigator, best company. I'd take every wrong turn again.",
  },
  {
    id: 'kitchen-disaster',
    title: 'Our disaster in the kitchen',
    photos: [],
    caption: "We invented a new flavor: 'love, slightly burnt.' 10/10 would set off the smoke alarm again.",
  },
  {
    id: 'perfect-evening',
    title: 'That stupidly perfect evening',
    photos: [],
    caption: "You laughed at your own joke and I thought, yeah, okay, it's her.",
  },
  {
    id: 'everyday-us',
    title: 'The little everyday us',
    photos: [],
    caption: 'No big occasion. Just you, me, and me stealing your fries. Peak romance.',
  },
  {
    id: 'happy-birthday',
    title: 'Happy birthday, my favorite person',
    photos: [],
    caption: "One year, a bit more, and a whole garden of reasons. Here's to every bloom after this one.",
  },
];

export const SETTINGS = {
  // Path progress units per second while a movement key/d-pad is held.
  walkSpeed: 0.06,
  // Relative density of the petal/fauna particle system.
  petalDensity: 1.0,
  // 'auto' | 'low' | 'medium' | 'high'
  quality: 'auto',
  // Hex colors for the two characters.
  avatarA: '#e07a5f',
  avatarB: '#7a9e7e',
};
