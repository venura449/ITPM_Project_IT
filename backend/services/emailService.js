const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Send a "new event published" notification email to multiple recipients.
 * @param {string[]} emails  - Array of recipient email addresses
 * @param {object}   event   - Mongoose event document
 */
const sendEventPublishedEmails = async (emails, event) => {
    if (!emails || emails.length === 0) return;

    const eventDate = new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px;">
            <h2 style="color:#1d4ed8;margin-bottom:4px;">New Event Published 🎉</h2>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin-bottom:20px;">
            <h3 style="margin-bottom:4px;">${event.title}</h3>
            <p style="color:#4b5563;margin:0 0 12px;">${event.description}</p>
            <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
                <tr>
                    <td style="padding:6px 0;color:#6b7280;width:100px;">Date</td>
                    <td style="padding:6px 0;font-weight:600;">${eventDate}</td>
                </tr>
                <tr>
                    <td style="padding:6px 0;color:#6b7280;">Location</td>
                    <td style="padding:6px 0;font-weight:600;">${event.location}</td>
                </tr>
                <tr>
                    <td style="padding:6px 0;color:#6b7280;">Faculty</td>
                    <td style="padding:6px 0;font-weight:600;">${event.faculty}</td>
                </tr>
                <tr>
                    <td style="padding:6px 0;color:#6b7280;">Category</td>
                    <td style="padding:6px 0;font-weight:600;">${event.category}</td>
                </tr>
            </table>
            <p style="color:#6b7280;font-size:13px;margin:0;">Log in to register for this event.</p>
        </div>
    `;

    await transporter.sendMail({
        from: `"Event System" <${process.env.EMAIL_USER}>`,
        bcc: emails,
        subject: `New Event: ${event.title}`,
        html,
    });
};

module.exports = { sendEventPublishedEmails };
