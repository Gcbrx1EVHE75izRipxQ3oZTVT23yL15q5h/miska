// Original HOT_POTATO_playable.html: gravity 625, tap -255, speed 130..225.
export const STEP=1/120, GRAVITY=625, IMPULSE=-255, PX=112, W=400,H=650;
export const STARTS=[0,15,35,60,90];
export const WORLDS=['TAIVAS','LUMOMETSÄ','KRISTALLILUOLA','TULIVUORI','AVARUUS'];
export const tier=n=>n>=90?4:n>=60?3:n>=35?2:n>=15?1:0;
export const speed=n=>130+Math.min(n*2.5,95);
export const multiplier=n=>1+Math.min(4,Math.floor(n/3));
export function integrate(p,tap=false){if(tap)p.vy=IMPULSE;p.vy+=GRAVITY*STEP;p.y+=p.vy*STEP;if(p.y<100){p.y=100;p.vy=Math.max(0,p.vy)}}
export function ringY(r,time){return r.base+Math.sin(time*r.frequency+r.phase)*r.amplitude}
export function environment(n,progress=0){const t=tier(n),end=[15,35,60,90,Infinity][t];return{from:t,to:Math.min(4,t+1),blend:t===4?0:Math.max(0,Math.min(1,(n+progress-(end-3))/3))}}
// Generate obstacles from a legal witness flight, using the exact runtime integrator.
// This provides an attainable path, including moving-ring phases; it never teleports the pilot.
export class Course{
 constructor(seed=42){this.seed=seed;this.rings=[];this.taps=new Set();this.p={y:275,vy:0};this.tick=0;this.travel=0;this.nextTap=0;this.lastRing=-43;this.history=[{tick:0,y:275,travel:0}];this.extend(180)}
 random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296}
 extend(count){while(this.rings.length<count){const tap=this.tick===this.nextTap;if(tap){this.taps.add(this.tick);let duration=92+Math.floor(this.random()*16);if(this.p.y<260)duration=104+Math.floor(this.random()*5);if(this.p.y>380)duration=85+Math.floor(this.random()*7);this.nextTap=this.tick+duration}integrate(this.p,tap);this.tick++;this.travel+=speed(this.rings.length)*STEP;this.history.push({tick:this.tick,y:this.p.y,travel:this.travel});if(this.history.length>260)this.history.shift();const n=this.rings.length,t=tier(n);
 if(this.travel-this.lastRing>=300&&this.p.vy>90&&this.p.y>205&&this.p.y<465){const amplitude=t<2?0:(t-1)*5+Math.min(6,Math.max(0,n-90)*.035),phase=this.random()*6.28,frequency=.9+Math.min(.3,n*.001),time=this.tick*STEP;const candidate={n,t,x:this.travel+PX,base:this.p.y-Math.sin(time*frequency+phase)*amplitude,amplitude,phase,frequency,half:[80,72,64,55,48][t]-Math.min(6,Math.max(0,n-90)*.025),witnessTick:this.tick,witnessY:this.p.y};let valid=true;for(let j=1;j<this.history.length;j++){const a=this.history[j-1],b=this.history[j];const hit=contact(candidate,a.travel-this.travel,a.y-ringY(candidate,a.tick*STEP),b.travel-this.travel,b.y-ringY(candidate,b.tick*STEP));if(hit==='rim'||hit==='miss'||(hit&&b.tick!==this.tick)){valid=false;break}}if(valid){this.rings.push(candidate);this.lastRing=this.travel}}
 }}
}
// Swept relative motion avoids tunnelling. Collision body excludes decorative wings/shoes.
export function contact(r,x0,y0,x1,y1){const radius=18,tube=5;const dy=y1-y0;
 for(const edge of [-r.half,r.half]){const dx=x1-x0,den=dx*dx+dy*dy;let t=den?Math.max(0,Math.min(1,((edge-x0)*dx-y0*dy)/den)):0;const ex=x0+dx*t-edge,ey=y0+dy*t;if(ex*ex+ey*ey<(radius+tube)**2)return 'rim'}
 if(y0<-1e-7&&y1>=-1e-7&&dy>0){const t=-y0/dy,x=x0+(x1-x0)*t;if(Math.abs(x)<r.half-radius-tube)return Math.abs(x)<r.half*.2?'perfect':'pass';if(Math.abs(x)<r.half+radius+tube)return 'rim'}
 if(x1>r.half+radius)return 'miss';return null}
export class Game{
 constructor({seed=42,start=0,test=false,demo=false}={}){this.course=new Course(seed);this.test=test||demo||start>0;this.demo=demo;this.mode='play';this.tick=0;this.y=275;this.vy=0;this.travel=0;this.passed=0;this.score=0;this.streak=0;this.notice='';this.noticeTime=0;this.flapTime=0;this.events=[];this.reason='';this.start=start; if(start){const until=this.course.rings[start-1].witnessTick;while(this.tick<until&&this.mode==='play')this.step(this.course.taps.has(this.tick));this.events=[];this.score=0;this.streak=0;this.noticeTime=0;this.notice='';this.demo=demo;this.test=true;}}
 step(tap=false){if(this.mode!=='play')return;this.events=[];const beforeY=this.y,beforeTravel=this.travel,time=this.tick*STEP;if(this.demo)tap=this.course.taps.has(this.tick);integrate(this,tap);if(tap)this.flapTime=.16;this.flapTime=Math.max(0,this.flapTime-STEP);this.noticeTime=Math.max(0,this.noticeTime-STEP);this.travel+=speed(this.passed)*STEP;this.tick++;
 if(this.y>H-24){this.lose('Putosit liian alas');return}
 const r=this.course.rings[this.passed];const x0=PX-(r.x-beforeTravel),x1=PX-(r.x-this.travel),y0=beforeY-ringY(r,time),y1=this.y-ringY(r,time+STEP);const hit=contact(r,x0,y0,x1,y1);
 if(hit==='rim'||hit==='miss'){this.lose(hit==='rim'?'Osuit renkaan reunaan':'Ohitit renkaan');return}
 if(hit){this.passed++;this.streak=hit==='perfect'?this.streak+1:0;const pts=(hit==='perfect'?100:40)*multiplier(this.streak);this.score+=pts;this.notice=hit==='perfect'?'PERFECT!':'HYVÄ!';this.noticeTime=1.1;this.events.push({type:hit,pts,x:PX,y:this.y});if(this.passed+30>this.course.rings.length)this.course.extend(this.course.rings.length+100)}
 }
 lose(reason){this.mode='over';this.reason=reason;this.events.push({type:'over'})}
}
