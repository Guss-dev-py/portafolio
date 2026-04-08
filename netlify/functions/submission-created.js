const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event) => {
  try {
    const payload = JSON.parse(event.body || '{}');
    const data = payload.payload?.data || {};
    const name = data.name || 'Sin nombre';
    const email = data.email || '';
    const message = data.message || '';

    if (!email || !message) {
      return { statusCode: 400, body: 'Datos incompletos' };
    }

    const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:system-ui,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#a855f7);border-radius:12px 12px 0 0;padding:36px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;color:rgba(255,255,255,0.65);letter-spacing:2.5px;text-transform:uppercase;">Portafolio Personal</p>
            <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">&#128236; Nuevo mensaje</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#16171d;padding:36px 40px;border-left:1px solid #2a2d3a;border-right:1px solid #2a2d3a;">

            <!-- De -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
              <tr>
                <td style="background:#1e1f28;border-radius:8px;padding:16px 20px;">
                  <p style="margin:0 0 4px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1.2px;font-weight:600;">De</p>
                  <p style="margin:0;font-size:17px;font-weight:600;color:#f3f4f6;">${name}</p>
                </td>
              </tr>
            </table>

            <!-- Email -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
              <tr>
                <td style="background:#1e1f28;border-radius:8px;padding:16px 20px;">
                  <p style="margin:0 0 4px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1.2px;font-weight:600;">Email</p>
                  <a href="mailto:${email}" style="margin:0;font-size:15px;color:#a855f7;text-decoration:none;font-weight:500;">${email}</a>
                </td>
              </tr>
            </table>

            <!-- Mensaje -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#1e1f28;border-radius:8px;padding:20px;border-left:3px solid #a855f7;">
                  <p style="margin:0 0 10px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1.2px;font-weight:600;">Mensaje</p>
                  <p style="margin:0;font-size:15px;color:#d1d5db;line-height:1.75;">${message.replace(/\n/g, '<br/>')}</p>
                </td>
              </tr>
            </table>

            <!-- CTA responder -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
              <tr>
                <td align="center">
                  <a href="mailto:${email}?subject=Re: mensaje desde tu portafolio"
                     style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 32px;border-radius:8px;letter-spacing:0.2px;">
                    Responder a ${name}
                  </a>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#13141a;border-radius:0 0 12px 12px;border:1px solid #2a2d3a;border-top:none;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:13px;color:#4b5563;">
              Recibido desde
              <a href="https://augusto-freire-portafolio.netlify.app" style="color:#a855f7;text-decoration:none;">tu portafolio</a>
              &nbsp;&middot;&nbsp;
              <a href="https://github.com/Guss-dev-py" style="color:#a855f7;text-decoration:none;">GitHub</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await resend.emails.send({
      from: 'Portafolio <onboarding@resend.dev>',
      to: 'augustofreire02@gmail.com',
      replyTo: email,
      subject: `📬 Nuevo mensaje de ${name} — Portafolio`,
      html,
    });

    return { statusCode: 200, body: 'OK' };
  } catch (err) {
    console.error('Error:', err);
    return { statusCode: 500, body: String(err) };
  }
};
