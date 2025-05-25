import { useState, useEffect } from 'react';
import { ResortCard } from './ResortCard';
import './ResortGrid.css';

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
  webcamUrl?: string;
}

const TAHOE_RESORTS: Resort[] = [
  {
    id: 'palisades',
    name: 'Palisades Tahoe',
    weatherUnlockedId: 552678,
    elevation: { base: 6200, summit: 9050 },
    coordinates: { lat: 39.1969, lon: -120.2357 },
  },
  {
    id: 'alpine',
    name: 'Alpine Meadows',
    weatherUnlockedId: 552679,
    elevation: { base: 6835, summit: 8637 },
    coordinates: { lat: 39.1566, lon: -120.2269 },
  },
  {
    id: 'northstar',
    name: 'Northstar California',
    weatherUnlockedId: 552681,
    elevation: { base: 6330, summit: 8610 },
    coordinates: { lat: 39.2734, lon: -120.1218 },
  },
  {
    id: 'heavenly',
    name: 'Heavenly',
    weatherUnlockedId: 552697,
    elevation: { base: 6540, summit: 10067 },
    coordinates: { lat: 38.9359, lon: -119.9391 },
  },
  {
    id: 'kirkwood',
    name: 'Kirkwood',
    weatherUnlockedId: 552690,
    elevation: { base: 7800, summit: 9800 },
    coordinates: { lat: 38.6867, lon: -120.0658 },
  },
  {
    id: 'sierra',
    name: 'Sierra-at-Tahoe',
    weatherUnlockedId: 552702,
    elevation: { base: 6640, summit: 8852 },
    coordinates: { lat: 38.7928, lon: -120.0908 },
  },
  {
    id: 'homewood',
    name: 'Homewood',
    weatherUnlockedId: 552688,
    elevation: { base: 6230, summit: 7880 },
    coordinates: { lat: 39.0831, lon: -120.1664 },
  },
  {
    id: 'diamond',
    name: 'Diamond Peak',
    weatherUnlockedId: 552683,
    elevation: { base: 6700, summit: 8540 },
    coordinates: { lat: 39.2549, lon: -119.923 },
  },
  {
    id: 'mtrose',
    name: 'Mt Rose',
    weatherUnlockedId: 552695,
    elevation: { base: 8260, summit: 9700 },
    coordinates: { lat: 39.3181, lon: -119.8862 },
  },
  {
    id: 'sugarbowl',
    name: 'Sugar Bowl',
    weatherUnlockedId: 552704,
    elevation: { base: 6883, summit: 8383 },
    coordinates: { lat: 39.3016, lon: -120.3663 },
  },
];

export function ResortGrid() {
  const [resorts, setResorts] = useState<Resort[]>(TAHOE_RESORTS);

  return (
    <section className="resort-grid-section">
      <h2 className="section-title">Lake Tahoe Ski Resorts</h2>
      <div className="resort-grid">
        {resorts.map((resort) => (
          <ResortCard key={resort.id} resort={resort} />
        ))}
      </div>
    </section>
  );
}
