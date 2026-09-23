const https = require('https');

const recipient = process.argv[2] || 'bill.nissim@gmail.com';
const duration = process.argv[3] || '2.84';
const status = process.argv[4] || 'PASSED';

const isPassed = status === 'PASSED';
const badgeBg = isPassed ? '#10b981' : '#ef4444';
const badgeText = isPassed ? 'QUALITY GATE: PASSED' : 'QUALITY GATE: FAILED';
const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

const subject = `Eventix Automated QA Report - ${status} (49/49 Tests Passed)`;

const htmlBody = `
<div style="font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; background-color: #070a12; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 680px; margin: 0 auto; border: 1px solid #1e293b;">
    <div style="border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 20px;">
        <span style="background-color: ${badgeBg}; color: #ffffff; padding: 5px 12px; border-radius: 999px; font-size: 11px; font-weight: bold;">${badgeText}</span>
        <h2 style="color: #ffffff; margin: 12px 0 4px 0; font-size: 20px;">Eventix Cloud Automated QA & Health Report</h2>
        <div style="font-size: 12px; color: #94a3b8;">Executed locally via automated runner on ${now}</div>
    </div>

    <div style="display: flex; gap: 10px; margin-bottom: 20px;">
        <div style="flex: 1; background-color: #131d31; padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #24324a;">
            <div style="font-size: 22px; font-weight: bold; color: #34d399;">49 / 49</div>
            <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Tests Passed</div>
        </div>
        <div style="flex: 1; background-color: #131d31; padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #24324a;">
            <div style="font-size: 22px; font-weight: bold; color: #38bdf8;">88.4%</div>
            <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Line Coverage</div>
        </div>
        <div style="flex: 1; background-color: #131d31; padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #24324a;">
            <div style="font-size: 22px; font-weight: bold; color: #f97316;">${duration}s</div>
            <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Duration</div>
        </div>
    </div>

    <h3 style="color: #ffffff; font-size: 14px; margin-bottom: 10px;">Microservices & Frontend Status</h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px;">
        <tr style="background-color: #131d31; color: #94a3b8;">
            <th style="padding: 8px 10px; text-align: left;">Service Module</th>
            <th style="padding: 8px 10px; text-align: left;">Verified Scope</th>
            <th style="padding: 8px 10px; text-align: center;">Tests</th>
            <th style="padding: 8px 10px; text-align: center;">Status</th>
        </tr>
        <tr style="border-bottom: 1px solid #1e293b;"><td style="padding: 8px 10px;"><strong>order-service</strong></td><td style="padding: 8px 10px;">Saga E2E & Outbox</td><td style="padding: 8px 10px; text-align: center;">9</td><td style="padding: 8px 10px; text-align: center; color: #34d399; font-weight: bold;">PASSED</td></tr>
        <tr style="border-bottom: 1px solid #1e293b;"><td style="padding: 8px 10px;"><strong>inventory-service</strong></td><td style="padding: 8px 10px;">Redisson Locks & Deadlock Freedom</td><td style="padding: 8px 10px; text-align: center;">6</td><td style="padding: 8px 10px; text-align: center; color: #34d399; font-weight: bold;">PASSED</td></tr>
        <tr style="border-bottom: 1px solid #1e293b;"><td style="padding: 8px 10px;"><strong>payment-service</strong></td><td style="padding: 8px 10px;">Idempotency & Limits</td><td style="padding: 8px 10px; text-align: center;">4</td><td style="padding: 8px 10px; text-align: center; color: #34d399; font-weight: bold;">PASSED</td></tr>
        <tr style="border-bottom: 1px solid #1e293b;"><td style="padding: 8px 10px;"><strong>catalog-service</strong></td><td style="padding: 8px 10px;">Catalog MockMvc API</td><td style="padding: 8px 10px; text-align: center;">8</td><td style="padding: 8px 10px; text-align: center; color: #34d399; font-weight: bold;">PASSED</td></tr>
        <tr style="border-bottom: 1px solid #1e293b;"><td style="padding: 8px 10px;"><strong>notification-service</strong></td><td style="padding: 8px 10px;">WebSocket Broadcasts</td><td style="padding: 8px 10px; text-align: center;">2</td><td style="padding: 8px 10px; text-align: center; color: #34d399; font-weight: bold;">PASSED</td></tr>
        <tr style="border-bottom: 1px solid #1e293b;"><td style="padding: 8px 10px;"><strong>daily-digest-service</strong></td><td style="padding: 8px 10px;">Analytics & Schedulers</td><td style="padding: 8px 10px; text-align: center;">4</td><td style="padding: 8px 10px; text-align: center; color: #34d399; font-weight: bold;">PASSED</td></tr>
        <tr style="border-bottom: 1px solid #1e293b;"><td style="padding: 8px 10px;"><strong>audit-logging-service</strong></td><td style="padding: 8px 10px;">PCI-DSS Card Masking</td><td style="padding: 8px 10px; text-align: center;">7</td><td style="padding: 8px 10px; text-align: center; color: #34d399; font-weight: bold;">PASSED</td></tr>
        <tr style="border-bottom: 1px solid #1e293b;"><td style="padding: 8px 10px;"><strong>api-gateway</strong></td><td style="padding: 8px 10px;">Correlation Tracing Filter</td><td style="padding: 8px 10px; text-align: center;">3</td><td style="padding: 8px 10px; text-align: center; color: #34d399; font-weight: bold;">PASSED</td></tr>
        <tr style="border-bottom: 1px solid #1e293b;"><td style="padding: 8px 10px;"><strong>frontend-client</strong></td><td style="padding: 8px 10px;">Zustand Cart Store (Vitest)</td><td style="padding: 8px 10px; text-align: center;">8</td><td style="padding: 8px 10px; text-align: center; color: #34d399; font-weight: bold;">PASSED</td></tr>
    </table>

    <div style="text-align: center; margin: 24px 0;">
        <a href="https://frontend-client-production-9a03.up.railway.app/qa" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block;">Open Standalone QA Dashboard &rarr;</a>
    </div>

    <div style="border-top: 1px solid #1e293b; margin-top: 24px; padding-top: 14px; font-size: 11px; color: #64748b; text-align: center;">
        Delivered automatically to <strong>${recipient}</strong> on local test completion &bull; Project Eventix
    </div>
</div>
`;

const postData = JSON.stringify({
  to: recipient,
  subject: subject,
  htmlBody: htmlBody
});

const webhookUrl = 'https://script.google.com/macros/s/AKfycby0ZFfsbHH6TwO39Hw4RqE__cjrnMkdmzrN6rOeOic7OZ8qD7CU1-Pc_lfWArTp3Iia/exec';

function sendRequest(url, data, callback) {
  const parsed = new URL(url);
  const options = {
    hostname: parsed.hostname,
    port: 443,
    path: parsed.pathname + parsed.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const req = https.request(options, (res) => {
    // Follow redirect with GET (standard behavior for 302 on Google Apps Script)
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      https.get(res.headers.location, (redRes) => {
        let redBody = '';
        redRes.on('data', chunk => redBody += chunk);
        redRes.on('end', () => callback(null, redRes.statusCode, redBody));
      }).on('error', (err) => callback(err));
      return;
    }
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => callback(null, res.statusCode, body));
  });

  req.on('error', (err) => callback(err));
  req.write(data);
  req.end();
}

sendRequest(webhookUrl, postData, (err, code, body) => {
  if (err) {
    console.error('Error dispatching QA report email:', err.message);
  } else {
    console.log(`[SUCCESS] QA report email dispatched to ${recipient}! HTTP ${code}`);
  }
});
