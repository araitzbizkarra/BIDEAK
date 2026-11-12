'use strict';
const STUDENT_ONLY=false;
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='bideak-koadernoa-v5'+(STUDENT_ONLY?'-ikasle':'');
let state={format:'BIDEAK-v5',grades:{}}, g=0, p=0, teacher=false, vertical=true, alternative=false, showPlots=false, modelN=10;
function validState(value){
 if(!value||value.format!=='BIDEAK-v5'||!value.grades||Array.isArray(value.grades))throw Error('Ez da BIDEAKen babeskopia bateragarria.');
 const result={format:'BIDEAK-v5',grades:{}};
 for(const [grade,obj] of Object.entries(value.grades)){
  if(!DATA.some(d=>d[0]===grade)||!obj||typeof obj!=='object'||Array.isArray(obj))throw Error('Mailaren datuak ez dira baliagarriak.');
  // A JSON roundtrip keeps imported content as data. All output uses escaped text.
  const data=JSON.parse(JSON.stringify(obj));
  const scalar=x=>typeof x==='string'||typeof x==='boolean'||(typeof x==='number'&&Number.isFinite(x));
  if(data.firstIdea!==undefined&&typeof data.firstIdea!=='string')throw Error('Hasierako testua ez da baliagarria.');
  if(data.forms&&(!Array.isArray(data.forms)||data.forms.length>4||data.forms.some(f=>!f||typeof f!=='object'||Array.isArray(f))))throw Error('Txantiloien formatua ez da zuzena.');
  if(data.history&&(!Array.isArray(data.history)||data.history.some(h=>!h||typeof h!=='object')))throw Error('Historiaren formatua ez da zuzena.');
  if(data.assessment&&(!data.assessment||typeof data.assessment!=='object'||Array.isArray(data.assessment)))throw Error('Ebaluazioaren formatua ez da zuzena.');
  if(data.forms?.some((f,i)=>Object.entries(f).some(([k,v])=>k.startsWith('hint_')?(!Number.isInteger(v)||v<0):TEMPLATES[i].groups.flatMap(x=>x[1]).find(x=>x[0]===k)?.[2]==='check'?typeof v!=='boolean':typeof v!=='string')))throw Error('Eremu baten edukia ez da baliagarria.');
  if(data.assessment&&Object.values(data.assessment).some(r=>!r||typeof r!=='object'||Array.isArray(r)||Object.values(r).some(v=>typeof v!=='string')))throw Error('Balorazio baten formatua ez da zuzena.');
  if(data.history?.some(h=>!Number.isInteger(h.phase)||h.phase<0||h.phase>3||typeof h.text!=='string'||typeof h.kind!=='string'||typeof h.date!=='string'||(h.snapshot&&(typeof h.snapshot!=='object'||Array.isArray(h.snapshot)||Object.values(h.snapshot).some(v=>!scalar(v))))))throw Error('Historiako sarrera bat ez da baliagarria.');
  result.grades[grade]=data;
 }
 return result;
}
try{const saved=localStorage.getItem(KEY);if(saved)state=validState(JSON.parse(saved));}catch{}
function note(){const n=state.grades[DATA[g][0]]??={};n.forms??=[{},{},{},{}];for(let i=0;i<4;i++)n.forms[i]??={};n.assessment??={};n.history??=[];return n;}
function form(){return note().forms[p];}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));$('#saveStatus').textContent='Gailu honetan gordeta · egin babeskopia';}catch{$('#saveStatus').textContent='Ezin da gailuan gorde. Deskargatu babeskopia.';}}
function button(parent,text,fn,primary=false){const b=document.createElement('button');b.type='button';b.textContent=text;if(primary)b.className='primary';b.onclick=fn;parent.append(b);return b;}
function field(parent,id,label,value,onChange,type='textarea',options=[]){
 const l=document.createElement('label');l.htmlFor=id;l.textContent=label;
 const e=document.createElement(type==='check'?'input':type==='number'?'input':type);e.id=id;
 if(type==='check'){e.type='checkbox';e.checked=value===true;l.className='check';l.prepend(e);parent.append(l);}
 else{if(type==='select'){options.forEach(x=>e.add(new Option(x,x)));}if(type==='number'){e.type='text';e.inputMode='decimal';}e.value=typeof value==='string'&&value?value:(type==='select'?options[0]:'');parent.append(l,e);}
 e.addEventListener(type==='select'||type==='check'?'change':'input',()=>{onChange(type==='check'?e.checked:e.value);save();});return e;
}
function formatNumber(n){return Number(n.toFixed(4)).toLocaleString('eu-ES');}
function getModel(){
 if(g<2){const w=alternative&&g===0?10:12,h=alternative&&g===0?10:8,t=alternative&&g===1?3:2;const usableW=vertical?w-t:w,usableH=vertical?h:h-t;return{w,h,t,usableW,usableH,area:usableW*usableH,plots:Math.floor(usableW/2)*Math.floor(usableH/2)};}
 return g===2?{n:modelN,normal:30*modelN,drip:25.5*modelN,limit:alternative?500:540}:{n:modelN,a:36+3*modelN,b:12+5*modelN,limit:alternative?84:80};
}
function modelText(){const m=getModel();return g<2?`${m.w} × ${m.h} m; pasabidea ${m.t} m, ${vertical?'bertikala':'horizontala'}; landatzeko ${m.usableW} × ${m.usableH} m. ${showPlots?'Sarearekiko lerrokatutako sail osoak: '+m.plots+'.':''}`:g===2?`${m.n} sail; ohiko kontsumoa ${formatNumber(m.normal)} L; tantaka ${formatNumber(m.drip)} L; muga ${m.limit} L.`:`${m.n} sail; A ${m.a} €; B ${m.b} €; aurrekontua ${m.limit} €.`;}
function draw(){
 const v=$('#visual'),m=getModel();v.innerHTML='<h3>'+(g<2?'Ortuaren planoa':'Probatu zure eredua')+'</h3><div class="plan" id="plan"></div><div class="controls" id="controls"></div>';
 const plan=$('#plan'),controls=$('#controls');
 if(g<2){let plots='';if(showPlots)for(let x=0;x+2<=m.usableW;x+=2)for(let y=0;y+2<=m.usableH;y+=2)plots+=`<rect x="${x+.08}" y="${y+.08}" width="1.84" height="1.84" fill="#a1bb8a" stroke="#2d533d" stroke-width=".055"/>`;
 plan.innerHTML=`<svg viewBox="-1.7 -1.5 ${m.w+3.1} ${m.h+2.7}" role="img" aria-label="${esc(modelText())}"><defs><pattern id="sare" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M0 1V0H1" stroke="#658365" stroke-width=".03" fill="none"/></pattern></defs><rect width="${m.w}" height="${m.h}" fill="#d8e4c9"/><rect x="${vertical?m.w-m.t:0}" y="${vertical?0:m.h-m.t}" width="${vertical?m.t:m.w}" height="${vertical?m.h:m.t}" fill="#dfc48e"/><rect width="${m.w}" height="${m.h}" fill="url(#sare)" stroke="#355843" stroke-width=".07"/>${plots}<g font-size=".65" fill="#17382b" text-anchor="middle"><text x="${m.w/2}" y="-.6">${m.w} m</text><text x="-.8" y="${m.h/2}">${m.h} m</text></g></svg><p>Oinarrian 12 × 8 m. Sareko lauki bakoitza 1 m²; pasabidea okre kolorez. Sailak 2 × 2 m-koak dira.</p>${alternative?'<p><strong>Aldaera aktibatuta</strong></p>':''}${g===1?'<p>Eskala 1:100: 1 cm planoan = 1 m errealitatean. Pantailako marrazkia ez dago inprimatzeko eskalan.</p>':''}`;
 for(const [text,val] of [['Horizontala',false],['Bertikala',true]]){const b=button(controls,text,()=>{vertical=val;draw();});b.setAttribute('aria-pressed',String(vertical===val));}
 const plot=button(controls,showPlots?'Sailak ezkutatu':'Sailak kokatu',()=>{showPlots=!showPlots;draw();});plot.setAttribute('aria-pressed',String(showPlots));
 }else{plan.innerHTML=`<label for="modelN">Sail kopurua: <output id="nval">${modelN}</output></label><input type="range" id="modelN" min="1" max="20" step="1" value="${modelN}"><p id="modelResult" aria-live="polite">${modelText()}</p><small>Lehenik egin aurreikuspena; ondoren mugitu graduatzailea eta kontrastatu.</small>`;$('#modelN').oninput=e=>{modelN=Number(e.target.value);$('#nval').textContent=modelN;$('#modelResult').textContent=modelText();};}
 const alt=button(controls,alternative?'Oinarrizko egoera':'Probatu aldaera',()=>{alternative=!alternative;draw();});alt.setAttribute('aria-pressed',String(alternative));
 $('#captureStatus').textContent='';
}
function criteria(){const meta=CURRICULUM.grades[g];const codes=[...new Set(meta.rows.flatMap(r=>r.codes))];return codes.map(c=>[c,CURRICULUM.criteria[meta.family][c],meta.rows.filter(r=>r.codes.includes(c)).map(r=>r.focus).filter((x,i,a)=>a.indexOf(x)===i).join(' ')]);}

