/* ═══════════════════════════════════════════════════════════════
   TEAM MIZRACHI — interactions
═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';
var WA='972587777750';
var reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
var touch=('ontouchstart'in window)||navigator.maxTouchPoints>0;
var $=function(s,c){return (c||document).querySelector(s)};
var $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};

/* ── WhatsApp link builder ── */
function wa(text){return 'https://wa.me/'+WA+'?text='+encodeURIComponent(text)}
var WA_MSGS={
  join:'שלום! 🥊 הגעתי מהאתר של Team Mizrachi ואשמח לשמוע פרטים על שיעור ניסיון.',
  coach:'שלום! 🥊 הגעתי מהאתר של Team Mizrachi ואשמח לדבר עם מאמן על הסגנון שמתאים לי.'
};
$$('[data-wa]').forEach(function(el){
  var k=el.getAttribute('data-wa');
  el.href=wa(WA_MSGS[k]||WA_MSGS.join);
});

/* ── Summer camp registration links ── */
var REG_URL='https://team-mizrachi-kaytzanet.netlify.app/';
$$('[data-reg]').forEach(function(el){
  el.href=REG_URL;
  el.target='_blank';
  el.rel='noopener';
});

/* ── Camp registration badge: dismissible once per session ── */
(function(){
  var cb=document.getElementById('campBadge');
  if(!cb)return;
  var seen;try{seen=sessionStorage.getItem('campBadgeSeen')}catch(_){}
  if(seen){cb.style.display='none';return;}
  var x=document.getElementById('campBadgeX');
  if(x)x.addEventListener('click',function(e){
    e.preventDefault();e.stopPropagation();
    cb.classList.add('hide');
    try{sessionStorage.setItem('campBadgeSeen','1')}catch(_){}
    setTimeout(function(){cb.style.display='none'},400);
  });
})();

