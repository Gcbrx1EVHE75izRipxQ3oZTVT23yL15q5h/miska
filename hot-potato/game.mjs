import {kitchenLayout,launchPose,LAUNCH_DURATION,runningLimbs,glassShards} from './launch.mjs?v=3.4';
import {armPose} from './rig-geometry.mjs?v=3.4';
import {Game,STEP,PX,W,H,tier,WORLDS,STARTS,ringY,environment,multiplier} from './physics.mjs?v=3.4';
import {smooth,renderState,cameraOffsetX,flightCamera,FLIGHT_ZOOM} from './motion.mjs?v=3.4';
import {dancePose,BEAT} from './groove.mjs?v=3.4';
import {Sound} from './sound.mjs?v=3.4';
import {loadProfile,saveProfile,addRun,cleanName,ACHIEVEMENTS,unlockAchievements,leaderboardRows,weekStartUTC} from './profile.mjs?v=2.0';
import {icon,mountIcons} from './icons.mjs?v=2.0';
const $=s=>document.querySelector(s),canvas=$('#game'),c=canvas.getContext('2d',{alpha:false});
const names=['sky','forest','crystal','volcano','space'],worldIcons=['cloud','leaf','crystal','volcano','star'],colors=['#ffda58','#6fffaf','#e8a0ff','#ff9b3f','#7eebff'];
const assets={},particles=[],pulses=[];
let g=null,paused=false,last=0,acc=0,time=0,pendingTap=false,seed=42,visualTilt=0,surpriseMix=0,renderTravel=0,renderTime=0;
let launch=null,glassTrail=null,landscapeOffset=0,flightZoom=1;
function applyFlightCamera(playerX){const p=flightCamera(playerX,flightZoom,W,H);c.translate(p.x,p.y);c.scale(p.zoom,p.zoom)}
let view='menu',panel=null,weekOnly=false,runBestStreak=0,lastOptions={start:0,test:false,demo:false},result=null,countElapsed=0,countDone=true;
let noticeUntil=0,toastUntil=0,shake=0,lastMultiplier=1,hero={x:200,y:260,size:1},meanFrameMs=0,padX=0,padY=0;
const toastQueue=[],cache=new Map();
const profile=(()=>{try{return loadProfile(localStorage)}catch{return loadProfile({getItem:()=>null})}})();
try{const old=JSON.parse(localStorage.getItem('ring-dive-best-v1'));profile.bestScore=Math.max(profile.bestScore,old?.score||0);profile.highestRings=Math.max(profile.highestRings,old?.rings||0)}catch{}
unlockAchievements(profile,{rings:profile.highestRings,bestStreak:profile.bestStreak,at:1});
const sound=new Sound(profile),menuGroove=sound.groove;menuGroove.beatOffset=()=>time%(BEAT*8);
const poseCanvas=document.createElement('canvas');poseCanvas.width=270;poseCanvas.height=240;const poseContext=poseCanvas.getContext('2d');
const loading=Promise.all([...names,'kitchen-side','logo','props','body-happy','body-surprised','wing','flight-shoe-clean','menu-body-front','dance-shoe-left','dance-shoe-right'].map(name=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{assets[name]=im;resolve()};im.onerror=()=>reject(Error(name));im.src=`assets/${name}.webp`})));
const ringCache={};function ringImage(id,front){const key=id+'-'+front;if(ringCache[key])return ringCache[key];const cv=document.createElement('canvas');cv.width=240;cv.height=90;const q=cv.getContext('2d');q.translate(120,42);q.lineCap='round';const a=front?0:Math.PI,b=front?Math.PI:Math.PI*2;function line(w,color,dy=0,blur=0){q.lineWidth=w;q.strokeStyle=color;q.shadowColor=colors[id];q.shadowBlur=blur;q.beginPath();q.ellipse(0,dy,91,18,0,a,b);q.stroke()}
line(14,colors[id],2,19);line(11,'#2b2837',5);let gr=q.createLinearGradient(0,-20,0,25);gr.addColorStop(0,'#fffad9');gr.addColorStop(.35,colors[id]);gr.addColorStop(.7,colors[id]);gr.addColorStop(1,'#9b6f36');line(10,gr);line(2.5,'#ffffee',-2);ringCache[key]=cv;return cv}
function ring(r,front){const x=r.x-renderTravel,y=ringY(r,renderTime);if(r.n<g.passed||x<-250||x>W+250)return;c.save();const im=ringImage(r.t,front),scale=r.half/91;c.drawImage(im,x-120*scale,y-42*scale,240*scale,90*scale);if(!front&&r.n===g.passed){c.fillStyle='#fff';c.font='900 10px system-ui';c.textAlign='center';c.shadowColor='#092545';c.shadowBlur=5;c.fillText(String(r.n+1),x,y+43)}c.restore()}
function backdrop(id,alpha,travel){if(alpha<=0)return;const im=assets[names[id]];if(!im)return;c.save();c.globalAlpha=alpha;const viewHeight=H+2*padY+4,scale=viewHeight/im.height,bw=im.width*scale;let offset=(travel*.028)%(2*bw);for(let tile=-1;tile<3;tile++){let x=tile*bw-offset;if(x+bw<-padX||x>W+padX)continue;c.save();if(Math.abs(tile)%2){c.translate(x+bw,0);c.scale(-1,1);c.drawImage(im,0,-padY-2,bw,viewHeight)}else c.drawImage(im,x,-padY-2,bw,viewHeight);c.restore()}
const grad=c.createLinearGradient(0,0,0,H);grad.addColorStop(0,'#081f4b45');grad.addColorStop(.28,'#11244b00');grad.addColorStop(.72,'#11244b00');grad.addColorStop(1,'#06162b55');c.fillStyle=grad;c.fillRect(-padX-2,-padY-2,W+2*padX+4,H+2*padY+4);
const atlas=assets.props,sw=atlas.width/5;for(let j=0;j<4;j++){const depth=j%2?1.3:.8,loop=650,x=((j*203+580-travel*.085*depth)%loop+loop)%loop-120,y=j%2?500:560;const size=(j%2?135:100);c.globalAlpha=alpha*(j%2?.85:.55);c.drawImage(atlas,id*sw,0,sw,atlas.height,x,y+Math.sin(time*.5+j)*9,size,size*atlas.height/sw)}
// Separate atmosphere layer: drifting mist / fireflies / crystal motes / embers / starlight.
c.globalCompositeOperation='screen';for(let j=0;j<22;j++){const x=((j*71.31-travel*(.02+j%3*.012))%W+W)%W,y=(j*89.7+Math.sin(time*.65+j)*17)%H,sz=id===0?22:id===4?1:1.6;c.globalAlpha=alpha*(id===0?.08:.15+.28*(.5+.5*Math.sin(time+j)));c.fillStyle=id===0?'#fff':colors[id];c.beginPath();c.arc(x,y,sz,0,7);c.fill()}c.restore()}
// Rounded limbs always begin inside the body and end inside a shoe collar.
// They are rendered behind the body so a detached flat top can never show.
function drawConnectedLeg(hx,hy,kx,ky,ax,ay,width,jointed=false){
 const skin=c.createLinearGradient(ax-width,0,ax+width,0);skin.addColorStop(0,'#8d4e26');skin.addColorStop(.45,'#d9974c');skin.addColorStop(1,'#ad6732');
 c.save();c.strokeStyle=skin;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';
 c.beginPath();c.moveTo(hx,hy);if(jointed){c.lineTo(kx,ky);c.lineTo(ax,ay)}else c.quadraticCurveTo(kx,ky,ax,ay);c.stroke();c.restore();
}
function drawArm(p,side){
 drawConnectedLeg(p.hx,p.hy,p.kx,p.ky,p.ax,p.ay,6.5,true);
 // Rounded mitten, thumb and knuckle highlights share the exact wrist anchor.
 c.save();c.translate(p.ax,p.ay);c.rotate(side*.22);
 const light=c.createRadialGradient(-2,-3,1,0,0,7);light.addColorStop(0,'#ffe2a0');light.addColorStop(.55,'#dfa556');light.addColorStop(1,'#a65b2c');
 c.fillStyle=light;c.beginPath();c.ellipse(0,0,5.3,6.4,0,0,Math.PI*2);c.fill();c.beginPath();c.ellipse(-side*4,-1,2.2,3.2,side*.4,0,Math.PI*2);c.fill();c.restore();
}
function potato(x,y,vy,flap,scale=1,dt=0,spin=0,omega=0,dance=null,bodyTilt=null,limbs=null){
 const happy=assets['body-happy'],surprised=assets['body-surprised'];if(!happy)return;
 visualTilt=bodyTilt??smooth(visualTilt,Math.max(-.2,Math.min(.32,vy/950)),dt,10);
 surpriseMix=smooth(surpriseMix,Math.abs(omega)>2.4||vy>230?1:0,dt,12);
 // The body is rigid: only uniform scaling is used. Each source keeps its aspect.
 c.save();c.translate(x,y);c.rotate(visualTilt+spin+(dance?.lean||0));c.scale(scale,scale);
 const clock=g?renderTime:time,energy=flap/.25;
 function wing(px,py,size,mirror,phase){const im=assets.wing;if(!im)return;c.save();c.translate(px,py);c.scale(mirror,1);c.rotate(dance?(mirror===1?dance.wingLeft:dance.wingRight):-.12+Math.sin(clock*14+phase)*(.12+energy*.5));const h=size*im.height/im.width;c.drawImage(im,-size*.87,-h*.78,size,h);c.restore()}
 function hangingLeg(hipX,hipY,drop,phase){
  const sway=Math.sin(clock*5+phase)*2.2-Math.max(-3,Math.min(3,vy/150));
  const pose=limbs?.find(p=>p.kind==='leg'&&p.side===(phase===0?1:-1));
  const ankleX=pose?.ax??hipX+sway,ankleY=pose?.ay??hipY+drop+Math.sin(clock*5+phase)*1.2;
  function shoe(frontOnly){const im=assets['flight-shoe-clean'];if(!im)return;const w=23,h=w*im.height/im.width;
   c.save();c.translate(ankleX,ankleY);c.rotate(pose?Math.max(-.7,Math.min(.7,Math.atan2(ankleY-(pose.ky),ankleX-(pose.kx))-Math.PI/2))*.5:.08+Math.sin(clock*5+phase)*.10);
   if(frontOnly){const lip=.4;c.drawImage(im,0,im.height*lip,im.width,im.height*(1-lip),-w*.25,h*(lip-.22),w,h*(1-lip))}
   else c.drawImage(im,-w*.25,-h*.22,w,h);c.restore();
  }
  return {back:()=>shoe(false),front:()=>shoe(true),leg:()=>drawConnectedLeg(hipX,hipY,pose?.kx??hipX-2+sway*.5,pose?.ky??hipY+drop*.5,ankleX,ankleY,6.5,!!pose)};
 }
 wing(25,-4,22,-1,1.4);
 const farFoot=hangingLeg(-20,15,23,1.8),nearFoot=hangingLeg(-3,19,25,0);
 farFoot.back();nearFoot.back();farFoot.leg();nearFoot.leg();
 drawArm(limbs?.find(p=>p.kind==='arm'&&p.side===-1)??armPose(-1,clock*5,true),-1);
 drawArm(limbs?.find(p=>p.kind==='arm'&&p.side===1)??armPose(1,clock*5,true),1);
 // One facial pose at a time: crossfading two full faces caused ghost eyes.
 poseContext.clearRect(0,0,270,240);poseContext.globalCompositeOperation='source-over';poseContext.globalAlpha=1;
 const expression=surpriseMix>.55?surprised:happy,w=240,h=w*expression.height/expression.width;
 poseContext.drawImage(expression,(270-w)/2,(240-h)/2,w,h);
 c.drawImage(poseCanvas,-40.5,-36,81,72);farFoot.front();nearFoot.front();wing(-22,-3,32,1,0);c.restore();
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
 const feet=[{name:'dance-shoe-left',side:-1,slide:dance.leftSlide,lift:dance.leftLift,depth:dance.leftDepth,turn:dance.leftTurn,yaw:dance.leftYaw,pitch:dance.leftPitch},
 {name:'dance-shoe-right',side:1,slide:dance.rightSlide,lift:dance.rightLift,depth:dance.rightDepth,turn:dance.rightTurn,yaw:dance.rightYaw,pitch:dance.rightPitch}];
 for(const f of feet){f.x=f.side*15+f.slide;f.y=52+f.depth*.3-f.lift;f.scale=1+f.depth*.006;
  c.fillStyle=`rgba(8,26,42,${.26*(1-Math.min(1,f.lift/32))})`;c.beginPath();c.ellipse(f.x,53+f.depth*.3,12*f.scale,2.2+f.lift*.05,0,0,Math.PI*2);c.fill();
 }
 function shoeFrame(f){const im=assets[f.name],w=23,h=w*im.height/im.width;
  const pivot=f.turn>0?7:-7,cs=Math.cos(f.turn),sn=Math.sin(f.turn);
  // Transform the actual collar point with the SAME sole pivot and perspective
  // as the sneaker. The ankle therefore remains joined throughout the shuffle.
  const sx=Math.sin(f.yaw)*.22*(-h*.84),sy=Math.cos(f.pitch)*(-h*.84);
  f.ax=f.x+f.scale*(pivot+cs*(sx-pivot)-sn*(sy+1));
  f.ay=f.y+f.scale*(-1+sn*(sx-pivot)+cs*(sy+1));
  return {im,w,h};
 }
 // Shoe back/collar first, continuous ankle second, front tongue last.
 for(const f of feet)foot(f,false);
 const bodyAngle=dance.lean+(dance.headTurn||0),cs=Math.cos(bodyAngle),sn=Math.sin(bodyAngle);
 for(const f of feet){shoeFrame(f);const hx=f.side*15,hy=16;
  const hipX=dance.x+cs*hx-sn*hy,hipY=dance.y+sn*hx+cs*hy;
  drawConnectedLeg(hipX,hipY,f.ax+f.side*(2+f.lift*.14),(hipY+f.ay)/2+3,f.ax,f.ay,8);
 }
 function foot(f,frontOnly){const {im,w,h}=shoeFrame(f);
  c.save();c.translate(f.x,f.y);c.scale(f.scale,f.scale);
  c.translate(f.turn>0?7:-7,-1);c.rotate(f.turn);c.translate(f.turn>0?-7:7,1);
  c.transform(Math.cos(f.yaw),0,Math.sin(f.yaw)*.22,Math.cos(f.pitch),0,0);
  if(frontOnly){
   // Keep the ankle visible over the dark opening/back rim, but hide its end
   // behind the red tongue and laces. A whole opaque shoe hid the leg before.
   const lip=.24;c.drawImage(im,0,im.height*lip,im.width,im.height*(1-lip),-w/2,-h*(1-lip),w,h*(1-lip));
  }else c.drawImage(im,-w/2,-h,w,h);
  c.restore();
 }
 c.save();c.translate(dance.x,dance.y);c.rotate(dance.lean);
 function arm(px,mirror,angle){const im=assets.wing,w=26,h=w*im.height/im.width;
  c.save();c.translate(px,-17);c.scale(mirror,1);c.rotate(angle);c.drawImage(im,-w*.9,-h*.65,w,h);c.restore();
 }
 arm(-28,1,dance.wingLeft);arm(28,-1,dance.wingRight);
 drawArm(armPose(-1,dance.armPhase),-1);drawArm(armPose(1,dance.armPhase),1);
 const w=64,h=w*body.height/body.width;
 c.save();c.rotate(dance.headTurn||0);c.drawImage(body,-w/2,24-h,w,h);c.restore();
 c.restore();for(const f of feet)foot(f,true);
 c.restore();
}
function puff(x,y,color,n=18){for(let i=0;i<n;i++){const a=i*2.399+time,v=20+(i%7)*12;particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.65,max:.65,col:color,size:1+i%3})}if(particles.length>100)particles.splice(0,particles.length-100)}
// All HUD text writes are value-driven; notices are composed once per event.
function text(selector,value){const node=typeof selector==='string'?$(selector):selector,v=String(value);if(cache.get(node)!==v){node.textContent=v;cache.set(node,v)}}
const number=n=>Math.round(n).toLocaleString('fi-FI');
function save(){try{return saveProfile(localStorage,profile)}catch{return false}}
function refreshProfile(){text('#profileName',profile.name);text('#record',`Ennätykset: ${number(profile.bestScore)} p · ${profile.highestRings} rengasta`);text('#achievementCount',`${Object.keys(profile.achievements).length}/6`);$('#shell').dataset.reduced=profile.reduced;$('#muteSetting').checked=profile.muted;$('#reducedMotion').checked=profile.reduced;}
function syncMusic(){sound.menu=view==='menu';sound.visible=!document.hidden;sound.paused=paused;sound.sync()}
function audioUI(){text('#menuSoundLabel',sound.muted?'Äänet pois':sound.unlocked?'Äänet päällä':'Äänet päälle');$('#menuMusic').setAttribute('aria-pressed',String(sound.unlocked&&!sound.muted));$('#menuSoundIcon').innerHTML=icon(sound.muted?'mute':'sound');$('#sound').innerHTML=icon(sound.muted?'mute':'sound');$('#sound').setAttribute('aria-label',sound.muted?'Äänet päälle':'Mykistä äänet');text('#audioStatus',sound.status);$('#muteSetting').checked=sound.muted;}
sound.listeners.push(audioUI);
function updateSettings(){refreshProfile();$('#playerName').value=profile.name;for(const[key,id,out]of[['music','musicVolume','musicValue'],['effects','effectsVolume','effectsValue']]){$('#'+id).value=Math.round(profile[key]*100);text('#'+out,$('#'+id).value+' %')}}
function layoutHero(){
 const r=$('#shell').getBoundingClientRect();if(!r.width||!r.height)return;
 // Fit the entire unchanged 400×650 simulation. Extend scenery into spare
 // screen space instead of cropping the next ring or stretching the character.
 const scale=Math.min(r.width/W,r.height/H);padX=(r.width/scale-W)/2;padY=(r.height/scale-H)/2;
 const cw=Math.round((W+2*padX)*2),ch=Math.round((H+2*padY)*2);if(canvas.width!==cw)canvas.width=cw;if(canvas.height!==ch)canvas.height=ch;
 if(view==='menu'){const s=$('.hero-space').getBoundingClientRect();hero={x:W/2,y:(s.top-r.top+s.height/2)/scale-padY,size:Math.min(1.7,s.height/scale/122)};hero.y-=5*hero.size;}
}
function setView(next){$('#launchSkip').hidden=next!=='launch';closePanel(false);view=next;$('#shell').dataset.view=next;for(const id of ['menu','results','lab'])$('#'+id).hidden=id!==next;$('#pauseMenu').hidden=true;$('#pause').inert=false;$('#pause').setAttribute('aria-label','Tauko');canvas.inert=next!=='play';$('#hud').hidden=next!=='play';$('#journey').hidden=next!=='play';$('#footer').hidden=next!=='play';$('#testLabel').hidden=next!=='play'||!g?.test;$('#notice').hidden=true;noticeUntil=0;paused=false;syncMusic();if(next==='menu'){refreshProfile();requestAnimationFrame(layoutHero)}if(next==='play')canvas.focus({preventScroll:true});}
let returnFocus=null;
function openPanel(id){sound.unlock();sound.effect('click');closePanel(false);panel=id;returnFocus=document.activeElement;$('#'+id).hidden=false;if(view==='menu')$('#menu').inert=true;if(view==='results')$('#results').inert=true;
 if(id==='settings')updateSettings();if(id==='leaderboard')renderBoard();if(id==='worlds')renderWorlds();if(id==='achievements')renderAchievements();$('#'+id+' .panel-close').focus({preventScroll:true});}
