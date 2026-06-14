import nodemailer from 'nodemailer';

function getTransporter() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

const FROM = () => `Rue 25 <${process.env.SMTP_FROM || process.env.SMTP_USER}>`;

export async function sendOrderConfirmation({ to, name, reference, items, total }) {
  const transporter = getTransporter();
  if (!transporter) return;

  const rows = items.map(i => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #e5e0d8;color:#1a1a1a">
        ${i.name}${i.size ? ` <span style="color:#6b6459">— ${i.size}</span>` : ''} × ${i.quantity}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #e5e0d8;text-align:right;color:#1a1a1a">
        ${(Number(i.price) * i.quantity).toFixed(2)} €
      </td>
    </tr>
  `).join('');

  await transporter.sendMail({
    from: FROM(),
    to,
    subject: `Confirmation de commande — ${reference}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:540px;margin:0 auto;padding:40px 24px;color:#1a1a1a;background:#faf9f7">
        <p style="font-size:26px;margin:0 0 4px">Rue <em>25</em></p>
        <hr style="border:none;border-top:1px solid #e5e0d8;margin:16px 0 32px">
        <h1 style="font-size:22px;font-weight:normal;margin:0 0 8px">Merci, ${name}&nbsp;!</h1>
        <p style="color:#6b6459;margin:0 0 24px;font-size:14px">Votre commande a bien été enregistrée et sera traitée dans les plus brefs délais.</p>
        <p style="font-family:monospace;letter-spacing:3px;font-size:12px;color:#8b7355;margin:0 0 28px">${reference}</p>
        <table style="width:100%;border-collapse:collapse">
          ${rows}
          <tr>
            <td style="padding-top:20px;font-size:18px">Total payé</td>
            <td style="padding-top:20px;font-size:18px;text-align:right">${Number(total).toFixed(2)} €</td>
          </tr>
        </table>
        <hr style="border:none;border-top:1px solid #e5e0d8;margin:32px 0 24px">
        <p style="color:#6b6459;font-size:13px;margin:0">Nous vous contacterons dès que votre commande sera en préparation.</p>
        <p style="color:#6b6459;font-size:13px;margin:8px 0 0">— L'équipe Rue 25</p>
      </div>
    `,
  }).catch(err => console.error('[mailer] sendOrderConfirmation:', err.message));
}

export async function sendCustomOrderConfirmation({ to, name, reference, garmentType }) {
  const transporter = getTransporter();
  if (!transporter) return;

  await transporter.sendMail({
    from: FROM(),
    to,
    subject: `Demande sur-mesure reçue — ${reference}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:540px;margin:0 auto;padding:40px 24px;color:#1a1a1a;background:#faf9f7">
        <p style="font-size:26px;margin:0 0 4px">Rue <em>25</em></p>
        <hr style="border:none;border-top:1px solid #e5e0d8;margin:16px 0 32px">
        <h1 style="font-size:22px;font-weight:normal;margin:0 0 8px">Bonjour ${name},</h1>
        <p style="color:#6b6459;margin:0 0 16px;font-size:14px">
          Nous avons bien reçu votre demande sur-mesure pour <strong>${garmentType}</strong>.
        </p>
        <p style="font-family:monospace;letter-spacing:3px;font-size:12px;color:#8b7355;margin:0 0 28px">${reference}</p>
        <p style="color:#6b6459;font-size:14px;margin:0">Notre atelier vous contactera dans les 48h pour discuter de votre projet et établir un devis personnalisé.</p>
        <hr style="border:none;border-top:1px solid #e5e0d8;margin:32px 0 24px">
        <p style="color:#6b6459;font-size:13px;margin:0">— L'équipe Rue 25</p>
      </div>
    `,
  }).catch(err => console.error('[mailer] sendCustomOrderConfirmation:', err.message));
}
