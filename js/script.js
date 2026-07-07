const editor = document.getElementById('editor');
const spineTrack = document.getElementById('spineTrack');
const docTitle = document.getElementById('docTitle');
const goalInput = document.getElementById('goalInput');
const saveIndicator = document.getElementById('saveIndicator');

// Mobil Panel Kontrol Elemanları
const leftSpine = document.getElementById('leftSpine');
const rightPanel = document.getElementById('rightPanel');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const toggleLeftSpine = document.getElementById('toggleLeftSpine');
const toggleRightPanel = document.getElementById('toggleRightPanel');

let saveTimer = null;

// --- Mobil Menü Tetikleyicileri ---
function closeAllPanels() {
  leftSpine.classList.remove('open');
  rightPanel.classList.remove('open');
  sidebarOverlay.classList.remove('active');
}

if(toggleLeftSpine) {
  toggleLeftSpine.addEventListener('click', () => {
    leftSpine.classList.toggle('open');
    rightPanel.classList.remove('open');
    if(leftSpine.classList.contains('open')) {
      sidebarOverlay.classList.add('active');
    } else {
      sidebarOverlay.classList.remove('active');
    }
  });
}

if(toggleRightPanel) {
  toggleRightPanel.addEventListener('click', () => {
    rightPanel.classList.toggle('open');
    leftSpine.classList.remove('open');
    if(rightPanel.classList.contains('open')) {
      sidebarOverlay.classList.add('active');
    } else {
      sidebarOverlay.classList.remove('active');
    }
  });
}

if(sidebarOverlay) {
  sidebarOverlay.addEventListener('click', closeAllPanels);
}