function closePanel(focus=true){if(panel)$('#'+panel).hidden=true;panel=null;$('#menu').inert=false;$('#results').inert=false;if(focus&&returnFocus?.isConnected)returnFocus.focus({preventScroll:true});}
function rankRow(r,i){const row=document.createElement('li');row.className='leader-row'+(r.id===profile.lastRunId?' latest':'');const rank=document.createElement('span');rank.className='rank';rank.textContent=String(i+1).padStart(2,'0');const who=document.createElement('div'),name=document.createElement('div');name.className='name';name.textContent=r.name;if(r.id===profile.lastRunId){const tag=document.createElement('span');tag.className='latest-tag';tag.textContent='UUSIN';name.append(tag)}const detail=document.createElement('small');detail.textContent=`${r.rings} rengasta · ${new Date(r.at).toLocaleDateString('fi-FI',{timeZone:'UTC'})}`;who.append(name,detail);const score=document.createElement('strong');score.textContent=number(r.score);row.append(rank,who,score);return row;}
function renderBoard(){cache.set('boardWeek',weekStartUTC());const rows=leaderboardRows(profile,weekOnly),list=$('#leaderList');list.replaceChildren();if(!rows.length){const empty=document.createElement('li');empty.className='board-empty';empty.innerHTML=icon('rank')+`<b>${weekOnly?'Uusi viikko, uusi lento.':'Ensimmäinen sija odottaa.'}</b><p>${weekOnly?'Tämän viikon tuloksia ei vielä ole.':'Pelaa ensimmäinen lentosi. Omat parhaat suorituksesi ilmestyvät tähän.'}</p>`;list.append(empty)}else rows.forEach((r,i)=>list.append(rankRow(r,i)));
 $('#latestOutside').replaceChildren();if(profile.latestRun&&!rows.some(r=>r.id===profile.lastRunId)&&(!weekOnly||profile.latestRun.at>=weekStartUTC())){const note=document.createElement('p');note.className='note';note.textContent=`Viimeisin lento: ${number(profile.latestRun.score)} pistettä · ${profile.latestRun.rings} rengasta.`;$('#latestOutside').append(note)}
 $('#personalStats').innerHTML=`<div><strong>${number(profile.plays)}</strong><span>LENTOJA</span></div><div><strong>${number(profile.totalRings)}</strong><span>RENKAITA</span></div><div><strong>${profile.bestStreak}</strong><span>PARAS KETJU</span></div>`;$('#allTime').setAttribute('aria-selected',String(!weekOnly));$('#thisWeek').setAttribute('aria-selected',String(weekOnly));}
