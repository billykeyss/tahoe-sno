import { describe, test, expect } from 'vitest';
import {
  parseChainControls,
  parseClosures,
  TAHOE_ROUTES,
} from '../../server/sources/caltrans';

describe('parseChainControls', () => {
  const records = [
    {
      cc: {
        location: { route: 'SR-89', locationName: 'Luther Pass', postmile: '23.60' },
        statusData: { status: 'R-0', statusDescription: 'No chain controls are in effect at this time.' },
      },
    },
    {
      cc: {
        location: { route: 'I-80', locationName: 'Donner Summit', postmile: '180' },
        statusData: { status: 'R-2', statusDescription: 'Chains required except 4WD with snow tires.' },
      },
    },
    {
      cc: {
        location: { route: 'CA-99', locationName: 'Sacramento Valley' },
        statusData: { status: 'R-1', statusDescription: 'Chains or snow tires.' },
      },
    },
  ];

  test('keeps only the Tahoe corridors and maps R-codes to a status', () => {
    const result = parseChainControls(records, TAHOE_ROUTES);

    expect(result).toHaveLength(2);
    expect(result.find((c) => c.route === 'I-80')?.status).toBe('R2');
    expect(result.find((c) => c.route === 'SR-89')?.status).toBe('none');
    expect(result.find((c) => c.route === 'SR-89')?.location).toBe('Luther Pass');
  });
});

describe('parseClosures', () => {
  const records = [
    {
      lcs: {
        location: {
          begin: { beginRoute: 'I-80', beginLocationName: 'Floriston' },
          end: { endLocationName: 'Hinton Rd' },
        },
        closure: { typeOfClosure: 'Lane', typeOfWork: 'Emergency Work', lanesClosed: '2', totalExistingLanes: '2' },
      },
    },
    {
      lcs: {
        location: { begin: { beginRoute: 'CA-20', beginLocationName: 'Grass Valley' }, end: {} },
        closure: { typeOfClosure: 'Full', typeOfWork: 'Paving' },
      },
    },
  ];

  test('keeps only corridor closures and maps type + location', () => {
    const result = parseClosures(records, TAHOE_ROUTES);

    expect(result).toHaveLength(1);
    expect(result[0].route).toBe('I-80');
    expect(result[0].type).toBe('Lane');
    expect(result[0].location).toContain('Floriston');
  });
});
