const { spawn } = require('child_process');
const path = require('path');

async function triggerWhatsAppNotification(itemName, remaining, threshold, customMessage = null) {
  const phone = process.env.WHATSAPP_NUMBER;
  const apiKey = process.env.WHATSAPP_API_KEY;

  if (!phone) {
    console.log('⚠️ WhatsApp notification skipped: WHATSAPP_NUMBER is not set in env.');
    return;
  }

  const message = customMessage || 
    (`*🚨 Nirvahana Low-Stock Alert*\n\n` +
    `Item: *${itemName}*\n` +
    `Remaining Stock: *${remaining}* units (Threshold: *${threshold}*)\n\n` +
    `*Action:* Please reorder stock immediately.`);

  if (apiKey) {
    console.log(`📱 Sending cloud WhatsApp notification via CallMeBot to ${phone}...`);
    try {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apiKey)}`;
      await fetch(url);
      console.log('✅ Cloud WhatsApp notification sent successfully.');
    } catch (err) {
      console.error('❌ Failed to send cloud WhatsApp notification:', err.message);
    }
  } else {
    console.log(`📱 Falling back to browser automation to send WhatsApp alert to ${phone}...`);
    const scriptPath = path.join(__dirname, './whatsapp_sender.py');
    const child = spawn('python', [scriptPath, phone, message], { shell: false });
    
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('close', (code) => {
      if (code !== 0) {
        console.error(`❌ WhatsApp browser automation failed with exit code ${code}`);
      } else {
        console.log(`✅ WhatsApp browser automation completed: ${stdout.trim()}`);
      }
      if (stderr) console.warn(`⚠️ Python stderr: ${stderr.trim()}`);
    });
  }
}

module.exports = { triggerWhatsAppNotification };
