/* ========== عناصر DOM ========== */
const resultBox     = document.getElementById('resultBox');
const copyBtn       = document.getElementById('copyBtn');
const copyToast     = document.getElementById('copyToast');

const receiverName  = document.getElementById('receiverName');
const receiverCode  = document.getElementById('receiverCode');
const deputyName    = document.getElementById('deputyName');
const deputyCode    = document.getElementById('deputyCode');
const receiverErr   = document.getElementById('receiverErr');
const deputyErr     = document.getElementById('deputyErr');

const dropArea      = document.getElementById('dropArea');
const imgInput      = document.getElementById('imgInput');

const rowsEl        = document.getElementById('rows');
const addRowBtn     = document.getElementById('addRowBtn');

const clearBtn      = document.getElementById('clearBtn');

const drawer        = document.getElementById('drawer');
const drawerBackdrop= document.getElementById('drawerBackdrop');
const drawerClose   = document.getElementById('drawerClose');
const drawerSave    = document.getElementById('drawerSave');
const dName         = document.getElementById('dName');
const dCode         = document.getElementById('dCode');
const dState        = document.getElementById('dState');
const dLoc          = document.getElementById('dLoc');

let editingIndex = null;   // null = إضافة، رقم = تعديل

/* ========== بيانات ========== */
let rows = []; // {name, code, state, loc}

const stateBadgeClass = state => {
  switch (state) {
    case 'في الميدان':       return 'state-midan';
    case 'مشغول':            return 'state-busy';
    case 'مشغول - تدريب':    return 'state-train';
    case 'مشغول - اختبار':   return 'state-test';
    case 'خارج الخدمة':      return 'state-off';
    default:                  return '';
  }
};

/* ========== انترو ========== */
window.addEventListener('load', () => {
  // مجرد تحميل، الانترو يختفي بأنيميشن CSS
});

/* ========== التوست ========== */
function showToast() {
  copyToast.style.opacity = '1';
  setTimeout(() => copyToast.style.opacity = '0', 1200);
}

/* ========== نسخ النتيجة ========== */
copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(resultBox.value || '')
    .then(showToast);
});

/* ========== التحقق من المستلم/النائب ========== */
function checkNames() {
  const rOk = receiverName.value.trim() && receiverCode.value.trim();
  const dOk = deputyName.value.trim()   && deputyCode.value.trim();
  receiverErr.style.display = rOk ? 'none' : 'block';
  deputyErr.style.display   = dOk ? 'none' : 'block';
  return rOk && dOk;
}

/* ========== توليد النتيجة ========== */
function buildResult() {
  if (!checkNames()) return;

  const inField = [];
  const offField= [];

  rows.forEach(r => {
    const locTxt = r.loc && r.loc !== '— لا شيء —' ? ` - ( ${r.loc} )` : '';

    if (r.state === 'خارج الخدمة'){
      offField.push(`${r.name} | ${r.code}`);
    } else {
      let statePart = '';
      if (r.state !== 'في الميدان') statePart = ` ( ${r.state} )`;
      inField.push(`${r.name} | ${r.code}${statePart}${locTxt}`);
    }
  });

  const count = rows.length;
  const recLine = `المستلم : ${receiverName.value.trim()} | ${receiverCode.value.trim()}`;
  const depLine = `النائب : ${deputyName.value.trim()} | ${deputyCode.value.trim()}`;

  const out = [
    '📌 استلام العمليات 📌',
    '',
    recLine,
    '',
    depLine,
    '',
    `عدد و اسماء الوحدات الاسعافيه في الميدان :{${count}}`,
    ...(inField.length ? inField : ['—']),
    '',
    `خارج الخدمة : (${offField.length})`,
    ...(offField.length ? offField : ['—']),
    '',
    '🎙️ تم استلام العمليات و جاهزون للتعامل مع البلاغات',
    '',
    'الملاحظات : تحديث'
  ].join('\n');

  resultBox.value = out;
}

