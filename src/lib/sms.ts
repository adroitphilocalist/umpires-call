/**
 * Utility to send SMS.
 * Automatically tries to send real SMS if API keys are found in the environment.
 * Supported APIs: Fast2SMS (India) and Twilio (Global).
 * Falls back to Console logging if no keys are found.
 */
export async function sendSMS(phone: string, text: string): Promise<boolean> {
  // 1. FAST2SMS (Cost-effective for Indian numbers)
  if (process.env.FAST2SMS_API_KEY) {
    try {
      const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          "authorization": process.env.FAST2SMS_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          route: "q",
          message: text,
          language: "english",
          flash: 0,
          numbers: phone.replace("+91", ""), // Fast2SMS expects a 10 digit number without country code
        })
      });
      const data = await response.json();
      if (data.return) {
        console.log('[SMS] Fast2SMS sent successfully to', phone);
        return true;
      }
      console.error('[SMS error] Fast2SMS rejected the request:', data);
    } catch (e) {
      console.error('[SMS error] Fast2SMS fetch error:', e);
    }
  }

  // 2. TWILIO (Global provider)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
      
      const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      
      const formData = new URLSearchParams();
      formData.append('To', phone);
      formData.append('From', twilioPhone);
      formData.append('Body', text);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });
      
      if (response.ok) {
        console.log('[SMS] Twilio message sent successfully to', phone);
        return true;
      }
      const errData = await response.json();
      console.error('[SMS error] Twilio failure:', errData);
      return false; // Return false instead of falling back to mock
    } catch (e) {
      console.error('[SMS error] Twilio fetch error:', e);
      return false;
    }
  }

  // 3. FALLBACK TO MOCK (If no API keys are present)
  console.log('\n=============================================');
  console.log(`[SMS MOCK] Sending to: ${phone}`);
  console.log(`[SMS MOCK] Message: ${text}`);
  console.log('=============================================\n');
  console.warn('NOTE: No FAST2SMS_API_KEY or Twilio credentials found in .env. Falling back to console logging.');
  
  return true;
}
