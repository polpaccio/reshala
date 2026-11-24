(() => {
  const views = [...document.querySelectorAll('[data-view]')];
  const routes = {'subscription':'home','action-lab':'tasks','focus':'focus','playground':'chat','support':'support','possibilities':'about','home':'home','':'home'};
  let current;
  function showRoute(scroll = true) {
    const hash = location.hash.slice(1), next = routes[hash] || 'home';
    const changed = current !== next; current = next;
    views.forEach(element => { element.hidden = element.dataset.view !== next; });
    document.querySelectorAll('#mainNav a').forEach(link => {
      const active = routes[link.hash.slice(1)] === next;
      link.classList.toggle('category-active', active);
      if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
    });
    if(scroll) {
      if(!changed && hash === 'subscription') document.getElementById(hash).scrollIntoView({behavior:document.documentElement.classList.contains('motion-off')||matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
      else window.scrollTo({top:0,behavior:'instant'});
    }
    document.title = 'Omnibot — '+({home:'сложное станет проще',tasks:'твои задачи',focus:'время для фокуса',chat:'демо-чат',support:'техподдержка',about:'о помощнике'}[next]);
  }
  window.addEventListener('hashchange', () => showRoute());
  // Reveal the chat before the existing scenario button scrolls to it.
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-example]')) { history.pushState(null,'','#playground'); showRoute(); }
  },true);
  window.addEventListener('popstate',()=>showRoute());
  showRoute(false);
  const plus=document.querySelector('.plus-card');
  const visible=new IntersectionObserver(entries=>entries.forEach(entry=>plus.classList.toggle('particles-visible',entry.isIntersecting)),{threshold:.05});
  visible.observe(plus);
  document.addEventListener('visibilitychange',()=>plus.classList.toggle('particles-paused',document.hidden));
})();
