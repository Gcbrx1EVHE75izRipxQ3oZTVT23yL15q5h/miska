import {Game,STEP,PX,W,H,tier,WORLDS,STARTS,ringY,environment,multiplier} from './physics.mjs';
import {smooth,renderState} from './motion.mjs';
import {dancePose,BEAT} from './groove.mjs';
import {Sound} from './sound.mjs';
import {API_URL,beginRankedRun,submitRankedRun,fetchRankings} from './leaderboard-client.mjs';
import {loadProfile,saveProfile,addRun,ranked,cleanName} from './profile.mjs';
const $=s=>document.querySelector(s),canvas=$('#game'),c=canvas.getContext('2d',{alpha:false});const names=['sky','forest','crystal','volcano','space'],colors=['#ffda58','#6fffaf','#e8a0ff','#ff9b3f','#7eebff'];
const assets={},particles=[];let g=null,paused=false,last=0,acc=0,time=0,menuTime=0,pendingTap=false,seed=42,best={rings:0,score:0},lastNotice='',frames=[],visualTilt=0,surpriseMix=0,renderTravel=0,renderTime=0;
try{best=JSON.parse(localStorage.getItem('ring-dive-best-v1'))||best}catch{}function record(){$('#record').textContent=`PARAS · ${best.rings} RENGASTA · ${best.score.toLocaleString('fi-FI')} PISTETTÄ`}record();
const loading=Promise.all([...names,'logo','props','body-happy','body-surprised','wing','shoe','menu-body-front','menu-shoe-left','menu-shoe-right'].map(name=>new Promise((resolve,reject)=>{let im=new Image();im.onload=()=>{assets[name]=im;resolve()};im.onerror=()=>reject(Error(name));im.src=`assets/${name}.webp`})));
const profile=(()=>{try{return loadProfile(localStorage)}catch{return loadProfile({getItem:()=>null})}})(),sound=new Sound(profile),menuGroove=sound.groove;menuGroove.beatOffset=()=>time%(BEAT*8);let weekOnly=false,runBestStreak=0,rankedSession=null,runTaps=[],starting=false,boardGeneration=0;
function save(){try{saveProfile(localStorage,profile)}catch{}}
window.addEventListener('storage',event=>{if(event.key==='ring-dive-profile-v2'){try{Object.assign(profile,loadProfile(localStorage));$('#playerName').value=profile.name;for(const [key,id,out] of [['music','musicVolume','musicValue'],['effects','effectsVolume','effectsValue']]){$('#'+id).value=Math.round(profile[key]*100);$('#'+out).textContent=$('#'+id).value+' %'}$('#reducedMotion').checked=profile.reduced;$('#shell').dataset.reduced=profile.reduced;sound.sync();if(!$('#leaderboard').hidden)renderBoard()}catch{}}});
function syncMusic(){sound.menu=!$('#menu').hidden;sound.visible=!document.hidden;sound.sync();$('#shell').classList.toggle('menu-open',!$('#menu').hidden)}
sound.listeners.push(()=>{$('#menuMusic').textContent='♫ '+sound.status;$('#menuMusic').setAttribute('aria-pressed',String(sound.unlocked&&!sound.muted));$('#audioStatus').textContent=sound.status;$('#sound').textContent=sound.muted?'♪̸':'♫';$('#sound').setAttribute('aria-label',sound.muted?'Äänet päälle':'Mykistä äänet')});
function showPanel(id){$('#menu').inert=true;document.querySelectorAll('.panel').forEach(el=>el.hidden=el.id!==id);$('#menu').hidden=false;syncMusic();if(id==='leaderboard')renderBoard();if(id==='worlds')renderWorlds();$('#'+id+' .panel-close')?.focus()}
function closePanels(){$('#menu').inert=false;document.querySelectorAll('.panel').forEach(el=>el.hidden=true);$('#settingsOpen').focus()}
async function renderBoard(){
 const generation=++boardGeneration;
 const cutoff=new Date();cutoff.setHours(0,0,0,0);cutoff.setDate(cutoff.getDate()-((cutoff.getDay()+6)%7));
 let rows=ranked(profile.runs).filter(r=>!weekOnly||r.at>=+cutoff).slice(0,20);$('#boardScope').textContent=API_URL?'LADATAAN YHTEISTÄ LISTAA…':'TÄMÄN LAITTEEN TULOKSET';if(API_URL){try{const result=await fetchRankings(weekOnly);if(generation!==boardGeneration)return;rows=result.rows;$('#boardScope').textContent='KAIKKIEN PELAAJIEN TULOKSET'}catch{if(generation!==boardGeneration)return;$('#boardScope').textContent='EI YHTEYTTÄ · TÄMÄN LAITTEEN TULOKSET'}}const list=$('#leaderList');list.replaceChildren();
 if(!rows.length){list.innerHTML='<div class="board-empty"><span>♛</span><b>Ensimmäinen sija odottaa.</b><p>Pelaa ensimmäinen lentosi ja jätä jälkesi taivaalle.</p></div>'}
 rows.forEach((r,i)=>{const row=document.createElement('div');row.className='leader-row';const rank=document.createElement('span');rank.className='rank';rank.textContent=i===0?'♛':String(i+1).padStart(2,'0');const person=document.createElement('div'),name=document.createElement('div');name.className='name';name.textContent=r.name;const detail=document.createElement('small');detail.textContent=r.rings+' rengasta · '+new Date(r.at).toLocaleDateString('fi-FI');person.append(name,detail);const score=document.createElement('strong');score.textContent=r.score.toLocaleString('fi-FI');row.append(rank,person,score);list.append(row)});
 $('#personalStats').innerHTML=`<div><strong>${profile.plays}</strong><span>LENTOJA</span></div><div><strong>${profile.totalRings}</strong><span>RENKAITA</span></div><div><strong>${profile.bestStreak}</strong><span>PERFECT-KETJU</span></div>`;
 $('#allTime').setAttribute('aria-selected',String(!weekOnly));$('#thisWeek').setAttribute('aria-selected',String(weekOnly));
}
function renderWorlds(){const descriptions=['Ensimmäiset siiveniskut','Vihreän hehkun kutsu','Kristallien keskellä','Rohkeutta ja kuumia kimmokkeita','Kohti ääretöntä'];$('#worldGallery').replaceChildren();WORLDS.forEach((name,i)=>{const el=document.createElement('article');el.className='world-tile';el.style.setProperty('--image',`url(assets/${names[i]}.webp)`);el.innerHTML=`<span class="number">0${i+1}</span><div><h3>${name}</h3><small>${STARTS[i]+1}${i===4?'+':'–'+[15,35,60,90][i]} · ${descriptions[i]}</small></div><span class="world-state">${best.rings>=STARTS[i]?'✦':'·'}</span>`;$('#worldGallery').append(el)})}
$('#settingsOpen').onclick=()=>{sound.unlock();showPanel('settings')};$('#leaderboardOpen').onclick=()=>{sound.unlock();showPanel('leaderboard')};$('#worldsOpen').onclick=()=>{sound.unlock();showPanel('worlds')};$('#helpOpen').onclick=()=>{sound.unlock();showPanel('help')};
document.querySelectorAll('.panel-close').forEach(b=>b.onclick=closePanels);
$('#allTime').onclick=()=>{weekOnly=false;renderBoard()};$('#thisWeek').onclick=()=>{weekOnly=true;renderBoard()};
$('#playerName').value=profile.name;$('#playerName').onchange=e=>{profile.name=cleanName(e.target.value);e.target.value=profile.name;save()};
for(const [id,key,out] of [['musicVolume','music','musicValue'],['effectsVolume','effects','effectsValue']]){const slider=$('#'+id);slider.value=Math.round(profile[key]*100);$('#'+out).textContent=slider.value+' %';slider.onpointerdown=()=>sound.unlock();slider.oninput=()=>{profile[key]=Number(slider.value)/100;$('#'+out).textContent=slider.value+' %';save();sound.sync()};slider.onchange=()=>{sound.unlock();sound.effect('click')}}
$('#reducedMotion').checked=profile.reduced;$('#shell').dataset.reduced=profile.reduced;$('#reducedMotion').onchange=e=>{profile.reduced=e.target.checked;$('#shell').dataset.reduced=profile.reduced;save()};
$('#audioTest').onclick=async()=>{sound.muted=false;await sound.unlock();sound.effect('perfect')};
// One explicit gesture unlocks the shared music AND effects context on mobile.
$('#menuMusic').onclick=async()=>{if(!sound.unlocked){sound.muted=false;await sound.unlock()}else{sound.muted=!sound.muted;sound.sync()}sound.effect('click')};
const poseCanvas=document.createElement('canvas');poseCanvas.width=270;poseCanvas.height=240;const poseContext=poseCanvas.getContext('2d');
const ringCache={};function ringImage(id,front){const key=id+'-'+front;if(ringCache[key])return ringCache[key];const cv=document.createElement('canvas');cv.width=240;cv.height=90;const q=cv.getContext('2d');q.translate(120,42);q.lineCap='round';const a=front?0:Math.PI,b=front?Math.PI:Math.PI*2;function line(w,color,dy=0,blur=0){q.lineWidth=w;q.strokeStyle=color;q.shadowColor=colors[id];q.shadowBlur=blur;q.beginPath();q.ellipse(0,dy,91,18,0,a,b);q.stroke()}
line(14,colors[id],2,19);line(11,'#2b2837',5);let gr=q.createLinearGradient(0,-20,0,25);gr.addColorStop(0,'#fffad9');gr.addColorStop(.35,colors[id]);gr.addColorStop(.7,colors[id]);gr.addColorStop(1,'#9b6f36');line(10,gr);line(2.5,'#ffffee',-2);ringCache[key]=cv;return cv}
function ring(r,front){const x=r.x-renderTravel,y=ringY(r,renderTime);if(x<-140||x>W+140)return;c.save();if(r.n<g.passed)c.globalAlpha=.5;const im=ringImage(r.t,front),scale=r.half/91;c.drawImage(im,x-120*scale,y-42*scale,240*scale,90*scale);if(!front&&r.n===g.passed){c.fillStyle='#fff';c.font='900 10px system-ui';c.textAlign='center';c.shadowColor='#092545';c.shadowBlur=5;c.fillText(String(r.n+1),x,y+43)}c.restore()}
function backdrop(id,alpha,travel){if(alpha<=0)return;const im=assets[names[id]];if(!im)return;c.save();c.globalAlpha=alpha;const scale=H/im.height,bw=im.width*scale;let offset=(travel*.09)%(2*bw);for(let tile=-1;tile<3;tile++){let x=tile*bw-offset;if(x+bw<0||x>W)continue;c.save();if(Math.abs(tile)%2){c.translate(x+bw,0);c.scale(-1,1);c.drawImage(im,0,0,bw,H)}else c.drawImage(im,x,0,bw,H);c.restore()}
const grad=c.createLinearGradient(0,0,0,H);grad.addColorStop(0,'#081f4b45');grad.addColorStop(.28,'#11244b00');grad.addColorStop(.72,'#11244b00');grad.addColorStop(1,'#06162b55');c.fillStyle=grad;c.fillRect(0,0,W,H);
const atlas=assets.props,sw=atlas.width/5;for(let j=0;j<4;j++){const depth=j%2?1.3:.8,loop=650,x=((j*203+580-travel*.27*depth)%loop+loop)%loop-120,y=j%2?500:560;const size=(j%2?135:100);c.globalAlpha=alpha*(j%2?.85:.55);c.drawImage(atlas,id*sw,0,sw,atlas.height,x,y+Math.sin(time*.5+j)*9,size,size*atlas.height/sw)}
// Separate atmosphere layer: drifting mist / fireflies / crystal motes / embers / starlight.
c.globalCompositeOperation='screen';for(let j=0;j<22;j++){const x=((j*71.31-travel*(.06+j%3*.035))%W+W)%W,y=(j*89.7+Math.sin(time*.65+j)*17)%H,sz=id===0?22:id===4?1:1.6;c.globalAlpha=alpha*(id===0?.08:.15+.28*(.5+.5*Math.sin(time+j)));c.fillStyle=id===0?'#fff':colors[id];c.beginPath();c.arc(x,y,sz,0,7);c.fill()}c.restore()}
function potato(x,y,vy,flap,scale=1,dt=0,spin=0,omega=0,dance=null){
 const happy=assets['body-happy'],surprised=assets['body-surprised'];if(!happy)return;
 visualTilt=smooth(visualTilt,Math.max(-.2,Math.min(.32,vy/950)),dt,10);
 surpriseMix=smooth(surpriseMix,Math.abs(omega)>2.4||vy>230?1:0,dt,12);
 // The body is rigid: only uniform scaling is used. Each source keeps its aspect.
 c.save();c.translate(x,y);c.rotate(visualTilt+spin+(dance?.lean||0));c.scale(scale,scale);
 const clock=g?renderTime:time,energy=flap/.25;
 function wing(px,py,size,mirror,phase){const im=assets.wing;if(!im)return;c.save();c.translate(px,py);c.scale(mirror,1);c.rotate(dance?(mirror===1?dance.wingLeft:dance.wingRight):-.12+Math.sin(clock*14+phase)*(.12+energy*.5));const h=size*im.height/im.width;c.drawImage(im,-size*.87,-h*.78,size,h);c.restore()}
 function shoe(px,py,phase){const im=assets.shoe;if(!im)return;c.save();c.translate(px+(dance?(phase?dance.rightSlide:dance.leftSlide):0),py-(dance?(phase?dance.rightLift:dance.leftLift):0));c.scale(-1,1);c.rotate(.25+(dance?(phase?dance.rightTurn:dance.leftTurn):Math.sin(clock*7+phase)*.14+vy/2500));const w=19;c.drawImage(im,-w*.7,-5,w,w*im.height/im.width);c.restore()}
 wing(25,-4,22,-1,1.4);shoe(-7,25,1.8);shoe(-23,24,0);
 poseContext.clearRect(0,0,270,240);poseContext.globalCompositeOperation='lighter';
 for(const [im,opacity] of [[happy,1-surpriseMix],[surprised,surpriseMix]]){if(!im||opacity<.002)continue;const w=240,h=w*im.height/im.width;poseContext.globalAlpha=opacity;poseContext.drawImage(im,(270-w)/2,(240-h)/2,w,h)}
 c.drawImage(poseCanvas,-40.5,-36,81,72);wing(-22,-3,32,1,0);c.restore();
}
// The title has its own upright rig. Flight sprites and shoe directions are
// intentionally kept separate from the standing, front-facing dance pose.
function standingPotato(x,y,scale,dance){
 const body=assets['menu-body-front'];if(!body)return;
 c.save();c.translate(x,y);c.scale(scale,scale);c.translate(dance.travel||0,0);
 // A stationary floor and separate contact shadows make the sliding support
 // foot read as grounded rather than the whole character floating around.
 c.save();c.translate(0,53);c.scale(1,.13);
 const floor=c.createRadialGradient(0,0,2,0,0,46);
 floor.addColorStop(0,'#132b4080');floor.addColorStop(1,'#132b4000');
 c.fillStyle=floor;c.beginPath();c.arc(0,0,46,0,Math.PI*2);c.fill();c.restore();
 const feet=[{name:'menu-shoe-left',side:-1,slide:dance.leftSlide,lift:dance.leftLift,depth:dance.leftDepth,turn:dance.leftTurn,yaw:dance.leftYaw,pitch:dance.leftPitch},
 {name:'menu-shoe-right',side:1,slide:dance.rightSlide,lift:dance.rightLift,depth:dance.rightDepth,turn:dance.rightTurn,yaw:dance.rightYaw,pitch:dance.rightPitch}];
 for(const f of feet){f.x=f.side*15+f.slide;f.y=52+f.depth*.3-f.lift;f.scale=1+f.depth*.006;
  c.fillStyle=`rgba(8,26,42,${.26*(1-f.lift/24)})`;c.beginPath();c.ellipse(f.x,53+f.depth*.3,12*f.scale,2.2+f.lift*.05,0,0,Math.PI*2);c.fill();
 }
 function foot(f){const im=assets[f.name],w=23,h=w*im.height/im.width;
  // The short leg bends outwards as the knee rises. The body covers the hip.
  const hipX=f.side*15+dance.x,hipY=18+dance.y,kneeX=f.x+f.side*(3+f.lift*.22),ankleY=f.y-h*.62;
  const skin=c.createLinearGradient(kneeX-5,0,kneeX+5,0);skin.addColorStop(0,'#9b572b');skin.addColorStop(.45,'#db9b51');skin.addColorStop(1,'#a56330');
  c.strokeStyle=skin;c.lineWidth=9;c.lineCap='round';c.beginPath();c.moveTo(hipX,hipY);c.quadraticCurveTo(kneeX,(hipY+ankleY)/2+4,f.x,ankleY);c.stroke();
  c.save();c.translate(f.x,f.y);c.scale(f.scale,f.scale);
  // Heel/toe pivots take place around the sole, not around the body centre.
  c.translate(f.turn>0?7:-7,-1);c.rotate(f.turn);c.translate(f.turn>0?-7:7,1);
  c.transform(Math.cos(f.yaw),0,Math.sin(f.yaw)*.22,Math.cos(f.pitch),0,0);
  c.drawImage(im,-w/2,-h,w,h);c.restore();
 }
 // The stepping shoe can move in FRONT of the body; depth order changes at
 // the plant, where it is low enough to avoid a visible occlusion pop.
 for(const f of feet.filter(f=>f.depth<=0&&f.lift<=1))foot(f);
 c.save();c.translate(dance.x,dance.y);c.rotate(dance.lean);
 function arm(px,mirror,angle){const im=assets.wing,w=26,h=w*im.height/im.width;
  c.save();c.translate(px,-17);c.scale(mirror,1);c.rotate(angle);c.drawImage(im,-w*.9,-h*.65,w,h);c.restore();
 }
 arm(-28,1,dance.wingLeft);arm(28,-1,dance.wingRight);
 const w=64,h=w*body.height/body.width;
 c.save();c.rotate(dance.headTurn||0);c.drawImage(body,-w/2,24-h,w,h);c.restore();
 c.restore();for(const f of feet.filter(f=>f.depth>0||f.lift>1))foot(f);
 c.restore();
}
function puff(x,y,color,n=18){for(let i=0;i<n;i++){const a=i*2.399+time,v=20+(i%7)*12;particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.65,max:.65,col:color,size:1+i%3})}if(particles.length>100)particles.splice(0,particles.length-100)}
function tone(type){sound.effect(type)}
async function start(start=0,demo=false){if(starting)return;starting=true;sound.unlock();rankedSession=null;runTaps=[];let runSeed=seed++;if(API_URL&&start===0&&!demo&&$('#lab').hidden){$('#play').disabled=true;$('#play').textContent='VALMISTAUDUTAAN…';try{rankedSession=await beginRankedRun();runSeed=rankedSession.seed}catch{}$('#play').disabled=false}starting=false;closePanels();runBestStreak=0;g=new Game({seed:runSeed,start,test:start>0||$('#lab').hidden===false,demo});paused=false;$('#pause').setAttribute('aria-label','Tauko');pendingTap=false;acc=0;particles.length=0;$('#menu').hidden=true;$('#pauseMenu').hidden=true;$('#lab').hidden=true;$('#hud').hidden=false;$('#journey').hidden=false;$('#testLabel').hidden=!g.test;$('#footer').hidden=false;lastNotice='';visualTilt=0;surpriseMix=0;syncMusic();hud()}
function hud(){if(!g)return;$('#rings').textContent=g.passed;$('#score').textContent=g.score.toLocaleString('fi-FI');$('#mult').textContent='KERROIN ×'+multiplier(g.streak);const r=g.course.rings[g.passed],prev=g.course.rings[Math.max(0,g.passed-1)];const progress=Math.max(0,Math.min(1,1-(r.x-g.travel-PX)/Math.max(1,r.x-prev.x)));const env=environment(g.passed,progress);$('#world').textContent=WORLDS[env.from];$('#journey i').style.width=(Math.min(90,g.passed)/90*100)+'%';document.querySelectorAll('.stops b').forEach((el,i)=>{el.classList.toggle('active',i<=env.from);el.style.setProperty('--color',colors[i])});if(g.noticeTime>0&&g.mode==='play'){$('#notice').innerHTML=g.notice+`<small>×${multiplier(g.streak)} · ${g.score.toLocaleString('fi-FI')} PISTETTÄ</small>`;$('#notice').classList.add('show')}else $('#notice').classList.remove('show')}
function end(){if(!g.test){if(rankedSession){profile.playerId??=crypto.randomUUID();submitRankedRun({token:rankedSession.token,player:profile.playerId,name:profile.name,ticks:g.tick,taps:runTaps,rings:g.passed,score:g.score,test:false}).then(()=>{$('#record').textContent+=' · TULOS TALLENNETTU'}).catch(()=>{$('#record').textContent+=' · TALLENNETTU LAITTEELLE'})}addRun(profile,{rings:g.passed,score:g.score,bestStreak:runBestStreak,test:g.test});save();best.rings=Math.max(best.rings,g.passed);best.score=Math.max(best.score,g.score);try{localStorage.setItem('ring-dive-best-v1',JSON.stringify(best))}catch{}}record();$('#menu').hidden=false;$('#title').textContent=g.reason;$('#message').innerHTML=`<b>${g.passed} rengasta · ${g.score.toLocaleString('fi-FI')} pistettä</b><br>${g.test?'Testisuoritus · ei ennätystä':'Vielä yksi sukellus?'}`;$('#play').textContent='UUSI SUKELLUS ↗';$('#menuKicker').textContent=g.test?'HARJOITUSLENTO':'HIENO LENTO, '+profile.name;$('#testLabel').hidden=true;$('#hud').hidden=true;$('#journey').hidden=true;$('#notice').classList.remove('show');tone('over');syncMusic()}
function tap(){if(g?.mode==='play'&&!paused&&!g.demo){pendingTap=true;sound.effect('tap')}}
canvas.addEventListener('pointerdown',e=>{e.preventDefault();tap()});document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea'))return;if(['Space','ArrowUp'].includes(e.code)){e.preventDefault();if(!e.repeat&&$('#menu').hidden&&$('#lab').hidden)tap()}if(e.code==='Escape'){if(document.querySelector('.panel:not([hidden])'))closePanels();else if(g?.mode==='play')pause(!paused)}});
function pause(value){if(g?.mode!=='play')return;paused=value;acc=0;pendingTap=false;$('#pauseMenu').hidden=!value;$('#pause').setAttribute('aria-label',value?'Jatka':'Tauko')}
$('#pause').onclick=()=>pause(true);$('#resume').onclick=()=>pause(false);$('#home').onclick=()=>{g=null;paused=false;$('#pauseMenu').hidden=true;$('#menu').hidden=false;$('#title').textContent='Taivas on vasta alku.';$('#menuKicker').textContent='SEIKKAILU ODOTTAA';$('#message').innerHTML='Napauta siivet liikkeelle.<br>Pudottaudu jokaisen renkaan läpi <b>ylhäältä alas.</b>';$('#play').textContent='PELAA';$('#hud').hidden=true;$('#journey').hidden=true;$('#testLabel').hidden=true;syncMusic()};$('#play').onclick=()=>start();$('#labOpen').onclick=()=>{closePanels();$('#lab').hidden=false;$('#menu').hidden=true;syncMusic()};$('#grazeTest').onclick=async()=>{await start(0,false);g.y=g.prevY=253;g.vy=-2.6041666667;Object.assign(g.course.rings[0],{x:199,base:275,amplitude:0});};$('#labClose').onclick=()=>{$('#lab').hidden=true;$('#menu').hidden=false;syncMusic()};$('#sound').onclick=async()=>{if(!sound.unlocked){sound.muted=false;await sound.unlock()}else sound.muted=!sound.muted;sound.sync();sound.effect('click')};document.addEventListener('visibilitychange',()=>{if(document.hidden)pause(true);last=0;acc=0;syncMusic()});
WORLDS.forEach((name,i)=>{const b=document.createElement('button');b.style.setProperty('--image',`url(assets/${names[i]}.webp)`);b.innerHTML=`${i+1}. ${name}<small>${STARTS[i]+1}${i===4?'+':'–'+[15,35,60,90][i]}</small>`;b.onclick=()=>start(STARTS[i],$('#demo').checked);$('#worldButtons').appendChild(b)});
function frame(ms){let dt=Math.min(.1,last?(ms-last)/1000:0);last=ms;time+=dt;c.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);c.clearRect(0,0,W,H);
if(g?.mode==='play'&&!paused){acc+=dt;while(acc+1e-10>=STEP){if(pendingTap&&!g.test)runTaps.push(g.tick);g.step(pendingTap);runBestStreak=Math.max(runBestStreak,g.streak);pendingTap=false;acc-=STEP;for(const e of g.events){if(e.type==='over'){puff(g.x,g.y,'#fff0aa',28);end();break}puff(e.x??g.x,e.y??g.y,colors[tier(g.passed-1)],e.type==='graze'?8:22);tone(e.type)}if(g.mode==='over'){acc=0;break}}}
const playing=g&&g.mode==='play',render=g?renderState(g,paused||g.mode!=='play'?1:acc/STEP):null,travel=render?render.travel:menuTime*15;renderTravel=travel;renderTime=render?render.time:time;if(!g)menuTime+=dt;let env={from:0,to:0,blend:0};if(g){const r=g.course.rings[g.passed],prev=g.course.rings[Math.max(0,g.passed-1)],p=Math.max(0,Math.min(1,1-(r.x-g.travel-PX)/Math.max(1,r.x-prev.x)));env=environment(g.passed,p)}backdrop(env.from,1,travel);if(env.blend)backdrop(env.to,env.blend,travel);
if(g&&$('#menu').hidden){const visible=g.course.rings.slice(Math.max(0,g.passed-1),g.passed+4);for(const r of visible)ring(r,false);potato(render.x,render.y,g.vy,g.flapTime,1,paused?0:dt,render.spin,g.omega);for(const r of visible)ring(r,true)}else{const space=document.querySelector('.hero-space').getBoundingClientRect(),rect=document.querySelector('.shell').getBoundingClientRect(),unit=rect.height/H;const hy=(space.top-rect.top+space.height/2)/unit,dance=dancePose(profile.reduced?0:menuGroove.seconds??time),size=Math.min(1.5,space.height/unit/125);standingPotato(200,hy-7*size,size,dance)}
if(!paused){for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=55*dt}}for(let i=particles.length-1;i>=0;i--){const p=particles[i];if(p.life<=0){particles.splice(i,1);continue}c.globalAlpha=p.life/p.max;c.fillStyle=p.col;c.beginPath();c.arc(p.x,p.y,p.size,0,7);c.fill()}c.globalAlpha=1;if(playing)hud();if(dt>0){frames.push(dt);if(frames.length>180)frames.shift()}requestAnimationFrame(frame)}
syncMusic();
loading.then(()=>{$('#play').disabled=false;$('#play').textContent='PELAA';requestAnimationFrame(frame)}).catch(e=>{$('#message').textContent='Grafiikan lataus epäonnistui. Päivitä sivu.';console.error(e)});
// Read-only inspection for QA; all test mode entry points visibly disable record writes.
window.ringDive={audio:()=>({state:sound.ctx?.state||'locked',unlocked:sound.unlocked,music:profile.music,effects:profile.effects,musicRunning:sound.groove.running,voices:sound.groove.sources.size,error:sound.error}),snapshot:()=>g?{passed:g.passed,score:g.score,streak:g.streak,tick:g.tick,x:g.x,y:g.y,vy:g.vy,omega:g.omega,spin:g.spin,mode:g.mode,test:g.test,world:tier(g.passed),paused,meanFrameMs:frames.reduce((a,b)=>a+b,0)/Math.max(1,frames.length)*1000}:null};