function countWords(text){
  const trimmed = text.trim();
  if(!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function parseHeadings(text){
  const lines = text.split('\n');
  const headings = [];
  lines.forEach((line, idx) => {
    const m = line.match(/^(#{1,3})\s+(.*)/);
    if(m){
      headings.push({level: m[1].length, text: m[2].trim() || '(başlıksız)', line: idx});
    }
  });
  return headings;
}

function renderSpine(){
  const headings = parseHeadings(editor.value);
  if(headings.length === 0){
    spineTrack.innerHTML = '<div class="spine-line"></div><div class="spine-empty">Başlık yazınca burada bölüm haritan oluşur. Örn: <code># Giriş</code></div>';
    return;
  }
  let html = '<div class="spine-line"></div>';
  headings.forEach((h, i) => {
    html += `<button class="spine-item" data-level="${h.level}" data-line="${h.line}">${h.text}</button>`;
  });
  spineTrack.innerHTML = html;

  spineTrack.querySelectorAll('.spine-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetLine = parseInt(btn.dataset.line, 10);
      const lines = editor.value.split('\n');
      let pos = 0;
      for(let i=0;i<targetLine;i++) pos += lines[i].length + 1;
      editor.focus();
      editor.setSelectionRange(pos, pos);
      const lineHeight = 28;
      editor.scrollTop = Math.max(0, targetLine * lineHeight - 100);
      closeAllPanels();
    });
  });
  document.getElementById('pSections').textContent = headings.length;
}

function updateStats(){
  const text = editor.value;
  const words = countWords(text);
  const chars = text.length;
  const readMin = Math.max(1, Math.round(words / 200));
  const goal = parseInt(goalInput.value, 10) || 0;
  const pct = goal > 0 ? Math.min(100, Math.round((words/goal)*100)) : 0;

  document.getElementById('wordCount').textContent = words;
  document.getElementById('charCount').textContent = chars;
  document.getElementById('readTime').textContent = readMin;
  document.getElementById('pctGoal').textContent = pct + '%';
  document.getElementById('pWords').textContent = words;
  document.getElementById('pRead').textContent = readMin + ' dk';
  document.getElementById('progressFill').style.width = pct + '%';
}

function saveDraft(){
  saveIndicator.textContent = 'kaydediliyor...';
  try{
    localStorage.setItem('kalem:draft', JSON.stringify({
      title: docTitle.value,
      body: editor.value,
      goal: goalInput.value,
      savedAt: new Date().toISOString()
    }));
    saveIndicator.textContent = 'kaydedildi';
    document.getElementById('pSaved').textContent = new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'});
  }catch(e){
    saveIndicator.textContent = 'kayıt hatası';
    console.error(e);
  }
}

function loadDraft(){
  try{
    const raw = localStorage.getItem('kalem:draft');
    if(raw){
      const data = JSON.parse(raw);
      docTitle.value = data.title || 'Adsız belge';
      editor.value = data.body || '';
      goalInput.value = data.goal || 1000;
    }
  }catch(e){
    // Kayıt yoksa varsayılan kalır
  }
  renderSpine();
  updateStats();
  checkLicense();
}

function onEdit(){
  renderSpine();
  updateStats();
  clearTimeout(saveTimer);
  saveIndicator.textContent = 'yazılıyor...';
  saveTimer = setTimeout(saveDraft, 900);
}

if(editor) {
  editor.addEventListener('input', onEdit);
}
if(docTitle) {
  docTitle.addEventListener('input', onEdit);
}
if(goalInput) {
  goalInput.addEventListener('input', updateStats);
  goalInput.addEventListener('change', onEdit);
}

function downloadFile(filename, content, mime){
  const blob = new Blob([content], {type: mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportMd(){
  const title = docTitle.value || 'belge';
  downloadFile(title + '.md', editor.value, 'text/markdown');
}
function exportTxt(){
  const title = docTitle.value || 'belge';
  downloadFile(title + '.txt', editor.value, 'text/plain');
}

const GUMROAD_PRODUCT_ID = 'z2ANiizotj3tAzK_js9wTQ==';

function isPremium(){
  return localStorage.getItem('kalem:premium') === 'true';
}

function setPremium(val){
  localStorage.setItem('kalem:premium', val ? 'true' : 'false');
}

function checkLicense(){
  const lockedNote = document.getElementById('lockedNote');
  const unlockedNote = document.getElementById('unlockedNote');
  if(!lockedNote || !unlockedNote) return;
  if(isPremium()){
    lockedNote.style.display = 'none';
    unlockedNote.style.display = 'block';
  }else{
    lockedNote.style.display = 'block';
    unlockedNote.style.display = 'none';
  }
}

async function verifyLicenseWithGumroad(key){
  try{
    const res = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams({
        product_permalink: 'uzoxqz', // Yeni kodun buraya da gelsin
        license_key: key.trim()
      })
    });
    const data = await res.json();
    return data.success === true;
  }catch(e){
    console.error('Lisans doğrulama hatası:', e);
    return null;
  }
}

const unlockBtn = document.getElementById('unlockBtn');
if(unlockBtn) {
  unlockBtn.addEventListener('click', async () => {
    const key = document.getElementById('licenseInput').value;
    if(!key.trim()){
      alert('Lütfen lisans anahtarını gir.');
      return;
    }
    unlockBtn.textContent = 'Kontrol...';
    unlockBtn.disabled = true;
    const result = await verifyLicenseWithGumroad(key);
    unlockBtn.textContent = 'Aç';
    unlockBtn.disabled = false;

    if(result === true){
      setPremium(true);
      checkLicense();
    }else if(result === false){
      alert('Bu lisans anahtarı geçerli değil.');
    }else{
      alert('Doğrulama sunucusuna ulaşılamadı.');
    }
  });
}

function exportPdf(){
  if(!isPremium()){
    alert('PDF export premium bir özellik. Sağ paneldeki lisans kutusuna anahtarını gir.');
    return;
  }
  const w = window.open('', '_blank');
  const title = docTitle.value || 'belge';
  const escaped = editor.value
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  w.document.write(`
    <html><head><title>${title}</title>
    <style>
      body{font-family:Georgia,serif;max-width:680px;margin:60px auto;line-height:1.7;color:#222;white-space:pre-wrap;}
      h1{font-size:22px;}
    </style></head>
    <body>${escaped}</body></html>
  `);
  w.document.close();
  setTimeout(() => w.print(), 300);
}

// Event Bindings
const eMd = document.getElementById('exportMd'); if(eMd) eMd.addEventListener('click', exportMd);
const eMd2 = document.getElementById('exportMd2'); if(eMd2) eMd2.addEventListener('click', exportMd);
const eTxt = document.getElementById('exportTxt'); if(eTxt) eTxt.addEventListener('click', exportTxt);
const eTxt2 = document.getElementById('exportTxt2'); if(eTxt2) eTxt2.addEventListener('click', exportTxt);
const ePdf = document.getElementById('exportPdf'); if(ePdf) ePdf.addEventListener('click', exportPdf);
const ePdf2 = document.getElementById('exportPdf2'); if(ePdf2) ePdf2.addEventListener('click', exportPdf);

loadDraft();
// ======================================================
// GUMROAD STORE & DIRECT REDIRECT INTEGRATION
// ======================================================

const PREMIUM_STORE_URL = 'https://eyyupavci.gumroad.com/l/uzoxqz';

// ======================================================
// GUMROAD STORE & DIRECT REDIRECT INTEGRATION
// ======================================================

const PREMIUM_STORE_URL = 'https://eyyupavci.gumroad.com/l/uzoxqz'; // Yeni ve Doğru Gumroad Kalem Linkin

// 1. Sağ paneldeki Gumroad satın alma butonunu yönlendirmeye bağlıyoruz
const buyPremiumBtn = document.getElementById('buyPremiumBtn');
if (buyPremiumBtn) {
  buyPremiumBtn.addEventListener('click', () => {
    window.open(PREMIUM_STORE_URL, '_blank');
  });
}

// 2. Mevcut exportPdf fonksiyonunu Gumroad yönlendirmesiyle güçlendiriyoruz
const originalExportPdf = exportPdf;
exportPdf = function() {
  if (!isPremium()) {
    alert('PDF olarak dışa aktarma Kalem Premium sürümüne özeldir. Satın alma sayfasına yönlendiriliyorsunuz.');
    window.open(PREMIUM_STORE_URL, '_blank');
    
    // Sağ paneli otomatik açarak lisans alanını kullanıcıya gösterelim
    if (rightPanel) {
      rightPanel.classList.add('open');
      sidebarOverlay?.classList.add('active');
    }
    // Lisans kutusuna odaklan (Focus)
    setTimeout(() => document.getElementById('licenseInput')?.focus(), 300);
    return;
  }
  originalExportPdf();
};
// --- PWA Service Worker Kaydı ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('Service Worker başarıyla kaydedildi:', reg.scope))
      .catch(err => console.log('Service Worker kaydı başarısız:', err));
  });
}