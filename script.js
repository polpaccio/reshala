const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;try{const preference=localStorage.getItem('reshala-motion');if(preference==='off')reduced=true;else if(preference==='on')reduced=false;}catch{}let audioOn=false,audioCtx;function ping(){if(!audioOn)return;try{audioCtx??=new(window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.setValueAtTime(620,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(880,audioCtx.currentTime+.1);g.gain.setValueAtTime(.06,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.2);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.2)}catch{}}
$('.sound').onclick=()=>{audioOn=!audioOn;$('.sound').setAttribute('aria-label',audioOn?'Выключить звук':'Включить звук');$('.sound').title=audioOn?'Звук включён':'Звук выключен';$('.sound').textContent=audioOn?'♪':'♫';toast(audioOn?'Звук включён. Поехали!':'Тихий режим включён');ping()};let toastTimeout;function toast(t){$('#toast').textContent=t;$('#toast').classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('#toast').classList.remove('show'),3000)}
const moods=['Ну что, разрулим?','Ты справишься. А я помогу.','Первый шаг уже ближе.','Всё по полочкам. В твоём темпе.','Омнибот на месте ✳'];let mood=0;$('#mascot').onclick=event=>{ping();$('#botMood').textContent=moods[mood++%moods.length];burst($('#mascot'), event.detail > 0 || event.pointerType === 'touch' || event.pointerType === 'pen' ? {x:event.clientX,y:event.clientY} : null);toast('Привет! Я Омнибот. Начнём с первого шага ↗')};
$$('[data-category]').forEach(button => button.addEventListener('click', () => { location.hash = button.dataset.category; }));
let duration=300,remaining=300,ticking=false,endTime=0,interval;function renderTimer(){const mins=Math.floor(remaining/60),secs=remaining%60;$('#timer').textContent=String(mins).padStart(2,'0')+':'+String(secs).padStart(2,'0');$('#progressRing').style.strokeDashoffset=722.6*(1-remaining/duration)}function pause(){ticking=false;clearInterval(interval);$('#timerStart').textContent=remaining===0?'Ещё один рывок ↗':'Продолжить ↗';$('#timerLabel').textContent=remaining===0?'ХОРОШАЯ РАБОТА!':'МОЖНО ПЕРЕВЕСТИ ДУХ'}function tick(){remaining=Math.max(0,Math.ceil((endTime-Date.now())/1000));renderTimer();if(!remaining){pause();burst($('.timer-panel'));ping();toast('Готово! Ты уделил время важному. Сделай перерыв.')}}$('#timerStart').onclick=()=>{ping();if(ticking){tick();pause();return}if(remaining===0)remaining=duration;endTime=Date.now()+remaining*1000;ticking=true;$('#timerStart').textContent='Пауза Ⅱ';$('#timerLabel').textContent='ТОЛЬКО ТЫ И ОДНА ЗАДАЧА';interval=setInterval(tick,1000);renderTimer()};function resetTimer(){clearInterval(interval);ticking=false;remaining=duration;$('#timerStart').textContent='Начать фокус ↗';$('#timerLabel').textContent='ТВОЙ МАЛЕНЬКИЙ РЫВОК';renderTimer()}$('#timerReset').onclick=resetTimer;$$('[data-minutes]').forEach(b=>b.onclick=()=>{duration=Number(b.dataset.minutes)*60;$$('[data-minutes]').forEach(x=>{x.classList.remove('selected');x.setAttribute('aria-pressed','false')});b.classList.add('selected');b.setAttribute('aria-pressed','true');resetTimer()});document.addEventListener('visibilitychange',()=>{if(!document.hidden&&ticking)tick()});
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.08});$$('.section-heading,.feature,.play-grid,.focus-grid,.faq details,.final-cta h2').forEach(el=>{el.classList.add('reveal');observer.observe(el)});let confettiFrame = 0;
function burst(anchor = null, point = null) {
  if (reduced || document.hidden) return;
  cancelAnimationFrame(confettiFrame);
  const canvas = $('#confetti');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  const initialRect = anchor?.isConnected ? anchor.getBoundingClientRect() : null;
  const hit = point && initialRect && initialRect.width && initialRect.height ? {
    x:(point.x - initialRect.left) / initialRect.width,
    y:(point.y - initialRect.top) / initialRect.height
  } : null;
  const origin = () => {
    if (anchor?.isConnected) {
      const rect = anchor.getBoundingClientRect();
      return {x: rect.left + rect.width * (hit ? hit.x : .5), y: rect.top + rect.height * (hit ? hit.y : anchor.id === 'mascot' ? .36 : .5)};
    }
    return {x: innerWidth * .5, y: innerHeight * .45};
  };
  const start = origin();
  const colors = ['#1b1d20', '#8e9299', '#c9cbd0'];
  let pieces = Array.from({length: innerWidth < 600 ? 28 : 48}, () => ({
    x: 0, y: 0, vx: (Math.random() - .5) * 10, vy: -Math.random() * 9 - 2,
    size: 3 + Math.random() * 4, life: 1, rotation: Math.random() * 6,
    color: colors[Math.floor(Math.random() * colors.length)]
  }));
  let previousTime = 0;
  function frame(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (reduced || document.hidden) { confettiFrame = 0; return; }
    const dt = previousTime ? Math.min(32, time - previousTime) / 16.667 : 1;
    previousTime = time;
    // Follow the robot even if the visitor scrolls during the burst.
    const position = anchor?.isConnected ? origin() : start;
    for (const p of pieces) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += .18 * dt;
      p.life -= .016 * dt; p.rotation += .08 * dt;
      ctx.save(); ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(position.x + p.x, position.y + p.y); ctx.rotate(p.rotation);
      ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }
    pieces = pieces.filter(p => p.life > 0);
    if (pieces.length) confettiFrame = requestAnimationFrame(frame);
    else { ctx.clearRect(0, 0, canvas.width, canvas.height); confettiFrame = 0; }
  }
  confettiFrame = requestAnimationFrame(frame);
}
let robotSquintTimeout;
function squintRobot() {
  const robot = $('#mascot');
  robot.classList.add('squint');
  clearTimeout(robotSquintTimeout);
  robotSquintTimeout = setTimeout(() => robot.classList.remove('squint'), 420);
}
$('#mascot').addEventListener('click', squintRobot);

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
