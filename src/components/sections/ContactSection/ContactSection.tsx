import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { ContactLink, ContactFormData, FieldError } from '../../../types';
import { apiClient } from '../../../api/client';
import { duration, ease, spring, stagger } from '../../../motion/tokens';
import { fadeUp, scaleIn, staggerContainer } from '../../../motion/variants';
import { useReducedMotion } from '../../../motion/hooks/useReducedMotion';
import { useInView } from '../../../motion/hooks/useInView';
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

const noop = { hidden: {}, visible: {} };

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
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const prefersReduced = useReducedMotion();
  const { ref: sectionRef, isInView } = useInView();

  const resolvedFadeUp = prefersReduced ? noop : fadeUp;
  const resolvedScaleIn = prefersReduced ? noop : scaleIn;
  const resolvedStagger = prefersReduced ? noop : staggerContainer(stagger.base);

  const animateState = isInView ? 'visible' : 'hidden';

  const handleCopyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail(null), 2500);
    } catch {
      // fallback silencioso
    }
  };

  const getError = (field: keyof ContactFormData) =>
    errors.find((e) => e.field === field)?.message;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    setSubmitError(null);
    setSending(true);

    try {
      await apiClient('/api/contact', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setSubmitted(true);
      setForm({ name: '', email: '', message: '' });
    } catch {
      setSubmitError('No se pudo enviar el mensaje. Por favor, intentá de nuevo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section
      id="contacto"
      className={styles.section}
      aria-label="Contacto"
      ref={sectionRef as React.RefObject<HTMLElement>}
    >
      <div className={styles.container}>
        <motion.h2
          className={styles.title}
          variants={resolvedFadeUp}
          initial="hidden"
          animate={animateState}
        >
          Contacto
        </motion.h2>
        <motion.p
          className={styles.subtitle}
          variants={resolvedFadeUp}
          initial="hidden"
          animate={animateState}
        >
          ¿Tenés un proyecto en mente? Hablemos.
        </motion.p>

        {links.length > 0 && (
          <motion.ul
            className={styles.links}
            variants={resolvedStagger}
            initial="hidden"
            animate={animateState}
          >
            {links.map((link) => (
              <motion.li key={link.platform} variants={resolvedScaleIn}>
                {link.platform === 'email' ? (
                  <motion.button
                    type="button"
                    className={styles.link}
                    onClick={() => handleCopyEmail(link.href.replace('mailto:', ''))}
                    whileHover={prefersReduced ? undefined : { y: -2, scale: 1.02, transition: spring.gentle }}
                    aria-label={`Copiar email ${link.label}`}
                  >
                    <span aria-hidden="true">{PLATFORM_ICONS[link.platform]}</span>
                    {link.label}
                  </motion.button>
                ) : (
                  <motion.a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                    whileHover={prefersReduced ? undefined : { y: -2, scale: 1.02, transition: spring.gentle }}
                  >
                    <span aria-hidden="true">{PLATFORM_ICONS[link.platform] ?? '🔗'}</span>
                    {link.label}
                  </motion.a>
                )}
              </motion.li>
            ))}
          </motion.ul>
        )}

        {copiedEmail && (
          <div className={styles.copyToast} role="status" aria-live="polite">
            ✓ Email copiado al portapapeles
          </div>
        )}

        <div className={styles.formWrapper}>
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.p
                key="success"
                className={styles.success}
                role="status"
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.96 }}
                transition={{ duration: duration.slow, ease: ease.expo }}
              >
                ¡Mensaje enviado! Me pondré en contacto pronto.
              </motion.p>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                className={styles.form}
                noValidate
              >
                {submitError && (
                  <p className={styles.error} role="alert">{submitError}</p>
                )}

                <motion.div
                  className={styles.fieldsContainer}
                  variants={resolvedStagger}
                  initial="hidden"
                  animate={animateState}
                >
                  <motion.div className={styles.field} variants={resolvedFadeUp}>
                    <label htmlFor="contact-name">Nombre</label>
                    <input
                      id="contact-name"
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      aria-describedby={getError('name') ? 'error-name' : undefined}
                      className={getError('name') ? styles.inputError : ''}
                    />
                    {getError('name') && <span id="error-name" className={styles.error} role="alert">{getError('name')}</span>}
                  </motion.div>

                  <motion.div className={styles.field} variants={resolvedFadeUp}>
                    <label htmlFor="contact-email">Email</label>
                    <input
                      id="contact-email"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      aria-describedby={getError('email') ? 'error-email' : undefined}
                      className={getError('email') ? styles.inputError : ''}
                    />
                    {getError('email') && <span id="error-email" className={styles.error} role="alert">{getError('email')}</span>}
                  </motion.div>

                  <motion.div className={styles.field} variants={resolvedFadeUp}>
                    <label htmlFor="contact-message">Mensaje</label>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={4}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      aria-describedby={getError('message') ? 'error-message' : undefined}
                      className={getError('message') ? styles.inputError : ''}
                    />
                    {getError('message') && <span id="error-message" className={styles.error} role="alert">{getError('message')}</span>}
                  </motion.div>
                </motion.div>

                <motion.button
                  type="submit"
                  className={styles.submit}
                  disabled={sending}
                  whileHover={prefersReduced ? undefined : { y: -2, scale: 1.02, transition: spring.gentle }}
                  whileTap={prefersReduced ? undefined : { scale: 0.96, transition: spring.press }}
                  animate={sending ? { opacity: [1, 0.6, 1] } : { opacity: 1 }}
                  transition={sending ? { repeat: Infinity, duration: 1.2 } : undefined}
                >
                  {sending ? 'Enviando...' : 'Enviar mensaje'}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <div className={styles.adminShortcut}>
          <Link to="/admin/login" className={styles.adminLink} aria-label="Admin">
            ·
          </Link>
        </div>
      </div>
    </section>
  );
}
