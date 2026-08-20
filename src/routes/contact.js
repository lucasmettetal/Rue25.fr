import { Router } from 'express';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
import { isValidEmail, stripHeaderChars } from '../lib/utils.js';

const router = Router();

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Trop de messages envoyés, réessayez dans une heure' },
});

router.post('/', contactLimiter, async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Nom, email et message requis' });
  }
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Email invalide' });
  const safeName = stripHeaderChars(name);
  const safeSubject = subject ? stripHeaderChars(subject) : subject;

  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return res.status(503).json({ error: 'Service email non configuré' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transporter.sendMail({
      from: `Rue 25 <${process.env.SMTP_FROM || SMTP_USER}>`,
      to: SMTP_USER,
      replyTo: `${safeName} <${email}>`,
      subject: `[Contact] ${safeSubject || 'Nouveau message'} — ${safeName}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:540px;margin:0 auto;padding:40px 24px;background:#faf9f7">
          <p style="font-size:26px;margin:0 0 4px">Rue <em>25</em></p>
          <hr style="border:none;border-top:1px solid #e5e0d8;margin:16px 0 32px">
          <h2 style="font-size:18px;font-weight:normal;margin:0 0 16px">Nouveau message de ${escapeHtml(safeName)}</h2>
          <p style="color:#6b6459;font-size:13px;margin:0 0 4px">Email : <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
          ${safeSubject ? `<p style="color:#6b6459;font-size:13px;margin:0 0 24px">Sujet : ${escapeHtml(safeSubject)}</p>` : '<br>'}
          <div style="background:#fff;border:1px solid #e5e0d8;padding:20px;font-size:14px;line-height:1.7;color:#1a1a1a;white-space:pre-wrap">${escapeHtml(message)}</div>
        </div>
      `,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('[contact]', err.message);
    res.status(500).json({ error: 'Erreur lors de l\'envoi' });
  }
});

export default router;
