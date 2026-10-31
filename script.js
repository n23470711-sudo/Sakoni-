const toggle=document.querySelector('.menu-toggle');const mobileNav=document.querySelector('.mobile-nav');toggle.addEventListener('click',()=>{const open=mobileNav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation')});mobileNav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{mobileNav.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation')}));const elements=document.querySelectorAll('.reveal');if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.08});elements.forEach(el=>observer.observe(el))}else elements.forEach(el=>el.classList.add('visible'));

// Filter the original menu DOM rather than maintaining a second copy of its data.
const menuSearch = document.querySelector('#menu-search');
const menuCount = document.querySelector('#menu-count');
const menuEmpty = document.querySelector('#menu-empty');
const categoryButtons = [...document.querySelectorAll('.category-pill')];
const menuCategories = [...document.querySelectorAll('#menu .menu-category')];
let selectedCategory = 'All';
const normaliseMenuText = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
menuCategories.forEach(category => {
  const subtitle = category.querySelector('.category-heading p');
  const description = subtitle.textContent.split('·').slice(1).join('·').trim();
  const actualCount = category.querySelectorAll('.full-menu-item').length;
  subtitle.textContent = `${actualCount} ${actualCount === 1 ? 'item' : 'items'}${description ? ' · ' + description : ''}`;
});
function filterMenu() {
  const query = normaliseMenuText(menuSearch.value);
  let total = 0;
  menuCategories.forEach(category => {
    const categoryName = category.querySelector('h3').textContent.trim();
    const categoryMatches = selectedCategory === 'All' || normaliseMenuText(categoryName) === normaliseMenuText(selectedCategory);
    let visible = 0;
    category.querySelectorAll('.full-menu-item').forEach(item => {
      const matches = categoryMatches && normaliseMenuText(item.textContent).includes(query);
      item.hidden = !matches;
      if (matches) visible++;
    });
    category.hidden = visible === 0;
    total += visible;
  });
  menuCount.textContent = `${total} ${total === 1 ? 'dish' : 'dishes'}${selectedCategory === 'All' ? '' : ' in ' + selectedCategory}`;
  menuEmpty.hidden = total !== 0;
}
categoryButtons.forEach(button => button.addEventListener('click', () => {
  selectedCategory = button.dataset.category;
  categoryButtons.forEach(candidate => {
    const active = candidate === button;
    candidate.classList.toggle('active', active);
    candidate.setAttribute('aria-pressed', String(active));
  });
  filterMenu();
}));
menuSearch.addEventListener('input', filterMenu);
filterMenu();

