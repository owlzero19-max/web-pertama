// Data: materials with Indonesian names and emojis
const DATA = {
	huruf: Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
	hewan: [
		{name:'Ayam', emoji:'🐔'}, {name:'Bebek', emoji:'🦆'}, {name:'Sapi', emoji:'🐄'}, {name:'Kuda', emoji:'🐎'},
		{name:'Kelinci', emoji:'🐰'}, {name:'Tikus', emoji:'🐭'}, {name:'Anjing', emoji:'🐶'}, {name:'Babi', emoji:'🐷'},
		{name:'Unta', emoji:'🐪'}, {name:'Burung', emoji:'🐦'}, {name:'Katak', emoji:'🐸'}, {name:'Buaya', emoji:'🐊'},
		{name:'Kupu-kupu', emoji:'🦋'}, {name:'Kecoa', emoji:'🪳'}, {name:'Nyamuk', emoji:'🦟'}, {name:'Gajah', emoji:'🐘'},
		{name:'Harimau', emoji:'🐯'}, {name:'Ikan', emoji:'🐟'}, {name:'Jerapah', emoji:'🦒'}, {name:'Kucing', emoji:'🐱'},
		{name:'Lumba-lumba', emoji:'🐬'}, {name:'Monyet', emoji:'🐵'}, {name:'Orangutan', emoji:'🦧'}, {name:'Panda', emoji:'🐼'},
		{name:'Rusa', emoji:'🦌'}, {name:'Singa', emoji:'🦁'}, {name:'Tupai', emoji:'🐿️'}, {name:'Ular', emoji:'🐍'},
		{name:'Zebra', emoji:'🦓'}
	],
	warna: [
		{name:'Merah', code:'#ff0000ff'}, {name:'Kuning', code:'#ffd900ff'}, {name:'Biru', code:'#0077ffff'},
		{name:'Hijau', code:'#22ce00ff'}, {name:'Ungu', code:'#9729f1ff'}, {name:'Oranye', code:'#ff7300ff'},
		{name:'Pink', code:'#ff6bcb'}, {name:'Cokelat', code:'#8d6e63'}, {name:'Abu-abu', code:'#6c757d'},
		{name:'Hitam', code:'#000000ff'}, {name:'Putih', code:'#ffffff'}
	],
	bentuk: [
 		{name:'Lingkaran', shape:'circle', emoji:'⚫'}, {name:'Segitiga', shape:'triangle', emoji:'🔺'},
 		{name:'Persegi', shape:'square', emoji:'◻️'}, {name:'Bintang', shape:'star', emoji:'⭐'},
 		{name:'Hati', shape:'heart', emoji:'❤️'}, {name:'Belah Ketupat', shape:'diamond', emoji:'🔷'},
 		{name:'Bulan', shape:'crescent', emoji:'🌙'}
	]
	,angka: [
		{num:1,name:'Satu'},{num:2,name:'Dua'},{num:3,name:'Tiga'},{num:4,name:'Empat'},{num:5,name:'Lima'},
		{num:6,name:'Enam'},{num:7,name:'Tujuh'},{num:8,name:'Delapan'},{num:9,name:'Sembilan'},{num:10,name:'Sepuluh'}
	]
};

// DOM
const materialSelect = document.getElementById('materialSelect');
const learnView = document.getElementById('learnView');
const playView = document.getElementById('playView');
const learnContent = document.getElementById('learnContent');
const playContent = document.getElementById('playContent');
const learnTitle = document.getElementById('learnTitle');
const playTitle = document.getElementById('playTitle');
const startBtn = document.getElementById('startBtn');
const scoreEl = document.getElementById('score');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const closeModalBtn = document.getElementById('closeModal');
const playSpeechBtn = document.getElementById('playSpeech');
const cardTpl = document.getElementById('cardTpl');
const navBtns = document.querySelectorAll('.nav-btn');

let audioCtx = null;
let score = 0;
let current = null;
let speechVoice = null;
let uploadedAudio = {};
let audioElements = {};
// No upload files — using SpeechSynthesis TTS only

