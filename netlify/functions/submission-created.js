const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event) => {
  console.log('Función disparada. Body:', event.body);

  try {
    const payload = JSON.parse(event.body || '{}');
    console.log('Payload completo:', JSON.stringify(payload));

    const data = payload.payload?.data || {};
    console.log('Data del formulario:', JSON.stringify(data));

    const name = data.name || 'Sin nombre';
    const email = data.email || '';
    const message = data.message || '';

    if (!email || !message) {
      console.log('Datos incompletos - email:', email, 'message:', message);
      return { statusCode: 400, body: 'Datos incompletos' };
    }

    console.log('Intentando enviar mail...');

    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'augustofreire02@gmail.com',
      replyTo: email,
      subject: `Nuevo mensaje de ${name} — Portafolio`,
      html: `
        <h2>Nuevo mensaje desde tu portafolio</h2>
        <p><strong>De:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${message}</p>
      `,
    });

    console.log('Resultado de Resend:', JSON.stringify(result));
    return { statusCode: 200, body: 'OK' };

  } catch (err) {
    console.error('Error completo:', err);
    return { statusCode: 500, body: String(err) };
  }
};
