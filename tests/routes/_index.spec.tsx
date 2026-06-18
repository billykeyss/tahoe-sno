import { createRoutesStub } from 'react-router';
import { render, screen } from '@testing-library/react';
import App from '../../app/app';

test('renders the homepage hero', async () => {
  const ReactRouterStub = createRoutesStub([
    {
      path: '/',
      Component: App,
    },
  ]);

  render(<ReactRouterStub />);

  // Unique to the hero subtitle (avoids matching the footer's "SIERRA NEVADA").
  await screen.findByText(/Hourly snow, wind and snowpack telemetry/i);
});
