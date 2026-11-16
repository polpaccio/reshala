const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;try{const preference=localStorage.getItem('reshala-motion');if(preference==='off')reduced=true;else if(preference==='on')reduced=false;}catch{}let audioOn=false,audioCtx;function ping(){if(!audioOn)return;try{audioCtx??=new(window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.setValueAtTime(620,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(880,audioCtx.currentTime+.1);g.gain.setValueAtTime(.06,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.2);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.2)}catch{}}
$('.sound').onclick=()=>{audioOn=!audioOn;$('.sound').setAttribute('aria-label',audioOn?'Выключить звук':'Включить звук');$('.sound').title=audioOn?'Звук включён':'Звук выключен';$('.sound').textContent=audioOn?'♪':'♫';toast(audioOn?'Звук включён. Поехали!':'Тихий режим включён');ping()};let toastTimeout;function toast(t){$('#toast').textContent=t;$('#toast').classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('#toast').classList.remove('show'),3000)}
const moods=['Ну что, разрулим?','Ты справишься. А я помогу.','Первый шаг уже ближе.','Всё по полочкам. В твоём темпе.','Омнибот на месте ✳'];let mood=0;$('#mascot').onclick=()=>{ping();$('#botMood').textContent=moods[mood++%moods.length];burst();toast('Привет! Я Омнибот. Жми «Давай решать» ↗')};
const examples={work:{prompt:'Слишком много задач, не знаю за что браться',reply:'Давай уберём шум. Вот наш первый ход:<br><br><strong>01.</strong> Выпиши все задачи одним списком — пока без сортировки.<br><strong>02.</strong> Отметь то, что нужно сегодня, и то, от чего зависят другие.<br><strong>03.</strong> Выбери одну такую задачу и выдели на неё 15 минут.<br><br>Сейчас нужна не идеальная система, а один понятный шаг.'},study:{prompt:'Объясни, как работает метод Фейнмана',reply:'Представь, что объясняешь тему другу, который слышит о ней впервые.<br><br><strong>01.</strong> Выбери одну тему и опиши её простыми словами.<br><strong>02.</strong> Заметь места, где хочется сказать «ну, это сложно». Там и есть пробелы.<br><strong>03.</strong> Вернись к материалу, заполни пробелы и объясни ещё раз.<br><br>Например: алгоритм — это рецепт. Ингредиенты на входе, шаги внутри, готовое блюдо на выходе.'},ideas:{prompt:'Хочу придумать необычную идею для личного проекта',reply:'Вот три отправные точки. Какая цепляет?<br><br><strong>↗ Антисписок дел.</strong> Приложение, где отмечаешь то, от чего сегодня отказался ради себя.<br><strong>✳ Музей обычного.</strong> Каждый день фотографируешь одну незаметную красивую вещь.<br><strong>↝ Письмо в пятницу.</strong> Отправляешь будущему себе одну идею из этой недели.<br><br>Выбери одну и сделай самый простой прототип за вечер.'},life:{prompt:'Хочу навести порядок в делах, но постоянно откладываю',reply:'Не будем пытаться изменить всю жизнь за понедельник.<br><br><strong>01.</strong> Выбери одну маленькую область: стол, входящие или список покупок.<br><strong>02.</strong> Поставь таймер на 5 минут.<br><strong>03.</strong> Сделай только то, что помещается в это время. Этого достаточно для начала.<br><br>Таймер ниже уже ждёт. Начнём с малого?'}};let replyTimeout=null,busy=false;function msg(text,who='bot',html=false){const m=document.createElement('div');m.className='message '+who;if(html)m.innerHTML=text;else m.textContent=text;$('#messages').append(m);$('#messages').scrollTop=$('#messages').scrollHeight;return m}function answer(prompt,key){if(busy){toast('Секунду, Омнибот ещё разбирается');return}busy=true;msg(prompt,'user');const typing=msg('Разбираемся…');typing.classList.add('typing');replyTimeout=setTimeout(()=>{typing.remove();if(key)msg(examples[key].reply,'bot',true);else{msg('Задачу понял. Вот универсальный способ подступиться:');msg('1. Определи, какой конкретный результат тебе нужен.\n2. Выпиши, что уже есть и чего не хватает.\n3. Выбери действие на 5 минут: открыть документ, собрать три примера или составить список.');msg('Это шаблонный ответ демо. Для разбора деталей нужен подключённый бот. А первый шаг можно сделать уже сейчас ✳')}busy=false;ping()},750)}$$('[data-scenario]').forEach(b=>b.onclick=()=>{$$('[data-scenario]').forEach(x=>{x.classList.remove('selected');x.setAttribute('aria-pressed','false')});b.classList.add('selected');b.setAttribute('aria-pressed','true');const key=b.dataset.scenario;answer(examples[key].prompt,key)});$$('[data-example]').forEach(b=>b.onclick=()=>{$('#playground').scrollIntoView({behavior:reduced?'auto':'smooth'});const key=b.dataset.example;answer(examples[key].prompt,key)});$('#chatForm').onsubmit=e=>{e.preventDefault();const t=$('#taskInput').value.trim();if(!t)return;if(busy){toast('Секунду, ответ уже в пути');return}$('#taskInput').value='';let key=null;if(/фейнман/i.test(t))key='study';else if(/иде[яиюй]/i.test(t))key='ideas';else if(/завал|много задач|дедлайн/i.test(t))key='work';else if(/порядок|откладыва/i.test(t))key='life';answer(t,key)};$('#clearChat').onclick=()=>{clearTimeout(replyTimeout);busy=false;$('#messages').replaceChildren();msg('С чистого листа! Расскажи, что сегодня решаем ✳');ping()};
let duration=300,remaining=300,ticking=false,endTime=0,interval;function renderTimer(){const mins=Math.floor(remaining/60),secs=remaining%60;$('#timer').textContent=String(mins).padStart(2,'0')+':'+String(secs).padStart(2,'0');$('#progressRing').style.strokeDashoffset=722.6*(1-remaining/duration)}function pause(){ticking=false;clearInterval(interval);$('#timerStart').textContent=remaining===0?'Ещё один рывок ↗':'Продолжить ↗';$('#timerLabel').textContent=remaining===0?'ХОРОШАЯ РАБОТА!':'МОЖНО ПЕРЕВЕСТИ ДУХ'}function tick(){remaining=Math.max(0,Math.ceil((endTime-Date.now())/1000));renderTimer();if(!remaining){pause();burst();ping();toast('Готово! Ты уделил время важному. Сделай перерыв.')}}$('#timerStart').onclick=()=>{ping();if(ticking){tick();pause();return}if(remaining===0)remaining=duration;endTime=Date.now()+remaining*1000;ticking=true;$('#timerStart').textContent='Пауза Ⅱ';$('#timerLabel').textContent='ТОЛЬКО ТЫ И ОДНА ЗАДАЧА';interval=setInterval(tick,1000);renderTimer()};function resetTimer(){clearInterval(interval);ticking=false;remaining=duration;$('#timerStart').textContent='Начать фокус ↗';$('#timerLabel').textContent='ТВОЙ МАЛЕНЬКИЙ РЫВОК';renderTimer()}$('#timerReset').onclick=resetTimer;$$('[data-minutes]').forEach(b=>b.onclick=()=>{duration=Number(b.dataset.minutes)*60;$$('[data-minutes]').forEach(x=>{x.classList.remove('selected');x.setAttribute('aria-pressed','false')});b.classList.add('selected');b.setAttribute('aria-pressed','true');resetTimer()});document.addEventListener('visibilitychange',()=>{if(!document.hidden&&ticking)tick()});
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.08});$$('.section-heading,.feature,.play-grid,.focus-grid,.faq details,.final-cta h2').forEach(el=>{el.classList.add('reveal');observer.observe(el)});let confettiFrame=0;function burst(){if(reduced||document.hidden)return;cancelAnimationFrame(confettiFrame);const canvas=$('#confetti'),ctx=canvas.getContext('2d');canvas.width=innerWidth;canvas.height=innerHeight;let pieces=Array.from({length:innerWidth<600?28:48},()=>({x:innerWidth/2,y:innerHeight*.45,vx:(Math.random()-.5)*13,vy:-Math.random()*12-3,r:Math.random()*6+3,a:1,rotation:Math.random()*6}));function frame(){ctx.clearRect(0,0,canvas.width,canvas.height);pieces.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.23;p.a-=.012;p.rotation+=.08;ctx.save();ctx.globalAlpha=Math.max(0,p.a);ctx.translate(p.x,p.y);ctx.rotate(p.rotation);ctx.fillStyle=['#1b1d20','#8e9299','#c9cbd0'][Math.floor(Math.random()*3)];ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r/2);ctx.restore()});pieces=pieces.filter(p=>p.a>0);if(pieces.length&&!document.hidden&&!reduced)confettiFrame=requestAnimationFrame(frame);else ctx.clearRect(0,0,canvas.width,canvas.height)}frame()}