// Audio helpers
function ensureAudio(){ if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }
function playTone(freqs, type='sine', duration=0.25){ ensureAudio(); const t=audioCtx.currentTime; freqs.forEach(f=>{ const o=audioCtx.createOscillator(); const g=audioCtx.createGain(); o.type=type; o.frequency.value=f; g.gain.value=0.08; o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t+duration); }); }
function playCorrect(){ ensureAudio(); const now = audioCtx.currentTime; const o1=audioCtx.createOscillator(), o2=audioCtx.createOscillator(), g=audioCtx.createGain(); o1.type='sine'; o2.type='sine'; o1.frequency.value=660; o2.frequency.value=880; g.gain.value=0.12; o1.connect(g); o2.connect(g); g.connect(audioCtx.destination); o1.start(now); o2.start(now); g.gain.exponentialRampToValueAtTime(0.0001, now+0.6); o1.stop(now+0.6); o2.stop(now+0.6); }
function playCorrectAsync(){ playCorrect(); return new Promise(res=> setTimeout(res, 700)); }

// play wrong audio file if uploaded
function playWrong(){ ensureAudio(); const now=audioCtx.currentTime; const o=audioCtx.createOscillator(), g=audioCtx.createGain(); o.type='square'; o.frequency.value=160; g.gain.value=0.18; o.connect(g); g.connect(audioCtx.destination); o.start(now); g.gain.exponentialRampToValueAtTime(0.0001, now+0.35); o.stop(now+0.35); }
function playWrongAsync(){ playWrong(); return new Promise(res=> setTimeout(res, 420)); }

// Speech (Indonesian female-cheerful preference)
function initVoices(){
	const voices = speechSynthesis.getVoices();
	if(!voices || voices.length===0) return;

	// Preferred selection order:
	// 1) voice.lang contains 'id' and voice name suggests female/wanita/indonesia
	// 2) voice.lang contains 'id'
	// 3) any voice whose name suggests a female voice
	// 4) fallback to first available
	const byLangIdAndFemale = voices.find(v=>/id/.test(v.lang) && /wanita|female|woman|indonesia|indonesian|google/i.test(v.name));
	const byLangId = voices.find(v=>/id/.test(v.lang));
	const byFemaleName = voices.find(v=>/female|woman|wanita/i.test(v.name));
	speechVoice = byLangIdAndFemale || byLangId || byFemaleName || voices[0];
}
function speak(text){ if(!('speechSynthesis' in window)) return; speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang='id-ID'; if(speechVoice) u.voice = speechVoice; u.rate=0.95; u.pitch=1.45; speechSynthesis.speak(u); }
function speakAsync(text){ return new Promise(resolve=>{ if(!('speechSynthesis' in window)){ resolve(); return; } speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang='id-ID'; if(speechVoice) u.voice = speechVoice; u.rate=0.95; u.pitch=1.45; u.onend = resolve; u.onerror = resolve; speechSynthesis.speak(u); }); }
window.speechSynthesis.onvoiceschanged = initVoices;

// Navigation
document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click', ()=>{ navBtns.forEach(n=>n.classList.remove('active')); b.classList.add('active'); const view = b.dataset.view; if(view==='learn'){ learnView.classList.remove('hidden'); playView.classList.add('hidden'); } else { learnView.classList.add('hidden'); playView.classList.remove('hidden'); }}));

// Material change
function renderLearn(){ const m = materialSelect.value; learnTitle.textContent = 'Belajar: ' + capitalize(m);
	learnContent.innerHTML='';
	if(m==='huruf'){
		DATA.huruf.forEach(l=>{ const node = cardTpl.content.cloneNode(true); node.querySelector('.big').textContent = l; node.querySelector('.label').textContent = `Huruf ${l}`; node.querySelector('.card').addEventListener('click', ()=>{ speak(l); showModal(l, l); }); learnContent.appendChild(node); });
	} else if(m==='hewan'){
		// DATA.hewan is now an array
		DATA.hewan.forEach(a=>{ const node = cardTpl.content.cloneNode(true); node.querySelector('.big').textContent = a.emoji; node.querySelector('.label').textContent = a.name; node.querySelector('.card').addEventListener('click', ()=>{ speak(a.name); showModal(a.name, a.emoji); }); learnContent.appendChild(node); });
	} else if(m==='warna'){
		DATA.warna.forEach(c=>{ const node = cardTpl.content.cloneNode(true); node.querySelector('.big').innerHTML = `<div style="width:64px;height:64px;background:${c.code};border-radius:12px"></div>`; node.querySelector('.label').textContent = c.name; node.querySelector('.card').addEventListener('click', ()=>{ speak(c.name); showModal(c.name, '') }); learnContent.appendChild(node); });
	} else if(m==='bentuk'){
		DATA.bentuk.forEach(s=>{ const node = cardTpl.content.cloneNode(true); node.querySelector('.big').textContent = s.emoji; node.querySelector('.label').textContent = s.name; node.querySelector('.card').addEventListener('click', ()=>{ speak(s.name); showModal(s.name, s.emoji); }); learnContent.appendChild(node); });
	} else if(m==='angka'){
		DATA.angka.forEach(n=>{ const node = cardTpl.content.cloneNode(true); node.querySelector('.big').textContent = n.num; node.querySelector('.label').textContent = `${n.name} (${n.num})`; node.querySelector('.card').addEventListener('click', ()=>{ speak(n.name); showModal(n.name, n.num); }); learnContent.appendChild(node); });
	}
}