function filled(f){return Object.values(f).filter(x=>typeof x==='string'&&x.trim()&&x!=='Hautatu').length;}
const ART=['<svg viewBox="0 0 200 90" aria-hidden="true"><circle cx="48" cy="50" r="30" fill="#f3dfb4"/><path d="M35 75V32h20v43M32 32h26l-13-18zM38 43h14M40 53h10" fill="#f8f3e8" stroke="#244b49" stroke-width="3"/><path d="M55 35l80-20-62 40z" fill="#efc44f" opacity=".9"/><path d="M0 75c48-17 91-8 200-31v46H0z" fill="#244b49" opacity=".8"/></svg>', '<svg viewBox="0 0 200 90" aria-hidden="true"><circle cx="100" cy="40" r="32" fill="#fff3c9"/><circle cx="82" cy="42" r="22" fill="none" stroke="#183238" stroke-width="6"/><path d="M98 59l21 20" stroke="#183238" stroke-width="7"/><path d="M30 75c18-34 41-33 60 0M130 73c8-27 25-31 39 0" fill="#9fbd91"/></svg>', '<svg viewBox="0 0 200 90" aria-hidden="true"><ellipse cx="101" cy="74" rx="47" ry="9" fill="#71816e"/><ellipse cx="101" cy="61" rx="34" ry="12" fill="#57645a"/><ellipse cx="101" cy="45" rx="26" ry="11" fill="#7e8c7c"/><ellipse cx="101" cy="30" rx="17" ry="9" fill="#536057"/><path d="M145 65c16-18 22-31 18-48" fill="none" stroke="#244b49" stroke-width="2" stroke-dasharray="4 4"/><circle cx="163" cy="16" r="5" fill="#efc44f"/></svg>', '<svg viewBox="0 0 200 90" aria-hidden="true"><circle cx="100" cy="48" r="38" fill="#c3dce8"/><path d="M100 77V15M100 28H58l13-12-13-12h42M100 49h45l-13-12 13-12h-45" fill="#8a674a" stroke="#183238" stroke-width="2"/><path d="M92 77h16" stroke="#183238" stroke-width="5"/></svg>', '<svg viewBox="0 0 200 90" aria-hidden="true"><circle cx="101" cy="49" r="37" fill="#edd1d4"/><path d="M31 70c42-53 91-55 139-15" fill="none" stroke="#183238" stroke-width="3" stroke-dasharray="6 5"/><g fill="#183238"><path d="M34 55a9 9 0 1018 0c0-5-9-16-9-16s-9 11-9 16z"/><path d="M96 37a9 9 0 1018 0c0-5-9-16-9-16s-9 11-9 16z"/><path d="M153 59a9 9 0 1018 0c0-5-9-16-9-16s-9 11-9 16z"/></g></svg>'];
let onChallenge=true;
function reveal(id){const el=$(id);el.focus({preventScroll:true});el.scrollIntoView({block:"start"});}
const sheetSteps=new Map();
let reading=false;
function renderSheet(focusTitle=false){
 const t=TEMPLATES[p], f=form(), key=g+':'+p, groups=t.groups, at=sheetSteps.get(key)||0;
 const picker=$('#sheetStep'), list=$('#fields'), output=$('#sheetAnswers');
 picker.replaceChildren();groups.forEach(([name],i)=>picker.add(new Option((i+1)+'. '+name,i)));picker.value=String(at);
 function go(i){if(i<0||i>=groups.length)return;sheetSteps.set(key,i);reading=false;renderSheet(true);}
 picker.onchange=()=>go(Number(picker.value));
 $('#sheetPosition').textContent=(at+1)+' / '+groups.length;
 $('#sheetPrev').disabled=at===0;$('#sheetPrev').onclick=()=>go(at-1);
 $('#sheetNext').disabled=at===groups.length-1;$('#sheetNext').onclick=()=>go(at+1);
 const read=$('#sheetRead');read.setAttribute('aria-expanded',String(reading));read.textContent=reading?'Itzuli idaztera':'Nire erantzunak ikusi';
 read.onclick=()=>{reading=!reading;renderSheet();};
 output.hidden=!reading;list.hidden=reading;output.replaceChildren();list.replaceChildren();
 if(reading){
  groups.forEach(([name,items],i)=>{const area=document.createElement('section'),heading=document.createElement('h4');heading.textContent=name;area.append(heading);
   const answers=items.filter(([id,,type])=>type==='check'?f[id]===true:typeof f[id]==='string'&&f[id].trim()&&f[id]!=='Hautatu');
   if(!answers.length){const msg=document.createElement('p');msg.textContent='Oraindik ez duzu erantzunik jaso.';area.append(msg);}
   else for(const [id,label,type] of answers){const l=document.createElement('strong'),v=document.createElement('p');l.textContent=label;v.textContent=type==='check'?'Bai':f[id];area.append(l,v);}
   const edit=button(area,'Atal hau editatu',()=>go(i));edit.setAttribute('aria-label',name+' · editatu');output.append(area);
  });return;
 }
 const [name,items]=groups[at];const title=document.createElement('h3');title.id='sheetHeading';title.tabIndex=-1;title.textContent=name;list.append(title);
 items.forEach(([id,label,type='textarea',opts])=>field(list,id,label,f[id],v=>{f[id]=v;},type,opts?.split('|')));
 if(focusTitle)title.focus();
}
function render(){
 const d=DATA[g],t=TEMPLATES[p],n=note(),f=form();
 $('#grades').replaceChildren();DATA.forEach((x,i)=>{const b=button($('#grades'),x[0],()=>{navigateTo(ortuaPath(i,0));});b.setAttribute('aria-pressed',String(i===g));});
 $('#gradeLabel').textContent=d[0]+' · '+PROGRESSION[g][1];$('#challengeTitle').textContent=d[1];$('#context').textContent=d[3];$('#challengeQuestion').textContent=d[4];
 $('#firstIdea').value=n.firstIdea||'';$('#firstIdea').oninput=e=>{n.firstIdea=e.target.value;save();};
 const captions=['Egin lehen hipotesia','Argitu galdera','Probatu estrategiak','Egiaztatu erabakia','Sortu aldaera bat'];
 $('#phases').replaceChildren();['Erronka','Ulermena','Arrazoiketa','Autonomia','Transferentzia'].forEach((title,i)=>{const b=button($('#phases'),'',()=>{navigateTo(ortuaPath(g,i));});b.innerHTML='<span class="step-num">0'+(i+1)+'</span><strong>'+title+'</strong><small>'+captions[i]+'</small>'+ART[i];b.setAttribute('aria-pressed',String(onChallenge?i===0:i===p+1));});
 $('#templateIndex').textContent='0'+(p+2)+' · Nire lan-koadernoa';$('#templateTitle').textContent=t.title;$('#templateQuestion').textContent=t.question;
 $('#phaseTask').textContent=[d[5],'Probatu zure hipotesia. Aukeratu estrategia bat eta konparatu beste bide batekin.',d[7],d[8]][p];
 renderSheet();
 $('#peer').value=f.peer||'';$('#revision').value=f.revision||'';$('#peer').oninput=e=>{f.peer=e.target.value;save();};$('#revision').oninput=e=>{f.revision=e.target.value;save();};
 $('#feedback').hidden=true;$('#hint').textContent='Lehenik, hautatu zure zailtasuna.';
 const e=$('#evidenceFocus');e.innerHTML=criteria().map(([code,name,proof])=>`<p><strong>${g<2?'LH 3. zikloa':'DBH 1–2'} · ${code}</strong><br>${esc(proof)}</p>`).join('');
 draw();renderNumeric();renderAssessment();renderHistory();renderCurriculum();save();if(typeof updatePhaseView==='function')updatePhaseView();
}
function numericFields(){return p===1?DATA[g][6]:p===3?DATA[g][9]:[];}
function parseNumber(s){if(typeof s!=='string'||!/^[-+]?\d+(?:[.,]\d+)?$/.test(s.trim()))return null;const n=Number(s.replace(',','.'));return Number.isFinite(n)?n:null;}
function numberFeedback(grade,phase,i,raw){const fields=phase===1?DATA[grade][6]:DATA[grade][9],[label,expected]=fields[i],n=parseNumber(raw);if(n===null)return`${label}: idatzi zenbaki bat; unitatea etiketan dago. Koma edo puntua erabil dezakezu.`;if(Math.abs(n-expected)<1e-8)return`${label}: zenbakizko balioa bat dator. Erakutsi zein bide eta egiaztapen erabili dituzun.`;
 if(grade===1&&phase===3&&((i===0&&n===15)||(i===1&&n===18)))return`${label}: azalera 4z zatitzeak lur kantitatea adierazten du. Kokatu 2 m-ko tarte osoak alde bakoitzean; kontuan hartu soberako zerrenda.`;
 if(grade===2&&phase===1&&i===1&&n===90)return'Tantakako kontsumoa: 90 L aurrezkiaren balioarekin bat dator. Galderak erabiltzen den ura eskatzen du. Zer kendu behar diozu hasierako kontsumoari?';
 if((label.includes('Sail')||label.includes('sail'))&&!Number.isInteger(n))return`${label}: azken erabakiak sail osoak behar ditu. Egiaztatu beheragoko kopuru osoa eta hurrengoa.`;
 return`${label}: balioa berrikusteko dago. ${DATA[grade][10]} Azaldu zer kalkulatu duzun, akatsaren jatorria identifikatzeko.`;}
