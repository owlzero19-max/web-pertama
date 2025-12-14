// Data: materials with Indonesian names and emojis
const DATA = {
	huruf: Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
	hewan: {
		A:{name:'Ayam', emoji:'🐔'}, B:{name:'Bebek', emoji:'🦆'}, C:{name:'Cicak', emoji:'🦎'}, D:{name:'Domba', emoji:'🐑'},
		E:{name:'Elang', emoji:'🦅'}, F:{name:'Flamingo', emoji:'🦩'}, G:{name:'Gajah', emoji:'🐘'}, H:{name:'Harimau', emoji:'🐯'},
		I:{name:'Ikan', emoji:'🐟'}, J:{name:'Jerapah', emoji:'🦒'}, K:{name:'Kucing', emoji:'🐱'}, L:{name:'Lumba-lumba', emoji:'🐬'},
		M:{name:'Monyet', emoji:'🐵'}, N:{name:'Nuri', emoji:'🦜'}, O:{name:'Orangutan', emoji:'🦧'}, P:{name:'Panda', emoji:'🐼'},
		Q:{name:'Quokka', emoji:'🙂'}, R:{name:'Rusa', emoji:'🦌'}, S:{name:'Singa', emoji:'🦁'}, T:{name:'Tupai', emoji:'🐿️'},
		U:{name:'Ular', emoji:'🐍'}, V:{name:'Viper', emoji:'🐍'}, W:{name:'Walrus', emoji:'🦭'}, X:{name:'Xerus', emoji:'🐿️'},
		Y:{name:'Yak', emoji:'🐂'}, Z:{name:'Zebra', emoji:'🦓'}
	},
	warna: [
		{name:'Merah', code:'#ff0000ff'}, {name:'Kuning', code:'#ffcc3eff'}, {name:'Biru', code:'#0065d8ff'},
		{name:'Hijau', code:'#06af00ff'}, {name:'Ungu', code:'#8200ecff'}, {name:'Oranye', code:'#ff6600ff'},
		{name:'Pink', code:'#ff00b3ff'}, {name:'Cokelat', code:'#9c563dff'}, {name:'Abu-abu', code:'#5e6469ff'},
		{name:'Hitam', code:'#000000ff'}, {name:'Putih', code:'#ffffff'}
	],
	bentuk: [
		{name:'Lingkaran', shape:'circle', emoji:'⚫'}, {name:'Segitiga', shape:'triangle', emoji:'🔺'},
		{name:'Persegi', shape:'square', emoji:'◻️'}, {name:'Bintang', shape:'star', emoji:'⭐'},
		{name:'Hati', shape:'heart', emoji:'❤️'}, {name:'Belah Ketupat', shape:'diamond', emoji:'🔷'},
		{name:'Bulan', shape:'crescent', emoji:'🌙'}
	]
	,angka: [1,2,3,4,5,6,7,8,9,10]
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
// Optional uploaded audio files (Blob URLs)
const uploadedAudio = { instr: null, correct: null, wrong: null };
let audioElements = { instr: null, correct: null, wrong: null };

// Audio helpers
function ensureAudio(){ if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }
function playTone(freqs, type='sine', duration=0.25){ ensureAudio(); const t=audioCtx.currentTime; freqs.forEach(f=>{ const o=audioCtx.createOscillator(); const g=audioCtx.createGain(); o.type=type; o.frequency.value=f; g.gain.value=0.08; o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t+duration); }); }
function playCorrect(){ ensureAudio(); // cheerful chord
	// If user uploaded a 'correct' audio file, play it
	if(audioElements.correct){ audioElements.correct.currentTime = 0; audioElements.correct.play().catch(()=>{}); return; }
	const now = audioCtx.currentTime; const o1=audioCtx.createOscillator(), o2=audioCtx.createOscillator(), g=audioCtx.createGain(); o1.type='sine'; o2.type='sine'; o1.frequency.value=440; o2.frequency.value=660; g.gain.value=0.12; o1.connect(g); o2.connect(g); g.connect(audioCtx.destination); o1.start(now); o2.start(now); g.gain.exponentialRampToValueAtTime(0.0001, now+0.6); o1.stop(now+0.6); o2.stop(now+0.6);
}
function playWrong(){ ensureAudio(); // If user uploaded a 'wrong' audio file, play it
	if(audioElements.wrong){ audioElements.wrong.currentTime = 0; audioElements.wrong.play().catch(()=>{}); return; }
	const now=audioCtx.currentTime; const o=audioCtx.createOscillator(), g=audioCtx.createGain(); o.type='square'; o.frequency.value=160; g.gain.value=0.18; o.connect(g); g.connect(audioCtx.destination); o.start(now); g.gain.exponentialRampToValueAtTime(0.0001, now+0.35); o.stop(now+0.35); }

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
window.speechSynthesis.onvoiceschanged = initVoices;