function renderWorlds(){const discovered=Math.max(tier(profile.highestRings),...['forest','crystal','volcano','space'].map((id,i)=>profile.achievements[id]?i+1:0)),next=STARTS[discovered+1];text('#worldTarget',next?`Seuraava tavoite: ${WORLDS[discovered+1]} · ${next} rengasta`:'Kaikki maailmat löydetty. Tähtää uuteen ennätykseen!');$('#worldGallery').replaceChildren();WORLDS.forEach((name,i)=>{const found=i<=discovered,el=document.createElement('article');el.className='world-tile'+(found?' found':'');el.style.setProperty('--image',`url(assets/${names[i]}.webp)`);el.innerHTML=`<span class="world-icon">${icon(worldIcons[i])}</span><div><h3>${name}</h3><small>Renkaat ${STARTS[i]+1}${i===4?'+':'–'+[15,35,60,90][i]} · ${found?'Löydetty':'Vielä löytämättä'}</small></div><span class="world-state">${icon(found?'check':'lock')}</span>`;$('#worldGallery').append(el)})}
function renderAchievements(){text('#achievementProgress',`${Object.keys(profile.achievements).length} / 6 avattu`);$('#achievementList').replaceChildren();for(const a of ACHIEVEMENTS){const at=profile.achievements[a.id],el=document.createElement('article');el.className='achievement-item'+(at?' unlocked':'');el.innerHTML=`<span class="medallion">${icon(a.icon)}</span><div><h3>${a.name}</h3><p>${a.description}</p><small>${at?'AVATTU':'VIELÄ LUKOSSA'}</small></div>`;$('#achievementList').append(el)}}
function showNotice(title,detail,duration=.9){text('#noticeTitle',title);text('#noticeDetail',detail);$('#notice').hidden=false;$('#notice').style.animation='none';void $('#notice').offsetWidth;$('#notice').style.animation='';noticeUntil=time+duration;}
function toast(label,title,name='medal'){if(toastQueue.length<8)toastQueue.push({label,title,name})}
function updateToasts(){if(toastUntil&&time>=toastUntil){$('#toast').hidden=true;toastUntil=0}if(!toastUntil&&toastQueue.length&&(!noticeUntil||view!=='play')){const item=toastQueue.shift();text('#toastLabel',item.label);text('#toastTitle',item.title);$('#toastIcon').innerHTML=icon(item.name);$('#toast').hidden=false;toastUntil=time+2.3;}}
function hud(force=false){if(!g)return;if(force)cache.clear();text('#rings',g.passed);text('#score',number(g.score));text('#mult','KERROIN ×'+multiplier(g.streak));const world=tier(g.passed);text('#world',WORLDS[world]);const key='stops';if(cache.get(key)!==world){document.querySelectorAll('.stops b').forEach((el,i)=>{el.classList.toggle('active',i<=world);el.style.setProperty('--color',colors[i])});cache.set(key,world)}const r=g.course.rings[g.passed],prev=g.course.rings[Math.max(0,g.passed-1)],progress=Math.max(0,Math.min(1,1-(r.x-g.travel-PX)/Math.max(1,r.x-prev.x))),percent=Math.min(100,Math.floor((g.passed+progress)/90*100));if(cache.get('journey')!==percent){$('#journeyFill').style.width=percent+'%';cache.set('journey',percent)}}
function start(options={start:0,test:false,demo:false}){glassTrail=null;landscapeOffset=0;sound.stopEffects();sound.unlock();sound.effect('click');lastOptions={start:options.start||0,test:!!options.test,demo:!!options.demo};g=new Game({seed:seed++,...lastOptions});runBestStreak=0;pendingTap=false;acc=0;particles.length=0;pulses.length=0;visualTilt=0;surpriseMix=0;lastMultiplier=1;shake=0;result=null;toastQueue.length=0;$('#toast').hidden=true;toastUntil=0;flightZoom=profile.reduced?FLIGHT_ZOOM:1;setView('play');hud(true);}
function beginLaunch(options={start:0,test:false,demo:false}){if(view==='launch')return;if(view!=='menu')setView('menu');layoutHero();sound.stopEffects();sound.unlock();sound.effect('click');particles.length=0;pulses.length=0;glassTrail=null;toastQueue.length=0;$('#toast').hidden=true;toastUntil=0;launch={elapsed:0,hero:{...hero},options:{...options},step:-1,jumped:false,shattered:false};g=null;setView('launch');$('#launchSkip').hidden=false;canvas.inert=false;canvas.focus({preventScroll:true});}
function finishLaunch(){if(view!=='launch')return;const k=kitchenLayout(padX,padY,launch.hero),p=launchPose(launch.elapsed,launch.hero,k.window);const trail=launch.shattered?{window:k.window,age:p.impactAge,cameraX:p.cameraX}:null;const offset=p.externalTravel,queued=!!launch.tapQueued,options=launch.options;launch=null;$('#launchSkip').hidden=true;start(options);glassTrail=trail;landscapeOffset=offset;pendingTap=queued;if(queued)sound.effect('tap');}
$('#launchSkip').onclick=finishLaunch;
function drawKitchen(cameraX=0){const im=assets['kitchen-side'];if(!im)return;const k=kitchenLayout(padX,padY,launch?.hero??hero),sx=k.w/im.width,sy=k.h/im.height;const region=(x,y,w,h)=>c.drawImage(im,x,y,w,h,k.x+x*sx-cameraX,k.y+y*sy,w*sx,h*sy);
 // The room art ends at the side wall. Its aperture is transparent to the same
 // outdoor panorama that continues during the actual run.
 region(0,0,1098,1024);region(1098,0,140,154);region(1098,650,140,374);
}
function drawGlass(k,cameraX,age=-1){if(age<0){const w=k.window;c.save();c.translate(w.x-cameraX,0);const left=w.left+8-w.x,right=w.right-8-w.x,pane=c.createLinearGradient(left,w.top,right,w.sill);pane.addColorStop(0,'#d4faff75');pane.addColorStop(.5,'#a8e9ff28');pane.addColorStop(1,'#dffaff90');c.fillStyle=pane;c.strokeStyle='#f0ffffcc';c.lineWidth=2;c.beginPath();c.moveTo(left,w.top);c.lineTo(right,w.top+10);c.lineTo(right,w.sill+10);c.lineTo(left,w.sill);c.closePath();c.fill();c.stroke();c.strokeStyle='#ffffffaa';c.beginPath();c.moveTo(-10,w.top+35);c.lineTo(11,w.top+75);c.moveTo(-10,w.top+45);c.lineTo(8,w.top+82);c.stroke();c.restore();return;}
 for(const s of glassShards(age,k.window)){c.save();c.translate(s.x-cameraX,s.y);c.rotate(s.angle);c.globalAlpha=s.alpha;c.fillStyle='#d8f8ffb0';c.strokeStyle='#ffffffdb';c.lineWidth=.8;c.beginPath();c.moveTo(-s.size,-s.size*.3);c.lineTo(s.size*.75,-s.size);c.lineTo(s.size*.4,s.size);c.closePath();c.fill();c.stroke();c.restore();}
}
function drawLaunch(dt){const k=kitchenLayout(padX,padY,launch.hero),p=launchPose(launch.elapsed,launch.hero,k.window);
 backdrop(0,1,p.externalTravel);drawKitchen(p.cameraX);drawGlass(k,p.cameraX,p.impactAge);
 if(p.stage==='run'){c.save();c.globalAlpha=.24;c.fillStyle='#3d2718';c.beginPath();c.ellipse(p.x,k.floor,25*p.scale,4*p.scale,0,0,7);c.fill();c.restore();}
 potato(p.x,p.y,p.stage==='run'?0:-180,.08,p.scale,dt,0,0,null,p.lean,p.stage==='run'?runningLimbs(p.stride):null);
}
function end(){if(view!=='play')return;const newScore=!g.test&&g.score>profile.bestScore,newRings=!g.test&&g.passed>profile.highestRings;result={score:g.score,rings:g.passed-g.start,streak:runBestStreak,world:tier(g.passed),test:g.test,reason:g.reason,newScore,newRings};if(!g.test){addRun(profile,{rings:g.passed,score:g.score,bestStreak:runBestStreak,test:false});save();try{localStorage.setItem('ring-dive-best-v1',JSON.stringify({score:profile.bestScore,rings:profile.highestRings}))}catch{}}
 setView('results');text('#resultKicker',g.test?'HARJOITUSLENTO':newScore?'UUSI PISTE-ENNÄTYS':newRings?'UUSI RENGASENNÄTYS':'HYVÄ LENTO');text('#resultTitle',newScore||newRings?'Siivet täynnä kultaa!':'Vielä yksi sukellus?');text('#resultRings',result.rings);text('#resultStreak',result.streak);$('#resultWorld').innerHTML=icon(worldIcons[result.world])+`<span>${WORLDS[result.world]}</span>`;text('#resultReason',g.test?'Harjoitus ei muuta ennätyksiä tai saavutuksia.':g.reason);countElapsed=0;countDone=profile.reduced;displayCount(countDone?result.score:0);text('#countHint',countDone?'':'Napauta näyttääksesi heti');sound.effect(newScore||newRings?'record':'over');}