materialSelect.addEventListener('change', ()=>{ renderLearn(); renderPlayTitle(); });

function renderPlayTitle(){ const m = materialSelect.value; playTitle.textContent = `Main: ${capitalize(m)}`; }

// Modal
function showModal(title, body){ modal.setAttribute('aria-hidden','false'); modal.style.display='flex'; modalBody.innerHTML = `<div style="text-align:center;font-size:36px">${body}</div><div style="text-align:center;margin-top:8px;font-weight:800">${title}</div>`; playSpeechBtn.onclick = ()=> speak(title); speak(title); }
closeModalBtn.addEventListener('click', ()=>{ modal.setAttribute('aria-hidden','true'); modal.style.display='none'; });
modal.addEventListener('click', e=>{ if(e.target===modal) closeModalBtn.click(); });

// Game logic: generic per material
function startGame(){ score = 0; updateScore(); startBtn.textContent='Mulai lagi'; nextQuestion(); }
function updateScore(){ scoreEl.textContent = score; }

function nextQuestion(){ const m = materialSelect.value; if(m==='huruf') questionLetter(); else if(m==='hewan') questionAnimal(); else if(m==='warna') questionColor(); else if(m==='bentuk') questionShape(); else if(m==='angka') questionNumber(); }

function shuffle(a){ return a.slice().sort(()=>0.5-Math.random()); }

function questionLetter(){ const letters = DATA.huruf; const correct = letters[Math.floor(Math.random()*letters.length)]; current = {type:'huruf', correct};
	playContent.innerHTML=''; const prompt = document.createElement('div'); prompt.innerHTML=`<div style="font-size:48px;font-weight:900">Pilih huruf:</div><div style="font-size:64px">${correct}</div>`; playContent.appendChild(prompt);
	// ensure correct is included
	const others = shuffle(letters.filter(l=>l!==correct)).slice(0,2);
	const choices = shuffle([correct, ...others]); const grid=document.createElement('div'); grid.className='choice-grid'; choices.forEach(ch=>{ const b=document.createElement('button'); b.className='choice'; b.dataset.value = ch; if(ch===correct) b.dataset.correct='true'; b.innerHTML=`<div class="emoji" style="font-size:44px">${ch}</div><div class="name">${ch}</div>`; b.addEventListener('click', ()=> handleAnswer(ch===correct, b)); grid.appendChild(b); }); playContent.appendChild(grid);
	const choiceBtns = playContent.querySelectorAll('.choice'); choiceBtns.forEach(b=> b.disabled = true);
	playInstructionAudio(`Yang mana Huruf ${correct}?`).then(()=> choiceBtns.forEach(b=> b.disabled = false));
}

function questionAnimal(){ const animals = DATA.hewan; const idx = Math.floor(Math.random()*animals.length); const correctAnimal = animals[idx]; current = {type:'hewan', correct: correctAnimal}; playContent.innerHTML=''; const prompt=document.createElement('div'); prompt.innerHTML=`<div style="font-size:24px;font-weight:800">Pilih binatang: <div style="font-size:28px">${correctAnimal.name}</div></div>`; playContent.appendChild(prompt);
	// options: pick correct animal and two others from array
	const others = shuffle(animals.filter((_,i)=>i!==idx)).slice(0,2);
	const opts = shuffle([correctAnimal, ...others]);
	const grid=document.createElement('div'); grid.className='choice-grid'; opts.forEach(a=>{ const b=document.createElement('button'); b.className='choice'; b.dataset.value = a.name; if(a.name===correctAnimal.name) b.dataset.correct='true'; b.innerHTML=`<div class="emoji">${a.emoji}</div><div class="name">${a.name}</div>`; b.addEventListener('click', ()=> handleAnswer(a.name===correctAnimal.name, b)); grid.appendChild(b); }); playContent.appendChild(grid);
	const choiceBtns = playContent.querySelectorAll('.choice'); choiceBtns.forEach(b=> b.disabled = true);
	playInstructionAudio(`Yang mana binatang ${correctAnimal.name}?`).then(()=> choiceBtns.forEach(b=> b.disabled = false));
}

