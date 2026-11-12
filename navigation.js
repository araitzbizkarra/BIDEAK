'use strict';
const PHASE_NAMES=['Erronka','Ulermena','Arrazoiketa','Autonomia','Transferentzia'];
const PHASE_PATHS=['erronka','ulermena','arrazoiketa','autonomia','transferentzia'];
let currentPage='',currentLocation='',homeScroll=0,printReturnDialog=null;
const dialogTriggers=new WeakMap();
function ortuaPath(grade,phase){return '#/ortua/'+DATA[grade][0].toLowerCase()+'/'+PHASE_PATHS[phase];}
function parseRoute(hash){
 const parts=hash.replace(/^#\/?/,'').split('/');
 if(parts[0]==='ortua'){
  const grade=DATA.findIndex(d=>d[0].toLowerCase()===parts[1]),phase=PHASE_PATHS.indexOf(parts[2]);
  return {page:'ortua',grade:grade<0?0:grade,phase:phase<0?0:phase};
 }
 if(['koadernoa','ibilbideak','laborategia','phases'].includes(parts[0])&&!hash.startsWith('#/'))return {page:'ortua',grade:0,phase:parts[0]==='koadernoa'?1:0};
 return STUDENT_ONLY?{page:'ortua',grade:g,phase:0}:{page:'catalog'};
}
function navigateTo(path){
 if(location.hash!==path)history.pushState(null,'',path);
 applyRoute();
}
function applyRoute(initial=false){
 const route=parseRoute(location.hash),target=route.page==='catalog'?'#/ibilbideak':ortuaPath(route.grade,route.phase);
 if(location.hash!==target)history.replaceState(null,'',target);
 if(!initial&&target===currentLocation)return;
 const previousPage=currentPage;
 if(previousPage==='catalog'&&route.page!=='catalog')homeScroll=window.scrollY;
 document.querySelectorAll('dialog[open]').forEach(d=>closeResource(d,false));
 document.body.classList.remove('print-preview');
 currentPage=route.page;currentLocation=target;
 document.body.dataset.view=currentPage;
 $('#catalogView').hidden=currentPage!=='catalog';$('#routeView').hidden=currentPage!=='ortua';
 $('#homeNav').hidden=currentPage!=='catalog'||STUDENT_ONLY;
 $('#routeTopLabel').hidden=currentPage!=='ortua';$('#backCatalog').hidden=STUDENT_ONLY;
 document.querySelectorAll('[data-teacher]').forEach(el=>el.hidden=STUDENT_ONLY);
 if(currentPage==='ortua'){
  if(g!==route.grade){modelN=10;showPlots=false;vertical=true;}
  g=route.grade;p=Math.max(0,route.phase-1);onChallenge=route.phase===0;
  alternative=route.phase===4;reading=false;render();
  document.title='BIDEAK · Ortua · '+DATA[g][0]+' · '+PHASE_NAMES[route.phase];
  const heading=previousPage==='ortua'?(onChallenge?$('#challengeTitle'):$('#templateTitle')):$('#routeTitle');
  heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});
 }else{
  document.title='BIDEAK · 12 ibilbide';
  const heading=$('#catalogTitle');heading.setAttribute('tabindex','-1');
  if(!initial)heading.focus({preventScroll:true});
  window.scrollTo({top:previousPage==='ortua'?homeScroll:0,behavior:'instant'});
 }
}
function updatePhaseView(){
 const phase=onChallenge?0:p+1;
 $('#erronka').hidden=!onChallenge;$('#koadernoa').hidden=onChallenge;
 $('#phaseLocation').textContent=DATA[g][0]+' · '+PHASE_NAMES[phase];
 $('#phaseCount').textContent=(phase+1)+' / 5';$('#previousPhase').disabled=phase===0;
 $('#nextPhase').textContent=phase===4?'Koadernoa ireki':PHASE_NAMES[phase+1]+' →';
 $('#contextButton').hidden=onChallenge;
 $('#contextModalGrade').textContent=DATA[g][0]+' · '+DATA[g][1];
 $('#contextModalText').textContent=DATA[g][3];$('#contextModalQuestion').textContent=DATA[g][4];
 $('#assessmentGrade').textContent=DATA[g][0]+' · '+DATA[g][1];
 $('#modelDialog .dialog-head .eyebrow').textContent='Eskolako ortua · '+DATA[g][0];
 $('#portfolioDialog .dialog-head .eyebrow').textContent='Eskolako ortua · '+DATA[g][0];
 $('#phases').querySelectorAll('button').forEach((el,i)=>{if(i===phase)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
}
function openResource(id,trigger=document.activeElement){
 const dialog=document.getElementById(id);if(!dialog)return;
 if(STUDENT_ONLY&&['guideDialog','assessmentDialog','aboutDialog'].includes(id))return;
 if(id==='guideDialog')renderCurriculum();
 if(id==='assessmentDialog'){teacher=true;renderAssessment();$('#teacherToggle').setAttribute('aria-expanded','true');}
 if(id==='portfolioDialog')renderHistory();
 dialogTriggers.set(dialog,trigger);dialog.dataset.restoreFocus='yes';
 if(!dialog.open)dialog.showModal();
 document.body.classList.add('modal-open');
 (dialog.querySelector('[data-close]')||dialog.querySelector('button'))?.focus({preventScroll:true});
}
function closeResource(dialog,restore=true){dialog.dataset.restoreFocus=restore?'yes':'no';dialog.close();}
function preparePrintView(){
 printReturnDialog=document.querySelector('dialog[open]');
 if(printReturnDialog)closeResource(printReturnDialog,false);
}
function restoreAfterPrint(){
 if(printReturnDialog){const dialog=printReturnDialog;printReturnDialog=null;openResource(dialog.id);dialog.querySelector('#printTeacher,#print')?.focus({preventScroll:true});}
 else $('#routeTitle').focus({preventScroll:true});
}
document.querySelectorAll('dialog').forEach(dialog=>{
 dialog.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeResource(dialog)));
 dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeResource(dialog);});
 dialog.addEventListener('close',()=>{
  document.body.classList.toggle('modal-open',!!document.querySelector('dialog[open]'));
  if(dialog.id==='assessmentDialog'){teacher=false;$('#teacherToggle').setAttribute('aria-expanded','false');}
  const trigger=dialogTriggers.get(dialog);
  if(dialog.dataset.restoreFocus!=='no'&&trigger?.isConnected&&trigger.getClientRects().length)trigger.focus({preventScroll:true});
 });
});
document.querySelectorAll('[data-dialog]').forEach(button=>button.addEventListener('click',()=>openResource(button.dataset.dialog,button)));
document.addEventListener('click',e=>{if(e.target.closest('.skip')){e.preventDefault();const main=$('#main');main.setAttribute('tabindex','-1');main.focus();return;}const link=e.target.closest('a[href^="#/"]');if(!link)return;e.preventDefault();navigateTo(link.getAttribute('href'));});
$('#previousPhase').onclick=()=>{const phase=onChallenge?0:p+1;if(phase>0)navigateTo(ortuaPath(g,phase-1));};
$('#nextPhase').onclick=()=>{const phase=onChallenge?0:p+1;if(phase===4)openResource('portfolioDialog',$('#nextPhase'));else navigateTo(ortuaPath(g,phase+1));};
window.addEventListener('popstate',()=>applyRoute());window.addEventListener('hashchange',()=>applyRoute());
if(STUDENT_ONLY){$('.brand').removeAttribute('href');$('.brand').removeAttribute('aria-label');}
renderCatalog();applyRoute(true);
