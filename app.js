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

/* ---------- Navegación móvil ---------- */
const burger = $('burger'), nav = $('nav');
burger.addEventListener('click', () => { const o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o); burger.setAttribute('aria-label', o ? 'Cerrar menú' : 'Abrir menú'); });
nav.addEventListener('click', e => { if (e.target.closest('a')) { nav.classList.remove('open'); burger.setAttribute('aria-expanded', false); } });

/* Sección activa en el menú + animaciones de entrada */
if ('IntersectionObserver' in window) {
  const links = [...nav.querySelectorAll('a')];
  const spy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); }), {rootMargin:'-45% 0px -50% 0px'});
  document.querySelectorAll('main > section[id]').forEach(s => spy.observe(s));
  const rv = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rv.unobserve(e.target); } }), {threshold:.12});
  window.__reveal = el => rv.observe(el);
} else window.__reveal = el => el.classList.add('in');
const revealAll = () => document.querySelectorAll('.reveal:not(.in)').forEach(el => window.__reveal(el));

/* ---------- Instalaciones ---------- */
function facilities(){
  $('facilities').innerHTML = D.instalaciones.map((f,i) => `
    <button class="fac reveal" type="button" data-fac="${i}" aria-haspopup="dialog">
      <span class="ico" aria-hidden="true">${f.icono}</span>
      <img src="${esc(f.foto)}" alt="${esc(f.titulo)}" loading="lazy" width="600" height="895">
      <div class="body"><h3>${esc(f.titulo)}</h3><p>${esc(f.texto)}</p><span class="more">Ver ficha →</span></div>
    </button>`).join('');
  $('facilities').querySelectorAll('[data-fac]').forEach(b => b.addEventListener('click', () => {
    const f = D.instalaciones[b.dataset.fac];
    $('fImg').src = f.foto; $('fImg').alt = f.titulo;
    $('fTitle').textContent = `${f.icono} ${f.titulo}`; $('fText').textContent = f.texto;
    $('fList').innerHTML = Object.entries(f.detalles).map(([k,v]) => `<dt>${esc(k)}</dt><dd>${v ? esc(v) : PEND}</dd>`).join('');
    openDlg($('facility'));
  }));
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
  $('eventHighlights').innerHTML = E.destacados.map(h => `<div class="hcard reveal">${h.foto ? `<img src="${esc(h.foto)}" alt="${esc(h.titulo)}" loading="lazy">` : ''}<div class="t"><span class="e" aria-hidden="true">${h.icono}</span><b>${esc(h.titulo)}</b><p>${esc(h.texto)}</p></div></div>`).join('');
  $('etype').innerHTML = E.tipos.map(t => `<option>${esc(t)}</option>`).join('');
  $('eservices').innerHTML = E.servicios.map(s => `<label class="check"><input type="checkbox" value="${esc(s)}"> ${esc(s)}</label>`).join('');
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
    b.addEventListener('click', () => {
      selected = key; $('chosenDate').innerHTML = `📅 <b>${esc(fmtDate(key))}</b>`;
      $('bookingMode').value = s==='individual' ? D.modalidades.individual.nombre : D.modalidades.exclusive.nombre;
      calendar();
    });
    el.append(b);
  }
  $('prev').disabled = shown <= new Date(today.getFullYear(), today.getMonth(), 1);
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
$('bookingForm').addEventListener('submit', e => {
  e.preventDefault();
  if (!selected) { toast('Primero elige una fecha habilitada en el calendario.'); $('calendar').scrollIntoView({behavior:'smooth',block:'center'}); return; }
  if (!check([['bname',req],['bphone',validPhone],['bpeople',num(1,500)]])) { toast('Revisa los campos marcados.'); return; }
  const r = {id:Date.now(), kind:'Reserva', date:selected, name:$('bname').value.trim(), phone:$('bphone').value.trim(), count:$('bpeople').value, detail:$('bookingMode').value, note:$('bnote').value.trim(), status:'Pendiente'};
  const msg = `Hola Carla, quisiera solicitar una reserva en ${D.negocio.nombre}.\n\nFecha: ${fmtDate(r.date)}\nModalidad: ${r.detail}\nAsistentes: ${r.count}${EX.mostrarPrecios ? `\nValor referencial: ${priceText(r.count)}` : ''}\nNombre: ${r.name}\nWhatsApp: ${r.phone}\nComentarios: ${r.note || 'Sin comentarios'}\n\n¿Me confirmas disponibilidad, valor y abono?`;
  db.requests.push(r); save(); renderAdmin();
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
  sendWhatsApp('Cotización de evento lista', msg);
});
$('wallForm').addEventListener('submit', e => {
  e.preventDefault();
  if (!check([['wname',req],['wmessage',req]])) return;
  if (!$('wconsent').checked) { toast('Debes autorizar la publicación para enviar.'); return; }
  db.memories.push({id:Date.now(), name:$('wname').value.trim(), message:$('wmessage').value.trim(), status:'Pendiente', photo:''});
  save(); $('wallForm').reset(); renderAdmin();
  modal({title:'¡Gracias por tu recuerdo! 💛', text:'Quedó pendiente de revisión. En esta demo se guarda solo en este navegador; para recibirlo de verdad se necesita conectar un servidor.', actions:[{label:'Cerrar', cls:'pink'}]});
});
document.addEventListener('input', e => { if (e.target.classList.contains('invalid')) { e.target.classList.remove('invalid'); e.target.removeAttribute('aria-invalid'); } });

