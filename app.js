const hasConfig =
  window.SUPABASE_URL &&
  window.SUPABASE_ANON_KEY &&
  !window.SUPABASE_URL.includes("YOUR-PROJECT") &&
  !window.SUPABASE_ANON_KEY.includes("YOUR_PUBLIC");

const sb = hasConfig ? supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null;
const app = document.getElementById("app");

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const showToast = msg => { const t=document.getElementById("toast"); t.textContent=msg; t.style.display="block"; setTimeout(()=>t.style.display="none",2200); };
const makeSlug = () => crypto.getRandomValues(new Uint8Array(8)).reduce((s,n)=>s+n.toString(36).padStart(2,"0"),"").slice(0,12);

const defaultRounds = [
  ["I forgive you 💗","I'm still angry 😤","Thank you for forgiving me 🥹","I understand. Take your time."],
  ["Okay, we're good 🫶","I need more time 😔","Thank you for giving me another chance.","I respect that. I'm still sorry."],
  ["Apology accepted 🌷","Not yet 😭","That means a lot to me.","I won't pressure you."],
  ["Friends again? 💕","I'm still upset 🥺","Thank you. Our friendship matters to me.","I understand. My apology is still genuine."],
  ["Okay, I forgive you 💖","Still angry 😤","You just made my day. Thank you!","I hear you. I'll respect your feelings."]
];

function creator() {
  const pages = Array.from({length:5},(_,i)=>`<div class="page-card"><h3>📖 Page ${i+1}</h3><div class="field"><label>Page title</label><input id="p${i}title" value="${i===0?"A little something for you 💌":`Page ${i+1}`}"></div><div class="field"><label>Your message</label><textarea id="p${i}msg" placeholder="Write anything you want...">${i===0?"I wanted to say something properly, so I made this little apology for you.":""}</textarea></div></div>`).join("");
  const rounds = defaultRounds.map((r,i)=>`<div class="round"><h3>Round ${i+1}</h3><div class="grid"><div class="field"><label>Accept option text</label><input id="r${i}a" value="${esc(r[0])}"></div><div class="field"><label>Still angry option text</label><input id="r${i}b" value="${esc(r[1])}"></div><div class="field"><label>Message after accepting</label><textarea id="r${i}am">${esc(r[2])}</textarea></div><div class="field"><label>Message after choosing "still angry"</label><textarea id="r${i}bm">${esc(r[3])}</textarea></div></div></div>`).join("");
  app.innerHTML = `<div class="shell">
    <div class="topbar"><div class="brand">Apology Storybook 💌</div><div class="pill">5 pages • 5 choice rounds</div></div>
    <div class="panel hero"><h1>Create your apology</h1><p>Write your own words, customize every button, and generate one private-looking share link for your friend. The friend sees only the finished storybook.</p></div>
    <form id="creatorForm">
      <div class="panel"><div class="section-title">🌷 Names</div><div class="grid">
        <div class="field"><label>Friend's name</label><input id="friend" required placeholder="e.g. Sejal"></div>
        <div class="field"><label>Sender's name</label><input id="sender" required placeholder="e.g. Rishabh"></div>
      </div></div>
      <div class="panel" style="margin-top:20px"><div class="section-title">📖 Your 5-page apology letter</div>${pages}</div>
      <div class="panel" style="margin-top:20px"><div class="section-title">💗 Customize all 5 choice rounds</div><p class="small">The first choices appear only after page 5. Every later round is shown only if the "still angry" option is selected.</p>${rounds}</div>
      <div class="panel" style="margin-top:20px"><div class="section-title">🎀 Final step</div>
        <div class="field"><label>Final forgiveness button</label><input id="finalButton" value="Okay, I forgive you {sender}"></div>
        <div class="field"><label>Final thank-you letter</label><textarea id="thankyou">Thank you for accepting my apology. 🥹💗

Our friendship means a lot to me, and I'm really grateful that you gave me another chance.

I promise I'll try to be a better friend. 🫶</textarea></div>
        <div class="actions"><button class="btn primary" type="submit">✨ Create my apology link</button></div>
        <div id="configError" class="error"></div>
        <div id="result" class="hidden"></div>
      </div>
    </form>
  </div>`;

  document.getElementById("creatorForm").addEventListener("submit", createApology);
}

async function createApology(e) {
  e.preventDefault();
  const err=document.getElementById("configError");
  const result=document.getElementById("result");
  if(!sb){err.textContent="First open config.js and add your Supabase URL and public anon key.";return;}
  err.textContent=""; result.classList.add("hidden");

  const pages = Array.from({length:5},(_,i)=>({
    title:document.getElementById(`p${i}title`).value.trim(),
    message:document.getElementById(`p${i}msg`).value.trim()
  }));
  if(pages.some(p=>!p.title || !p.message)){err.textContent="Please fill all 5 pages.";return;}

  const rounds = Array.from({length:5},(_,i)=>({
    accept_text:document.getElementById(`r${i}a`).value.trim(),
    angry_text:document.getElementById(`r${i}b`).value.trim(),
    accept_message:document.getElementById(`r${i}am`).value.trim(),
    angry_message:document.getElementById(`r${i}bm`).value.trim()
  }));

  const data={
    slug:makeSlug(),
    friend_name:document.getElementById("friend").value.trim(),
    sender_name:document.getElementById("sender").value.trim(),
    pages,
    rounds,
    final_button_text:document.getElementById("finalButton").value.trim(),
    thank_you:document.getElementById("thankyou").value.trim()
  };

  const {error}=await sb.from("apologies").insert(data);
  if(error){err.textContent=error.message;return;}

  const link=`${location.origin}${location.pathname}?a=${encodeURIComponent(data.slug)}`;
  result.classList.remove("hidden");
  result.innerHTML=`<div class="notice"><b>💌 Your apology link is ready!</b><br>Send this link to your friend. Keep it safe if you don't want anyone else to see the message.</div><div class="linkbox"><input id="generatedLink" value="${esc(link)}" readonly><button type="button" class="btn primary copy" onclick="copyLink()">Copy link</button></div>`;
  window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"});
}

