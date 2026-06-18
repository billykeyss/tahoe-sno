import { render, screen, fireEvent } from '@testing-library/react';
import { SourceTip } from '../../app/components/SourceTip';

test('reveals the metric detail, source name and link on focus', () => {
  render(
    <SourceTip source="CDEC" detail="Measured base depth at Heavenly Valley">
      <span>120cm</span>
    </SourceTip>
  );

  expect(screen.getByText('120cm')).toBeTruthy();
  // tooltip hidden until interaction
  expect(screen.queryByRole('tooltip')).toBeNull();

  fireEvent.focus(screen.getByText('120cm').parentElement!);

  const tip = screen.getByRole('tooltip');
  expect(tip.textContent).toContain('Measured base depth');
  expect(tip.textContent).toContain('CDEC');

  const link = screen.getByRole('link');
  expect(link.getAttribute('href')).toContain('cdec.water.ca.gov');
});

test('hides the tooltip on blur', () => {
  render(
    <SourceTip source="NWS">
      <span>2</span>
    </SourceTip>
  );
  const wrap = screen.getByText('2').parentElement!;

  fireEvent.focus(wrap);
  expect(screen.getByRole('tooltip')).toBeTruthy();

  fireEvent.blur(wrap);
  expect(screen.queryByRole('tooltip')).toBeNull();
});
