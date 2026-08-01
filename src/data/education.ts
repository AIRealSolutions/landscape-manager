// Educational content for the public Lawn Care Guide (/learn).
// Ships with every company instance — a lead magnet and SEO surface.

export interface GrassType {
  slug: string
  name: string
  emoji: string
  season: 'cool' | 'warm'
  regions: string
  sun: string
  mowingHeight: string
  water: string
  traffic: string
  description: string
  pros: string[]
  cons: string[]
  careTips: string[]
}

export const GRASS_TYPES: GrassType[] = [
  {
    slug: 'kentucky-bluegrass',
    name: 'Kentucky Bluegrass',
    emoji: '💙',
    season: 'cool',
    regions: 'Northern & transition zones',
    sun: 'Full sun to light shade',
    mowingHeight: '2.5 – 3.5 in',
    water: '1 – 1.5 in per week',
    traffic: 'Good — self-repairs via rhizomes',
    description:
      'The classic dark-green, soft northern lawn. Kentucky Bluegrass spreads by underground rhizomes, so it knits into a dense, self-repairing carpet — the look most people picture when they think "perfect lawn."',
    pros: ['Beautiful dark color and fine texture', 'Self-repairs bare spots', 'Excellent cold hardiness'],
    cons: ['Slow to establish from seed', 'Higher water and fertilizer needs', 'Struggles in deep shade and extreme heat'],
    careTips: [
      'Feed 3–4 times per year; it is a heavy feeder',
      'Water deeply and less often to push roots down',
      'Overseed thin areas in early fall, not spring',
    ],
  },
  {
    slug: 'tall-fescue',
    name: 'Tall Fescue',
    emoji: '🌿',
    season: 'cool',
    regions: 'Transition zone & northern lawns',
    sun: 'Full sun to moderate shade',
    mowingHeight: '3 – 4 in',
    water: '1 in per week; drought tolerant',
    traffic: 'Very good',
    description:
      'The workhorse. Deep roots (2–3 feet) make tall fescue the most drought-tolerant cool-season grass, and modern turf-type varieties look far finer than the old pasture types. A top pick for busy families.',
    pros: ['Best drought tolerance of the cool-season grasses', 'Handles heat, shade, and traffic well', 'Low disease pressure'],
    cons: ['Clump-forming — does not self-repair, needs overseeding', 'Coarser blade than bluegrass'],
    careTips: [
      'Mow tall (3.5–4 in) in summer to shade roots',
      'Overseed every 1–2 falls to keep it dense',
      'Avoid overwatering — deep, infrequent soakings win',
    ],
  },
  {
    slug: 'perennial-ryegrass',
    name: 'Perennial Ryegrass',
    emoji: '⚡',
    season: 'cool',
    regions: 'Northern lawns & overseeding everywhere',
    sun: 'Full sun to light shade',
    mowingHeight: '2 – 3 in',
    water: '1 – 1.5 in per week',
    traffic: 'Excellent — used on sports fields',
    description:
      'The fastest grass out of the gate — it germinates in 5–7 days and takes traffic like a champ. Often blended with bluegrass and fescue for quick cover and wear resistance.',
    pros: ['Fastest germination of any lawn grass', 'Outstanding wear tolerance', 'Fine texture and glossy color'],
    cons: ['Less cold- and heat-hardy than other cool grasses', 'Clump-forming, no self-repair'],
    careTips: [
      'Perfect for overseeding thin lawns in fall',
      'Keep mower blades sharp — ryegrass shreds with dull blades',
      'Blend with bluegrass for a self-repairing lawn',
    ],
  },
  {
    slug: 'fine-fescue',
    name: 'Fine Fescue',
    emoji: '🌾',
    season: 'cool',
    regions: 'Northern lawns, shady properties',
    sun: 'The best shade grass — thrives with 4 hrs sun',
    mowingHeight: '2.5 – 3.5 in',
    water: 'Low — very drought tolerant once established',
    traffic: 'Light',
    description:
      'A family of needle-fine grasses (creeping red, chewings, hard fescue) that own the shade. If your lawn sits under mature trees, fine fescue is usually the answer — it also tolerates poor soil and needs little fertilizer.',
    pros: ['Best shade tolerance available', 'Very low fertilizer and water needs', 'Soft, fine texture'],
    cons: ['Cannot take heavy foot traffic', 'Struggles in hot, wet summers'],
    careTips: [
      'Ideal for low-maintenance and shaded lawns',
      'Do not overfertilize — one light fall feeding is often enough',
      'Mow higher in summer and skip mowing in drought',
    ],
  },
  {
    slug: 'bermuda',
    name: 'Bermuda Grass',
    emoji: '☀️',
    season: 'warm',
    regions: 'Southern lawns & transition zone',
    sun: 'Full sun only — 7+ hours',
    mowingHeight: '1 – 2 in',
    water: '1 in per week; very drought tough',
    traffic: 'Outstanding — the sports-turf standard',
    description:
      'The king of southern lawns. Bermuda loves heat, repairs itself aggressively from runners, and takes more abuse than any other grass. It wants sun, feeding, and frequent mowing — and rewards it with a dense, striped-fairway look.',
    pros: ['Extreme heat, drought, and wear tolerance', 'Rapid self-repair from stolons and rhizomes', 'Handles low mowing beautifully'],
    cons: ['No shade tolerance at all', 'Goes brown-dormant after frost', 'Can invade flower beds'],
    careTips: [
      'Mow low and often — every 4–5 days in peak summer',
      'Feed monthly through summer for that golf-course look',
      'Edge beds with a barrier; runners travel fast',
    ],
  },
  {
    slug: 'zoysia',
    name: 'Zoysia Grass',
    emoji: '🏝️',
    season: 'warm',
    regions: 'Southern lawns & warmer transition zone',
    sun: 'Full sun to light shade',
    mowingHeight: '1 – 2.5 in',
    water: 'Low once established',
    traffic: 'Very good',
    description:
      'Dense enough to walk on barefoot and thick enough to crowd out most weeds on its own. Zoysia grows slowly, needs less mowing than Bermuda, and handles light shade — a premium, low-input southern lawn.',
    pros: ['Extremely dense — naturally weed-resistant', 'Lower mowing frequency', 'Better shade tolerance than Bermuda'],
    cons: ['Slow to establish and slow to repair damage', 'Long brown dormancy in cooler areas', 'Can build thatch'],
    careTips: [
      'Dethatch or aerate yearly once mature',
      'Feed lightly — 2–3 lbs N per 1,000 sq ft per year is plenty',
      'Be patient: full coverage from plugs takes 1–2 seasons',
    ],
  },
  {
    slug: 'st-augustine',
    name: 'St. Augustine',
    emoji: '🌴',
    season: 'warm',
    regions: 'Gulf coast, Florida, coastal South',
    sun: 'Full sun to moderate shade',
    mowingHeight: '2.5 – 4 in',
    water: '1 in per week — not drought hardy',
    traffic: 'Moderate',
    description:
      'The broad-bladed, blue-green carpet of the Deep South. St. Augustine establishes fast from sod, tolerates coastal salt and more shade than any other warm-season grass.',
    pros: ['Best shade tolerance of the warm-season grasses', 'Fast coverage from sod or plugs', 'Salt tolerant — great near the coast'],
    cons: ['Needs regular water', 'Chinch bugs are a constant threat', 'No cold tolerance; sod only (no seed)'],
    careTips: [
      'Watch for chinch bug damage in hot, dry spells',
      'Mow tall — scalping invites weeds and stress',
      'Avoid weed-and-feed products with atrazine alternatives it cannot handle',
    ],
  },
  {
    slug: 'centipede',
    name: 'Centipede Grass',
    emoji: '🐛',
    season: 'warm',
    regions: 'Southeast — sandy, acidic soils',
    sun: 'Full sun to light shade',
    mowingHeight: '1.5 – 2 in',
    water: 'Low',
    traffic: 'Light',
    description:
      '"The lazy man\'s grass." Centipede grows slowly, needs almost no fertilizer, and stays a pleasant apple-green with minimal care. Perfect for homeowners who want an easy lawn over a showpiece.',
    pros: ['Lowest maintenance lawn grass in the South', 'Very low fertilizer needs', 'Thrives in acidic soil where others fail'],
    cons: ['Slow recovery from damage', 'Sensitive to over-fertilizing and high-pH soil', 'Limited cold tolerance'],
    careTips: [
      'Do NOT overfeed — one light feeding per year is enough',
      'Keep soil acidic; skip the lime unless a soil test says otherwise',
      'Water deeply during extended drought to prevent decline',
    ],
  },
]