function questionColor(){ const items = DATA.warna; const correct = items[Math.floor(Math.random()*items.length)]; current={type:'warna', correct}; playContent.innerHTML=''; const prompt=document.createElement('div'); prompt.innerHTML=`<div style="font-size:24px;font-weight:800">Pilih warna: <div style="font-size:28px">${correct.name}</div></div>`; playContent.appendChild(prompt);
	// ensure correct included
	const others = shuffle(items.filter(i=>i.name!==correct.name)).slice(0,2);
	const opts = shuffle([correct, ...others]); const grid=document.createElement('div'); grid.className='choice-grid'; opts.forEach(c=>{ const b=document.createElement('button'); b.className='choice'; b.dataset.value = c.name; if(c.name===correct.name) b.dataset.correct='true'; b.innerHTML=`<div style="width:64px;height:64px;border-radius:12px;background:${c.code}"></div><div class="name">${c.name}</div>`; b.addEventListener('click', ()=> handleAnswer(c.name===correct.name, b)); grid.appendChild(b); }); playContent.appendChild(grid);
	const choiceBtns = playContent.querySelectorAll('.choice'); choiceBtns.forEach(b=> b.disabled = true);
	playInstructionAudio(`yang mana Warna ${correct.name}?`).then(()=> choiceBtns.forEach(b=> b.disabled = false));
}

function questionShape(){ const items = DATA.bentuk; const correct = items[Math.floor(Math.random()*items.length)]; current={type:'bentuk', correct}; playContent.innerHTML=''; const prompt=document.createElement('div'); prompt.innerHTML=`<div style="font-size:24px;font-weight:800">Pilih bentuk: <div style="font-size:28px">${correct.name}</div></div>`; playContent.appendChild(prompt);
	const others = shuffle(items.filter(i=>i.name!==correct.name)).slice(0,2);
	const opts = shuffle([correct, ...others]); const grid=document.createElement('div'); grid.className='choice-grid'; opts.forEach(s=>{ const b=document.createElement('button'); b.className='choice'; b.dataset.value = s.name; if(s.name===correct.name) b.dataset.correct='true'; b.innerHTML=`<div style="font-size:44px">${s.emoji}</div><div class="name">${s.name}</div>`; b.addEventListener('click', ()=> handleAnswer(s.name===correct.name, b)); grid.appendChild(b); }); playContent.appendChild(grid);
	const choiceBtns = playContent.querySelectorAll('.choice'); choiceBtns.forEach(b=> b.disabled = true);
	playInstructionAudio(`yang mana Bentuk ${correct.name}?`).then(()=> choiceBtns.forEach(b=> b.disabled = false));
}

function questionNumber(){ const items = DATA.angka; const correct = items[Math.floor(Math.random()*items.length)]; current={type:'angka', correct}; playContent.innerHTML=''; const prompt=document.createElement('div'); prompt.innerHTML=`<div style="font-size:28px;font-weight:800">Pilih angka: <div style="font-size:48px">${correct.num}</div></div>`; playContent.appendChild(prompt);
	const others = shuffle(items.filter(i=>i.name!==correct.name)).slice(0,2);
	const opts = shuffle([correct, ...others]); const grid=document.createElement('div'); grid.className='choice-grid'; opts.forEach(s=>{ const b=document.createElement('button'); b.className='choice'; b.dataset.value = s.name; if(s.name===correct.name) b.dataset.correct='true'; b.innerHTML=`<div style="font-size:44px">${s.num}</div><div class="name">${s.name}</div>`; b.addEventListener('click', ()=> handleAnswer(s.name===correct.name, b)); grid.appendChild(b); }); playContent.appendChild(grid);
	const choiceBtns = playContent.querySelectorAll('.choice'); choiceBtns.forEach(b=> b.disabled = true);
	playInstructionAudio(`yang mana Angka ${correct.name}?`).then(()=> choiceBtns.forEach(b=> b.disabled = false));
}