function renderNumeric(){const box=$('#numeric'),fs=numericFields();box.replaceChildren();if(!fs.length)return;box.className='number-check';box.innerHTML='<h3>Nire kalkuluak kontrastatu</h3><p><small>Zenbakizko kontrastea. Arrazoibidea zure txantiloian azaldu.</small></p>';fs.forEach(([label],i)=>field(box,'numeric'+i,label,form()['num'+i],val=>{form()['num'+i]=val;},'number'));const out=document.createElement('div');out.className='numeric-feedback';out.setAttribute('role','status');button(box,'Egiaztatu kalkuluak',()=>{out.innerHTML=fs.map((_,i)=>'<p>'+esc(numberFeedback(g,p,i,form()['num'+i]||''))+'</p>').join('');log('Zenbakizko kontrastea',out.innerText);save();renderHistory();});box.append(out);}
function review(){const f=form();let text;
 if(p===0){text=!f.story?.trim()?'Azaldu egoera zure hitzekin, zenbakiak kopiatu aurretik. Zer antolatu edo erabaki behar duzue?':!f.question?.trim()?'Zure azalpena jasota dago. Zehaztu orain zein galderari erantzun nahi diozun.':!f.why?.trim()?'Galdera idatzita dago. Azaldu emandako datuekin erantzun daitekeen eta zergatik.':'Konparatu zure galdera eta datuak: datu bakoitzaren esanahia eta unitatea azaldu dituzu? Eskatu ikaskideari problema zure azalpenetik berreraikitzeko.';}
 else if(p===1){text=!f.strategy?.trim()?'Aukeratu estrategia bat eta azaldu zergatik lagunduko dizun. Beste aukera bat ere pentsa dezakezu.':!f.choice?.trim()?'Estrategia izendatu duzu. Lotu orain hautaketa problemaren datu edo baldintza batekin.':!f.reason?.trim()?'Zure hautaketa jasota dago. Azaldu lehen urratsa, hurrengoa eta egindako aldaketa.':'Alderatu bi ebazpide. Zer erakusten du bakoitzak? Zein urratsek justifikatzen du emaitza?';}
 else if(p===2){text=!f.result?.trim()?'Idatzi zure gomendioa esaldi osoz eta unitateekin.':!f.proof?.trim()?'Ondorioa idatzita dago. Egiaztatu beste bide batez edo hurrengo aukera aztertuz, eta jaso froga.':'Itzuli hasierako galderara: frogak baldintza guztiak betetzen direla erakusten du? Adierazi zer ikasi duzun berrikuspenean.';}
 else{text=!f.question?.trim()?'Zer aldatu da egoera berrian? Zehaztu galdera eta behar dituzun datuak.':!f.model?.trim()?'Aukeratu irudikapena eta estrategia; azaldu aurreko egoeran egindakoak nola laguntzen dizun.':!f.variant?.trim()?'Zure ebazpena idatzita dago. Sortu zuk baldintza berri bat; aurreikusi eta egiaztatu zer aldatuko den.':'Konparatu jatorrizko egoera eta zure aldaera. Zein erlazio mantentzen da? Zein froga erabiliko duzu azaltzeko?';}
 $('#feedback').hidden=false;$('#feedback').textContent=text;log('Berrikusteko galdera',text);save();renderHistory();}
