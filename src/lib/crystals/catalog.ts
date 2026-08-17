import { CrystalSchema, type Crystal, type CrystalInput } from './types';

const HOWLITE_VARIANTS = Array.from({ length: 15 }, (_, i) => `/beads/howlite_${String(i + 1).padStart(2, '0')}.png`);
const YANYUAN_AGATE_ASSET_VERSION = '20260528-capsule';
const YANYUAN_AGATE_VARIANTS = Array.from(
  { length: 14 },
  (_, i) => `/beads/yanyuan-agate_${String(i + 1).padStart(2, '0')}.png?v=${YANYUAN_AGATE_ASSET_VERSION}`,
);
const CORAL_JADE_MOON_VARIANTS = Array.from({ length: 6 }, (_, i) => `/beads/coral-jade-moon_${String(i + 1).padStart(2, '0')}.png`);
const CORAL_JADE_STAR_VARIANTS = Array.from({ length: 20 }, (_, i) => `/beads/coral-jade-star_${String(i + 1).padStart(2, '0')}.png`);
const CORAL_JADE_HEART_VARIANTS = Array.from({ length: 12 }, (_, i) => `/beads/coral-jade-heart_${String(i + 1).padStart(2, '0')}.png`);
const YELLOW_AGATE_ROUND_ASSET_VERSION = '20260601-source-resolution';
const RED_AGATE_ASSET_VERSION = '20260601-single-bead';
const GREEN_AGATE_ASSET_VERSION = '20260601-single-bead-hires';
const BLUE_AGATE_ASSET_VERSION = '20260602-a0309-727c5-direct-cutout';
const CITRINE_NUGGET_VARIANTS = Array.from({ length: 12 }, (_, i) => `/beads/citrine-nugget_${String(i + 1).padStart(2, '0')}.png`);
const AQUAMARINE_VARIANTS = Array.from({ length: 15 }, (_, i) => `/beads/aquamarine_${String(i + 1).padStart(2, '0')}.png`);
const SILVER_SHEEN_OBSIDIAN_VARIANTS = Array.from(
  { length: 25 },
  (_, i) => `/beads/silver-sheen-obsidian_${String(i + 1).padStart(2, '0')}.png`,
);
const SILVER_SHEEN_OBSIDIAN_ROUND_VARIANTS = Array.from(
  { length: 16 },
  (_, i) => `/beads/silver-sheen-obsidian-round_${String(i + 1).padStart(2, '0')}.png`,
);
const SILVER_SHEEN_OBSIDIAN_RONDELLE_VARIANTS = Array.from(
  { length: 20 },
  (_, i) => `/beads/silver-sheen-obsidian-rondelle_${String(i + 1).padStart(2, '0')}.png`,
);
const SILVER_SHEEN_OBSIDIAN_SQUARE_VARIANTS = Array.from(
  { length: 16 },
  (_, i) => `/beads/silver-sheen-obsidian-square_${String(i + 1).padStart(2, '0')}.png`,
);
const SILVER_SHEEN_OBSIDIAN_CAT_VARIANTS = Array.from(
  { length: 9 },
  (_, i) => `/beads/silver-sheen-obsidian-cat_${String(i + 1).padStart(2, '0')}.png`,
);
const TIGERS_EYE_ASSET_VERSION = '20260531-new-upload-4x4';
const TIGERS_EYE_VARIANTS = Array.from(
  { length: 16 },
  (_, i) => `/beads/tigers-eye_${String(i + 1).padStart(2, '0')}.png?v=${TIGERS_EYE_ASSET_VERSION}`,
);
const RED_TIGERS_EYE_ASSET_VERSION = '20260531-red-new-upload-4x4';
const RED_TIGERS_EYE_VARIANTS = Array.from(
  { length: 16 },
  (_, i) => `/beads/red-tigers-eye_${String(i + 1).padStart(2, '0')}.png?v=${RED_TIGERS_EYE_ASSET_VERSION}`,
);
const BLUE_TIGERS_EYE_ASSET_VERSION = '20260531-blue-new-upload-4x4';
const BLUE_TIGERS_EYE_VARIANTS = Array.from(
  { length: 16 },
  (_, i) => `/beads/blue-tigers-eye_${String(i + 1).padStart(2, '0')}.png?v=${BLUE_TIGERS_EYE_ASSET_VERSION}`,
);
const BLUE_TIGERS_EYE_PREMIUM_ASSET_VERSION = '20260601-premium-12mm-4x4';
const BLUE_TIGERS_EYE_PREMIUM_VARIANTS = Array.from(
  { length: 16 },
  (_, i) => `/beads/blue-tigers-eye-premium_${String(i + 1).padStart(2, '0')}.png?v=${BLUE_TIGERS_EYE_PREMIUM_ASSET_VERSION}`,
);
const LYCHEE_JELLY_ASSET_VERSION = '20260601-round-4x4';
const LYCHEE_JELLY_VARIANTS = Array.from(
  { length: 16 },
  (_, i) => `/beads/lychee-jelly_${String(i + 1).padStart(2, '0')}.png?v=${LYCHEE_JELLY_ASSET_VERSION}`,
);
const BLUE_AGATE_VARIANTS = Array.from(
  { length: 16 },
  (_, i) => `/beads/blue-agate_${String(i + 1).padStart(2, '0')}.png?v=${BLUE_AGATE_ASSET_VERSION}`,
);
const ICE_OBSIDIAN_ASSET_VERSION = '20260531-horizontal-channel-4x4';
const ICE_OBSIDIAN_VARIANTS = Array.from(
  { length: 16 },
  (_, i) => `/beads/ice-obsidian_${String(i + 1).padStart(2, '0')}.png?v=${ICE_OBSIDIAN_ASSET_VERSION}`,
);
const GOLD_ALPHABET_ASSET_VERSION = '20260531-18k-imagegen-a-z-v1';
const GOLD_ALPHABET_ITEMS: CrystalInput[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => {
  const lower = letter.toLowerCase();
  return {
    slug: `gold-alphabet-${lower}`,
    name: `Alphabet ${letter}`,
    color: '18K Gold',
    hex: '#d7a629',
    category: 'alphabet',
    images: [`/beads/gold-alphabet-${lower}.png?v=${GOLD_ALPHABET_ASSET_VERSION}`],
    paletteImage: `/beads/gold-alphabet-${lower}.png?v=${GOLD_ALPHABET_ASSET_VERSION}`,
    colorGroup: 'yellow',
    intention: ['creativity', 'manifestation', 'balance'],
    origin: ['China'],
    sourcing: [{ region: 'China', method: 'large-scale', fairTradeCertified: false }],
    priceCents: 160,
    // Product spec: the letter charm is 11mm wide x 12mm high, about 0.2g each.
    // The rendered sprite stays full-size, but it only contributes 1mm of
    // along-strand spacing so alphabet connectors sit tightly between beads.
    availableSizesMm: [12],
    thicknessMm: 11,
    contactWidthMm: 1,
    sameCrystalContactWidthMm: 1,
    renderWidthMm: 11,
    renderHeightMm: 15.8,
    viewportAnchorXRatio: 0.5,
    viewportAnchorYRatio: 0.118,
    renderRotationOffsetDeg: 180,
    blurb: `Letter ${letter} connector charm in 304 stainless steel with furnace vacuum electroplated 18K gold. Sized about 11mm wide x 12mm high and 0.2g each, it includes a small top loop and open jump ring so it can attach to a crystal bracelet as a personalised alphabet accent, connector, or bright gold detail.`,
  };
});

