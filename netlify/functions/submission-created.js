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

    const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:system-ui,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#a855f7);border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:rgba(255,255,255,0.7);letter-spacing:2px;text-transform:uppercase;">Portafolio Personal</p>
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;">&#128236; Nuevo mensaje</h1>
            </td>
          </tr>

          <tr>
            <td style="background:#16171d;padding:36px 40px;border-left:1px solid #2a2d3a;border-right:1px solid #2a2d3a;">

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td style="background:#1e1f28;border-radius:8px;padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">De</p>
                    <p style="margin:0;font-size:17px;font-weight:600;color:#f3f4f6;">${name}</p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td style="background:#1e1f28;border-radius:8px;padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Email</p>
                    <a href="mailto:${email}" style="margin:0;font-size:15px;color:#a855f7;text-decoration:none;">${email}</a>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#1e1f28;border-radius:8px;padding:16px 20px;border-left:3px solid #a855f7;">
                    <p style="margin:0 0 8px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Mensaje</p>
                    <p style="margin:0;font-size:15px;color:#d1d5db;line-height:1.7;">${message.replace(/\n/g, '<br/>')}</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td style="background:#13141a;border-radius:0 0 12px 12px;border:1px solid #2a2d3a;border-top:none;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#4b5563;">
                Recibido desde tu portafolio &middot;
                <a href="https://github.com/Guss-dev-py" style="color:#a855f7;text-decoration:none;">github.com/Guss-dev-py</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await resend.emails.send({
      from: 'Portafolio <onboarding@resend.dev>',
      to: 'augustofreire02@gmail.com',
      replyTo: email,
      subject: `Nuevo mensaje de ${name} — Portafolio`,
      html,
    });

    return { statusCode: 200, body: 'OK' };
  } catch (err) {
    console.error('Error:', err);
    return { statusCode: 500, body: String(err) };
  }
};