// The head and eyes share one layer, so the gaze stays aligned while the head turns.
const trackingStage = document.querySelector('.character-stage');
const trackingHead = document.querySelector('.character-head');
const trackingEyes = [...document.querySelectorAll('.tracking-iris')];
if (trackingStage && trackingHead && trackingEyes.length) {
  let frame = 0;
  let current = {x: 0, y: 0};
  let target = {x: 0, y: 0};
  const clamp = value => Math.max(-1, Math.min(1, value));
  function renderTracking() {
    frame = 0;
    if (reduced) return;
    current.x += (target.x - current.x) * 0.14;
    current.y += (target.y - current.y) * 0.14;
    trackingHead.style.transform = `perspective(700px) rotateX(${-current.y * 3}deg) rotateY(${current.x * 5}deg) rotateZ(${current.x * 1.5}deg)`;
    trackingEyes.forEach(eye => {
      const distance = Number(eye.dataset.travel);
      eye.style.transform = `translate(${current.x * distance}px, ${current.y * distance * 0.55}px)`;
    });
    if (Math.abs(target.x - current.x) + Math.abs(target.y - current.y) > 0.001) {
      frame = requestAnimationFrame(renderTracking);
    }
  }
  function aimAt(x, y) {
    if (reduced) return;
    const rect = trackingStage.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight || document.hidden) return;
    target.x = clamp((x - (rect.left + rect.width * 0.5)) / Math.max(rect.width * 1.2, 200));
    target.y = clamp((y - (rect.top + rect.height * 0.36)) / Math.max(rect.height, 240));
    if (!frame) frame = requestAnimationFrame(renderTracking);
  }
  function relaxTracking() {
    target = {x: 0, y: 0};
    if (!frame && !reduced) frame = requestAnimationFrame(renderTracking);
  }
  document.addEventListener('pointermove', event => {
    if (event.pointerType !== 'touch') aimAt(event.clientX, event.clientY);
  }, {passive: true});
  // A tap gives touch screens the same response without an endless animation.
  trackingStage.closest('button').addEventListener('pointerdown', event => aimAt(event.clientX, event.clientY));
  document.documentElement.addEventListener('pointerleave', relaxTracking);
  window.addEventListener('blur', relaxTracking);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
      target = {x: 0, y: 0};
    } else relaxTracking();
  });
}