async function handleAnswer(isCorrect, button){
	// disable all choices to avoid double clicks
	const choices = playContent.querySelectorAll('.choice');
	choices.forEach(b=> b.disabled = true);
	// stop any instruction or other uploaded audio and cancel TTS to avoid overlap
	if(audioElements){ Object.values(audioElements).forEach(a=>{ try{ if(a && !a.paused){ a.pause(); a.currentTime = 0; } }catch(e){} }); }
	speechSynthesis.cancel();

	if(isCorrect){
		score += 10; updateScore(); if(button) button.classList.add('correct');
		const toneP = playCorrectAsync();
		const speechP = (audioElements.correct ? playAudioElementAsync('correct','Benar!') : speakAsync('Benar!, Kamu hebat!'));
		await Promise.all([toneP, speechP]);
		if(button) button.classList.remove('correct');
		nextQuestion();
	} else {
		score = Math.max(0, score-5); updateScore();
		const toneP = playWrongAsync();
		const speechP = playAudioElementAsync('wrong', 'Salah. Coba lagi');

		// visually indicate wrong on the clicked button
		if(button) button.classList.add('wrong');

		// wait until wrong tone and speech finish
		await Promise.all([toneP, speechP]);

		// clear visual wrong state
		if(button) button.classList.remove('wrong');

		// replay the instruction and allow answering again
		await replayQuestion();
	}
}

startBtn.addEventListener('click', ()=>{ // resume audio on user gesture
	if(!audioCtx) ensureAudio(); startGame(); });

// Audio upload handlers (play uploaded files when available)
const instrInput = document.getElementById('audioInstrFile');
const correctInput = document.getElementById('audioCorrectFile');
const wrongInput = document.getElementById('audioWrongFile');

function loadFileToAudio(elInput, key){ elInput && elInput.addEventListener('change', e=>{
	const f = e.target.files && e.target.files[0];
	if(!f) return;
	if(uploadedAudio[key]) URL.revokeObjectURL(uploadedAudio[key]);
	uploadedAudio[key] = URL.createObjectURL(f);
	const a = new Audio(uploadedAudio[key]); a.preload = 'auto'; audioElements[key] = a;
	a.addEventListener('error', ()=>{ audioElements[key]=null; });
}); }

loadFileToAudio(instrInput,'instr');
loadFileToAudio(correctInput,'correct');
loadFileToAudio(wrongInput,'wrong');

// prefer playing uploaded instruction audio in play routines
function playInstructionAudio(fallbackText){ // returns a Promise that resolves when either uploaded audio ends or TTS finishes
    if(audioElements.instr){ const a = audioElements.instr; try{ a.currentTime = 0; const p = a.play(); return new Promise(resolve=>{ a.addEventListener('ended', ()=> resolve(), {once:true}); p.catch(()=> speakAsync(fallbackText).then(resolve)); }); } catch(e){ return speakAsync(fallbackText); } }
    return speakAsync(fallbackText);
}

function playAudioElementAsync(key, fallbackText){ if(audioElements[key]){ const a = audioElements[key]; try{ a.currentTime = 0; const p = a.play(); return new Promise(resolve=>{ a.addEventListener('ended', ()=> resolve(), {once:true}); p.catch(()=> speakAsync(fallbackText).then(resolve)); }); } catch(e){ return speakAsync(fallbackText); } } return speakAsync(fallbackText); }

async function replayQuestion(){ const choices = playContent.querySelectorAll('.choice'); choices.forEach(b=> b.disabled = true); let instr = '';
	if(!current) { choices.forEach(b=> b.disabled = false); return; }
	if(current.type === 'huruf') instr = `Huruf ${current.correct}`;
	else if(current.type === 'hewan') instr = `Yang mana binatang ${current.correct.name}? `;
	else if(current.type === 'warna') instr = ` Yang mana warna ${current.correct.name}? `;
	else if(current.type === 'bentuk') instr = ` Yang mana bentuk ${current.correct.name}? `;
	else if(current.type === 'angka') instr = ` Yang mana angka ${current.correct.name}? `;
	await playInstructionAudio(instr);
	choices.forEach(b=> b.disabled = false);
}

// Update question routines to use playInstructionAudio where appropriate
// (example: in questionAnimal we already call speak(); replace with playInstructionAudio to prefer uploaded audio)
// We'll patch a couple places: replace speak(...) after rendering prompt with playInstructionAudio


// Helpers
function capitalize(s){ return s.charAt(0).toUpperCase()+s.slice(1); }

// Init
renderLearn(); renderPlayTitle(); initVoices();
