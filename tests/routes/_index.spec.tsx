import { createRoutesStub } from 'react-router';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import App from '../../app/app';

// MapLibre needs WebGL + Blob workers that jsdom lacks; the map is not under test.
vi.mock('../../app/components/RenoMap', () => ({ RenoMap: () => null }));

// The dashboard fetches /api/* on mount; stub fetch so the test stays offline.
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
});
afterEach(() => vi.unstubAllGlobals());

test('renders the Mt Rose dashboard hero', async () => {
  const ReactRouterStub = createRoutesStub([{ path: '/', Component: App }]);
  render(<ReactRouterStub />);

  await screen.findByText(/Mt Rose Ski Tahoe/i);
  expect(screen.getByText(/Reading the mountain/i)).toBeTruthy();
  expect(screen.getByText('Hwy 431')).toBeTruthy();
  expect(screen.getByText('Powder analysis')).toBeTruthy();
  expect(screen.getByText('Live cams on the highway')).toBeTruthy();
});