function log(kind,text,snapshot=null){note().history.push({date:new Date().toISOString(),phase:p,kind,text,snapshot});}
function snapshotText(data,phase=p){return Object.entries(data).filter(([,v])=>v!==''&&v!==false&&v!=null).map(([k,v])=>{const label=TEMPLATES[phase].groups.flatMap(x=>x[1]).find(x=>x[0]===k)?.[1]||({peer:'Ikaskidearen ekarpena',revision:'Berrikuspena',level:'Lorpen-maila',proof:'Ebidentzia',support:'Laguntza',feedback:'Feedbacka'})[k]||(k.startsWith('num')?((phase===1?DATA[g][6]:DATA[g][9])[Number(k.slice(3))]?.[0]||k):k);return label+': '+(v===true?'Bai':String(v));}).join('\n');}
function renderHistory(){const n=note();$('#portfolioInfo').textContent=`${DATA[g][0]} · ${n.history.length} arrasto · Babeskopia: lau mailak. Inprimatzea: hautatutako maila.`;$('#history').innerHTML=n.history.slice(-8).reverse().map(h=>`<details class="history-item"><summary>${esc(h.kind)} · ${esc(TEMPLATES[h.phase]?.title||'Koadernoa')} · ${esc(new Date(h.date).toLocaleTimeString('eu-ES',{hour:'2-digit',minute:'2-digit'}))}</summary><p>${esc(h.text)}</p>${h.snapshot?'<pre>'+esc(snapshotText(h.snapshot,h.phase))+'</pre>':''}</details>`).join('');}
function evidenceFor(code){const n=note(),rows=CURRICULUM.grades[g].rows.filter(r=>r.codes.includes(code)),out=[],seen=new Set();for(const r of rows){if(r.fields==='firstIdea'){if(n.firstIdea?.trim())out.push('Erronka · '+n.firstIdea);continue;}for(const [i,k] of r.fields){if(seen.has(i+':'+k))continue;seen.add(i+':'+k);const v=n.forms[i][k];if(typeof v==='string'&&v.trim())out.push(TEMPLATES[i].title+' · '+v);}}return out.join('\n\n')||'Hautatu idatzizko pasartea, papereko irudikapena edo ahozko azalpena.';}

