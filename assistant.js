/* ═══════════════════════════════════════════════════════════════════
   TEAM MIZRACHI — AI CHATBOT (SECURE)
   ─────────────────────────────────────────────────────────────────────
   🔒 מאובטח לחלוטין — המפתח שמור ב-Vercel Environment Variables.
   הצ'אט שולח בקשות ל-/api/chat (server-side).
   ✏️  המידע/האישיות של הבוט נמצאים בצד השרת בלבד: api/_prompt.js
═══════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* ══════════🔒 המפתח מנוהל server-side ב-Vercel Environment Variables ══════ */
/* אין צורך במפתח כאן — הצ'אט קורא ל-/api/chat */

/* ══════════════════ ✏️ ערוך כאן — מידע הבוט ══════════════════ */
/* The bot's knowledge base and persona live server-side only (api/_prompt.js). */
/* ══════════════════════════════════════════════════════════════ */

var MAX_HIST = 10;
function clang(){return document.documentElement.lang==='en'?'en':'he';}
var CHAT_T={
  he:{
    placeholder:'שאל/י אותנו הכל…',
    welcome:'היי! איך אפשר לעזור? 👋\nאפשר לשאול כאן על החוגים ולוח הזמנים, או לקבוע **שיעור ניסיון חינם**.',
    chips:['קבע לי שיעור ניסיון 🥊','איזה חוג מתאים לי?','איך נרשמים לחוג?','מה השעות?'],
    demo:'אשמח לעזור! 🥊 כדי לתת לך תשובה מדויקת על שעות, מחירים והרשמה — הכי מהיר לדבר איתנו ישירות בוואטסאפ:\nhttps://wa.me/972587777750\n\n*(הצ\'אט החכם ייכנס לפעולה ברגע שנחבר אותו)*',
    busy:'יש עומס רגעי על השרת — נסה/י שוב בעוד כמה שניות 🙏',
    err:'אופס, נראה שיש תקלת תקשורת רגעית. אפשר לנסות שוב, או לדבר איתנו ישירות: https://wa.me/972587777750',
    stopped:' [הופסק]'
  },
  en:{
    placeholder:'Ask us anything…',
    welcome:'Hi! How can we help? 👋\nAsk about classes and the schedule, or book a **free trial class** right here.',
    chips:['Book my free trial 🥊','Which class fits me?','How do I register?','What are the hours?'],
    demo:'Happy to help! 🥊 For exact hours, pricing and registration the fastest way is a quick WhatsApp:\nhttps://wa.me/972587777750\n\n*(The smart chat goes live the moment we connect it.)*',
    busy:'The server is briefly busy — please try again in a few seconds 🙏',
    err:'Oops — a brief connection issue. Try again, or message us directly: https://wa.me/972587777750',
    stopped:' [stopped]'
  }
};
function T(){return CHAT_T[clang()];}

var msgs=[], streaming=false, controller=null, started=false, chatHadCursor=false;
function el(id){return document.getElementById(id)}
var panel=el('tmcPanel'),fab=el('tmcFab'),ov=el('tmcOv'),msgsEl=el('tmcMsgs'),
    inp=el('tmcInput'),sendBtn=el('tmcSend'),stopBtn=el('tmcStop'),teaser=el('tmcTeaser');

/* avatar = real logo (reuse, no extra bytes) */
(function(){var b=document.querySelector('.brand img');if(b)el('tmcAv').src=b.src;})();

function scrollDown(){requestAnimationFrame(function(){msgsEl.scrollTop=msgsEl.scrollHeight})}

/* ── typewriter: character by character, rAF-driven ──
   typeInto(el, source, opts) — source is a string or a function returning the text
   received so far (so it also works on a growing stream buffer). Reveals ~45 chars/s,
   easing smoothly up to ~140 chars/s while a large backlog is waiting. Keeps the
   view pinned to the bottom unless the reader scrolled up. Reduced motion: instant.
   Returns {stop()}; opts.done(text) fires when everything is shown and source is done
   (opts.isDone() → true, or immediately for a plain string). */
