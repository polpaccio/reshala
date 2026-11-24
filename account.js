(() => {
  'use strict';
  const api = 'https://omni-191-44-108-136.sslip.io/website/';
  const byId = id => document.getElementById(id);
  let generation = 0, busy = false, lastChecked = 0, requestId = null, requestText = null, entitlementTimer;
  function credentials() {
    try {
      const raw = sessionStorage.getItem('omni-telegram-auth-v1');
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data.hash || !data.auth_date || data.auth_date*1000+86400000 <= Date.now()) return null;
      return 'tglogin ' + btoa(Array.from(new TextEncoder().encode(raw), byte => String.fromCharCode(byte)).join(''));
    } catch { return null; }
  }
  function signIn() { byId('profileTrigger').click(); }
  async function call(path, body) {
    const authorization = credentials();
    if (!authorization) throw Error('Войди через Telegram заново, чтобы связать сайт с ботом.');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 18000);
    try {
      const response = await fetch(api+path,{method:body?'POST':'GET',headers:{Authorization:authorization,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:controller.signal,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
      const data = await response.json();
      if (!response.ok) throw Error(response.status===401?'Войди через Telegram заново для проверки подписки.':data.error||'Не удалось связаться с ботом.');
      return data;
    } catch(error) {
      if (error.name==='AbortError' || error instanceof TypeError) throw Error('Нет связи с ботом. Попробуй ещё раз чуть позже.');
      throw error;
    } finally { clearTimeout(timer); }
  }
  function reset() {
    clearTimeout(entitlementTimer);
    window.dispatchEvent(new CustomEvent('omni-subscription-change',{detail:{active:false}}));
    byId('plusTitle').textContent='Твоя подписка — здесь.';
    byId('plusDescription').textContent='Войди через Telegram, чтобы увидеть статус и срок действия подписки из бота.';
    byId('plusStatus').textContent='Нужен вход в профиль';
    byId('plusStatus').dataset.active='false';
    byId('plusPlan').textContent='—'; byId('plusUntil').textContent='—';
    byId('plusChecked').textContent='Покупки и промокоды проверяются на сервере бота.';
    byId('refreshPlus').disabled=false;
    byId('supportHistory').replaceChildren();
    byId('supportHistory').textContent='Войди, чтобы увидеть ответы поддержки.';
    byId('refreshPlus').textContent='Войти и проверить ↗';
    byId('sendSupport').textContent='Войти и написать ↗';
    byId('supportStatus').textContent='Войди через Telegram, чтобы получить ответ в чат с ботом.';
  }
  async function refresh() {
    const current=++generation;
    if (!credentials()) {reset();return;}
    byId('refreshPlus').disabled=true;
    byId('plusStatus').textContent='Проверяем подписку…';
    byId('sendSupport').textContent='Отправить в поддержку ↗';
    try {
      const data=await call('profile');
      if(current!==generation)return;
      const sub=data.subscription;
      clearTimeout(entitlementTimer);
      if(sub.active&&sub.until)entitlementTimer=setTimeout(()=>{window.dispatchEvent(new CustomEvent('omni-subscription-change',{detail:{active:false}}));refresh();},Math.max(0,Math.min(sub.until*1000-Date.now(),2147483647)));
      window.dispatchEvent(new CustomEvent('omni-subscription-change',{detail:{active:sub.active}}));
      byId('plusTitle').textContent=sub.active?'Омни Плюс с тобой.':'Сейчас у тебя Basic.';
      byId('plusStatus').dataset.active=String(sub.active);
      byId('plusStatus').textContent=sub.active?(sub.demo?'Plus · демо':'Plus активен'):'Basic';
      byId('plusPlan').textContent=sub.active?'Омни Плюс':'Бесплатный';
      byId('plusUntil').textContent=sub.active&&sub.until?new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',year:'numeric'}).format(new Date(sub.until*1000)):'Без срока';
      byId('plusDescription').textContent=sub.active?'Статус подтверждён сервером бота. Подписка и срок общие с Telegram.':`В боте доступно до ${sub.basic_limits.task} активных задач, ${sub.basic_limits.note} заметок и ${sub.basic_limits.event} событий.`;
      if(sub.discount>0)byId('plusDescription').textContent+=` Скидка на первую покупку: ${sub.discount}%.`;
      lastChecked=Date.now();
      loadHistory();
      byId('plusChecked').textContent='Обновлено '+new Intl.DateTimeFormat('ru-RU',{hour:'2-digit',minute:'2-digit'}).format(new Date())+' · данные бота';
      byId('supportStatus').textContent=data.support_connected?'Обращение поступит в группу поддержки. Ответ появится на сайте и в личном чате с ботом.':'Группа пока недоступна. Открой Telegram по ссылке рядом.';
    } catch(error) {
      if(current!==generation)return;
      clearTimeout(entitlementTimer);
      window.dispatchEvent(new CustomEvent('omni-subscription-change',{detail:{active:false}}));
      byId('plusStatus').textContent='Статус не подтверждён';byId('plusStatus').dataset.active='false';
      byId('plusPlan').textContent='—';byId('plusUntil').textContent='—';
      byId('plusDescription').textContent=error.message;
      byId('plusChecked').textContent='Не удалось обновить. Нажми «Проверить подписку».';
    } finally {
      if(current===generation){byId('refreshPlus').disabled=false;byId('refreshPlus').textContent='Проверить подписку ↻';}
    }
  }
  byId('refreshPlus').addEventListener('click',()=>credentials()?refresh():signIn());
  byId('supportText').addEventListener('input',()=>{byId('supportCount').textContent=byId('supportText').value.length+' / 3000';});
  byId('supportForm').addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;if(!credentials()){signIn();return;}
    const text=byId('supportText').value.trim();if(!text)return;
    if(text!==requestText){requestText=text;requestId=crypto.randomUUID();}
    const current=generation;
    busy=true;byId('sendSupport').disabled=true;byId('supportStatus').textContent='Отправляем обращение…';
    try {
      const result=await call('support',{text,request_id:requestId});
      if(current!==generation)return;
      byId('supportStatus').textContent=result.message.replace('Ответ придёт в чат с ботом.', 'Ответ появится здесь и в чате с ботом.');
      loadHistory();
      if(result.delivered){byId('supportText').value='';byId('supportCount').textContent='0 / 3000';requestId=null;requestText=null;}
    }catch(error){if(current===generation)byId('supportStatus').textContent=error.message;}
    finally{busy=false;byId('sendSupport').disabled=false;}
  });
  let historyBusy=false;
  async function loadHistory(){
    if(!credentials()||historyBusy)return;
    const current=generation;historyBusy=true;
    try{
      const data=await call('support');if(current!==generation)return;
      const list=byId('supportHistory');list.replaceChildren();
      if(!data.tickets.length){list.textContent='Обращений пока нет.';return;}
      const labels={sent:'Отправлено',sending:'Отправляется',uncertain:'Доставка в группу не подтверждена'};
      data.tickets.forEach(ticket=>{
        const card=document.createElement('article');card.className='support-ticket';
        const title=document.createElement('strong');title.textContent='Обращение #'+ticket.id+' · '+(labels[ticket.status]||ticket.status);card.append(title);
        if(!ticket.messages.length){const note=document.createElement('p');note.textContent='Текст старого обращения доступен в Telegram. Новые ответы появятся здесь.';card.append(note);}
        ticket.messages.forEach(message=>{
          const item=document.createElement('div');item.className='support-history-message '+(message.direction==='support'?'from-support':'from-user');
          const label=document.createElement('small');label.textContent=(message.direction==='support'?'Поддержка':'Ты')+' · '+new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(message.created*1000));
          const body=document.createElement('p');body.textContent=message.body;item.append(label,body);card.append(item);
        });list.append(card);
      });
    }catch(error){if(current===generation)byId('supportHistory').textContent=error.message;}
    finally{historyBusy=false;}
  }
  byId('refreshSupport').addEventListener('click',()=>credentials()?loadHistory():signIn());
  setInterval(()=>{if(!document.hidden&&credentials()){const box=byId('support').getBoundingClientRect();if(box.top<innerHeight&&box.bottom>0)loadHistory();}},20000);
  window.addEventListener('omni-profile-change',()=>{lastChecked=0;refresh();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&credentials()&&Date.now()-lastChecked>15000)refresh();});
  refresh();
})();
