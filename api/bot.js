const https = require('https');

function tgRequest(token, method, data) {
  return new Promise((resolve) => {
    const payload = JSON.stringify(data);
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${token}/${method}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve(body));
    });
    req.on('error', (err) => {
      console.error('TG Error:', err);
      resolve(null);
    });
    req.write(payload);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('Bot is active');
  }

  const TOKEN = (process.env.BOT_TOKEN || '').trim();
  const ADMIN_ID = (process.env.ADMIN_ID || '').trim();

  if (!TOKEN || !ADMIN_ID) {
    return res.status(200).send('No env');
  }

  let body = req.body;
  if (!body || typeof body === 'string') {
    try {
      body = body ? JSON.parse(body) : {};
    } catch (e) {
      body = {};
    }
  }

  const msg = body && body.message;
  if (!msg || !msg.chat) {
    return res.status(200).send('OK');
  }

  const chatId = String(msg.chat.id);
  const text = msg.text || '';

  if (text === '/start' && chatId !== ADMIN_ID) {
    await tgRequest(TOKEN, 'sendMessage', {
      chat_id: chatId,
      text: 'Привет! Команда DRIVE RAY на связи ⚡️\n\nСюда можно отправить заявку с сайта, уточнить мерки для ошейника или шлейки и задать любой вопрос по первой партии. Пиши прямо в этот чат — скоро ответим!'
    });
    return res.status(200).send('OK');
  }

  if (chatId !== ADMIN_ID) {
    await tgRequest(TOKEN, 'forwardMessage', {
      chat_id: ADMIN_ID,
      from_chat_id: chatId,
      message_id: msg.message_id
    });
  } else if (msg.reply_to_message && msg.reply_to_message.forward_from) {
    await tgRequest(TOKEN, 'copyMessage', {
      chat_id: msg.reply_to_message.forward_from.id,
      from_chat_id: ADMIN_ID,
      message_id: msg.message_id
    });
  }

  return res.status(200).send('OK');
};