/* ========== رسم صف ========== */
function renderRows(){
  rowsEl.innerHTML = '';
  rows.forEach((r, i) => {
    const row = document.createElement('div');
    row.className = 'row-item';

    const sBadge = document.createElement('div');
    sBadge.className = `state-badge ${stateBadgeClass(r.state)}`;
    sBadge.textContent = r.state;

    const chipCode = document.createElement('div');
    chipCode.className = 'chip';
    chipCode.textContent = r.code || '—';

    const nameBox = document.createElement('div');
    nameBox.className = 'chip';
    nameBox.textContent = r.name;

    const chipLoc = document.createElement('div');
    chipLoc.className = 'chip';
    chipLoc.textContent = r.loc;

    const editBtn = document.createElement('button');
    editBtn.className = 'btn';
    editBtn.textContent = 'تعديل';
    editBtn.addEventListener('click', ()=> openDrawer(i));

    const delBtn = document.createElement('button');
    delBtn.className = 'btn del';
    delBtn.textContent = 'حذف';
    delBtn.addEventListener('click', ()=>{
      rows.splice(i,1);
      renderRows();
      buildResult();
    });

    row.append(sBadge, chipCode, nameBox, chipLoc, editBtn, delBtn);
    rowsEl.appendChild(row);
  });
}

/* ========== إضافة سطر (زر) ========== */
addRowBtn.addEventListener('click', ()=> openDrawer(null));

/* ========== الدروار: فتح/إغلاق ========== */
function openDrawer(index){
  editingIndex = index;
  if (index == null){
    dName.value = ''; dCode.value = '';
    dState.value= 'في الميدان';
    dLoc.value  = '— لا شيء —';
  } else{
    const r = rows[index];
    dName.value = r.name;
    dCode.value = r.code;
    dState.value= r.state;
    dLoc.value  = r.loc;
  }
  drawer.classList.add('open');
  drawerBackdrop.classList.add('show');
}
function closeDrawer(){
  drawer.classList.remove('open');
  drawerBackdrop.classList.remove('show');
}
drawerClose.addEventListener('click', closeDrawer);
drawerBackdrop.addEventListener('click', closeDrawer);

/* ========== حفظ من الدروار ========== */
drawerSave.addEventListener('click', ()=>{
  const r = {
    name: dName.value.trim(),
    code: normalizeCode(dCode.value),
    state:dState.value,
    loc:  dLoc.value
  };
  if(!r.name){ dName.focus(); return; }

  if (editingIndex == null) rows.push(r);
  else rows[editingIndex] = r;

  closeDrawer();
  renderRows();
  buildResult();
});

/* ========== تفريغ الكل ========== */
clearBtn.addEventListener('click', ()=>{
  if (!confirm('سيتم مسح جميع البيانات والنتيجة. هل أنت متأكد؟')) return;
  receiverName.value = '';
  receiverCode.value = '';
  deputyName.value   = '';
  deputyCode.value   = '';
  rows = [];
  renderRows();
  resultBox.value = '';
});

/* ========== OCR: لصق/رفع/سحب ========== */
function handleFiles(files){
  const f = files?.[0];
  if (f) runOCR(f);
}
imgInput.addEventListener('change', e=> handleFiles(e.target.files));

/* لصق */
window.addEventListener('paste', e=>{
  const items = e.clipboardData?.items || [];
  for (const it of items){
    if (it.type?.startsWith('image/')){
      handleFiles([it.getAsFile()]);
      e.preventDefault();
      break;
    }
  }
});

/* سحب وإفلات */
;['dragenter','dragover'].forEach(ev=>{
  dropArea.addEventListener(ev, e=>{
    e.preventDefault(); e.stopPropagation();
    dropArea.classList.add('dragging');
  }, false);
});
;['dragleave','drop'].forEach(ev=>{
  dropArea.addEventListener(ev, e=>{
    e.preventDefault(); e.stopPropagation();
    dropArea.classList.remove('dragging');
  }, false);
});
dropArea.addEventListener('drop', e=>{
  handleFiles(e.dataTransfer?.files);
});