function descriptors(code,proof){if(code==='1.1')return['Galdera, datuak edo baldintzak nahasten ditu; frogak oztopoa erakusten du.','Galdera edo datuen zati bat identifikatzen du; erlazioak osatzeko daude.','Galdera, datuak eta baldintza nagusiak koherentziaz lotzen ditu.','Loturak zehaztasunez azaltzen ditu eta informazio falta edo suposizio bat justifikatzen du.'];if(code==='3.2')return['Ez du aldaera koherenterik proposatu.','Baldintza bat aldatzen du; galdera edo azterketa osatzeko dago.','Aldaera ebazgarria planteatu eta aztertzen du.','Aldaeraren eragina alderatu, justifikatu eta orokortze baten muga azaltzen du.'];if(code==='1.2'||code==='1.3')return['Irudikapena ez dator bat egoeraren baldintzekin.','Irudikapenak datu batzuk jasotzen ditu; lotura edo unitate bat falta da.','Irudikapenak egoera eta unitateak koherentziaz adierazten ditu.','Irudikapenak lotu eta haien baliagarritasuna edo muga justifikatzen du.'];return['Ebidentziak ez du oraindik eskatutako jarduna erakusten.','Funtsezko urrats bat erakusten du; azalpena edo egiaztapena osatzeko dago.','Froga koherentea ematen du: '+proof,'Froga zehatza kontrastatu eta egoera aldatuan zergatik balio duen edo zer muga duen azaltzen du.'];}
function renderAssessment(){const n=note(),box=$('#assessment');$('#teacher').hidden=!teacher;$('#printTeacher').hidden=!teacher;$('#teacherGuide').innerHTML='<p>Hasierako hipotesia banaka; estrategien kontrastea bikoteka; egiaztapena eta transferentzia banaka. Erabili txantiloia pentsamendua jasotzeko eta berrikusteko.</p><p><strong>Ebazpen-erreferentzia:</strong> '+esc(DATA[g][11])+'</p><p>Etapa: '+(g<2?'LHko hirugarren zikloa.':'DBHko lehen eta bigarren mailak.')+' Kodeak curriculumekoak dira; beheko deskriptoreak BIDEAKen egokitzapen didaktikoa dira.</p>';
 box.replaceChildren();for(const [code,name,proof] of criteria()){const r=n.assessment[code]??={};if(r.level)r.level=({Egokia:'Garapenean',Aurreratua:'Lortua',Bikaina:'Sendotua'})[r.level]||r.level;const a=document.createElement('article');a.className='criterion';a.innerHTML=`<p class="eyebrow">${g<2?'LH 3. zikloa':'DBH 1–2'} · ${code}</p><h3>${esc(name)}</h3><p>${esc(proof)}</p><details><summary>Ikaslearen uneko ebidentziak ikusi</summary><blockquote>${esc(evidenceFor(code))}</blockquote></details><details><summary>Deskriptoreak eta kontrol-galdera</summary><table class="rubric"><tbody>${descriptors(code,proof).map((text,i)=>'<tr><th scope="row">'+['Hasierakoa','Garapenean','Lortua','Sendotua'][i]+'</th><td>'+esc(text)+'</td></tr>').join('')}</tbody></table><p>Kontrola: non ikusten da «${esc(proof)}»? Identifikatu pasartea, marrazkia edo ahozko froga. Laguntza erabiltzea bereizita jaso; ez jaitsi maila automatikoki.</p></details>`;const grid=document.createElement('div');grid.className='criterion-grid';a.append(grid);const left=document.createElement('div'),right=document.createElement('div');grid.append(left,right);field(left,'level-'+code,'Lorpen-maila',r.level,v=>r.level=v,'select',['Ebidentziarik ez','Hasierakoa','Garapenean','Lortua','Sendotua']);field(right,'proof-'+code,'Baloratzeko hautatutako ebidentzia',r.proof,v=>r.proof=v);field(left,'support-'+code,'Jasotako laguntza',r.support,v=>r.support=v);field(right,'feed-'+code,'Feedbacka eta hurrengo urratsa',r.feedback,v=>r.feedback=v);field(right,'revision-'+code,'Ondorengo berrikuspenaren ebidentzia',r.revision,v=>r.revision=v);box.append(a);}}
