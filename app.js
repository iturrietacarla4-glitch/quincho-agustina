/* El Quincho de Agustina — lógica de la app (demo sin backend) */
(() => {
'use strict';
const D = window.QUINCHO_DATA;
const C = D.negocio.contacto;
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today = new Date(); today.setHours(0,0,0,0);
const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const fmtDate = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('es-CL',{weekday:'long',day:'numeric',month:'long',year:'numeric'}); };
const clp = v => (v === '' || v == null) ? null : Number(v).toLocaleString('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0});
const PEND = '<span class="pend">Por confirmar</span>';
const waLink = msg => `https://wa.me/${C.whatsapp}${msg ? '?text=' + encodeURIComponent(msg) : ''}`;

const ico = (sym, tone, cls='mi') => `<span class="${cls} t-${tone||'pink'}" aria-hidden="true"><svg><use href="#${sym}"/></svg></span>`;

/* ---------- Almacenamiento local (solo demo) ---------- */
const KEY = 'quincho-demo-v3';
const initial = () => ({
  days:{}, requests:[], memories:[],
  prices:{ exclusive: D.modalidades.exclusive.precio ?? '', adult: D.modalidades.individual.precioAdulto ?? '', child: D.modalidades.individual.precioNino ?? '' },
  photos: D.galeria.map(p => ({...p}))
});
let db;
try { const saved = JSON.parse(localStorage.getItem(KEY) || '{}'); db = {...initial(), ...saved}; } catch { db = initial(); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); return true; } catch { toast('No se pudo guardar en este navegador (espacio lleno o bloqueado).'); return false; } };

/* ---------- UI helpers ---------- */
let toastT;
function toast(msg){ const t=$('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),3600); }
function openDlg(d){ if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open',''); document.body.style.overflow='hidden'; }
function closeDlg(d){ if (d.open) { d.close ? d.close() : d.removeAttribute('open'); } document.body.style.overflow=''; }
document.querySelectorAll('dialog').forEach(d => {
  d.addEventListener('click', e => { if (e.target === d || e.target.closest('[data-close]')) closeDlg(d); });
  d.addEventListener('close', () => document.body.style.overflow='');
});
function modal({title, text, msg, actions=[]}){
  $('mTitle').textContent = title; $('mText').textContent = text || '';
  const pre = $('mMsg'); pre.hidden = !msg; pre.textContent = msg || '';
  const box = $('mActions'); box.innerHTML = '';
  actions.forEach(a => {
    const el = document.createElement(a.href ? 'a' : 'button');
    el.className = 'btn ' + (a.cls || 'outline-dark'); el.textContent = a.label;
    if (a.href) { el.href = a.href; el.target = '_blank'; el.rel = 'noopener'; }
    else el.type = 'button';
    el.addEventListener('click', e => { if (a.onClick) a.onClick(e); if (a.close !== false) closeDlg($('modal')); });
    box.append(el);
  });
  openDlg($('modal'));
}
function confirmBox(title, text, onYes){
  modal({ title, text, actions:[ {label:'Cancelar'}, {label:'Sí, continuar', cls:'pink', onClick:onYes} ] });
}
async function copy(text){
  try { await navigator.clipboard.writeText(text); toast('Mensaje copiado ✔'); }
  catch { toast('No se pudo copiar automáticamente; selecciona el texto y cópialo.'); }
}
function sendWhatsApp(title, msg){
  modal({ title, text:'Tu mensaje está listo. Ábrelo en WhatsApp y presiona enviar para que llegue a Carla. Esto no confirma la fecha.', msg,
    actions:[ {label:'Copiar mensaje', onClick:()=>copy(msg), close:false}, {label:'Abrir WhatsApp ↗', cls:'green', href:waLink(msg)} ] });
}

/* ---------- Menú lateral ---------- */
const burger = $('burger'), nav = $('nav'), scrim = $('scrim');
const drawer = open => { nav.classList.toggle('open', open); scrim.hidden = !open; burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú'); };
burger.addEventListener('click', () => drawer(!nav.classList.contains('open')));
scrim.addEventListener('click', () => drawer(false));
nav.addEventListener('click', e => { if (e.target.closest('a')) drawer(false); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') drawer(false); });

/* Animaciones de entrada */
if ('IntersectionObserver' in window) {
  const rv = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rv.unobserve(e.target); } }), {threshold:.12});
  window.__reveal = el => rv.observe(el);
} else window.__reveal = el => el.classList.add('in');
const revealAll = () => document.querySelectorAll('.reveal:not(.in)').forEach(el => window.__reveal(el));

/* ---------- Instalaciones ---------- */
function facilities(){
  $('facilities').innerHTML = D.instalaciones.map((f,i) => `
    <article class="fcard reveal">
      <button type="button" class="fphoto" data-fac="${i}" aria-label="Ver detalle de ${esc(f.titulo)}"><img src="${esc(f.foto)}" alt="${esc(f.titulo)}" loading="lazy" decoding="async" width="600" height="895"></button>
      <div class="fbody">
        <div class="fhead">${ico(f.ico || 'm-img', f.tone)}<h3>${esc(f.titulo)}</h3></div>
        <p>${esc(f.texto)}</p>
        <div class="factions"><button type="button" class="lnk" data-fac="${i}">Detalles</button><a class="chip-btn" href="#reservas">Reservar</a></div>
      </div>
    </article>`).join('');
  $('facilities').querySelectorAll('[data-fac]').forEach(b => b.addEventListener('click', () => openFacility(+b.dataset.fac)));
}
function openFacility(i){
  const f = D.instalaciones[i];
  $('fImg').src = f.foto; $('fImg').alt = f.titulo;
  $('fTitle').innerHTML = ico(f.ico || 'm-img', f.tone, 'hmi') + esc(f.titulo); $('fText').textContent = f.texto;
  $('fList').innerHTML = Object.entries(f.detalles).filter(([,v]) => v).map(([k,v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('');
  openDlg($('facility'));
}

/* ---------- Galería + visor ---------- */
let vIdx = 0, gCat = 'todo';
const CATS = {todo:'Todo', recinto:'El recinto', familia:'En familia', eventos:'Eventos'};
$('gFilters').innerHTML = Object.entries(CATS).map(([k,v]) => `<button type="button" data-cat="${k}" aria-pressed="${k===gCat}">${v}</button>`).join('');
$('gFilters').addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (!b) return; gCat = b.dataset.cat; $('gFilters').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); gallery(); });
const visible = () => db.photos.map((p,i) => ({p,i})).filter(x => gCat === 'todo' || x.p.cat === gCat);
function gallery(){
  $('gallery').innerHTML = visible().map(({p,i}) => `<button type="button" class="reveal" data-i="${i}" aria-label="Ver foto: ${esc(p.titulo)}"><img src="${esc(p.src)}" alt="${esc(p.titulo)}" loading="lazy"><span>${esc(p.titulo)}</span></button>`).join('');
  $('gallery').querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => { vIdx = +b.dataset.i; showPhoto(); openDlg($('viewer')); }));
  revealAll();
}
function showPhoto(){ const p = db.photos[vIdx]; $('vImg').src = p.src; $('vImg').alt = p.titulo; $('vCap').textContent = p.titulo + (p.nota ? ` · ${p.nota}` : '') + `  (${vIdx+1}/${db.photos.length})`; }
const step = n => { const v = visible().map(x => x.i); const k = v.indexOf(vIdx); vIdx = v[(k + n + v.length) % v.length]; showPhoto(); };
$('vPrev').addEventListener('click', e => { e.stopPropagation(); step(-1); });
$('vNext').addEventListener('click', e => { e.stopPropagation(); step(1); });
$('viewer').addEventListener('keydown', e => { if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); });
let tx = null;
$('viewer').addEventListener('touchstart', e => tx = e.touches[0].clientX, {passive:true});
$('viewer').addEventListener('touchend', e => { if (tx == null) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); tx = null; });

/* ---------- Eventos ---------- */
function events(){
  const E = D.eventos;
  $('eventHighlights').innerHTML = E.destacados.map((h,i) => `<article class="ecard reveal">
      <div class="ephoto"><img src="${esc(h.foto)}" alt="" loading="lazy" decoding="async"></div>
      <div class="ebody">${ico(h.ico, h.tone)}<h3>${esc(h.titulo)}</h3><p>${esc(h.texto)}</p>
        <div class="factions"><button type="button" class="chip-btn" data-cot="${i}">Cotizar</button><button type="button" class="lnk" data-res="${i}">Reservar</button></div></div>
    </article>`).join('');
  $('etype').innerHTML = E.tipos.map(t => `<option>${esc(t)}</option>`).join('');
  $('eservices').innerHTML = E.servicios.map(s => `<label class="psel"><input type="checkbox" value="${esc(s)}"><span>${esc(s)}</span></label>`).join('');
  $('eventHighlights').addEventListener('click', e => {
    const c = e.target.closest('[data-cot]'), r = e.target.closest('[data-res]');
    if (c){ const h = E.destacados[+c.dataset.cot]; if ([...$('etype').options].some(o => o.text === h.tipo)) $('etype').value = h.tipo; $('eventForm').scrollIntoView({behavior:'smooth', block:'start'}); setTimeout(() => $('etype').focus({preventScroll:true}), 400); }
    if (r){ const h = E.destacados[+r.dataset.res]; bAct = h.act || ''; location.hash = 'reservas'; rzPaint(); }
  });
}

/* ---------- Validación ---------- */
const validPhone = s => { const d = s.replace(/\D/g,''); return d.startsWith('569') ? d.length === 11 : d.length >= 9; };
/* Prefijo +56 9 fijo en los campos de WhatsApp */
document.querySelectorAll('input[data-prefix]').forEach(inp => {
  const pre = inp.dataset.prefix;
  const end = () => requestAnimationFrame(() => { try { const n = inp.value.length; inp.setSelectionRange(n, n); } catch {} });
  inp.addEventListener('focus', () => { if (!inp.value.trim()) inp.value = pre; end(); });
  inp.addEventListener('input', () => { if (!inp.value.startsWith(pre.trim())) { const digits = inp.value.replace(/\D/g,'').replace(/^569?/,''); inp.value = pre + digits; } });
  inp.addEventListener('blur', () => { if (!inp.value.trim()) inp.value = pre; });
});
function check(fields){
  let ok = true, first = null;
  fields.forEach(([id, test]) => { const el = $(id); const good = test(el.value.trim(), el); el.classList.toggle('invalid', !good); el.setAttribute('aria-invalid', !good); if (!good) { ok = false; first = first || el; } });
  if (first) first.focus();
  return ok;
}
const req = v => v.length > 0;
const num = (min,max) => v => +v >= min && +v <= max;

/* ---------- Calendario ---------- */
let shown = new Date(today.getFullYear(), today.getMonth(), 1), selected = '';
const RESERVADAS = new Set(D.fechasReservadas || []);
const status = k => db.days[k] || (RESERVADAS.has(k) ? 'booked' : (D.disponibilidadPorDefecto || 'closed'));
const LABEL = {closed:'No habilitado', exclusive:'Arriendo exclusivo', individual:'Entradas individuales', booked:'Reservado'};
function calendar(){
  if (typeof eventCal === 'function' && !$('ecal').hidden) eventCal();
  const el = $('calendar'); el.innerHTML = '';
  { const m = shown.toLocaleDateString('es-CL',{month:'long',year:'numeric'}); $('month').textContent = m.charAt(0).toUpperCase() + m.slice(1); }
  const start = (shown.getDay()+6)%7;
  for (let i=0;i<start;i++) el.append(document.createElement('span'));
  const days = new Date(shown.getFullYear(), shown.getMonth()+1, 0).getDate();
  for (let n=1;n<=days;n++){
    const d = new Date(shown.getFullYear(), shown.getMonth(), n), key = iso(d), s = status(key), past = d < today;
    const b = document.createElement('button'); b.type='button'; b.textContent = n;
    b.className = ({exclusive:'available',individual:'special',booked:'booked'}[s] || '') + (key===selected?' selected':'') + (+d===+today?' today':'');
    b.disabled = past || s==='closed' || s==='booked';
    b.setAttribute('aria-label', `${fmtDate(key)}: ${past ? 'fecha pasada' : LABEL[s]}`);
    b.addEventListener('click', () => pickDate(key));
    el.append(b);
  }
  $('prev').disabled = shown <= new Date(today.getFullYear(), today.getMonth(), 1);
}
function pickDate(key){
  const s = status(key); selected = key; $('chosenDate').innerHTML = `📅 Fecha elegida: <b>${esc(fmtDate(key))}</b>`;
  $('bookingMode').value = s==='individual' ? D.modalidades.individual.nombre : D.modalidades.exclusive.nombre;
  calendar(); if (typeof rzPaint === 'function' && $('stepper')) rzPaint();
}
$('prev').addEventListener('click', () => { shown.setMonth(shown.getMonth()-1); calendar(); });
$('next').addEventListener('click', () => { shown.setMonth(shown.getMonth()+1); calendar(); });
const EX = D.modalidades.exclusive;
const tramo = n => (EX.escala || []).find(t => n >= t.min && n <= t.max);
function priceText(n){
  const t = tramo(+n); const esc0 = EX.escala || [];
  if (t) return `${clp(t.precio)} (tramo ${t.min} a ${t.max} personas)`;
  if (esc0.length && +n < esc0[0].min) return `A consultar (la escala parte en ${esc0[0].min} personas)`;
  if (esc0.length && +n > esc0[esc0.length-1].max) return `A consultar (más de ${esc0[esc0.length-1].max} personas)`;
  return 'A consultar';
}
function prices(){
  const p = db.prices;
  const rows = (EX.escala || []).map(t => `<tr data-min="${t.min}" data-max="${t.max}"><td>${t.min} a ${t.max} personas</td><td>${clp(t.precio)}</td></tr>`).join('');
  if (!EX.mostrarPrecios) {
    $('prices').innerHTML = `
    <h4>Arriendo del Quincho por día</h4>
    ${EX.ideal ? `<p class="tiny" style="margin:0 0 8px">Ideal para ${esc(EX.ideal)}</p>` : ''}
    <p class="inc-t">Incluye:</p>
    <ul class="incluye">${(EX.incluye || []).map(i => `<li><span aria-hidden="true">${i.icono}</span>${esc(i.texto)}</li>`).join('')}</ul>
    <a class="btn green full" style="margin-top:10px" href="${waLink(`Hola Carla, quisiera consultar valores para arrendar ${D.negocio.nombre}.`)}" target="_blank" rel="noopener">💬 Valores a consultar por WhatsApp</a>`;
    $('estimate').hidden = true;
    return;
  }
  $('prices').innerHTML = `
    <h4>Arriendo del Quincho por día</h4>
    ${EX.ideal ? `<p class="tiny" style="margin:0 0 8px">Ideal para ${esc(EX.ideal)}</p>` : ''}
    <table class="ptable"><thead><tr><th>Cantidad de personas</th><th>Precio total</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="inc-t">Incluye:</p>
    <ul class="incluye">${(EX.incluye || []).map(i => `<li><span aria-hidden="true">${i.icono}</span>${esc(i.texto)}</li>`).join('')}</ul>
    ${(p.adult || p.child) ? `<div><span>Entrada adulto (fecha especial)</span><b>${clp(p.adult) || PEND}</b></div><div><span>Entrada niño (fecha especial)</span><b>${clp(p.child) || PEND}</b></div>` : ''}
    <p class="tiny" style="margin:4px 0 0">Eventos con servicios adicionales se cotizan directamente con Carla.</p>`;
  markTramo();
}
function markTramo(){
  const n = +$('bpeople').value, t = tramo(n);
  document.querySelectorAll('.ptable tr[data-min]').forEach(r => r.classList.toggle('on', !!t && +r.dataset.min === t.min));
  $('estimate').innerHTML = `💰 Valor referencial: <b>${esc(priceText(n))}</b>`;
}
$('bpeople').addEventListener('input', () => { if (EX.mostrarPrecios) markTramo(); });

/* ---------- Calendario del formulario de eventos ---------- */
let eShown = new Date(today.getFullYear(), today.getMonth(), 1);
function eventCal(){
  const g = $('ecalGrid'); g.innerHTML = '';
  { const m = eShown.toLocaleDateString('es-CL',{month:'long',year:'numeric'}); $('emonth').textContent = m.charAt(0).toUpperCase() + m.slice(1); }
  const start = (eShown.getDay()+6)%7;
  for (let i=0;i<start;i++) g.append(document.createElement('span'));
  const days = new Date(eShown.getFullYear(), eShown.getMonth()+1, 0).getDate(), sel = $('edate').value;
  for (let n=1;n<=days;n++){
    const d = new Date(eShown.getFullYear(), eShown.getMonth(), n), key = iso(d), booked = status(key) === 'booked';
    const b = document.createElement('button'); b.type = 'button'; b.textContent = n;
    b.className = (booked ? 'booked' : '') + (key === sel ? ' selected' : '') + (+d === +today ? ' today' : '');
    b.disabled = d < today || booked;
    b.setAttribute('aria-label', fmtDate(key) + (booked ? ': reservado' : ''));
    b.addEventListener('click', () => {
      $('edate').value = key; { const [y,m,dd] = key.split('-').map(Number); $('edateTxt').textContent = '📅 ' + new Date(y,m-1,dd).toLocaleDateString('es-CL',{weekday:'short',day:'numeric',month:'short',year:'numeric'}); }
      $('edateBtn').classList.remove('invalid'); toggleECal(false); $('edateBtn').focus();
    });
    g.append(b);
  }
  $('eprev').disabled = eShown <= new Date(today.getFullYear(), today.getMonth(), 1);
}
function toggleECal(open){ $('ecal').hidden = !open; $('edateBtn').setAttribute('aria-expanded', open); if (open) eventCal(); }
$('edateBtn').addEventListener('click', () => toggleECal($('ecal').hidden));
$('eprev').addEventListener('click', () => { eShown.setMonth(eShown.getMonth()-1); eventCal(); });
$('enext').addEventListener('click', () => { eShown.setMonth(eShown.getMonth()+1); eventCal(); });

