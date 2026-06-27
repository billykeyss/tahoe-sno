import { useState } from 'react';
import { ResortCard } from './ResortCard';
import { BestConditions } from './BestConditions';
import resortsConfig from '../config/resorts.json';

export interface Resort {
  id: string;
  name: string;
  weatherUnlockedId: number;
  elevation: {
    base: number;
    summit: number;
  };
  coordinates: {
    lat: number;
    lon: number;
  };
  region: string;
  status: string;
  country?: string;
}

interface ResortGridProps {
  country?: string;
  featuredResorts?: string[];
}

// Featured stations for the default landing view — Mt Rose pinned first,
// followed by the Tahoe Local Pass resorts.
const FEATURED_RESORTS = ['mtrose', 'heavenly', 'northstar', 'kirkwood'];

const FEATURED_KEY = '__featured__';
const ALL_KEY = '__all__';

const pad2 = (n: number) => String(n).padStart(2, '0');

export function ResortGrid({
  country = 'usa',
  featuredResorts = FEATURED_RESORTS,
}: ResortGridProps) {
  const { resorts } = resortsConfig;

  const countryResorts = resorts.filter((resort) => {
    const resortCountry = resort.country || 'usa';
    return resort.status === 'active' && resortCountry === country;
  });

  const featuredResortsData = countryResorts
    .filter((resort) => featuredResorts.includes(resort.id))
    .sort((a, b) => featuredResorts.indexOf(a.id) - featuredResorts.indexOf(b.id));

  const otherResorts = countryResorts
    .filter((resort) => !featuredResorts.includes(resort.id))
    .sort((a, b) => {
      if (a.region !== b.region) return a.region.localeCompare(b.region);
      return a.name.localeCompare(b.name);
    });

  const groupedOtherResorts = Object.entries(
    otherResorts.reduce((acc, resort) => {
      (acc[resort.region] ||= []).push(resort);
      return acc;
    }, {} as Record<string, typeof otherResorts>)
  );

  const featuredInfo =
    country === 'canada'
      ? { title: 'Big 3 Lift Ticket', sub: 'Banff & Lake Louise' }
      : { title: 'Featured', sub: 'Mt Rose & Tahoe Local Pass' };

  // Region filter tabs: All · <featured> · each region.
  const tabs = [
    { key: ALL_KEY, label: 'All', count: countryResorts.length },
    ...(featuredResortsData.length
      ? [
          {
            key: FEATURED_KEY,
            label: featuredInfo.title,
            count: featuredResortsData.length,
          },
        ]
      : []),
    ...groupedOtherResorts.map(([region, list]) => ({
      key: region,
      label: region,
      count: list.length,
    })),
  ];

  // Default to the compact featured view so the page opens uncluttered.
  const [active, setActive] = useState<string>(
    featuredResortsData.length ? FEATURED_KEY : ALL_KEY
  );

  const showFeatured =
    featuredResortsData.length > 0 &&
    (active === ALL_KEY || active === FEATURED_KEY);

  const visibleGroups =
    active === ALL_KEY
      ? groupedOtherResorts
      : active === FEATURED_KEY
      ? []
      : groupedOtherResorts.filter(([region]) => region === active);

  return (
    <>
      <BestConditions />

      <div className="region-tabs" role="tablist" aria-label="Filter by region">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active === tab.key}
            className={`region-tab${active === tab.key ? ' active' : ''}`}
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
            <span className="rt-count">{pad2(tab.count)}</span>
          </button>
        ))}
      </div>

      {showFeatured && (
        <section>
          <div className="sec-head">
            <h2>{featuredInfo.title}</h2>
            <span className="rule" />
            <span className="count">
              {pad2(featuredResortsData.length)} STATIONS ·{' '}
              {featuredInfo.sub.toUpperCase()}
            </span>
          </div>
          <div className="grid">
            {featuredResortsData.map((resort) => (
              <ResortCard key={resort.id} resort={resort as Resort} />
            ))}
          </div>
        </section>
      )}

      {visibleGroups.map(([region, regionResorts]) => (
        <section key={region}>
          <div className="sec-head">
            <h2>{region}</h2>
            <span className="rule" />
            <span className="count">
              {pad2(regionResorts.length)} STATION
              {regionResorts.length !== 1 ? 'S' : ''}
            </span>
          </div>
          <div className="grid">
            {regionResorts.map((resort) => (
              <ResortCard key={resort.id} resort={resort as Resort} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
