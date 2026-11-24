export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('Bot is active');

  const TOKEN = process.env.BOT_TOKEN;
  const ADMIN_ID = process.env.ADMIN_ID;
  const tgApi = `https://telegram.org{TOKEN}`;

  const msg = req.body?.message;
  if (!msg) return res.status(200).end();

  const chatId = String(msg.chat.id);
  const text = msg.text || '';

  // 1. Приветствие при команде /start (без всякой рекламы!)
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

  // 2. Если пишет клиент — пересылаем его сообщение вам
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
  // 3. Если вы делаете "Ответить" (Reply) на пересланное сообщение — отправляем ответ клиенту
  else if (msg.reply_to_message?.forward_from) {
    const clientChatId = msg.reply_to_message.forward_from.id;
    await fetch(`${tgApi}/copyMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: clientChatId,
        from_chat_id: ADMIN_ID,
        message_id: msg.message_id
      })
    });
  }

  return res.status(200).end();
}
