/* tonys list | dependency-free catalog, local pack, comparisons and tiny joys. */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const data = JSON.parse($('#catalog-data').textContent);
  const byId = new Map(data.map(p => [p.id, p]));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const money = amount => new Intl.NumberFormat('en-US', {style:'currency', currency:'USD'}).format(amount);
  const validIds = a => Array.isArray(a) ? [...new Set(a.filter(n => Number.isInteger(n) && byId.has(n)))] : [];
  let storageOK = true;
  const load = (key, fallback) => { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { storageOK = false; return fallback; } };
  const store = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { if (storageOK) toast('Browser storage is unavailable. Export your pack to keep a copy.'); storageOK = false; } };
  const osReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileLayout = window.matchMedia('(max-width:760px), (max-width:1024px) and (pointer:coarse)');
  let prefs = load('tonys-list:prefs:v1', {});
  if (!prefs || typeof prefs !== 'object') prefs = {};
  const state = {
    q:'', category:'', tags:new Set(), brand:'', shop:'', price:'', sort:'original', savedOnly:false,
    view:mobileLayout.matches ? (prefs.mobileView === 'grid' ? 'grid' : 'list') : (prefs.desktopView === 'list' || (!prefs.desktopView && prefs.view === 'list') ? 'list' : 'grid'), saved:new Set(validIds(load('tonys-list:saved:v1', []))),
    packed:new Set(validIds(load('tonys-list:packed:v1', []))), comparison:new Set(),
    theme:prefs.themeSchema === 2 && prefs.theme === 'day' ? 'day' : 'night', motion:prefs.motion !== false, sound:prefs.soundSchema === 2 ? prefs.sound !== false : true
  };
  state.packed = new Set([...state.packed].filter(n => state.saved.has(n)));
  const categories = [
    ['Packs & storage','pack'], ['Shelters','tent'], ['Sleeping pads','pad'], ['Sleep & warmth','moon'],
    ['Camp comfort','chair'], ['Camp kitchen','mug'], ['Water','drop'], ['Lighting','lamp'],
    ['Tools & safety','tool'], ['Clothing & rain','shirt'], ['Hygiene','soap']
  ];
  const guides = {
    'Packs & storage':['One big bag, several little jobs.','The Scout carries your kit. Ditty bags separate small things; compression sacks squeeze bulky soft items; straps lash gear to the outside. A rain cover is an outer layer, not the same thing as waterproof storage inside the pack. Check sack capacity and the backpack’s fit before comparing prices.'],
    'Shelters':['Poles, living space, and the actual pitch.','Clostnature, Giling and Golden Camel use dedicated poles. The Underwood and Altair are trekking-pole shelters: check pole requirements and usable interior dimensions. The Baker-style shelter emphasizes a front awning and camp space. “4-season” and fabric waterproofness numbers alone do not establish snow-load performance. Stakes are an accessory, not a complete shelter.'],
    'Sleeping pads':['Cushion is not the same thing as insulation.','The MOBI GARDEN pad is folding foam; Pretyw is a convenience-focused inflatable with a foot pump and pillow. Naturehike and Rapide SL are sold as insulated inflatables. R-values here are listing claims unless a source states the exact test; check the specific model, width and rating rather than judging warmth by thickness alone.'],
    'Sleep & warmth':['Build a system, not a pile of warmth claims.','Compare a bag’s comfort rating and fit first. Down and synthetic bags have different packing and care needs. A pillow, blanket, hood or liner adds a separate function, not a guaranteed number of degrees. The AIR 3 is an inflation accessory, not insulation. Missing weights and temperatures stay missing in this guide.'],
    'Camp comfort':['Chair legs or forest floor?','The YL08 raises you off the ground. The Nyeullcy and Crazy Creek options emphasize low or ground-level back support. The WELLHIKE sit pad has no backrest. Consider seat height, packed shape and the weight you are willing to carry; a sit pad and a full chair are not interchangeable.'],
    'Camp kitchen':['A modular kitchen, not one required bundle.','The Greenpeak burner and Petrel G3 pot are separate pieces; the matching press fits the G3. The folding dripper is another coffee method. The 450 ml TOAKS is a cup-sized vessel. Full cutlery, folding utensils and plates cover different eating habits. Check stove fit and fuel requirements. Use fuel stoves outdoors only.'],
    'Water':['Carrying water versus treating it.','The Oasis is storage with a drinking hose, not a filter. The Sawyer Squeeze is a separate filter and pouch system; the BeFree combines a filter with a collapsible bottle. Check the exact bundle, filter maintenance and water-source limitations. A capacity number does not tell you what a filter removes.'],
    'Lighting':['Mood lighting is its own category.','The WELLHIKE rice-ball lamp is an ambient light. GOPEAK is a small clip-on light. Neither has a verified runtime or brightness in this collection. Keep your primary walking light separate from the campsite mood; there is no headlamp on this list. The WELLHIKE screenshot showed it unavailable.'],
    'Tools & safety':['Different tools for different tasks.','The CP10 brings several small tools together; the Corona is a dedicated folding saw. The ferro rod is an ignition tool; the foil blankets are emergency accessories, not replacements for a sleep system. Check permissions and fire restrictions for the place you are visiting.'],
    'Clothing & rain':['Moving layers versus staying-put layers.','Puffy pants and down hoods are a different role from fleece-lined hiking trousers. The rain jacket and bibs are separate from insulation. The head net and cap address bugs and sun; rollable camp shoes are not trail boots. The cotton long johns deserve special care in wet or sweaty cold conditions. Compare fabric, fit and intended use—not just the word “warm.”'],
    'Hygiene':['Small kit. Clean campsite.','Coin towels cover wiping, the mirror covers grooming, and the soap covers washing. Pack out the used towels. Don’t wash with soap directly in a lake or stream—even biodegradable soap. Carry only the amount you need in a suitable sealed container. See the cleanup source in the product notes.']
  };
  const tagCounts = new Map();
  data.forEach(p => p.tags.forEach(tag => tagCounts.set(tag, (tagCounts.get(tag)||0)+1)));
  const tags = [...tagCounts.keys()].sort((a,b) => tagCounts.get(b)-tagCounts.get(a) || a.localeCompare(b));
  const searchIndex = new Map(data.map(p => [p.id, norm([p.name, p.brand, p.category, p.id, ...p.tags, p.description, ...Object.values(p.specs)].join(' '))]));
  let shown = [], focusReturn = null, lastDetail = null, toastTimer, audioContext = null;
  let compareMode = mobileLayout.matches ? 'cards' : 'table';
  let detailSequence = [], modalFrames = [], frozenBody = null, afterClose = null;
  const historySession = 'tl-' + Date.now().toString(36) + Math.random().toString(36).slice(2);
  let historyWorks = true;
  // Modal scroll restoration is owned here, not by the browser history entry.
  try{history.scrollRestoration="manual";}catch{ /* Optional on older embedded browsers. */ }
  let inView = new WeakMap();
  const motionOn = () => state.motion && !osReduced.matches;
  const provenance = p => p.priceKind === 'reference' ? 'Brand ref.' : p.priceKind === 'snapshot' ? 'Shared price' : 'Not verified';
  const dateLabel = date => date === '2026-10-02' ? 'Oct 2, 2026' : 'Oct 5, 2026';
  function priceHTML(p) {
    return `<div><span class="price-amount ${p.price === null ? 'unknown':''}">${p.price === null ? 'Check store' : money(p.price)}</span><span class="price-provenance ${esc(p.priceKind)}">${provenance(p)}${p.priceKind === 'reference' ? ` · ${esc(p.priceSource)}` : ''}</span></div>`;
  }
  function sourceLinks(p) {
    return p.sources.map(s => `<div class="source-row"><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a><small>${esc(s.note)}</small></div>`).join('');
  }
  function specList(p) {
    return `<dl class="spec-list">${Object.entries(p.specs).map(([k,v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
  }
  function persistPack() {
    store('tonys-list:saved:v1', [...state.saved]); store('tonys-list:packed:v1', [...state.packed]);
  }
  function persistPrefs() {
    prefs={...prefs,themeSchema:2,soundSchema:2,theme:state.theme,motion:state.motion,sound:state.sound,view:state.view};
    prefs[mobileLayout.matches?'mobileView':'desktopView']=state.view;
    store('tonys-list:prefs:v1',prefs);
  }
  function toast(message) {
    const t = $('#toast'); clearTimeout(toastTimer); t.textContent = message; t.hidden = false;
    toastTimer = setTimeout(() => { t.hidden = true; }, 3300);
  }
  // Sound is enabled on first visit; an explicit mute in this edition persists.
  // Create/resume Web Audio inside a real gesture, never on page load. No loop,
  // background music, or backlog of sounds when a browser blocks playback.
  const voices = new Set();
  let lastSoundAt = -Infinity;
  function audioReady() {
    if (!state.sound || document.hidden) return null;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return null;
      if (!audioContext || audioContext.state === 'closed') {
        audioContext = new Audio({latencyHint:'interactive'});
      }
      if (audioContext.state !== 'running') audioContext.resume().catch(()=>{});
      return audioContext;
    } catch { return null; }
  }
  function stopSounds() {
    for (const voice of voices) {
      try { voice.stop(); } catch { /* Already stopped. */ }
    }
    voices.clear();
  }
  function sound(kind = 'tap') {
    const requested = performance.now(), ctx = audioReady();
    if (!ctx || requested-lastSoundAt < 45) return;
    lastSoundAt = requested;
    const play = () => {
      if (!state.sound || document.hidden || ctx.state !== 'running' || performance.now()-requested > 300) return;
      try {
        const now=ctx.currentTime+.008;
        const tones=kind==='save'?[523,784]:kind==='pet'?[660,880,784]:[440];
        tones.forEach((f,i)=>{
          const o=ctx.createOscillator(), g=ctx.createGain(), at=now+i*.055;
          o.type='sine';o.frequency.value=f;
          g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(.035,at+.008);
          g.gain.exponentialRampToValueAtTime(.001,at+.12);
          o.connect(g);g.connect(ctx.destination);voices.add(o);
          o.onended=()=>{voices.delete(o);o.disconnect();g.disconnect();};
          o.start(at);o.stop(at+.13);
        });
      } catch { /* Optional audio must never block browsing. */ }
    };
    if(ctx.state==='running')play();else ctx.resume().then(play).catch(()=>{});
  }
  document.addEventListener('click', e=>{
    if(e.isTrusted)audioReady();
  },{capture:true,passive:true});
  document.addEventListener('keydown', e=>{
    if(e.isTrusted && ['Enter',' '].includes(e.key))audioReady();
  },{capture:true,passive:true});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){stopSounds();audioContext?.suspend().catch(()=>{});}
  });
  function burst(target, words = null) {
    if (!motionOn() || !target) return;
    const rect = target.getBoundingClientRect();
    const x = Math.max(40,Math.min(innerWidth-40, rect.left+rect.width/2)), y = Math.max(45,Math.min(innerHeight-20,rect.top+rect.height/2));
    const layer = $('#fx-layer');
    for (let i=0;i<7;i++) {
      const s = document.createElement('span'); s.className='particle'; s.textContent=i%2?'✧':'♥';
      s.style.left=x+'px';s.style.top=y+'px';
      const a = -Math.PI + i*(Math.PI/6);
      s.style.setProperty('--dx',Math.cos(a)*(30+Math.random()*36)+'px');
      s.style.setProperty('--dy',Math.sin(a)*(40+Math.random()*40)-15+'px');
      s.style.setProperty('--dr',(Math.random()*60-30)+'deg');layer.append(s);setTimeout(()=>s.remove(),750);
    }
    if (words) {
      const s=document.createElement('span');s.className='kaomoji-pop';s.textContent=words;s.style.left=x+'px';s.style.top=y+'px';layer.append(s);setTimeout(()=>s.remove(),1100);
    }
  }
  function pet(target) {
    const lines=['nya! a little fresh air?','(=^･ω･^=) you packed snacks, right?','uwu. emotionally ready to camp.','a very good day to be a little cat.','tiny paws. big plans.'];
    const line=lines[Math.floor(Math.random()*lines.length)];$('#cat-caption').textContent=line;
    toast(line);burst(target,'(=^･ω･^=) ♡');sound('pet');
  }
  function syncAnimatedAsset(img) {
    const visible=inView.get(img)!==false && !document.hidden;
    const moving=motionOn()&&visible;
    let next;
    if (img.dataset.dayAnim) next = state.theme === 'night' ? (moving?img.dataset.nightAnim:img.dataset.nightStill) : (moving?img.dataset.dayAnim:img.dataset.dayStill);
    else next=moving?img.dataset.anim:img.dataset.still;
    if(next && img.getAttribute('src')!==next) img.src=next;
  }
  function updatePreferences() {
    document.documentElement.dataset.theme=state.theme;
    $('meta[name="theme-color"]').content=state.theme==='night'?'#101e17':'#213e2b';
    document.documentElement.dataset.motion=motionOn()?'on':'off';
    $('#theme-btn').innerHTML=icon(state.theme==='night'?'sun':'moon');
    $('#theme-btn').setAttribute('aria-label',state.theme==='night'?'Switch to day camp':'Switch to night camp');
    $('#sound-btn').innerHTML=icon(state.sound?'volume':'mute');
    $('#sound-btn').setAttribute('aria-pressed',String(state.sound));
    $('#sound-btn').setAttribute('aria-label','Button sounds');
    $('#sound-btn').title=state.sound?'Sound on — tap to mute':'Sound off — tap to enable';
    if(!state.sound)stopSounds();
    $('#camp-state-text').textContent=state.theme==='night'?'one more story by the fire':'out of office, in the woods';
    [['night-setting',state.theme==='night'],['motion-setting',motionOn()],['sound-setting',state.sound]].forEach(([id,on])=>{const b=$('#'+id);b.setAttribute('aria-pressed',String(on));b.textContent=on?'ON':'OFF';});
    $('#motion-setting').disabled=osReduced.matches;
    $('#motion-help').textContent=osReduced.matches?'Your device requests reduced motion. GIFs and movement are paused.':'Pixel GIFs, happy click reactions, and gentle entrances. No blocking transitions.';
    $$('.animated-asset').forEach(syncAnimatedAsset);persistPrefs();
  }
  const assetObserver=new IntersectionObserver(entries=>entries.forEach(e=>{inView.set(e.target,e.isIntersecting);syncAnimatedAsset(e.target);}),{rootMargin:'50px'});
  $$('.animated-asset').forEach(img=>assetObserver.observe(img));
  document.addEventListener('visibilitychange',()=>$$('.animated-asset').forEach(syncAnimatedAsset));
  osReduced.addEventListener?.('change',updatePreferences);
  function renderCategories() {
    $('#category-nav').innerHTML=`<button class="category-btn" data-action="category" data-category="" aria-pressed="${!state.category}">${icon('folder')}Everything<span class="num">${data.length}</span></button>`+categories.map(([name,ico])=>`<button class="category-btn" data-action="category" data-category="${esc(name)}" aria-pressed="${state.category===name}">${icon(ico)}${esc(name)}<span class="num">${data.filter(p=>p.category===name).length}</span></button>`).join('');
  }
  function renderTagCloud() {
    const query=norm($('#tag-search').value);
    const found=tags.filter(tag=>norm(tag).includes(query));
    $('#tag-cloud').innerHTML=found.length ? found.map(tag=>`<button class="tagbtn" data-action="tag" data-tag="${esc(tag)}" aria-pressed="${state.tags.has(tag)}">${esc(tag)} <span class="mono">${tagCounts.get(tag)}</span></button>`).join('') : '<p class="mono">No matching tags.</p>';
  }
  function filtered() {
    const terms=norm(state.q.trim()).split(/\s+/).filter(Boolean);
    const results=data.filter(p=>{
      if (state.category&&p.category!==state.category) return false;
      if (state.shop&&p.store!==state.shop) return false;
      if (state.brand&&p.brand!==state.brand) return false;
      if (state.savedOnly&&!state.saved.has(p.id)) return false;
      if (![...state.tags].every(t=>p.tags.includes(t))) return false;
      if (!terms.every(t=>searchIndex.get(p.id).includes(t))) return false;
      if (state.price==='unknown'&&p.price!==null) return false;
      if (state.price==='known'&&p.price===null) return false;
      if (['reference','snapshot'].includes(state.price)&&p.priceKind!==state.price) return false;
      if (state.price==='under25'&&(p.price===null||p.price>=25)) return false;
      if (state.price==='under50'&&(p.price===null||p.price>=50)) return false;
      return true;
    });
    results.sort((a,b)=>{
      if(state.sort==='name') return a.name.localeCompare(b.name);
      if(state.sort==='category') return a.category.localeCompare(b.category)||a.id-b.id;
      if(state.sort==='price-low'||state.sort==='price-high') {
        if(a.price===null) return b.price===null?a.id-b.id:1;
        if(b.price===null) return -1;
        return (a.price-b.price)*(state.sort==='price-low'?1:-1)||a.id-b.id;
      }
      if(state.sort==='weight') return (a.weight_g??Infinity)-(b.weight_g??Infinity)||a.id-b.id;
      return a.id-b.id;
    });
    return results;
  }
  function card(p,i) {
    return `<article class="product${state.comparison.has(p.id)?' selected':''}" style="--i:${Math.min(i,5)}" data-product="${p.id}" aria-label="${esc(p.name)}">
      <div class="product-photo"><button class="image-button" data-action="detail" data-id="${p.id}" aria-label="View ${esc(p.name)}"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" decoding="async" width="300" height="300"></button><span class="photo-id">NO. ${String(p.id).padStart(2,'0')}</span><button class="save-btn" data-action="save" data-id="${p.id}" aria-pressed="${state.saved.has(p.id)}" aria-label="${state.saved.has(p.id)?'Remove from':'Save to'} my pack: ${esc(p.name)}">${icon('heart')}</button></div>
      <div class="product-info"><div class="product-meta"><span>${esc(p.category)}</span><span class="store-label">${p.store==='Amazon'?'AMZ':'ALI'}</span></div><h3><button data-action="detail" data-id="${p.id}">${esc(p.name)}</button></h3><p class="card-desc">${esc(p.description)}</p><div class="card-tags">${p.tags.slice(0,3).map(t=>`<button data-action="tag" data-tag="${esc(t)}">${esc(t)}</button>`).join('')}</div>
      <div class="card-price">${priceHTML(p)}<a class="store-link" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer" data-action="shop" aria-label="Open ${esc(p.name)} on ${p.store}">${p.store} ${icon('external')}</a></div>
      <div class="card-bottom"><button class="details-btn" data-action="detail" data-id="${p.id}">Field notes ${icon('arrow')}</button><label class="compare-check"><input type="checkbox" data-compare="${p.id}" aria-label="Compare ${esc(p.name)}" ${state.comparison.has(p.id)?'checked':''}> Compare</label></div></div></article>`;
  }
  function activeFilters() {
    const chips=[];
    if(state.category) chips.push(['category',state.category]);
    if(state.q) chips.push(['q','“'+state.q+'”']);
    if(state.savedOnly) chips.push(['savedOnly','Saved only']);
    if(state.shop) chips.push(['shop',state.shop]);
    if(state.brand) chips.push(['brand',state.brand]);
    if(state.price) chips.push(['price',$('#price-filter').selectedOptions[0].text]);
    let html=chips.map(([key,label])=>`<button class="active-tag" data-action="remove-filter" data-key="${key}">${esc(label)} ×</button>`).join('');
    html += [...state.tags].map(t=>`<button class="active-tag" data-action="tag" data-tag="${esc(t)}">${esc(t)} ×</button>`).join('');
    if(chips.length||state.tags.size) html+='<button class="text-btn" data-action="reset">Clear all</button>';
    $('#active-filters').innerHTML=html;
  }
  function render() {
    const focus=document.activeElement;const restore=focus?.closest('#tag-cloud,#category-nav,#active-filters,#gear-grid') ? {action:focus.dataset.action,tag:focus.dataset.tag,cat:focus.dataset.category,id:focus.dataset.id,key:focus.dataset.key} : null;
    shown=filtered();
    $('#shelf-title').textContent=state.category|| (state.savedOnly?'Your saved finds.':'All the good stuff.');
    $('#result-count').textContent=`${shown.length} / ${data.length} finds`;
    $('#gear-grid').innerHTML=shown.map(card).join('');
    $('#gear-grid').classList.toggle('list-view',state.view==='list');
    $('#empty').hidden=shown.length>0;
    $('#catalog-bottom-count').textContent=shown.length?`${shown.length} finds in this little corner of the woods.`:'The whole collection is one clear-all away.';
    $('#search-clear').hidden=!state.q;
    $('#saved-chip').setAttribute('aria-pressed',String(state.savedOnly));
    $$('.quickchip[data-tag]').forEach(b=>b.setAttribute('aria-pressed',String(state.tags.has(b.dataset.tag))));
    $$('[data-action="view"]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===state.view)));
    if(state.category&&guides[state.category]) { $('#category-guide').hidden=false;$('#guide-title').textContent=guides[state.category][0];$('#guide-text').textContent=guides[state.category][1]; }
    else $('#category-guide').hidden=true;
    activeFilters();renderCategories();renderTagCloud();syncCounts();syncMobileControls();
    if(restore?.action){const matches=$$('[data-action]').filter(b=>b.dataset.action===restore.action && b.dataset.tag===restore.tag && b.dataset.category===restore.cat && b.dataset.id===restore.id && b.dataset.key===restore.key);const next=matches.find(b=>b.offsetParent!==null);next?.focus({preventScroll:true});}
  }
  function syncControls() { $('#search').value=state.q;$('#store-filter').value=state.shop;$('#brand-filter').value=state.brand;$('#price-filter').value=state.price;$('#sort').value=state.sort; }
  function reset() {Object.assign(state,{q:'',category:'',shop:'',brand:'',price:'',savedOnly:false});state.tags.clear();$('#tag-search').value='';$('#category-guide').open=false;syncControls();render();}
  function syncCounts() {
    $('#dock-pack-count').textContent=state.saved.size;$('#dock-pack-count').hidden=!state.saved.size;
    $('#dock-compare-count').textContent=state.comparison.size;$('#dock-compare-count').hidden=!state.comparison.size;
    document.body.classList.toggle('has-comparison',state.comparison.size>0);
    $('#pack-nav-count').textContent=state.saved.size;$('#side-saved-count').textContent=state.saved.size;$('#compare-nav-count').textContent=state.comparison.size;
    $('#compare-tray').hidden=!state.comparison.size;$('#tray-count').textContent=`${state.comparison.size} / 4`;
    $('#tray-items').innerHTML=[...state.comparison].map(id=>`<button class="tray-thumb" data-action="compare-toggle" data-id="${id}" aria-label="Remove ${esc(byId.get(id).name)} from comparison"><img src="${esc(byId.get(id).image)}" alt=""></button>`).join('');
  }
  function syncSaveButtons(id) {
    $$(`[data-action="save"][data-id="${id}"]`).forEach(b=>{const on=state.saved.has(id);b.setAttribute('aria-pressed',String(on));b.setAttribute('aria-label',`${on?'Remove from':'Save to'} my pack: ${byId.get(id).name}`);if(b.classList.contains('detail-save')) b.innerHTML=icon('heart')+(b.closest('.detail-dock')?(on?'Saved':'Save'):(on?'Saved to my pack':'Save to my pack'));});
  }
  function save(id,target) {
    if(!byId.has(id))return;
    const was=state.saved.has(id);
    if(was){state.saved.delete(id);state.packed.delete(id);}else state.saved.add(id);
    persistPack();syncCounts();syncSaveButtons(id);
    if(!was){burst(target,state.saved.size===1?'first find! (≧◡≦)':'♡');sound('save');toast('Saved to your pack.');}else toast('Removed from your pack.');
    if(state.savedOnly)render();
    if($('#pack-dialog').open){const y=$('#pack-content').scrollTop;renderPack();$('#pack-content').scrollTop=y;}
  }
  function compareToggle(id,target) {
    if(!byId.has(id))return;
    if(state.comparison.has(id))state.comparison.delete(id);
    else if(state.comparison.size>=4){toast('Four finds fit in a comparison. Remove one to make room.');const c=$(`[data-compare="${id}"]`);if(c)c.checked=false;return;}
    else {state.comparison.add(id);burst(target);}
    syncCounts();$$('[data-compare]').forEach(c=>{c.checked=state.comparison.has(+c.dataset.compare);c.closest('.product')?.classList.toggle('selected',c.checked);});
    if($('#compare-dialog').open)renderComparison();
    if($('#detail-dialog').open&&lastDetail===id){const b=$('.detail-compare');if(b)b.textContent=state.comparison.has(id)?'Remove from comparison':'Add to comparison';}
  }
  /* Native dialogs + shallow history frames: Android Back, Escape and drill-down
     all restore the previous panel and its exact scroll position. */
  function bodyFor(dlg){ return $('.dialog-body',dlg); }
  function instantScroll(y){
    const root=document.documentElement,old=root.style.scrollBehavior;root.style.scrollBehavior='auto';
    window.scrollTo(0,y);root.style.scrollBehavior=old;
  }
  function lockPage(){
    if(frozenBody)return;
    const body=document.body, y=window.scrollY, gutter=Math.max(0,innerWidth-document.documentElement.clientWidth);
    frozenBody={y,css:body.style.cssText};
    body.style.position='fixed';body.style.top=-y+'px';body.style.left='0';body.style.right='0';
    body.style.width='100%';body.style.overflow='hidden';
    if(gutter)body.style.paddingRight=gutter+'px';
    body.classList.add('modal-open');
  }
  function unlockPage(){
    if(!frozenBody)return;
    const old=frozenBody;frozenBody=null;document.body.style.cssText=old.css;
    document.body.classList.remove('modal-open');instantScroll(old.y);
  }
  function captureFrame(){
    const frame=modalFrames.at(-1);if(!frame)return;
    const dlg=$('#'+frame.id);frame.scrollTop=bodyFor(dlg)?.scrollTop||0;
    if(frame.id==='detail-dialog')frame.detailId=lastDetail;
  }
  function historyPayload(){
    return {tlSession:historySession,views:modalFrames.map(f=>({...f}))};
  }
  function frameHash(frame){
    return frame.id==='detail-dialog'?'#item-'+frame.detailId:'#'+frame.id.replace('-dialog','');
  }
  function writeModalHistory(replace=false){
    if(!historyWorks)return;
    try{history[replace?'replaceState':'pushState'](historyPayload(),'',frameHash(modalFrames.at(-1)));}
    catch{historyWorks=false;}
  }
  function renderFrame(frame){
    if(frame.id==='detail-dialog')renderDetail(frame.detailId);
    if(frame.id==='pack-dialog')renderPack();
    if(frame.id==='compare-dialog')renderComparison();
  }
  function showFrame(frame,{rebuild=false}={}){
    if(rebuild)renderFrame(frame);
    $('#fx-layer')?.replaceChildren();
    const dlg=$('#'+frame.id);
    // Keep transient UI in the same native top layer as its active window.
    if($('#toast'))document.body.append($('#toast'),$('#fx-layer'));
    $$('dialog[open]').forEach(d=>d.close());
    lockPage();dlg.showModal();dlg.append($('#toast'),$('#fx-layer'));
    const back=$('.dialog-back',dlg);if(back)back.hidden=modalFrames.length<2;
    $('.dialog-close',dlg)?.focus({preventScroll:true});
    const scroll=bodyFor(dlg);if(scroll)scroll.scrollTop=frame.scrollTop||0;
    syncMobileControls();
  }
  function openDialog(id,{replace=false}={}){
    if(!$('#'+id))return;
    if(!modalFrames.length){focusReturn=document.activeElement;}
    captureFrame();
    if(modalFrames.length&&historyWorks){try{history.replaceState(historyPayload(),'');}catch{historyWorks=false;}}
    const frame={id,detailId:id==='detail-dialog'?lastDetail:null,scrollTop:0};
    const same=modalFrames.at(-1)?.id===id;
    if((replace||same)&&modalFrames.length)modalFrames[modalFrames.length-1]=frame;else modalFrames.push(frame);
    showFrame(frame);writeModalHistory(replace||same);
  }
  function finishClosing(){
    document.body.append($('#toast'),$('#fx-layer'));
    $$('dialog[open]').forEach(d=>d.close());unlockPage();syncMobileControls();
    if(focusReturn?.isConnected&&focusReturn.getClientRects().length)focusReturn.focus({preventScroll:true});
    else $('#catalog').focus({preventScroll:true});
    if(afterClose){const next=afterClose;afterClose=null;next();}
  }
  function goBackWindows(all=false,callback=null){
    if(!modalFrames.length){callback?.();return;}
    if(callback)afterClose=callback;
    const count=all?modalFrames.length:1;
    if(historyWorks&&history.state?.tlSession===historySession){history.go(-count);return;}
    modalFrames.splice(Math.max(0,modalFrames.length-count));
    if(modalFrames.length)showFrame(modalFrames.at(-1),{rebuild:true});else finishClosing();
  }
  function closeDialog(){goBackWindows(false);}
  function closeAllDialogs(callback=null){goBackWindows(true,callback);}
  window.addEventListener('popstate',e=>{
    const views=e.state?.tlSession===historySession&&Array.isArray(e.state.views)?e.state.views:[];
    modalFrames=views.filter(f=>typeof f.id==='string'&&$('#'+f.id)?.tagName==='DIALOG').map(f=>({...f}));
    if(modalFrames.length)showFrame(modalFrames.at(-1),{rebuild:true});else finishClosing();
  });
  $$('dialog').forEach(dlg=>{
    dlg.addEventListener('cancel',e=>{e.preventDefault();closeDialog();});
    let backdropDown=false;
    dlg.addEventListener('pointerdown',e=>{const r=dlg.getBoundingClientRect();backdropDown=e.target===dlg&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom);});
    dlg.addEventListener('pointercancel',()=>{backdropDown=false;});
    dlg.addEventListener('click',e=>{if(backdropDown&&e.target===dlg){backdropDown=false;closeDialog();}});
  });
  function renderDetail(id) {
    const p=byId.get(id);if(!p)return;lastDetail=id;
    $('#detail-window-title').textContent=`${String(id).padStart(2,'0')} / ${p.category.toLowerCase()} / field notes`;
    const before=state.saved.has(id);
    $('#detail-content').innerHTML=`<div class="detail-layout"><div class="detail-picture"><img src="${esc(p.image)}" alt="${esc(p.name)}" width="500" height="500"></div><div class="detail-text"><span class="mono">${esc(p.brand)} · NO. ${String(id).padStart(2,'0')}</span><h2 id="detail-title">${esc(p.name)}</h2><p class="desc">${esc(p.description)}</p><div class="detail-taglist">${p.tags.map(t=>`<button class="tagbtn" data-action="detail-tag" data-tag="${esc(t)}">${esc(t)}</button>`).join('')}</div><div class="detail-price">${priceHTML(p)}<small>${p.price!==null?`Recorded ${dateLabel(p.priceDate)}. `:''}${esc(p.priceNote)}</small></div><div class="detail-actions"><a class="btn primary" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">Open ${p.store} ${icon('external')}</a><button class="btn detail-save" data-action="save" data-id="${id}" aria-pressed="${before}">${icon('heart')}${before?'Saved to my pack':'Save to my pack'}</button></div><div class="detail-secondary"><button class="text-btn detail-compare" data-action="compare-toggle" data-id="${id}">${state.comparison.has(id)?'Remove from comparison':'Add to comparison'}</button><button class="text-btn" data-action="share-item" data-id="${id}">Copy this find</button></div></div></div><div class="detail-more"><div class="note"><strong>Before you choose.</strong> ${esc(p.note)}</div><div class="detail-columns"><section class="detail-section"><h3>01 / THE DETAILS</h3>${specList(p)}<p><strong>The role it fills:</strong> ${esc(p.why)}</p><p class="mono">Specs are listing/brand information, not independent measurements.</p></section><section class="detail-section"><h3>02 / SOURCES & CHECKS</h3><p><strong>Stock:</strong> ${esc(p.availability)}.</p><p>${esc(p.audit)}</p>${sourceLinks(p)}</section></div>${p.related.length?`<section class="detail-section"><h3>03 / NEARBY IN THE COLLECTION</h3><div class="related">${p.related.map(n=>byId.get(n)).map(r=>`<button data-action="detail" data-id="${r.id}"><img src="${esc(r.image)}" alt="" loading="lazy"><span>${esc(r.name)}</span></button>`).join('')}</div></section>`:''}</div>`;
    $('#detail-dock').innerHTML=`<a class="btn primary" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">Open ${p.store} ${icon('external')}</a><button class="btn detail-save" data-action="save" data-id="${id}" aria-pressed="${before}">${icon('heart')}${before?'Saved':'Save'}</button>`;
    updateDetailPosition();
  }
  function openDetail(id,{replace=false,sequence=false}={}){
    if(!byId.has(id))return;
    if(!sequence)detailSequence=(shown.some(p=>p.id===id)?shown:data).map(p=>p.id);
    renderDetail(id);openDialog('detail-dialog',{replace});
  }
  function updateDetailPosition(){
    if(!detailSequence.includes(lastDetail))detailSequence=data.map(p=>p.id);
    const index=detailSequence.indexOf(lastDetail);
    $('#detail-position').textContent=`${index+1} / ${detailSequence.length} finds`;
    $('[data-action="previous-item"]').disabled=index<=0;
    $('[data-action="next-item"]').disabled=index>=detailSequence.length-1;
  }
  function adjacentDetail(step){
    const next=detailSequence[detailSequence.indexOf(lastDetail)+step];
    if(next){openDetail(next,{replace:true,sequence:true});sound();}
  }
  function packItems(){return data.filter(p=>state.saved.has(p.id));}
  function renderPack() {
    const items=packItems(), known=items.filter(p=>p.price!==null), weights=items.filter(p=>p.weight_g!==null), packed=items.filter(p=>state.packed.has(p.id)).length;
    const subtotal=known.reduce((s,p)=>s+p.price,0),weight=weights.reduce((s,p)=>s+p.weight_g,0);
    $('#pack-content').innerHTML=`<h2 class="dialog-heading" id="pack-title">Your little escape kit.</h2><p class="dialog-intro">${storageOK?'Saved on this browser.':'Browser storage is unavailable; export a backup before leaving.'} Heart things to keep them here. Tick what’s packed. Send the shortlist to a friend.</p>${items.length?`<div class="pack-stats"><div><b>${packed} / ${items.length}</b><span>checked as packed</span></div><div><b>${known.length?money(subtotal):'—'}</b><span>partial price record · ${items.length-known.length} unknown</span></div><div><b>${weights.length?(weight/1000).toFixed(2)+' kg':'—'}</b><span>listed-weight subtotal · ${items.length-weights.length} unknown</span></div></div><p class="pack-foot">The price subtotal combines brand references and shared snapshots, not live checkout prices. The weight subtotal only includes supplied weights and may mix packed/minimum weights. Neither is a complete trip total.</p><div class="pack-rows">${items.map(p=>`<div class="pack-row ${state.packed.has(p.id)?'packed':''}"><label><span class="sr">Mark ${esc(p.name)} packed</span><input type="checkbox" data-packed="${p.id}" ${state.packed.has(p.id)?'checked':''}></label><img class="thumb" src="${esc(p.image)}" alt=""><div><h3><button data-action="detail" data-id="${p.id}">${esc(p.name)}</button></h3><div class="row-note">${p.price!==null?money(p.price)+' · '+provenance(p):'Price unverified'} · ${esc(p.category)}</div></div><button class="remove-btn" data-action="save" data-id="${p.id}" aria-label="Remove ${esc(p.name)} from pack">×</button></div>`).join('')}</div><div class="pack-actions"><button class="btn primary" data-action="share-pack">${icon('external')}Share pack</button><button class="btn" data-action="copy-pack">Copy list</button><button class="btn" data-action="download-pack">Save as text</button></div>`:`<div class="empty"><div class="kaomoji">(=^･ω･^=)</div><h3>A little room for adventure.</h3><p>Your pack is empty. Save a few finds with the heart buttons, then come back to make your shortlist.</p><button class="btn primary" data-action="close">Go find some gear</button></div>`}<div class="backup-actions"><button data-action="export-pack">Export pack backup</button><button data-action="import-pack">Import pack backup</button>${items.length?'<button data-action="uncheck-pack">Uncheck packed items</button>':''}</div><p class="pack-foot">Import merges with your saved finds. Backups contain item numbers and checkmarks, not personal details.</p>`;
  }
  function packText() {
    const items=packItems();
    return `tonys list — my gear shortlist\n${items.length} saved finds · prices are references/snapshots, not live quotes\n\n`+items.map(p=>`${state.packed.has(p.id)?'[x]':'[ ]'} ${p.name}\n${p.price!==null?money(p.price)+' — '+provenance(p)+' ('+dateLabel(p.priceDate)+')':'Price: check store'}\n${p.url}`).join('\n\n');
  }
  function renderComparison() {
    const items=[...state.comparison].map(id=>byId.get(id));
    const row=(label,fn)=>`<tr><th scope="row">${label}</th>${items.map(p=>`<td>${fn(p)}</td>`).join('')}</tr>`;
    $('#compare-content').innerHTML=`<h2 class="dialog-heading" id="compare-title">A little side by side.</h2><p class="dialog-intro">Up to four finds. Same-category comparisons are usually more useful. Unverified numbers stay unverified.</p>${items.length?`<div class="compare-mode" role="group" aria-label="Comparison layout"><button data-action="compare-mode" data-mode="cards" aria-pressed="${compareMode==='cards'}">Swipe cards</button><button data-action="compare-mode" data-mode="table" aria-pressed="${compareMode==='table'}">Full table</button></div>${comparisonCards(items)}<div class="compare-scroll" id="comparison-table" ${compareMode!=='table'?'hidden':''} style="--compare-cols:${items.length}" tabindex="0" role="region" aria-label="Product comparison, scroll horizontally for all columns"><table class="compare-table"><tbody>${row('The finds',p=>`<img src="${esc(p.image)}" alt=""><h3>${esc(p.name)}</h3><small>${esc(p.category)}</small><button class="text-btn" data-action="compare-toggle" data-id="${p.id}">Remove</button>`)}${row('Price record',p=>priceHTML(p)+`<small>${esc(p.priceNote)}</small>`)}${row('Listed weight',p=>p.weight_g===null?'Not supplied':`${p.weight_g} g<small>Supplied listing / brand figure. See details for packed vs minimum.</small>`)}${row('What it does',p=>esc(p.description))}${row('Specs',p=>specList(p))}${row('The tradeoff',p=>esc(p.note))}${row('Sources',p=>`<button class="text-btn" data-action="detail" data-id="${p.id}">View field notes</button>`)}${row('Original link',p=>`<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer" class="btn">${p.store} ↗</a>`)}</tbody></table></div><p class="pack-foot">Swipe the cards or switch to the full table. The table scrolls sideways; its row labels stay in place. Reference prices can be from different sellers, dates or options; they are not matched quotes.</p>`:'<div class="empty"><div class="kaomoji">(・ω・)ノ</div><h3>Pick a pair. Or four.</h3><p>Use the Compare checkbox on a find to put it on this table.</p><button class="btn primary" data-action="close">Back to the finds</button></div>'}`;
  }
  function comparisonCards(items){
    return `<div id="comparison-cards" ${compareMode!=='cards'?'hidden':''}><div class="compare-card-track" id="compare-card-track" tabindex="0" role="region" aria-label="Swipe horizontally between compared products">${items.map(p=>`<article class="compare-card"><img class="compare-card-photo" src="${esc(p.image)}" alt="${esc(p.name)}"><h3>${esc(p.name)}</h3><p class="compare-category">${esc(p.category)} · NO. ${String(p.id).padStart(2,'0')}</p><div class="compare-card-price">${priceHTML(p)}<small>${esc(p.priceNote)}</small></div><h4>LISTED WEIGHT</h4><p>${p.weight_g===null?'Not supplied':p.weight_g+' g — supplied listing / brand figure.'}</p><h4>WHAT IT DOES</h4><p>${esc(p.description)}</p><details><summary>All listed specifications</summary>${specList(p)}</details><h4>THE TRADEOFF</h4><p>${esc(p.note)}</p><div class="compare-card-actions"><a class="btn primary" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${p.store} ↗</a><button class="btn" data-action="detail" data-id="${p.id}">Field notes</button></div><button class="text-btn" data-action="compare-toggle" data-id="${p.id}">Remove from comparison</button></article>`).join('')}</div><div class="compare-card-nav"><button data-action="compare-step" data-step="-1" aria-label="Previous compared product" disabled>←</button><span id="compare-position">1 / ${items.length} · swipe to compare</span><button data-action="compare-step" data-step="1" aria-label="Next compared product" ${items.length<2?'disabled':''}>→</button></div></div>`;
  }
  function syncComparePosition(){
    const track=$('#compare-card-track');if(!track)return;
    const cards=$$('.compare-card',track);let index=0,min=Infinity;
    cards.forEach((card,i)=>{const d=Math.abs(card.getBoundingClientRect().left-track.getBoundingClientRect().left);if(d<min){min=d;index=i;}});
    if($('#compare-position'))$('#compare-position').textContent=`${index+1} / ${cards.length} · swipe to compare`;
    const prev=$('[data-action="compare-step"][data-step="-1"]'),next=$('[data-action="compare-step"][data-step="1"]');
    if(prev)prev.disabled=index<=0;if(next)next.disabled=index>=cards.length-1;
  }
  let compareRaf=0;
  document.addEventListener('scroll',e=>{
    if(e.target.id==='compare-card-track'&&!compareRaf)compareRaf=requestAnimationFrame(()=>{compareRaf=0;syncComparePosition();});
  },true);
  async function copyText(text,label='Copied. Ready to send.') {
    try {if(!navigator.clipboard?.writeText)throw Error('unavailable');await navigator.clipboard.writeText(text);toast(label);}
    catch {$('#share-text').value=text;openDialog('share-dialog');$('#share-text').focus();$('#share-text').select();}
  }
  function download(name,text,type='text/plain;charset=utf-8') {
    const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  async function sharePack() {
    const text=packText();
    if(navigator.share){try{await navigator.share({title:'tonys list — my pack',text});return;}catch(e){if(e.name==='AbortError')return;}}
    copyText(text,'Pack copied. Send it to a friend.');
  }
  async function importFile(file) {
    if(!file)return;
    if(file.size>100000){toast('That file is too large for a pack backup.');return;}
    try {
      const obj=JSON.parse(await file.text());if(obj.format!=='tonys-list-pack'||obj.version!==1||!Array.isArray(obj.saved))throw Error('format');
      const imported=validIds(obj.saved); imported.forEach(id=>state.saved.add(id));validIds(obj.packed).filter(id=>state.saved.has(id)).forEach(id=>state.packed.add(id));
      persistPack();render();renderPack();openDialog('pack-dialog');toast(`Merged ${imported.length} saved finds. Your existing pack is still here.`);
    } catch {toast('That is not a tonys list pack backup. Choose the exported JSON file.');}
  }
  function filterCount(){return (state.category?1:0)+(state.shop?1:0)+(state.brand?1:0)+(state.price?1:0)+(state.savedOnly?1:0)+state.tags.size;}
  function syncMobileControls(){
    const count=filterCount();
    $('#mobile-category-label').textContent=state.category||'Everything';
    $('#mobile-result-count').textContent=`${shown.length} finds`;
    ['filter-count','dock-filter-count'].forEach(id=>{const el=$('#'+id);el.textContent=count;el.hidden=!count;});
    $('#show-results').innerHTML=`Show ${shown.length} ${shown.length===1?'find':'finds'} ${icon('arrow')}`;
    const filtersOpen=mobileLayout.matches?$('#filters-dialog').open:!$('#filter-panel').hidden;
    $('#filter-open').setAttribute('aria-expanded',String(filtersOpen));
    $('#filter-open').setAttribute('aria-controls',mobileLayout.matches?'filters-dialog':'filter-panel');
    if(mobileLayout.matches)$('#filter-open').setAttribute('aria-haspopup','dialog');else $('#filter-open').removeAttribute('aria-haspopup');
  }
  function moveResponsivePanels(){
    const mobile=mobileLayout.matches,side=$('.sidebar'),panel=$('#filter-panel');
    (mobile?$('#browse-body'):$('#sidebar-home')).append(side);
    (mobile?$('#filter-body'):$('#filter-home')).append(panel);
    panel.hidden=!mobile;
    const scroll=$('#sidebar-scroll');
    if(mobile){scroll.removeAttribute('tabindex');scroll.setAttribute('aria-label','Categories and saved finds');}
    else{scroll.tabIndex=0;scroll.setAttribute('aria-label','Categories and saved finds, independently scrollable');}
    state.view=mobile?(prefs.mobileView==='grid'?'grid':'list'):(prefs.desktopView==='list'?'list':'grid');
    $$('[data-action="view"]').forEach(b=>b.setAttribute('aria-label',b.dataset.view==='list'?'Comfortable list view':'Compact grid view'));
    if(!mobile&&['browse-dialog','filters-dialog'].includes(modalFrames.at(-1)?.id))closeAllDialogs();
    render();syncViewport();
  }
  function openFilters(){
    if(mobileLayout.matches){$('#filter-panel').hidden=false;openDialog('filters-dialog');}
    else{const panel=$('#filter-panel');panel.hidden=!panel.hidden;syncMobileControls();if(!panel.hidden)$('#store-filter').focus({preventScroll:true});}
    sound();
  }
  function syncViewport(){
    const v=window.visualViewport,root=document.documentElement;
    root.style.setProperty('--visual-height',(v?.height||innerHeight)+'px');
    root.style.setProperty('--visual-top',(v?.offsetTop||0)+'px');
    const keyboard=!!(mobileLayout.matches&&v&&innerHeight-v.height>140&&v.scale<1.1);
    document.body.classList.toggle('keyboard-open',keyboard);
    const controls=$('#catalog-controls');root.style.setProperty('--control-h',mobileLayout.matches?Math.ceil(controls.getBoundingClientRect().height)+'px':'0px');
  }
  let viewportRaf=0;
  const scheduleViewport=()=>{if(!viewportRaf)viewportRaf=requestAnimationFrame(()=>{viewportRaf=0;syncViewport();});};
  window.visualViewport?.addEventListener('resize',scheduleViewport,{passive:true});
  window.visualViewport?.addEventListener('scroll',scheduleViewport,{passive:true});
  window.addEventListener('resize',scheduleViewport,{passive:true});
  if('ResizeObserver' in window)new ResizeObserver(scheduleViewport).observe($('#catalog-controls'));
  mobileLayout.addEventListener?.('change',moveResponsivePanels);
  $('#search').addEventListener('keydown',e=>{if(e.key==='Enter'){clearTimeout(debounce);render();e.target.blur();jumpToShelf(true);}});
  function jumpToShelf(force=false){
    const target=$('.shelf-heading'),r=target.getBoundingClientRect();
    if(force||r.top<0||r.top>innerHeight*.6){
      const top=r.top+window.scrollY-$('.topbar').getBoundingClientRect().height-8;
      window.scrollTo({top:Math.max(0,top),behavior:motionOn()?'smooth':'instant'});
    }
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-action]');if(!b)return;
    const action=b.dataset.action,id=Number(b.dataset.id);
    // Keep frequent controls responsive; no audio on typing or scroll gestures.
    if(['settings','motion','close','back','show-results','previous-item','next-item','about',
        'saved-only','remove-filter','view','compare-toggle','clear-compare','compare-mode',
        'compare-step','copy-pack','share-pack','download-pack','export-pack','import-pack',
        'uncheck-pack','share-item','select-share'].includes(action))sound();
    switch(action){
      case 'detail':openDetail(id);sound();break;
      case 'save':save(id,b);break;
      case 'shop':sound();break;
      case 'random':openDetail((shown.length?shown:data)[Math.floor(Math.random()*(shown.length||data.length))].id);sound('pet');burst(b);break;
      case 'pet':pet(b);break;
      case 'theme':state.theme=state.theme==='day'?'night':'day';updatePreferences();sound();burst(b);break;
      case 'settings':openDialog('settings-dialog');break;
      case 'motion':state.motion=!state.motion;updatePreferences();break;
      case 'sound':state.sound=!state.sound;updatePreferences();sound('save');break;
      case 'close':closeAllDialogs();break;
      case 'back':closeDialog();break;
      case 'browse':openDialog('browse-dialog');sound();break;
      case 'show-results':closeAllDialogs(()=>jumpToShelf(true));break;
      case 'previous-item':adjacentDetail(-1);break;
      case 'next-item':adjacentDetail(1);break;
      case 'about':openDialog('about-dialog');break;
      case 'filters':openFilters();break;
      case 'category':burst(b,'✧');state.category=b.dataset.category;$('#category-guide').open=false;render();if($('#browse-dialog').open)closeAllDialogs(()=>jumpToShelf(true));else jumpToShelf(true);sound();break;
      case 'tag':{burst(b);const tag=b.dataset.tag;state.tags.has(tag)?state.tags.delete(tag):state.tags.add(tag);render();sound();break;}
      case 'detail-tag':{reset();state.tags.add(b.dataset.tag);render();closeAllDialogs(()=>jumpToShelf(true));break;}
      case 'saved-only':state.savedOnly=!state.savedOnly;render();if($('#browse-dialog').open)closeAllDialogs(()=>jumpToShelf(true));else jumpToShelf();break;
      case 'remove-filter':state[b.dataset.key]=b.dataset.key==='savedOnly'?false:'';syncControls();render();break;
      case 'reset':reset();sound();break;
      case 'clear-search':state.q='';$('#search').value='';render();$('#search').focus();break;
      case 'view':state.view=b.dataset.view==='list'?'list':'grid';persistPrefs();render();break;
      case 'open-pack':renderPack();openDialog('pack-dialog');sound();break;
      case 'compare-toggle':compareToggle(id,b);break;
      case 'open-compare':renderComparison();openDialog('compare-dialog');sound();break;
      case 'clear-compare':state.comparison.clear();render();break;
      case 'compare-mode':compareMode=b.dataset.mode==='cards'?'cards':'table';renderComparison();break;
      case 'compare-step':{const track=$('#compare-card-track');if(track){const card=$('.compare-card',track);track.scrollBy({left:(card.getBoundingClientRect().width+12)*Number(b.dataset.step),behavior:motionOn()?'smooth':'instant'});}break;}
      case 'copy-pack':copyText(packText(),'Pack copied. Ready for the group chat.');break;
      case 'share-pack':sharePack();break;
      case 'download-pack':download('tonys-list-my-pack.txt',packText());toast('Pack text file saved.');break;
      case 'export-pack':download('tonys-list-pack-backup.json',JSON.stringify({format:'tonys-list-pack',version:1,saved:[...state.saved],packed:[...state.packed]},null,2),'application/json');break;
      case 'import-pack':$('#import-file').click();break;
      case 'uncheck-pack':state.packed.clear();persistPack();renderPack();toast('Checkmarks cleared. Your saved finds are still here.');break;
      case 'share-item':{const p=byId.get(id);copyText(`tonys list · #${p.id}\n${p.name}\n${p.url}\n${p.price!==null?money(p.price)+' — '+provenance(p)+', '+dateLabel(p.priceDate)+'. Not a live quote.':'Check the store for current price.'}`);break;}
      case 'select-share':$('#share-text').focus();$('#share-text').select();break;
    }
  });
  document.addEventListener('change',e=>{
    if(e.target.matches('[data-compare]')){compareToggle(+e.target.dataset.compare,e.target);sound();}
    if(e.target.matches('[data-packed]')){const id=+e.target.dataset.packed,on=e.target.checked;if(on)state.packed.add(id);else state.packed.delete(id);persistPack();const scroll=$('#pack-content').scrollTop;renderPack();$('#pack-content').scrollTop=scroll;$(`[data-packed="${id}"]`)?.focus({preventScroll:true});if(on){sound('save');toast('One more thing packed.');}}
  });
  let debounce;
  $('#search').addEventListener('input',e=>{state.q=e.target.value;clearTimeout(debounce);debounce=setTimeout(render,80);});
  $('#tag-search').addEventListener('input',renderTagCloud);
  [['#store-filter','shop'],['#brand-filter','brand'],['#price-filter','price'],['#sort','sort']].forEach(([selector,key])=>$(selector).addEventListener('change',e=>{state[key]=e.target.value;render();}));
  $('#import-file').addEventListener('change',e=>{importFile(e.target.files[0]);e.target.value='';});
  $('#brand-filter').innerHTML='<option value="">Every brand</option>'+[...new Set(data.map(p=>p.brand))].sort((a,b)=>a.localeCompare(b)).map(brand=>`<option value="${esc(brand)}">${esc(brand)}</option>`).join('');
  document.addEventListener('keydown',e=>{
    if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.target.matches('input,textarea,select,[contenteditable]')&&!$('dialog[open]')){e.preventDefault();$('#search').focus();jumpToShelf();}
  });
  const initialItem=location.hash.match(/^#item-(\d+)$/);
  updatePreferences();moveResponsivePanels();render();syncViewport();
  if(initialItem&&byId.has(+initialItem[1])){
    try{history.replaceState(null,'','#catalog');}catch{historyWorks=false;}
    openDetail(+initialItem[1]);
  }
  setTimeout(()=>document.body.classList.remove('welcome'),900);
  // Small introspection surface for deterministic build QA, without personal data.
  window.TonysList={version:'2.0.0',getCatalog:()=>data.map(p=>({...p})),getVisibleIds:()=>shown.map(p=>p.id)};
})();