// Navigation
document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click', ()=>{ navBtns.forEach(n=>n.classList.remove('active')); b.classList.add('active'); const view = b.dataset.view; if(view==='learn'){ learnView.classList.remove('hidden'); playView.classList.add('hidden'); } else { learnView.classList.add('hidden'); playView.classList.remove('hidden'); }}));

// Material change
function renderLearn(){ const m = materialSelect.value; learnTitle.textContent = 'Belajar: ' + capitalize(m);
	learnContent.innerHTML='';
	if(m==='huruf'){
		DATA.huruf.forEach(l=>{ const node = cardTpl.content.cloneNode(true); node.querySelector('.big').textContent = l; node.querySelector('.label').textContent = `Huruf ${l}`; node.querySelector('.card').addEventListener('click', ()=>{ speak(l); showModal(l, l); }); learnContent.appendChild(node); });
	} else if(m==='hewan'){
		Object.keys(DATA.hewan).forEach(k=>{ const a=DATA.hewan[k]; const node = cardTpl.content.cloneNode(true); node.querySelector('.big').textContent = a.emoji; node.querySelector('.label').textContent = `${a.name} (${k})`; node.querySelector('.card').addEventListener('click', ()=>{ speak(a.name); showModal(a.name, a.emoji); }); learnContent.appendChild(node); });
	} else if(m==='warna'){
		DATA.warna.forEach(c=>{ const node = cardTpl.content.cloneNode(true); node.querySelector('.big').innerHTML = `<div style="width:64px;height:64px;background:${c.code};border-radius:12px"></div>`; node.querySelector('.label').textContent = c.name; node.querySelector('.card').addEventListener('click', ()=>{ speak(c.name); showModal(c.name, '') }); learnContent.appendChild(node); });
	} else if(m==='bentuk'){
		DATA.bentuk.forEach(s=>{ const node = cardTpl.content.cloneNode(true); node.querySelector('.big').textContent = s.emoji; node.querySelector('.label').textContent = s.name; node.querySelector('.card').addEventListener('click', ()=>{ speak(s.name); showModal(s.name, s.emoji); }); learnContent.appendChild(node); });
	}
	else if(m==='angka'){
		DATA.angka.forEach(n=>{ const node = cardTpl.content.cloneNode(true); node.querySelector('.big').textContent = n; node.querySelector('.label').textContent = `Angka ${n}`; node.querySelector('.card').addEventListener('click', ()=>{ speak(String(n)); showModal(`Angka ${n}`, n); }); learnContent.appendChild(node); });
	}
}