// Prepare a reservation request for the guest to send through WhatsApp.
const reservationForm = document.querySelector('#reservation-form');
const bookingDate = document.querySelector('#reservation-date');
const bookingTime = document.querySelector('#reservation-time');
const bookingResult = document.querySelector('#form-result');
function austinToday(){
  const parts = new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const part = name => parts.find(p => p.type === name).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
function updateBookingTimes(){
  const previous = bookingTime.value;
  bookingTime.replaceChildren(new Option(bookingDate.value ? 'Select a time' : 'Select a date first',''));
  if(!bookingDate.value) return;
  const day = new Date(`${bookingDate.value}T12:00:00Z`).getUTCDay();
  const closeHour = day === 0 || day === 5 || day === 6 ? 23 : 22;
  for(let minutes=11*60;minutes<closeHour*60;minutes+=30){
    const hour=Math.floor(minutes/60), minute=minutes%60;
    const label=`${hour%12||12}:${String(minute).padStart(2,'0')} ${hour<12?'AM':'PM'}`;
    const value=`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;
    bookingTime.add(new Option(label,value));
  }
  if([...bookingTime.options].some(option=>option.value===previous)) bookingTime.value=previous;
}
bookingDate.min=austinToday();
bookingDate.addEventListener('change',()=>{updateBookingTimes();bookingResult.hidden=true});
reservationForm.addEventListener('submit',event=>{
  event.preventDefault(); bookingDate.min=austinToday(); bookingResult.hidden=true;
  const fields=[
    [document.querySelector('#guest-name'),'name-error','Please enter your name.'],
    [document.querySelector('#guest-count'),'guests-error','Please select the number of guests.'],
    [bookingDate,'date-error','Please choose today or a future date.'],
    [bookingTime,'time-error','Please select a time.']
  ];
  let firstInvalid=null;
  fields.forEach(([field,errorId,message])=>{
    const invalid=!field.value.trim() || (field===bookingDate && (field.value<bookingDate.min || !field.validity.valid));
    document.getElementById(errorId).textContent=invalid?message:'';
    field.setAttribute('aria-invalid',String(invalid));
    if(invalid){field.setAttribute('aria-describedby',errorId);if(!firstInvalid)firstInvalid=field}
    else field.removeAttribute('aria-describedby');
  });
  if(firstInvalid){firstInvalid.focus();return}
  const name = document.querySelector('#guest-name').value.trim();
  const guests = document.querySelector('#guest-count').value;
  const contact = document.querySelector('#reservation-contact').value.trim();
  const notes = document.querySelector('#reservation-notes').value.trim();
  const timeLabel = bookingTime.options[bookingTime.selectedIndex].textContent;
  const lines = [
    'New Table Reservation Request',
    'Restaurant: Ember Oak',
    `Customer Name: ${name}`,
    `Number of Guests: ${guests}`,
    `Date: ${bookingDate.value}`,
    `Time: ${timeLabel}`
  ];
  if (contact) lines.push(`Phone or Email: ${contact}`);
  if (notes) lines.push(`Special Requests: ${notes}`);
  const whatsappUrl = `https://wa.me/919313267151?text=${encodeURIComponent(lines.join('\n'))}`;
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  bookingResult.replaceChildren(document.createTextNode('Please press Send in WhatsApp to submit your request. Your table is not confirmed. '));
  const link = document.createElement('a');
  link.href = whatsappUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'Open WhatsApp';
  link.style.textDecoration = 'underline';
  bookingResult.append(link);
  bookingResult.hidden=false;
});

;(function(){
  var video=document.getElementById('heroVideo'),canvas=document.getElementById('heroCanvas');
  if(!video||!canvas||document.documentElement.classList.contains('hero-webm'))return;
  var stage=canvas.parentNode,ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
  var off=document.createElement('canvas');off.width=W*2;off.height=H;
  var octx=off.getContext('2d',{willReadFrequently:true});
  var started=false,visible=true,useRVFC='requestVideoFrameCallback' in HTMLVideoElement.prototype;
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  function draw(){
    try{
      octx.drawImage(video,0,0);
      var c=octx.getImageData(0,0,W,H),m=octx.getImageData(W,0,W,H),d=c.data,a=m.data;
      for(var i=0,n=d.length;i<n;i+=4)d[i+3]=a[i];
      ctx.putImageData(c,0,0);
      if(!stage.classList.contains('video-ready')){var px=c.data,seen=0;for(var q=3;q<px.length;q+=4*997)if(px[q]>200){seen=1;break}if(seen)stage.classList.add('video-ready')}
    }catch(e){}
  }
  function loop(){
    if(video.paused||!visible)return;
    draw();
    if(useRVFC)video.requestVideoFrameCallback(loop);else requestAnimationFrame(loop);
  }
  function play(){
    var p=video.play();
    if(p&&p.then)p.then(loop).catch(function(){});else loop();
  }
  function start(){if(started)return;started=true;play()}
  video.addEventListener('playing',loop);
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){
      visible=es[0].isIntersecting;
      if(!started)return;
      if(visible){play()}else{video.pause()}
    }).observe(stage);
  }
  document.addEventListener('visibilitychange',function(){
    if(!started)return;
    if(document.hidden)video.pause();else if(visible)play();
  });
  if(document.body.classList.contains('intro-lock'))document.addEventListener('intro-done',start,{once:true});
  else start();
})();


;(function(){
  if(!document.documentElement.classList.contains('hero-webm'))return;
  var v=document.getElementById('heroAlpha');if(!v)return;
  var stage=v.parentNode,started=false,visible=true;
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  function ready(){stage.classList.add('alpha-ready')}
  v.addEventListener('playing',function(){if('requestVideoFrameCallback' in v)v.requestVideoFrameCallback(ready);else setTimeout(ready,120)});
  function play(){var p=v.play();if(p&&p.catch)p.catch(function(){})}
  function start(){if(started)return;started=true;if(visible)play()}
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){visible=es[0].isIntersecting;if(!started)return;if(visible)play();else v.pause()}).observe(stage);
  }
  document.addEventListener('visibilitychange',function(){if(!started)return;if(document.hidden)v.pause();else if(visible)play()});
  if(document.body.classList.contains('intro-lock'))document.addEventListener('intro-done',start,{once:true});else start();
})();