var TW_REDUCE=window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches;
function nearBottom(){return msgsEl.scrollHeight-msgsEl.scrollTop-msgsEl.clientHeight<48}
function safeSlice(t,n){
  var out=t.slice(0,n);
  /* never cut inside a surrogate pair (emoji) */
  var c=out.charCodeAt(out.length-1);if(c>=0xD800&&c<=0xDBFF)out=out.slice(0,-1);
  /* hide an unclosed ** so bold doesn't flash as asterisks first */
  if(((out.match(/\*\*/g)||[]).length)%2===1)out=out.slice(0,out.lastIndexOf('**'));
  else if(/\*$/.test(out)&&t.charAt(n)==='*')out=out.slice(0,-1);
  return out;
}
function typeInto(target,source,opts){
  opts=opts||{};
  var get=typeof source==='function'?source:function(){return source};
  var isDone=opts.isDone||function(){return typeof source!=='function'};
  var shown=0,rate=45,last=0,raf=0,stopped=false,lastHtml='';
  target.classList.add('tmc-stream');
  function paint(n){
    var html=md(safeSlice(get(),n));
    if(html!==lastHtml){var pin=nearBottom();target.innerHTML=html;lastHtml=html;if(pin)msgsEl.scrollTop=msgsEl.scrollHeight;}
  }
  function finish(){
    target.classList.remove('tmc-stream');
    var full=get();var pin=nearBottom();target.innerHTML=md(full);if(pin)msgsEl.scrollTop=msgsEl.scrollHeight;
    if(opts.done)opts.done(full);
  }
  if(TW_REDUCE&&isDone()){finish();return{stop:function(){}};}
  function frame(now){
    if(stopped)return;
    var dt=last?Math.min((now-last)/1000,.1):0;last=now;
    var text=get(),backlog=text.length-shown;
    if(TW_REDUCE){shown=text.length;}
    else{
      /* target speed grows with the backlog; ease toward it so speed never jumps */
      var want=45+95*Math.max(0,Math.min(1,(backlog-30)/220));
      rate+=(want-rate)*Math.min(1,dt*3);
      shown=Math.min(text.length,shown+rate*dt);
    }
    paint(Math.floor(shown));
    if(Math.floor(shown)>=text.length&&isDone()){finish();return;}
    raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);
  return{stop:function(){stopped=true;cancelAnimationFrame(raf);target.classList.remove('tmc-stream');}};
}

/* ── markdown: escape → links → bold → breaks ── */
function md(t){
  t=t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  t=t.replace(/(https?:\/\/[^\s<]+)/g,function(u){return '<a data-pos="chat-message" href="'+u+'" target="_blank" rel="noopener">'+u.replace(/^https?:\/\//,'')+'</a>'});
  t=t.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  return t.replace(/\n/g,'<br>');
}

/* ── cursor handling: hide site custom cursor while chat open ── */
function chatCursor(open){
  var c=el('cur'),d=el('curDot');
  if(open){chatHadCursor=document.body.classList.contains('cur-on');
    document.body.classList.remove('cur-on');
    if(c)c.style.display='none';if(d)d.style.display='none';
  }else{if(chatHadCursor)document.body.classList.add('cur-on');
    if(c)c.style.display='';if(d)d.style.display='';}
}

/* ── toggle ── */
function toggle(){
  var opening=!panel.classList.contains('open');
  panel.classList.toggle('open',opening);
  fab.classList.toggle('open',opening);
  ov.classList.toggle('open',opening);
  document.body.classList.toggle('chat-open',opening);
  hideTeaser();
  chatCursor(opening);
  if(opening){
    if(!started){started=true;greet();}
    if(window.innerWidth<=600)document.body.style.overflow='hidden';
    setTimeout(function(){if(window.innerWidth>600)inp.focus()},360);
  }else{
    document.body.style.overflow='';
    setTimeout(function(){panel.style.bottom=''},340);
  }
}
fab.addEventListener('click',toggle);
el('tmcClose').addEventListener('click',toggle);
ov.addEventListener('click',toggle);
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&panel.classList.contains('open'))toggle()});

/* ── teaser ── */
/* Shown once per session, only after the visitor is halfway down the page, for ~6s,
   then taken out of the DOM so it can never sit over a headline or a button again. */
function removeTeaser(){
  if(!teaser)return;var t=teaser;teaser=null;
  t.classList.remove('show');setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t)},450);
}
function hideTeaser(){removeTeaser()}
el('tmcTeaserX').addEventListener('click',function(e){e.stopPropagation();removeTeaser();});
teaser.addEventListener('click',toggle);
(function(){
  var done=false;
  /* phones: no teaser at all — the chat button alone is enough */
  if(window.matchMedia('(max-width:760px)').matches){done=true;removeTeaser();return;}
  try{if(sessionStorage.getItem('tmcTeaser')){done=true;removeTeaser();return;}}catch(_){}
  function half(){
    var max=document.documentElement.scrollHeight-window.innerHeight;
    return max>0&&window.scrollY/max>=.5;
  }
  /* never over the schedule pills or the footer: wait while they sit in the lower part of the screen */
  var keepClear=[document.getElementById('schedBoard'),document.querySelector('footer')].filter(Boolean);
  function blocked(){
    var h=window.innerHeight;
    return keepClear.some(function(n){var r=n.getBoundingClientRect();return r.top<h&&r.bottom>h*.45;});
  }
  function watch(){if(teaser&&blocked())removeTeaser();if(!teaser)window.removeEventListener('scroll',watch);}
  function tryShow(){
    if(done||!teaser||!half()||blocked())return;
    done=true;window.removeEventListener('scroll',tryShow);
    try{sessionStorage.setItem('tmcTeaser','1')}catch(_){}
    if(panel.classList.contains('open')){removeTeaser();return;}
    teaser.classList.add('show');
    window.addEventListener('scroll',watch,{passive:true});
    setTimeout(removeTeaser,6000);
  }
  window.addEventListener('scroll',tryShow,{passive:true});
})();

