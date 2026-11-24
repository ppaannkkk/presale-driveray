module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(200).send('Bot is active');

    const TOKEN = (process.env.BOT_TOKEN || '').trim();
    const ADMIN_ID = (process.env.ADMIN_ID || '').trim();

    if (!TOKEN || !ADMIN_ID) {
      console.error('Нет BOT_TOKEN или ADMIN_ID в настройках Vercel');
      return res.status(200).send('Missing env vars');
    }

    // Надёжно читаем JSON от Telegram, даже если req.body пустой
    let body = req.body;
    if (!body || typeof body === 'string') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString('utf8');
      body = raw ? JSON.parse(raw) : {};
    }

    const msg = body.message;
    if (!msg) return res.status(200).end();

    const tgApi = `https://telegram.org{TOKEN}`;
    const chatId = String(msg.chat.id);
    const text = msg.text || '';

    // 1. Приветствие на /start (чистое, без рекламы)
    if (text === '/start' && chatId !== ADMIN_ID) {
      await fetch(`${tgApi}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: 'Привет! Команда DRIVE RAY на связи ⚡️\n\nСюда можно отправить заявку с сайта, уточнить мерки для ошейника или шлейки и задать любой вопрос по первой партии. Пиши прямо в этот чат — скоро ответим!'
        })
      });
      return res.status(200).end();
    }

    // 2. Пересылаем сообщение клиента вам
    if (chatId !== ADMIN_ID) {
      await fetch(`${tgApi}/forwardMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_ID,
          from_chat_id: chatId,
          message_id: msg.message_id
        })
      });
    } 
    // 3. Ваш ответ (Reply) клиенту
    else if (msg.reply_to_message && msg.reply_to_message.forward_from) {
      await fetch(`${tgApi}/copyMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: msg.reply_to_message.forward_from.id,
          from_chat_id: ADMIN_ID,
          message_id: msg.message_id
        })
      });
    }

    return res.status(200).end();
  } catch (err) {
    console.error('Ошибка бота:', err);
    return res.status(200).end();
  }
};