const raw: CrystalInput[] = [
  {
    slug: 'clear-quartz',
    name: 'Clear Quartz',
    color: 'Crystal Clear',
    hex: '#dedede',
    images: ['/beads/clear-quartz.png'],
    colorGroup: 'white',
    chakra: ['crown'],
    zodiac: ['aries', 'leo'],
    element: 'spirit',
    intention: ['clarity', 'focus', 'manifestation', 'healing'],
    hardness: 7,
    formation: 'igneous',
    origin: ['Brazil', 'Arkansas (US)', 'Madagascar'],
    sourcing: [{ region: 'Brazil', method: 'small-scale', fairTradeCertified: true }],
    priceCents: 380,
    availableSizesMm: [4, 8, 9, 10, 12],
    blurb: 'The master crystal — amplifies intent and harmonises the energy of any pairing.',
  },
  {
    slug: 'howlite',
    name: 'Howlite',
    color: 'White with Grey Veins',
    hex: '#e9e6e3',
    images: HOWLITE_VARIANTS,
    colorGroup: 'white',
    chakra: ['crown', 'third-eye'],
    zodiac: ['gemini', 'virgo'],
    element: 'air',
    intention: ['calm', 'focus', 'intuition', 'balance'],
    hardness: 3.5,
    formation: 'sedimentary',
    origin: ['Canada', 'USA', 'Germany'],
    sourcing: [{ region: 'Canada', method: 'small-scale', fairTradeCertified: true }],
    priceCents: 320,
    availableSizesMm: [6.4, 8, 10, 12],
    blurb: 'Snow-white stone laced with ink-grey veins — Howlite quiets a busy mind and dissolves anger. Each bead has its own pattern, like a fingerprint.',
  },
  {
    slug: 'lychee-jelly',
    name: 'Lychee Jelly',
    color: 'Milky White / Soft Peach',
    hex: '#d8d2cf',
    // Milky translucent round beads from the uploaded white-background product
    // grid, cut with the BRIA + smooth matte workflow for soft edges.
    images: LYCHEE_JELLY_VARIANTS,
    paletteImage: `/beads/lychee-jelly.png?v=${LYCHEE_JELLY_ASSET_VERSION}`,
    colorGroup: 'white',
    chakra: ['heart', 'crown'],
    zodiac: ['cancer', 'pisces', 'libra'],
    element: 'water',
    intention: ['calm', 'love', 'healing', 'balance'],
    hardness: 7,
    formation: 'igneous',
    origin: ['China'],
    sourcing: [{ region: 'China', method: 'small-scale', fairTradeCertified: false }],
    priceCents: 120,
    // Supplier labels read 6.3mm, 8mm, 10mm and 12.3mm; listed as clean
    // 6mm, 8mm, 10mm and 12mm options in the designer.
    availableSizesMm: [6, 8, 10, 12],
    blurb: 'Polished lychee jelly agate round beads in milky translucent white with soft peach warmth, cloudy natural banding and glossy highlights for a gentle luminous strand.',
  },
  {
    slug: 'aquamarine',
    name: 'Aquamarine',
    color: 'Sea Blue',
    hex: '#8fb8c9',
    // Round aquamarine beads. The palette uses one representative bead;
    // bracelet beads randomly pick all variants.
    images: AQUAMARINE_VARIANTS,
    paletteImage: '/beads/aquamarine.png',
    colorGroup: 'blue',
    chakra: ['throat', 'third-eye'],
    zodiac: ['aquarius', 'pisces'],
    element: 'water',
    intention: ['calm', 'communication', 'clarity', 'balance'],
    hardness: 7.5,
    formation: 'igneous',
    origin: ['Brazil', 'Madagascar', 'Pakistan'],
    sourcing: [],
    priceCents: 620,
    availableSizesMm: [10, 12],
    blurb: 'Aquamarine round beads in soft sea-blue tones with cloudy natural texture and glossy highlights. A calm, clear stone traditionally associated with easeful communication.',
  },
  {
    slug: 'tigers-eye',
    name: "Tiger's Eye",
    color: 'Golden Brown',
    hex: '#a66a20',
    // Round tiger's eye beads from the uploaded 4x4 product grid, refined with
    // a smooth circular edge matte.
    images: TIGERS_EYE_VARIANTS,
    paletteImage: `/beads/tigers-eye.png?v=${TIGERS_EYE_ASSET_VERSION}`,
    colorGroup: 'yellow',
    chakra: ['root', 'solar-plexus'],
    zodiac: ['leo', 'gemini', 'capricorn'],
    element: 'earth',
    intention: ['courage', 'protection', 'grounding', 'clarity'],
    hardness: 7,
    formation: 'metamorphic',
    origin: ['South Africa', 'Australia', 'India'],
    sourcing: [{ region: 'China', method: 'small-scale', fairTradeCertified: false }],
    priceCents: 95,
    // Supplier labels read 6.6mm, 8.5mm and 10.4mm; listed as 6.5mm,
    // 8.5mm and 10.5mm in the designer.
    availableSizesMm: [6.5, 8.5, 10.5],
    blurb: "Polished tiger's eye round beads — golden honey-brown crystal with dark bands, glossy chatoyancy and bright cat's-eye flashes for a confident, grounded strand.",
  },
  {
    slug: 'red-tigers-eye',
    name: "Red Tiger's Eye",
    color: 'Burgundy / Black',
    hex: '#5a211b',
    // Round red tiger's eye beads generated from the uploaded product photos,
    // then cut into transparent variants with a fitted circular matte.
    images: RED_TIGERS_EYE_VARIANTS,
    paletteImage: `/beads/red-tigers-eye.png?v=${RED_TIGERS_EYE_ASSET_VERSION}`,
    colorGroup: 'red',
    chakra: ['root', 'solar-plexus'],
    zodiac: ['leo', 'gemini', 'capricorn'],
    element: 'earth',
    intention: ['courage', 'protection', 'grounding', 'energy'],
    hardness: 7,
    formation: 'metamorphic',
    origin: ['South Africa', 'Australia', 'India'],
    sourcing: [{ region: 'China', method: 'small-scale', fairTradeCertified: false }],
    priceCents: 95,
    // Supplier label reads 6.4mm; listed as 6.5mm in the designer.
    availableSizesMm: [6.5],
    blurb: "Polished red tiger's eye round beads — deep burgundy-black crystal with copper chatoyant bands and glossy cat's-eye flashes for a warm protective strand.",
  },
  {
    slug: 'red-agate',
    name: 'Red Agate',
    color: 'Translucent Wine Red',
    hex: '#8a1714',
    // Uniform round red agate bead generated from the uploaded bracelet photos,
    // then cut with BRIA remove background for the catalogue sprite.
    images: [`/beads/red-agate.png?v=${RED_AGATE_ASSET_VERSION}`],
    paletteImage: `/beads/red-agate.png?v=${RED_AGATE_ASSET_VERSION}`,
    colorGroup: 'red',
    chakra: ['root', 'sacral'],
    zodiac: ['aries', 'scorpio', 'capricorn'],
    element: 'earth',
    intention: ['grounding', 'energy', 'courage', 'protection'],
    hardness: 7,
    formation: 'igneous',
    origin: ['China', 'Brazil', 'India'],
    sourcing: [{ region: 'China', method: 'small-scale', fairTradeCertified: false }],
    priceCents: 120,
    // Uploaded labels/photos show 4mm strands and 8mm bracelets, with a larger
    // worn round-bead bracelet included in the same red agate batch.
    availableSizesMm: [4, 8, 10],
    blurb: 'Polished red agate round beads in translucent wine-red tones with clean internal depth, glossy highlights and a subtle centered string line for a vivid grounded strand.',
  },
  {
    slug: 'green-agate',
    name: 'Green Agate',
    color: 'Deep Emerald Green',
    hex: '#0b653d',
    // Uniform round green agate bead from the uploaded white-background source,
    // cut with the BRIA + smooth matte workflow as a single high-resolution sprite.
    images: [`/beads/green-agate.png?v=${GREEN_AGATE_ASSET_VERSION}`],
    paletteImage: `/beads/green-agate.png?v=${GREEN_AGATE_ASSET_VERSION}`,
    colorGroup: 'green',
    chakra: ['heart'],
    zodiac: ['gemini', 'virgo'],
    element: 'earth',
    intention: ['growth', 'balance', 'calm', 'healing'],
    hardness: 7,
    formation: 'igneous',
    origin: ['China'],
    sourcing: [{ region: 'China', method: 'small-scale', fairTradeCertified: false }],
    priceCents: 120,
    // Supplier labels read 6.3mm and 10mm; one representative bead is enough
    // because this batch is visually uniform.
    availableSizesMm: [6.3, 10],
    blurb: 'Polished green agate round beads in saturated emerald green with subtle cloudy depth and bright glossy highlights for a clean, balanced strand.',
  },
  {
    slug: 'blue-agate',
    name: 'Blue Agate',
    color: 'Cobalt Blue',
    hex: '#075b9b',
    // Single bead cut directly from the A0309...727c5 blue agate proof image,
    // then edge-contracted to remove the pale background halo.
    images: BLUE_AGATE_VARIANTS,
    paletteImage: `/beads/blue-agate.png?v=${BLUE_AGATE_ASSET_VERSION}`,
    colorGroup: 'blue',
    chakra: ['throat', 'third-eye'],
    zodiac: ['gemini', 'pisces', 'aquarius'],
    element: 'water',
    intention: ['calm', 'communication', 'clarity', 'balance'],
    hardness: 7,
    formation: 'igneous',
    origin: ['China'],
    sourcing: [{ region: 'China', method: 'small-scale', fairTradeCertified: false }],
    priceCents: 120,
    // Supplier labels read 6.3mm, 10.2mm and 11.7mm/12mm.
    availableSizesMm: [6.3, 10.2, 11.7],
    blurb: 'Polished blue agate round beads in saturated cobalt blue with translucent cloudy depth, a clean centered drill line and glossy highlights for a calm modern strand.',
  },
  {
    slug: 'blue-tigers-eye',
    name: "Blue Tiger's Eye",
    color: 'Navy / Blue-Gray',
    hex: '#1b2630',
    // Round blue tiger's eye beads from the uploaded 4x4 white-background grid,
    // cut into 16 transparent variants with a softened circular matte.
    images: BLUE_TIGERS_EYE_VARIANTS,
    paletteImage: `/beads/blue-tigers-eye.png?v=${BLUE_TIGERS_EYE_ASSET_VERSION}`,
    colorGroup: 'blue',
    chakra: ['root', 'throat', 'third-eye'],
    zodiac: ['leo', 'gemini', 'capricorn'],
    element: 'earth',
    intention: ['calm', 'protection', 'focus', 'clarity'],
    hardness: 7,
    formation: 'metamorphic',
    origin: ['South Africa', 'Australia', 'India'],
    sourcing: [{ region: 'China', method: 'small-scale', fairTradeCertified: false }],
    priceCents: 95,
    // Supplier label reads 10.4mm; listed as 10.5mm in the designer.
    availableSizesMm: [10.5],
    blurb: "Polished blue tiger's eye round beads - deep navy-black quartz with blue-gray chatoyant bands and glossy cat's-eye flashes for a calm, protective strand.",
  },
  {
    slug: 'blue-tigers-eye-premium',
    name: "Blue Tiger's Eye Premium",
    color: 'Deep Navy / Electric Blue Chatoyancy',
    hex: '#0d3148',
    // Higher-grade 12mm blue tiger's eye beads from the new uploaded batch,
    // cut from the clean white-background 4x4 grid into transparent variants.
    images: BLUE_TIGERS_EYE_PREMIUM_VARIANTS,
    paletteImage: `/beads/blue-tigers-eye-premium.png?v=${BLUE_TIGERS_EYE_PREMIUM_ASSET_VERSION}`,
    colorGroup: 'blue',
    chakra: ['root', 'throat', 'third-eye'],
    zodiac: ['leo', 'gemini', 'capricorn'],
    element: 'earth',
    intention: ['calm', 'protection', 'focus', 'clarity'],
    hardness: 7,
    formation: 'metamorphic',
    origin: ['South Africa', 'Australia', 'India'],
    sourcing: [{ region: 'China', method: 'small-scale', fairTradeCertified: false }],
    priceCents: 150,
    availableSizesMm: [12],
    blurb: "Higher-grade polished blue tiger's eye round beads - deep navy quartz with stronger electric-blue chatoyancy, glossy highlights and crisp cat's-eye bands for a calmer, more luminous protective strand.",
  },
  {
    slug: 'ice-obsidian',
    name: 'Ice Obsidian',
    color: 'Smoky Tea Brown',
    hex: '#4f382b',
    // Transparent smoky ice obsidian beads. The visible inner drill channel is
    // kept horizontal in every variant so viewport rotation remains predictable.
    images: ICE_OBSIDIAN_VARIANTS,
    paletteImage: `/beads/ice-obsidian.png?v=${ICE_OBSIDIAN_ASSET_VERSION}`,
    colorGroup: 'black',
    chakra: ['root', 'third-eye'],
    zodiac: ['scorpio', 'sagittarius'],
    element: 'earth',
    intention: ['protection', 'grounding', 'clarity', 'intuition'],
    hardness: 5.5,
    formation: 'igneous',
    origin: ['Mexico', 'USA'],
    sourcing: [{ region: 'China', method: 'small-scale', fairTradeCertified: false }],
    priceCents: 540,
    availableSizesMm: [10.5],
    blurb: 'Polished ice obsidian round beads in smoky tea-brown transparency with glossy studio highlights and a visible horizontal inner drill channel.',
  },
  ...GOLD_ALPHABET_ITEMS,
  {
    slug: 'silver-sheen-obsidian',
    name: 'Silver Sheen Obsidian',
    color: 'Black / Smoky Silver',
    hex: '#2f2d2b',
    images: SILVER_SHEEN_OBSIDIAN_VARIANTS,
    paletteImage: '/beads/silver-sheen-obsidian_01.png',
    colorGroup: 'black',
    chakra: ['root', 'third-eye'],
    zodiac: ['scorpio', 'sagittarius'],
    element: 'earth',
    intention: ['protection', 'grounding', 'clarity', 'intuition'],
    hardness: 5.5,
    formation: 'igneous',
    origin: ['Mexico', 'USA'],
    sourcing: [{ region: 'Mexico', method: 'small-scale', fairTradeCertified: false }],
    priceCents: 580,
    availableSizesMm: [7, 10],
    blurb: 'Glossy faceted silver sheen obsidian beads — deep black with smoky silver flashes, cloudy veining and crisp reflective facets. Available in 7mm and 10mm for a protective, polished midnight look.',
  },
  {
    slug: 'silver-sheen-obsidian-round',
    name: 'Silver Sheen Obsidian Round',
    color: 'Black / Smoky Silver',
    hex: '#2d2c2b',
    images: SILVER_SHEEN_OBSIDIAN_ROUND_VARIANTS,
    paletteImage: '/beads/silver-sheen-obsidian-round_03.png',
    colorGroup: 'black',
    chakra: ['root', 'third-eye'],
    zodiac: ['scorpio', 'sagittarius'],
    element: 'earth',
    intention: ['protection', 'grounding', 'clarity', 'intuition'],
    hardness: 5.5,
    formation: 'igneous',
    origin: ['Mexico', 'USA'],
    sourcing: [{ region: 'Mexico', method: 'small-scale', fairTradeCertified: false }],
    priceCents: 540,
    availableSizesMm: [6, 8, 12],
    blurb: 'Polished round silver sheen obsidian beads in glossy black with smoky silver glow, soft natural veining and bright studio highlights. Available in 6mm, 8mm and 12mm.',
  },
  {
    slug: 'silver-sheen-obsidian-heart',
    name: 'Silver Sheen Obsidian Heart',
    color: 'Black / Smoky Silver',
    hex: '#2b2a29',
    images: ['/beads/silver-sheen-obsidian-heart.png'],
    colorGroup: 'black',
    chakra: ['root', 'heart', 'third-eye'],
    zodiac: ['scorpio', 'sagittarius'],
    element: 'earth',
    intention: ['protection', 'grounding', 'love', 'clarity'],
    hardness: 5.5,
    formation: 'igneous',
    origin: ['Mexico', 'USA'],
    sourcing: [{ region: 'Mexico', method: 'small-scale', fairTradeCertified: false }],
    priceCents: 880,
    // Heart bead: estimated at 14mm tall x 15mm wide until exact stock
    // measurements are provided.
    availableSizesMm: [14],
    thicknessMm: 15,
    contactWidthMm: 13.4,
    sameCrystalContactWidthMm: 13.2,
    preserveImageAspectRatio: true,
    blurb: 'Polished heart-shaped silver sheen obsidian beads — deep black with smoky silver glow and glossy highlights. Protective, grounding, and softened by a heart-shaped silhouette.',
  },
  {
    slug: 'silver-sheen-obsidian-square',
    name: 'Silver Sheen Obsidian Square',
    color: 'Black / Smoky Silver',
    hex: '#2b2a29',
    // Square silver sheen obsidian beads. Generated as a white-background
    // product grid, then cut out with a soft matte to keep sharp chamfers.
    images: SILVER_SHEEN_OBSIDIAN_SQUARE_VARIANTS,
    paletteImage: '/beads/silver-sheen-obsidian-square.png',
    colorGroup: 'black',
    chakra: ['root', 'third-eye'],
    zodiac: ['scorpio', 'sagittarius'],
    element: 'earth',
    intention: ['protection', 'grounding', 'clarity', 'intuition'],
    hardness: 5.5,
    formation: 'igneous',
    origin: ['Mexico', 'USA'],
    sourcing: [{ region: 'Mexico', method: 'small-scale', fairTradeCertified: false }],
    priceCents: 780,
    // Estimated 10mm cube/square bead until exact stock measurements are provided.
    availableSizesMm: [10],
    thicknessMm: 10,
    contactWidthMm: 9.8,
    sameCrystalContactWidthMm: 9.6,
    preserveImageAspectRatio: true,
    blurb: 'Polished square silver sheen obsidian beads — deep black crystal with smoky silver flashes, sharp 45-degree chamfered edges and a clean geometric profile for a protective, modern strand.',
  },
  {
    slug: 'silver-sheen-obsidian-cat',
    name: 'Silver Sheen Obsidian Cat',
    color: 'Black / Smoky Silver',
    hex: '#2b2a29',
    // Carved cat-shaped silver sheen obsidian beads. The source photos were
    // cropped first so the white-background product grid follows this stock.
    images: SILVER_SHEEN_OBSIDIAN_CAT_VARIANTS,
    paletteImage: '/beads/silver-sheen-obsidian-cat.png',
    colorGroup: 'black',
    chakra: ['root', 'heart', 'third-eye'],
    zodiac: ['scorpio', 'sagittarius'],
    element: 'earth',
    intention: ['protection', 'grounding', 'clarity', 'intuition'],
    hardness: 5.5,
    formation: 'igneous',
    origin: ['Mexico', 'USA'],
    sourcing: [{ region: 'Mexico', method: 'small-scale', fairTradeCertified: false }],
    priceCents: 980,
    // Carved cat bead: 13.6mm tall x 15.6mm visual width.
    availableSizesMm: [13.6],
    thicknessMm: 15.6,
    contactWidthMm: 14.4,
    sameCrystalContactWidthMm: 14.2,
    blurb: 'Carved silver sheen obsidian cat beads — glossy black crystal with smoky silver flashes, compact rounded carving and a protective, playful silhouette.',
  },
  {
    slug: 'silver-sheen-obsidian-rondelle',
    name: 'Silver Sheen Obsidian Rondelle',
    color: 'Black / Smoky Silver',
    hex: '#2d2c2b',
    images: SILVER_SHEEN_OBSIDIAN_RONDELLE_VARIANTS,
    paletteImage: '/beads/silver-sheen-obsidian-rondelle.png',
    colorGroup: 'black',
    chakra: ['root', 'third-eye'],
    zodiac: ['scorpio', 'sagittarius'],
    element: 'earth',
    intention: ['protection', 'grounding', 'clarity', 'intuition'],
    hardness: 5.5,
    formation: 'igneous',
    origin: ['Mexico', 'USA'],
    sourcing: [{ region: 'Mexico', method: 'small-scale', fairTradeCertified: false }],
    priceCents: 780,
    // Rondelle bead: 13.6mm tall x 15.6mm wide.
    availableSizesMm: [13.6],
    thicknessMm: 15.6,
    contactWidthMm: 13.9,
    sameCrystalContactWidthMm: 13.6,
    preserveImageAspectRatio: true,
    blurb: 'Polished silver sheen obsidian rondelles — deep black crystal with smoky silver flashes, glossy highlights and a low rounded profile for a sleek protective strand.',
  },
  {
    slug: 'rose-dark-rose',
    name: 'Rose Quartz Rose',
    color: 'Soft Pink',
    hex: '#e9c4c8',
    // Single carved rose image; all roses in the source sheet are near-identical.
    images: ['/beads/rose-dark-rose.png'],
    colorGroup: 'pink',
    chakra: ['heart', 'crown'],
    zodiac: ['taurus', 'libra'],
    element: 'water',
    intention: ['love', 'compassion', 'healing', 'calm'],
    hardness: 7,
    formation: 'igneous',
    origin: ['Brazil', 'Madagascar'],
    sourcing: [{ region: 'Brazil', method: 'small-scale', fairTradeCertified: true }],
    priceCents: 980,
    // Temporary listing size: exact rose dimensions were not provided yet.
    availableSizesMm: [14],
    blurb: 'A carved rose quartz flower bead — soft pink, glossy and gently translucent, carrying a tender heart-centred feel.',
  },
  {
    slug: 'yellow-agate-round',
    name: 'Yellow Agate Round',
    color: 'Golden Yellow',
    hex: '#d99b2f',
    // Uniform round yellow agate bead cut from the latest white-background
    // source image. This stone is visually consistent, so one sprite is enough.
    images: [`/beads/yellow-agate-round.png?v=${YELLOW_AGATE_ROUND_ASSET_VERSION}`],
    paletteImage: `/beads/yellow-agate-round.png?v=${YELLOW_AGATE_ROUND_ASSET_VERSION}`,
    colorGroup: 'yellow',
    chakra: ['solar-plexus', 'sacral'],
    zodiac: ['leo', 'gemini', 'aries'],
    element: 'earth',
    intention: ['grounding', 'energy', 'creativity', 'balance'],
    hardness: 7,
    formation: 'igneous',
    origin: ['China', 'Brazil', 'India'],
    sourcing: [{ region: 'China', method: 'small-scale', fairTradeCertified: false }],
    priceCents: 120,
    availableSizesMm: [6.5, 8.5],
    blurb: 'Polished yellow agate round beads in warm golden-yellow tones with glossy highlights and soft natural clouding for a bright, steady strand.',
  },
  {
    slug: 'citrine-nugget',
    name: 'Citrine Nugget',
    color: 'Honey Yellow',
    hex: '#d99b2f',
    // Irregular tumbled nuggets: the palette shows one representative bead,
    // while each added bracelet bead gets a random natural silhouette.
    images: CITRINE_NUGGET_VARIANTS,
    paletteImage: '/beads/citrine-nugget.png',
    colorGroup: 'yellow',
    chakra: ['solar-plexus', 'sacral'],
    zodiac: ['leo', 'gemini', 'aries'],
    element: 'fire',
    intention: ['abundance', 'energy', 'creativity', 'clarity'],
    hardness: 7,
    formation: 'igneous',
    origin: ['Brazil', 'Madagascar'],
    sourcing: [{ region: 'Brazil', method: 'small-scale', fairTradeCertified: false }],
    priceCents: 760,
    // Temporary listing size: exact nugget dimensions were not provided yet.
    availableSizesMm: [10],
    blurb: 'Irregular tumbled citrine nuggets — honey-gold, glossy and full of natural inclusions. Each bead has a different silhouette, so the bracelet feels organic and bright.',
  },
  {
    slug: 'yanyuan-agate',
    name: 'Yanyuan Agate',
    color: 'Coral / Rose / Lavender',
    hex: '#e87042',
    // Side profile on the bracelet ring (random per bead); flat donut face in the palette.
    images: YANYUAN_AGATE_VARIANTS,
    paletteImage: `/beads/yanyuan-agate.png?v=${YANYUAN_AGATE_ASSET_VERSION}`,
    colorGroup: 'red',
    chakra: ['root', 'sacral', 'heart'],
    zodiac: ['leo', 'aries', 'scorpio'],
    element: 'fire',
    intention: ['energy', 'courage', 'grounding', 'love'],
    hardness: 7,
    formation: 'sedimentary',
    origin: ['Yanyuan County, Sichuan (China)'],
    sourcing: [{ region: 'Yanyuan, Sichuan', method: 'small-scale', fairTradeCertified: false }],
    priceCents: 720,
    // Inventory: a single donut-cut size — 10mm diameter × 5mm thick.
    // The source side image is 10mm across its x-axis and about 5mm tall.
    // Rotate it so the 10mm diameter sits perpendicular to the bracelet line,
    // while packing/contact still uses the real 5mm center-hole thickness.
    availableSizesMm: [10],
    thicknessMm: 10,
    renderRotationOffsetDeg: -90,
    contactWidthMm: 5,
    sameCrystalContactWidthMm: 5,
    preserveImageAspectRatio: true,
    blurb: 'A donut-cut agate from Yanyuan, Sichuan — gentle coral, rose and lavender tones, each disc uniquely banded. Warms the heart and steadies the body.',
  },
  {
    slug: 'baby-bear-quartz',
    name: 'Baby Bear Quartz',
    color: 'Clear',
    hex: '#e6e6ec',
    // Single head-up carved bear image; no random variants.
    images: ['/beads/baby-bear-quartz.png'],
    colorGroup: 'white',
    chakra: ['heart', 'crown'],
    zodiac: ['cancer', 'pisces'],
    element: 'water',
    intention: ['love', 'compassion', 'healing', 'calm'],
    hardness: 7,
    formation: 'igneous',
    origin: ['Brazil', 'Madagascar'],
    sourcing: [{ region: 'Brazil', method: 'small-scale', fairTradeCertified: true }],
    priceCents: 880,
    // Head-to-foot drilled bear: 15.2mm along the hole × 11.8mm body width.
    availableSizesMm: [15.2],
    thicknessMm: 11.8,
    threadAxis: 'y',
    blurb: 'Hand-carved clear quartz baby bear charms — a head-to-toe drilled keepsake. Gentle, playful, and amplifies the warmth of any pairing.',
  },
  {
    slug: 'coral-jade-moon',
    name: 'Coral Jade Moon',
    color: 'Coral Red',
    hex: '#d35640',
    // Carved crescent moons from fossilised coral jade — the chrysanthemum
    // honeycomb pattern visible in each bead is the agatised coral polyps.
    // Drill hole runs left→right through the body (no pre-rotation needed).
    images: CORAL_JADE_MOON_VARIANTS,
    colorGroup: 'red',
    chakra: ['heart', 'sacral', 'root'],
    zodiac: ['cancer', 'pisces', 'scorpio'],
    element: 'water',
    intention: ['courage', 'energy', 'healing', 'balance'],
    hardness: 4,
    formation: 'biogenic',
    origin: ['Indonesia', 'Madagascar', 'Taiwan'],
    sourcing: [{ region: 'Indonesia', method: 'small-scale', fairTradeCertified: false }],
    priceCents: 980,
    // Carved crescent: 16.9mm height × 14mm threading width.
    availableSizesMm: [16.9],
    thicknessMm: 14,
    blurb: 'Hand-carved crescents of fossilised coral — the tiny flower-like cells in each bead are agatised coral polyps from an ancient sea. A grounded, life-affirming stone.',
  },
  {
    slug: 'coral-jade-star',
    name: 'Coral Jade Star',
    color: 'Coral / Amber',
    hex: '#d96b43',
    // Carved star beads from fossilised coral jade. The palette uses one
    // representative star; the designer randomly picks among all variants.
    images: CORAL_JADE_STAR_VARIANTS,
    paletteImage: '/beads/coral-jade-star.png',
    colorGroup: 'orange',
    chakra: ['heart', 'sacral', 'root'],
    zodiac: ['cancer', 'pisces', 'scorpio'],
    element: 'water',
    intention: ['courage', 'energy', 'healing', 'balance'],
    hardness: 4,
    formation: 'biogenic',
    origin: ['Indonesia', 'Madagascar', 'Taiwan'],
    sourcing: [{ region: 'Indonesia', method: 'small-scale', fairTradeCertified: false }],
    priceCents: 980,
    availableSizesMm: [16.5],
    blurb: 'Hand-carved star beads of fossilised coral jade — warm amber, coral and clay tones with tiny flower-like ancient coral cells in every piece.',
  },
  {
    slug: 'coral-jade-heart',
    name: 'Coral Jade Heart',
    color: 'Coral / Rose / Black',
    hex: '#c95642',
    // Carved heart beads from fossilised coral jade. The palette uses one
    // representative heart; the designer randomly picks among all variants.
    images: CORAL_JADE_HEART_VARIANTS,
    paletteImage: '/beads/coral-jade-heart.png',
    colorGroup: 'red',
    chakra: ['heart', 'sacral', 'root'],
    zodiac: ['cancer', 'pisces', 'scorpio'],
    element: 'water',
    intention: ['love', 'healing', 'courage', 'balance'],
    hardness: 4,
    formation: 'biogenic',
    origin: ['Indonesia', 'Madagascar', 'Taiwan'],
    sourcing: [{ region: 'Indonesia', method: 'small-scale', fairTradeCertified: false }],
    priceCents: 980,
    // Carved heart: 14mm height × 18mm visual width. The curved sides need a
    // tighter contact width so adjacent hearts visibly touch.
    availableSizesMm: [14],
    thicknessMm: 18,
    contactWidthMm: 16,
    sameCrystalContactWidthMm: 15.5,
    blurb: 'Hand-carved heart beads of fossilised coral jade — glossy hearts with warm coral, rose and dark natural patterning from ancient coral structures.',
  },
];