/* ── phones: the chat button steps aside while it would sit on the quiz result buttons or a schedule time ── */
(function(){
  var mq=window.matchMedia('(max-width:760px)'),ticking=false;
  function check(){
    ticking=false;
    if(!mq.matches||panel.classList.contains('open')){fab.classList.remove('dodge');return;}
    var f=fab.getBoundingClientRect(),pad=8,hit=false;
    var els=document.querySelectorAll('#finderBody .f-actions .btn,#finderBody .f-actions .f-reset,.day.on td.th-time');
    for(var i=0;i<els.length&&!hit;i++){var r=els[i].getBoundingClientRect();
      if(r.width&&r.left<f.right+pad&&r.right>f.left-pad&&r.top<f.bottom+pad&&r.bottom>f.top-pad)hit=true;}
    fab.classList.toggle('dodge',hit);
  }
  function req(){if(!ticking){ticking=true;requestAnimationFrame(check);}}
  window.addEventListener('scroll',req,{passive:true});window.addEventListener('resize',req);
  document.addEventListener('click',function(){setTimeout(req,350)});
  document.addEventListener('tmlang',function(){setTimeout(req,400)});
})();

/* ── message bubbles ── */
function bubbleUser(t){var d=document.createElement('div');d.className='tmc-msg tmc-user';d.textContent=t;msgsEl.appendChild(d);scrollDown()}
function bubbleBot(stream){var d=document.createElement('div');d.className='tmc-msg tmc-bot'+(stream?' tmc-stream':'');msgsEl.appendChild(d);scrollDown();return d}
function addBot(t){bubbleBot(false).innerHTML=md(t)}

/* ── booking handoff (chat → WhatsApp with prefilled details) ── */
var TM_WA='972587777750';
function extractBooking(text){
  var m=text.match(/<<<BOOKING>>>([\s\S]*?)<<<END>>>/);
  if(!m)return{clean:text,booking:null};
  var clean=(text.slice(0,m.index)+text.slice(m.index+m[0].length)).trim();
  var booking=null;
  try{booking=JSON.parse(m[1]);}catch(e){}
  return{clean:clean,booking:booking};
}
function bookingWaText(b){
  var L=clang()==='en';
  var lines=[L?'Hi! 🥊 Trial class booking from the site:':'היי! 🥊 קביעת שיעור ניסיון דרך האתר:'];
  if(b.name)lines.push((L?'Name: ':'שם: ')+b.name);
  if(b.phone)lines.push((L?'Phone: ':'טלפון: ')+b.phone);
  if(b.age)lines.push((L?'Age: ':'גיל: ')+b.age);
  if(b.interest)lines.push((L?'Interest: ':'תחום: ')+b.interest);
  if(b.day)lines.push((L?'Preferred day: ':'יום מועדף: ')+b.day);
  return lines.join('\n');
}
function showBookingCard(b){
  if(!b||!b.name&&!b.phone)return;
  var L=clang()==='en';
  var card=document.createElement('div');card.className='tmc-booking';
  var rows=document.createElement('div');rows.className='tmc-booking-rows';
  var f=[];
  if(b.name)f.push('<b>'+(L?'Name':'שם')+':</b> '+b.name);
  if(b.phone)f.push('<b>'+(L?'Phone':'טלפון')+':</b> '+b.phone);
  if(b.age)f.push('<b>'+(L?'Age':'גיל')+':</b> '+b.age);
  if(b.interest)f.push('<b>'+(L?'Interest':'תחום')+':</b> '+b.interest);
  if(b.day)f.push('<b>'+(L?'Day':'יום')+':</b> '+b.day);
  rows.innerHTML=f.join('<br>');
  var a=document.createElement('a');a.className='btn btn-md btn-wa tappable';
  a.target='_blank';a.rel='noopener';a.setAttribute('data-pos','chat-booking');
  a.href='https://wa.me/'+TM_WA+'?text='+encodeURIComponent(bookingWaText(b));
  a.textContent=L?'✅ Confirm on WhatsApp':'✅ אשר/י בוואטסאפ';
  card.appendChild(rows);card.appendChild(a);
  msgsEl.appendChild(card);scrollDown();
}
/* typewriter for non-streaming bot messages (greeting + demo fallback) */
function typeBot(text,speed,done){
  var bot=bubbleBot(true);
  typeInto(bot,text,{done:function(){if(done)done();}});
  return bot;
}
function showTyping(){var d=document.createElement('div');d.className='tmc-typing';d.id='tmcTyping';d.innerHTML='<span class="tmc-td"></span><span class="tmc-td"></span><span class="tmc-td"></span>';msgsEl.appendChild(d);scrollDown()}
function rmTyping(){var t=el('tmcTyping');if(t)t.remove()}

