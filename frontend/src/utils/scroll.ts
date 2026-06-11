const NAV_HEIGHT = 60;

export function scrollToSection(id: string, offset = NAV_HEIGHT): void {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: 'smooth' });
}