function download(name,content,type='application/json'){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
/* Curriculum, catalog and print views are defined below. */
$('#teacherToggle').hidden=STUDENT_ONLY;$('#teacherToggle').onclick=()=>openResource('assessmentDialog');
$('#capture').onclick=()=>{log('Tresnarekin egindako proba',modelText());save();renderHistory();$('#captureStatus').textContent='Proba koadernoan jasota. Azaldu zer erakusten duen.';};
$('#review').onclick=review;$('#checkpoint').onclick=()=>{log('Berrikuspena', 'Une honetako erantzunak gordeta.',JSON.parse(JSON.stringify(form())));save();renderHistory();$('#feedback').hidden=false;$('#feedback').textContent='Berrikuspena gordeta. Ondorengo aldaketek ez dute arrasto hau ordezkatuko.';};
$('#hintButton').onclick=()=>{const f=form(),type=$('#difficulty').value,k='hint_'+type,index=Math.min(Number(f[k]||0),2);const hints={understand:['Kontatu egoera zure hitzekin. Zer erabaki hartu behar duzu?','Bereizi galdera, datuak eta baldintzak. Zein datu dago lotuta galderarekin?',DATA[g][5]],plan:['Zein irudikapenek lagunduko dizu: marrazkiak, taulak edo kasu errazago batek?','Probatu bi aukera txiki. Idatzi zer mantendu eta zer aldatu duzun.',DATA[g][10]],check:['Konparatu emaitza eta hasierako galdera. Unitate bera erabiltzen dute?','Erabili beste bide bat: planoa, alderantzizko eragiketa edo hurrengo aukera.',DATA[g][g<2?7:10]]};const text=hints[type][index];f[k]=index+1;$('#hint').textContent=text;log('Laguntza '+(index+1),text);save();renderHistory();};
$('#export').onclick=()=>download('BIDEAK_koadernoa_'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(state,null,2));
$('#importButton').onclick=()=>$('#import').click();
$('#import').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5000000)throw Error('Fitxategia handiegia da (gehienez 5 MB).');const incoming=validState(JSON.parse(await file.text()));if(!confirm('Babeskopiako mailen lana leheneratuko da. Maila horietako uneko lana ordeztuko da. Jarraitu?'))return;for(const [grade,data] of Object.entries(incoming.grades))state.grades[grade]=data;save();render();$('#importStatus').textContent='Babeskopia berreskuratuta.';}catch(err){$('#importStatus').textContent='Ezin izan da berreskuratu: '+err.message;}finally{e.target.value='';}};
$('#print').onclick=()=>printNotebook(false);$('#printTeacher').onclick=()=>printNotebook(true);$('#clear').onclick=()=>{if(confirm('Gailu honetako lau mailetako koadernoa ezabatu? Gorde babeskopia lehenik.')){state={format:'BIDEAK-v5',grades:{}};save();render();}};
// Preserve earlier work without pretending its generic text has been split into the new fields.
if(!Object.keys(state.grades).length){for(const oldKey of ['bideak-ortua-v4-ikasle','bideak-ortua-v4-irakasle']){try{const old=JSON.parse(localStorage.getItem(oldKey)||'null');if(old&&typeof old==='object'){for(const [grade,data] of Object.entries(old)){if(!DATA.some(x=>x[0]===grade))continue;const n=state.grades[grade]??={forms:[{},{},{},{}],assessment:{},history:[]};n.history.push({date:new Date().toISOString(),phase:0,kind:'Aurreko koadernoko lana',text:JSON.stringify(data,null,2)});}}}catch{}}}
function renderCatalog(){
 $('#catalog').innerHTML=CATALOG.map(r=>`<li class="route-card ${r.ready?'ready':''}"><button class="route-choice" data-route="${r.id}" aria-label="${esc(r.title)} · ${r.ready?'Demora joan':'Aurreikuspena ikusi'}"><span class="route-top"><span class="route-number">${String(r.id).padStart(2,'0')}</span><span class="route-status">${r.ready?'Demo erabilgarria':'Aurreikusita'}</span></span><h3>${esc(r.title)}</h3><p>${esc(r.focus)}</p><span class="route-levels">LH5 <i>·</i> LH6 <i>·</i> DBH1 <i>·</i> DBH2</span><span class="route-action">${r.ready?'Ireki ibilbidea':'Ikusi proposamena'}</span></button></li>`).join('');
 $('#catalog').querySelectorAll('button').forEach(b=>b.onclick=()=>{const r=CATALOG.find(x=>x.id===Number(b.dataset.route));if(r.ready){navigateTo(ortuaPath(g,0));return;}
 $('#routeDialogContent').innerHTML=`<p class="eyebrow">${String(r.id).padStart(2,'0')} / 12 · Garatzeko aurreikusita</p><h2 id="routeDialogTitle">${esc(r.title)}</h2><p class="route-question">${esc(r.question)}</p><p>${esc(r.focus)}</p><div class="table-wrap"><table class="curriculum-table"><thead><tr><th>Maila</th><th>Aurreikusitako jarduera</th></tr></thead><tbody>${r.levels.map((x,i)=>`<tr><th scope="row">${PROGRESSION[i][0]}</th><td>${esc(x)}</td></tr>`).join('')}</tbody></table></div><p class="planned-note">Ibilbide honen jarduerak eta txantiloi interaktiboak ekoizpen-fasean garatuko dira.</p>`;
 openResource('routeDialog');});
 $('#closeRoute').onclick=()=>$('#routeDialog').close();

}
function curriculumTable(meta){return `<div class="table-wrap" tabindex="0" role="region" aria-label="${meta.grade} mailako lotura curricularrak"><table class="curriculum-table"><thead><tr><th>Jarduera</th><th>Ebaluazio-irizpidea</th><th>Oinarrizko jakintza</th><th>Ebidentzia · txantiloiko zatia</th></tr></thead><tbody>${meta.rows.map(r=>`<tr><td><strong>${r.id} · ${r.phase}</strong><br>${esc(r.activity)}</td><td>${r.codes.map(c=>`<strong>${c}</strong><br>${esc(CURRICULUM.criteria[meta.family][c])}`).join('<hr>')}</td><td>${esc(r.knowledge)}</td><td>${esc(r.evidence)}</td></tr>`).join('')}</tbody></table></div>`;}
function renderCurriculum(guideGrade=g){const meta=CURRICULUM.grades[guideGrade];$('#guideGrades').replaceChildren();CURRICULUM.grades.forEach((m,i)=>{const b=button($('#guideGrades'),m.grade,()=>{renderCurriculum(i);$('#guideGrades').children[i].focus({preventScroll:true});});b.setAttribute('aria-pressed',String(guideGrade===i));});
 $('#curriculumMap').innerHTML=`<h3>${meta.grade} · ${esc(meta.title)}</h3><p>${esc(meta.goal)}</p><p class="curriculum-note">${esc(meta.stage)}. Kode eta erreferente ofizialak; formulazio laburtuak eta jarduerarako zehaztapenak.</p>${curriculumTable(meta)}<details class="guide-solution"><summary>Ebazpen-erreferentzia eta feedback-adibidea</summary><p>${esc(meta.solution)}</p><p>${esc(meta.feedback)}</p></details><p class="source-line">77/2023 Dekretua, II. eranskina, Matematika. <a href="${CURRICULUM.source}" target="_blank" rel="noopener">EHAAko testu zuzendua</a>. Irizpideak LHko 3. ziklorako eta DBHko 1.–2. mailetarako ezartzen dira; jardueren eskakizuna mailaz maila egokitu da.</p>`;
}
const printValue=v=>typeof v==='string'&&v.trim()&&v!=='Hautatu'?esc(v):'<span class="blank-space" aria-label="Erantzuteko tartea"></span>';
function printNotebook(teacherOnly=false){
 if(typeof preparePrintView==='function')preparePrintView();
 const n=note(),d=DATA[g],meta=CURRICULUM.grades[g];
 const head=(sub)=>`<header class="print-head"><strong>BIDEAK</strong><span>01 · Eskolako ortua · ${d[0]}</span></header><h1>${sub}</h1>`;
 const foot='<p class="print-credit">Problemenebazpena.eus lantaldearen txantiloien egokitzapena · BIDEAK · CC BY-SA 4.0</p>';
 const row=(label,value)=>`<tr><th scope="row">${esc(label)}</th><td>${printValue(value)}</td></tr>`;
 let out='';
 if(teacherOnly){
 out=`<section class="print-sheet">${head('Irakaslearen ebaluazio-erregistroa')}<p>Baloratu curriculumeko irizpidea, identifikatutako ebidentzian oinarrituta. Laguntza erabiltzea bereizita jaso.</p>${criteria().map(([c,name])=>{const r=n.assessment[c]||{};return `<table class="print-table assessment-print"><caption>${c} · ${esc(name)}</caption><thead><tr><th>Eremua</th><th>Balorazioa eta ebidentzia</th></tr></thead><tbody>${row('Lorpen-maila',r.level)}${row('Hautatutako ebidentzia',r.proof)}${row('Jasotako laguntza',r.support)}${row('Feedbacka / hurrengo urratsa',r.feedback)}${row('Berrikuspenaren ebidentzia',r.revision)}</tbody></table>`;}).join('')}<p class="print-note">Lorpen-mailak: Hasierakoa · Garapenean · Lortua · Sendotua. Ebidentziarik ez badago, jaso hala; ez bihurtu kalifikazio baxu.</p>${foot}</section>`;
 }else{
 out=TEMPLATES.flatMap((t,i)=>{const cut=Math.ceil(t.groups.length/2);return [t.groups.slice(0,cut),t.groups.slice(cut)].map((groups,part)=>{
 const f=n.forms[i];let table='';
 for(const [name,items] of groups){table+=`<tr class="group-row"><th colspan="2" scope="colgroup">${esc(name)}</th></tr>`;for(const [id,label,type] of items.filter(x=>x[2]!=='check'))table+=row(label,f[id]);const checks=items.filter(x=>x[2]==='check');if(checks.length)table+=`<tr><th scope="row">${name==='Estrategia posibleak'?'Nire aukerak':'Nire autoegiaztapena'}</th><td>${checks.map(([id,label])=>`<div class="print-check">${f[id]===true?'☑':'☐'} ${esc(label)}</div>`).join('')}</td></tr>`;}
 if(part===1){if(i===1||i===3){table+='<tr class="group-row"><th colspan="2">Kalkuluen kontrastea</th></tr>';table+=(i===1?d[6]:d[9]).map(([label],k)=>row(label,f['num'+k])).join('');}
 table+='<tr class="group-row"><th colspan="2">Kontrastea eta berrikuspena</th></tr>'+row('Ikaskidearen ekarpena',f.peer)+row('Zer aldatu dut?',f.revision);}
 const task=i===0?d[5]:i===1?'Aukeratu estrategia, probatu eta azaldu urratsak.':i===2?d[7]:d[8];
 return `<section class="print-sheet">${head((i+2)+' · '+(i===3?'Transferentzia':t.title)+' <small class="part-label">'+(part+1)+'/2</small>')}${i===0&&part===0?`<div class="print-context"><p>${esc(d[3])}</p><p><strong>${esc(d[4])}</strong></p></div><table class="print-table first-idea"><tbody>${row('01 · Erronka. Nire lehen ideia',n.firstIdea)}</tbody></table>`:''}<p class="print-task">${esc(task)}</p><table class="print-table"><thead><tr><th>Galdera / jarduera</th><th>Nire erantzuna eta frogak</th></tr></thead><tbody>${table}</tbody></table>${foot}</section>`;
 });}).join('');
 if(n.history.length)out+=`<section class="print-sheet">${head('Lanaren arrastoa')}<table class="print-table"><thead><tr><th>Une eta jarduera</th><th>Jasotako froga</th></tr></thead><tbody>${n.history.map(h=>row(new Date(h.date).toLocaleString('eu-ES')+' · '+h.kind+' · '+TEMPLATES[h.phase].title,h.text+(h.snapshot?'\n\n'+snapshotText(h.snapshot,h.phase):''))).join('')}</tbody></table>${foot}</section>`;
 }
 const area=$('#printArea');area.innerHTML=`<div class="print-toolbar"><button id="closePrint">Itzuli koadernora</button><span>${teacherOnly?'Ebaluazio-erregistroa':'Ikaslearen koadernoa'} · ${d[0]}</span><button class="primary" id="doPrint">Inprimatu / Gorde PDF gisa</button></div>`+out;
 document.body.classList.add('print-preview');area.setAttribute('tabindex','-1');area.focus();window.scrollTo(0,0);
 $('#doPrint').onclick=()=>window.print();$('#closePrint').onclick=closePrint;
}
function closePrint(){document.body.classList.remove('print-preview');if(typeof restoreAfterPrint==='function')restoreAfterPrint();else $('#print').focus();}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('print-preview'))closePrint();});


