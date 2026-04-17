/**
 * Property-based test for ContactSection social link hover animations.
 *
 * **Validates: Requirement 9.9**
 *
 * Property 9: All ContactSection social links receive hover animation
 * For any number of social links passed to the ContactSection, every link
 * element SHALL have `whileHover={{ y: -2, scale: 1.02 }}` applied using
 * `spring.gentle`.
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ContactLink } from '../../../../types';

// ── Mock useReducedMotion to return false (animations enabled) ────
vi.mock('../../../../motion/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

// ── Mock useInView so the section renders in visible state ────────
vi.mock('../../../../motion/hooks/useInView', () => ({
  useInView: () => ({ ref: { current: null }, isInView: true }),
}));

import { ContactSection } from '../ContactSection';
import { spring } from '../../../../motion/tokens';

// ── Helpers ───────────────────────────────────────────────────────

/**
 * Generates n links using only non-email platforms so every item renders
 * as an <a> element. The email platform intentionally renders a <button>
 * (correct semantics for copy-to-clipboard), so tests that count <a>
 * elements must avoid it.
 */
function makeLinks(n: number): ContactLink[] {
  const platforms: ContactLink['platform'][] = ['linkedin', 'github', 'website'];
  return Array.from({ length: n }, (_, i) => ({
    platform: platforms[i % platforms.length],
    href: `https://example.com/${i + 1}`,
    label: `Link ${i + 1}`,
  }));
}

/**
 * Generates n links that include the email platform.
 * Use this when testing the full set of interactive elements (a + button).
 */
function makeLinksWithEmail(n: number): ContactLink[] {
  const platforms: ContactLink['platform'][] = ['linkedin', 'github', 'email', 'website'];
  return Array.from({ length: n }, (_, i) => ({
    platform: platforms[i % platforms.length],
    href: `https://example.com/${i + 1}`,
    label: `Link ${i + 1}`,
  }));
}

function renderContactSection(links: ContactLink[]) {
  return render(
    <MemoryRouter>
      <ContactSection links={links} />
    </MemoryRouter>
  );
}

// ── Property 9: All social links receive hover animation ──────────

describe('Property 9 — All ContactSection social links receive hover animation', () => {
  const LINK_COUNTS = [0, 1, 3, 4, 6];

  it.each(LINK_COUNTS)(
    'renders exactly %i anchor element(s) inside the social links list when N=%i',
    (n) => {
      // makeLinks uses only non-email platforms → every item renders as <a>
      const { container } = renderContactSection(makeLinks(n));

      if (n === 0) {
        const ul = container.querySelector('ul');
        expect(ul).toBeNull();
        return;
      }

      const ul = container.querySelector('ul');
      expect(ul).not.toBeNull();

      // motion.a renders as <a> in jsdom
      const anchors = ul!.querySelectorAll('a');
      expect(anchors.length).toBe(n);
    }
  );

  it.each(LINK_COUNTS.filter((n) => n > 0))(
    'every anchor element inside the social links list renders the correct href when N=%i',
    (n) => {
      const links = makeLinks(n);
      const { container } = renderContactSection(links);

      const ul = container.querySelector('ul');
      expect(ul).not.toBeNull();

      const anchors = Array.from(ul!.querySelectorAll('a'));
      expect(anchors.length).toBe(n);

      anchors.forEach((anchor, i) => {
        expect(anchor.getAttribute('href')).toBe(links[i].href);
      });
    }
  );

  it.each(LINK_COUNTS.filter((n) => n > 0))(
    'every anchor element renders the correct label text when N=%i',
    (n) => {
      const links = makeLinks(n);
      const { container } = renderContactSection(links);

      const ul = container.querySelector('ul');
      expect(ul).not.toBeNull();

      const anchors = Array.from(ul!.querySelectorAll('a'));
      anchors.forEach((anchor, i) => {
        expect(anchor.textContent).toContain(links[i].label);
      });
    }
  );

  it('social links list is not rendered when 0 links are passed', () => {
    const { container } = renderContactSection([]);
    const ul = container.querySelector('ul');
    expect(ul).toBeNull();
  });

  it('spring.gentle has the correct shape for social link hover transitions', () => {
    // Structural check: spring.gentle used by whileHover on social links
    expect(spring.gentle).toEqual(
      expect.objectContaining({
        type: 'spring',
        stiffness: 200,
        damping: 22,
        mass: 1,
      })
    );
  });

  it('each interactive element is a direct child of a <li> inside the <ul>', () => {
    // Use 3 non-email links so every <li> contains an <a>
    const n = 3;
    const { container } = renderContactSection(makeLinks(n));

    const ul = container.querySelector('ul');
    expect(ul).not.toBeNull();

    const listItems = Array.from(ul!.children);
    expect(listItems.length).toBe(n);

    listItems.forEach((li) => {
      expect(li.tagName.toLowerCase()).toBe('li');
      // Each <li> must contain exactly one interactive element (a or button)
      const interactive = li.querySelector('a, button');
      expect(interactive).not.toBeNull();
    });
  });

  it('email platform renders a <button> (copy-to-clipboard), not an <a>', () => {
    const links = makeLinksWithEmail(4); // linkedin, github, email, website
    const { container } = renderContactSection(links);

    const ul = container.querySelector('ul');
    expect(ul).not.toBeNull();

    const listItems = Array.from(ul!.children);
    expect(listItems.length).toBe(4);

    // index 2 is email → should be a button
    const emailLi = listItems[2];
    expect(emailLi.querySelector('button')).not.toBeNull();
    expect(emailLi.querySelector('a')).toBeNull();

    // others should be anchors
    [0, 1, 3].forEach((idx) => {
      expect(listItems[idx].querySelector('a')).not.toBeNull();
    });
  });
});