// Support 'angka' in learn view
if(typeof(DATA.angka)!=='undefined'){
    // nothing needed here — renderLearn will read DATA when select changes
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
// include angka
function questionNumber(){ const nums = DATA.angka; const correct = nums[Math.floor(Math.random()*nums.length)]; current={type:'angka', correct}; playContent.innerHTML=''; const prompt=document.createElement('div'); prompt.innerHTML=`<div style="font-size:48px;font-weight:900">Pilih angka:</div><div style="font-size:64px">${correct}</div>`; playContent.appendChild(prompt);
	const others = shuffle(nums.filter(n=>n!==correct)).slice(0,2);
	const opts = shuffle([correct,...others]); const grid=document.createElement('div'); grid.className='choice-grid'; opts.forEach(o=>{ const b=document.createElement('button'); b.className='choice'; b.innerHTML=`<div class="emoji" style="font-size:44px">${o}</div><div class="name">${o}</div>`; b.addEventListener('click', ()=> handleAnswer(o===correct)); grid.appendChild(b); }); playContent.appendChild(grid); playInstructionAudio(`Angka ${correct}`);
}

function shuffle(a){ return a.slice().sort(()=>0.5-Math.random()); }

function questionLetter(){ const letters = DATA.huruf; const correct = letters[Math.floor(Math.random()*letters.length)]; current = {type:'huruf', correct};
	playContent.innerHTML=''; const prompt = document.createElement('div'); prompt.innerHTML=`<div style="font-size:48px;font-weight:900">Pilih huruf:</div><div style="font-size:64px">${correct}</div>`; playContent.appendChild(prompt);
	// ensure correct is included
	const others = shuffle(letters.filter(l=>l!==correct)).slice(0,2);
	const choices = shuffle([correct, ...others]); const grid=document.createElement('div'); grid.className='choice-grid'; choices.forEach(ch=>{ const b=document.createElement('button'); b.className='choice'; b.innerHTML=`<div class="emoji" style="font-size:44px">${ch}</div><div class="name">${ch}</div>`; b.addEventListener('click', ()=> handleAnswer(ch===correct)); grid.appendChild(b); }); playContent.appendChild(grid); playInstructionAudio(`Huruf ${correct}`);
}

function questionAnimal(){ const keys = Object.keys(DATA.hewan); const correctKey = keys[Math.floor(Math.random()*keys.length)]; const correct = DATA.hewan[correctKey]; current={type:'hewan', correctKey}; playContent.innerHTML=''; const prompt=document.createElement('div'); prompt.innerHTML=`<div style="font-size:24px;font-weight:800">Pilih binatang: <div style="font-size:28px">${correct.name}</div></div>`; playContent.appendChild(prompt);
	// options: include correct and two others
	const others = shuffle(keys.filter(k=>k!==correctKey)).slice(0,2); const opts = shuffle([correctKey,...others]); const grid=document.createElement('div'); grid.className='choice-grid'; opts.forEach(k=>{ const a=DATA.hewan[k]; const b=document.createElement('button'); b.className='choice'; b.innerHTML=`<div class="emoji">${a.emoji}</div><div class="name">${a.name}</div>`; b.addEventListener('click', ()=> handleAnswer(k===correctKey)); grid.appendChild(b); }); playContent.appendChild(grid); playInstructionAudio(`Pilih binatang ${correct.name}`);
}

function questionColor(){ const items = DATA.warna; const correct = items[Math.floor(Math.random()*items.length)]; current={type:'warna', correct}; playContent.innerHTML=''; const prompt=document.createElement('div'); prompt.innerHTML=`<div style="font-size:24px;font-weight:800">Pilih warna: <div style="font-size:28px">${correct.name}</div></div>`; playContent.appendChild(prompt);
	// ensure correct included
	const others = shuffle(items.filter(i=>i.name!==correct.name)).slice(0,2);
	const opts = shuffle([correct, ...others]); const grid=document.createElement('div'); grid.className='choice-grid'; opts.forEach(c=>{ const b=document.createElement('button'); b.className='choice'; b.innerHTML=`<div style="width:64px;height:64px;border-radius:12px;background:${c.code}"></div><div class="name">${c.name}</div>`; b.addEventListener('click', ()=> handleAnswer(c.name===correct.name)); grid.appendChild(b); }); playContent.appendChild(grid); playInstructionAudio(`Warna ${correct.name}`);
}

function questionShape(){ const items = DATA.bentuk; const correct = items[Math.floor(Math.random()*items.length)]; current={type:'bentuk', correct}; playContent.innerHTML=''; const prompt=document.createElement('div'); prompt.innerHTML=`<div style="font-size:24px;font-weight:800">Pilih bentuk: <div style="font-size:28px">${correct.name}</div></div>`; playContent.appendChild(prompt);
	const others = shuffle(items.filter(i=>i.name!==correct.name)).slice(0,2);
	const opts = shuffle([correct, ...others]); const grid=document.createElement('div'); grid.className='choice-grid'; opts.forEach(s=>{ const b=document.createElement('button'); b.className='choice'; b.innerHTML=`<div style="font-size:44px">${s.emoji}</div><div class="name">${s.name}</div>`; b.addEventListener('click', ()=> handleAnswer(s.name===correct.name)); grid.appendChild(b); }); playContent.appendChild(grid); playInstructionAudio(`Bentuk ${correct.name}`);
}

function getCorrectAnswerText(){ if(!current) return '';
	if(current.type==='huruf') return current.correct;
	if(current.type==='hewan') return DATA.hewan[current.correctKey].name;
	if(current.type==='warna') return current.correct.name;
	if(current.type==='bentuk') return current.correct.name;
	if(current.type==='angka') return String(current.correct);
	return '';
}

function showCorrectNote(text){ const note = document.createElement('div'); note.className='correct-note'; note.textContent = `Jawaban benar: ${text}`; playContent.appendChild(note); setTimeout(()=> note.remove(), 1200); }

function handleAnswer(isCorrect){ if(isCorrect){ score += 10; playCorrect(); if(!audioElements.correct) speak('Benar!'); } else { score = Math.max(0, score-5); playWrong(); if(!audioElements.wrong) speak('Salah, coba lagi'); const correctText = getCorrectAnswerText(); // announce correct answer after short delay
		setTimeout(()=> speak(`Yang benar adalah ${correctText}`), 400); showCorrectNote(correctText); } updateScore(); setTimeout(()=> nextQuestion(), 1200); }

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
function playInstructionAudio(fallbackText){ if(audioElements.instr){ audioElements.instr.currentTime = 0; audioElements.instr.play().catch(()=> speak(fallbackText)); } else speak(fallbackText); }

// Update question routines to use playInstructionAudio where appropriate
// (example: in questionAnimal we already call speak(); replace with playInstructionAudio to prefer uploaded audio)
// We'll patch a couple places: replace speak(...) after rendering prompt with playInstructionAudio


// Helpers
function capitalize(s){ return s.charAt(0).toUpperCase()+s.slice(1); }

// Init
renderLearn(); renderPlayTitle(); initVoices();