/* ── quick reply chips ── */
function addChips(){
  var w=document.createElement('div');w.className='tmc-chips';
  T().chips.forEach(function(q){
    var b=document.createElement('button');b.className='tmc-chip tappable';b.textContent=q;
    b.addEventListener('click',function(){w.remove();inp.value=q;send()});
    w.appendChild(b);
  });
  msgsEl.appendChild(w);scrollDown();
}
function greet(){
  showTyping();
  setTimeout(function(){rmTyping();typeBot(T().welcome,14,addChips);},500);
}

/* ── streaming state ── */
function setStreaming(on){streaming=on;sendBtn.style.display=on?'none':'grid';stopBtn.style.display=on?'grid':'none';inp.disabled=on}
function stop(){if(controller)controller.abort()}
stopBtn.addEventListener('click',stop);

/* ── send ── */
function send(){
  if(streaming)return;
  var text=inp.value.trim();if(!text)return;
  inp.value='';inp.style.height='auto';
  bubbleUser(text);msgs.push({role:'user',content:text});
  realSend();
}
inp.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}});
inp.addEventListener('input',function(){this.style.height='auto';this.style.height=Math.min(this.scrollHeight,104)+'px'});
sendBtn.addEventListener('click',send);

/* ── Groq streaming + typewriter ── */
function realSend(){
  showTyping();setStreaming(true);
  controller=new AbortController();
  var aborted=false,typeTimer=null,bot=null;
  controller.signal.addEventListener('abort',function(){
    aborted=true;
    if(typeTimer){
      typeTimer.stop();typeTimer=null;
      if(bot){bot.classList.remove('tmc-stream');
        bot.innerHTML+='<span class="tmc-stopped">'+T().stopped+'</span>';
        msgs.push({role:'assistant',content:bot.textContent});}
      setStreaming(false);controller=null;
    }
  });
  fetch('/api/chat',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({lang:clang(),messages:msgs.slice(-MAX_HIST).map(function(m){return {role:m.role,content:String(m.content).slice(0,m.role==='user'?1000:2400)};})}),
    signal:controller.signal
  }).then(function(res){
    if(!res.ok)throw new Error('HTTP '+res.status);
    return res.json();
  }).then(function(data){
    rmTyping();
    if(aborted)return;
    var raw=(data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content)||'';
    if(!raw){addBot(T().err);setStreaming(false);controller=null;return;}
    var ex=extractBooking(raw),content=ex.clean;
    bot=bubbleBot(true);
    typeTimer=typeInto(bot,content,{done:function(){
      typeTimer=null;if(aborted)return;
      msgs.push({role:'assistant',content:content});
      setStreaming(false);controller=null;
      if(ex.booking)showBookingCard(ex.booking);
      if(window.innerWidth>600)setTimeout(function(){inp.focus()},60);
    }});
  }).catch(function(err){
    rmTyping();
    if(err.name!=='AbortError'&&!aborted){
      addBot((''+(err.message||'')).indexOf('429')>-1?T().busy:T().err);
      console.error('[TM Chat]',err);
    }
    if(!aborted){setStreaming(false);controller=null;}
  });
}

/* ── tmOpenChat (finder → AI handoff) + language sync ── */
window.tmOpenChat=function(text,autosend){
  if(!panel.classList.contains('open'))toggle();
  setTimeout(function(){
    if(text){inp.value=text;inp.style.height='auto';inp.style.height=Math.min(inp.scrollHeight,104)+'px';
      if(autosend)send(); else inp.focus();}
  },440);
};
function applyChatLang(){
  inp.placeholder=T().placeholder;
  var chips=msgsEl.querySelector('.tmc-chips');
  if(chips){chips.remove();addChips();}
}
document.addEventListener('tmlang',applyChatLang);
applyChatLang();

/* ── mobile keyboard ── */
if(window.visualViewport){
  function vv(){if(window.innerWidth>600)return;if(!panel.classList.contains('open'))return;
    var v=window.visualViewport,kb=window.innerHeight-v.height-v.offsetTop;
    panel.style.bottom=Math.max(0,kb)+'px';scrollDown();}
  window.visualViewport.addEventListener('resize',vv);
  window.visualViewport.addEventListener('scroll',vv);
}
})();
