function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function sendLeadNotification(lead) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return {
      sent: false,
      skipped: true,
      reason: 'RESEND_API_KEY is not configured'
    };
  }

  const to =
    process.env.LEAD_NOTIFICATION_EMAIL ||
    'mohitkumarsingh7050@gmail.com';

  const from =
    process.env.RESEND_FROM_EMAIL ||
    'The Growth Basket <onboarding@resend.dev>';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#13231d">
      <h2 style="margin-bottom:8px">New Growth Enquiry</h2>

      <p style="color:#5f6f68">
        A new enquiry was submitted on The Growth Basket website.
      </p>

      <table style="width:100%;border-collapse:collapse;margin-top:20px">
        <tr>
          <td style="padding:10px;border:1px solid #ddd;font-weight:700">Name</td>
          <td style="padding:10px;border:1px solid #ddd">${escapeHtml(lead.name)}</td>
        </tr>

        <tr>
          <td style="padding:10px;border:1px solid #ddd;font-weight:700">Brand</td>
          <td style="padding:10px;border:1px solid #ddd">${escapeHtml(lead.brand)}</td>
        </tr>

        <tr>
          <td style="padding:10px;border:1px solid #ddd;font-weight:700">Phone</td>
          <td style="padding:10px;border:1px solid #ddd">${escapeHtml(lead.phone)}</td>
        </tr>

        <tr>
          <td style="padding:10px;border:1px solid #ddd;font-weight:700">Service</td>
          <td style="padding:10px;border:1px solid #ddd">${escapeHtml(lead.service)}</td>
        </tr>

        <tr>
          <td style="padding:10px;border:1px solid #ddd;font-weight:700;vertical-align:top">
            Message
          </td>
          <td style="padding:10px;border:1px solid #ddd;white-space:pre-wrap">
            ${escapeHtml(lead.message || '—')}
          </td>
        </tr>

        <tr>
          <td style="padding:10px;border:1px solid #ddd;font-weight:700">Lead ID</td>
          <td style="padding:10px;border:1px solid #ddd">${escapeHtml(lead.id)}</td>
        </tr>
      </table>
    </div>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',

    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },

    body: JSON.stringify({
      from,
      to: [to],
      subject: `New Growth Enquiry — ${lead.name} / ${lead.brand}`,
      html
    })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('Lead notification email failed:', payload);

    return {
      sent: false,
      skipped: false,
      reason:
        payload?.message ||
        'Email provider rejected the request'
    };
  }

  return {
    sent: true,
    skipped: false,
    id: payload?.id || null
  };
}

module.exports = {
  sendLeadNotification
};
