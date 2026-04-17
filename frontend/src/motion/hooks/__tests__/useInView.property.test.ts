/**
 * Property-based test for useInView once behavior.
 *
 * **Validates: Requirements 3.4, 11.4**
 *
 * Property 6: useInView fires only once per element
 * For any element using the `useInView` hook with `once: true`, the `isInView`
 * value SHALL transition from `false` to `true` at most once per page session,
 * regardless of how many times the element enters and exits the viewport.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// ── Track calls to framer-motion's useInView ──────────────────────
// Use vi.hoisted so the mock variable is available inside the vi.mock factory
const { mockFramerUseInView } = vi.hoisted(() => ({
  mockFramerUseInView: vi.fn(),
}));

vi.mock('framer-motion', () => ({
  useInView: mockFramerUseInView,
}));

// Import AFTER mock is in place
import { useInView } from '../useInView';

// ── Property 6: useInView fires only once per element ─────────────

describe('Property 6 — useInView fires only once per element', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFramerUseInView.mockReturnValue(false);
  });

  // ── Default options ───────────────────────────────────────────────

  it('passes once:true to framer-motion useInView by default', () => {
    renderHook(() => useInView());

    expect(mockFramerUseInView).toHaveBeenCalledOnce();
    const [, options] = mockFramerUseInView.mock.calls[0];
    expect(options.once).toBe(true);
  });

  it('passes amount:0.15 to framer-motion useInView by default', () => {
    renderHook(() => useInView());

    const [, options] = mockFramerUseInView.mock.calls[0];
    expect(options.amount).toBe(0.15);
  });

  it('passes margin:"0px 0px -60px 0px" to framer-motion useInView by default', () => {
    renderHook(() => useInView());

    const [, options] = mockFramerUseInView.mock.calls[0];
    expect(options.margin).toBe('0px 0px -60px 0px');
  });

  it('returns { ref, isInView } with isInView=false when element is not in view', () => {
    mockFramerUseInView.mockReturnValue(false);
    const { result } = renderHook(() => useInView());

    expect(result.current).toHaveProperty('ref');
    expect(result.current).toHaveProperty('isInView');
    expect(result.current.isInView).toBe(false);
  });

  it('returns isInView=true when framer-motion reports element is in view', () => {
    mockFramerUseInView.mockReturnValue(true);
    const { result } = renderHook(() => useInView());

    expect(result.current.isInView).toBe(true);
  });

  // ── once:true prevents re-triggering ─────────────────────────────

  it('with once:true, isInView stays true after first entry (does not reset to false)', () => {
    // Simulate: element enters viewport → isInView becomes true
    // With once:true, framer-motion's useInView will not return false again
    // after the first true. We verify our hook passes once:true so this behavior
    // is delegated correctly to framer-motion.
    mockFramerUseInView.mockReturnValue(true);
    const { result } = renderHook(() => useInView());

    expect(result.current.isInView).toBe(true);

    // Verify once:true was passed — this is what prevents re-triggering
    const [, options] = mockFramerUseInView.mock.calls[0];
    expect(options.once).toBe(true);
  });

  it('with once:true default, isInView transitions to true at most once across multiple renders', () => {
    // Simulate multiple renders: first false (not in view), then true (entered), stays true
    mockFramerUseInView
      .mockReturnValueOnce(false)  // initial: not in view
      .mockReturnValueOnce(false)  // still not in view
      .mockReturnValueOnce(true)   // entered viewport
      .mockReturnValueOnce(true);  // stays true (once:true prevents reset)

    const { result, rerender } = renderHook(() => useInView());

    expect(result.current.isInView).toBe(false);
    rerender();
    expect(result.current.isInView).toBe(false);
    rerender();
    expect(result.current.isInView).toBe(true);
    rerender();
    // With once:true, stays true — does not go back to false
    expect(result.current.isInView).toBe(true);
  });

  // ── Custom options override defaults ──────────────────────────────

  it('custom once:false overrides the default once:true', () => {
    renderHook(() => useInView({ once: false }));

    const [, options] = mockFramerUseInView.mock.calls[0];
    expect(options.once).toBe(false);
  });

  it('custom amount overrides the default 0.15', () => {
    renderHook(() => useInView({ amount: 0.5 }));

    const [, options] = mockFramerUseInView.mock.calls[0];
    expect(options.amount).toBe(0.5);
  });

  it('custom margin overrides the default margin', () => {
    renderHook(() => useInView({ margin: '0px' }));

    const [, options] = mockFramerUseInView.mock.calls[0];
    expect(options.margin).toBe('0px');
  });

  it('all three custom options can be overridden simultaneously', () => {
    renderHook(() => useInView({ once: false, amount: 0.8, margin: '-10px' }));

    const [, options] = mockFramerUseInView.mock.calls[0];
    expect(options.once).toBe(false);
    expect(options.amount).toBe(0.8);
    expect(options.margin).toBe('-10px');
  });

  // ── Parametric: once:true holds for various amount thresholds ─────

  const AMOUNT_VALUES = [0, 0.1, 0.15, 0.25, 0.5, 1.0];

  it.each(AMOUNT_VALUES)(
    'once:true is always passed regardless of amount=%f',
    (amount) => {
      renderHook(() => useInView({ amount }));

      const [, options] = mockFramerUseInView.mock.calls[0];
      expect(options.once).toBe(true);
      expect(options.amount).toBe(amount);
    }
  );

  // ── Requirement 11.4: once:true prevents repeated animation triggers ──

  it('Req 11.4 — once:true is the default, preventing repeated animation triggers on scroll', () => {
    // Requirement 11.4: WHEN useInView is configured, THE Motion_System SHALL
    // set once:true to prevent repeated animation triggers on scroll.
    renderHook(() => useInView());

    const [, options] = mockFramerUseInView.mock.calls[0];
    expect(options.once).toBe(true);
  });

  it('Req 3.4 — with once:true, hook does not re-trigger after element exits and re-enters viewport', () => {
    // Requirement 3.4: WHEN once is true, THE useInView hook SHALL trigger the
    // animation only the first time the element enters the viewport and SHALL NOT
    // re-trigger on subsequent scroll events.
    //
    // We verify this by confirming once:true is passed to framer-motion's useInView,
    // which is responsible for the once behavior at the IntersectionObserver level.
    renderHook(() => useInView({ once: true }));

    const [, options] = mockFramerUseInView.mock.calls[0];
    expect(options.once).toBe(true);
  });

  it('hook returns a ref object (not null)', () => {
    mockFramerUseInView.mockReturnValue(false);
    const { result } = renderHook(() => useInView());

    // ref should be a React ref object with a current property
    expect(result.current.ref).toBeDefined();
    expect(result.current.ref).toHaveProperty('current');
  });

  it('hook called with no arguments uses all defaults', () => {
    renderHook(() => useInView());

    expect(mockFramerUseInView).toHaveBeenCalledOnce();
    const [, options] = mockFramerUseInView.mock.calls[0];
    expect(options).toEqual({
      once: true,
      amount: 0.15,
      margin: '0px 0px -60px 0px',
    });
  });

  it('hook called with empty options object uses all defaults', () => {
    renderHook(() => useInView({}));

    const [, options] = mockFramerUseInView.mock.calls[0];
    expect(options).toEqual({
      once: true,
      amount: 0.15,
      margin: '0px 0px -60px 0px',
    });
  });
});