/* ── DATA ── */
var DISCIPLINES=[
  {n:'MMA',sub:L2('אומנות הלחימה המעורבת — הסופית','Mixed Martial Arts — the ultimate'),ic:'flame',
   msg:L2('שלום! 💪 מתעניין/ת בשיעורי MMA ב-Team Mizrachi — אשמח לפרטים!','Hi! 💪 Interested in MMA classes at Team Mizrachi — would love details!')},
  {n:'BJJ',sub:L2('ג\'יו ג\'יטסו ברזילאי — שליטה על הקרקע','Brazilian Jiu-Jitsu — ground control'),ic:'grapple',
   msg:L2('שלום! 💪 מתעניין/ת בשיעורי BJJ ב-Team Mizrachi — אשמח לפרטים!','Hi! 💪 Interested in BJJ classes at Team Mizrachi — would love details!')},
  {n:L2('ג\'ודו','Judo'),sub:L2('טכניקה, כוח ורגישות בתנועה','Technique, strength and body awareness'),ic:'judo',
   msg:L2('שלום! 💪 מתעניין/ת בשיעורי ג\'ודו ב-Team Mizrachi — אשמח לפרטים!','Hi! 💪 Interested in Judo classes at Team Mizrachi — would love details!')},
  {n:'Muay Thai',sub:L2('איגרוף תאילנדי — 8 נקודות מגע','Thai Boxing — 8 points of contact'),ic:'strike',
   msg:L2('שלום! 💪 מתעניין/ת בשיעורי Muay Thai ב-Team Mizrachi — אשמח לפרטים!','Hi! 💪 Interested in Muay Thai at Team Mizrachi — would love details!')},
  {n:L2('גרפלינג','Grappling'),sub:L2('היאבקות ללא חליפה — NOGI','No-gi wrestling — NOGI'),ic:'grip',
   msg:L2('שלום! 💪 מתעניין/ת בשיעורי גרפלינג ב-Team Mizrachi — אשמח לפרטים!','Hi! 💪 Interested in Grappling at Team Mizrachi — would love details!')},
  {n:L2('קרב מגע','Krav Maga'),sub:L2('הגנה עצמית אמיתית ויעילה','Real, effective self-defense'),ic:'shield',
   msg:L2('שלום! 💪 מתעניין/ת בשיעורי קרב מגע ב-Team Mizrachi — אשמח לפרטים!','Hi! 💪 Interested in Krav Maga at Team Mizrachi — would love details!')}
];
var ICONS={
  flame:'<path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 002.5 2.5z"/>',
  grapple:'<circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.1a4 4 0 010 7.8M21 21v-2a4 4 0 00-3-3.9"/>',
  /* grip (lucide "grab"): grappling gets its own icon, distinct from BJJ */
  grip:'<path d="M18 11.5V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1.4"/><path d="M14 10V8a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 9.9V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v5"/><path d="M6 14a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8 2 2 0 1 1 4 0"/>',
  judo:'<path d="M6 21l6-13 6 13"/><path d="M9 14h6"/><circle cx="12" cy="5" r="2"/>',
  strike:'<path d="M4 14a1 1 0 01-.78-1.63l9.9-10.2a.5.5 0 01.86.46l-1.92 6.02A1 1 0 0013 10h7a1 1 0 01.78 1.63l-9.9 10.2a.5.5 0 01-.86-.46l1.92-6.02A1 1 0 0011 14z"/>',
  shield:'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 01-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 011-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 011.52 0C14.51 3.81 17 5 19 5a1 1 0 011 1z"/>',
  target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  users:'<path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>',
  child:'<circle cx="12" cy="5" r="3"/><path d="M9 21v-6l-2-2 2-4h6l2 4-2 2v6"/>',
  heart:'<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/>'
};
function svg(name,w){w=w||24;return '<svg viewBox="0 0 24 24" width="'+w+'" height="'+w+'" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+(ICONS[name]||'')+'</svg>'}

var COACHES=[
  {name:L2('אורי מזרחי','Uri Mizrachi'),role:L2('מייסד ומאמן MMA בכיר','Founder & Head MMA Coach'),city:L2('גבעת שמואל','Givat Shmuel'),sensei:true,img:'media/coach-uri-mizrachi.webp'},
  {name:L2('אורי אוחנה','Uri Ohana'),role:L2('מאמן MMA בכיר','Senior MMA Coach'),img:'media/coach-uri-ohana.webp'},
  {name:L2('רועי דמארי','Roi Damari'),role:L2('דאן 1 ג\'ודו וקארטה','Judo & Karate Dan 1'),img:'media/coach-roi-damari.webp'},
  {name:L2('רועי כהן','Roi Cohen'),role:L2('מאמן BJJ ברזילאי','Brazilian BJJ Coach'),img:'media/coach-roi-cohen.webp'},
  {name:L2('אורי אברהמי','Uri Avrahami'),role:L2('ג\'ודו אולימפי · נבחרת ישראל','Olympic Judo · Israel Team'),img:'media/coach-uri-avrahami.webp'},
  {name:L2('מאיר ארבל','Meir Arbel'),role:L2('קארטה · קרב מגע · ג\'ודו','Karate · Krav Maga · Judo'),img:'media/coach-meir-arbel.webp'},
  {name:L2('אוסנת קוליוק','Osnat Kolyuk'),role:L2('מאמנת MMA · נשים וילדות','MMA Coach · Women & Girls'),img:'media/coach-osnat-kolyuk.webp'}
];

/* schedule data verified directly against the official matnas system, class-by-class (July 2026) */
var LINK={
  judoH:'https://givatshmuel.org.il/%D7%92-%D7%95%D7%93%D7%95-%D7%94%D7%91%D7%99%D7%AA-%D7%94%D7%99%D7%A8%D7%95%D7%A7/',
  judoC:'https://givatshmuel.org.il/0-1782295041-/',
  bjj:'https://givatshmuel.org.il/%D7%92-%D7%99%D7%90%D7%95%D7%92-%D7%99%D7%98%D7%A1%D7%95-%D7%91%D7%91%D7%99%D7%AA-%D7%94%D7%99%D7%A8%D7%95%D7%A7/',
  grappleC:'https://givatshmuel.org.il/0-1782652150-/',
  mmaC:'https://givatshmuel.org.il/%D7%97%D7%95%D7%92-mma-%D7%90%D7%95%D7%9E%D7%A0%D7%95%D7%AA-%D7%9C%D7%97%D7%99%D7%9E%D7%94-%D7%91%D7%A9%D7%9C%D7%95%D7%97%D7%AA-%D7%99%D7%A6%D7%97%D7%A7-%D7%A9%D7%9E%D7%99%D7%A8-27/',
  mmaH:'https://givatshmuel.org.il/0-1782284516-/',
  girls:'https://givatshmuel.org.il/%D7%90%D7%99%D7%9E%D7%95%D7%A0%D7%99-%D7%94%D7%92%D7%A0%D7%94-%D7%A2%D7%A6%D7%9E%D7%99%D7%AA-%D7%91%D7%A0%D7%95%D7%AA-teamizrachi-academy/',
  allin:'https://givatshmuel.org.il/%D7%9E%D7%A0%D7%95%D7%99-%D7%97%D7%95%D7%A4%D7%A9%D7%99-all-in-%D7%A4%D7%AA%D7%95%D7%97-%D7%9C%D7%9B%D7%9C%D7%9C-%D7%90%D7%99%D7%9E%D7%95%D7%A0%D7%99-%D7%94%D7%90%D7%A7%D7%93%D7%9E%D7%99%D7%94-teamizrachi-academy/',
  muayC:'https://givatshmuel.org.il/%D7%90%D7%92%D7%A8%D7%A3-%D7%AA%D7%90%D7%99%D7%9C%D7%A0%D7%93%D7%99-%D7%91%D7%A9%D7%9C%D7%95%D7%97%D7%AA-%D7%A9%D7%9E%D7%99%D7%A8/',
  muayH:'https://givatshmuel.org.il/duplicated-1782652086/',
  womenBox:'https://givatshmuel.org.il/%D7%97%D7%95%D7%92-%D7%90%D7%99%D7%92%D7%A8%D7%95%D7%A3-%D7%A0%D7%A9%D7%99%D7%9D-teamizrachi-academy/'
};
var TM_PRIVATE_WA=wa('שלום! 🥊 מעוניין/ת בשיעור פרטי ב-Team Mizrachi — אשמח לתאם.');
function C(he,en,link){return {t:L2(he,en),link:link};}
var DAYS={
  sun:[
    ['10:00–13:00', C('BJJ GI','BJJ GI',LINK.bjj), C('איגרוף תאילנדי','Muay Thai',LINK.muayC)],
    ['13:00–16:15', C('שיעורים פרטיים','Private lessons',TM_PRIVATE_WA), C('שיעורים פרטיים','Private lessons',TM_PRIVATE_WA)],
    ['15:15', C('MMA נבחרת','MMA Select Team',LINK.allin), null],
    ['16:00', C('MMA ג-ה','MMA Grades 3-5',LINK.mmaH), C('ג\'ודו ג-ה','Judo Grades 3-5',LINK.judoC)],
    ['16:45', C('MMA א-ב','MMA Beginners',LINK.mmaH), C('ג\'ודו א-ב','Judo Grades 1-2',LINK.judoC)],
    ['17:30', C('ג\'ודו חובה+א','Judo Kindergarten+1st Grade',LINK.judoH), C('ג\'ודו חובה+א','Judo Kindergarten+1st Grade',LINK.judoC)],
    ['17:45', C('ג\'ודו אולימפי ג-ה','Olympic Judo Grades 3-5',LINK.judoH), null],
    ['18:15', C('MMA ו-ח','MMA Grades 6-8',LINK.mmaH), C('ג\'ודו ו-ח','Judo Grades 6-8',LINK.judoC)],
    ['18:30', C('ג\'ודו ו-ח','Judo Grades 6-8',LINK.judoH), null],
    ['19:30', C('BJJ GI נוער/בוגרים','BJJ GI Youth/Adults',LINK.bjj), C('איגרוף תאילנדי נוער/בוגרים','Muay Thai Youth/Adults',LINK.muayC)]
  ],
  mon:[
    ['13:00–16:15', C('שיעורים פרטיים','Private lessons',TM_PRIVATE_WA), C('שיעורים פרטיים','Private lessons',TM_PRIVATE_WA)],
    ['15:15', null, C('MMA נבחרת','MMA Select Team',LINK.allin)],
    ['16:00', null, C('MMA ג-ה','MMA Grades 3-5',LINK.mmaC)],
    ['16:45', C('ג\'ודו ב-ה','Judo Grades 2-5',LINK.judoH), C('MMA א-ב','MMA Beginners',LINK.mmaC)],
    ['17:30', C('ג\'ודו חובה+א','Judo Kindergarten+1st Grade',LINK.judoH), C('MMA חובה 7-12','MMA Ages 7-12',LINK.mmaC)],
    ['18:15', C('הגנה עצמית בנות ג-ה','Girls Self-Defense 3-5',LINK.girls), C('MMA ו-ח','MMA Grades 6-8',LINK.mmaC)],
    ['19:30', C('הגנה עצמית נערות','Teen Girls Self-Defense',LINK.girls), C('Grappling BJJ NOGI נוער/בוגרים','Grappling BJJ NOGI Youth/Adults',LINK.grappleC)],
    ['20:15', C('איגרוף לנשים בלבד','Women-Only Boxing',LINK.womenBox), C('MMA בוגרים','MMA Adults',LINK.mmaC)]
  ],
  tue:[
    ['10:00–13:00', C('BJJ GI','BJJ GI',LINK.bjj), C('איגרוף תאילנדי','Muay Thai',LINK.muayC)],
    ['13:00–16:15', C('שיעורים פרטיים','Private lessons',TM_PRIVATE_WA), C('שיעורים פרטיים','Private lessons',TM_PRIVATE_WA)],
    ['15:15', C('MMA נבחרת','MMA Select Team',LINK.allin), null],
    ['16:00', C('איגרוף תאילנדי ג-ה','Muay Thai Grades 3-5',LINK.muayH), null],
    ['16:45', C('איגרוף תאילנדי א-ב','Muay Thai Beginners',LINK.muayH), null],
    ['17:30', C('איגרוף תאילנדי ו-ח','Muay Thai Grades 6-8',LINK.muayH), null],
    ['18:15', C('איגרוף תאילנדי נוער','Muay Thai Youth',LINK.muayH), null],
    ['19:15', C('איגרוף תאילנדי בוגרים','Muay Thai Adults',LINK.muayH), null]
  ],
  wed:[
    ['13:00–16:15', C('שיעורים פרטיים','Private lessons',TM_PRIVATE_WA), C('שיעורים פרטיים','Private lessons',TM_PRIVATE_WA)],
    ['15:15', C('MMA נבחרת','MMA Select Team',LINK.allin), null],
    ['16:00', C('MMA ג-ה','MMA Grades 3-5',LINK.mmaH), C('ג\'ודו ג-ה','Judo Grades 3-5',LINK.judoC)],
    ['16:45', C('MMA א-ב','MMA Beginners',LINK.mmaH), C('ג\'ודו א-ב','Judo Grades 1-2',LINK.judoC)],
    ['17:00', C('ג\'ימבו גן חובה','Gymbo Kindergarten',LINK.judoH), null],
    ['17:30', null, C('ג\'ודו חובה+א','Judo Kindergarten+1st Grade',LINK.judoC)],
    ['18:15', C('הגנה עצמית בנות ג-ה','Girls Self-Defense 3-5',LINK.girls), C('ג\'ודו ו-ח','Judo Grades 6-8',LINK.judoC)],
    ['18:15 ', C('הגנה עצמית נערות','Teen Girls Self-Defense',LINK.girls), null],
    ['18:15  ', C('MMA ו-ח','MMA Grades 6-8',LINK.mmaH), null],
    ['19:30', C('BJJ GI חליפה','BJJ GI Gi',LINK.bjj), C('איגרוף תאילנדי נוער/בוגרים','Muay Thai Youth/Adults',LINK.muayC)],
    ['20:15', C('איגרוף לנשים בלבד','Women-Only Boxing',LINK.womenBox), null]
  ],
  thu:[
    ['10:00–13:00', C('איגרוף תאילנדי','Muay Thai',LINK.muayH), null],
    ['13:00–16:15', C('שיעורים פרטיים','Private lessons',TM_PRIVATE_WA), C('שיעורים פרטיים','Private lessons',TM_PRIVATE_WA)],
    ['15:15', null, C('MMA נבחרת','MMA Select Team',LINK.allin)],
    ['16:00', null, C('MMA ג-ה','MMA Grades 3-5',LINK.mmaC)],
    ['16:45', null, C('MMA א-ב','MMA Beginners',LINK.mmaC)],
    ['17:30', null, C('MMA חובה 7-12','MMA Ages 7-12',LINK.mmaC)],
    ['18:15', null, C('MMA ו-ח','MMA Grades 6-8',LINK.mmaC)],
    ['19:30', null, C('Grappling BJJ NOGI','Grappling BJJ NOGI',LINK.grappleC)],
    ['20:15', null, C('MMA בוגרים','MMA Adults',LINK.mmaC)]
  ],
  fri:[
    ['10:00–13:00', C('מזרן פתוח NOGI','Open Mat NOGI','free'), C('איגרוף תאילנדי','Muay Thai','free')],
    ['19:30', C('MMA נוער/בוגרים','MMA Youth/Adults','free'), C('איגרוף תאילנדי נוער/בוגרים','Muay Thai Youth/Adults','free')]
  ],
  sat:[
    ['19:30', C('MMA נוער/בוגרים','MMA Youth/Adults',LINK.mmaH), C('איגרוף תאילנדי נוער/בוגרים','Muay Thai Youth/Adults',LINK.muayC)]
  ]
};

/* ── RENDER: disciplines ── */
(function(){
  var g=$('#discGrid');var h='';
  DISCIPLINES.forEach(function(d,i){
    h+='<a class="disc-card tappable" data-tilt data-pos="disc-card-'+(i+1)+'" href="'+wa(d.msg)+'" target="_blank" rel="noopener">'+
       '<span class="disc-ic">'+svg(d.ic,26)+'</span>'+
       '<span class="disc-go"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/></svg></span>'+
       '<span class="disc-name lat">'+d.n+'</span>'+
       '<span class="disc-sub">'+d.sub+'</span></a>';
  });
  g.innerHTML=h;
})();

/* ── RENDER: coaches ── */
(function(){
  var g=$('#coachGrid');var h='';
  COACHES.forEach(function(c){
    h+='<div class="coach'+(c.sensei?' sensei':'')+'" data-tilt>'+
       '<div class="sheen"></div>'+
       (c.sensei?'<span class="coach-tag">'+L2('הסנסיי','Head Coach')+'</span>':'')+
       '<div class="coach-pic"><img src="'+c.img+'" width="320" height="320" alt="'+c.name+'" loading="lazy" decoding="async"></div>'+
       '<div class="coach-bar"></div>'+
       '<div class="coach-body"><div class="coach-name">'+c.name+'</div>'+
       '<div class="coach-role">'+c.role+'</div>'+
       (c.city?'<span class="coach-city">'+c.city+'</span>':'')+'</div></div>';
  });
  g.innerHTML=h;
})();

/* ── RENDER: schedule ── */
function chip(cell,pos){
  if(!cell)return '<span class="chip none">—</span>';
  if(cell.link==='free')return '<span class="chip free">'+cell.t+' · '+L2('חינם','Free')+'</span>';
  return '<a class="chip" data-pos="'+pos+'" href="'+cell.link+'" target="_blank" rel="noopener">'+cell.t+'</a>';
}
var DAY_NAMES={sun:'יום ראשון',mon:'יום שני',tue:'יום שלישי',wed:'יום רביעי',thu:'יום חמישי',fri:'יום שישי',sat:'שבת'};
var DAY_NAMES_EN={sun:'Sunday',mon:'Monday',tue:'Tuesday',wed:'Wednesday',thu:'Thursday',fri:'Friday',sat:'Saturday'};
(function(){
  var b=$('#schedBody');var h='';
  Object.keys(DAYS).forEach(function(d,i){
    var dayName=DAY_NAMES[d];
    h+='<div class="day'+(i===0?' on':'')+'" data-day="'+d+'" role="tabpanel" aria-label="'+dayName+'"><table role="table"><caption class="sr-only">'+L2('לוח זמנים — '+dayName,'Schedule — '+DAY_NAMES_EN[d])+'</caption><thead><tr role="row">'+
       '<th scope="col" role="columnheader"><span class="lh">שעה</span><span class="le">Time</span></th><th scope="col" role="columnheader"><span class="loc green"><i></i><span class="lh">מתחם הירוק</span><span class="le">HaYarok Site</span></span></th><th scope="col" role="columnheader"><span class="loc blue"><i></i><span class="lh">מתחם CENTER</span><span class="le">CENTER Site</span></span></th></tr></thead><tbody>';
    DAYS[d].forEach(function(r){
      /* hg/hc: the row has a class at HaYarok / CENTER (phones show one location at a time, no empty slots) */
      h+='<tr role="row" class="'+(r[1]?'hg':'')+(r[2]?' hc':'')+'"><td class="th-time" role="cell"><bdi>'+r[0].trim()+'</bdi></td>'+
         '<td class="cell g" role="cell">'+chip(r[1],'sched-'+d+'-hayarok')+'</td>'+
         '<td class="cell c" role="cell">'+chip(r[2],'sched-'+d+'-center')+'</td></tr>';
    });
    h+='</tbody></table></div>';
  });
  b.innerHTML=h;
})();

/* ── LOADER — real progress (fonts), not a fake timer; skipped on
   same-session revisits ──
   The bar is driven by two signals blended together: an animated
   baseline (so it's never static/dead even on a fast connection) and
   the actual document.fonts.ready promise (so 0→100 reflects real
   work — the custom type actually being ready — instead of an
   arbitrary countdown). Whichever finishes last wins, capped by a
   hard timeout so a slow/blocked font host can never hang the site. */
(function(){
  var bar=$('#lbar'),pct=$('#lpct'),load=$('#load'),wipe=$('#wipe');
  var seen;try{seen=sessionStorage.getItem('tmSeen')}catch(_){}
  document.body.style.overflow='hidden';
  function paint(p){bar.style.width=p+'%';pct.textContent=Math.floor(p)+'%';}
  function finish(){
    try{sessionStorage.setItem('tmSeen','1')}catch(_){}
    wipe.classList.add('go');
    load.classList.add('gone');
    document.body.style.overflow='';
    boot();
  }
  if(seen||reduce){ /* returning visitor (or reduced motion): straight in */
    paint(100);
    setTimeout(finish,reduce?40:120);
    return;
  }
  var fontsReady=false,animDone=false,settled=false;
  function trySettle(){
    if(settled||!animDone||!fontsReady)return;
    settled=true;
    paint(100);
    load.classList.add('done'); /* finish flash */
    setTimeout(finish,220);
  }
  /* real signal: custom webfonts actually ready to paint with */
  var fontsPromise=(window.document&&document.fonts&&document.fonts.ready)?document.fonts.ready:Promise.resolve();
  Promise.race([
    fontsPromise.catch(function(){}),
    new Promise(function(res){setTimeout(res,2200);}) /* hard cap: never blocks the site */
  ]).then(function(){fontsReady=true;trySettle();});
  /* animated baseline: eases up to 92% on its own, holds until fonts
     actually confirm ready, then both signals release the last stretch */
  var p=0,start=performance.now();
  function tick(now){
    var el=now-start;
    var target=92*(1-Math.pow(1-Math.min(el/900,1),3)); /* cubic-out over ~0.9s */
    if(target>p)p=target;
    paint(Math.min(p,fontsReady?100:92));
    if(el<900||!fontsReady){requestAnimationFrame(tick);}
    else{animDone=true;trySettle();}
  }
  requestAnimationFrame(tick);
  /* absolute safety: if something above never settles, don't trap the visitor */
  setTimeout(function(){if(!settled){settled=true;paint(100);finish();}},3200);
})();

/* ── BOOT after loader ── */
function boot(){
  initReveal();initHero();initTape();
  setTimeout(function(){$('#wipe').style.display='none';},800);
}

/* ── REVEAL ── */
function initReveal(){
  if(!('IntersectionObserver' in window)||reduce){$$('.rev').forEach(function(el){el.classList.add('in');});}
  else{
    var o=new IntersectionObserver(function(es){
      es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');o.unobserve(e.target);}});
    },{threshold:0,rootMargin:'0px 0px -8% 0px'});
    $$('.rev').forEach(function(el){o.observe(el);});
    /* the wins row scrolls sideways on phones: cards off to the side would never
       intersect, so the whole row reveals together the moment it enters */
    var wg=$('#winsGrid');
    if(wg)new IntersectionObserver(function(es,ob){
      if(!es[0].isIntersecting)return;ob.disconnect();
      $$('.win-card',wg).forEach(function(c){c.classList.add('in');o.unobserve(c);});
    },{threshold:0,rootMargin:'0px 0px -8% 0px'}).observe(wg);
  }
  /* stagger disc + coaches */
  staggerIn('#discGrid','.disc-card',60);
  staggerIn('#coachGrid','.coach',55);
}
function staggerIn(grid,sel,gap){
  var el=$(grid);if(!el)return;
  var items=$$(sel,el);
  if(reduce)return;
  items.forEach(function(it){it.style.opacity='0';it.style.transform='translateY(24px)';});
  new IntersectionObserver(function(es,ob){
    if(!es[0].isIntersecting)return;ob.disconnect();
    items.forEach(function(it,i){setTimeout(function(){
      it.style.transition='opacity .6s var(--ease,cubic-bezier(.16,1,.3,1)),transform .6s var(--ease,cubic-bezier(.16,1,.3,1))';
      it.style.opacity='1';it.style.transform='none';
    },i*gap);});
  },{threshold:.1}).observe(el);
}

/* ── HERO mega entrance + canvas embers ── */
function initHero(){
  /* GSAP cinematic hero entrance — per-letter rise behind the line masks */
  if(typeof gsap!=='undefined'&&!reduce){
    $$('.mega .ln > span').forEach(function(sp){
      var txt=sp.textContent;sp.textContent='';
      txt.split('').forEach(function(ch){
        var c=document.createElement('span');c.className='ch';c.textContent=ch;sp.appendChild(c);
      });
    });
    gsap.set('.mega .ln > span',{y:0});
    gsap.fromTo('.mega .ch',
      {yPercent:110},
      {yPercent:0,duration:0.9,ease:'power4.out',stagger:0.04,delay:0.08,
       clearProps:'transform,willChange'});
  } else {
    $$('.mega .ln>span').forEach(function(s,i){
      s.style.transition='transform .8s '+(0.05+i*0.12)+'s cubic-bezier(.16,1,.3,1)';
      requestAnimationFrame(function(){s.style.transform='none';});
    });
  }
  /* eyebrow / sub / CTAs / tape: CSS-staggered reveal, independent of GSAP */
  var heroEl=$('#hero');
  if(heroEl)requestAnimationFrame(function(){requestAnimationFrame(function(){heroEl.classList.add('ready');});});
  if(reduce||touch)return;
  var cv=$('#heroCv'),hero=$('#hero');if(!cv)return;
  var ctx=cv.getContext('2d'),parts=[],raf,fc=0;
  function size(){cv.width=hero.offsetWidth;cv.height=hero.offsetHeight;}
  size();window.addEventListener('resize',size,{passive:true});
  function mk(){return{x:Math.random()*cv.width,y:cv.height+8,
    vx:(Math.random()-.5)*.4,vy:-(Math.random()*.6+.25),
    a:Math.random()*.5+.12,s:Math.random()*1.9+.4,
    c:Math.random()>.7?'#FF9D5C':(Math.random()>.5?'#FF2E2E':'#D10000')};}
  function loop(){
    if(window.scrollY>hero.offsetHeight){ctx.clearRect(0,0,cv.width,cv.height);raf=requestAnimationFrame(loop);return;}
    ctx.clearRect(0,0,cv.width,cv.height);fc++;
    if(fc%3===0&&parts.length<60)parts.push(mk());
    for(var i=parts.length-1;i>=0;i--){var p=parts[i];
      p.x+=p.vx;p.y+=p.vy;p.a*=.9986;
      if(p.a<.015||p.y<-10){parts.splice(i,1);continue;}
      ctx.globalAlpha=p.a;ctx.fillStyle=p.c;ctx.shadowBlur=6;ctx.shadowColor=p.c;
      ctx.beginPath();ctx.arc(p.x,p.y,p.s,0,6.283);ctx.fill();
    }
    ctx.globalAlpha=1;ctx.shadowBlur=0;raf=requestAnimationFrame(loop);
  }
  loop();
  /* mouse-reactive hero glow */
  hero.addEventListener('mousemove',function(e){
    var x=(e.clientX/window.innerWidth*100),y=(e.clientY/window.innerHeight*100);
    $('.hero-vig').style.background=
      'radial-gradient(ellipse 70% 55% at '+x+'% '+y+'%,rgba(209,0,0,.18),transparent 62%),'+
      'radial-gradient(ellipse 120% 80% at 50% 120%,rgba(255,106,44,.12),transparent 55%),'+
      'linear-gradient(180deg,rgba(8,8,10,.4),transparent 18%,transparent 60%,var(--ink) 100%)';
  },{passive:true});
}

/* ── COUNTERS ── */
function count(el){
  var target=parseInt(el.getAttribute('data-c')),suf=el.getAttribute('data-suf')||'';
  if(isNaN(target))return;
  if(el._counted)return;el._counted=true;
  if(reduce){el.innerHTML=target+(suf?'<b>'+suf+'</b>':'');return;}
  var s=performance.now(),dur=1700;
  (function tick(now){
    var p=Math.min((now-s)/dur,1),e=1-Math.pow(1-p,4);
    el.innerHTML=Math.round(e*target)+(suf?'<b>'+suf+'</b>':'');
    if(p<1)requestAnimationFrame(tick);
  })(performance.now());
}
function initTape(){
  var tape=$('.tape');if(!tape)return;
  new IntersectionObserver(function(es,o){
    if(!es[0].isIntersecting)return;o.disconnect();
    $$('.tape-n[data-c]').forEach(count);
  },{threshold:.4}).observe(tape);
}

/* ── SCROLL: progress, nav, dots, toTop ── */
var nav=$('#nav'),prog=$('#prog'),toTop=$('#toTop');
function onScroll(){
  var sy=window.scrollY,t=document.body.scrollHeight-window.innerHeight;
  prog.style.width=(t>0?sy/t*100:0)+'%';
  nav.classList.toggle('scry',sy>40);
  toTop.classList.toggle('show',sy>700);
  /* nav active + dots */
  var mid=sy+window.innerHeight*.4;
  SEC.forEach(function(id,i){
    var s=document.getElementById(id);if(!s)return;
    var act=mid>=s.offsetTop&&mid<s.offsetTop+s.offsetHeight;
    var a=$('.nlinks a[href="#'+id+'"]');if(a)a.classList.toggle('on',act);
    if(dots[i])dots[i].classList.toggle('on',act);
  });
}
window.addEventListener('scroll',onScroll,{passive:true});
window.tmOnScroll=onScroll; /* exposed for the GSAP/Lenis layer (separate IIFE) */

/* side dots */
var SEC_NAMES={hero:['פתיחה','Top'],promo:['סרטון','Video'],finder:['מצא סגנון','Find your style'],show:['המתחם','The gym'],disc:['תחומים','Disciplines'],coaches:['מאמנים','Coaches'],wins:['ניצחונות','Wins'],sched:['לוח זמנים','Schedule'],register:['הרשמה','Register'],cta:['הצטרפות','Join']};
document.addEventListener('tmlang',function(e){$$('.dot').forEach(function(d){var n=SEC_NAMES[d.getAttribute('data-sec')];if(n)d.setAttribute('aria-label',e.detail==='en'?n[1]:n[0]);});});
var SEC=['hero','promo','finder','show','disc','coaches','wins','sched','register','cta'].filter(function(id){return!!document.getElementById(id)});
var dotWrap=document.createElement('div');dotWrap.className='dots';
var dots=SEC.map(function(id){
  var d=document.createElement('button');d.className='dot';d.setAttribute('data-sec',id);d.setAttribute('aria-label',(SEC_NAMES[id]||[id])[0]);
  d.addEventListener('click',function(){document.getElementById(id).scrollIntoView({behavior:'smooth'})});
  dotWrap.appendChild(d);return d;
});
document.body.appendChild(dotWrap);
onScroll(); /* initial nav/progress state before the first scroll event */

toTop.addEventListener('click',function(){window.scrollTo({top:0,behavior:'smooth'})});

/* ── hero "all classes" shortcut: quality arrival glow on #register ── */
(function(){
  var btn=$('#heroAllClasses'),target=$('#register');
  if(!btn||!target)return;
  btn.addEventListener('click',function(){
    setTimeout(function(){
      target.classList.remove('arrived');void target.offsetWidth; /* restart animation if clicked twice */
      target.classList.add('arrived');
      setTimeout(function(){target.classList.remove('arrived')},1600);
    },reduce?50:820); /* let the (fast, ~0.7-1.1s) scroll actually land first */
  });
})();

/* ── NAV mobile ── */
var burger=$('#burger'),mnav=$('#mnav');
burger.addEventListener('click',function(){
  var open=mnav.classList.toggle('open');burger.classList.toggle('x',open);
  document.body.style.overflow=open?'hidden':'';
});
$$('#mnav a').forEach(function(a){a.addEventListener('click',function(){
  mnav.classList.remove('open');burger.classList.remove('x');document.body.style.overflow='';
});});

/* ── SCHEDULE tabs + sliding indicator ── */
var tabs=$('#tabs'),ind=$('#tabInd');
function moveInd(btn){
  var r=btn.getBoundingClientRect(),pr=tabs.getBoundingClientRect();
  /* RTL: position from right edge */
  ind.style.width=r.width+'px';
  ind.style.right=(pr.right-r.right)+'px';
}
$$('.tab',tabs).forEach(function(btn){
  btn.addEventListener('click',function(){
    $$('.tab',tabs).forEach(function(b){b.classList.remove('on');b.setAttribute('aria-selected','false');});
    btn.classList.add('on');btn.setAttribute('aria-selected','true');moveInd(btn);
    var day=btn.getAttribute('data-day');
    $$('.day').forEach(function(d){d.classList.toggle('on',d.getAttribute('data-day')===day)});
  });
});
/* ── SCHEDULE location toggle (phones): one location at a time ── */
(function(){
  var wrap=$('#locToggle'),board=$('#schedBoard');if(!wrap||!board)return;
  function setLoc(l){
    board.setAttribute('data-loc',l);
    $$('.loc-btn',wrap).forEach(function(b){var on=b.getAttribute('data-loc')===l;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false');});
    try{localStorage.setItem('tmLoc',l)}catch(_){}
  }
  var saved;try{saved=localStorage.getItem('tmLoc')}catch(_){}
  if(saved==='g'||saved==='c')setLoc(saved);
  $$('.loc-btn',wrap).forEach(function(b){b.addEventListener('click',function(){setLoc(b.getAttribute('data-loc'))});});
})();
window.addEventListener('load',function(){moveInd($('.tab.on'))});
window.addEventListener('resize',function(){moveInd($('.tab.on'))});
setTimeout(function(){moveInd($('.tab.on'))},400);

/* ── FINDER (signature interactive) ── */
function L2(a,b){return '<span class="lh">'+a+'</span><span class="le">'+b+'</span>';}
var FQ=[
 {q:L2('מי הולך <span class="r">להתאמן?</span>','Who\'s going to <span class="r">train?</span>'),step:L2('שלב 1 מתוך 4','Step 1 of 4'),opts:[
   {ic:'users',t:L2('אני — בוגר/ת','Me — adult'),s:L2('18+','18+'),v:'adult'},
   {ic:'flame',t:L2('נוער','Teen'),s:L2('גילאי 12–17','Ages 12–17'),v:'teen'},
   {ic:'child',t:L2('ילד/ה','Kid'),s:L2('גילאי 4–11','Ages 4–11'),v:'kid'},
   {ic:'heart',t:L2('אישה','Woman'),s:L2('קבוצות נשים בלבד','Women-only groups'),v:'women'}
 ]},
 {q:L2('מה <span class="r">המטרה</span> שלך?','What\'s your <span class="r">goal?</span>'),step:L2('שלב 2 מתוך 4','Step 2 of 4'),opts:[
   {ic:'flame',t:L2('כושר ושחרור','Fitness & release'),s:L2('להזיע, להתפרק, להרגיש חזק','Sweat, let go, feel strong'),v:'fit'},
   {ic:'shield',t:L2('הגנה עצמית','Self-defense'),s:L2('ביטחון אמיתי ברחוב','Real street confidence'),v:'defense'},
   {ic:'target',t:L2('תחרות וספורט','Competition & sport'),s:L2('להילחם, להתחרות, לנצח','Fight, compete, win'),v:'compete'},
   {ic:'heart',t:L2('ביטחון עצמי','Self-confidence'),s:L2('משמעת, ראש שקט, גוף בריא','Discipline, calm, health'),v:'confidence'}
 ]},
 {q:L2('מה <span class="r">רמת הניסיון</span> שלך?','What\'s your <span class="r">experience level?</span>'),step:L2('שלב 3 מתוך 4','Step 3 of 4'),opts:[
   {ic:'heart',t:L2('מתחיל/ה לגמרי','Complete beginner'),s:L2('אף פעם לא התאמנתי','Never trained before'),v:'beginner'},
   {ic:'strike',t:L2('יש לי קצת ניסיון','Some experience'),s:L2('התנסיתי בעבר','Tried it before'),v:'some'},
   {ic:'target',t:L2('מתקדם/ת','Advanced'),s:L2('מתאמן/ת כבר תקופה','Been training for a while'),v:'advanced'},
   {ic:'shield',t:L2('חוזר/ת אחרי הפסקה','Returning after a break'),s:L2('התאמנתי בעבר ועצרתי','Trained before, then stopped'),v:'return'}
 ]},
 {q:L2('מתי תרצה/י <span class="r">להתחיל?</span>','When do you want <span class="r">to start?</span>'),step:L2('שלב 4 מתוך 4','Step 4 of 4'),opts:[
   {ic:'flame',t:L2('השבוע!','This week!'),s:L2('מוכן/ה להתחיל מיד','Ready to start now'),v:'now'},
   {ic:'target',t:L2('בשבועיים הקרובים','In the next 2 weeks'),s:L2('מתארגן/ת','Getting organized'),v:'soon'},
   {ic:'users',t:L2('תוך חודש','Within a month'),s:L2('עוד לא ממהר/ת','No rush yet'),v:'month'},
   {ic:'judo',t:L2('רק בודק/ת לעת עתה','Just exploring for now'),s:L2('אוסף/ת מידע','Gathering info'),v:'exploring'}
 ]}
];
function recommend(who,goal,exp,timing){
 var r;
 if(who==='kid')r={lat:'KIDS',he:L2('ג\'ימבו · ג\'ודו לילדים','Gymbo · Kids Judo'),desc:L2('מסגרת חמה ובטוחה שבונה ביטחון, משמעת ותיאום — דרך משחק ותנועה. הצעד המושלם הראשון.','A warm, safe setting that builds confidence, discipline and coordination through play. The perfect first step.'),cls:'Gymbo / Kids Judo',score:96,
   fact:L2('קבוצות קטנות לפי גיל, עם מאמנים שיודעים בדיוק איך לדבר בשפה של ילדים','Small age-grouped classes with coaches who know exactly how to speak a kid\'s language')};
 else if(who==='teen')r={lat:'MMA',he:L2('MMA נוער · איגרוף תאילנדי','Teen MMA · Muay Thai'),desc:L2('אנרגיה, כוח וביטחון בגיל הנכון. שילוב של עמידה, קרקע ואיגרוף — בקבוצת נוער מובילה.','Energy, power and confidence at the right age. Striking, ground & boxing in a leading teen group.'),cls:'Teen MMA / Muay Thai',score:94,
   fact:L2('שילוב עמידה, קרקע ואיגרוף בקבוצת הנוער המובילה באזור','Striking, ground and boxing combined in the area\'s leading teen group')};
 else if(who==='women')r={lat:'WOMEN',he:L2('הגנה עצמית · איגרוף לנשים','Self-Defense · Women\'s Boxing'),desc:L2('קבוצות נשים בלבד, אווירה תומכת ומאמנת מקצועית. כוח, ביטחון וכלים אמיתיים להגנה עצמית.','Women-only groups, a supportive vibe and a pro coach. Strength, confidence and real self-defense tools.'),cls:'Self-Defense / Women\'s Boxing',score:97,
   fact:L2('קבוצות נשים בלבד, מאמנת מקצועית ואווירה תומכת ובלי שיפוטיות','Women-only groups, a pro coach and a supportive, judgment-free vibe')};
 else if(goal==='defense')r={lat:'KRAV',he:L2('קרב מגע','Krav Maga'),desc:L2('הגנה עצמית ישראלית, פרקטית ויעילה. לומדים להגיב מהר, בלי כללים — לשרוד כל סיטואציה.','Israeli self-defense, practical and effective. React fast, no rules — survive any situation.'),cls:'Krav Maga',score:93,
   fact:L2('שיטה ישראלית פרקטית שנועדה לתת מענה אמיתי לכל מצב','A practical Israeli method built to give a real answer to any situation')};
 else if(goal==='compete')r={lat:'MMA',he:L2('MMA · BJJ','MMA · BJJ'),desc:L2('הדיסציפלינה השלמה. עמידה, קלינץ\' והגשות — מסלול אמיתי לתחרות תחת מאמנים בכירים.','The complete discipline. Striking, clinch and submissions — a real path to competition.'),cls:'MMA / BJJ',score:95,
   fact:L2('מסלול אמיתי לתחרות תחת מאמנים בכירים עם 15+ שנות ניסיון','A real competition track under senior coaches with 15+ years of experience')};
 else if(goal==='fit')r={lat:'THAI',he:L2('איגרוף תאילנדי · MMA','Muay Thai · MMA'),desc:L2('האימון שמדליק את הגוף. בעיטות, אגרופים וברכיים — קלוריות נשרפות, אבל הראש מתנקה.','The workout that lights you up. Kicks, punches and knees — calories burn, the mind clears.'),cls:'Muay Thai / MMA',score:95,
   fact:L2('אימון אינטרוולים שמבעיר קלוריות ומנקה את הראש תוך שעה אחת','An interval workout that torches calories and clears your head in one hour')};
 else r={lat:'MMA',he:L2('MMA · קרב מגע','MMA · Krav Maga'),desc:L2('הדרך לבנות ביטחון אמיתי: משמעת, כושר וכלים שעובדים. כל אימון הוא צעד קדימה.','The way to build real confidence: discipline, fitness and tools that work. Every session is a step forward.'),cls:'MMA / Krav Maga',score:92,
   fact:L2('שילוב שבונה גם ביטחון וגם כלים אמיתיים להגנה עצמית','A combination that builds both confidence and real self-defense tools')};
 var reasons=[r.fact];
 if(exp==='beginner')reasons.push(L2('קצב לימוד סבלני שמתחיל מהיסודות — בלי שום ניסיון קודם נדרש','A patient, ground-up pace — zero prior experience required'));
 else if(exp==='some')reasons.push(L2('ממשיכים בדיוק מהנקודה שבה עצרת, ומאיצים משם קדימה','Picks up exactly where you left off, and speeds things up from there'));
 else if(exp==='advanced')reasons.push(L2('רמה טכנית וקצב אימון גבוה, מול מאמנים ברמה בינלאומית','Technical depth and a high pace, training alongside internationally-ranked coaches'));
 else reasons.push(L2('חזרה מדורגת וקשובה לגוף — בונים כושר מחדש בלי לסכן פציעה','A gradual, body-aware return — rebuilding fitness without risking injury'));
 if(timing==='now')reasons.push(L2('יש לנו מקום פנוי להתחיל השבוע — שיעור ניסיון ראשון בחינם','We have room to start this week — your first trial class is free'));
 else if(timing==='soon')reasons.push(L2('אפשר לתאם שיעור ניסיון כבר עכשיו ולהתחיל כשנוח לך','Book your trial now and start whenever works for you'));
 else if(timing==='month')reasons.push(L2('אין שום לחץ — נשמור לך את הפרטים ותחזור/י כשמתאים','No pressure at all — we\'ll hold your details until you\'re ready'));
 else reasons.push(L2('גם רק לבדוק זה בסדר גמור — שיעור ניסיון בחינם וללא שום התחייבות','Just checking it out is fine too — a free trial with zero commitment'));
 r.reasons=reasons;
 return r;
}
var fState={};
var fStarted=false; /* analytics: quiz_start once per attempt; cleared only when the attempt completes */
var ANALYZE_MSGS=[
  L2('סורק/ת את התשובות שלך…','Scanning your answers…'),
  L2('משווה מול תחומי הלחימה שלנו…','Matching against our disciplines…'),
  L2('בונה את ההמלצה המדויקת שלך…','Building your precise recommendation…')
];
function renderFinder(step){
  var body=$('#finderBody');var data=FQ[step];
  var dots='';for(var i=0;i<FQ.length;i++)dots+='<span class="f-dot'+(i<=step?' on':'')+'"></span>';
  var opts='';
  data.opts.forEach(function(o){
    opts+='<button class="f-opt tappable" data-v="'+o.v+'">'+
      '<span class="ic">'+svg(o.ic,24)+'</span>'+
      '<span class="ot"><b>'+o.t+'</b><small>'+o.s+'</small></span>'+
      '<span class="arr"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></span></button>';
  });
  body.innerHTML='<div class="f-top"><span class="f-step">'+data.step+'</span><span class="f-prog">'+dots+'</span></div>'+
    '<h3 class="f-q">'+data.q+'</h3><div class="f-opts">'+opts+'</div>';
  $$('.f-opt',body).forEach(function(b){
    b.addEventListener('click',function(){
       binder(b);var v=b.getAttribute('data-v');
      if(!fStarted){fStarted=true;if(window.posthog)window.posthog.capture('quiz_start');}
      if(window.posthog)window.posthog.capture('quiz_step',{step_index:step});
      if(step===0){fState.who=v;setTimeout(function(){renderFinder(1)},180);}
      else if(step===1){fState.goal=v;setTimeout(function(){renderFinder(2)},180);}
      else if(step===2){fState.exp=v;setTimeout(function(){renderFinder(3)},180);}
      else{fState.timing=v;setTimeout(showAnalyzing,180);}
    });
  });
}
function showAnalyzing(){
  var body=$('#finderBody');
  body.innerHTML='<div class="f-analyze">'+
    '<div class="f-an-ring"><svg viewBox="0 0 80 80"><circle class="fa-bg" cx="40" cy="40" r="34"/><circle class="fa-bar" cx="40" cy="40" r="34"/></svg><span class="fa-ic">'+svg('target',24)+'</span></div>'+
    '<div class="f-an-t" id="faText">'+ANALYZE_MSGS[0]+'</div>'+
  '</div>';
  var i=0,txt=$('#faText');
  var iv=setInterval(function(){
    i++;
    if(txt&&i<ANALYZE_MSGS.length){
      txt.style.opacity=0;
      setTimeout(function(){txt.innerHTML=ANALYZE_MSGS[i];txt.style.opacity=1;},220);
    }
  },620);
  setTimeout(function(){clearInterval(iv);showResult();},1950);
}
function showResult(){
  var r=recommend(fState.who,fState.goal,fState.exp,fState.timing);
  fStarted=false;if(window.posthog)window.posthog.capture('quiz_complete',{result:r.cls});
  if(window.tmNotify)window.tmNotify('quiz_complete',{result:r.cls});
  var en=document.documentElement.lang==='en';
  var expLbl={beginner:en?'complete beginner':'מתחיל/ה לגמרי',some:en?'some experience':'עם קצת ניסיון',advanced:en?'advanced':'מתקדם/ת',return:en?'returning after a break':'חוזר/ת אחרי הפסקה'}[fState.exp]||'';
  var timeLbl={now:en?'this week':'השבוע',soon:en?'in the next 2 weeks':'בשבועיים הקרובים',month:en?'within a month':'תוך חודש',exploring:en?'just exploring':'רק בודק/ת'}[fState.timing]||'';
  var msg=en?('Hi! 🥊 I used "Find Your Style" on the Team Mizrachi site and got: '+r.cls+' ('+expLbl+', looking to start '+timeLbl+'). I\'d love details about a free trial!')
            :('שלום! 🥊 עשיתי את "מצא את הסגנון שלך" באתר Team Mizrachi וקיבלתי: '+r.cls+' (רמה: '+expLbl+', רוצה להתחיל '+timeLbl+'). אשמח לפרטים על שיעור ניסיון!');
  var ask=en?('Tell me more about '+r.cls+' at Team Mizrachi — I\'m '+expLbl+' and want to start '+timeLbl+'. Who is it for and how do I begin?')
            :('ספר/י לי עוד על '+r.cls+' ב-Team Mizrachi — אני '+expLbl+' ורוצה להתחיל '+timeLbl+'. למי זה מתאים ואיך מתחילים?');
  var reasonIc='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
  var reasons='';
  r.reasons.forEach(function(rs){reasons+='<li>'+reasonIc+'<span>'+rs+'</span></li>';});
  var body=$('#finderBody');
  body.innerHTML='<div class="f-result">'+
    '<span class="f-badge">'+svg('target',15)+L2('הסגנון שלך','Your style')+'</span>'+
    '<div class="f-rec lat">'+r.lat+'</div>'+
    '<div class="f-rec-he">'+r.he+'</div>'+
    '<p class="f-desc">'+r.desc+'</p>'+
    '<ul class="f-reasons">'+reasons+'</ul>'+
    '<div class="f-actions">'+
      '<a class="btn btn-md btn-fill tappable" data-pos="quiz-result" href="'+wa(msg)+'" target="_blank" rel="noopener"><span class="sweep"></span>'+'<svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/></svg>'+
        (fState.timing==='now'?L2('קבע שיעור ניסיון — השבוע!','Book a trial — this week!'):L2('קבע שיעור ניסיון','Book a free trial'))+'</a>'+
      '<button class="btn btn-md btn-ghost tappable" id="fAsk">'+
        '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'+
        L2('שאל את העוזר','Ask the assistant')+'</button>'+
      '<button class="f-reset tappable" id="fReset">'+L2('נסה שוב ↺','Try again ↺')+'</button>'+
    '</div></div>';
  /* impact: red flash + shell punch-shake + score count-up */
  if(typeof gsap!=='undefined'&&!reduce){
    var shell=$('.finder-shell');
    var flash=document.createElement('div');flash.className='f-flash';body.appendChild(flash);
    gsap.fromTo(flash,{opacity:.85},{opacity:0,duration:.55,ease:'power2.out',
      onComplete:function(){flash.remove()}});
    if(shell)gsap.fromTo(shell,{x:0},{keyframes:[{x:-7,duration:.05},{x:6,duration:.05},{x:-4,duration:.05},{x:2,duration:.05},{x:0,duration:.06}]});
    gsap.from('.f-result > *',{y:26,opacity:0,duration:.6,ease:'power3.out',stagger:.07});
  }
  bindBtns(body);
  var ab=$('#fAsk');if(ab)ab.addEventListener('click',function(){if(window.tmOpenChat)window.tmOpenChat(ask,true);});
  $('#fReset').addEventListener('click',function(){fState={};renderFinder(0);bindBtns($('#finderBody'));});
}
renderFinder(0);


/* ═══════════ UNIVERSAL BUTTON SATISFACTION ═══════════ */
/* ripple from pointer */
function ripple(el,e){
  var r=el.getBoundingClientRect();
  var sz=Math.max(r.width,r.height);
  var x=(e.clientX||r.left+r.width/2)-r.left;
  var y=(e.clientY||r.top+r.height/2)-r.top;
  var s=document.createElement('span');s.className='rip';
  s.style.cssText='width:'+sz+'px;height:'+sz+'px;left:'+(x-sz/2)+'px;top:'+(y-sz/2)+'px';
  el.appendChild(s);setTimeout(function(){s.remove()},650);
}
function binder(el){ /* spring */
  el.classList.remove('spring');void el.offsetWidth;el.classList.add('spring');
  setTimeout(function(){el.classList.remove('spring')},420);
}
function bindBtns(scope){
  $$('.btn,.ncta,.fab,.f-opt,.disc-card,.reg-card,.tab,.fs,.dot,a.chip',scope||document).forEach(function(el){
    if(el._bound)return;el._bound=true;
    el.addEventListener('pointerdown',function(e){ripple(el,e)});
    el.addEventListener('click',function(){binder(el)});
  });
}
bindBtns(document);

/* magnetic CTAs (desktop) */
if(!touch&&!reduce){
  $$('.btn-lg,.ncta,.fab').forEach(function(b){
    b.addEventListener('mousemove',function(e){
      var r=b.getBoundingClientRect();
      var dx=(e.clientX-r.left-r.width/2)*.18,dy=(e.clientY-r.top-r.height/2)*.18;
      b.style.transform='translate('+dx+'px,'+dy+'px)';
    });
    b.addEventListener('mouseleave',function(){
      b.style.transition='transform .4s var(--ease)';b.style.transform='';
      setTimeout(function(){b.style.transition=''},400);
    });
  });
}

/* 3D tilt + pointer-tracked glow (coaches + disc) */
if(!touch&&!reduce){
  $$('[data-tilt]').forEach(function(card){
    var isCoach=card.classList.contains('coach');
    card.addEventListener('mousemove',function(e){
      var r=card.getBoundingClientRect();
      var px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height;
      card.style.setProperty('--mx',(px*100)+'%');
      card.style.setProperty('--my',(py*100)+'%');
      if(isCoach){
        card.style.transition='transform .06s';
        card.style.transform='perspective(800px) rotateY('+((px-.5)*9)+'deg) rotateX('+(-(py-.5)*7)+'deg) translateZ(8px)';
      }
    });
    card.addEventListener('mouseleave',function(){
      if(isCoach){card.style.transition='transform .55s var(--ease)';card.style.transform='';}
    });
  });
}

/* ═══════════ CUSTOM CURSOR ═══════════ */
if(!touch&&!reduce&&window.matchMedia('(min-width:901px)').matches){
  document.body.classList.add('cur-on');
  var cur=$('#cur'),dot=$('#curDot');
  var cx=-100,cy=-100,dx=cx,dy=cy,live=false;
  document.addEventListener('mousemove',function(e){cx=e.clientX;cy=e.clientY;
    if(!live){live=true;dx=cx;dy=cy;document.body.classList.add('cur-live');}
    dot.style.transform='translate('+cx+'px,'+cy+'px) translate(-50%,-50%)';
  },{passive:true});
  document.documentElement.addEventListener('mouseleave',function(){live=false;document.body.classList.remove('cur-live');});
  (function ring(){dx+=(cx-dx)*.18;dy+=(cy-dy)*.18;
    cur.style.transform='translate('+dx+'px,'+dy+'px) translate(-50%,-50%)';
    requestAnimationFrame(ring);})();
  document.addEventListener('mouseover',function(e){
    if(e.target.closest('a,button,.tappable,[data-tilt],input,textarea'))cur.classList.add('hot');
  });
  document.addEventListener('mouseout',function(e){
    if(e.target.closest('a,button,.tappable,[data-tilt],input,textarea'))cur.classList.remove('hot');
  });
  document.addEventListener('mousedown',function(){cur.style.scale='.82'});
  document.addEventListener('mouseup',function(){cur.style.scale='1'});
}


/* ══════════════ LANGUAGE TOGGLE ══════════════ */
var LNG='he';
function setLangNow(l){
  LNG=l;
  document.documentElement.lang=l==='en'?'en':'he';
  document.documentElement.dir=l==='en'?'ltr':'rtl';
  var txt=l==='en'?'עב':'EN';
  var el1=document.getElementById('langTxt'),el2=document.getElementById('mlangTxt');
  if(el1)el1.textContent=txt;if(el2)el2.textContent=txt;
  renderFinder(0);
  var on=document.querySelector('.tab.on');if(on)setTimeout(function(){moveInd(on)},60);
  try{localStorage.setItem('tmLng',l)}catch(_){}
  document.dispatchEvent(new CustomEvent('tmlang',{detail:l}));
}
function applyLang(l,instant){
  if(instant||reduce){setLangNow(l);return;}
  var v=document.getElementById('langVeil');
  var b1=document.getElementById('langBtn'),b2=document.getElementById('mlangBtn');
  if(b1)b1.classList.add('flip');if(b2)b2.classList.add('flip');
  /* 1. slide down */
  if(v){v.classList.remove('rising');v.classList.add('show');}
  if(b1)b1.classList.add('flip');if(b2)b2.classList.add('flip');
  setTimeout(function(){
    /* 2. swap content at peak */
    setLangNow(l);
    setTimeout(function(){
      /* 3. slide up */
      if(v){v.classList.remove('show');v.classList.add('rising');}
      if(b1)b1.classList.remove('flip');if(b2)b2.classList.remove('flip');
      setTimeout(function(){if(v)v.classList.remove('rising');},400);
    },80);
  },340);
}
(function(){
  var saved;try{saved=localStorage.getItem('tmLng')}catch(_){}
  if(saved&&saved!=='he')applyLang(saved,true);
})();
function toggleLang(){applyLang(LNG==='he'?'en':'he');}
var lb=document.getElementById('langBtn'),mlb=document.getElementById('mlangBtn');
if(lb)lb.addEventListener('click',toggleLang);
if(mlb)mlb.addEventListener('click',toggleLang);

/* ══════════════ CONTEXT MENU ══════════════ */
(function(){
  var ctx=document.getElementById('ctx'),timer;
  if(!ctx)return;
  /* wire data-wa inside ctx */
  $$('[data-wa]',ctx).forEach(function(el){
    var k=el.getAttribute('data-wa');
    el.href='https://wa.me/'+WA+'?text='+encodeURIComponent(WA_MSGS[k]||WA_MSGS.join);
  });
  function show(x,y){
    ctx.classList.add('show');ctx.removeAttribute('aria-hidden');
    /* keep inside viewport */
    var vw=window.innerWidth,vh=window.innerHeight;
    var cw=244,ch=ctx.offsetHeight||280;
    var fx=Math.min(x,vw-cw-12),fy=Math.min(y,vh-ch-12);
    ctx.style.left=fx+'px';ctx.style.top=fy+'px';
    clearTimeout(timer);timer=setTimeout(hide,6000);
  }
  function hide(){ctx.classList.remove('show');ctx.setAttribute('aria-hidden','true')}
  document.addEventListener('contextmenu',function(e){
    e.preventDefault();show(e.clientX,e.clientY);
  });
  document.addEventListener('click',function(e){if(!ctx.contains(e.target))hide()});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')hide()});
  $$('a,.ctx-item',ctx).forEach(function(a){a.addEventListener('click',function(){hide()})});
})();

/* ══════════════ INSTAGRAM REEL — click-to-play facade ══════════════
   Nothing loads until the person actually asks for it: keeps #promo fast
   and premium from first paint instead of racing Instagram's heavy embed
   in the background while the rest of the page is still animating in. */
(function(){
  var ifr=document.getElementById('reelIframe'),skel=document.getElementById('reelSkel');
  if(!ifr||!skel)return;
  var loaded=false,failed=false;
  /* on-brand poster: reuse a photo already loaded elsewhere on the page
     so the card looks like a real video thumbnail at zero extra cost */
  var poster='media/win-cage.jpg'; /* a real frame from our fighters, not the flyer */
  if(poster){
    skel.style.backgroundImage="linear-gradient(180deg,rgba(10,10,12,.32),rgba(10,10,12,.9)),url('"+poster+"')";
    skel.style.backgroundSize='cover';
    skel.style.backgroundPosition='center 30%';
  }
  function load(){
    if(loaded)return;loaded=true;
    skel.classList.add('loading');
    var lh=skel.querySelector('.reel-skel-t .lh'),le=skel.querySelector('.reel-skel-t .le');
    if(lh)lh.textContent='טוען את הסרטון…';
    if(le)le.textContent='Loading your video…';
    var pctEl=document.getElementById('reelPct'),bar=skel.querySelector('.rp-bar');
    var CIRC=219.9,pct=0,raf,settled=false;
    function paint(p){
      pct=p;
      if(pctEl)pctEl.textContent=Math.round(p)+'%';
      if(bar)bar.style.strokeDashoffset=String(CIRC*(1-p/100));
    }
    paint(0);
    var t0=performance.now?performance.now():Date.now();
    function tick(){
      if(settled)return;
      var now=performance.now?performance.now():Date.now();
      var el=(now-t0)/1000;
      /* eases up to ~93% and waits there — never claims 100% until the video is truly ready */
      var target=93*(1-Math.exp(-el/1.15));
      if(target>pct)paint(target);
      raf=requestAnimationFrame(tick);
    }
    raf=requestAnimationFrame(tick);
    function finish(){
      if(settled)return;settled=true;
      if(raf)cancelAnimationFrame(raf);
      paint(100);
    }
    ifr.addEventListener('load',function(){
      finish();
      setTimeout(function(){ifr.classList.add('ld');skel.classList.add('hide');},280);
    });
    ifr.src=ifr.getAttribute('data-src');
    setTimeout(function(){
      if(!ifr.classList.contains('ld')){
        settled=true;if(raf)cancelAnimationFrame(raf);
        failed=true;
        skel.classList.remove('loading');
        skel.classList.add('fallback');
        if(lh)lh.textContent='לא נטען? לחצו לצפייה באינסטגרם';
        if(le)le.textContent='Not loading? Tap to view on Instagram';
      }
    },7000);
  }
  skel.addEventListener('click',function(e){
    if(failed)return; /* let the link behave normally and open Instagram */
    e.preventDefault();
    load();
  });
})();

/* ══════════════ WALL OF WINS — smart video cards ══════════════
   Muted looped autoplay while in view (IG-style), pause off-screen,
   tap the chip to unmute. Reduced-motion users get tap-to-play. */
(function(){
  var cards=$$('#winsGrid .win-card');
  if(!cards.length)return;
  var vids=[];
  cards.forEach(function(card){
    var v=card.querySelector('video');if(!v)return;
    var play=card.querySelector('.win-play'),snd=card.querySelector('.win-snd');
    vids.push(v);
    function showPlay(on){if(play)play.classList.toggle('off',!on)}
    function start(){v.play().then(function(){showPlay(false)}).catch(function(){showPlay(true)})}
    if(play)play.addEventListener('click',function(e){e.stopPropagation();start()});
    if(snd)snd.addEventListener('click',function(e){
      e.stopPropagation();
      v.muted=!v.muted;snd.classList.toggle('on',!v.muted);
      if(v.paused)start();
      /* one card with sound at a time */
      if(!v.muted)vids.forEach(function(o){if(o!==v){o.muted=true;
        var os=o.closest('.win-card').querySelector('.win-snd');if(os)os.classList.remove('on');}});
    });
    /* tapping the video itself toggles pause/play */
    v.addEventListener('click',function(){if(v.paused)start();else{v.pause();showPlay(true);}});
    if(reduce){showPlay(true);return;} /* no autoplay for reduced motion */
    new IntersectionObserver(function(es){
      es.forEach(function(en){
        if(en.isIntersecting){start();}
        else{v.pause();if(!v.muted){v.muted=true;if(snd)snd.classList.remove('on');}}
      });
    },{threshold:.35}).observe(card);
  });
})();

/* year */
$('#yr').textContent=new Date().getFullYear();


/* nav smooth scroll offset already handled by scroll-behavior; close mnav handled above */
})();

/* ═══════════════════════════════════════════════════════════
   GSAP + SCROLLTRIGGER + LENIS — "מיליון דולר" layer
═══════════════════════════════════════════════════════════ */
(function(){
  var reduce=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var touch=('ontouchstart'in window)||navigator.maxTouchPoints>0;
  if(typeof gsap==='undefined'||reduce){
    /* no GSAP (blocked CDN) or reduced motion: still fire the finder
       opening effect via a plain observer; .rev handles the shell fade */
    var fsb=document.querySelector('.finder-shell');
    if(fsb&&!reduce){
      new IntersectionObserver(function(es,o){
        if(es[0].isIntersecting){fsb.classList.add('lit');o.disconnect();}
      },{rootMargin:'0px 0px -8% 0px'}).observe(fsb);
    }
    /* GSAP failed to load (not a reduced-motion choice): fall back to
       native smooth-scroll rather than a hard instant jump */
    if(typeof gsap==='undefined')document.documentElement.classList.add('no-lenis');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ── LENIS SMOOTH SCROLL ──
     Tuned for a light, responsive wheel feel: shorter duration + a
     snappier cubic-out curve so the site "keeps up" with fast wheel
     spins instead of trailing behind on a long decelerating tail
     (that lag was the actual cause of desktop scrolling feeling
     heavy — see the scroll-behavior:smooth removal above too, which
     was compounding it). */
  var lenis=null;
  if(typeof Lenis!=='undefined'){
    try{
      lenis=new Lenis({
        duration:0.75,
        easing:function(t){return 1-Math.pow(1-t,3);},
        smoothWheel:true,
        wheelMultiplier:1.15,
        syncTouch:false,
        smoothTouch:false
      });
      /* Feed Lenis into GSAP ticker */
      gsap.ticker.add(function(time){lenis.raf(time*1000);});
      gsap.ticker.lagSmoothing(0);
      /* Sync ScrollTrigger with Lenis */
      lenis.on('scroll',ScrollTrigger.update);
      /* Keep native onScroll (nav, progress, dots) synced */
      lenis.on('scroll',function(){if(window.tmOnScroll)window.tmOnScroll();});
      /* Smooth links */
      document.querySelectorAll('a[href^="#"]').forEach(function(a){
        a.addEventListener('click',function(e){
          var t=document.querySelector(a.getAttribute('href'));
          if(t){e.preventDefault();lenis.scrollTo(t,{offset:-70,duration:1.1});}
        });
      });
      /* dots */
      document.querySelectorAll('.dot').forEach(function(d){
        d.addEventListener('click',function(){
          var id=d.getAttribute('data-sec');var s=document.getElementById(id);
          if(s&&lenis)lenis.scrollTo(s,{offset:-70,duration:1.1});
        },{capture:true});
      });
      /* scroll-to-top */
      var tt=document.getElementById('toTop');
      if(tt)tt.addEventListener('click',function(e){e.stopPropagation();if(lenis)lenis.scrollTo(0,{duration:0.9});});
    }catch(_){lenis=null;}
  }
  if(!lenis)document.documentElement.classList.add('no-lenis'); /* Lenis blocked/failed: native smooth-scroll fallback */

  /* ── HERO PARALLAX ── */
  var heroCv=document.getElementById('heroCv');
  if(heroCv){
    gsap.to(heroCv,{
      y:'28%',
      ease:'none',
      scrollTrigger:{
        trigger:'#hero',
        start:'top top',
        end:'bottom top',
        scrub:true
      }
    });
  }

  /* ── HERO VIGNETTE PARALLAX ── */
  var heroVig=document.querySelector('.hero-vig');
  if(heroVig){
    gsap.to(heroVig,{
      y:'16%',
      ease:'none',
      scrollTrigger:{
        trigger:'#hero',
        start:'top top',
        end:'bottom top',
        scrub:true
      }
    });
  }

  /* ── HERO SCROLL-OUT: content drifts up a touch as you leave (subtle parallax) ── */
  gsap.to('.hero-in',{yPercent:-10,opacity:.4,ease:'none',
    scrollTrigger:{trigger:'#hero',start:'top top',end:'bottom top',scrub:true}});

  /* ── SHOW PHOTO PARALLAX ── */
  var showImg=document.querySelector('.show-photo img');
  if(showImg){
    gsap.to(showImg,{
      y:'8%',
      ease:'none',
      scrollTrigger:{
        trigger:'.show-photo',
        start:'top bottom',
        end:'bottom top',
        scrub:true
      }
    });
  }

  /* ── PROMO SECTION PARALLAX ── */
  var promoGlow=document.querySelector('.promo-glow');
  if(promoGlow){
    gsap.to(promoGlow,{
      y:'-20%',
      ease:'none',
      scrollTrigger:{
        trigger:'#promo',
        start:'top bottom',
        end:'bottom top',
        scrub:true
      }
    });
  }

  /* Section titles, eyebrows, the finder shell, the schedule board and the
     CTA block all reveal through the one CSS .rev system (opacity + 24px,
     0.7s, once). Running a second GSAP reveal on the same elements used to
     leave them stuck at opacity 0 when the two systems disagreed. */

  /* ── FINDER SHELL — the .lit opening effect, once, when it enters ── */
  var fshell=document.querySelector('.finder-shell');
  if(fshell){
    ScrollTrigger.create({trigger:'#finder',start:'top 85%',once:true,
      onEnter:function(){fshell.classList.add('lit')}});
  }

  /* ── FOOTER ── */
  gsap.from('.foot-top > *',{
    y:24,opacity:0,duration:0.7,ease:'power3.out',stagger:0.1,
    scrollTrigger:{trigger:'footer',start:'top 92%',once:true}
  });

  /* ── TICKER: velocity based on scroll speed ── */
  var tickerTrack=document.querySelector('.ticker-track');
  if(tickerTrack&&lenis){
    lenis.on('scroll',function(e){
      var vel=Math.abs(e.velocity||0);
      var dur=Math.max(10,32-vel*1.4);
      tickerTrack.style.animationDuration=dur.toFixed(1)+'s';
    });
  }

  /* ── SCROLL PROGRESS: enhanced glow on fast scroll ── */
  var prog=document.getElementById('prog');
  if(prog&&lenis){
    lenis.on('scroll',function(e){
      var vel=Math.abs(e.velocity||0);
      if(vel>12){
        prog.style.boxShadow='0 0 20px var(--blood),0 0 48px rgba(209,0,0,.8)';
      } else {
        prog.style.boxShadow='0 0 12px var(--blood),0 0 26px rgba(209,0,0,.5)';
      }
    });
  }

  /* ── HORIZONTAL SCROLL: discipline ticker reverses on scroll up ── */
  if(tickerTrack&&lenis){
    var tickDir=1;
    lenis.on('scroll',function(e){
      var newDir=e.direction||1;
      if(newDir!==tickDir){
        tickDir=newDir;
        tickerTrack.style.animationDirection=newDir>0?'normal':'reverse';
      }
    });
  }

  /* ── CTA: giant word drifts with scroll ── */
  if(document.querySelector('.cta-word')){
    gsap.fromTo('.cta-word',{x:-70},{x:70,ease:'none',
      scrollTrigger:{trigger:'#cta',start:'top bottom',end:'bottom top',scrub:true}});
  }

  /* (velocity skew removed: text shearing on fast scroll read as jitter, not polish) */

  ScrollTrigger.refresh();
})();