/* ---------- Condiciones de reserva ---------- */
function policies(){
  const P = D.politicas || [];
  $('policies').hidden = !P.length;
  $('policies').innerHTML = P.length ? `<h4>Condiciones de reserva</h4><ul>${P.map(p => `<li><span aria-hidden="true">${p.icono || '•'}</span>${esc(p.texto)}</li>`).join('')}</ul>` : '';
}

/* ---------- Mural ---------- */
function wall(){
  const ok = db.memories.filter(x => x.status === 'Aprobado');
  $('wall').innerHTML = ok.length ? ok.map(x => `<article class="memory">${x.photo ? `<img src="${esc(x.photo)}" alt="Recuerdo de ${esc(x.name)}">` : '<div class="ph" aria-hidden="true">☀️</div>'}<h3>${esc(x.name)} ♥</h3><p>“${esc(x.message)}”</p></article>`).join('')
    : '<div class="card empty"><h3>💛 Aquí comenzará nuestra historia</h3><p class="muted" style="margin:0">Pronto compartiremos los recuerdos de las familias que nos visitan.</p></div>';
}

/* ---------- Contacto ---------- */
function contact(){
  const N = D.negocio;
  $('cName').textContent = C.nombre; $('cRole').textContent = C.rol;
  const rows = [
    ['💬', `WhatsApp: <b>${esc(C.whatsappTexto)}</b>`],
    ['📸', `<a href="${esc(N.redes.instagram.url)}" target="_blank" rel="noopener"><b>${esc(N.redes.instagram.usuario)}</b></a>`],
    ['✉️', `Correo: ${N.contacto.email ? `<a href="mailto:${esc(N.contacto.email)}"><b>${esc(N.contacto.email)}</b></a>` : PEND}`],
    ['🕒', `Horario: ${N.horarios ? esc(N.horarios) : PEND}`],
    ['🌞', `Temporada: ${N.temporada ? esc(N.temporada) : PEND}`],
    ['👥', `Capacidad: ${N.aforoMaximo ? esc(N.aforoMaximo) : PEND}`]
  ];
  $('cInfo').innerHTML = rows.map(([i,t]) => `<li><span aria-hidden="true">${i}</span><span>${t}</span></li>`).join('');
  $('cWa').href = waLink(`Hola Carla, tengo una consulta sobre ${N.nombre}.`);
  $('cLoc').innerHTML = `<b>${esc(N.direccionExacta || N.ubicacion)}</b><br><span class="tiny">Región de Valparaíso, Chile</span>`;
  $('cMaps').href = N.mapsUrl;
}

