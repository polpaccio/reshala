(() => {
  'use strict';
  const find = id => document.getElementById(id);
  const dialog = find('profileDialog');
  const login = find('telegramLogin');
  const status = find('profileLoginStatus');
  const authKey = 'omni-telegram-auth-v1';
  const sessionKey = 'omni-telegram-profile-v1';
  let config, activeUser, expiryTimer, pendingCleanup, attempt = 0;
  const defaultAvatar = find('headerAvatar').innerHTML;
  const configPromise = fetch('telegram-config.json', {cache:'no-store'})
    .then(response => { if (!response.ok) throw Error(); return response.json(); })
    .then(value => { if (!/^\d+$/.test(value.botId)) throw Error(); config = value; return value; });
  // Avoid an unhandled rejection if the visitor never opens their profile.
  configPromise.catch(() => {});

  function avatar(element, user) {
    element.replaceChildren();
    if (!user) { element.innerHTML = defaultAvatar; return; }
    element.textContent = (user.name || 'T').trim().split(/\s+/).slice(0,2).map(word => word[0]).join('').toUpperCase();
    if (!user.picture) return;
    try {
      const url = new URL(user.picture);
      if (url.protocol !== 'https:') return;
      const photo = document.createElement('img');
      photo.alt = ''; photo.referrerPolicy = 'no-referrer';
      photo.addEventListener('error', () => photo.remove(), {once:true});
      photo.src = url.href; element.append(photo);
    } catch {}
  }
  function render(user) {
    activeUser = user;
    window.dispatchEvent(new CustomEvent('omni-profile-change'));
    avatar(find('headerAvatar'), user); avatar(find('profileAvatar'), user);
    find('headerProfileName').textContent = user ? user.name : 'Твой профиль';
    find('headerProfileStatus').textContent = user ? 'Telegram подключён' : 'Войти через Telegram';
    find('profileTrigger').setAttribute('aria-label', user ? `Открыть профиль: ${user.name}` : 'Открыть личный профиль');
    find('profileTitle').textContent = user ? user.name : 'Давай познакомимся.';
    find('profileDescription').textContent = user ? 'Твоё пространство. Твой темп. Омнибот рядом.' : 'Твоё имя и фото из Telegram — здесь, рядом с Омниботом.';
    find('profileGuest').hidden = !!user; find('profileMember').hidden = !user;
    find('profileUsername').textContent = user?.preferred_username ? `@${user.preferred_username}` : '';
    const link = find('openTelegramProfile');
    // Telegram usernames have a restricted alphabet; never turn arbitrary claims into URLs.
    const hasUsername = !!user && /^[a-zA-Z0-9_]{1,32}$/.test(user.preferred_username || '');
    link.hidden = !hasUsername;
    if (hasUsername) link.href = `https://t.me/${user.preferred_username}`;
    else link.removeAttribute('href');
  }
  function forget() {
    attempt++; clearTimeout(expiryTimer); if (pendingCleanup) pendingCleanup();
    try { sessionStorage.removeItem(sessionKey); sessionStorage.removeItem(authKey); } catch {}
    status.textContent = ''; login.disabled = false; render(null);
  }
  // Public display session only. Private APIs must validate Telegram's hash server-side.
  function normalize(data) {
    const now = Math.floor(Date.now()/1000);
    if (!data || !Number.isSafeInteger(data.id) || data.id <= 0 ||
        typeof data.first_name !== 'string' || !data.first_name.trim() ||
        !Number.isFinite(data.auth_date) || data.auth_date > now+60 || now-data.auth_date > 86400) throw Error('invalid');
    return {id:data.id, name:[data.first_name,data.last_name].filter(value => typeof value === 'string').join(' ').slice(0,160),
      preferred_username: typeof data.username === 'string' ? data.username : '',
      picture: typeof data.photo_url === 'string' ? data.photo_url : '', exp:data.auth_date+86400};
  }
  function save(user) {
    try { sessionStorage.setItem(sessionKey, JSON.stringify(user)); } catch {}
    clearTimeout(expiryTimer);
    expiryTimer = setTimeout(forget, Math.min((user.exp*1000)-Date.now(), 2147483647));
    status.textContent = ''; render(user);
  }
  find('profileTrigger').addEventListener('click', () => {
    if (!dialog.open) dialog.showModal();

  });
  find('closeProfile').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  find('profileLogout').addEventListener('click', forget);
  login.addEventListener('click', async () => {
    if (!config) {
      status.textContent = 'Подключаем Telegram…';
      try { await configPromise; status.textContent = 'Всё готово. Нажми «Войти через Telegram» ещё раз.'; }
      catch { status.textContent = 'Не удалось подключиться. Проверь соединение и попробуй ещё раз.'; }
      return;
    }
    if (pendingCleanup) pendingCleanup();
    const currentAttempt = ++attempt;
    const url = new URL('https://oauth.telegram.org/auth');
    url.search = new URLSearchParams({bot_id:config.botId, origin:location.origin, return_to:location.href, lang:'ru'});
    const popup = window.open(url.href, `omni_telegram_${config.botId}`, 'popup,width=550,height=650');
    if (!popup) { status.textContent = 'Разреши всплывающее окно Telegram и нажми ещё раз.'; return; }
    login.disabled = true; status.textContent = 'Заверши вход в окне Telegram.';
    let closePoll, timeout;
    const cleanup = () => {
      clearInterval(closePoll); clearTimeout(timeout); window.removeEventListener('message', onMessage);
      if (pendingCleanup === cleanup) pendingCleanup = null;
      login.disabled = false;
    };
    const onMessage = event => {
      if (event.origin !== 'https://oauth.telegram.org' || event.source !== popup || currentAttempt !== attempt) return;
      let data = event.data;
      try {
        if (typeof data === 'string') data = JSON.parse(data);
        if (data?.event !== 'auth_result') return;
        if (!data.result) { status.textContent = 'Вход отменён. Можно попробовать ещё раз.'; cleanup(); return; }
        const user = normalize(data.result);
        cleanup();
        try { sessionStorage.setItem(authKey, JSON.stringify(data.result)); } catch {}
        save(user);
        popup.close();
      } catch { cleanup(); status.textContent = 'Не удалось получить профиль. Попробуй войти ещё раз.'; }
    };
    window.addEventListener('message', onMessage);
    pendingCleanup = cleanup;
    closePoll = setInterval(() => {
      if (popup.closed) { cleanup(); status.textContent = 'Окно Telegram закрыто. Можно попробовать ещё раз.'; }
    }, 700);
    timeout = setTimeout(() => { cleanup(); status.textContent = 'Вход не завершён. Попробуй ещё раз.'; }, 180000);
  });
  render(null);
  try {
    const saved = JSON.parse(sessionStorage.getItem(sessionKey) || 'null');
    if (saved && Number.isSafeInteger(saved.id) && typeof saved.name === 'string' &&
        Number.isFinite(saved.exp) && saved.exp > Date.now()/1000 && saved.exp <= Date.now()/1000+86460) save(saved);
    else if (saved) forget();
  } catch { forget(); }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && activeUser && activeUser.exp*1000 <= Date.now()) forget(); });
})();