export const CRYSTALS: ReadonlyArray<Crystal> = raw.map((c) => CrystalSchema.parse(c));
export const ENCYCLOPEDIA_CRYSTALS: ReadonlyArray<Crystal> = CRYSTALS.filter((c) => c.category === 'crystal');

const bySlug = new Map(CRYSTALS.map((c) => [c.slug, c]));

/**
 * Renames a slug has had over its life — when an entry is renamed in the
 * catalog, add the old slug here so existing designs (in URLs, saved carts,
 * Zustand state) keep resolving instead of crashing.
 */
const SLUG_ALIASES: Record<string, string> = {
  'south-red-agate': 'yanyuan-agate',
  'clear-crackle-quartz': 'clear-quartz',
  'yanyuan-moon': 'coral-jade-moon',
  'blue-crystal': 'aquamarine',
  'gold-letter-spacer': 'gold-alphabet-a',
  'citrine-round': 'yellow-agate-round',
};

function resolveSlug(slug: string): string {
  return SLUG_ALIASES[slug] ?? slug;
}

export function getCrystal(slug: string): Crystal | undefined {
  return bySlug.get(resolveSlug(slug));
}

export function getCrystalOrThrow(slug: string): Crystal {
  const resolved = resolveSlug(slug);
  const c = bySlug.get(resolved);
  if (!c) throw new Error(`Unknown crystal: ${slug}${resolved !== slug ? ` (aliased to ${resolved})` : ''}`);
  return c;
}

export const CRYSTAL_SLUGS: ReadonlyArray<string> = CRYSTALS.map((c) => c.slug);
export const ENCYCLOPEDIA_CRYSTAL_SLUGS: ReadonlyArray<string> = ENCYCLOPEDIA_CRYSTALS.map((c) => c.slug);
// Wed May 27 21:46:32 BST 2026