function displayCount(value){text('#resultScore',number(value))}
function skipCount(){if(!result)return;countDone=true;displayCount(result.score);text('#countHint','')}
function pause(value){if(view!=='play'||g?.mode!=='play')return;paused=value;acc=0;pendingTap=false;$('#pauseMenu').hidden=!value;$('#pause').setAttribute('aria-label',value?'Jatka':'Tauko');$('#pause').inert=value;syncMusic();if(value)$('#resume').focus();else canvas.focus({preventScroll:true});}
function tap(){if(view==='launch'){launch.tapQueued=true;return}if(view==='play'&&!paused&&!panel&&!g.demo){pendingTap=true;sound.effect('tap');puff(g.x-15,g.y,'#e9faff',3)}}
function gameEvent(e,before){if(e.type==='over'){end();return}const world=tier(g.passed),col=colors[tier(Math.max(0,g.passed-1))];if(e.type==='graze'){puff(e.x,e.y,col,8);showNotice('KIMMOKE!','Siivet suoraksi ja uusi yritys',.65);shake=.12;sound.effect('graze');return}
 const perfect=e.type==='perfect';puff(e.x??g.x,e.y??g.y,perfect?'#fff1a5':col,perfect?24:12);pulses.push({ring:g.course.rings[g.passed-1],life:.5,max:.5});if(pulses.length>4)pulses.shift();showNotice(perfect?'SUKKANA! · PERFECT':'HYVÄ SUKELLUS',`+${e.pts} pistettä${e.bonus?' · bonus +'+e.bonus:''} · ×${multiplier(g.streak)}`,perfect?1:.65);sound.effect(e.type);
 const mult=multiplier(g.streak);if(mult>lastMultiplier){sound.effect('multiplier');$('#hud').classList.remove('bump');void $('#hud').offsetWidth;$('#hud').classList.add('bump');toast('KERROIN NOUSI',`PERFECT-ketju ×${mult}`,'bolt')}lastMultiplier=mult;
 if(world!==tier(before)){sound.effect('world');toast('UUSI MAAILMA',WORLDS[world],worldIcons[world])}
 const unlocked=unlockAchievements(profile,{rings:g.passed,bestStreak:runBestStreak,test:g.test});if(unlocked.length){save();refreshProfile();for(const a of unlocked)toast('SAAVUTUS AVATTU',a.name,a.icon)}
}
mountIcons();canvas.inert=true;refreshProfile();updateSettings();save();
for(const[id,name]of[['settingsOpen','settings'],['profileOpen','settings'],['leaderboardOpen','leaderboard'],['worldsOpen','worlds'],['achievementsOpen','achievements'],['helpOpen','help'],['resultBoard','leaderboard']])$('#'+id).onclick=()=>openPanel(name);
document.querySelectorAll('.panel-close').forEach(b=>b.onclick=()=>{sound.effect('click');closePanel()});
$('#allTime').onclick=()=>{weekOnly=false;renderBoard()};$('#thisWeek').onclick=()=>{weekOnly=true;renderBoard()};
$('#play').onclick=()=>beginLaunch();$('#retry').onclick=()=>beginLaunch(lastOptions);$('#skipCount').onclick=skipCount;
$('#resultHome').onclick=$('#home').onclick=()=>{g=null;setView('menu')};$('#pause').onclick=()=>pause(true);$('#resume').onclick=()=>{sound.unlock();pause(false)};
$('#labOpen').onclick=()=>setView('lab');$('#labClose').onclick=()=>{setView('menu');openPanel('worlds')};
WORLDS.forEach((name,i)=>{const b=document.createElement('button');b.style.setProperty('--image',`url(assets/${names[i]}.webp)`);b.innerHTML=icon(worldIcons[i])+`<span>${name}</span><small>${STARTS[i]+1}${i===4?'+':'–'+[15,35,60,90][i]}</small>`;b.onclick=()=>beginLaunch({start:STARTS[i],demo:$('#demo').checked,test:true});$('#worldButtons').append(b)});
$('#grazeTest').onclick=()=>{start({start:0,test:true,demo:false});g.y=g.prevY=253;g.vy=-2.6041666667;Object.assign(g.course.rings[0],{x:138+g.course.rings[0].half,base:275,amplitude:0})};
$('#playerName').onchange=e=>{profile.name=cleanName(e.target.value);e.target.value=profile.name;save();refreshProfile()};
for(const[id,key,out]of[['musicVolume','music','musicValue'],['effectsVolume','effects','effectsValue']]){const slider=$('#'+id);slider.onpointerdown=()=>sound.unlock();slider.oninput=()=>{profile[key]=Number(slider.value)/100;text('#'+out,slider.value+' %');save();sound.sync()};slider.onchange=()=>{sound.unlock();sound.effect('click')}}
$('#reducedMotion').onchange=e=>{profile.reduced=e.target.checked;save();refreshProfile()};
function setMuted(value){profile.muted=sound.muted=value;save();sound.sync()}
$('#muteSetting').onchange=e=>{setMuted(e.target.checked);if(!e.target.checked)sound.unlock()};
async function toggleSound(){if(!sound.unlocked){setMuted(false);await sound.unlock()}else setMuted(!sound.muted);sound.effect('click')}
$('#menuMusic').onclick=$('#sound').onclick=toggleSound;$('#audioTest').onclick=async()=>{setMuted(false);await sound.unlock();sound.effect('perfect')};
canvas.addEventListener('pointerdown',e=>{e.preventDefault();sound.unlock();tap()});
document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea'))return;if(e.code==='Escape'){if(panel)closePanel();else if(view==='play')pause(!paused);else if(view==='launch'){launch=null;g=null;setView('menu')}else if(view==='lab'||view==='results'){g=null;setView('menu')}}if(['Space','ArrowUp'].includes(e.code)&&view==='launch'){e.preventDefault();tap()}if(['Space','ArrowUp'].includes(e.code)&&view==='play'&&!paused&&!e.target.closest('button')){e.preventDefault();if(!e.repeat){sound.unlock();tap()}}if(e.code==='Tab'&&(panel||paused)){const root=panel?$('#'+panel):$('#pauseMenu'),items=[...root.querySelectorAll('button,input')].filter(n=>!n.disabled);const first=items[0],end=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();end.focus()}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();first.focus()}}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause(true);last=0;acc=0;syncMusic();if(!document.hidden&&panel==='leaderboard')renderBoard()});
window.addEventListener('storage',event=>{if(event.key==='ring-dive-profile-v2'){try{Object.assign(profile,loadProfile(localStorage));sound.muted=profile.muted;updateSettings();syncMusic();if(panel==='leaderboard')renderBoard();if(panel==='achievements')renderAchievements();if(panel==='worlds')renderWorlds()}catch{}}});
$('#menu').addEventListener('scroll',layoutHero);new ResizeObserver(layoutHero).observe($('#shell'));window.addEventListener('resize',layoutHero);
function frame(ms){const dt=document.hidden?0:Math.min(.1,last?(ms-last)/1000:0);last=ms;time+=dt;meanFrameMs=meanFrameMs?meanFrameMs*.98+dt*1000*.02:dt*1000;
 if(view==='launch'&&launch){launch.elapsed+=dt;const p=launchPose(launch.elapsed,launch.hero,kitchenLayout(padX,padY,launch.hero).window);if(p.stage==='run'){const step=Math.floor(p.stride/Math.PI);if(step!==launch.step){sound.effect('step');launch.step=step}}else if(!launch.jumped){sound.effect('jump');launch.jumped=true}if(p.broken&&!launch.shattered){sound.effect('glass');launch.shattered=true}if(p.done)finishLaunch()}
 if(view==='play'&&!paused){acc+=dt;while(acc+1e-10>=STEP){const before=g.passed;g.step(pendingTap);pendingTap=false;runBestStreak=Math.max(runBestStreak,g.streak);acc-=STEP;for(const e of g.events)gameEvent(e,before);if(g.mode==='over'){acc=0;break}}hud()}
 c.setTransform(2,0,0,2,padX*2,padY*2);c.clearRect(-padX,-padY,W+2*padX,H+2*padY);c.save();shake=Math.max(0,shake-dt);if(shake&&!profile.reduced)c.translate(Math.sin(time*85)*shake*7,Math.cos(time*73)*shake*4);
 if(view==='play'&&!paused)flightZoom=profile.reduced?FLIGHT_ZOOM:smooth(flightZoom,FLIGHT_ZOOM,dt,8);
 const render=g?renderState(g,paused||g.mode!=='play'?1:acc/STEP):null;renderTravel=render?render.travel:time*15;renderTime=render?render.time:time;
 let env={from:0,to:0,blend:0};if(g){const r=g.course.rings[g.passed],prev=g.course.rings[Math.max(0,g.passed-1)],p=Math.max(0,Math.min(1,1-(r.x-g.travel-PX)/Math.max(1,r.x-prev.x)));env=environment(g.passed,p)}if(view==='menu'||view==='lab'){backdrop(0,1,0);drawKitchen();drawGlass(kitchenLayout(padX,padY,hero),0)}else if(view==='launch'&&launch){drawLaunch(dt)}else {backdrop(env.from,1,renderTravel+landscapeOffset);if(env.blend)backdrop(env.to,env.blend,renderTravel+landscapeOffset);}
 if(view==='play'&&g){c.save();applyFlightCamera(render.x);const visible=g.course.rings.slice(g.passed,g.passed+4);for(const r of visible)ring(r,false);potato(render.x,render.y,g.vy,g.flapTime,1,paused?0:dt,render.spin,g.omega,null,render.tilt,g.limbs.sample(paused?1:acc/STEP,renderTime,g.vy));for(const r of visible)ring(r,true);c.restore()}else if(view==='menu'){const dance=dancePose(profile.reduced?0:menuGroove.seconds??time);standingPotato(hero.x,hero.y,hero.size,dance)}
 if(view==='play'&&glassTrail){if(!paused)glassTrail.age+=dt;drawGlass({window:glassTrail.window},glassTrail.cameraX+renderTravel,glassTrail.age);if(glassTrail.age>1.6)glassTrail=null}
 if(!paused){for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=55*dt}for(const p of pulses)p.life-=dt}
 if(view==='play'&&render){c.save();applyFlightCamera(render.x)}
 for(let i=pulses.length-1;i>=0;i--){const p=pulses[i];if(p.life<=0){pulses.splice(i,1);continue}if(view!=='play')continue;const ratio=1-p.life/p.max;c.save();c.globalAlpha=(p.life/p.max)*.55;c.strokeStyle=colors[p.ring.t];c.lineWidth=2;c.beginPath();c.ellipse(p.ring.x-renderTravel,ringY(p.ring,renderTime),p.ring.half+ratio*18,18+ratio*8,0,0,7);c.stroke();c.restore()}
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];if(p.life<=0){particles.splice(i,1);continue}c.globalAlpha=p.life/p.max;c.fillStyle=p.col;c.beginPath();c.arc(p.x,p.y,p.size,0,7);c.fill()}c.globalAlpha=1;if(view==='play'&&render)c.restore();c.restore();
 if(noticeUntil&&time>=noticeUntil){$('#notice').hidden=true;noticeUntil=0}updateToasts();const active=!!noticeUntil||!!toastUntil;if(cache.get('feedback')!==active){$('#shell').classList.toggle('feedback-active',active);cache.set('feedback',active)}if(view==='results'&&result&&!countDone){countElapsed+=dt;const t=Math.min(1,countElapsed/.65);displayCount(result.score*(1-(1-t)**3));if(t===1)skipCount()}
 requestAnimationFrame(frame);
}
// UI inspection is DOM-only; no mutation or gameplay bypass is exposed.
function diagnostics(){if(panel==='leaderboard'&&weekOnly&&cache.get('boardWeek')!==weekStartUTC())renderBoard();canvas.dataset.mode=view;canvas.dataset.launchStage=launch?launchPose(launch.elapsed,launch.hero,kitchenLayout(padX,padY,launch.hero).window).stage:'';canvas.dataset.audio=sound.ctx?.state||'locked';canvas.dataset.audioVoices=String(sound.groove.sources.size);canvas.dataset.passed=String(g?.passed||0);canvas.dataset.test=String(!!g?.test);canvas.dataset.frameMs=meanFrameMs.toFixed(1)}setInterval(diagnostics,500);
loading.then(()=>{$('#play').disabled=false;text('#playLabel','PELAA');syncMusic();layoutHero();requestAnimationFrame(frame)}).catch(e=>{text('#playLabel','PÄIVITÄ SIVU');console.error('Grafiikan lataus epäonnistui',e)});
