require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');


const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEB_APP_URL;


const bot = new TelegramBot(token, { polling: true });
const users = {};


(async () => {
  try {
    await bot.setChatMenuButton({
      menu_button: { type: 'default' }
    });
    console.log('🌍 Global menu DEFAULT qilindi');
  } catch (e) {
    console.error('❌ Global reset error:', e.message);
  }
})();

/* -------------------------------
   /START
-------------------------------- */
bot.onText(/\/start/, async msg => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Menu YASHIRISH
    await bot.setChatMenuButton({
      chat_id: chatId,
      menu_button: { type: 'default' }
    });

    users[userId] = { step: 'waiting_name' };

    await bot.sendMessage(
      chatId,
      '👋 Assalomu alaykum!\n\n📝 Iltimos, ismingizni kiriting:'
    );

    console.log(`🆕 User ${userId} → MENU HIDDEN`);
  } catch (e) {
    console.error('❌ /start error:', e.message);
  }
});

/* -------------------------------
   ISM QABUL QILISH
-------------------------------- */
bot.on('message', async msg => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  if (!text || text.startsWith('/') || msg.contact) return;

  if (users[userId]?.step === 'waiting_name') {
    users[userId].name = text;
    users[userId].step = 'waiting_contact';

    await bot.sendMessage(chatId,
      `Rahmat, ${text}! 😊\n\n📞 Telefon raqamingizni yuboring:`,
      {
        reply_markup: {
          keyboard: [[{ text: '📱 Kontakt yuborish', request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      }
    );
  }
});

/* -------------------------------
   KONTAKT QABUL QILISH
-------------------------------- */
bot.on('contact', async msg => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (users[userId]?.step !== 'waiting_contact') return;

  users[userId].phone = msg.contact.phone_number;
  users[userId].step = 'completed';

  try {
    // 1️⃣ REMOVE
    await bot.setChatMenuButton({
      chat_id: chatId,
      menu_button: { type: 'default' }
    });

    // 2️⃣ WAIT
    await new Promise(r => setTimeout(r, 400));

    // 3️⃣ SET WEB APP
    await bot.setChatMenuButton({
      chat_id: chatId,
      menu_button: {
        type: 'web_app',
        text: '🚀 Ochish',
        web_app: { url: webAppUrl }
      }
    });

    await bot.sendMessage(
      chatId,
      '✅ *Muvaffaqiyatli ro‘yxatdan o‘tdingiz!*\n\n🚀 Endi tepadagi *Ochish* tugmasini bosing 👆',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          remove_keyboard: true,
          inline_keyboard: [
            [{ text: '🚀 Mini Appni ochish', web_app: { url: webAppUrl } }]
          ]
        }
      }
    );

    console.log(`✅ User ${userId} → MENU ENABLED`);
  } catch (e) {
    console.error('❌ Menu set error:', e.message);
  }
});

/* -------------------------------
   /CHECK
-------------------------------- */
bot.onText(/\/check/, async msg => {
  try {
    const btn = await bot.getChatMenuButton({ chat_id: msg.chat.id });

    let status = 'UNKNOWN';
    if (btn.type === 'web_app') status = '✅ YOQILGAN';
    if (btn.type === 'default') status = '🔒 YASHIRILGAN';
    if (btn.type === 'commands') status = '📜 COMMANDS';

    await bot.sendMessage(
      msg.chat.id,
      `*Menu holati:* ${status}\n\n\`\`\`json\n${JSON.stringify(btn, null, 2)}\n\`\`\``,
      { parse_mode: 'Markdown' }
    );
  } catch (e) {
    await bot.sendMessage(msg.chat.id, `❌ Xato: ${e.message}`);
  }
});
