import {SPAWN_Y} from './physics.mjs?v=3.3';
const clamp=t=>Math.max(0,Math.min(1,t)),ease=t=>{t=clamp(t);return t*t*(3-2*t)},mix=(a,b,t)=>a+(b-a)*t;
export const RUN_TIME=1.05,JUMP_TIME=.75,EXIT_TIME=.55,LAUNCH_DURATION=RUN_TIME+JUMP_TIME+EXIT_TIME;
const hermite=(a,b,va,vb,d,t)=>{t=clamp(t);return (2*t**3-3*t*t+1)*a+(t**3-2*t*t+t)*d*va+(-2*t**3+3*t*t)*b+(t**3-t*t)*d*vb};
export function kitchenLayout(padX=0,padY=0,hero={x:200,y:330,size:1.7}){const h=650+2*padY,w=h*1.5,floor=hero.y+53*hero.size,x=Math.min(hero.x-w*.22,-padX),y=floor-h*.78;return{x,y,w,h,floor,window:{x:x+w*.755,y:floor-h*.25,top:y+h*.15,sill:y+h*.635,left:x+w*.715,right:x+w*.80,exitX:x+w*.806+hero.x+padX+10,floor}}}
function travel(seconds,hero,window){const jumpX=window.x-120,exitX=window.x+120;
 if(seconds<RUN_TIME)return hermite(hero.x,jumpX,0,320,RUN_TIME,seconds/RUN_TIME);
 if(seconds<RUN_TIME+JUMP_TIME)return jumpX+320*(seconds-RUN_TIME);
 const at=seconds-RUN_TIME-JUMP_TIME;return hermite(exitX,Math.max(exitX+(320+170)*EXIT_TIME/2,window.exitX??0),320,170,EXIT_TIME,at/EXIT_TIME);
}
export function glassImpactTime(hero,window){let a=RUN_TIME,b=RUN_TIME+JUMP_TIME;for(let i=0;i<20;i++){const m=(a+b)/2;if(travel(m,hero,window)+36*hero.size>=window.left+8)b=m;else a=m}return b}
export function launchPose(seconds,hero,window){const secondsClamped=Math.max(0,Math.min(LAUNCH_DURATION,seconds)),run=clamp(secondsClamped/RUN_TIME),jump=clamp((secondsClamped-RUN_TIME)/JUMP_TIME),exit=clamp((secondsClamped-RUN_TIME-JUMP_TIME)/EXIT_TIME),worldX=travel(secondsClamped,hero,window),cameraX=worldX-hero.x,impactAt=glassImpactTime(hero,window),impactAge=secondsClamped-impactAt;
 const runY=window.floor-57*hero.size,jumpY=mix(runY,window.y,ease(jump))-Math.sin(jump*Math.PI)*65;
 const stage=secondsClamped<RUN_TIME?'run':secondsClamped<RUN_TIME+JUMP_TIME?'jump':'exit',size=stage==='exit'?mix(hero.size,1,ease(exit)):hero.size;
 return{stage,worldX,cameraX,x:worldX-cameraX,y:stage==='run'?runY-Math.abs(Math.sin(run*Math.PI*8))*4:stage==='jump'?jumpY:hermite(window.y,SPAWN_Y,65*Math.PI/JUMP_TIME,0,EXIT_TIME,exit),scale:size,stride:run*Math.PI*8,lean:stage==='run'?-.1:mix(-.18,0,ease(exit)),impactAge,broken:impactAge>=0,externalTravel:Math.max(0,worldX-window.x),kitchenAlpha:1,zoom:1,done:seconds>=LAUNCH_DURATION};
}
// Bounded deterministic glass fragments fly outward/right and fall under gravity.
export function glassShards(age,window){if(age<0||age>1.6)return[];return Array.from({length:32},(_,i)=>{const vx=85+(i*73%190),vy=-230+(i*97%380),offset=(i/31-.5)*(window.sill-window.top);return{x:window.x+vx*age,y:(window.top+window.sill)/2+offset+vy*age+310*age*age,angle:i*.87+age*(i%2?-7:9),size:3+(i*7%8),alpha:Math.max(0,1-age/1.6)}})}
export function runningLimbs(phase){const arms=[-1,1].map(side=>{const s=Math.sin(phase+(side<0?0:Math.PI));return{kind:'arm',side,hx:side*26,hy:5,kx:side*29+s*7,ky:14,ax:side*26+s*17,ay:18-s*12}}),legs=[[-20,15,1.8],[-3,19,0]].map(([hx,hy,offset],i)=>{const wave=Math.sin(phase+offset),lift=Math.max(0,wave)*18;return{kind:'leg',side:i?1:-1,hx,hy,kx:hx+wave*11,ky:hy+14-lift*.7,ax:hx+wave*17,ay:46-lift}});return [...arms,...legs]}