export interface Weed {
  name: string
  emoji: string
  type: string
  identify: string
  prevention: string
  treatment: string
}

export const WEEDS: Weed[] = [
  {
    name: 'Crabgrass',
    emoji: '🦀',
    type: 'Annual grassy weed',
    identify: 'Coarse, light-green clumps that sprawl from a center like crab legs, showing up in thin areas and along driveway edges in early summer.',
    prevention: 'Apply pre-emergent when soil hits 55°F for several days (about when forsythia blooms). A thick lawn mowed tall is the best long-term defense — crabgrass seed needs sunlight to sprout.',
    treatment: 'Post-emergent crabgrass killer while plants are small; pull large clumps after rain. It dies at first frost — focus on preventing next year.',
  },
  {
    name: 'Dandelion',
    emoji: '🌼',
    type: 'Perennial broadleaf',
    identify: 'Yellow flowers over a flat rosette of toothed leaves; a single deep taproot; turns into the famous white puffball.',
    prevention: 'Dense turf and tall mowing shade out seedlings. Fall fertilization thickens the lawn before spring dandelion season.',
    treatment: 'Broadleaf herbicide in fall works best — the plant pulls it into the taproot. Hand-pull only works if you get the whole root; any left behind regrows.',
  },
  {
    name: 'White Clover',
    emoji: '🍀',
    type: 'Perennial broadleaf',
    identify: 'Three round leaflets, often with a pale crescent, and white ball-shaped flowers that draw bees. Spreads in low-nitrogen lawns.',
    prevention: "Clover moves in when grass is hungry — a proper nitrogen fertilization program is the real fix.",
    treatment: 'Broadleaf herbicide labeled for clover (triclopyr-based products work well). Some homeowners now keep a little clover for pollinators — a fine choice too.',
  },
  {
    name: 'Nutsedge',
    emoji: '🔺',
    type: 'Perennial sedge',
    identify: 'Looks like grass but grows twice as fast, shiny yellow-green, with a distinctly triangular stem — roll it in your fingers to feel the edges.',
    prevention: 'Fix drainage and avoid overwatering; nutsedge loves soggy soil. Pulling spreads it — each underground "nutlet" regrows.',
    treatment: 'Requires a sedge-specific herbicide (halosulfuron or sulfentrazone). Regular grass and broadleaf products do nothing to it.',
  },
  {
    name: 'Creeping Charlie',
    emoji: '🟣',
    type: 'Perennial broadleaf (ground ivy)',
    identify: 'Scalloped round leaves on square stems, small purple flowers, and a minty smell when mowed. Creeps through shady, moist areas rooting as it goes.',
    prevention: 'Improve light and airflow (prune trees), overseed shade-tolerant grass, and keep the lawn thick.',
    treatment: 'Triclopyr-based broadleaf herbicide in mid-fall, repeated if needed. One of the toughest lawn weeds — persistence wins.',
  },
  {
    name: 'Spurge',
    emoji: '🕸️',
    type: 'Annual broadleaf',
    identify: 'Low, flat mats with tiny dark-centered leaves that ooze milky sap when broken. Thrives in hot, dry, compacted spots and sidewalk cracks.',
    prevention: 'Pre-emergent in spring plus aeration — spurge is a compaction indicator. Healthy, tall-mowed turf shades it out.',
    treatment: 'Hand-pull small mats (wear gloves — sap irritates skin) or spot-spray with a broadleaf herbicide while young.',
  },
]