/* ========== OCR ========== */
async function runOCR(file){
  dropArea.textContent = '... الرجاء الأنتظار ...';
  const mode = document.querySelector('input[name="mergeMode"]:checked')?.value || 'replace';

  try{
    const pre = await preprocessImage(file);

    const { data } = await Tesseract.recognize(pre, 'ara+eng', {
      logger: m => { if (m.status==='recognizing text') dropArea.textContent = `... جاري الاستخراج ${Math.round(m.progress*100)}%`; }
    });

    const lines = (data.text||'').split('\n')
      .map(cleanLine)
      .filter(Boolean);

    const parsed = lines.map(parseLine).filter(p=>p && p.name);

    if (mode==='replace') rows = parsed;
    else rows = rows.concat(parsed);

    renderRows();
    buildResult();
  } catch(e){
    console.error(e);
    alert('تعذّر استخراج النص. جرّب صورة أوضح.');
  } finally{
    dropArea.innerHTML = `اسحب وأفلت صورة هنا، أو الصقها بـ <b>Ctrl+V</b>`;
  }
}

/* تنظيف سطر */
function cleanLine(s){
  s = s.replace(/[\u200E\u200F\u202A-\u202E]/g,''); // علامات اتجاه
  s = s.replace(/[“”\"';:،؛]/g,' ').replace(/\s+/g,' ').trim();
  return s;
}

/* تطبيع الكود */
function normalizeCode(t){
  if (!t) return '';
  t = String(t).toUpperCase().replace(/[Oo]/g,'0').replace(/[Il]/g,'1').trim();
  t = t.replace(/\s+/g,'');
  const m = t.match(/^([A-Z]{1,3})-?(\d{1,4})$/);
  if (m) return m[1] + m[2];
  return t;
}

/* قراءة سطر (اسم/كود) */
function parseLine(line){
  let name='', code='';

  if (line.includes('|')){
    const [a,b] = line.split('|').map(s=>s.trim());
    if (/^[A-Za-z0-9\-]+$/.test(a)) { code = normalizeCode(a); name=b; }
    else if (/^[A-Za-z0-9\-]+$/.test(b)) { code = normalizeCode(b); name=a; }
    else { name=line; }
  } else {
    const parts = line.split(' ');
    const last  = parts[parts.length-1];
    if (/^[A-Za-z0-9\-]+$/.test(last)) {
      code = normalizeCode(last);
      name = parts.slice(0,-1).join(' ');
    } else {
      name = line;
    }
  }

  return { name, code, state:'في الميدان', loc:'— لا شيء —' };
}

/* تحسين صورة (رمادي/تباين بسيط) */
function preprocessImage(file){
  return new Promise((resolve, reject)=>{
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = ()=>{
      const maxW = 1600;
      let w=img.width, h=img.height;
      if (w>maxW){ h=Math.round(h*(maxW/w)); w=maxW; }
      const c = document.createElement('canvas'); c.width=w; c.height=h;
      const ctx = c.getContext('2d');
      ctx.drawImage(img,0,0,w,h);
      const data = ctx.getImageData(0,0,w,h);
      const d = data.data;
      for (let i=0;i<d.length;i+=4){
        const g = 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2];
        d[i]=d[i+1]=d[i+2]=g;
      }
      ctx.putImageData(data,0,0);
      c.toBlob(b=>{ URL.revokeObjectURL(url); resolve(b); }, 'image/png', 0.95);
    };
    img.onerror = e=>{ URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

/* تحديث النتيجة عند تغيّر حقول الأسماء */
[receiverName,receiverCode,deputyName,deputyCode]
  .forEach(el=> el.addEventListener('input', buildResult));
