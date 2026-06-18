import { useEffect, useState } from 'react';
import { useWeatherAggregates } from '../services/weatherStore';

// Mood is chosen from the region's best 24h fresh number so the hero reflects
// reality; both the keyword and the tagline are random picks from that mood's
// pools, varied independently for more variety.
interface Mood {
  min: number;
  ems: string[];
  tags: string[];
}

const MOODS: Mood[] = [
  {
    min: 25,
    ems: ['dumping.', 'puking.', 'going off.', 'getting buried.', 'all-time.'],
    tags: [
      'Drop everything.',
      'Call in sick.',
      "It's a powder day.",
      'Chase the storm.',
      'Faceshots all day.',
      'Send it.',
    ],
  },
  {
    min: 12,
    ems: ['storming.', 'firing.', 'stacking up.', 'loaded.', 'dialed in.'],
    tags: [
      'Pick your line.',
      'First chair, no excuses.',
      'Chains on, go.',
      'The Sierra delivers.',
      'Set an early alarm.',
    ],
  },
  {
    min: 4,
    ems: ['topping up.', 'freshening.', 'filling in.', 'waking up.', 'softening.'],
    tags: [
      'Fresh up high.',
      'Soft turns up top.',
      'Worth the drive.',
      'Hero snow on the groomers.',
      'Better than it looks.',
    ],
  },
  {
    min: 1,
    ems: ['dusted.', 'frosted.', 'skiffed.', 'barely dusted.', 'lightly on.'],
    tags: [
      'A little fell overnight.',
      'Just a dusting.',
      'Refreshed but thin.',
      'Take what you can get.',
      'Edges out.',
    ],
  },
  {
    min: 0,
    ems: ['quiet.', 'dry.', 'still.', 'napping.', 'sun-baked.', 'bone dry.'],
    tags: [
      'No new snow yet.',
      "Patience — it's coming.",
      'Wax up and wait.',
      'Bluebird and bare.',
      'Dreaming of December.',
      'Off-season calm.',
    ],
  },
];

function moodFor(max24h: number): Mood {
  return MOODS.find((m) => max24h >= m.min) ?? MOODS[MOODS.length - 1];
}

/**
 * Condition-aware hero headline with a random keyword + tagline, e.g.
 * "Tahoe is storming. Pick your line." or "Tahoe is sun-baked. Off-season calm."
 */
export function HeroHeadline({ place }: { place: string }) {
  const { max24h } = useWeatherAggregates();

  // Seed stays 0 for the prerender + first client render (deterministic, no
  // hydration mismatch); a real random pick lands right after mount.
  const [seed, setSeed] = useState(0);
  useEffect(() => {
    setSeed(1 + Math.floor(Math.random() * 9973));
  }, []);

  const mood = moodFor(max24h);
  const em = mood.ems[seed % mood.ems.length];
  // Derive the tagline index from a different slice of the seed so the keyword
  // and tagline don't move in lockstep.
  const tag = mood.tags[Math.floor(seed / mood.ems.length) % mood.tags.length];

  return (
    <h1>
      {place} is <em>{em}</em> {tag}
    </h1>
  );
}
