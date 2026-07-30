import type { RefObject } from 'react';
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '../../../api/client';
import { describeSubmitError } from './submitError';
import { useToast } from '../../Toast/toastContext';
import { useInView } from '../../../motion/hooks/useInView';
import { useReducedMotion } from '../../../motion/hooks/useReducedMotion';
import { fadeUp, slideInLeft } from '../../../motion/variants';
import styles from './ContactSection.module.css';

const CONTACT_EMAIL = 'augustofreire02@gmail.com';

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

  const formRef = useRef<HTMLFormElement>(null);

  /**
   * Enter en el textarea inserta un salto de línea, no envía. El atajo real
   * para enviar sin sacar las manos del teclado es Ctrl/⌘ + Enter, y es lo que
   * anuncia la pista de abajo. Antes decía "enter para enviar", que era falso
   * justo en el campo donde el visitante pasa más tiempo.
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      // Sin esto, un usuario de lector de pantalla apretaba Enviar y no pasaba
      // nada audible: los mensajes aparecían en pantalla y el foco se quedaba
      // en el botón. Mover el foco al primer campo inválido hace que se lea su
      // label, su estado y el error asociado por `aria-describedby`.
      const firstInvalid = (['name', 'email', 'message'] as const).find(k => errs[k]);
      if (firstInvalid) {
        formRef.current
          ?.querySelector<HTMLElement>(`#c-${firstInvalid === 'message' ? 'msg' : firstInvalid}`)
          ?.focus();
      }
      return;
    }
    setErrors({});
    setSubmitErr(null);
    setSending(true);
    try {
      await apiClient('/api/contact', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setSuccess(true);
    } catch (err) {
      setSubmitErr(describeSubmitError(err));
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
            ¿Tenés un proyecto en mente? <em className={styles.leadAccent}>¡Escribime!</em>
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
            // Al enviar, el formulario entero se reemplaza por este bloque: el
            // botón que tenía el foco deja de existir y el foco se cae al body.
            // Un usuario de lector de pantalla no se enteraba de que el envío
            // había salido bien. `role="status"` lo anuncia y `tabIndex={-1}`
            // permite traer el foco acá sin agregar una parada de tabulación.
            <div
              className={styles.successBlock}
              role="status"
              tabIndex={-1}
              ref={el => el?.focus()}
            >
              {/* El cajón de guiones se lee carácter por carácter. Es
                  decoración: el texto de abajo ya dice lo mismo. */}
              <pre className={styles.ascii} aria-hidden="true">{`  ╔══════════════╗\n  ║   ✓ ENVIADO  ║\n  ╚══════════════╝`}</pre>
              <p className={styles.successMsg}>
                Mensaje enviado. Gracias {form.name || 'amigo'}. Te escribo a {form.email || 'tu email'}.
              </p>
              <button type="button" className={styles.resetBtn} onClick={reset}>
                Enviar otro
              </button>
            </div>
          ) : (
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              onKeyDown={handleKeyDown}
              noValidate
              className={styles.form}
            >
              {submitErr && (
                <div className={styles.formAlert} role="alert">
                  <p className={styles.formAlertMsg}>{submitErr}</p>
                  {/* Salida alternativa: el mensaje ya escrito viaja en el mailto,
                      así no hay que volver a tipearlo si el envío falla. */}
                  <a
                    className={styles.formAlertMail}
                    href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
                      `Contacto desde el portfolio${form.name ? ` — ${form.name}` : ''}`
                    )}&body=${encodeURIComponent(form.message)}`}
                  >
                    ↪ Escribirme por email ({CONTACT_EMAIL})
                  </a>
                </div>
              )}

              <div className={styles.row2}>
                <div className={styles.field}>
                  <label htmlFor="c-name">NOMBRE</label>
                  <input
                    id="c-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Tu nombre"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    className={errors.name ? styles.inputErr : ''}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'c-name-err' : undefined}
                  />
                  {errors.name && <span id="c-name-err" role="alert" className={styles.fieldErr}>{errors.name}</span>}
                </div>
                <div className={styles.field}>
                  <label htmlFor="c-email">EMAIL</label>
                  <input
                    id="c-email"
                    type="email"
                    autoComplete="email"
                    placeholder="tu@correo.com"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    className={errors.email ? styles.inputErr : ''}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'c-email-err' : undefined}
                  />
                  {errors.email && <span id="c-email-err" role="alert" className={styles.fieldErr}>{errors.email}</span>}
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
                {errors.message && <span id="c-msg-err" role="alert" className={styles.fieldErr}>{errors.message}</span>}
                <div className={styles.fieldMeta}>
                  {/* Decía "markdown ok" y el mensaje se envía y se muestra como
                      texto plano: no hay render de markdown en ningún lado. */}
                  <span className={styles.hint}>mínimo 12 caracteres · texto plano</span>
                  <span className={styles.charCount}>{form.message.length} chars</span>
                </div>
              </div>

              <div className={styles.formDivider} />

              <div className={styles.formActions}>
                <span className={styles.enterHint}>ctrl + ↵ para enviar</span>
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
