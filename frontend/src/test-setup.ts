/// <reference types="vitest/globals" />
import '@testing-library/jest-dom';

// IntersectionObserver is not available in jsdom — mock it so framer-motion's useInView works
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

// ResizeObserver also missing in jsdom
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
vi.stubGlobal('ResizeObserver', MockResizeObserver);
