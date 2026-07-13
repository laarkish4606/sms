import nodemailer from 'nodemailer';
import env from './env.js';

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    });
  }
  return transporter;
}

export async function sendEmail({ to, subject, html, text }) {
  if (!env.smtp.host) {
    // eslint-disable-next-line no-console
    console.warn(`[mailer] SMTP not configured — skipping email to ${to}: ${subject}`);
    return { skipped: true };
  }

  return getTransporter().sendMail({
    from: env.smtp.from,
    to,
    subject,
    html,
    text,
  });
}

export default sendEmail;