/* ---------- Panel admin (demo) ---------- */
let tab = 'receipt';
document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; renderAdmin(); }));
function pendingFields(){
  const N = D.negocio, out = [];
  if (!N.direccionExacta) out.push('Dirección exacta / pin de Google Maps');
  if (!N.contacto.email) out.push('Correo electrónico de contacto');
  if (!N.horarios) out.push('Horario de funcionamiento');
  if (!N.temporada) out.push('Temporada de apertura');
  if (!N.aforoMaximo) out.push('Aforo máximo del recinto');
  if (!N.redes.facebook) out.push('Facebook (si existe)');
  if (!N.redes.tiktok) out.push('TikTok (si existe)');
  if (!(EX.escala||[]).length && !db.prices.exclusive) out.push('Precio arriendo exclusivo por día');
  out.push('Otras condiciones: cancelación, alcohol, mascotas, uso de piscina');
  D.instalaciones.forEach(f => Object.entries(f.detalles).forEach(([k,v]) => { if (!v) out.push(`${f.titulo}: ${k}`); }));
  out.push('Fotos originales en alta resolución (las actuales son recortes de Instagram)');
  return out;
}
function renderAdmin(){
  document.querySelectorAll('[data-tab]').forEach(b => { b.classList.toggle('active', b.dataset.tab === tab); b.setAttribute('aria-selected', b.dataset.tab === tab); });
  const c = $('adminContent');
  if (tab === 'receipt'){ receiptForm(c); return; }
  if (tab === 'dates'){
    c.innerHTML = `<h3>Habilitar o bloquear fechas</h3><p class="muted">Por defecto los días están disponibles; las fechas reservadas vienen de <code>data.js</code>. Aquí puedes ajustar días puntuales (solo en este navegador).</p>
      <div class="form"><div class="row2"><label>Fecha<input id="aDate" type="date" min="${iso(today)}"></label>
      <label>Estado<select id="aState">${Object.entries(LABEL).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}</select></label></div></div>
      <button class="btn teal" id="aSave" type="button">Guardar fecha</button><div id="aList"></div>`;
    $('aSave').onclick = () => { const d = $('aDate').value; if (!d) return toast('Elige una fecha.'); db.days[d] = $('aState').value; save(); calendar(); renderAdmin(); toast('Fecha guardada'); };
    $('aList').innerHTML = Object.entries(db.days).sort().map(([d,s]) => `<div class="adminRow"><span>${esc(fmtDate(d))} · <b>${esc(LABEL[s])}</b></span><span><button class="mini" data-edit="${d}">Editar</button><button class="mini danger" data-del="${d}">Quitar</button></span></div>`).join('');
    c.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => { $('aDate').value = b.dataset.edit; $('aState').value = db.days[b.dataset.edit]; });
    c.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { delete db.days[b.dataset.del]; save(); calendar(); renderAdmin(); });
  }
  if (tab === 'requests'){
    c.innerHTML = '<h3>Solicitudes registradas en este navegador</h3>' + (db.requests.length ? db.requests.slice().reverse().map(r => `<div class="adminRow"><div><b>${esc(r.name)}</b><p class="tiny">${esc(r.kind)} · ${esc(r.date)} · ${esc(r.count)} personas · ${esc(r.detail)}<br>WhatsApp: ${esc(r.phone)} · Estado: <b>${esc(r.status)}</b></p></div><div><button class="mini" data-id="${r.id}" data-st="Confirmado">Confirmar</button><button class="mini" data-id="${r.id}" data-st="Cotizado">Cotizado</button><button class="mini danger" data-id="${r.id}" data-st="Rechazado">Rechazar</button></div></div>`).join('') : '<p class="muted">Aún no hay solicitudes locales.</p>');
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
  if (tab === 'memories'){
    c.innerHTML = '<h3>Moderar mural de visitantes</h3><p class="tiny">Antes de publicar fotografías, verifica la autorización de todas las personas y del tutor cuando aparezcan menores.</p>' + (db.memories.length ? db.memories.map(m => `<div class="adminRow"><div><b>${esc(m.name)}</b><p>${esc(m.message)}</p><span class="tiny">${esc(m.status)}</span></div><div><button class="mini" data-m="${m.id}" data-a="Aprobado">Aprobar</button><button class="mini danger" data-m="${m.id}" data-a="Rechazado">Rechazar</button><button class="mini danger" data-m="${m.id}" data-a="Eliminado">Eliminar</button></div></div>`).join('') : '<p class="muted">Sin recuerdos pendientes.</p>');
    c.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { const m = db.memories.find(x => x.id === +b.dataset.m); if (!m) return; if (b.dataset.a === 'Eliminado') db.memories = db.memories.filter(x => x !== m); else m.status = b.dataset.a; save(); wall(); renderAdmin(); });
  }
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
  c.innerHTML = `<h3>Comprobante de reserva</h3>
    <p class="muted">Completa los datos y genera la imagen para enviarla por WhatsApp. Los datos del cliente no se guardan.</p>
    <div class="form rform">
      <label>Cliente<input id="rCliente" maxlength="80" placeholder="Nombre del cliente o curso"></label>
      <div class="row2"><label>Fecha de la reserva<input id="rFecha" type="date"></label><label>Horario<input id="rHorario" maxlength="40" list="rHorList" placeholder="Elige o escribe"></label></div>
      <datalist id="rHorList"><option value="9:30 a 20:00"><option value="Full day"><option value="Día completo"><option value="Horario a acordar"></datalist>
      <div class="row2"><label>Plan<select id="rPlan"><option value="">— Elegir plan —</option>${PL.planes.map((p,i) => `<option value="${i}">${esc(p.nombre)}</option>`).join('')}<option value="otro">Otro / personalizado</option></select></label>
        <label>Personas<input id="rPersonas" type="number" min="0" inputmode="numeric"></label></div>
      <fieldset><legend>Adicionales</legend><div class="extras">${PL.extras.map((x,i) => x.tipo === 'unidad'
        ? `<label class="xrow"><span>${esc(x.nombre)}</span><input type="number" min="0" inputmode="numeric" data-x="${i}" placeholder="Cantidad"></label>`
        : `<label class="check"><input type="checkbox" data-x="${i}"> ${esc(x.nombre)}</label>`).join('')}</div></fieldset>
      <label class="check autosw"><input type="checkbox" id="rAuto"> Calcular el valor automáticamente</label>
      <div class="row2"><label>Valor total (CLP)<input id="rTotal" type="number" min="0" step="1000" inputmode="numeric" placeholder="Opcional"></label><span></span></div>
      <label>Incluye<textarea id="rIncluye" rows="3" maxlength="400" placeholder="Ej: Pack full day: 34 personas"></textarea></label>
      <fieldset><legend>Abonos</legend><div id="rAbonos"></div><button type="button" class="mini" id="rAddAb">+ Agregar abono</button></fieldset>
      <p class="rsum" id="rSum"></p>
      <button type="button" class="btn pink full" id="rGen">Generar comprobante</button>
      <details class="planed"><summary>⚙️ Mis planes y precios</summary><div id="rPlanes"></div></details>
    </div>
    <div id="rOut" class="rout" hidden>
      <img id="rPrev" alt="Vista previa del comprobante">
      <div class="modal-actions">
        <button type="button" class="btn green" id="rShare">📲 Compartir / WhatsApp</button>
        <a class="btn outline-dark" id="rDown" download="comprobante.png" href="#">⬇ Descargar imagen</a>
      </div>
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
    $('rAbonos').innerHTML = rcpt.abonos.map((ab,i) => `<div class="abrow"><input type="date" data-ab="${i}" data-k="fecha" value="${esc(ab.fecha)}" aria-label="Fecha del abono"><input type="number" min="0" step="1000" inputmode="numeric" data-ab="${i}" data-k="monto" value="${esc(ab.monto)}" placeholder="Monto" aria-label="Monto del abono"><input data-ab="${i}" data-k="medio" value="${esc(ab.medio)}" list="rMedios" placeholder="Medio de pago" aria-label="Medio de pago" maxlength="40"><button type="button" class="mini danger" data-del-ab="${i}" aria-label="Quitar abono">✕</button></div>`).join('') + '<datalist id="rMedios"><option value="Transferencia"><option value="Efectivo"><option value="Depósito"><option value="Tarjeta"></datalist>' || '';
    $('rAbonos').querySelectorAll('[data-ab]').forEach(inp => inp.addEventListener('input', () => { rcpt.abonos[+inp.dataset.ab][inp.dataset.k] = inp.value; rSum(); }));
    $('rAbonos').querySelectorAll('[data-del-ab]').forEach(b => b.onclick = () => { rcpt.abonos.splice(+b.dataset.delAb,1); drawAb(); rSum(); });
  };
  $('rAddAb').onclick = () => { rcpt.abonos.push({fecha:iso(today), monto:'', medio:''}); drawAb(); };
  drawAb(); rSum(); planEditor();
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

function planEditor(){
  const box = $('rPlanes'); if (!box) return;
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
  function rerender(){ const open = true; receiptForm($('adminContent')); const d = document.querySelector('.planed'); if (d) d.open = open; }
}
const abTotal = r => r.abonos.reduce((s,a) => s + (Number(a.monto)||0), 0);
function rSum(){
  const el = $('rSum'); if (!el) return;
  const tot = Number(rcpt.total)||0, ab = abTotal(rcpt);
  el.innerHTML = `Abonado: <b>${clp(ab) || '$0'}</b>` + (tot ? ` · Saldo pendiente: <b>${clp(Math.max(0,tot-ab))}</b>` : '');
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
function adminRoute(){
  const on = location.hash === '#admin';
  $('admin').hidden = !on;
  document.querySelectorAll('main > section:not(#admin), .floating').forEach(s => s.hidden = on);
  if (!on) return;
  const u = who();
  $('adminLogin').hidden = !!u; $('adminPanel').hidden = !u;
  if (u) { $('adminWho').textContent = u; renderAdmin(); }
  window.scrollTo(0,0);
}
$('lUser').innerHTML = (D.administradores || []).map(x => `<option>${esc(x.nombre)}</option>`).join('');
let tries = 0;
$('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  if (tries >= 5) { $('lMsg').textContent = 'Demasiados intentos. Recarga la página para intentar de nuevo.'; return; }
  const adm = (D.administradores || []).find(x => x.nombre === $('lUser').value);
  let ok = false; try { ok = !!adm && (await sha(ADM_SALT + $('lPin').value.trim())) === adm.pin; } catch {}
  if (!ok) { tries++; $('lMsg').textContent = 'PIN incorrecto.'; $('lPin').value = ''; $('lPin').focus(); return; }
  try { sessionStorage.setItem(SKEY, adm.nombre); } catch {}
  $('lPin').value = ''; $('lMsg').textContent = ''; adminRoute();
});
$('logout').addEventListener('click', e => { e.preventDefault(); try { sessionStorage.removeItem(SKEY); } catch {} adminRoute(); });
window.addEventListener('hashchange', adminRoute);

/* ---------- Inicio ---------- */
facilities(); gallery(); events(); calendar(); prices(); policies(); wall(); contact(); revealAll(); adminRoute();
})();