/* ---------- Formularios ---------- */
/* ---------- Reserva por pasos ---------- */
const ACTS = D.actividades || [];
let bAct = '', bPeople = 0;
const PEOPLE_OPTS = [10, 20, 30, 40, 50];
function rzInit(){
  $('acts').innerHTML = ACTS.map(x => `<button type="button" class="act" role="radio" aria-checked="false" data-act="${esc(x.id)}">${ico(x.ico || 'm-star', x.tone, 'ami')}<b>${esc(x.titulo)}</b><small>${esc(x.sub)}</small></button>`).join('');
  $('acts').addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (!b) return; bAct = b.dataset.act; rzPaint(); });
  $('peopleChips').innerHTML = PEOPLE_OPTS.map(n => `<button type="button" role="radio" aria-checked="false" data-n="${n}">${n}</button>`).join('') + `<button type="button" role="radio" aria-checked="false" data-n="more" aria-label="Más de 50 u otra cantidad">+</button>`;
  $('peopleChips').addEventListener('click', e => { const b = e.target.closest('[data-n]'); if (!b) return;
    if (b.dataset.n === 'more'){ $('peopleMore').hidden = false; bPeople = Number($('bpeople').value) || 0; $('bpeople').focus(); }
    else { $('peopleMore').hidden = true; bPeople = +b.dataset.n; }
    rzPaint(); });
  $('bpeople').addEventListener('input', () => { bPeople = Number($('bpeople').value) || 0; rzPaint(); });
  $('rzDetails').addEventListener('click', () => openDlg($('rzInfo')));
  $('rzNext').addEventListener('click', () => {
    if (!selected){ toast('Elige una fecha disponible en el calendario.'); $('calendar').scrollIntoView({behavior:'smooth', block:'center'}); return; }
    if (!bAct){ toast('Elige el tipo de actividad.'); $('acts').scrollIntoView({behavior:'smooth', block:'center'}); return; }
    if (!(bPeople >= 1 && bPeople <= 500)){ toast('Indica la cantidad de personas.'); $('peopleChips').scrollIntoView({behavior:'smooth', block:'center'}); return; }
    rzStep(true);
  });
  $('rzBack').addEventListener('click', () => rzStep(false));
  rzPaint();
}
const actName = () => (ACTS.find(x => x.id === bAct) || {}).titulo || '';
const peopleTxt = () => !$('peopleMore').hidden ? `${bPeople} personas` : `Aprox. ${bPeople} personas`;
function rzStep(toSummary){
  $('rzStepA').hidden = toSummary; $('rzStepB').hidden = !toSummary;
  if (toSummary){
    const note = $('bnote').value.trim();
    $('rzSum').innerHTML = `<dt>📅 Fecha</dt><dd>${esc(fmtDate(selected))}</dd><dt>🎉 Actividad</dt><dd>${esc(actName())}</dd><dt>👥 Personas</dt><dd>${esc(peopleTxt())}</dd>` + (note ? `<dt>💬 Observaciones</dt><dd>${esc(note)}</dd>` : '');
  }
  rzPaint(); $('stepper').scrollIntoView({behavior:'smooth', block:'start'});
}
function rzPaint(){
  document.querySelectorAll('#acts [data-act]').forEach(b => { const on = b.dataset.act === bAct; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
  document.querySelectorAll('#peopleChips [data-n]').forEach(b => { const on = b.dataset.n === 'more' ? !$('peopleMore').hidden : (!$('peopleMore').hidden ? false : +b.dataset.n === bPeople); b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
  const done = [!!selected, !!bAct, bPeople > 0], summary = !$('rzStepB').hidden;
  const cur = summary ? 4 : (done.indexOf(false) + 1 || 3);
  document.querySelectorAll('#stepper li').forEach(li => { const n = +li.dataset.step; li.classList.toggle('on', n === cur); li.classList.toggle('done', n < 4 && done[n-1] && n !== cur); });
}
$('bookingForm').addEventListener('submit', e => {
  e.preventDefault();
  if (!check([['bname',req],['bphone',validPhone]])) { toast('Revisa tu nombre y WhatsApp.'); return; }
  const r = {id:Date.now(), kind:'Reserva', date:selected, name:$('bname').value.trim(), phone:$('bphone').value.trim(), count:bPeople, detail:actName(), note:$('bnote').value.trim(), status:'Pendiente'};
  const msg = `Hola Carla, quisiera solicitar una reserva en ${D.negocio.nombre}.\n\nFecha: ${fmtDate(r.date)}\nActividad: ${r.detail}\nPersonas: ${peopleTxt()}\nNombre: ${r.name}\nWhatsApp: ${r.phone}\nObservaciones: ${r.note || 'Sin observaciones'}\n\n¿Me confirmas disponibilidad, valor y abono?`;
  db.requests.push(r); save(); renderAdmin();
  sbSend({tipo:'reserva', fecha:r.date, actividad:r.detail, personas:bPeople, nombre:r.name, telefono:r.phone, observaciones:r.note || null});
  sendWhatsApp('Solicitud de reserva lista', msg);
});
$('eventForm').addEventListener('submit', e => {
  e.preventDefault();
  if (!$('edate').value) { $('edateBtn').classList.add('invalid'); toggleECal(true); toast('Elige la fecha de tu evento en el calendario.'); return; }
  if (!check([['eguests',num(1,1000)],['ename',req],['ephone',validPhone]])) { toast('Revisa los campos marcados.'); return; }
  const services = [...document.querySelectorAll('#eservices input:checked')].map(x => x.value);
  const r = {id:Date.now(), kind:'Evento', date:$('edate').value, name:$('ename').value.trim(), phone:$('ephone').value.trim(), count:$('eguests').value, detail:$('etype').value + (services.length ? ' / ' + services.join(', ') : ''), note:$('edetails').value.trim(), status:'Pendiente'};
  const msg = `Hola Carla, quisiera cotizar un evento en ${D.negocio.nombre}.\n\nTipo: ${$('etype').value}\nFecha: ${fmtDate(r.date)}\nInvitados: ${r.count}\nServicios: ${services.join(', ') || 'Sin servicios adicionales'}\nNombre: ${r.name}\nWhatsApp: ${r.phone}\nDetalles: ${r.note || 'Sin detalles'}\n\n¿Me puedes enviar una cotización?`;
  db.requests.push(r); save(); renderAdmin();
  sbSend({tipo:'evento', fecha:r.date, actividad:$('etype').value, personas:+r.count||null, nombre:r.name, telefono:r.phone, servicios:services.join(', ') || null, observaciones:r.note || null});
  sendWhatsApp('Cotización de evento lista', msg);
});
document.addEventListener('input', e => { if (e.target.classList.contains('invalid')) { e.target.classList.remove('invalid'); e.target.removeAttribute('aria-invalid'); } });

/* ---------- Condiciones de reserva ---------- */
function policies(){
  const P = D.politicas || [];
  $('policies').hidden = !P.length;
  $('policies').innerHTML = P.length ? `<h4>Condiciones de reserva</h4><ul>${P.map(p => `<li><span aria-hidden="true">${p.icono || '•'}</span>${esc(p.texto)}</li>`).join('')}</ul>` : '';
}

/* ---------- Mural ---------- */

/* ---------- Pie de página (componente reutilizable) ---------- */
function siteFooter(){
  const N = D.negocio, R = N.redes || {};
  const wa = waLink(`Hola Carla, tengo una consulta sobre ${N.nombre}.`);
  const btn = (href, cls, sym, t, s, ext) => `<a class="fbtn ${cls}" href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ''}><span class="fic"><svg><use href="#${sym}"/></svg></span><span><b>${t}</b><small>${s}</small></span></a>`;
  const redes = [
    R.instagram && R.instagram.url ? { cls:'ig', sym:'m-ig', url:R.instagram.url, t:'Instagram ' + (R.instagram.usuario || '') } : null,
    R.facebook && R.facebook.url ? { cls:'fb', sym:'s-fb', url:R.facebook.url, t:'Facebook' } : null,
    R.tiktok && R.tiktok.url ? { cls:'tt', sym:'s-tt', url:R.tiktok.url, t:'TikTok' } : null
  ].filter(Boolean);
  $('siteFooter').innerHTML = `
    <img class="fleaf a" src="assets/hoja-monstera.webp" alt="" aria-hidden="true" loading="lazy" width="167" height="179">
    <img class="fleaf b" src="assets/hoja-palma.webp" alt="" aria-hidden="true" loading="lazy" width="165" height="191">
    <div class="sf-in">
      <img class="sf-logo" src="assets/logo.webp" alt="${esc(N.nombre)}" width="900" height="569" loading="lazy">
      <p class="sf-lema">${esc((N.lema || []).join(' '))}</p>
      <a class="sf-loc" href="${esc(N.mapsUrl)}" target="_blank" rel="noopener"><svg><use href="#m-pin"/></svg>${esc((N.direccionExacta || N.ubicacion).replace(/,\s*/g,' · '))}</a>
      <div class="fbtns">
        ${btn(wa, 'wa', 'm-wa', 'WhatsApp', 'Escríbenos ahora', true)}
        ${N.contacto.email ? btn('mailto:' + N.contacto.email, 'ml', 'm-mail', 'Correo', 'Contáctanos', false) : ''}
        ${btn(N.mapsUrl, 'mp', 'm-pin', 'Ubicación', 'Ver en mapa', true)}
      </div>
      ${redes.length ? `<div class="sf-redes"><span class="sf-rt">Síguenos en nuestras redes</span><div class="sf-ri">${redes.map(r => `<a class="sic ${r.cls}" href="${esc(r.url)}" target="_blank" rel="noopener" aria-label="${esc(r.t)}"><svg><use href="#${r.sym}"/></svg></a>`).join('')}</div></div>` : ''}
      <a class="sf-dudas" href="${esc(wa)}" target="_blank" rel="noopener"><svg><use href="#i-heart"/></svg>¿Dudas? Escríbenos, estamos para ayudarte<svg><use href="#i-heart"/></svg></a>
    </div>
    <div class="sf-fluva">
      <svg class="sf-wave" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 60V28C180 6 320 0 520 18s360 38 560 18 280-30 360-22v46z" fill="#1D2B3D"/></svg>
      <img class="fleaf c" src="assets/hoja-flor.webp" alt="" aria-hidden="true" loading="lazy" width="172" height="180">
      <span>Desarrollado por</span>
      <img class="sf-fl" src="assets/fluva.png" alt="FLUVA · Tecnología que fluye contigo" width="620" height="235" loading="lazy">
    </div>`;
}

/* ---------- Contacto ---------- */
function contact(){
  const N = D.negocio;
  $('cName').textContent = C.nombre; $('cRole').textContent = C.rol;
  const waHref = waLink(`Hola Carla, tengo una consulta sobre ${N.nombre}.`);
  const cards = [
    { sym:'m-wa', tone:'green', t:'WhatsApp', v:C.whatsappTexto, href:waHref },
    N.contacto.email ? { sym:'m-mail', tone:'sky', t:'Correo', v:N.contacto.email, href:'mailto:' + N.contacto.email } : null,
    { sym:'m-ig', tone:'pink', t:'Instagram', v:N.redes.instagram.usuario, href:N.redes.instagram.url },
    N.horarios ? { sym:'m-clock', tone:'peach', t:'Horario', v:N.horarios } : null,
    N.temporada ? { sym:'m-cal', tone:'teal', t:'Temporada', v:N.temporada } : null,
    N.aforoMaximo ? { sym:'m-users', tone:'lav', t:'Capacidad', v:N.aforoMaximo } : null
  ].filter(Boolean);
  $('cInfo').innerHTML = cards.map(c => `<${c.href ? `a href="${esc(c.href)}" target="_blank" rel="noopener"` : 'div'} class="ccard">${ico(c.sym, c.tone)}<span class="ctx"><small>${esc(c.t)}</small><b>${esc(c.v)}</b></span>${c.href ? '<svg class="chev"><use href="#i-chev"/></svg>' : ''}</${c.href ? 'a' : 'div'}>`).join('');
  $('cWa').href = waHref;
  $('cLoc').innerHTML = `<b>${esc(N.direccionExacta || N.ubicacion)}</b><br><span class="tiny">Región de Valparaíso, Chile</span>`;
  $('cMaps').href = N.mapsUrl;
}

/* ---------- Panel admin (demo) ---------- */
let tab = 'home';
const admGo = t => { tab = t; renderAdmin(); window.scrollTo({top:0, behavior:'smooth'}); };
document.addEventListener('click', e => {
  if (!e.target.closest('#adminPanel, #admMore, #admDay')) return;
  const t = e.target.closest('[data-tab]'); if (t){ e.preventDefault(); if (t.dataset.tab === 'requests') reqF = t.dataset.rf0 || 'pendiente'; admGo(t.dataset.tab); return; }
  if (e.target.closest('[data-more]')){ openDlg($('admMore')); return; }
  const g = e.target.closest('[data-go]'); if (g){ closeDlg($('admMore')); admGo(g.dataset.go); }
});
function pendingFields(){
  const N = D.negocio, out = [];
  out.push('Pin exacto de Google Maps (ahora busca «El Manzano, Las Dichas, Casablanca»)');
  if (!N.redes.facebook) out.push('Facebook (más adelante)');
  if (!N.redes.tiktok) out.push('TikTok (más adelante)');
  D.instalaciones.forEach(f => Object.entries(f.detalles).forEach(([k,v]) => { if (!v) out.push(`${f.titulo}: ${k} (no se muestra hasta confirmar)`); }));
  return out;
}
function renderAdmin(){
  if (tab === 'dates') tab = 'cal';
  const inMore = ['plans','memories','backup','pending','config','photos','pagos'].includes(tab);
  document.querySelectorAll('.adm-nav button').forEach(b => { const on = b.dataset.tab ? b.dataset.tab === tab : inMore; b.classList.toggle('on', on); on ? b.setAttribute('aria-current','page') : b.removeAttribute('aria-current'); });
  const c = $('adminContent'); c.className = 'adm-view v-' + tab;
  if (tab === 'home'){ adminHome(c); return; }
  if (tab === 'receipt'){ receiptForm(c); return; }
  if (tab === 'plans'){ adminPlans(c); return; }
  if (tab === 'pagos'){ adminPagos(c); return; }
  if (tab === 'config'){ adminConfig(c); return; }
  if (tab === 'cal'){ if (SB && ADMIN) { adminCal(c); return; } tab = 'dates'; }
  if (SB && ADMIN && tab === 'requests'){ sbRequests(c); return; }
  if (tab === 'dates'){
    c.innerHTML = `<h3>Habilitar o bloquear fechas</h3><p class="muted">Por defecto los días están disponibles; las fechas reservadas vienen de <code>data.js</code>. Aquí puedes ajustar días puntuales (solo en este navegador).</p>
      <div class="form"><div class="row2"><label>Fecha<input id="aDate" type="date" min="${iso(today)}"></label>
      <label>Estado<select id="aState">${Object.entries(LABEL).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}</select></label></div></div>
      <button class="btn teal" id="aSave" type="button">Guardar fecha</button><div id="aList"></div>`;
    $('aSave').onclick = () => { const d = $('aDate').value; if (!d) return toast('Elige una fecha.'); db.days[d] = $('aState').value; save(); calendar(); renderAdmin(); toast('Fecha guardada'); };
    $('aList').innerHTML = Object.entries(db.days).sort().map(([d,s]) => `<div class="adminRow"><span>${esc(fmtDate(d))} · <b>${esc(LABEL[s])}</b></span><span><button class="mini" data-edit="${d}">Editar</button><button class="mini danger" data-del="${d}">Quitar</button></span></div>`).join('');
    c.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => { $('aDate').value = b.dataset.edit; $('aDate').dispatchEvent(new Event('input')); $('aState').value = db.days[b.dataset.edit]; });
    c.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { delete db.days[b.dataset.del]; save(); calendar(); renderAdmin(); });
  }
  if (tab === 'requests'){
    c.innerHTML = '<h3>Solicitudes registradas en este navegador</h3>' + (db.requests.length ? db.requests.slice().reverse().map(r => `<div class="adminRow"><div><b>${esc(r.name)}</b><p class="tiny">${esc(r.kind)} · ${esc(r.date)} · ${esc(r.count)} personas · ${esc(r.detail)}<br>WhatsApp: ${esc(r.phone)} · Estado: <b>${esc(r.status)}</b></p></div><div><button class="mini" data-id="${r.id}" data-st="Confirmado">Confirmar</button><button class="mini" data-id="${r.id}" data-st="Cotizado">Cotizado</button><button class="mini danger" data-id="${r.id}" data-st="Rechazado">Rechazar</button>${r.status === 'Confirmado' ? `<button class="mini" data-rcl="${r.id}">🧾 Comprobante</button>` : ''}</div></div>`).join('') : '<p class="muted">Aún no hay solicitudes locales.</p>');
    c.querySelectorAll('[data-rcl]').forEach(b => b.onclick = () => { const r = db.requests.find(x => x.id === +b.dataset.rcl); if (r) prefillReceipt(normReq(r)); });
    c.querySelectorAll('[data-st]').forEach(b => b.onclick = () => {
      const r = db.requests.find(x => x.id === +b.dataset.id); if (!r) return;
      const apply = () => { if (b.dataset.st === 'Confirmado') { db.days[r.date] = 'booked'; calendar(); } r.status = b.dataset.st; save(); renderAdmin(); };
      if (b.dataset.st === 'Confirmado') confirmBox('¿Confirmar reserva?', `Se marcará ${fmtDate(r.date)} como reservado en este navegador.`, apply); else apply();
    });
  }
  if (tab === 'prices'){
    c.innerHTML = '<h3>Precios de entradas individuales</h3><p class="muted">La escala del arriendo por día se edita en <code>data.js</code>. Deja vacías las entradas si no las ofreces.</p><div class="form">' + [['adult','Entrada adulto (fecha especial)'],['child','Entrada niño (fecha especial)']].map(([k,l]) => `<label>${l} · CLP<input type="number" min="0" step="500" data-price="${k}" value="${esc(db.prices[k])}" placeholder="Por definir"></label>`).join('') + '</div><button class="btn teal" id="aPrices" type="button">Guardar precios</button>';
    $('aPrices').onclick = () => { c.querySelectorAll('[data-price]').forEach(i => db.prices[i.dataset.price] = i.value); save(); prices(); renderAdmin(); toast('Precios guardados en este navegador'); };
  }
  if (tab === 'photos'){
    c.innerHTML = '<h3>Fotografías de la galería</h3><p class="tiny">Las fotos nuevas se guardan localmente en este dispositivo; usa archivos de menos de 700 KB.</p>' + db.photos.map((p,i) => `<div class="photoAdmin"><img src="${esc(p.src)}" alt=""><div class="form" style="flex:1"><input aria-label="Título de la foto" data-name="${i}" value="${esc(p.titulo)}"><input type="file" accept="image/*" data-photo="${i}" aria-label="Reemplazar foto"></div></div>`).join('') + '<button class="btn teal" id="aPhotos" type="button">Guardar títulos</button> <button class="mini danger" id="aReset" type="button">Restaurar fotos originales</button>';
    c.querySelectorAll('[data-photo]').forEach(inp => inp.onchange = () => { const f = inp.files[0]; if (!f) return; if (f.size > 700000) return toast('Usa una imagen de menos de 700 KB.'); const rd = new FileReader(); rd.onload = () => { db.photos[+inp.dataset.photo].src = rd.result; if (save()) { gallery(); renderAdmin(); } }; rd.readAsDataURL(f); });
    $('aPhotos').onclick = () => { c.querySelectorAll('[data-name]').forEach(i => db.photos[+i.dataset.name].titulo = i.value); save(); gallery(); toast('Títulos guardados'); };
    $('aReset').onclick = () => confirmBox('¿Restaurar fotos?', 'Se volverá a la galería original.', () => { db.photos = D.galeria.map(p => ({...p})); save(); gallery(); renderAdmin(); });
  }
  if (tab === 'memories'){ memAdmin(c); return; }
  if (tab === 'backup'){ backupAdmin(c); return; }

  if (tab === 'pending'){
    const p = pendingFields();
    c.innerHTML = `<h3>Datos pendientes de confirmar (${p.length})</h3><p class="muted">Estos campos se muestran como «Por confirmar». Se editan en <code>data.js</code> (o en Precios).</p><ul class="pendlist">${p.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
  }
}

/* ---------- Generador de comprobantes ----------
   Los datos del cliente NO se guardan. Los precios de planes y adicionales
   se guardan solo en el navegador de Carla (no se publican en el código). */
const PLAN_KEY = 'quincho-planes-v1';
const PLAN_DEF = {
  planes: [
    { nombre:'Solo el espacio', tipo:'persona', precio:'' },
    { nombre:'Paseo de curso', tipo:'persona', precio:'' },
    { nombre:'Pack full day', tipo:'persona', precio:'' },
    { nombre:'Full day', tipo:'persona', precio:'' },
    { nombre:'Día completo + fiesta', tipo:'persona', precio:'' },
    { nombre:'Atención completa', tipo:'persona', precio:'' },
    { nombre:'Precio por el día (pocas personas)', tipo:'fijo', precio:'' }
  ],
  extras: [
    { nombre:'Juego inflable', tipo:'fijo', precio:'' },
    { nombre:'Completos', tipo:'unidad', precio:'' },
    { nombre:'Decoración', tipo:'fijo', precio:'' }
  ]
};
let PL; try { PL = JSON.parse(localStorage.getItem(PLAN_KEY) || 'null') || structuredClone(PLAN_DEF); } catch { PL = structuredClone(PLAN_DEF); }
const savePL = () => { try { localStorage.setItem(PLAN_KEY, JSON.stringify(PL)); } catch {} };
const TIPO = { persona:'por persona', fijo:'precio fijo', unidad:'por unidad' };

let rcpt = { cliente:'', fecha:'', horario:'', personas:'', incluye:'', total:'', plan:'', auto:true, extras:{}, abonos:[{fecha:iso(today), monto:'', medio:''}] };
let rcptBlob = null, rcptUrl = '';

function calc(){
  const n = Number(rcpt.personas)||0, parts = []; let total = 0;
  const p = PL.planes[rcpt.plan];
  if (p){ const pr = Number(p.precio)||0; const v = p.tipo === 'persona' ? pr*n : pr; total += v;
    parts.push(p.tipo === 'persona' ? `${p.nombre}: ${n} personas x ${clp(pr)||'$0'} (${clp(v)||'$0'})` : `${p.nombre} (${clp(v)||'$0'})`); }
  PL.extras.forEach((x,i) => { const q = rcpt.extras[i]; if (!q) return; const pr = Number(x.precio)||0;
    const v = x.tipo === 'unidad' ? pr*q : pr; total += v;
    parts.push(x.tipo === 'unidad' ? `${q} ${x.nombre.toLowerCase()} x ${clp(pr)||'$0'} (${clp(v)||'$0'})` : `${x.nombre} (${clp(v)||'$0'})`); });
  return { total, texto: parts.length ? (parts[0] + (parts.length > 1 ? '. Adicionales: ' + parts.slice(1).join(' + ') : '')) : '' };
}

function receiptForm(c){
  c.innerHTML = `<div class="rc-head">${ico('m-sparkle','pink','hmi')}<div><h3>Comprobante de reserva</h3><p class="muted">Rellena desde una solicitud aceptada o completa los datos.</p></div></div>
    <div class="recent" id="rRecent"></div>
    <div class="form rform">
      <section class="rc-blk"><h4>${ico('m-users','pink','smi')}Cliente y reserva</h4>
        <label>Cliente<input id="rCliente" maxlength="80" placeholder="Nombre del cliente o curso" autocomplete="off"></label>
        <div class="row2"><label>Fecha de la reserva<input id="rFecha" type="date"></label><label>Horario<input id="rHorario" maxlength="40" list="rHorList" placeholder="Elige o escribe"></label></div>
        <datalist id="rHorList"><option value="9:30 a 20:00"><option value="Full day"><option value="Día completo"><option value="Horario a acordar"></datalist>
        <div class="row2"><label>Plan<select id="rPlan"><option value="">— Elegir plan —</option>${PL.planes.map((p,i) => `<option value="${i}">${esc(p.nombre)}</option>`).join('')}<option value="otro">Otro / personalizado</option></select></label>
          <label>Personas<input id="rPersonas" type="number" min="0" inputmode="numeric" placeholder="0"></label></div>
      </section>
      <section class="rc-blk"><h4>${ico('m-balloons','lav','smi')}Adicionales</h4>
        <div class="extras">${PL.extras.map((x,i) => x.tipo === 'unidad'
          ? `<label class="xrow"><span>${esc(x.nombre)}</span><input type="number" min="0" inputmode="numeric" data-x="${i}" placeholder="Cant."></label>`
          : `<label class="psel"><input type="checkbox" data-x="${i}"><span>${esc(x.nombre)}</span></label>`).join('') || '<p class="tiny">Sin adicionales. Agrégalos en «Mis planes y precios».</p>'}</div>
      </section>
      <section class="rc-blk"><h4>${ico('m-cal','teal','smi')}Valor</h4>
        <label class="switch"><input type="checkbox" id="rAuto"><span class="sw" aria-hidden="true"></span><span>Calcular automáticamente</span></label>
        <label>Valor total (CLP)<span class="money"><i>$</i><input id="rTotal" type="number" min="0" step="1000" inputmode="numeric" placeholder="0"></span></label>
        <label>Incluye<textarea id="rIncluye" rows="3" maxlength="400" placeholder="Ej: Pack full day: 34 personas"></textarea></label>
      </section>
      <section class="rc-blk"><div class="blk-h"><h4>${ico('m-wa','green','smi')}Abonos</h4><button type="button" class="chip-btn" id="rAddAb">+ Agregar</button></div>
        <div id="rAbonos" class="abonos"></div>
        <div class="totals" id="rSum" aria-live="polite"></div>
      </section>
      <button type="button" class="btn2 primary full" id="rGen"><svg><use href="#m-sparkle"/></svg>Generar comprobante</button>
      <details class="planed"><summary>${ico('m-star','yellow','smi')}<span>Mis planes y precios</span><svg class="chev"><use href="#i-chev"/></svg></summary><div id="rPlanes"></div></details>
    </div>
    <div id="rOut" class="rout" hidden>
      <h4 class="rout-h">Vista previa</h4>
      <img id="rPrev" alt="Vista previa del comprobante">
      <div class="rout-btns">
        <button type="button" class="btn2 wa" id="rShare"><svg><use href="#m-wa"/></svg>Compartir</button>
        <a class="btn2 ghost" id="rDown" download="comprobante.png" href="#">Descargar</a>
      </div>
      <button type="button" class="btn2 ghost full" id="rSavePago" style="margin-top:10px" hidden>💾 Guardar estos montos en Pagos</button>
      <p class="tiny" id="rMsg">Si los botones no funcionan en tu teléfono, mantén presionada la imagen y elige «Guardar imagen».</p>
    </div>`;
  const map = {rCliente:'cliente', rFecha:'fecha', rHorario:'horario', rPersonas:'personas', rTotal:'total', rIncluye:'incluye'};
  Object.entries(map).forEach(([id,k]) => { const el = $(id); el.value = rcpt[k]; el.addEventListener('input', () => { rcpt[k] = el.value; if (rcpt.auto && (k === 'personas')) applyCalc(); rSum(); }); });
  $('rPlan').value = rcpt.plan;
  $('rPlan').onchange = () => { rcpt.plan = $('rPlan').value; if (rcpt.plan === 'otro') { setAuto(false); } else if (rcpt.auto) applyCalc(); };
  c.querySelectorAll('[data-x]').forEach(inp => {
    const i = +inp.dataset.x; if (inp.type === 'checkbox') inp.checked = !!rcpt.extras[i]; else inp.value = rcpt.extras[i] || '';
    inp.addEventListener('input', () => { rcpt.extras[i] = inp.type === 'checkbox' ? (inp.checked ? 1 : 0) : (Number(inp.value)||0); if (rcpt.auto) applyCalc(); });
  });
  const setAuto = on => { rcpt.auto = on; $('rAuto').checked = on; $('rTotal').readOnly = on; $('rTotal').classList.toggle('autoval', on);
    $('rTotal').placeholder = on ? 'Se calcula solo' : 'Escribe el valor'; if (on) applyCalc(); rSum(); };
  const applyCalc = () => { const r = calc(); if (rcpt.plan === '' && !r.texto) return;
    rcpt.total = r.total ? String(r.total) : ''; $('rTotal').value = rcpt.total;
    if (r.texto) { rcpt.incluye = r.texto; $('rIncluye').value = r.texto; }
    const p = PL.planes[rcpt.plan]; if (p && !p.precio) toast(`Falta el precio de «${p.nombre}»: agrégalo en «Mis planes y precios».`);
    rSum(); };
  $('rAuto').onchange = () => setAuto($('rAuto').checked);
  setAuto(rcpt.auto && rcpt.plan !== 'otro');
  const drawAb = () => {
    $('rAbonos').innerHTML = rcpt.abonos.length ? rcpt.abonos.map((ab,i) => `<div class="abcard">
        <div class="ab-top"><span class="ab-n">Abono ${i+1}</span><button type="button" class="ab-del" data-del-ab="${i}" aria-label="Eliminar abono ${i+1}"><svg><use href="#i-trash"/></svg></button></div>
        <label class="ab-f">Fecha<input type="date" data-ab="${i}" data-k="fecha" value="${esc(ab.fecha)}" aria-label="Fecha del abono ${i+1}"></label>
        <div class="ab-row">
          <label class="ab-f">Monto<span class="money"><i>$</i><input type="number" min="0" step="1000" inputmode="numeric" data-ab="${i}" data-k="monto" value="${esc(ab.monto)}" placeholder="0" aria-label="Monto del abono ${i+1}"></span></label>
          <label class="ab-f">Medio de pago<select data-ab="${i}" data-k="medio" aria-label="Medio de pago del abono ${i+1}">${['', 'Transferencia', 'Efectivo', 'Depósito', 'Tarjeta'].concat(ab.medio && !['Transferencia','Efectivo','Depósito','Tarjeta'].includes(ab.medio) ? [ab.medio] : []).map(m => `<option value="${esc(m)}" ${m === (ab.medio||'') ? 'selected' : ''}>${m ? esc(m) : 'Elegir…'}</option>`).join('')}</select></label>
        </div>
      </div>`).join('') : '<p class="tiny ab-empty">Sin abonos registrados.</p>';
    $('rAbonos').querySelectorAll('[data-ab]').forEach(inp => { const h = () => { rcpt.abonos[+inp.dataset.ab][inp.dataset.k] = inp.value; rSum(); }; inp.addEventListener('input', h); inp.addEventListener('change', h); });
    $('rAbonos').querySelectorAll('[data-ab]').forEach(inp => inp.addEventListener('input', () => { rcpt.abonos[+inp.dataset.ab][inp.dataset.k] = inp.value; rSum(); }));
    $('rAbonos').querySelectorAll('[data-del-ab]').forEach(b => b.onclick = () => { rcpt.abonos.splice(+b.dataset.delAb,1); drawAb(); rSum(); });
  };
  $('rAddAb').onclick = () => { rcpt.abonos.push({fecha:iso(today), monto:'', medio:''}); drawAb(); };
  drawAb(); rSum(); planEditor($('rPlanes'), () => { receiptForm($('adminContent')); const d = document.querySelector('.planed'); if (d) d.open = true; }); recentAccepted();
  $('rGen').onclick = async () => {
    if (!rcpt.cliente.trim() || !rcpt.fecha) { toast('Completa al menos el cliente y la fecha.'); (!rcpt.cliente.trim() ? $('rCliente') : $('rFecha')).focus(); return; }
    $('rGen').disabled = true; $('rGen').textContent = 'Generando…';
    try {
      rcptBlob = await drawReceipt(rcpt);
      if (rcptUrl) URL.revokeObjectURL(rcptUrl);
      rcptUrl = URL.createObjectURL(rcptBlob);
      const name = 'comprobante-' + rcpt.fecha + '-' + rcpt.cliente.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40) + '.png';
      $('rPrev').src = rcptUrl; $('rDown').href = rcptUrl; $('rDown').download = name;
      $('rOut').hidden = false; $('rOut').scrollIntoView({behavior:'smooth', block:'start'});
      if (SB && ADMIN) { $('rSavePago').hidden = false; $('rSavePago').onclick = async () => {
        const { error } = await SB.from('pagos').upsert({ fecha: rcpt.fecha, cliente: rcpt.cliente.trim(), personas: Number(rcpt.personas)||0, horario: rcpt.horario || null, incluye: rcpt.incluye || null, total: Number(rcpt.total)||0, abonos: rcpt.abonos.filter(x => Number(x.monto) > 0).map(x => ({ fecha:x.fecha, monto:Number(x.monto), medio:x.medio || '' })), actualizado: new Date().toISOString(), actualizado_por: ADMIN }, { onConflict:'fecha' });
        toast(error ? (/pagos/.test(error.message) ? 'Falta ejecutar supabase_pagos.sql' : 'No se pudo: ' + error.message) : 'Guardado en Pagos ✔'); ADM.loaded = 0; }; }
      $('rShare').onclick = async () => {
        const file = new File([rcptBlob], name, {type:'image/png'});
        try {
          if (navigator.canShare && navigator.canShare({files:[file]})) { await navigator.share({files:[file], title:'Comprobante de reserva'}); }
          else toast('Tu navegador no permite compartir directo: usa «Descargar imagen».');
        } catch (e) { if (e && e.name !== 'AbortError') toast('No se pudo compartir; usa «Descargar imagen».'); }
      };
    } catch (e) { toast('No se pudo generar la imagen.'); }
    $('rGen').disabled = false; $('rGen').textContent = 'Generar comprobante';
  };
}

/* Solicitudes aceptadas recientes → rellenar comprobante */
const normReq = r => r.nombre !== undefined
  ? { nombre:r.nombre, fecha:r.fecha, personas:r.personas || '', actividad:[r.actividad, r.servicios].filter(Boolean).join(' · '), obs:r.observaciones || '' }
  : { nombre:r.name, fecha:r.date, personas:r.count || '', actividad:r.detail || '', obs:r.note || '' };
async function recentAccepted(){
  const box = $('rRecent'); if (!box) return;
  let list = [];
  if (SB && ADMIN){
    box.innerHTML = '<p class="tiny">Cargando solicitudes aceptadas…</p>';
    const { data } = await SB.from('solicitudes').select('*').eq('estado','aceptada').order('creado', {ascending:false}).limit(6);
    list = (data || []).map(normReq);
  } else list = db.requests.filter(r => r.status === 'Confirmado').slice(-6).reverse().map(normReq);
  if (!$('rRecent')) return;
  box.innerHTML = list.length ? `<p class="flabel">Solicitudes aceptadas recientes</p><div class="recent-list">${list.map((r,i) => `<button type="button" class="rchip" data-ri="${i}"><b>${esc(r.nombre)}</b><small>📅 ${esc(fShort(r.fecha))}${r.personas ? ' · ' + esc(r.personas) + ' pers.' : ''}</small><small>${esc(r.actividad)}</small></button>`).join('')}</div>`
    : '<p class="tiny">Cuando aceptes solicitudes, aparecerán aquí para rellenar el comprobante con un toque.</p>';
  box.querySelectorAll('[data-ri]').forEach(b => b.onclick = () => { prefillReceipt(list[+b.dataset.ri]); });
}
function prefillReceipt(r){
  Object.assign(rcpt, { cliente: r.nombre, fecha: r.fecha, personas: String(r.personas || ''), incluye: [r.actividad, r.obs].filter(Boolean).join('. '), plan: '', extras: {} });
  tab = 'receipt'; renderAdmin(); toast('Datos cargados ✔ Revisa plan, valor y abonos.');
  const p = $('rPlan'); if (p) p.scrollIntoView({behavior:'smooth', block:'center'});
}

function planEditor(box, rerender){
  if (!box) return;
  const rows = (list, key) => list.map((p,i) => `<div class="prow"><input data-pk="${key}" data-i="${i}" data-f="nombre" value="${esc(p.nombre)}" aria-label="Nombre" maxlength="50">
      <select data-pk="${key}" data-i="${i}" data-f="tipo" aria-label="Tipo de precio">${Object.entries(TIPO).filter(([k]) => key === 'extras' || k !== 'unidad').map(([k,v]) => `<option value="${k}" ${p.tipo===k?'selected':''}>${v}</option>`).join('')}</select>
      <input type="number" min="0" step="500" inputmode="numeric" data-pk="${key}" data-i="${i}" data-f="precio" value="${esc(p.precio)}" placeholder="Precio CLP" aria-label="Precio">
      <button type="button" class="mini danger" data-pdel="${key}" data-i="${i}" aria-label="Quitar">✕</button></div>`).join('');
  box.innerHTML = `<p class="tiny">Estos precios se guardan solo en este teléfono o computador; no aparecen en la página pública.</p>
    <h4>Planes</h4>${rows(PL.planes,'planes')}<button type="button" class="mini" data-padd="planes">+ Agregar plan</button>
    <h4>Adicionales</h4>${rows(PL.extras,'extras')}<button type="button" class="mini" data-padd="extras">+ Agregar adicional</button>
    <div class="modal-actions" style="margin-top:12px"><button type="button" class="btn teal" id="pSave">Guardar planes</button></div>`;
  box.querySelectorAll('[data-pk]').forEach(inp => inp.addEventListener('input', () => { PL[inp.dataset.pk][+inp.dataset.i][inp.dataset.f] = inp.value; }));
  box.querySelectorAll('[data-pdel]').forEach(b => b.onclick = () => { PL[b.dataset.pdel].splice(+b.dataset.i,1); savePL(); rerender(); });
  box.querySelectorAll('[data-padd]').forEach(b => b.onclick = () => { PL[b.dataset.padd].push({nombre:'Nuevo', tipo:'fijo', precio:''}); rerender(); });
  $('pSave').onclick = () => { savePL(); toast('Planes guardados en este dispositivo ✔'); rerender(); };
}
const abTotal = r => r.abonos.reduce((s,a) => s + (Number(a.monto)||0), 0);
function rSum(){
  const el = $('rSum'); if (!el) return;
  const tot = Number(rcpt.total)||0, ab = abTotal(rcpt), saldo = Math.max(0, tot - ab), pct = tot ? Math.min(100, Math.round(ab / tot * 100)) : 0;
  el.innerHTML = `<div class="tot-row"><span>Valor total</span><b>${tot ? clp(tot) : '—'}</b></div>
    <div class="tot-row ok"><span>Total abonado</span><b>${clp(ab) || '$0'}</b></div>
    <div class="tot-row due"><span>Saldo pendiente</span><b>${tot ? clp(saldo) : 'Por definir'}</b></div>
    ${tot ? `<div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Porcentaje pagado"><i style="width:${pct}%"></i></div><p class="tiny" style="margin:4px 0 0">${pct}% pagado${ab > tot ? ' · ⚠ los abonos superan el total' : ''}</p>` : ''}`;
}
const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
function wrap(ctx, txt, maxW){ const out=[]; String(txt).split(/\n/).forEach(par => { let cur=''; par.split(' ').forEach(w => { const t = cur ? cur+' '+w : w; if (ctx.measureText(t).width > maxW && cur){ out.push(cur); cur = w; } else cur = t; }); out.push(cur); }); return out; }
const fShort = f => { if (!f) return '—'; const [y,m,d] = f.split('-'); return `${d}-${m}-${y}`; };
async function drawReceipt(r){
  try { await Promise.all([document.fonts.load('700 60px Fredoka'), document.fonts.load('700 30px Nunito'), document.fonts.load('600 30px Nunito')]); } catch {}
  const logo = await loadImg('assets/logo.webp').catch(() => null);
  const HEAD = 'Fredoka, "Segoe UI", sans-serif', BODY = 'Nunito, system-ui, sans-serif';
  const P = {pink:'#ff1493', teal:'#067f93', tealL:'#dcf7fb', lime:'#c8ff00', ink:'#1d2a3a', muted:'#7b8794', ok:'#1fae5b', pinkL:'#ffe1f1'};
  const W = 1080, PX = 80, CW = W - PX*2;
  const m = document.createElement('canvas').getContext('2d'); m.font = '600 32px ' + BODY;
  const incl = r.incluye.trim() ? wrap(m, r.incluye.trim(), CW - 60) : [];
  const abonos = r.abonos.filter(a => Number(a.monto) > 0);
  const tot = Number(r.total)||0, ab = abTotal(r);
  const H = 1700 + incl.length*44 + Math.max(1,abonos.length)*58;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
  const rr = (X,Y,w,h,rad) => { x.beginPath(); x.moveTo(X+rad,Y); x.arcTo(X+w,Y,X+w,Y+h,rad); x.arcTo(X+w,Y+h,X,Y+h,rad); x.arcTo(X,Y+h,X,Y,rad); x.arcTo(X,Y,X+w,Y,rad); x.closePath(); };
  x.fillStyle = '#fff'; x.fillRect(0,0,W,H);
  const g = x.createLinearGradient(0,0,W,380); g.addColorStop(0,'#3fd8ea'); g.addColorStop(1,'#0bbcd4');
  x.fillStyle = g; x.beginPath(); x.moveTo(0,0); x.lineTo(W,0); x.lineTo(W,330); for (let X=W; X>=0; X-=10) x.lineTo(X, 330 + Math.sin(X/70)*16); x.closePath(); x.fill();
  x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 4;
  for (let k=0;k<3;k++){ x.beginPath(); for (let X=0; X<=W; X+=10){ const Y = 70 + k*85 + Math.sin(X/55+k)*10; X ? x.lineTo(X,Y) : x.moveTo(X,Y); } x.stroke(); }
  let y = 380;
  if (logo){ const lw = 560, lh = lw*logo.naturalHeight/logo.naturalWidth; x.drawImage(logo, (W-lw)/2, 18, lw, lh); y = Math.max(390, 18+lh+60); }
  x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  x.fillStyle = P.pink; x.font = '700 64px ' + HEAD; x.fillText('Comprobante de reserva', W/2, y+20);
  y += 72; x.fillStyle = P.teal; x.font = '800 38px ' + BODY;
  const fl = fmtDate(r.fecha); x.fillText(fl.charAt(0).toUpperCase()+fl.slice(1), W/2, y);
  y += 60; x.strokeStyle = '#e8edf2'; x.lineWidth = 2; x.beginPath(); x.moveTo(PX,y); x.lineTo(W-PX,y); x.stroke(); y += 60;
  const row = (lab, val) => { x.textAlign='left'; x.fillStyle=P.muted; x.font='700 30px '+BODY; x.fillText(lab, PX, y);
    x.textAlign='right'; x.fillStyle=P.ink; x.font='800 32px '+BODY; let v=String(val); while (x.measureText(v).width > CW-260 && v.length>4) v=v.slice(0,-2); if (v!==String(val)) v=v.trim()+'…'; x.fillText(v, W-PX, y); y += 58; };
  row('Cliente', r.cliente.trim());
  if (r.horario.trim()) row('Horario', r.horario.trim());
  if (Number(r.personas)) row('Personas', r.personas);
  if (incl.length){ y += 6; x.textAlign='left'; x.fillStyle=P.muted; x.font='700 30px '+BODY; x.fillText('Incluye', PX, y); y += 24;
    const bh = incl.length*44 + 36; rr(PX,y,CW,bh,22); x.fillStyle=P.tealL; x.fill();
    x.fillStyle=P.ink; x.font='600 32px '+BODY; incl.forEach((l,i) => x.fillText(l, PX+30, y+50+i*44)); y += bh + 56; }
  else y += 20;
  x.textAlign='left'; x.fillStyle=P.teal; x.font='700 40px '+HEAD; x.fillText('Pagos', PX, y); y += 54;
  if (abonos.length) abonos.forEach(a => { x.textAlign='left'; x.fillStyle=P.ink; x.font='700 30px '+BODY; x.fillText('Abono ' + fShort(a.fecha) + (a.medio.trim() ? ' · ' + a.medio.trim() : ''), PX, y);
      x.textAlign='right'; x.font='800 32px '+BODY; x.fillStyle=P.ok; x.fillText(clp(a.monto), W-PX, y); y += 58; });
  else { x.textAlign='left'; x.fillStyle=P.muted; x.font='600 30px '+BODY; x.fillText('Sin abonos registrados', PX, y); y += 58; }
  y += 10; const boxH = tot ? 230 : 120; rr(PX,y,CW,boxH,26); x.fillStyle=P.pinkL; x.fill();
  const tl = (lab,val,col,yy,big) => { x.textAlign='left'; x.fillStyle=P.ink; x.font=(big?'800 36px ':'700 32px ')+BODY; x.fillText(lab, PX+34, yy);
    x.textAlign='right'; x.fillStyle=col; x.font=(big?'700 46px ':'700 36px ')+HEAD; x.fillText(val, W-PX-34, yy); };
  if (tot){ tl('Valor total', clp(tot), P.ink, y+62); tl('Total abonado', clp(ab), P.ok, y+124); tl('Saldo pendiente', clp(Math.max(0,tot-ab)), P.pink, y+192, true); }
  else tl('Total abonado', clp(ab) || '$0', P.ok, y+74, true);
  y += boxH + 70;
  if (!tot){ x.textAlign='center'; x.fillStyle=P.muted; x.font='600 28px '+BODY; x.fillText('Valor total por confirmar', W/2, y-14); y += 50; }
  x.textAlign='center'; x.fillStyle=P.teal; x.font='800 30px '+BODY;
  x.fillText('WhatsApp ' + C.whatsappTexto + '   ·   ' + D.negocio.redes.instagram.usuario, W/2, y);
  y += 44; x.fillStyle=P.muted; x.font='600 26px '+BODY; x.fillText(D.negocio.ubicacion + '  ·  Emitido el ' + fmtDate(iso(today)), W/2, y);
  y += 40; x.fillStyle=P.lime; x.fillRect(0, y, W, 14);
  const out = document.createElement('canvas'); out.width = W; out.height = Math.ceil(y+14); out.getContext('2d').drawImage(cv,0,0);
  return await new Promise(res => out.toBlob(res, 'image/png'));
}

/* ---------- Acceso administración (#admin) ---------- */
const ADM_SALT = 'quincho-agustina|', SKEY = 'quincho-admin';
async function sha(t){ const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2,'0')).join(''); }
const who = () => { try { return sessionStorage.getItem(SKEY) || ''; } catch { return ''; } };
/* ---------- Supabase (base de datos y acceso real) ---------- */
const SBC = D.supabase || {};
let SB = null, ADMIN = '';
const sbReady = new Promise(res => {
  if (!SBC.url || !SBC.anonKey) return res(null);
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  s.onload = async () => {
    try { SB = window.supabase.createClient(SBC.url, SBC.anonKey); } catch { SB = null; return res(null); }
    try {
      const { error } = await SB.from('fechas_bloqueadas').select('fecha', { head:true, count:'exact' });
      if (error) { window.SB_STATUS = /does not exist|PGRST20|42P01/i.test(error.message + error.code) ? 'nosql' : 'error:' + error.message; if (window.SB_STATUS === 'nosql') SB = null; }
      else window.SB_STATUS = 'ok';
    } catch (e) { window.SB_STATUS = 'offline'; SB = null; }
    sbStatus(); res(SB);
  };
  s.onerror = () => { window.SB_STATUS = 'offline'; sbStatus(); res(null); };
  document.head.append(s);
});
function admWarn(){
  const el = $('admWarn'); if (!el) return;
  if (SB && ADMIN){ el.className = 'adm-warn ok'; el.innerHTML = `<span class="dotl"></span><span><b>En línea.</b> Solicitudes, fechas, mural y respaldo se guardan en la base de datos. «Planes y precios» queda solo en este dispositivo.</span>`; }
  else { el.className = 'adm-warn bad'; el.innerHTML = `<span class="dotl"></span><span><b>Modo local.</b> Los cambios quedan solo en este navegador y no se sincronizan con otros teléfonos.</span>`; }
}
function sbStatus(){
  const el = $('sbStat'); if (!el) return;
  const s = window.SB_STATUS || (SBC.url ? 'checking' : 'off');
  const M = { ok:['ok','✔ Conectado a la base de datos'], nosql:['bad','✖ Falta ejecutar supabase.sql en Supabase'], offline:['bad','✖ No se pudo conectar con Supabase (modo local)'], off:['bad','Base de datos no configurada (modo local)'], checking:['wait','Conectando con la base de datos…'] };
  const [cls, txt] = M[s] || ['bad', '✖ ' + s.replace(/^error:/,'Error: ')];
  el.className = 'sbstat ' + cls; el.textContent = txt; admWarn();
}
async function sbLoadDates(){
  if (!SB) return;
  const { data, error } = await SB.from('fechas_bloqueadas').select('fecha');
  if (error || !data) return;
  data.forEach(x => RESERVADAS.add(x.fecha));
  calendar(); homeCal(); if (!$('ecal').hidden) eventCal();
}
async function sbSend(row){
  await sbReady; if (!SB) return;
  try { const { error } = await SB.from('solicitudes').insert(row); if (error) console.warn('Supabase:', error.message); } catch (e) { console.warn(e); }
}
async function sbAdminName(){
  if (!SB) return '';
  const { data: { session } } = await SB.auth.getSession();
  if (!session) return '';
  const { data } = await SB.from('admins').select('nombre').eq('email', session.user.email.toLowerCase()).maybeSingle();
  return data ? data.nombre : '';
}
const ESTADOS = { pendiente:'🕒 Pendiente', aceptada:'✅ Aceptada', rechazada:'❌ Rechazada', cotizada:'💬 Cotizada' };
async function sbDates(c){
  c.innerHTML = '<h3>Fechas bloqueadas</h3><p class="muted">Cargando…</p>';
  const { data, error } = await SB.from('fechas_bloqueadas').select('fecha').order('fecha');
  if (error) { c.innerHTML = '<h3>Fechas bloqueadas</h3><p class="muted">No se pudieron cargar.</p>'; return; }
  const fut = data.filter(x => x.fecha >= iso(today));
  c.innerHTML = `<h3>Fechas bloqueadas</h3><p class="muted">Las fechas de esta lista aparecen como reservadas en la página para todos.</p>
    <div class="form"><div class="row2"><label>Bloquear fecha<input id="sbDate" type="date" min="${iso(today)}"></label><span></span></div></div>
    <button class="btn teal" id="sbAdd" type="button">Bloquear fecha</button>
    <div>${fut.map(x => `<div class="adminRow"><span>${esc(fmtDate(x.fecha))}</span><button class="mini danger" data-un="${x.fecha}">Desbloquear</button></div>`).join('') || '<p class="muted">Sin fechas futuras bloqueadas.</p>'}</div>`;
  $('sbAdd').onclick = async () => { const d = $('sbDate').value; if (!d) return toast('Elige una fecha.');
    const { error: e2 } = await SB.from('fechas_bloqueadas').upsert({ fecha: d }); toast(e2 ? 'No se pudo: ' + e2.message : 'Fecha bloqueada ✔'); if (!e2) { RESERVADAS.add(d); calendar(); homeCal(); } sbDates(c); };
  c.querySelectorAll('[data-un]').forEach(b => b.onclick = () => confirmBox('¿Desbloquear fecha?', `${fmtDate(b.dataset.un)} volverá a aparecer disponible.`, async () => {
    const { error: e3 } = await SB.from('fechas_bloqueadas').delete().eq('fecha', b.dataset.un);
    if (!e3) { RESERVADAS.delete(b.dataset.un); calendar(); homeCal(); } toast(e3 ? 'No se pudo: ' + e3.message : 'Fecha desbloqueada ✔'); sbDates(c); }));
}


/* =====================================================================
   Mural «Historias que quedan»
   - Con Supabase: registros en la tabla «recuerdos», fotos en Storage (bucket privado «recuerdos»).
   - Sin Supabase: modo demostración en memoria (nada se guarda; las fotos NO van a localStorage).
   ===================================================================== */
const MCATS = { familia:'Familias', cumpleanos:'Cumpleaños', matrimonio:'Matrimonios', curso:'Paseos de curso', otro:'Otros' };
const MCAT_T = { familia:'pink', cumpleanos:'lav', matrimonio:'peach', curso:'yellow', otro:'sky' };
const MAX_PH = 5, MAX_IN = 15 * 1024 * 1024, OK_TYPES = /^image\/(jpe?g|png|webp|heic|heif)$/i, OK_EXT = /\.(jpe?g|png|webp|heic|heif)$/i;
let MEM = [], memCat = 'todo', memShowAll = false, memPh = [], memRepIdx = -1, memOpened = 0, memView = null, memViewIdx = 0;
const memDemo = { list: (db.memories || []).filter(m => m.status === 'Aprobado').map(m => ({ id:'d'+m.id, creado:new Date(m.id).toISOString(), nombre:m.name, mensaje:m.message, categoria:'familia', fecha_visita:null, fotos:[], urls:[], estado:'aprobado', destacado:false, me_encanta:0 })) };
const liked = (() => { try { return new Set(JSON.parse(localStorage.getItem('quincho-liked') || '[]')); } catch { return new Set(); } })();
const saveLiked = () => { try { localStorage.setItem('quincho-liked', JSON.stringify([...liked])); } catch {} };
const fDate = s => s ? new Date(s.length > 10 ? s : s + 'T12:00').toLocaleDateString('es-CL',{day:'numeric',month:'short',year:'numeric'}) : '';

async function signUrls(rows){
  const paths = [...new Set(rows.flatMap(r => r.fotos || []))];
  if (!SB || !paths.length) return rows;
  const { data } = await SB.storage.from('recuerdos').createSignedUrls(paths, 3600);
  const map = new Map((data || []).filter(x => x.signedUrl).map(x => [x.path, x.signedUrl]));
  rows.forEach(r => r.urls = (r.fotos || []).map(p => map.get(p)).filter(Boolean));
  return rows;
}
async function memLoad(){
  if (SB){
    $('wall').innerHTML = '<div class="mem-skel"></div><div class="mem-skel"></div>';
    const { data, error } = await SB.from('recuerdos').select('id,creado,nombre,fecha_visita,categoria,mensaje,fotos,destacado,me_encanta,estado').eq('estado','aprobado').order('creado',{ascending:false}).limit(60);
    if (error){ $('wall').innerHTML = '<p class="mem-err">No pudimos cargar los recuerdos. Revisa tu conexión e inténtalo de nuevo.</p>'; return; }
    MEM = await signUrls(data);
  } else MEM = memDemo.list.filter(r => r.estado === 'aprobado');
  memRender(); memHome();
  $('memModo').hidden = !!SB;
  $('memModo').textContent = 'Modo demostración: el recuerdo se verá solo en esta pestaña hasta conectar la base de datos.';
}
function memCard(r, i){
  const t = MCAT_T[r.categoria] || 'pink', liked1 = liked.has(r.id);
  return `<article class="mem" data-mi="${i}">
    <button type="button" class="mem-open" data-open="${i}" aria-label="Ver recuerdo de ${esc(r.nombre)}">${r.urls && r.urls[0] ? `<img class="mem-ph" src="${esc(r.urls[0])}" alt="" loading="lazy" decoding="async">${r.urls.length > 1 ? `<span class="mem-more">+${r.urls.length - 1}</span>` : ''}` : `<span class="mem-noph t-${t}"><svg><use href="#m-sparkle"/></svg></span>`}</button>
    <div class="mem-b">
      <div class="mem-who"><span class="av t-${t}" aria-hidden="true">${esc((r.nombre.trim()[0] || '♥').toUpperCase())}</span><span><b>${esc(r.nombre)}</b><small>${esc(fDate(r.fecha_visita || r.creado))}</small></span></div>
      <p>${esc(r.mensaje)}</p>
      <button type="button" class="likes ${liked1 ? 'on' : ''}" data-like="${i}" aria-pressed="${liked1}" aria-label="Me encanta"><svg><use href="#i-heart"/></svg><b>${r.me_encanta || 0}</b></button>
    </div></article>`;
}
function memRender(){
  const list = MEM.filter(r => memCat === 'todo' || r.categoria === memCat);
  const show = memShowAll ? list : list.slice(0, 6);
  $('memAll').hidden = list.length <= 6; $('memAll').textContent = memShowAll ? 'Ver menos' : 'Ver todos';
  $('wall').innerHTML = show.length ? show.map(r => memCard(r, MEM.indexOf(r))).join('')
    : `<div class="mem-empty">${ico('m-sparkle','pink','bigmi')}<div><b>${MEM.length ? 'Aún no hay recuerdos en esta categoría' : 'Aquí comenzará nuestra historia'}</b><span>Sé la primera familia en dejar su recuerdo.</span></div></div>`;
}
function memHome(){
  const F = MEM.filter(r => r.destacado && r.urls && r.urls.length);
  $('homeMem').hidden = !F.length;
  $('homeMemStrip').innerHTML = F.map(r => `<button type="button" class="scard" data-hmem="${MEM.indexOf(r)}" aria-label="Recuerdo de ${esc(r.nombre)}"><img src="${esc(r.urls[0])}" alt="" loading="lazy" decoding="async"><span class="spill"><svg class="hrt"><use href="#i-heart"/></svg>${esc(r.nombre)}</span></button>`).join('');
}
async function memLike(i){
  const r = MEM[i]; if (!r) return;
  const on = !liked.has(r.id), delta = on ? 1 : -1;
  on ? liked.add(r.id) : liked.delete(r.id); saveLiked();
  r.me_encanta = Math.max(0, (r.me_encanta || 0) + delta); memRender(); if (memView === r) mvPaint();
  if (SB){ const { data, error } = await SB.rpc('me_encanta', { p_id: r.id, p_delta: delta }); if (!error && typeof data === 'number') { r.me_encanta = data; memRender(); if (memView === r) mvPaint(); } }
}
function mvOpen(i){ memView = MEM[i]; memViewIdx = 0; if (!memView) return; mvPaint(); openDlg($('memView')); }
function mvPaint(){
  const r = memView, u = r.urls || [], t = MCAT_T[r.categoria] || 'pink';
  $('memView').classList.toggle('nophoto', !u.length);
  if (u.length){ $('mvImg').src = u[memViewIdx]; $('mvImg').alt = `Foto ${memViewIdx+1} de ${r.nombre}`; }
  $('mvN').textContent = u.length > 1 ? `${memViewIdx+1}/${u.length}` : '';
  $('mvPrev').hidden = $('mvNext').hidden = u.length < 2;
  $('mvAv').className = 'av t-' + t; $('mvAv').textContent = (r.nombre.trim()[0] || '♥').toUpperCase();
  $('mvName').textContent = r.nombre; $('mvDate').textContent = `${MCATS[r.categoria] || ''} · ${fDate(r.fecha_visita || r.creado)}`;
  $('mvText').textContent = r.mensaje;
  $('mvThumbs').innerHTML = u.length > 1 ? u.map((x,k) => `<button type="button" data-th="${k}" class="${k === memViewIdx ? 'on' : ''}" aria-label="Foto ${k+1}"><img src="${esc(x)}" alt=""></button>`).join('') : '';
  $('mvLikes').textContent = r.me_encanta || 0; $('mvLove').classList.toggle('on', liked.has(r.id)); $('mvLove').setAttribute('aria-pressed', liked.has(r.id));
}

/* --- Formulario --- */
function memInit(){
  $('memFilters').innerHTML = [['todo','Todos'], ...Object.entries(MCATS)].map(([k,v]) => `<button type="button" data-mc="${k}" aria-pressed="${k===memCat}">${v}</button>`).join('');
  $('memFilters').addEventListener('click', e => { const b = e.target.closest('[data-mc]'); if (!b) return; memCat = b.dataset.mc; $('memFilters').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); memRender(); });
  $('memAll').addEventListener('click', () => { memShowAll = !memShowAll; memRender(); });
  $('wall').addEventListener('click', e => { const l = e.target.closest('[data-like]'); if (l) return memLike(+l.dataset.like); const o = e.target.closest('[data-open]'); if (o) mvOpen(+o.dataset.open); });
  $('homeMemStrip').addEventListener('click', e => { const b = e.target.closest('[data-hmem]'); if (b) mvOpen(+b.dataset.hmem); });
  $('mvPrev').addEventListener('click', () => { const n = memView.urls.length; memViewIdx = (memViewIdx - 1 + n) % n; mvPaint(); });
  $('mvNext').addEventListener('click', () => { const n = memView.urls.length; memViewIdx = (memViewIdx + 1) % n; mvPaint(); });
  $('mvThumbs').addEventListener('click', e => { const b = e.target.closest('[data-th]'); if (b) { memViewIdx = +b.dataset.th; mvPaint(); } });
  $('mvLove').addEventListener('click', () => memLike(MEM.indexOf(memView)));
  $('goMemForm').addEventListener('click', e => { e.preventDefault(); $('wallForm').scrollIntoView({behavior:'smooth', block:'start'}); setTimeout(() => $('wname').focus({preventScroll:true}), 450); });
  $('wcat').innerHTML = Object.entries(MCATS).map(([k,v]) => `<option value="${k}">${v.replace(/s$/,'').replace('Familia','Visita familiar').replace('Paseos de curso','Paseo de curso').replace('Otro','Otro')}</option>`).join('');
  const wd = $('wdate'); wd.max = iso(today); enhanceDates($('wallForm')); wd.dataset.max = iso(today);
  $('wmessage').addEventListener('input', () => { const n = $('wmessage').value.length; $('wCount').textContent = `${n}/300`; $('wCount').classList.toggle('warn', n > 270); });
  $('wallForm').addEventListener('focusin', () => { if (!memOpened) memOpened = Date.now(); }, { once:true });
  $('phAdd').addEventListener('click', () => $('phPick').click());
  $('phCam').addEventListener('click', () => $('phShot').click());
  $('phPick').addEventListener('change', e => { phAddFiles([...e.target.files]); e.target.value = ''; });
  $('phShot').addEventListener('change', e => { phAddFiles([...e.target.files]); e.target.value = ''; });
  $('phRep').addEventListener('change', async e => { const f = e.target.files[0]; e.target.value = ''; if (!f || memRepIdx < 0) return; const item = await phPrepare(f); if (item) { URL.revokeObjectURL(memPh[memRepIdx].url); memPh[memRepIdx] = item; phPaint(); } });
  $('phGrid').addEventListener('click', e => {
    const d = e.target.closest('[data-phdel]'), r = e.target.closest('[data-phrep]'), add = e.target.closest('[data-phadd]');
    if (d){ const k = +d.dataset.phdel; URL.revokeObjectURL(memPh[k].url); memPh.splice(k,1); phPaint(); }
    else if (r){ memRepIdx = +r.dataset.phrep; $('phRep').click(); }
    else if (add) $('phPick').click();
  });
  document.querySelectorAll('input[name=wmin]').forEach(x => x.addEventListener('change', () => $('tutorWrap').hidden = !document.querySelector('input[name=wmin][value=si]').checked));
  $('wallForm').addEventListener('submit', memSubmit);
  phPaint();
}
async function phPrepare(file){
  if (!(OK_TYPES.test(file.type) || OK_EXT.test(file.name))) { toast(`«${file.name}» no es una foto compatible (JPG, PNG, WEBP o HEIC).`); return null; }
  if (file.size > MAX_IN) { toast(`«${file.name}» pesa más de 15 MB.`); return null; }
  try { const blob = await compress(file); return { blob, url: URL.createObjectURL(blob), w: blob._w, h: blob._h }; }
  catch { toast(`No pudimos leer «${file.name}». Prueba con otra foto.`); return null; }
}
async function compress(file, maxSide = 1600, quality = .82){
  let src, w, h;
  try { src = await createImageBitmap(file, { imageOrientation:'from-image' }); w = src.width; h = src.height; }
  catch { src = await loadImg(URL.createObjectURL(file)); w = src.naturalWidth; h = src.naturalHeight; }
  const k = Math.min(1, maxSide / Math.max(w, h)), W = Math.round(w * k), H = Math.round(h * k);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0,0,W,H); x.drawImage(src, 0, 0, W, H);
  let q = quality, blob;
  do { blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', q)); q -= .1; } while (blob && blob.size > 1.8 * 1024 * 1024 && q > .4);
  if (!blob) throw new Error('compress');
  blob._w = W; blob._h = H; return blob;
}
async function phAddFiles(files){
  const room = MAX_PH - memPh.length;
  if (room <= 0) return toast('Ya tienes 5 fotos. Elimina o reemplaza alguna.');
  if (files.length > room) toast(`Solo se agregarán ${room} foto(s): el máximo es 5.`);
  $('phGrid').classList.add('busy');
  for (const f of files.slice(0, room)) { const it = await phPrepare(f); if (it) memPh.push(it); phPaint(); }
  $('phGrid').classList.remove('busy');
}
function phPaint(){
  const g = $('phGrid');
  g.innerHTML = memPh.map((p,k) => `<div class="ph-it"><img src="${esc(p.url)}" alt="Foto ${k+1}"><button type="button" class="ph-x" data-phdel="${k}" aria-label="Eliminar foto ${k+1}">✕</button><button type="button" class="ph-r" data-phrep="${k}" aria-label="Reemplazar foto ${k+1}"><svg><use href="#i-swap"/></svg></button></div>`).join('')
    + (memPh.length < MAX_PH ? `<button type="button" class="ph-add" data-phadd aria-label="Agregar fotos"><span>⊕</span>Agregar</button>` : '')
    + Array.from({length: Math.max(0, MAX_PH - memPh.length - 1)}, () => '<span class="ph-slot" aria-hidden="true"><svg><use href="#m-img"/></svg></span>').join('');
  $('phConsents').hidden = !memPh.length;
  $('phAdd').disabled = $('phCam').disabled = memPh.length >= MAX_PH;
}
async function memSubmit(e){
  e.preventDefault();
  if ($('whp').value) return;                                   // trampa antispam (campo oculto)
  if (memOpened && Date.now() - memOpened < 4000) return toast('Tómate un momento para escribir tu recuerdo 🙂');
  try { const last = +localStorage.getItem('quincho-mem-last') || 0; if (Date.now() - last < 60000) return toast('Ya enviaste un recuerdo hace un momento. Espera un minuto.'); } catch {}
  const nombre = $('wname').value.trim().replace(/\s+/g,' '), mensaje = $('wmessage').value.trim();
  if (!check([['wname', v => v.length >= 2], ['wmessage', v => v.length >= 5 && v.length <= 300]])) return toast('Completa tu nombre y tu experiencia (5 a 300 caracteres).');
  if (/(https?:\/\/|www\.)/i.test(mensaje)) return toast('Por seguridad, el mensaje no puede incluir enlaces.');
  if (!$('wconsent').checked) return toast('Debes autorizar la publicación del comentario.');
  const minors = document.querySelector('input[name=wmin]:checked');
  if (memPh.length){
    if (!$('wphotoOk').checked) return toast('Confirma la autorización de las personas que aparecen en las fotos.');
    if (!minors) return toast('Indica si aparecen menores de edad en las fotos.');
    if (minors.value === 'si' && !$('wtutor').checked) return toast('Se requiere la autorización del padre, madre o tutor para publicar fotos con menores.');
  }
  const huella = await sha(nombre.toLowerCase() + '|' + mensaje.toLowerCase().replace(/\s+/g,' '));
  const row = { nombre, mensaje, fecha_visita: $('wdate').value || null, categoria: $('wcat').value, consentimiento: true, aparecen_menores: !!minors && minors.value === 'si', consentimiento_tutor: $('wtutor').checked, huella };
  $('wSend').disabled = true; $('upProg').hidden = false; $('memOk').hidden = true;
  const prog = (n, tot, txt) => { const p = tot ? Math.round(n / tot * 100) : 100; $('upRing').style.setProperty('--p', p); $('upPct').textContent = p + '%'; $('upTxt').textContent = txt; };
  try {
    await sbReady;
    if (SB){
      const paths = [];
      for (let k = 0; k < memPh.length; k++){
        prog(k, memPh.length + 1, `Subiendo foto ${k+1} de ${memPh.length}…`);
        const path = `pendientes/${crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + k}.jpg`;
        const { error } = await SB.storage.from('recuerdos').upload(path, memPh[k].blob, { contentType:'image/jpeg', upsert:false });
        if (error) throw new Error('No se pudo subir una foto: ' + error.message);
        paths.push(path);
      }
      prog(memPh.length, memPh.length + 1, 'Guardando recuerdo…');
      const { error } = await SB.from('recuerdos').insert({ ...row, fotos: paths });
      if (error) throw new Error(/huella|duplicate/i.test(error.message) ? 'Este recuerdo ya fue enviado.' : error.message);
    } else {
      for (let k = 0; k <= memPh.length; k++){ prog(k, memPh.length || 1, 'Preparando…'); await new Promise(r => setTimeout(r, 150)); }
      if (memDemo.list.some(r => r.huella === huella)) throw new Error('Este recuerdo ya fue enviado.');
      memDemo.list.unshift({ ...row, id: 'd' + Date.now(), creado: new Date().toISOString(), fotos: memPh.map((_,k) => 'demo' + k), urls: memPh.map(p => p.url), estado:'pendiente', destacado:false, me_encanta:0 });
      memPh = memPh.map(p => ({ ...p, keep:true }));
    }
    prog(1, 1, '¡Listo!');
    try { localStorage.setItem('quincho-mem-last', Date.now()); } catch {}
    memPh.forEach(p => { if (!p.keep) URL.revokeObjectURL(p.url); }); memPh = [];
    $('wallForm').reset(); $('wCount').textContent = '0/300'; $('tutorWrap').hidden = true; $('wdate').dispatchEvent(new Event('input')); phPaint();
    $('upProg').hidden = true; $('memOk').hidden = false; $('memOk').scrollIntoView({behavior:'smooth', block:'center'});
    memBadge();
  } catch (err) {
    $('upProg').hidden = true; toast(err.message || 'No se pudo enviar. Inténtalo de nuevo.');
  } finally { $('wSend').disabled = false; memOpened = Date.now(); }
}

/* --- Administración: moderación y destacados --- */
let memAdmF = 'pendiente';
async function memAdminFetch(){
  if (SB && ADMIN){
    const { data, error } = await SB.from('recuerdos').select('*').order('creado',{ascending:false}).limit(200);
    if (error) throw error; return await signUrls(data);
  }
  return memDemo.list;
}
async function memBadge(){
  try { const L = await memAdminFetch(); const n = L.filter(r => r.estado === 'pendiente').length; $('memBadge').hidden = !n; $('memBadge').textContent = n; } catch {}
}
async function memAdmin(c){
  c.innerHTML = '<h3>Mural de visitantes</h3><div class="mem-skel"></div>';
  let L; try { L = await memAdminFetch(); } catch { c.innerHTML = '<h3>Mural de visitantes</h3><p class="mem-err">No se pudieron cargar los recuerdos.</p>'; return; }
  const cnt = k => L.filter(r => r.estado === k).length;
  const list = L.filter(r => r.estado === memAdmF);
  c.innerHTML = `<div class="rc-head">${ico('m-sparkle','pink','hmi')}<div><h3>Mural de visitantes</h3><p class="muted">Solo se publican los recuerdos aprobados. Revisa texto y fotos (y la autorización si aparecen menores).</p></div></div>
    <div class="filters" style="margin:6px 0 12px">${[['pendiente','🕒 Pendientes'],['aprobado','✅ Aprobados'],['rechazado','❌ Rechazados']].map(([k,v]) => `<button type="button" data-mf="${k}" aria-pressed="${k===memAdmF}">${v} (${cnt(k)})</button>`).join('')}</div>
    ${!SB ? '<p class="tiny mf-modo">Modo demostración: los recuerdos de esta lista existen solo en esta pestaña.</p>' : ''}
    <div class="madm">${list.length ? list.map(r => `<article class="madm-c">
        <div class="madm-ph">${(r.urls || []).map((u,k) => `<button type="button" data-zoom="${esc(u)}" aria-label="Ampliar foto ${k+1}"><img src="${esc(u)}" alt=""></button>`).join('') || '<span class="tiny">Sin fotos</span>'}</div>
        <div class="madm-b"><div class="mem-who"><span class="av t-${MCAT_T[r.categoria]||'pink'}">${esc((r.nombre[0]||'♥').toUpperCase())}</span><span><b>${esc(r.nombre)}</b><small>${esc(MCATS[r.categoria]||'')} · visita ${esc(fDate(r.fecha_visita) || 'sin fecha')} · enviado ${esc(fDate(r.creado))}</small></span></div>
          <p>${esc(r.mensaje)}</p>
          <div class="madm-tags">${r.aparecen_menores ? `<span class="pend">👶 Aparecen menores · ${r.consentimiento_tutor ? 'autorización del tutor ✔' : 'SIN autorización'}</span>` : ''}${(r.fotos||[]).length ? '<span class="pend">📷 Fotos autorizadas por el remitente</span>' : ''}${r.destacado ? '<span class="pend">⭐ Destacado en inicio</span>' : ''}${r.estado === 'aprobado' ? `<span class="pend">♥ ${r.me_encanta || 0}</span>` : ''}</div>
          <div class="madm-act">${r.estado !== 'aprobado' ? `<button class="mini" data-ma="aprobado" data-id="${r.id}">Aprobar</button>` : `<button class="mini" data-ma="destacar" data-id="${r.id}">${r.destacado ? 'Quitar destacado' : '⭐ Destacar'}</button>`}${r.estado !== 'rechazado' ? `<button class="mini danger" data-ma="rechazado" data-id="${r.id}">Rechazar</button>` : ''}<button class="mini danger" data-ma="borrar" data-id="${r.id}">Eliminar</button></div></div>
      </article>`).join('') : '<p class="muted">No hay recuerdos en esta lista.</p>'}</div>`;
  c.querySelectorAll('[data-mf]').forEach(b => b.onclick = () => { memAdmF = b.dataset.mf; memAdmin(c); });
  c.querySelectorAll('[data-zoom]').forEach(b => b.onclick = () => { $('vImg').src = b.dataset.zoom; $('vImg').alt = 'Foto del recuerdo'; $('vCap').textContent = ''; $('vPrev').hidden = $('vNext').hidden = true; openDlg($('viewer')); $('viewer').addEventListener('close', () => { $('vPrev').hidden = $('vNext').hidden = false; }, {once:true}); });
  c.querySelectorAll('[data-ma]').forEach(b => b.onclick = () => {
    const r = L.find(x => String(x.id) === b.dataset.id); if (!r) return; const act = b.dataset.ma;
    const run = async () => {
      let err = null; const wasDest = r.destacado;
      if (SB && ADMIN){
        if (act === 'borrar'){ if ((r.fotos||[]).length) await SB.storage.from('recuerdos').remove(r.fotos); ({ error: err } = await SB.from('recuerdos').delete().eq('id', r.id)); }
        else if (act === 'destacar') ({ error: err } = await SB.from('recuerdos').update({ destacado: !r.destacado }).eq('id', r.id));
        else ({ error: err } = await SB.from('recuerdos').update({ estado: act, revisado_por: ADMIN, destacado: act === 'aprobado' ? r.destacado : false }).eq('id', r.id));
      } else {
        if (act === 'borrar') memDemo.list.splice(memDemo.list.indexOf(r), 1);
        else if (act === 'destacar') r.destacado = !r.destacado;
        else { r.estado = act; if (act !== 'aprobado') r.destacado = false; }
      }
      toast(err ? 'No se pudo guardar: ' + err.message : ({aprobado:'Publicado en el mural ✔', rechazado:'Rechazado', borrar:'Eliminado', destacar: wasDest ? 'Ya no está destacado' : 'Destacado en inicio ⭐'})[act]);
      await memLoad(); memAdmin(c); memBadge();
    };
    if (act === 'borrar') confirmBox('¿Eliminar este recuerdo?', 'Se borrarán el texto y sus fotos de forma permanente.', run);
    else if (act === 'aprobado' && r.aparecen_menores && !r.consentimiento_tutor) toast('No se puede aprobar: aparecen menores sin autorización del tutor.');
    else run();
  });
}

/* ---------- Respaldo: Excel e historial con restauración ---------- */
let XLSXlib = null;
const loadXLSX = () => XLSXlib ? Promise.resolve(XLSXlib) : new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'; s.onload = () => res(XLSXlib = window.XLSX); s.onerror = () => rej(new Error('No se pudo cargar el generador de Excel.')); document.head.append(s); });
const fmtTS = t => t ? new Date(t).toLocaleString('es-CL', {dateStyle:'short', timeStyle:'short'}) : '';
const EST_TXT = { pendiente:'Pendiente', aceptada:'Aceptada', rechazada:'Rechazada', cotizada:'Cotizada' };
async function backupData(){
  if (!(SB && ADMIN)) throw new Error('El respaldo requiere la conexión a la base de datos.');
  const [s, f, h, pg] = await Promise.all([
    SB.from('solicitudes').select('*').order('fecha'),
    SB.from('fechas_bloqueadas').select('*').order('fecha'),
    SB.from('historial').select('*').order('cuando', {ascending:false}).limit(2000),
    SB.from('pagos').select('*').order('fecha')
  ]);
  if (s.error || f.error) throw new Error((s.error || f.error).message);
  return { sol: s.data, fechas: f.data, hist: h.error ? null : h.data, pagos: pg.error ? null : pg.data };
}
async function excelBackup(){
  const [X, B] = await Promise.all([loadXLSX(), backupData()]);
  const wb = X.utils.book_new();
  const add = (name, rows, cols) => { const ws = X.utils.json_to_sheet(rows.length ? rows : [{}]); ws['!cols'] = cols.map(w => ({wch:w})); X.utils.book_append_sheet(wb, ws, name); };
  const solRow = r => ({ 'Fecha reserva': r.fecha, 'Día': fmtDate(r.fecha), 'Tipo': r.tipo === 'evento' ? 'Cotización evento' : 'Reserva', 'Estado': EST_TXT[r.estado] || r.estado, 'Cliente': r.nombre, 'WhatsApp': r.telefono, 'Actividad': r.actividad || '', 'Personas': r.personas || '', 'Servicios': r.servicios || '', 'Observaciones': r.observaciones || '', 'Gestionado por': r.gestionado_por || '', 'Recibida': fmtTS(r.creado) });
  const cols = [12,30,16,11,28,16,22,9,26,34,14,16];
  if (B.pagos) { const pr = B.pagos.map(p => { const ab = sumAb(p); return { 'Fecha': p.fecha, 'Día': fmtDate(p.fecha), 'Cliente': p.cliente || '', 'Personas': p.personas || '', 'Incluye': p.incluye || '', 'Valor total': Number(p.total)||0, 'Abonado': ab, 'Saldo pendiente': Math.max(0, (Number(p.total)||0) - ab), 'Detalle abonos': (p.abonos||[]).map(x => `${x.fecha}: $${Number(x.monto).toLocaleString('es-CL')}${x.medio ? ' (' + x.medio + ')' : ''}`).join(' | '), 'Notas': p.notas || '' }; });
    const tt = pr.reduce((s,x) => s + x['Valor total'], 0), ta = pr.reduce((s,x) => s + x['Abonado'], 0); pr.push({}); pr.push({ 'Cliente': 'TOTALES', 'Valor total': tt, 'Abonado': ta, 'Saldo pendiente': pr.reduce((s,x) => s + (x['Saldo pendiente']||0), 0) });
    add('Pagos', pr, [12,30,30,9,34,14,14,15,50,34]); }
  add('Reservas aceptadas', B.sol.filter(r => r.estado === 'aceptada').map(solRow), cols);
  add('Todas las solicitudes', B.sol.map(solRow), cols);
  // Una hoja por mes con las fechas ocupadas
  const meses = {};
  B.fechas.forEach(x => { const k = x.fecha.slice(0,7); (meses[k] = meses[k] || []).push(x); });
  add('Fechas bloqueadas', B.fechas.map(x => { const r = B.sol.find(s => s.id === x.solicitud); return { 'Fecha': x.fecha, 'Día': fmtDate(x.fecha), 'Cliente': r ? r.nombre : '(bloqueada manualmente / agenda)', 'WhatsApp': r ? r.telefono : '', 'Actividad': r ? r.actividad || '' : '', 'Personas': r ? r.personas || '' : '', 'Bloqueada el': fmtTS(x.creado) }; }), [12,30,30,16,22,9,16]);
  Object.keys(meses).sort().forEach(k => { const [y,m] = k.split('-'); const nm = new Date(+y, +m-1, 1).toLocaleDateString('es-CL',{month:'long', year:'numeric'}); add(nm.charAt(0).toUpperCase() + nm.slice(1, 30), meses[k].map(x => { const r = B.sol.find(s => s.id === x.solicitud); return { 'Fecha': x.fecha, 'Día': fmtDate(x.fecha), 'Cliente': r ? r.nombre : '', 'WhatsApp': r ? r.telefono : '', 'Personas': r ? r.personas || '' : '' }; }), [12,30,28,16,9]); });
  if (B.hist) add('Historial de cambios', B.hist.map(x => { const d = x.datos || {}; return { 'Cuándo': fmtTS(x.cuando), 'Tabla': x.tabla === 'fechas_bloqueadas' ? 'Fechas' : 'Solicitudes', 'Acción': ({INSERT:'Creó', UPDATE:'Modificó', DELETE:'BORRÓ'})[x.accion] || x.accion, 'Quién': x.quien || '', 'Fecha': d.fecha || '', 'Cliente': d.nombre || '', 'Estado': EST_TXT[d.estado] || d.estado || '', 'Estado anterior': x.antes ? (EST_TXT[x.antes.estado] || x.antes.estado || '') : '' }; }), [16,11,10,26,12,26,12,14]);
  const name = `Respaldo-Quincho-${iso(new Date())}.xlsx`;
  const out = X.write(wb, { bookType:'xlsx', type:'array' });
  const blob = new Blob([out], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  return { blob, name };
}
async function shareOrDownload({ blob, name }){
  const file = new File([blob], name, { type: blob.type });
  if (navigator.canShare && navigator.canShare({ files:[file] })) { try { await navigator.share({ files:[file], title: name }); return 'shared'; } catch (e) { if (e && e.name === 'AbortError') return 'cancel'; } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  return 'downloaded';
}
async function backupAdmin(c){
  c.innerHTML = `<div class="rc-head">${ico('m-star','teal','hmi')}<div><h3>Respaldo</h3><p class="muted">Cada reserva, cambio y borrado queda registrado en un historial que no se puede borrar.</p></div></div>`;
  if (!(SB && ADMIN)) { c.innerHTML += '<p class="mem-err">El respaldo funciona con la base de datos conectada. Entra desde la página publicada en GitHub.</p>'; return; }
  c.innerHTML += `<div class="bk-actions"><button type="button" class="btn2 primary full" id="bkXls"><svg><use href="#m-img"/></svg>Descargar Excel de respaldo</button>
    <p class="tiny">Incluye: reservas aceptadas, todas las solicitudes, fechas bloqueadas, una hoja por mes y el historial de cambios. En el teléfono puedes compartirlo directo por correo o WhatsApp.</p></div>
    <div class="sec-title"><h2>Borrados recientes</h2></div><div id="bkDel"><div class="mem-skel"></div></div>
    <div class="sec-title"><h2>Últimos movimientos</h2></div><div id="bkLog"></div>`;
  $('bkXls').onclick = async () => { const b = $('bkXls'); b.disabled = true; b.lastChild.textContent = 'Generando Excel…';
    try { const r = await shareOrDownload(await excelBackup()); if (r !== 'cancel') toast(r === 'shared' ? 'Excel listo para enviar ✔' : 'Excel descargado ✔'); }
    catch (e) { toast(e.message || 'No se pudo generar el Excel.'); }
    b.disabled = false; b.lastChild.textContent = 'Descargar Excel de respaldo'; };
  const { data: H, error } = await SB.from('historial').select('*').order('cuando', {ascending:false}).limit(150);
  if (error) { $('bkDel').innerHTML = `<p class="mem-err">${/historial/.test(error.message) ? 'Falta ejecutar el script de respaldo (supabase_respaldo.sql) en Supabase.' : 'No se pudo cargar el historial.'}</p>`; return; }
  const dels = H.filter(x => x.accion === 'DELETE');
  $('bkDel').innerHTML = dels.length ? dels.slice(0, 30).map(x => { const d = x.datos || {}, fe = x.tabla === 'fechas_bloqueadas';
      return `<div class="adminRow bkrow"><div><b>${fe ? '📅 Fecha desbloqueada' : '🗑 Solicitud eliminada'}: ${esc(fmtDate(d.fecha || ''))}</b><p class="tiny">${fe ? '' : esc(d.nombre || '') + ' · ' + esc(EST_TXT[d.estado] || d.estado || '') + ' · '}por ${esc(x.quien || '')} · ${esc(fmtTS(x.cuando))}</p></div><button class="mini" data-rest="${x.id}">↩ Restaurar</button></div>`; }).join('')
    : '<p class="muted">No hay borrados. Todo en orden ✔</p>';
  $('bkLog').innerHTML = H.slice(0, 25).map(x => { const d = x.datos || {}; return `<div class="bklog"><span class="bkdot ${x.accion}"></span><span><b>${({INSERT:'Nuevo', UPDATE:'Cambio', DELETE:'Borrado'})[x.accion]}</b> · ${x.tabla === 'fechas_bloqueadas' ? 'fecha' : 'solicitud'} ${esc(d.fecha || '')} ${d.nombre ? '· ' + esc(d.nombre) : ''}${x.accion === 'UPDATE' && x.antes ? ' · ' + esc(EST_TXT[x.antes.estado] || '') + ' → ' + esc(EST_TXT[d.estado] || '') : ''}<small>${esc(x.quien || '')} · ${esc(fmtTS(x.cuando))}</small></span></div>`; }).join('');
  c.querySelectorAll('[data-rest]').forEach(b => b.onclick = () => { const x = H.find(y => String(y.id) === b.dataset.rest); if (!x) return; const d = x.datos;
    confirmBox('¿Restaurar?', x.tabla === 'fechas_bloqueadas' ? `Se volverá a bloquear el ${fmtDate(d.fecha)}.` : `Se recuperará la solicitud de ${d.nombre} del ${fmtDate(d.fecha)}.`, async () => {
      let err;
      if (x.tabla === 'fechas_bloqueadas') { ({ error: err } = await SB.from('fechas_bloqueadas').upsert({ fecha: d.fecha, solicitud: d.solicitud || null })); if (!err) { RESERVADAS.add(d.fecha); calendar(); homeCal(); } }
      else ({ error: err } = await SB.from('solicitudes').upsert(d));
      toast(err ? 'No se pudo restaurar: ' + err.message : 'Restaurado ✔'); backupAdmin(c);
    }); });
}


/* =====================================================================
   Panel de administración (dashboard móvil)
   ===================================================================== */
const ADM = { sol: [], fechas: [], loaded: 0 };
const isMobileUA = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
async function admLoad(force){
  if (!(SB && ADMIN)) { ADM.sol = db.requests.map(r => ({ id:String(r.id), nombre:r.name, fecha:r.date, actividad:r.detail, personas:r.count, telefono:r.phone, estado:({Pendiente:'pendiente', Confirmado:'aceptada', Rechazado:'rechazada', Cotizado:'cotizada'})[r.status] || 'pendiente', creado:new Date(r.id).toISOString(), tipo:r.kind === 'Evento' ? 'evento' : 'reserva', observaciones:r.note, local:true })); ADM.fechas = Object.entries(db.days).filter(([,s]) => s === 'booked').map(([f]) => ({ fecha:f })); return ADM; }
  if (!force && Date.now() - ADM.loaded < 4000) return ADM;
  const [s, f, pg] = await Promise.all([ SB.from('solicitudes').select('*').order('creado', {ascending:false}).limit(500), SB.from('fechas_bloqueadas').select('*').order('fecha'), SB.from('pagos').select('*').order('fecha') ]);
  if (s.error) throw s.error; if (f.error) throw f.error;
  ADM.sol = s.data; ADM.fechas = f.data; ADM.pagos = pg.error ? null : pg.data; ADM.pagosErr = pg.error ? pg.error.message : ''; ADM.loaded = Date.now();
  f.data.forEach(x => RESERVADAS.add(x.fecha));
  const n = s.data.filter(r => r.estado === 'pendiente').length; $('reqBadge').hidden = !n; $('reqBadge').textContent = n;
  return ADM;
}
const actFoto = t => { t = (t || '').toLowerCase(); return /cumple/.test(t) ? 'assets/cumple-almuerzo.jpg' : /curso|colegio|jard/.test(t) ? 'assets/juegos-piscina.jpg' : /empresa|privad|instituc/.test(t) ? 'assets/salon-montaje.jpg' : /matrimon|boda/.test(t) ? 'assets/matrimonio-entrada.jpg' : /gradua|gala/.test(t) ? 'assets/graduacion-baile.jpg' : /famil|piscina/.test(t) ? 'assets/piscina.jpg' : 'assets/evento-noche.jpg'; };
const EST = { pendiente:['Pendiente','pk'], aceptada:['Confirmada','gr'], rechazada:['Rechazada','gy'], cotizada:['Cotizada','bl'] };
const fShortD = f => { const [y,m,d] = f.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('es-CL',{weekday:'short', day:'numeric', month:'short', year:'numeric'}); };
const waNum = t => 'https://wa.me/' + String(t || '').replace(/\D/g,'');
function reqCard(r){
  const [et, ec] = EST[r.estado] || [r.estado, 'gy'];
  return `<article class="rq" data-rid="${esc(r.id)}">
    <img class="rq-ph" src="${actFoto(r.actividad + ' ' + r.tipo)}" alt="" loading="lazy">
    <div class="rq-b">
      <div class="rq-top"><b>${esc(r.actividad || (r.tipo === 'evento' ? 'Evento' : 'Reserva'))}</b><span class="st ${ec}">${et}</span></div>
      <p class="rq-m"><svg><use href="#m-cal"/></svg>${esc(fShortD(r.fecha))}${r.personas ? ` · ${esc(r.personas)} personas` : ''}</p>
      <p class="rq-c">${esc(r.nombre)}</p>
      <div class="rq-act">
        ${r.estado !== 'aceptada' ? `<button type="button" class="ra ok" data-ra="aceptada"><svg><use href="#i-check"/></svg>Aceptar</button>` : ''}
        ${r.estado === 'pendiente' ? `<button type="button" class="ra no" data-ra="rechazada">✕ Rechazar</button><button type="button" class="ra bl" data-ra="cotizada">Cotizada</button>` : ''}
        ${r.telefono && !r.local ? `<a class="ra wa" href="${esc(waNum(r.telefono))}" target="_blank" rel="noopener"><svg><use href="#m-wa"/></svg>WhatsApp</a>` : ''}
        <button type="button" class="ra more" data-ra="detalle" aria-label="Ver detalles">›</button>
      </div>
    </div></article>`;
}
async function reqAction(rid, act, after){
  const r = ADM.sol.find(x => String(x.id) === String(rid)); if (!r) return;
  if (act === 'detalle') return reqDetail(r, after);
  if (r.local){ const L = db.requests.find(x => String(x.id) === rid); if (L){ L.status = ({aceptada:'Confirmado', rechazada:'Rechazado', cotizada:'Cotizado'})[act]; if (act === 'aceptada') db.days[L.date] = 'booked'; save(); calendar(); } toast('Guardado en este navegador'); return after(); }
  const run = async () => {
    if (act === 'aceptada'){
      const { data: ocup } = await SB.from('fechas_bloqueadas').select('fecha,solicitud').eq('fecha', r.fecha);
      const otra = ADM.sol.find(x => x.id !== r.id && x.fecha === r.fecha && x.estado === 'aceptada');
      if ((ocup && ocup.length && ocup[0].solicitud !== r.id) || otra) return modal({ title:'Fecha ocupada', text:`El ${fmtDate(r.fecha)} ya tiene una reserva${otra ? ' confirmada de ' + otra.nombre : ' o está bloqueado'}. No se puede aceptar otra para el mismo día. Si corresponde, desbloquea la fecha primero en Calendario.`, actions:[{label:'Entendido', cls:'pink'}] });
    }
    let { error } = await SB.from('solicitudes').update({ estado: act, gestionado_por: ADMIN }).eq('id', r.id);
    if (!error && act === 'aceptada'){ const x = await SB.from('fechas_bloqueadas').upsert({ fecha: r.fecha, solicitud: r.id }); error = x.error; if (!error) { RESERVADAS.add(r.fecha); calendar(); homeCal(); } }
    if (!error && act === 'aceptada') await SB.from('pagos').upsert({ fecha: r.fecha, cliente: r.nombre, telefono: r.telefono, personas: r.personas || 0, incluye: [r.actividad, r.servicios].filter(Boolean).join(' · ') || null, solicitud: r.id, actualizado_por: ADMIN }, { onConflict:'fecha', ignoreDuplicates:true });
    toast(error ? 'No se pudo guardar: ' + error.message : ({aceptada:'Aceptada: la fecha quedó bloqueada ✔', rechazada:'Solicitud rechazada', cotizada:'Marcada como cotizada'})[act]);
    await admLoad(true); after();
    if (!error && act === 'aceptada') setTimeout(() => modal({ title:'Reserva aceptada ✔', text:`${r.nombre} · ${fmtDate(r.fecha)}. ¿Quieres guardar ahora el Excel de respaldo actualizado?`,
      actions:[ {label:'Ahora no'}, {label:'Guardar Excel', cls:'pink', onClick: async () => { try { const x = await shareOrDownload(await excelBackup()); if (x !== 'cancel') toast('Respaldo guardado ✔'); } catch (e2) { toast(e2.message); } }} ] }), 400);
  };
  if (act === 'aceptada') confirmBox('¿Aceptar la solicitud?', `Se bloqueará el ${fmtDate(r.fecha)} para ${r.nombre}.`, run);
  else if (act === 'rechazada') confirmBox('¿Rechazar la solicitud?', `${r.nombre} · ${fmtDate(r.fecha)}. Recuerda avisarle por WhatsApp.`, run);
  else run();
}
function reqDetail(r, after){
  const [et, ec] = EST[r.estado] || [r.estado, 'gy'];
  $('adDayBody').innerHTML = `<h3 id="adTitle">${esc(r.nombre)}</h3><span class="st ${ec}">${et}</span>
    <dl class="rz-sum" style="margin-top:12px"><dt>📅 Fecha</dt><dd>${esc(fmtDate(r.fecha))}</dd><dt>🎉 Actividad</dt><dd>${esc(r.actividad || '—')}</dd><dt>👥 Personas</dt><dd>${esc(r.personas || '—')}</dd>
    <dt>📱 WhatsApp</dt><dd>${esc(r.telefono || '—')}</dd>${r.servicios ? `<dt>✨ Servicios</dt><dd>${esc(r.servicios)}</dd>` : ''}${r.observaciones ? `<dt>💬 Notas</dt><dd>${esc(r.observaciones)}</dd>` : ''}
    <dt>🕒 Recibida</dt><dd>${esc(fmtTS(r.creado))}</dd>${r.gestionado_por ? `<dt>👤 Gestionó</dt><dd>${esc(r.gestionado_por)}</dd>` : ''}</dl>
    <div class="rq-act" style="margin-top:14px">${r.estado === 'aceptada' ? `<button type="button" class="ra ok" data-rcp="${esc(r.id)}">🧾 Comprobante</button>` : ''}${r.telefono && !r.local ? `<a class="ra wa" href="${esc(waNum(r.telefono))}" target="_blank" rel="noopener"><svg><use href="#m-wa"/></svg>WhatsApp</a>` : ''}${!r.local ? `<button type="button" class="ra no" data-rdel="${esc(r.id)}">Eliminar</button>` : ''}</div>`;
  openDlg($('admDay'));
  const cp = $('adDayBody').querySelector('[data-rcp]'); if (cp) cp.onclick = () => { closeDlg($('admDay')); prefillReceipt(normReq(r)); };
  const dl = $('adDayBody').querySelector('[data-rdel]'); if (dl) dl.onclick = () => { closeDlg($('admDay')); confirmBox('¿Eliminar la solicitud?', 'Quedará registrada en Respaldo y se puede restaurar.', async () => { const { error } = await SB.from('solicitudes').delete().eq('id', r.id); toast(error ? 'No se pudo: ' + error.message : 'Eliminada (recuperable en Respaldo)'); await admLoad(true); after(); }); };
}
function bindReq(root, after){ root.querySelectorAll('[data-ra]').forEach(b => b.onclick = () => reqAction(b.closest('[data-rid]').dataset.rid, b.dataset.ra, after)); }
const admErr = (c, e) => { c.innerHTML = `<p class="mem-err">No se pudieron cargar los datos. Revisa tu conexión e inténtalo de nuevo.<br><small>${esc(e && e.message || '')}</small></p><button class="btn2 ghost" type="button" onclick="location.reload()">Reintentar</button>`; };

/* --- Inicio --- */
async function adminHome(c){
  c.innerHTML = '<div class="kpis">' + '<div class="kpi skel"></div>'.repeat(4) + '</div>';
  let A; try { A = await admLoad(); } catch (e) { return admErr(c, e); }
  const hoy = iso(today), mes = hoy.slice(0,7), en30 = iso(new Date(today.getTime() + 30*864e5));
  const pend = A.sol.filter(r => r.estado === 'pendiente').length;
  const conf = A.sol.filter(r => r.estado === 'aceptada' && r.fecha >= hoy).length;
  const prox = A.fechas.filter(x => x.fecha >= hoy && x.fecha <= en30).length;
  const delMes = A.fechas.filter(x => x.fecha.slice(0,7) === mes).length;
  const K = (n, l, s, ico, cls, go) => `<button type="button" class="kpi ${cls}" data-tab="${go}"><span class="k-top"><svg class="ai2"><use href="#${ico}"/></svg><span class="k-go">›</span></span><b>${n}</b><span class="k-l">${l}</span><small>${s}</small></button>`;
  const T = (go, ico, l, badge) => `<button type="button" class="tile2" data-${go.startsWith('#') ? 'x' : 'tab'}="${go}"><span class="tw"><img src="assets/adm/${ico}.svg" alt="">${badge ? `<b class="nbadge">${badge}</b>` : ''}</span><span>${l}</span></button>`;
  const rec = A.sol.filter(r => r.estado === 'pendiente' || r.estado === 'cotizada').slice(0, 3);
  const nextF = A.fechas.filter(x => x.fecha >= hoy).slice(0, 4);
  const mon = f => { const [y,m,d] = f.split('-').map(Number); const dt = new Date(y,m-1,d); return `<b>${String(d).padStart(2,'0')}</b><span>${dt.toLocaleDateString('es-CL',{month:'short'}).replace('.','').toUpperCase()}</span><small>${y}</small>`; };
  c.innerHTML = `<div class="kpis">
      ${K(pend, 'Solicitudes', 'pendientes', 'a-req', 'k-pk', 'requests')}
      ${K(conf, 'Reservas', 'confirmadas próximas', 'a-ok', 'k-gr', 'requests" data-rf0="aceptada')}
      ${K(prox, 'Próximos eventos', 'en los próximos 30 días', 'm-cal', 'k-bl', 'cal')}
      ${K(delMes, 'Total', 'reservas este mes', 'm-users', 'k-yl', 'cal')}
    </div>
    ${pagosCard(A)}
    <section class="adm-card"><div class="tiles2">
      ${T('requests','solicitudes','Solicitudes', pend)}${T('cal','calendario','Calendario')}${T('plans','planes_precios','Planes y precios')}${T('memories','fotos_mural','Fotos y mural')}
      ${T('receipt','comprobantes','Comprobantes')}${T('backup','respaldo','Respaldo')}${T('pending','datos_pendientes','Datos pendientes')}${T('config','configuracion','Configuración')}
    </div></section>
    <section class="adm-card"><div class="ac-h"><h3>Solicitudes recientes</h3><button type="button" class="lnk" data-tab="requests">Ver todas</button></div>
      <div class="rqs" id="homeReq">${rec.length ? rec.map(reqCard).join('') : '<p class="muted ac-empty">No hay solicitudes pendientes 🎉</p>'}</div></section>
    <section class="adm-card"><div class="ac-h"><h3>Fechas bloqueadas</h3><button type="button" class="chip-btn" data-tab="cal">+ Bloquear fecha</button></div>
      <div class="fchips">${nextF.map(x => `<button type="button" class="fchip" data-day="${x.fecha}" aria-label="${esc(fmtDate(x.fecha))}">${mon(x.fecha)}<i aria-hidden="true">🔒</i></button>`).join('')}<button type="button" class="fchip add" data-tab="cal"><span>＋</span>Agregar</button></div></section>`;
  bindReq(c, () => adminHome(c));
  c.querySelectorAll('[data-day]').forEach(b => b.onclick = () => dayDetail(b.dataset.day, () => adminHome(c)));
  memBadge();
}

/* --- Solicitudes --- */
let reqF = 'pendiente';
async function sbRequests(c){
  c.innerHTML = '<div class="mem-skel"></div><div class="mem-skel"></div>';
  let A; try { A = await admLoad(); } catch (e) { return admErr(c, e); }
  const cnt = k => A.sol.filter(r => k === 'todas' || r.estado === k).length;
  const list = A.sol.filter(r => reqF === 'todas' || r.estado === reqF).sort((a,b) => reqF === 'pendiente' ? a.fecha.localeCompare(b.fecha) : 0);
  c.innerHTML = `<div class="ac-h"><h3 class="pg-t">Solicitudes</h3></div>
    <div class="segs" role="tablist">${[['pendiente','Pendientes'],['cotizada','Cotizadas'],['aceptada','Confirmadas'],['rechazada','Rechazadas'],['todas','Todas']].map(([k,v]) => `<button type="button" data-rf="${k}" aria-pressed="${k===reqF}">${v}<b>${cnt(k)}</b></button>`).join('')}</div>
    <div class="rqs">${list.length ? list.map(reqCard).join('') : '<p class="muted ac-empty">No hay solicitudes en esta lista.</p>'}</div>`;
  c.querySelectorAll('[data-rf]').forEach(b => b.onclick = () => { reqF = b.dataset.rf; sbRequests(c); });
  bindReq(c, () => sbRequests(c));
}

/* --- Calendario --- */
let admShown = new Date(today.getFullYear(), today.getMonth(), 1);
function dayState(k){
  const f = ADM.fechas.find(x => x.fecha === k), conf = ADM.sol.find(r => r.fecha === k && r.estado === 'aceptada');
  const pend = ADM.sol.filter(r => r.fecha === k && (r.estado === 'pendiente' || r.estado === 'cotizada'));
  if (conf || (f && f.solicitud)) return { s:'conf', f, conf: conf || ADM.sol.find(r => r.id === (f && f.solicitud)), pend };
  if (f) return { s:'blk', f, pend };
  if (pend.length) return { s:'pend', pend };
  return { s:'free', pend:[] };
}
async function adminCal(c){
  c.innerHTML = '<div class="mem-skel" style="height:360px"></div>';
  try { await admLoad(); } catch (e) { return admErr(c, e); }
  const m = admShown.toLocaleDateString('es-CL',{month:'long', year:'numeric'});
  const start = (admShown.getDay()+6)%7, days = new Date(admShown.getFullYear(), admShown.getMonth()+1, 0).getDate();
  let cells = '<span></span>'.repeat(start);
  for (let n = 1; n <= days; n++){ const d = new Date(admShown.getFullYear(), admShown.getMonth(), n), k = iso(d), st = dayState(k);
    cells += `<button type="button" class="ad ${st.s}${+d === +today ? ' today' : ''}${d < today ? ' past' : ''}" data-day="${k}" aria-label="${esc(fmtDate(k))}: ${({free:'disponible', blk:'bloqueada', pend:'solicitud pendiente', conf:'reserva confirmada'})[st.s]}">${n}${st.pend.length && st.s !== 'pend' ? '<i></i>' : ''}</button>`; }
  c.innerHTML = `<div class="ac-h"><h3 class="pg-t">Calendario</h3></div>
    <section class="adm-card"><div class="cal-head"><button type="button" class="icon-btn" id="acPrev" aria-label="Mes anterior">‹</button><strong>${m.charAt(0).toUpperCase() + m.slice(1)}</strong><button type="button" class="icon-btn" id="acNext" aria-label="Mes siguiente">›</button></div>
      <div class="weekdays" aria-hidden="true"><span>Lu</span><span>Ma</span><span>Mi</span><span>Ju</span><span>Vi</span><span>Sá</span><span>Do</span></div>
      <div class="adcal">${cells}</div>
      <div class="adleg"><span><i class="free"></i>Disponible</span><span><i class="blk"></i>Bloqueada</span><span><i class="pend"></i>Solicitud pendiente</span><span><i class="conf"></i>Reserva confirmada</span></div>
      <p class="tiny">Toca un día para ver el detalle, bloquearlo o desbloquearlo.</p></section>`;
  $('acPrev').onclick = () => { admShown.setMonth(admShown.getMonth()-1); adminCal(c); };
  $('acNext').onclick = () => { admShown.setMonth(admShown.getMonth()+1); adminCal(c); };
  c.querySelectorAll('[data-day]').forEach(b => b.onclick = () => dayDetail(b.dataset.day, () => adminCal(c)));
}
function dayDetail(k, after){
  const st = dayState(k), lbl = ({free:['Disponible','gr'], blk:['Bloqueada','gy'], pend:['Solicitud pendiente','pk'], conf:['Reserva confirmada','bl']})[st.s];
  const past = k < iso(today);
  $('adDayBody').innerHTML = `<h3 id="adTitle">${esc(fmtDate(k))}</h3><span class="st ${lbl[1]}">${lbl[0]}</span>
    ${st.conf ? `<div class="dd-box"><b>${esc(st.conf.nombre)}</b><span>${esc(st.conf.actividad || '')}${st.conf.personas ? ' · ' + esc(st.conf.personas) + ' personas' : ''}</span>${st.conf.telefono ? `<a class="ra wa" href="${esc(waNum(st.conf.telefono))}" target="_blank" rel="noopener"><svg><use href="#m-wa"/></svg>WhatsApp</a>` : ''}</div>` : ''}
    ${st.s === 'blk' ? `<div class="dd-box"><b>Motivo</b><span>${esc((st.f && st.f.motivo) || 'Reserva registrada en la agenda')}</span></div>` : ''}
    ${st.pend.length ? `<h4 class="dd-h">Solicitudes para este día</h4><div class="rqs">${st.pend.map(reqCard).join('')}</div>` : ''}
    ${st.s === 'free' && !past ? `<label class="dd-mot">Motivo del bloqueo (opcional)<input id="ddMot" maxlength="120" placeholder="Ej: mantención, evento propio, reserva por teléfono"></label><button type="button" class="btn2 primary full" id="ddBlock"><svg><use href="#m-cal"/></svg>Bloquear fecha</button>` : ''}
    ${(st.s === 'blk' || st.s === 'conf') && !past ? `<button type="button" class="btn2 ghost full" id="ddUnblock">Desbloquear fecha</button>` : ''}`;
  openDlg($('admDay'));
  bindReq($('adDayBody'), () => { closeDlg($('admDay')); after(); });
  const b1 = $('ddBlock'); if (b1) b1.onclick = () => { const mot = $('ddMot').value.trim(); closeDlg($('admDay'));
    confirmBox('¿Bloquear esta fecha?', `${fmtDate(k)} aparecerá como reservada en la página.`, async () => {
      let { error } = await SB.from('fechas_bloqueadas').upsert(mot ? { fecha:k, motivo:mot } : { fecha:k });
      if (error && /motivo/i.test(error.message)) { ({ error } = await SB.from('fechas_bloqueadas').upsert({ fecha:k })); if (!error) toast('Bloqueada. Para guardar el motivo, ejecuta supabase_admin.sql.'); }
      else toast(error ? 'No se pudo: ' + error.message : 'Fecha bloqueada ✔');
      if (!error) { RESERVADAS.add(k); calendar(); homeCal(); } await admLoad(true); after(); }); };
  const b2 = $('ddUnblock'); if (b2) b2.onclick = () => { closeDlg($('admDay'));
    confirmBox('¿Desbloquear esta fecha?', `${fmtDate(k)} volverá a aparecer disponible${st.conf ? '. La reserva de ' + st.conf.nombre + ' seguirá registrada como confirmada' : ''}. Queda registrado en Respaldo.`, async () => {
      const { error } = await SB.from('fechas_bloqueadas').delete().eq('fecha', k);
      if (!error) { RESERVADAS.delete(k); calendar(); homeCal(); } toast(error ? 'No se pudo: ' + error.message : 'Fecha desbloqueada (recuperable en Respaldo)'); await admLoad(true); after(); }); };
}


/* --- Pagos --- */
const sumAb = p => (p.abonos || []).reduce((s,x) => s + (Number(x.monto)||0), 0);
function pagosRows(A){
  const byF = new Map((A.pagos || []).map(p => [p.fecha, { ...p, _reg:true }]));
  A.fechas.forEach(f => { if (!byF.has(f.fecha)) { const s = A.sol.find(x => x.id === f.solicitud); byF.set(f.fecha, { fecha:f.fecha, cliente: s ? s.nombre : '', telefono: s ? s.telefono : '', personas: s ? s.personas : 0, incluye: s ? s.actividad : '', total:0, abonos:[], solicitud: f.solicitud || null, _reg:false }); } });
  return [...byF.values()].sort((a,b) => a.fecha.localeCompare(b.fecha));
}
function pagosTotals(rows){ const t = rows.reduce((s,p) => s + (Number(p.total)||0), 0), ab = rows.reduce((s,p) => s + sumAb(p), 0); return { t, ab, falta: Math.max(0, rows.reduce((s,p) => s + Math.max(0, (Number(p.total)||0) - sumAb(p)), 0)), sinMonto: rows.filter(p => !Number(p.total)).length, conSaldo: rows.filter(p => Number(p.total) && sumAb(p) < Number(p.total)).length }; }
const money = n => clp(n) || '$0';
function pagosCard(A){
  if (!(SB && ADMIN)) return '';
  if (!A.pagos) return `<section class="adm-card pg-card"><div class="ac-h"><h3>Resumen de pagos</h3></div><p class="tiny">${/pagos/.test(A.pagosErr) ? 'Falta ejecutar <b>supabase_pagos.sql</b> en Supabase para activar los pagos.' : 'No se pudieron cargar los pagos.'}</p></section>`;
  const T = pagosTotals(pagosRows(A).filter(p => p.fecha >= iso(today))), pct = T.t ? Math.round(T.ab / T.t * 100) : 0;
  return `<section class="adm-card pg-card" data-tab="pagos" role="button" tabindex="0"><div class="ac-h"><h3>Resumen de pagos</h3><span class="lnk">Ver detalle ›</span></div>
    <div class="pg-sum"><div><small>Total reservas próximas</small><b>${money(T.t)}</b></div><div class="ok"><small>Recibido</small><b>${money(T.ab)}</b></div><div class="due"><small>Por recibir</small><b>${money(T.falta)}</b></div></div>
    <div class="bar"><i style="width:${pct}%"></i></div><p class="tiny" style="margin:6px 0 0">${pct}% recibido · ${T.conSaldo} reserva(s) con saldo${T.sinMonto ? ` · ${T.sinMonto} sin monto registrado` : ''}</p></section>`;
}
let pagF = 'prox';
async function adminPagos(c){
  c.innerHTML = '<div class="mem-skel"></div>';
  if (!(SB && ADMIN)) { c.innerHTML = '<p class="mem-err">Los pagos requieren la conexión a la base de datos.</p>'; return; }
  let A; try { A = await admLoad(true); } catch (e) { return admErr(c, e); }
  if (!A.pagos) { c.innerHTML = `<div class="ac-h"><h3 class="pg-t">Pagos</h3></div><p class="mem-err">${/pagos/.test(A.pagosErr) ? 'Falta ejecutar supabase_pagos.sql en Supabase (SQL Editor → Run).' : 'No se pudieron cargar los pagos: ' + esc(A.pagosErr)}</p>`; return; }
  const all = pagosRows(A), hoy = iso(today);
  const F = { prox: p => p.fecha >= hoy, saldo: p => Number(p.total) && sumAb(p) < Number(p.total), pagadas: p => Number(p.total) && sumAb(p) >= Number(p.total), sin: p => !Number(p.total), todas: () => true };
  const scope = pagF === 'todas' ? all : all.filter(p => pagF === 'prox' ? F.prox(p) : F.prox(p) && F[pagF](p));
  const T = pagosTotals(scope), pct = T.t ? Math.round(T.ab / T.t * 100) : 0;
  c.innerHTML = `<div class="ac-h"><h3 class="pg-t">Pagos</h3></div>
    <section class="adm-card"><div class="pg-sum big"><div><small>Total en reservas</small><b>${money(T.t)}</b></div><div class="ok"><small>He recibido</small><b>${money(T.ab)}</b></div><div class="due"><small>Me falta por recibir</small><b>${money(T.falta)}</b></div></div>
      <div class="bar"><i style="width:${pct}%"></i></div><p class="tiny" style="margin:6px 0 0">${pct}% recibido · ${scope.length} reserva(s)${T.sinMonto ? ` · ${T.sinMonto} sin monto` : ''}${pagF === 'todas' ? ' · incluye reservas pasadas' : ''}</p></section>
    <div class="segs">${[['prox','Próximas'],['saldo','Con saldo'],['pagadas','Pagadas'],['sin','Sin monto'],['todas','Todas']].map(([k,v]) => `<button type="button" data-pf="${k}" aria-pressed="${k===pagF}">${v}<b>${(k==='todas' ? all : all.filter(p => k==='prox' ? F.prox(p) : F.prox(p) && F[k](p))).length}</b></button>`).join('')}</div>
    <div class="pgl">${scope.length ? scope.map(p => { const ab = sumAb(p), t = Number(p.total)||0, fal = Math.max(0, t - ab), pc = t ? Math.min(100, Math.round(ab/t*100)) : 0;
      return `<button type="button" class="pgi${fal === 0 && t ? ' done' : ''}" data-pg="${p.fecha}">
        <span class="pgi-d">${mDay(p.fecha)}</span>
        <span class="pgi-b"><b>${esc(p.cliente || 'Sin nombre')}</b><small>${p.personas ? esc(p.personas) + ' pers. · ' : ''}${esc(p.incluye || (p._reg ? '' : 'Sin datos de pago'))}</small>
          <span class="bar sm"><i style="width:${pc}%"></i></span>
          <span class="pgi-n"><span>Total <b>${t ? money(t) : '—'}</b></span><span class="ok">Abonado <b>${money(ab)}</b></span><span class="due">Falta <b>${t ? money(fal) : '—'}</b></span></span></span>
      </button>`; }).join('') : '<p class="muted ac-empty">No hay reservas en esta lista.</p>'}</div>`;
  c.querySelectorAll('[data-pf]').forEach(b => b.onclick = () => { pagF = b.dataset.pf; adminPagos(c); });
  c.querySelectorAll('[data-pg]').forEach(b => b.onclick = () => pagoEdit(all.find(p => p.fecha === b.dataset.pg), () => adminPagos(c)));
}
const mDay = f => { const [y,m,d] = f.split('-').map(Number); const dt = new Date(y,m-1,d); return `<b>${String(d).padStart(2,'0')}</b><span>${dt.toLocaleDateString('es-CL',{month:'short'}).replace('.','').toUpperCase()}</span><small>${y}</small>`; };
function pagoEdit(p, after){
  const P = { ...p, abonos: (p.abonos || []).map(x => ({...x})) };
  const body = $('adDayBody');
  const draw = () => {
    const ab = sumAb(P), t = Number(P.total)||0;
    body.innerHTML = `<h3 id="adTitle">Pagos · ${esc(fmtDate(P.fecha))}</h3>
      <div class="form rform pg-form">
        <label>Cliente<input id="pgC" maxlength="120" value="${esc(P.cliente || '')}"></label>
        <div class="row2"><label>Personas<input id="pgP" type="number" min="0" inputmode="numeric" value="${esc(P.personas || '')}"></label><label>Valor total<span class="money"><i>$</i><input id="pgT" type="number" min="0" step="1000" inputmode="numeric" value="${t || ''}" placeholder="0"></span></label></div>
        <label>Incluye<textarea id="pgI" rows="2" maxlength="600">${esc(P.incluye || '')}</textarea></label>
        <div class="blk-h"><h4>Abonos</h4><button type="button" class="chip-btn" id="pgAdd">+ Agregar</button></div>
        <div class="abonos">${P.abonos.length ? P.abonos.map((x,i) => `<div class="abcard"><div class="ab-top"><span class="ab-n">Abono ${i+1}</span><button type="button" class="ab-del" data-pdel="${i}" aria-label="Eliminar abono ${i+1}"><svg><use href="#i-trash"/></svg></button></div>
          <label class="ab-f">Fecha<input type="date" data-pa="${i}" data-k="fecha" value="${esc(x.fecha || '')}"></label>
          <div class="ab-row"><label class="ab-f">Monto<span class="money"><i>$</i><input type="number" min="0" step="1000" inputmode="numeric" data-pa="${i}" data-k="monto" value="${esc(x.monto || '')}"></span></label><label class="ab-f">Medio<input data-pa="${i}" data-k="medio" list="rMedios2" maxlength="60" value="${esc(x.medio || '')}" placeholder="Transferencia"></label></div></div>`).join('') : '<p class="tiny">Sin abonos.</p>'}</div>
        <datalist id="rMedios2"><option value="Transferencia"><option value="Efectivo"><option value="Depósito"><option value="Tarjeta"></datalist>
        <div class="totals" id="pgTot"></div>
        <label>Notas<textarea id="pgN" rows="2" maxlength="600">${esc(P.notas || '')}</textarea></label>
        <button type="button" class="btn2 primary full" id="pgSave">Guardar pagos</button>
        <button type="button" class="btn2 ghost full" id="pgRc">🧾 Generar comprobante</button>
      </div>`;
    enhanceDates(body);
    const tot = () => { const ab2 = sumAb(P), t2 = Number(P.total)||0; $('pgTot').innerHTML = `<div class="tot-row"><span>Valor total</span><b>${t2 ? money(t2) : '—'}</b></div><div class="tot-row ok"><span>Total abonado</span><b>${money(ab2)}</b></div><div class="tot-row due"><span>Saldo pendiente</span><b>${t2 ? money(Math.max(0, t2 - ab2)) : 'Por definir'}</b></div>`; };
    const bind = (id, k, num) => $(id).addEventListener('input', () => { P[k] = num ? Number($(id).value) || 0 : $(id).value; tot(); });
    bind('pgC','cliente'); bind('pgP','personas',1); bind('pgT','total',1); bind('pgI','incluye'); bind('pgN','notas');
    body.querySelectorAll('[data-pa]').forEach(inp => { const h = () => { P.abonos[+inp.dataset.pa][inp.dataset.k] = inp.dataset.k === 'monto' ? Number(inp.value) || 0 : inp.value; tot(); }; inp.addEventListener('input', h); inp.addEventListener('change', h); });
    body.querySelectorAll('[data-pdel]').forEach(b => b.onclick = () => { P.abonos.splice(+b.dataset.pdel, 1); draw(); });
    $('pgAdd').onclick = () => { P.abonos.push({ fecha: iso(today), monto: 0, medio: '' }); draw(); };
    $('pgSave').onclick = async () => {
      const row = { fecha:P.fecha, cliente:(P.cliente||'').trim() || null, telefono:P.telefono || null, personas:Number(P.personas)||0, horario:P.horario || null, incluye:(P.incluye||'').trim() || null, notas:(P.notas||'').trim() || null, total:Number(P.total)||0, abonos:P.abonos.filter(x => Number(x.monto) > 0), solicitud:P.solicitud || null, actualizado:new Date().toISOString(), actualizado_por:ADMIN };
      $('pgSave').disabled = true;
      const { error } = await SB.from('pagos').upsert(row, { onConflict:'fecha' });
      $('pgSave').disabled = false;
      if (error) return toast('No se pudo guardar: ' + error.message);
      toast('Pagos guardados ✔'); closeDlg($('admDay')); ADM.loaded = 0; after();
    };
    $('pgRc').onclick = () => { closeDlg($('admDay'));
      Object.assign(rcpt, { cliente: P.cliente || '', fecha: P.fecha, horario: P.horario || '', personas: String(P.personas || ''), incluye: P.incluye || '', total: String(Number(P.total) || ''), plan: '', auto: false, extras: {}, abonos: P.abonos.filter(x => Number(x.monto) > 0).map(x => ({ fecha: x.fecha, monto: String(x.monto), medio: x.medio || '' })) });
      if (!rcpt.abonos.length) rcpt.abonos = [{ fecha: iso(today), monto: '', medio: '' }];
      admGo('receipt'); toast('Datos cargados desde Pagos ✔'); };
    tot();
  };
  draw(); openDlg($('admDay'));
}

/* --- Planes y precios / Configuración --- */
function adminPlans(c){
  c.innerHTML = `<div class="ac-h"><h3 class="pg-t">Planes y precios</h3></div>
    <div class="adm-warn bad"><span class="dotl"></span><span>Estos precios se guardan <b>solo en este dispositivo</b> y no se publican. Se usan para calcular los comprobantes.</span></div>
    <section class="adm-card"><div id="rPlanes"></div></section>`;
  planEditor($('rPlanes'), () => adminPlans(c));
}
function adminConfig(c){
  const ok = !!(SB && ADMIN);
  c.innerHTML = `<div class="ac-h"><h3 class="pg-t">Configuración</h3></div>
    <section class="adm-card cfg"><div class="cfg-row"><span>Sesión</span><b>${esc(ADMIN || who() || '—')}</b></div>
      <div class="cfg-row"><span>Base de datos</span><b class="${ok ? 'okc2' : 'bad2'}">${ok ? '✔ Conectada (Supabase)' : '✖ Sin conexión'}</b></div>
      <div class="cfg-row"><span>Clave</span><b>Se cambia en Supabase → Authentication → Users</b></div></section>
    <section class="adm-card"><h4 class="dd-h">Dónde se guarda cada cosa</h4>
      <div class="cfg-t">
        <div><span>Solicitudes y reservas</span><b class="${ok ? 'okc2' : 'bad2'}">${ok ? 'Base de datos' : 'Este navegador'}</b></div>
        <div><span>Fechas bloqueadas</span><b class="${ok ? 'okc2' : 'bad2'}">${ok ? 'Base de datos' : 'Este navegador'}</b></div>
        <div><span>Mural y fotos de visitantes</span><b class="${ok ? 'okc2' : 'bad2'}">${ok ? 'Base de datos + Storage' : 'Solo demostración'}</b></div>
        <div><span>Historial y Excel de respaldo</span><b class="${ok ? 'okc2' : 'bad2'}">${ok ? 'Base de datos' : 'No disponible'}</b></div>
        <div><span>Planes y precios</span><b class="bad2">Este dispositivo</b></div>
        <div><span>Comprobantes emitidos</span><b class="bad2">No se guardan (se generan al momento)</b></div>
        <div><span>Galería del sitio (fotos)</span><b class="bad2">Archivos del sitio · cambios vía FLUVA</b></div>
      </div></section>
    <section class="adm-card cfg-acts"><a class="btn2 ghost full" href="#inicio">Ver sitio público</a><button type="button" class="btn2 ghost full" id="cfgOut">Cerrar sesión</button></section>`;
  $('cfgOut').onclick = () => $('logout').click();
}

/* ---------- Pestañas (rutas por #hash) ---------- */
const VIEWS = ['inicio','instalaciones','eventos','recuerdos','reservas','contacto','admin'];
const ALIAS = { galeria:['instalaciones','galeria'], visitantes:['recuerdos'], mural:['recuerdos'], disponibilidad:['inicio','disponibilidad'], main:['inicio'] };
let curView = '';
function route(){
  const h = location.hash.slice(1);
  let [v, anchor] = ALIAS[h] || [VIEWS.includes(h) ? h : 'inicio'];
  document.querySelectorAll('dialog[open]').forEach(closeDlg);
  document.querySelectorAll('.view').forEach(el => el.hidden = el.dataset.view !== v);
  document.body.dataset.view = v;
  $('abTitle').textContent = ({instalaciones:'Instalaciones', eventos:'Eventos', recuerdos:'Recuerdos', reservas:'Reservas', contacto:'Contacto', admin:'Administración'})[v] || '';
  document.querySelectorAll('[data-tab-link]').forEach(a => { const on = a.dataset.tabLink === v; a.classList.toggle('on', on); on ? a.setAttribute('aria-current','page') : a.removeAttribute('aria-current'); });
  if (v === 'admin'){ admWarn(); $('admMsg').href = isMobileUA ? 'whatsapp://send' : 'https://web.whatsapp.com/'; }
  if (v === 'admin'){ const u = SB ? ADMIN : (SBC.url ? '' : who()); $('adminLogin').hidden = !!u; $('adminPanel').hidden = !u; if (u) { $('adminWho').textContent = u; renderAdmin(); memBadge(); } }
  if (v === 'inicio') homeCal();
  revealAll();
  if (anchor) requestAnimationFrame(() => $(anchor).scrollIntoView({block:'start'}));
  else if (v !== curView) window.scrollTo(0,0);
  curView = v;
}
const adminRoute = route;
let tries = 0;
$('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  if (tries >= 5) { $('lMsg').textContent = 'Demasiados intentos. Recarga la página para intentar de nuevo.'; return; }
  await sbReady;
  if (!SB && SBC.url){ $('lMsg').textContent = window.SB_STATUS === 'nosql' ? 'La base de datos no está lista. Avisa a FLUVA.' : 'No hay conexión con la base de datos. Revisa tu internet, recarga la página e inténtalo de nuevo.'; return; }
  if (SB){
    $('lMsg').textContent = 'Entrando…';
    const { error } = await SB.auth.signInWithPassword({ email: $('lUser').value.trim().toLowerCase(), password: $('lPin').value });
    if (error) { tries++; $('lMsg').textContent = 'Correo o clave incorrectos.'; $('lPin').value = ''; $('lPin').focus(); return; }
    ADMIN = await sbAdminName();
    if (!ADMIN) { await SB.auth.signOut(); $('lMsg').textContent = 'Esta cuenta no tiene acceso de administración.'; return; }
    $('lPin').value = ''; $('lMsg').textContent = ''; route(); return;
  }
  let adm = null; try { const hh = await sha(ADM_SALT + $('lUser').value.trim().toLowerCase() + '|' + $('lPin').value); adm = (D.administradores || []).find(x => x.h === hh); } catch {}
  if (!adm) { tries++; $('lMsg').textContent = 'Correo o clave incorrectos.'; $('lPin').value = ''; $('lPin').focus(); return; }
  try { sessionStorage.setItem(SKEY, adm.nombre); } catch {}
  $('lPin').value = ''; $('lMsg').textContent = ''; adminRoute();
});
$('logout').addEventListener('click', async e => { e.preventDefault(); try { sessionStorage.removeItem(SKEY); } catch {} if (SB) { await SB.auth.signOut(); ADMIN = ''; } route(); });
window.addEventListener('hashchange', route);
window.addEventListener('pageshow', () => document.querySelectorAll('dialog[open]').forEach(closeDlg));

/* ---------- Selector de fecha con calendario (reemplaza los campos de fecha) ---------- */
let dpInput = null, dpShown = new Date();
const dpLabel = v => { if (!v) return '📅 Elegir fecha'; const [y,m,d] = v.split('-').map(Number); return '📅 ' + new Date(y,m-1,d).toLocaleDateString('es-CL',{weekday:'short',day:'numeric',month:'short',year:'numeric'}); };
function enhanceDates(root){
  root.querySelectorAll('input[type=date]').forEach(inp => {
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'datebtn dpbtn';
    const aria = inp.getAttribute('aria-label') || (inp.closest('label') ? inp.closest('label').firstChild.textContent.trim() : 'Fecha');
    btn.setAttribute('aria-label', aria);
    const paint = () => { btn.innerHTML = `<span>${esc(dpLabel(inp.value))}</span><span aria-hidden="true">▾</span>`; };
    inp.dataset.min = inp.min || ''; inp.type = 'hidden'; inp.after(btn); paint();
    inp.addEventListener('input', paint); inp.addEventListener('change', paint);
    btn.addEventListener('click', e => { e.preventDefault(); dpInput = inp; const v = inp.value; const base = v ? new Date(v + 'T12:00') : new Date(); dpShown = new Date(base.getFullYear(), base.getMonth(), 1); dpDraw(); openDlg($('dp')); });
  });
}
function dpDraw(){
  const g = $('dpGrid'); g.innerHTML = '';
  { const m = dpShown.toLocaleDateString('es-CL',{month:'long',year:'numeric'}); $('dpMonth').textContent = m.charAt(0).toUpperCase() + m.slice(1); }
  const start = (dpShown.getDay()+6)%7; for (let i=0;i<start;i++) g.append(document.createElement('span'));
  const days = new Date(dpShown.getFullYear(), dpShown.getMonth()+1, 0).getDate(), min = dpInput ? dpInput.dataset.min : '';
  for (let n=1;n<=days;n++){
    const d = new Date(dpShown.getFullYear(), dpShown.getMonth(), n), key = iso(d);
    const b = document.createElement('button'); b.type = 'button'; b.textContent = n;
    b.className = (RESERVADAS.has(key) || db.days[key] === 'booked' ? 'booked' : '') + (dpInput && dpInput.value === key ? ' selected' : '') + (+d === +today ? ' today' : '');
    const max = dpInput ? dpInput.dataset.max : '';
    b.disabled = (!!min && key < min) || (!!max && key > max);
    b.setAttribute('aria-label', fmtDate(key));
    b.addEventListener('click', () => dpPick(key));
    g.append(b);
  }
}
function dpPick(key){ if (!dpInput) return; dpInput.value = key; dpInput.dispatchEvent(new Event('input', {bubbles:true})); dpInput.dispatchEvent(new Event('change', {bubbles:true})); closeDlg($('dp')); }
$('dpPrev').addEventListener('click', () => { dpShown.setMonth(dpShown.getMonth()-1); dpDraw(); });
$('dpNext').addEventListener('click', () => { dpShown.setMonth(dpShown.getMonth()+1); dpDraw(); });
$('dpToday').addEventListener('click', () => { const k = iso(today); if (dpInput && dpInput.dataset.min && k < dpInput.dataset.min) return; dpPick(k); });
new MutationObserver(() => enhanceDates($('adminContent'))).observe($('adminContent'), {childList:true, subtree:true});

/* ---------- Estados de carga y error de imágenes ---------- */
document.addEventListener('load', e => { if (e.target.tagName === 'IMG') e.target.classList.add('ok'); }, true);
document.addEventListener('error', e => { const t = e.target; if (t.tagName !== 'IMG' || t.dataset.failed) return; t.dataset.failed = '1'; t.classList.add('img-err'); if (t.parentElement) t.parentElement.classList.add('has-err'); }, true);

/* ---------- Pantalla de inicio ---------- */
function home(){
  const [l1, l2] = D.negocio.lema || ['Un día de diversión','en la naturaleza'];
  $('lema1').textContent = l1; $('lema2').textContent = l2;
  $('tileMaps').href = D.negocio.mapsUrl; $('abWa').href = waLink(`Hola Carla, tengo una consulta sobre ${D.negocio.nombre}.`);
  // carrusel
  const S = D.promos || [];
  $('promoTrack').innerHTML = S.map((p,i) => `<a class="slide2" href="${esc(p.link)}" role="group" aria-roledescription="diapositiva" aria-label="${i+1} de ${S.length}: ${esc(p.t1+' '+p.t2)}">
      <img src="${esc(p.foto)}" alt="" loading="${i ? 'lazy' : 'eager'}" decoding="async"><span class="sgrad" aria-hidden="true"></span>
      <span class="scap"><span class="s1">${esc(p.t1)}</span><span class="s2">${esc(p.t2)}</span><span class="smore">Ver más <svg><use href="#i-chev"/></svg></span></span></a>`).join('');
  $('promoDots').innerHTML = S.map((_,i) => `<button type="button" role="tab" aria-label="Diapositiva ${i+1}" data-dot="${i}"></button>`).join('');
  const tr = $('promoTrack'); let idx = 0, timer, paused = false;
  const go = i => { idx = (i + S.length) % S.length; tr.scrollTo({left: idx * tr.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'}); };
  const mark = () => { idx = Math.round(tr.scrollLeft / Math.max(1,tr.clientWidth)); $('promoDots').querySelectorAll('button').forEach((b,i) => { b.classList.toggle('on', i === idx); b.setAttribute('aria-selected', i === idx); }); };
  tr.addEventListener('scroll', () => { clearTimeout(tr._t); tr._t = setTimeout(mark, 80); }, {passive:true});
  $('promoDots').addEventListener('click', e => { const b = e.target.closest('[data-dot]'); if (b) { go(+b.dataset.dot); restart(); } });
  $('promoNext').addEventListener('click', () => { go(idx + 1); restart(); });
  $('promoPrev').addEventListener('click', () => { go(idx - 1); restart(); });
  $('promo').addEventListener('keydown', e => { if (e.key === 'ArrowRight') { go(idx + 1); restart(); } if (e.key === 'ArrowLeft') { go(idx - 1); restart(); } });
  ['mouseenter','focusin','touchstart'].forEach(ev => $('promo').addEventListener(ev, () => paused = true, {passive:true}));
  ['mouseleave','focusout'].forEach(ev => $('promo').addEventListener(ev, () => paused = false));
  $('promo').addEventListener('touchend', () => setTimeout(() => paused = false, 4000), {passive:true});
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const restart = () => { clearInterval(timer); if (!reduce && S.length > 1) timer = setInterval(() => { if (!paused && curView === 'inicio' && !document.hidden) go(idx + 1); }, 5500); };
  window.addEventListener('resize', () => go(idx));
  mark(); restart();
  // tira de instalaciones
  $('homeStrip').innerHTML = D.instalaciones.map((f,i) => `<button type="button" class="scard" data-hfac="${i}" aria-label="${esc(f.titulo)}"><img src="${esc(f.foto)}" alt="" loading="lazy" decoding="async"><span class="spill">${ico(f.ico || 'm-img', f.tone, 'smi')}${esc(f.corto || f.titulo)}</span></button>`).join('');
  $('homeStrip').querySelectorAll('[data-hfac]').forEach(b => b.addEventListener('click', () => openFacility(+b.dataset.hfac)));
  $('hprev').addEventListener('click', () => { hShown.setMonth(hShown.getMonth()-1); homeCal(); });
  $('hnext').addEventListener('click', () => { hShown.setMonth(hShown.getMonth()+1); homeCal(); });
}
let hShown = new Date(today.getFullYear(), today.getMonth(), 1);
function homeCal(){
  const g = $('hcal'); g.innerHTML = '';
  { const m = hShown.toLocaleDateString('es-CL',{month:'long',year:'numeric'}); $('hmonth').textContent = m.charAt(0).toUpperCase() + m.slice(1); }
  const start = (hShown.getDay()+6)%7; for (let i=0;i<start;i++) g.append(document.createElement('span'));
  const days = new Date(hShown.getFullYear(), hShown.getMonth()+1, 0).getDate();
  for (let n=1;n<=days;n++){
    const d = new Date(hShown.getFullYear(), hShown.getMonth(), n), key = iso(d), s = status(key), past = d < today;
    const b = document.createElement('button'); b.type = 'button'; b.textContent = n;
    b.className = ({exclusive:'available',individual:'special',booked:'booked'}[s] || '') + (+d === +today ? ' today' : '');
    b.disabled = past || s === 'closed' || s === 'booked';
    b.setAttribute('aria-label', `${fmtDate(key)}: ${past ? 'fecha pasada' : LABEL[s]}`);
    b.addEventListener('click', () => { shown = new Date(d.getFullYear(), d.getMonth(), 1); pickDate(key); location.hash = 'reservas'; });
    g.append(b);
  }
  $('hprev').disabled = hShown <= new Date(today.getFullYear(), today.getMonth(), 1);
}

/* ---------- Inicio ---------- */
facilities(); gallery(); events(); calendar(); prices(); policies(); memInit(); contact(); siteFooter(); home(); rzInit(); route();
sbReady.then(async sb => { memLoad(); if (!sb) return; sbLoadDates(); ADMIN = await sbAdminName(); if (curView === 'admin') route(); });
})();
