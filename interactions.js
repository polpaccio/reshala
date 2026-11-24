(() => {
  const select = s => document.querySelector(s);
  const all = s => [...document.querySelectorAll(s)];
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  // The site has one animated mode. Respect the device accessibility preference.
  try { localStorage.removeItem('reshala-motion'); } catch {}
  document.documentElement.classList.remove('motion-off');
  motionQuery.addEventListener('change', event => { reduced = event.matches; });

  // Closed navigation is hidden from the tab order too.
  const menuButton = select('.menu-toggle');
  const nav = select('#mainNav');
  function closeMenu() { nav.classList.remove('open'); menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Открыть меню'); }
  menuButton.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') !== 'true'; nav.classList.toggle('open', open); menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню'); });
  nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); menuButton.focus(); } });
  document.addEventListener('click', event => { if (!event.target.closest('header')) closeMenu(); });
  matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);

  let scrollFrame = 0;
  function updateScroll() {
    scrollFrame = 0;
    const maximum = document.documentElement.scrollHeight - innerHeight;
    select('.reading-progress > span').style.transform = `scaleX(${maximum > 0 ? Math.min(1, scrollY / maximum) : 0})`;
    select('#backTop').classList.toggle('visible', scrollY > 500);
  }
  window.addEventListener('scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll); }, {passive: true});
  window.addEventListener('resize', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll); }, {passive: true});
  updateScroll();
  const zones = new IntersectionObserver(entries => entries.forEach(entry => entry.target.classList.toggle('in-view', entry.isIntersecting)), {rootMargin: '80px'});
  all('.hero-art,.ticker,.impulse-card,.timer-panel').forEach(zone => { zone.classList.add('motion-zone'); zones.observe(zone); });
  const navSections = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) all('#mainNav a').forEach(link => link.classList.toggle('current', link.hash === '#' + entry.target.id)); }), {rootMargin:'-15% 0px -60% 0px'});
  all('main section[id]').forEach(section => navSections.observe(section));
  all('.interactive-card,.breathing-tool').forEach(element => { element.classList.add('reveal'); observer.observe(element); });

  document.addEventListener('pointerdown', event => {
    if (reduced) return;
    const button = event.target.closest('.button,.chip,.small-cta,.timer-start,.text-button');
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'click-ripple'; ripple.setAttribute('aria-hidden','true');
    ripple.style.left = `${event.clientX - rect.left}px`; ripple.style.top = `${event.clientY - rect.top}px`;
    button.append(ripple); ripple.addEventListener('animationend', () => ripple.remove(), {once:true});
    setTimeout(() => ripple.remove(), 700);
  }, {passive:true});
  let cheerTimeout;
  function cheer(message) {
    select('#botMood').textContent = message;
    const mascot = select('#mascot'); mascot.classList.remove('cheering');
    requestAnimationFrame(() => mascot.classList.add('cheering'));
    clearTimeout(cheerTimeout); cheerTimeout = setTimeout(() => mascot.classList.remove('cheering'), 800);
    ping();
  }
  select('#mascot').addEventListener('click', () => cheer('Мысли, дела и немного спокойствия.'));

  const storageKey = 'reshala-tasks-v1';
  let tasks = [];
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(saved)) tasks = saved.filter(item => item && typeof item.id === 'string' && typeof item.title === 'string').slice(0, 30).map(item => ({id:item.id, title:item.title.slice(0,100), done:Boolean(item.done)}));
  } catch {}
  const freeTaskLimit = 3;
  const accessKey = 'omni-task-access-v1';
  const createdKey = 'omni-created-tasks-v1';
  let tasksUnlocked = false;
  let plusActive = false;
  let tasksCreated = tasks.length;
  try {
    tasksUnlocked = localStorage.getItem(accessKey) === 'telegram-opened';
    const count = Number(localStorage.getItem(createdKey));
    if (Number.isSafeInteger(count) && count >= 0) tasksCreated = Math.max(tasksCreated, count);
  } catch {}
  const unlockDialog = select('#taskUnlockDialog');
  function openTaskUnlock() {
    if (tasksUnlocked || plusActive || unlockDialog.open) return;
    unlockDialog.showModal();
  }
  function closeTaskUnlock() { if (unlockDialog.open) unlockDialog.close(); }
  select('#closeTaskUnlock').addEventListener('click', closeTaskUnlock);
  select('#laterTaskUnlock').addEventListener('click', closeTaskUnlock);
  unlockDialog.addEventListener('click', event => {
    if (event.target !== unlockDialog) return;
    const rect = unlockDialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeTaskUnlock();
  });
  select('#unlockTaskLink').addEventListener('click', () => {
    // This is a browser-local unlock on visiting Telegram, not bot-side verification.
    tasksUnlocked = true;
    try { localStorage.setItem(accessKey, 'telegram-opened'); } catch {}
    closeTaskUnlock(); updateBoard();
    toast('Расширенная доска открыта в этом браузере. Можно добавить до 30 дел.');
  });
  function saveTasks() { try { localStorage.setItem(storageKey, JSON.stringify(tasks)); } catch { toast('Дела работают, но браузер не разрешил сохранение.'); } }
  function renderTasks() {
    const list = select('#taskList');
    const oldPositions = new Map([...list.children].map(row => [row.dataset.taskId, row.getBoundingClientRect()]));
    const oldIds = new Set(oldPositions.keys());
    list.replaceChildren();
    tasks.forEach(task => {
      const row = document.createElement('li'); row.dataset.taskId = task.id; row.className = 'task-row' + (task.done ? ' done' : '');
      const label = document.createElement('label'); label.className = 'task-check';
      const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = task.done;
      checkbox.setAttribute('aria-label', 'Готово: ' + task.title);
      const title = document.createElement('span'); title.className = 'task-title'; title.textContent = task.title;
      label.append(checkbox, title);
      const priority = document.createElement('button'); priority.type = 'button'; priority.textContent = '↑'; priority.className = 'task-priority'; priority.setAttribute('aria-label', 'Сделать первым: ' + task.title); priority.title = 'Сделать первым';
      priority.hidden = task.done;
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', 'Удалить дело: ' + task.title); remove.title = 'Удалить дело';
      checkbox.addEventListener('change', () => {
        task.done = checkbox.checked; row.classList.toggle('done', task.done); priority.hidden = task.done; saveTasks(); updateBoard();
        if (task.done) { cheer('Ещё одно дело? Решено.'); if (tasks.every(item => item.done)) { burst(select('.task-board')); toast('Всё готово. Вот это ты разрулил!'); } }
      });
      priority.addEventListener('click', () => { tasks = [task, ...tasks.filter(item => item.id !== task.id)]; saveTasks(); renderTasks(); toast('Первое дело выбрано. Теперь только оно.'); select('#taskList input')?.focus(); });
      remove.addEventListener('click', () => { const index = tasks.findIndex(item => item.id === task.id); tasks = tasks.filter(item => item.id !== task.id); saveTasks(); renderTasks(); const buttons = all('#taskList .task-check input'); (buttons[Math.min(index, buttons.length - 1)] || select('#boardTask')).focus(); });
      if (!oldIds.has(task.id)) row.classList.add('task-enter');
      row.append(label, priority, remove); list.append(row);
    });
    if (!reduced) requestAnimationFrame(() => {
      for (const row of list.children) {
        const previous = oldPositions.get(row.dataset.taskId);
        if (!previous || !row.animate) continue;
        const next = row.getBoundingClientRect();
        const delta = previous.top - next.top;
        if (Math.abs(delta) > 1) row.animate([{transform:`translateY(${delta}px)`},{transform:'translateY(0)'}], {duration:320,easing:'cubic-bezier(.2,.8,.2,1)'});
      }
    });
    updateBoard();
  }
  function updateBoard() {
    const done = tasks.filter(task => task.done).length;
    const percent = tasks.length ? Math.round(done / tasks.length * 100) : 0;
    select('#boardCount').textContent = `${done} из ${tasks.length} готово`;
    select('#boardEncouragement').textContent = percent === 100 ? 'Красиво разрулил ✳' : done ? 'Уже легче, правда?' : 'Начни с маленького';
    select('#boardProgress').style.width = percent + '%';
    select('.board-progress').setAttribute('aria-valuenow', String(percent));
    select('#boardEmpty').hidden = tasks.length > 0;
    select('#clearDone').disabled = done === 0;
    select('#taskAccessStatus').textContent = plusActive ? 'Омни Плюс · расширенная доска до 30 задач' : tasksUnlocked ? 'Расширенная доска · до 30 задач' : `Бесплатные задачи: ${Math.min(tasksCreated, freeTaskLimit)} / ${freeTaskLimit}`;
  }
  function addTask(title) {
    title = title.trim().slice(0,100); if (!title) return false;
    if (!tasksUnlocked && !plusActive && tasksCreated >= freeTaskLimit) { openTaskUnlock(); return false; }
    if (tasks.length >= 30) { toast('На доске уже 30 дел. Освободи место для нового.'); return false; }
    tasks.push({id:crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(), title, done:false});
    tasksCreated++;
    try { localStorage.setItem(createdKey, String(tasksCreated)); } catch {}
    saveTasks(); renderTasks();
    if (!tasksUnlocked && !plusActive && tasksCreated >= freeTaskLimit) openTaskUnlock();
    return true;
  }
  select('#taskBoardForm').addEventListener('submit', event => { event.preventDefault(); if (addTask(select('#boardTask').value)) { select('#boardTask').value = ''; cheer('Выгрузил из головы — уже полдела.'); } });
  select('#clearDone').addEventListener('click', () => { tasks = tasks.filter(task => !task.done); saveTasks(); renderTasks(); toast('Готовое убрали. Место для нового.'); });
  renderTasks();
  window.addEventListener('omni-subscription-change', event => { plusActive = event.detail?.active === true; if (plusActive) closeTaskUnlock(); updateBoard(); });

  const impulses = [
    ['↗','Правило двух минут','Найди дело, которое можно закончить за две минуты. И сделай его прямо сейчас.','Закончить одно дело за две минуты'],
    ['✳','Три строчки — уже начало','Открой пустой документ и напиши всего три строки. Черновик имеет право быть несовершенным.','Написать первые три строки черновика'],
    ['↝','Вынеси шум наружу','Выпиши три вещи, которые крутятся в голове. Выбери одну. Остальные спокойно подождут.','Выписать три дела и выбрать главное'],
    ['○','Освободи один метр','Убери со стола три лишние вещи. Иногда порядок начинается буквально перед носом.','Убрать со стола три лишние вещи'],
    ['→','Один короткий вопрос','Есть неясность? Сформулируй один вопрос, ответ на который поможет двигаться дальше.','Сформулировать вопрос, который мешает начать'],
    ['+','Уменьши масштаб','Большое дело пугает? Раздели его на три части. Начни с самой маленькой.','Разбить большую задачу на три части'],
    ['↗','Убери одно препятствие','Закрой одну лишнюю вкладку, убери телефон или подготовь нужный файл. Сделай старт легче.','Убрать одно препятствие перед началом работы'],
    ['✳','Зафиксируй маленькую победу','Вспомни, что сегодня уже получилось. Запиши один результат, даже совсем небольшой.','Записать одну маленькую победу за сегодня']
  ];
  let impulseIndex = 0, shuffleTimeout;
  function showImpulse() {
    const item = impulses[impulseIndex]; select('#impulseNumber').textContent = `${String(impulseIndex + 1).padStart(2,'0')} / 08`;
    select('#impulseIcon').textContent = item[0]; select('#impulseTitle').textContent = item[1]; select('#impulseText').textContent = item[2];
  }
  select('#shuffleImpulse').addEventListener('click', () => {
    const button = select('#shuffleImpulse'); if (button.disabled) return;
    button.disabled = true; select('.impulse-display').classList.add('shuffling');
    shuffleTimeout = setTimeout(() => { impulseIndex = (impulseIndex + 1 + Math.floor(Math.random() * (impulses.length - 1))) % impulses.length; showImpulse(); ping(); }, reduced ? 0 : 210);
    setTimeout(() => { select('.impulse-display').classList.remove('shuffling'); button.disabled = false; }, reduced ? 20 : 620);
  });
  select('#takeImpulse').addEventListener('click', () => {
    const title = impulses[impulseIndex][3];
    if (tasks.some(task => task.title === title && !task.done)) { toast('Этот ход уже ждёт на твоей доске ↑'); return; }
    if (addTask(title)) { toast('Ход на доске. Осталось сделать первый шаг.'); cheer('План появился. Разруливаем.'); }
  });

  let breathing = false, breathInterval, breathSeconds = 0;
  const breathPanel = select('#breathPanel');
  function stopBreathing() {
    breathing = false; clearInterval(breathInterval); select('.breathing-tool').classList.remove('breathing');
    select('#breathStart').textContent = 'Начать дыхание ↗'; select('#breathStart').setAttribute('aria-pressed','false'); select('#breathInstruction').textContent = 'Минутка без спешки';
  }
  select('#breathToggle').addEventListener('click', () => {
    const open = breathPanel.hidden; breathPanel.hidden = !open; select('#breathToggle').setAttribute('aria-expanded',String(open)); if (!open) stopBreathing();
  });
  select('#breathStart').addEventListener('click', () => {
    if (breathing) { stopBreathing(); return; }
    breathing = true; breathSeconds = 0; select('.breathing-tool').classList.add('breathing'); select('#breathStart').textContent = 'Остановить'; select('#breathStart').setAttribute('aria-pressed','true'); select('#breathInstruction').textContent = 'Плавный вдох';
    breathInterval = setInterval(() => { breathSeconds++; select('#breathInstruction').textContent = breathSeconds % 8 < 4 ? 'Плавный вдох' : 'Мягкий выдох'; if (breathSeconds === 32) { stopBreathing(); select('#breathInstruction').textContent = 'Выдохнули. Теперь по одному делу.'; toast('Пауза сделана. Возвращаемся без спешки.'); } }, 1000);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && breathing) stopBreathing(); });
  const timerStart = select('#timerStart'); const oldTimerStart = timerStart.onclick;
  timerStart.onclick = event => { oldTimerStart(event); select('.timer-panel').classList.toggle('focus-running', ticking); if (ticking) cheer('Ты в фокусе. Остальное подождёт.'); };
  const reset = select('#timerReset'); const oldReset = reset.onclick;
  reset.onclick = event => { oldReset(event); select('.timer-panel').classList.remove('focus-running'); };
  all('[data-minutes]').forEach(button => button.addEventListener('click', () => select('.timer-panel').classList.remove('focus-running')));
  new MutationObserver(() => { if (!ticking) select('.timer-panel').classList.remove('focus-running'); }).observe(select('#timerLabel'), {childList:true,characterData:true,subtree:true});
  all('[data-minutes]').forEach(button => button.setAttribute('aria-pressed',String(button.classList.contains('selected'))));
})();
