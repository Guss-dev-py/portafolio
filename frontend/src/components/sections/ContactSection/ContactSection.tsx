import type { RefObject } from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '../../../api/client';
import { useToast } from '../../Toast/toastContext';
import { useInView } from '../../../motion/hooks/useInView';
import { useReducedMotion } from '../../../motion/hooks/useReducedMotion';
import { fadeUp, slideInLeft } from '../../../motion/variants';
import styles from './ContactSection.module.css';

interface FormData {
  name: string;
  email: string;
  message: string;
}

function validate(d: FormData): Record<string, string> {
  const e: Record<string, string> = {};
  if (!d.name.trim()) e.name = 'Nombre requerido';
  if (!d.email.trim()) e.email = 'Email requerido';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) e.email = 'Email inválido';
  if (d.message.length < 12) e.message = 'Mínimo 12 caracteres';
  return e;
}

export function ContactSection() {
  const { toast } = useToast();
  const reduced = useReducedMotion();
  const { ref, isInView } = useInView();
  const animate = reduced || isInView ? 'visible' : 'hidden';
  const [form, setForm] = useState<FormData>({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText('augustofreire02@gmail.com');
      toast({ title: '¡Copiado!', msg: 'augustofreire02@gmail.com', variant: 'ok' });
    } catch {
      toast({ title: 'Error', msg: 'No se pudo copiar', variant: 'danger' });
    }
  };

  const set = (k: keyof FormData, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitErr(null);
    setSending(true);
    try {
      await apiClient('/api/contact', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setSuccess(true);
    } catch {
      setSubmitErr('No se pudo enviar. Intentá de nuevo.');
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setSuccess(false);
    setForm({ name: '', email: '', message: '' });
    setErrors({});
    setSubmitErr(null);
  };

  return (
    <section id="contacto" className={styles.section} aria-label="Contacto" ref={ref as RefObject<HTMLElement>}>
      <motion.div className={styles.sectionHead} variants={fadeUp} initial="hidden" animate={animate}>
        <span className={styles.num}>03</span>
        <h2 className={styles.title}><span className={styles.sym}>//</span> contacto</h2>
        <span className={styles.meta}>respondo en menos de 24h · GMT-3</span>
      </motion.div>

      <div className={styles.twoCol}>
        {/* Left */}
        <motion.div className={styles.leftCol} variants={slideInLeft} initial="hidden" animate={animate}>
          <p className={styles.lead}>
            ¿Tenés un proyecto en mente o querés <em className={styles.leadAccent}>charlar de código</em>? Mandame un mensaje: te responde un humano.
          </p>

          <div className={styles.caLinks}>
            <button
              type="button"
              onClick={copyEmail}
              className={`${styles.caLink} ${styles.caButton}`}
              aria-label="Copiar email augustofreire02@gmail.com"
            >
              <span className={styles.caKey}>Email</span>
              <span className={styles.caVal}>augustofreire02@gmail.com</span>
              <span className={styles.caArrow} aria-hidden="true">→</span>
            </button>
            <a
              href="https://www.linkedin.com/in/augusto-freire-web"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.caLink}
              aria-label="LinkedIn: augusto-freire-web (abre en nueva pestaña)"
            >
              <span className={styles.caKey}>LinkedIn</span>
              <span className={styles.caVal}>in/augusto-freire-web</span>
              <span className={styles.caArrow} aria-hidden="true">→</span>
            </a>
            <a
              href="https://github.com/Guss-dev-py"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.caLink}
              aria-label="GitHub: Guss-dev-py (abre en nueva pestaña)"
            >
              <span className={styles.caKey}>GitHub</span>
              <span className={styles.caValAccent}>Guss-dev-py</span>
              <span className={styles.caArrow} aria-hidden="true">→</span>
            </a>
          </div>
        </motion.div>

        {/* Right: Form card */}
        <motion.div className={styles.formCard} variants={fadeUp} initial="hidden" animate={animate}>
          <div className={styles.formCardHead}>
            <span><span className={styles.sym}>//</span> formulario</span>
          </div>

          {success ? (
            <div className={styles.successBlock}>
              <pre className={styles.ascii}>{`  ╔══════════════╗\n  ║   ✓ ENVIADO  ║\n  ╚══════════════╝`}</pre>
              <p className={styles.successMsg}>
                Gracias {form.name || 'amigo'}. Te escribo a {form.email || 'tu email'}.
              </p>
              <button type="button" className={styles.resetBtn} onClick={reset}>
                Enviar otro
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className={styles.form}>
              {submitErr && (
                <div className={styles.formAlert} role="alert">{submitErr}</div>
              )}

              <div className={styles.row2}>
                <div className={styles.field}>
                  <label htmlFor="c-name">NOMBRE</label>
                  <input
                    id="c-name"
                    type="text"
                    placeholder="Tu nombre"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    className={errors.name ? styles.inputErr : ''}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'c-name-err' : undefined}
                  />
                  {errors.name && <span id="c-name-err" className={styles.fieldErr}>{errors.name}</span>}
                </div>
                <div className={styles.field}>
                  <label htmlFor="c-email">EMAIL</label>
                  <input
                    id="c-email"
                    type="email"
                    placeholder="tu@correo.com"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    className={errors.email ? styles.inputErr : ''}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'c-email-err' : undefined}
                  />
                  {errors.email && <span id="c-email-err" className={styles.fieldErr}>{errors.email}</span>}
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="c-msg">MENSAJE</label>
                <textarea
                  id="c-msg"
                  rows={8}
                  placeholder="Contame sobre el proyecto, plazo y stack..."
                  value={form.message}
                  onChange={e => set('message', e.target.value)}
                  className={`${styles.textareaMsg} ${errors.message ? styles.inputErr : ''}`}
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? 'c-msg-err' : undefined}
                />
                {errors.message && <span id="c-msg-err" className={styles.fieldErr}>{errors.message}</span>}
                <div className={styles.fieldMeta}>
                  <span className={styles.hint}>mínimo 12 caracteres · markdown ok</span>
                  <span className={styles.charCount}>{form.message.length} chars</span>
                </div>
              </div>

              <div className={styles.formDivider} />

              <div className={styles.formActions}>
                <span className={styles.enterHint}>↵ enter para enviar</span>
                <button type="submit" className={styles.submitBtn} disabled={sending} aria-busy={sending}>
                  {sending ? 'Enviando...' : 'Enviar mensaje →'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
