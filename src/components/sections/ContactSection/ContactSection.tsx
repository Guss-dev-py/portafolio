import { useState } from 'react';
import type { ContactLink, ContactFormData, FieldError } from '../../../types';
import styles from './ContactSection.module.css';

interface ContactSectionProps {
  links: ContactLink[];
}

const PLATFORM_ICONS: Record<string, string> = {
  linkedin: '💼',
  github: '🐙',
  email: '✉️',
  website: '🌐',
};

function validate(data: ContactFormData): FieldError[] {
  const errors: FieldError[] = [];
  if (!data.name.trim()) errors.push({ field: 'name', message: 'El nombre es requerido' });
  if (!data.email.trim()) {
    errors.push({ field: 'email', message: 'El email es requerido' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push({ field: 'email', message: 'El email no es válido' });
  }
  if (!data.message.trim()) errors.push({ field: 'message', message: 'El mensaje es requerido' });
  return errors;
}

export function ContactSection({ links }: ContactSectionProps) {
  const [form, setForm] = useState<ContactFormData>({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const getError = (field: keyof ContactFormData) =>
    errors.find((e) => e.field === field)?.message;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    setSubmitted(true);
  };

  return (
    <section id="contacto" className={styles.section} aria-label="Contacto">
      <div className={styles.container}>
        <h2 className={styles.title}>Contacto</h2>
        <p className={styles.subtitle}>¿Tenés un proyecto en mente? Hablemos.</p>

        {links.length > 0 && (
          <ul className={styles.links}>
            {links.map((link) => (
              <li key={link.platform}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  <span aria-hidden="true">{PLATFORM_ICONS[link.platform] ?? '🔗'}</span>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        )}

        <div className={styles.formWrapper}>
          {submitted ? (
            <p className={styles.success} role="status">
              ¡Mensaje enviado! Me pondré en contacto pronto.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              <div className={styles.field}>
                <label htmlFor="contact-name">Nombre</label>
                <input
                  id="contact-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  aria-describedby={getError('name') ? 'error-name' : undefined}
                  className={getError('name') ? styles.inputError : ''}
                />
                {getError('name') && <span id="error-name" className={styles.error} role="alert">{getError('name')}</span>}
              </div>

              <div className={styles.field}>
                <label htmlFor="contact-email">Email</label>
                <input
                  id="contact-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  aria-describedby={getError('email') ? 'error-email' : undefined}
                  className={getError('email') ? styles.inputError : ''}
                />
                {getError('email') && <span id="error-email" className={styles.error} role="alert">{getError('email')}</span>}
              </div>

              <div className={styles.field}>
                <label htmlFor="contact-message">Mensaje</label>
                <textarea
                  id="contact-message"
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  aria-describedby={getError('message') ? 'error-message' : undefined}
                  className={getError('message') ? styles.inputError : ''}
                />
                {getError('message') && <span id="error-message" className={styles.error} role="alert">{getError('message')}</span>}
              </div>

              <button type="submit" className={styles.submit}>Enviar mensaje</button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