export interface Practice {
  title: string
  emoji: string
  summary: string
  tips: string[]
}

export const BEST_PRACTICES: Practice[] = [
  {
    title: 'Mow High, Mow Sharp',
    emoji: '🚜',
    summary:
      'The single biggest thing you control. Taller grass grows deeper roots, shades out weed seeds, and stays green longer in drought.',
    tips: [
      'Never remove more than 1/3 of the blade in one mowing',
      'Keep cool-season lawns at 3–4 inches, warm-season per type',
      'Sharpen mower blades at least twice a season — torn tips brown out',
      'Leave the clippings: they return free nitrogen to the soil',
      'Change mowing direction each time to avoid ruts and grain',
    ],
  },
  {
    title: 'Water Deep, Not Often',
    emoji: '💧',
    summary:
      'Frequent shallow watering trains shallow roots. One inch a week, delivered in 1–2 deep soakings, builds a lawn that shrugs off drought.',
    tips: [
      'Water early morning (4–9 am) — least evaporation, least disease',
      'Put out a tuna can: when it fills, you have applied about an inch',
      'Let the lawn tell you: footprints that linger mean it is thirsty',
      'Skip watering after rain — overwatering causes more problems than drought',
    ],
  },
  {
    title: 'Feed on a Schedule',
    emoji: '🧪',
    summary:
      'Fertilize when your grass type is actively growing — fall for northern lawns, summer for southern — not just when the store puts bags on sale.',
    tips: [
      'Cool-season lawns: the September feeding is the most important of the year',
      'Warm-season lawns: feed late spring through summer, never at dormancy',
      'A soil test every 2–3 years beats guessing on pH and nutrients',
      'Slow-release nitrogen gives steady color without surge growth',
    ],
  },
  {
    title: 'Aerate & Overseed',
    emoji: '🕳️',
    summary:
      'Core aeration relieves compaction and lets air, water, and roots move. Pairing it with overseeding is the fastest route from thin to thick.',
    tips: [
      'Aerate cool-season lawns in early fall, warm-season in late spring',
      'Leave the soil plugs — they break down and feed the lawn',
      'Overseed immediately after aerating; seeds nestle into the holes',
      'Keep new seed consistently moist for 2–3 weeks',
    ],
  },
  {
    title: 'Think Prevention, Not Rescue',
    emoji: '🛡️',
    summary:
      'A dense, healthy lawn prevents 90% of weed, insect, and disease problems before they start. Rescue treatments are always the expensive path.',
    tips: [
      'Pre-emergent in early spring stops crabgrass before it exists',
      'Fix the cause behind recurring problems: shade, drainage, compaction',
      'Walk the lawn weekly — most problems are cheap to fix when caught early',
      'Match the grass to the site: no grass thrives in the wrong spot',
    ],
  },
  {
    title: 'Work With the Seasons',
    emoji: '🍂',
    summary:
      'Each season has jobs that pay off for the rest of the year — and times when doing nothing is the right call.',
    tips: [
      'Spring: pre-emergent, first mow slightly lower to remove dead tips, tune the mower',
      'Summer: mow tall, water deep, stay off the lawn in extreme heat',
      'Fall: the power season — aerate, overseed, feed, keep mowing until growth stops',
      'Winter: avoid walking on frozen turf; service equipment; plan next year',
    ],
  },
]
