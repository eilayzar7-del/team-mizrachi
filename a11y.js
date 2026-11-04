/* Accessibility menu · Zar Studio · self-contained, no dependencies.
   Small tab on the left edge; options persist per visitor; does not change the site until a visitor turns something on. */
(function(){
  if (window.__zA11y) return; window.__zA11y = 1;
  var STATEMENT = (document.currentScript && document.currentScript.getAttribute('data-statement')) || '/accessibility.html';
  var KEY = 'zA11y', html = document.documentElement;
  var OPTS = [
    ['text',     'הגדלת טקסט'],
    ['contrast', 'ניגודיות גבוהה'],
    ['gray',     'גווני אפור'],
    ['links',    'הדגשת קישורים'],
    ['font',     'גופן קריא'],
    ['motion',   'עצירת אנימציות ווידאו'],
    ['spacing',  'ריווח שורות']
  ];
  var st = {};
  try { st = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { st = {}; }

  var css = ''
  + 'html.zA-text :is(p,li,label,small,span,a,button,input,textarea,td,th,figcaption,blockquote){font-size:calc(1em + 2px)!important}'
  + 'html.zA-contrast{filter:contrast(1.35)}'
  + 'html.zA-gray{filter:grayscale(1)}'
  + 'html.zA-contrast.zA-gray{filter:grayscale(1) contrast(1.35)}'
  + 'html.zA-links a{text-decoration:underline!important;text-underline-offset:3px;outline:2px dashed currentColor;outline-offset:2px}'
  + 'html.zA-font body,html.zA-font body *:not(svg):not(svg *){font-family:Arial,"Segoe UI",sans-serif!important;letter-spacing:normal!important}'
  + 'html.zA-motion *,html.zA-motion *::before,html.zA-motion *::after{animation-duration:.001s!important;animation-iteration-count:1!important;transition-duration:.001s!important;scroll-behavior:auto!important}'
  + 'html.zA-spacing :is(p,li){line-height:1.9!important;word-spacing:.12em}'
  + ':focus-visible{outline:3px solid #ffbf00!important;outline-offset:2px!important}'
  + '#zA-btn{position:fixed;left:0;top:50%;transform:translateY(-50%);z-index:2147483000;width:40px;height:44px;border:0;border-radius:0 10px 10px 0;background:#1a4fd6;color:#fff;cursor:pointer;display:grid;place-items:center;box-shadow:0 4px 14px rgba(0,0,0,.25);padding:0;opacity:.85;transition:opacity .2s,width .2s}'
  + '#zA-btn:hover,#zA-btn:focus-visible{opacity:1;width:46px}'
  + '#zA-btn svg{width:24px;height:24px}'
  + '#zA-panel{position:fixed;left:12px;top:50%;transform:translateY(-50%);z-index:2147483001;width:min(300px,calc(100vw - 24px));max-height:calc(100vh - 24px);overflow:auto;background:#fff;color:#111;border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.35);padding:14px;direction:rtl;font:15px/1.4 Arial,"Segoe UI",sans-serif;text-align:right}'
  + '#zA-panel[hidden]{display:none}'
  + '#zA-panel h2{font-size:17px;margin:2px 0 10px;font-weight:700;color:#111}'
  + '#zA-panel .zA-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}'
  + '#zA-panel button{font:inherit;font-size:14px;color:#111;background:#f1f3f8;border:2px solid transparent;border-radius:10px;padding:10px 8px;cursor:pointer;text-align:center;line-height:1.25}'
  + '#zA-panel button[aria-pressed="true"]{background:#1a4fd6;color:#fff;border-color:#0d2f8a}'
  + '#zA-panel .zA-row{display:flex;gap:8px;margin-top:10px}'
  + '#zA-panel .zA-row button{flex:1}'
  + '#zA-panel .zA-x{position:absolute;left:10px;top:10px;width:32px;height:32px;padding:0;background:#f1f3f8}'
  + '#zA-panel a{display:block;margin-top:10px;color:#1a4fd6;text-decoration:underline;font-size:14px}';

  function apply(){
    OPTS.forEach(function(o){ html.classList.toggle('zA-' + o[0], !!st[o[0]]); });
    var vids = document.querySelectorAll('video');
    for (var i = 0; i < vids.length; i++) {
      if (st.motion) { if (!vids[i].paused) { vids[i].dataset.zAp = 1; vids[i].pause(); } }
      else if (vids[i].dataset.zAp) { delete vids[i].dataset.zAp; var p = vids[i].play(); if (p && p.catch) p.catch(function(){}); }
    }
  }
  function save(){ try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }

  function build(){
    var s = document.createElement('style'); s.id = 'zA-css'; s.textContent = css; document.head.appendChild(s);
    var b = document.createElement('button');
    b.id = 'zA-btn'; b.type = 'button';
    b.setAttribute('aria-label', 'תפריט נגישות'); b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', 'zA-panel');
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="4" r="2"/><path d="M19 9.2c-2.1.5-4.5.8-7 .8s-4.9-.3-7-.8l-.5 1.9c1.5.4 3.2.7 5 .9V22h2v-5h1v5h2V12c1.8-.2 3.5-.5 5-.9z"/></svg>';
    var p = document.createElement('div');
    p.id = 'zA-panel'; p.hidden = true;
    p.setAttribute('role', 'dialog'); p.setAttribute('aria-modal', 'false'); p.setAttribute('aria-label', 'תפריט נגישות');
    var h = '<button type="button" class="zA-x" aria-label="סגירת תפריט הנגישות">✕</button><h2>נגישות</h2><div class="zA-grid">';
    OPTS.forEach(function(o){ h += '<button type="button" data-zA="' + o[0] + '" aria-pressed="' + (!!st[o[0]]) + '">' + o[1] + '</button>'; });
    h += '</div><div class="zA-row"><button type="button" data-zA-reset>איפוס הכל</button></div>'
       + '<a href="' + STATEMENT + '" target="_blank" rel="noopener">הצהרת נגישות</a>';
    p.innerHTML = h;
    document.body.appendChild(b); document.body.appendChild(p);

    function open(v){ p.hidden = !v; b.setAttribute('aria-expanded', String(v)); if (v) { var f = p.querySelector('[data-zA]'); f && f.focus(); } else b.focus(); }
    b.addEventListener('click', function(e){ e.stopPropagation(); open(p.hidden); });
    p.addEventListener('click', function(e){
      e.stopPropagation();
      var t = e.target.closest('button'); if (!t) return;
      if (t.classList.contains('zA-x')) return open(false);
      if (t.hasAttribute('data-zA-reset')) { st = {}; p.querySelectorAll('[data-zA]').forEach(function(x){ x.setAttribute('aria-pressed', 'false'); }); }
      else { var k = t.getAttribute('data-zA'); st[k] = !st[k]; t.setAttribute('aria-pressed', String(!!st[k])); }
      apply(); save();
    });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !p.hidden) open(false); });
    document.addEventListener('click', function(){ if (!p.hidden) open(false); });
    apply();
    if (st.motion) setTimeout(apply, 1500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