async function copyLink(){
  const input=document.getElementById("generatedLink");
  await navigator.clipboard.writeText(input.value);
  showToast("Link copied 💌");
}

function reader(data){
  let index=0;
  let round=0;
  const pages=data.pages;
  const renderPage=(p)=>`<div class="reader-page" id="page-${p}" style="z-index:${20-p}">
    <div class="reader-content"><div class="ornament">${p===0?"💌":"🌷"}</div><h1>${esc(pages[p].title)}</h1><p>${esc(pages[p].message)}</p><button class="btn primary turn" onclick="turnPage()">Turn the page 📖</button></div>
  </div>`;
  app.innerHTML=`<div class="reader"><div class="book-wrap"><div class="book"><div class="spine"></div>${pages.map((_,i)=>renderPage(i)).join("")}<div class="progress" id="progress">Page 1 of 5</div></div></div></div>`;
  window.turnPage=()=>{
    if(index<4){
      document.getElementById(`page-${index}`).classList.add("flipped");
      index++;
      document.getElementById("progress").textContent=`Page ${index+1} of 5`;
      burst();
    }else{
      showChoices();
    }
  };
  function showChoices(){
    const p=document.getElementById("page-4");
    p.innerHTML=`<div class="reader-content"><div class="ornament">🥺</div><h2>So... what do you say?</h2><p>You've reached the end of the letter.</p><div class="choices"><button class="choice accept" onclick="chooseAccept()">${esc(data.rounds[0].accept_text)}</button><button class="choice" onclick="chooseAngry()">${esc(data.rounds[0].angry_text)}</button></div></div>`;
  }
  window.chooseAccept=()=>finish(data.rounds[round].accept_message,data);
  window.chooseAngry=()=>{ showRound(round); };
  function showRound(r){
    round++;
    if(round>=5){showFinal();return;}
    const rdata=data.rounds[round];
    const p=document.getElementById("page-4");
    p.innerHTML=`<div class="reader-content"><div class="ornament">🥺</div><h2>One more thing...</h2><p>${esc(rdata.angry_message)}</p><div class="choices"><button class="choice accept" onclick="finish('${encodeURIComponent(rdata.accept_message)}',null)">${esc(rdata.accept_text)}</button><button class="choice" onclick="continueAngry()">${esc(rdata.angry_text)}</button></div></div>`;
    window.continueAngry=()=>{ if(round+1>=5) showFinal(); else showRound(round); };
    burst();
  }
  function showFinal(){
    const p=document.getElementById("page-4");
    const text=(data.final_button_text||"Okay, I forgive you {sender}").replaceAll("{sender}",data.sender_name);
    p.innerHTML=`<div class="reader-content"><div class="ornament">💖</div><h2>One last question...</h2><p>Whenever you're ready.</p><div class="choices"><button class="choice accept" onclick="finish('',null)">${esc(text)}</button></div></div>`;
    burst();
  }
  window.finish=(message)=>showThankYou(data,message || data.thank_you);
}

function showThankYou(data,message){
  app.innerHTML=`<div class="overlay"><div class="letter"><div class="emoji">💖</div><h1>Thank you! 🥹</h1><p>${esc(message || data.thank_you)}</p><p>— ${esc(data.sender_name)} 🫶</p><button class="btn primary" onclick="location.href=location.pathname">Close</button></div></div>`;
  for(let i=0;i<45;i++) setTimeout(()=>burst(true),i*40);
}

function burst(extra=false){
  const symbols=["💗","💕","✨","🌸","🌷","🫶","💌","🥹"];
  const n=extra?1:3;
  for(let i=0;i<n;i++){
    const el=document.createElement("div");el.className="float";el.textContent=symbols[Math.floor(Math.random()*symbols.length)];
    el.style.left=Math.random()*100+"vw";el.style.fontSize=(18+Math.random()*24)+"px";el.style.animationDuration=(3+Math.random()*3)+"s";
    document.body.appendChild(el);setTimeout(()=>el.remove(),7000);
  }
}

async function loadApology(slug){
  if(!sb){app.innerHTML=`<div class="shell"><div class="panel center"><h1>Configuration needed</h1><p>Add your Supabase values to config.js.</p></div></div>`;return;}
  const {data,error}=await sb.from("apologies").select("*").eq("slug",slug).single();
  if(error||!data){app.innerHTML=`<div class="shell"><div class="panel center"><h1>💌 Apology not found</h1><p>This link may be invalid or the apology may have been deleted.</p></div></div>`;return;}
  reader(data);
}

const params=new URLSearchParams(location.search);
if(params.get("a")) loadApology(params.get("a")); else creator();
