/**
 * Accesibilidad del formulario de contacto (Fase 5).
 *
 * Cubre tres arreglos que salieron de la auditoría WCAG 2.2:
 * - los campos no declaraban su propósito (`autocomplete`) — 1.3.5
 * - al enviar con errores no pasaba nada audible — 3.3.1
 * - la pista decía "enter para enviar", falso dentro del textarea
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../../motion/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

import { ContactSection } from '../ContactSection';

function renderContact() {
  return render(
    <MemoryRouter>
      <ContactSection />
    </MemoryRouter>
  );
}

describe('ContactSection · accesibilidad del formulario', () => {
  it('declara el propósito de nombre y email (WCAG 1.3.5)', () => {
    renderContact();

    expect(screen.getByLabelText('NOMBRE')).toHaveAttribute('autocomplete', 'name');
    expect(screen.getByLabelText('EMAIL')).toHaveAttribute('autocomplete', 'email');
  });

  it('al enviar vacío anuncia los errores y manda el foco al primer campo inválido', () => {
    const { container } = renderContact();

    fireEvent.click(screen.getByRole('button', { name: /enviar mensaje/i }));

    // role="alert" hace que el lector de pantalla los lea sin mover el foco.
    const alertas = container.querySelectorAll('[role="alert"]');
    expect(alertas.length).toBeGreaterThan(0);
    expect(screen.getByText('Nombre requerido')).toBeInTheDocument();

    // Y el foco aterriza donde hay que corregir, no queda en el botón.
    expect(document.activeElement).toBe(screen.getByLabelText('NOMBRE'));
    expect(screen.getByLabelText('NOMBRE')).toHaveAttribute('aria-invalid', 'true');
  });

  it('el foco va al primer campo inválido, no siempre al primero del form', () => {
    renderContact();

    fireEvent.change(screen.getByLabelText('NOMBRE'), { target: { value: 'Augusto' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar mensaje/i }));

    expect(document.activeElement).toBe(screen.getByLabelText('EMAIL'));
  });

  it('la pista de teclado dice la verdad: ctrl + enter, no enter', () => {
    renderContact();

    // Enter suelto dentro del textarea inserta un salto de línea; prometer que
    // envía era falso justo en el campo donde más tiempo pasa el visitante.
    expect(screen.getByText(/ctrl \+ ↵ para enviar/i)).toBeInTheDocument();
    expect(screen.queryByText(/^↵ enter para enviar$/i)).not.toBeInTheDocument();
  });

  it('ctrl + enter dispara el envío desde el textarea', () => {
    renderContact();

    const textarea = screen.getByLabelText('MENSAJE');
    fireEvent.change(textarea, { target: { value: 'Un mensaje suficientemente largo' } });
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });

    // Nombre y email siguen vacíos: si el atajo no hubiera enviado, no habría
    // errores de validación en pantalla.
    expect(screen.getByText('Nombre requerido')).toBeInTheDocument();
  });

  it('enter solo, dentro del textarea, no envía', () => {
    renderContact();

    const textarea = screen.getByLabelText('MENSAJE');
    fireEvent.change(textarea, { target: { value: 'Un mensaje suficientemente largo' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(screen.queryByText('Nombre requerido')).not.toBeInTheDocument();
  });

  it('no promete un render de markdown que no existe', () => {
    renderContact();

    expect(screen.queryByText(/markdown ok/i)).not.toBeInTheDocument();
    expect(screen.getByText(/texto plano/i)).toBeInTheDocument();
  });
});
