import {SoftRig} from './soft-rig.mjs?v=3.0';
import {rigHull,rimSeparation,sweepRig,RIM_TUBE,RIM_SKIN,RIG_RADIUS,rigCleared,updateTilt} from './rig-geometry.mjs?v=3.0';
// Original prototype gravity 625 and tap -255. Requested quicker cadence: speed 170..280.
export const STEP=1/120, GRAVITY=625, IMPULSE=-255, PX=112, W=400,H=650;
export const SPAWN_Y=385,CEILING_Y=40,FIRST_RING_GRACE=300;
export const STARTS=[0,15,35,60,90];
export const WORLDS=['TAIVAS','LUMOMETSÄ','KRISTALLILUOLA','TULIVUORI','AVARUUS'];
export const tier=n=>n>=90?4:n>=60?3:n>=35?2:n>=15?1:0;
export const speed=n=>170+Math.min(n*2.5,110);
export const multiplier=n=>1+Math.min(4,Math.floor(n/3));
export function integrate(p,tap=false){if(tap)p.vy=IMPULSE;p.vy+=GRAVITY*STEP;p.y+=p.vy*STEP;if(p.y<CEILING_Y){p.y=CEILING_Y;p.vy=Math.max(0,p.vy)}}
export function ringY(r,time){return r.base+Math.sin(time*r.frequency+r.phase)*r.amplitude}
export function environment(n,progress=0){const t=tier(n),end=[15,35,60,90,Infinity][t];return{from:t,to:Math.min(4,t+1),blend:t===4?0:Math.max(0,Math.min(1,(n+progress-(end-3))/3))}}
// Generate obstacles from a legal witness flight, using the exact runtime integrator.
// This provides an attainable path, including moving-ring phases; it never teleports the pilot.
const witnessDuration=(y,random)=>y>375?52+Math.floor(random*5):144+Math.floor(random*5);
export class Course{
 constructor(seed=42,count=60){this.seed=seed;this.rings=[];this.taps=new Set();this.p={y:SPAWN_Y,vy:0,tilt:0};this.tick=0;this.travel=0;this.nextTap=0;this.lastRing=-43;this.pending=null;this.history=[{tick:0,y:SPAWN_Y,travel:0,tilt:0}];this.extend(count)}
 random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296}
 futureClear(r){
  const p={...this.p};let tick=this.tick,travel=this.travel,next=this.nextTap,seed=this.seed;
  while(travel-(r.x-PX)<r.half+RIG_RADIUS+8){const tap=tick===next;if(tap){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const random=seed/4294967296;next=tick+witnessDuration(p.y,random)}
   const before={y:p.y,tilt:p.tilt,travel};integrate(p,tap);p.tilt=updateTilt(p.tilt,p.vy,STEP);tick++;travel+=speed(r.n+1)*STEP;
   if(sweepRig(r,before.travel-(r.x-PX),before.y-ringY(r,(tick-1)*STEP),travel-(r.x-PX),p.y-ringY(r,tick*STEP),before.tilt,p.tilt,.2))return false;
  }return true;
 }
 extend(count){let guard=0;while(this.rings.length<count){if(++guard>count*20000+100000)throw Error('Could not generate a reachable course');
  const tap=this.tick===this.nextTap;if(tap){this.taps.add(this.tick);this.nextTap=this.tick+witnessDuration(this.p.y,this.random())}
  const before=this.history.at(-1);integrate(this.p,tap);this.p.tilt=updateTilt(this.p.tilt,this.p.vy,STEP);this.tick++;this.travel+=speed(this.rings.length)*STEP;const now={tick:this.tick,y:this.p.y,travel:this.travel,tilt:this.p.tilt};this.history.push(now);if(this.history.length>260)this.history.shift();
  if(this.pending){const r=this.pending,x0=before.travel-(r.x-PX),x1=this.travel-(r.x-PX),y0=before.y-ringY(r,before.tick*STEP),y1=this.p.y-ringY(r,this.tick*STEP);
   if(sweepRig(r,x0,y0,x1,y1,before.tilt,this.p.tilt,.2)||x1>r.half+RIG_RADIUS){this.pending=null;continue}
   if(rigCleared(r,x1,y1,this.p.tilt)){if(this.futureClear(r)){r.witnessTick=this.tick;r.witnessY=this.p.y;this.rings.push(r);this.lastRing=r.x-PX}this.pending=null}continue;
  }
  const n=this.rings.length,t=tier(n);
  if((n>0||this.tick>=FIRST_RING_GRACE)&&this.travel-this.lastRing>=220&&this.p.vy>90&&this.p.y>295&&this.p.y<575){const amplitude=t<2?0:(t-1)*5+Math.min(6,Math.max(0,n-90)*.035),phase=this.random()*6.28,frequency=.9+Math.min(.3,n*.001),time=this.tick*STEP;
   const candidate={n,t,x:this.travel+PX,base:this.p.y-Math.sin(time*frequency+phase)*amplitude,amplitude,phase,frequency,half:[84,78,72,66,60][t]-Math.min(4,Math.max(0,n-90)*.012)};
   let valid=true;for(let j=1;j<this.history.length;j++){const a=this.history[j-1],b=this.history[j];if(sweepRig(candidate,a.travel-this.travel,a.y-ringY(candidate,a.tick*STEP),b.travel-this.travel,b.y-ringY(candidate,b.tick*STEP),a.tilt,b.tilt,.2)){valid=false;break}}
   if(valid)this.pending=candidate;
  }
 }}
}
// Legacy 18px-disc helpers remain for replay/API compatibility tests.
// Runtime collision below uses the firm body envelope and separate soft limbs.
export function contact(r,x0,y0,x1,y1){const radius=18,tube=5;const dy=y1-y0;
 for(const edge of [-r.half,r.half]){const dx=x1-x0,den=dx*dx+dy*dy;let t=den?Math.max(0,Math.min(1,((edge-x0)*dx-y0*dy)/den)):0;const ex=x0+dx*t-edge,ey=y0+dy*t;if(ex*ex+ey*ey<(radius+tube)**2)return 'rim'}
 if(y0<-1e-7&&y1>=-1e-7&&dy>0){const t=-y0/dy,x=x0+(x1-x0)*t;if(Math.abs(x)<r.half-radius-tube)return Math.abs(x)<r.half*.2?'perfect':'pass';if(Math.abs(x)<r.half+radius+tube)return 'rim'}
 if(x1>r.half+radius)return 'miss';return null}
// First time of impact, rather than closest approach: the contact normal determines
// whether the potato strikes head-on or skims tangentially across the rim.
export function rimImpact(r,x0,y0,x1,y1){
 const dx=x1-x0,dy=y1-y0,a=dx*dx+dy*dy,R=23;
 if(a<1e-16)return null;
 let first=null;
 for(const edge of [-r.half,r.half]){
  const ox=x0-edge,oy=y0,b=2*(ox*dx+oy*dy),cc=ox*ox+oy*oy-R*R;
  const discriminant=b*b-4*a*cc;if(discriminant<0)continue;
  const fraction=cc<=0?0:(-b-Math.sqrt(discriminant))/(2*a);
  if(fraction<0||fraction>1)continue;
  const cx=ox+dx*fraction,cy=oy+dy*fraction,len=Math.hypot(cx,cy)||1;
  const nx=cx/len,ny=cy/len,approach=-(dx*nx+dy*ny);
  // Already overlapping but travelling away is not another impact.
  if(approach<=1e-8)continue;
  const incidence=approach/Math.sqrt(a);
  const result={edge,fraction,nx,ny,incidence,grazing:incidence<.72,normalSpeed:-approach/STEP,spinDirection:Math.sign(dx*ny-dy*nx)||1};
  if(!first||fraction<first.fraction)first=result;
 }
 return first;
}
// Unit-mass disc, I = 1/2*m*r^2. Normal restitution transfers linear
// momentum; Coulomb friction at the contact point creates angular momentum.
export function resolveRimVelocity(body,impact,forwardSpeed,ringVelocity=0){
 const {nx,ny}=impact,tx=-ny,ty=nx,R=18;
 const vx=body.vx+forwardSpeed,vy=body.vy-ringVelocity;
 const vn=vx*nx+vy*ny;if(vn>=0)return {normalImpulse:0,tangentImpulse:0};
 const normalImpulse=-(1+.28)*vn;
 const tangentVelocity=vx*tx+vy*ty-body.omega*R;
 const tangentImpulse=Math.max(-.32*normalImpulse,Math.min(.32*normalImpulse,-tangentVelocity/3));
 body.vx+=normalImpulse*nx+tangentImpulse*tx;
 body.vy+=normalImpulse*ny+tangentImpulse*ty;
 body.omega-=2*tangentImpulse/R;
 return {normalImpulse,tangentImpulse};
}
export function resolveHullVelocity(body,impact,forwardSpeed,ringVelocity=0){
 const {nx,ny,armX:rx,armY:ry}=impact,I=700,tx=-ny,ty=nx;
 const vx=body.vx+forwardSpeed-body.omega*ry,vy=body.vy-ringVelocity+body.omega*rx;
 const vn=vx*nx+vy*ny;if(vn>=0)return;
 const cross=rx*ny-ry*nx,j=-(1+.28)*vn/(1+cross*cross/I);
 const tangent=vx*tx+vy*ty,crossT=rx*ty-ry*tx,jt=Math.max(-.32*j,Math.min(.32*j,-tangent/(1+crossT*crossT/I)));
 body.vx+=j*nx+jt*tx;body.vy+=j*ny+jt*ty;body.omega+=(cross*j+crossT*jt)/I;
}
export function downwardGate(r,x0,y0,x1,y1){
 if(!(y0<-1e-7&&y1>=-1e-7&&y1>y0))return null;
 const x=x0+(x1-x0)*(-y0/(y1-y0));
 if(Math.abs(x)>=r.half-5)return null;
 return !r.grazed&&Math.abs(x)<r.half*.2?'perfect':'pass';
}
// Keep the collision-driven tumble, then let the wings settle the rigid body
// towards the nearest upright revolution. No angle snap and no flight-force change.
export function settleRotation(body,age){
 if(age<.32){body.omega*=Math.exp(-.65*STEP)}
 else {const target=Math.round(body.spin/(Math.PI*2))*Math.PI*2;
 body.omega+=(-15*(body.spin-target)-7.5*body.omega)*STEP;}
 body.spin+=body.omega*STEP;
}
export class Game{
 constructor({seed=42,start=0,test=false,demo=false}={}){this.course=new Course(seed);this.test=test||demo||start>0;this.demo=demo;this.mode='play';this.tick=0;this.y=SPAWN_Y;this.vy=0;this.travel=0;this.passed=0;this.score=0;this.streak=0;this.notice='';this.noticeTime=0;this.flapTime=0;this.events=[];this.reason='';this.tilt=0;this.prevTilt=0;this.prevY=this.y;this.prevTravel=0;this.spin=0;this.prevSpin=0;this.omega=0;this.x=PX;this.prevX=PX;this.vx=0;this.rimFeedback=0;this.lastImpactTick=0;this.start=start;this.limbs=new SoftRig(); if(start){this.course.extend(Math.max(60,start+2));const until=this.course.rings[start-1].witnessTick;while(this.tick<until&&this.mode==='play')this.step(this.course.taps.has(this.tick));this.events=[];this.score=0;this.streak=0;this.noticeTime=0;this.notice='';this.demo=demo;this.test=true;}}
 step(tap=false){
  if(this.mode!=='play')return;this.events=[];
  const beforeY=this.y,beforeX=this.x,beforeTravel=this.travel,time=this.tick*STEP;
  this.prevY=this.y;this.prevX=this.x;this.prevTravel=this.travel;this.prevSpin=this.spin;this.prevTilt=this.tilt;
  this.rimFeedback=Math.max(0,this.rimFeedback-STEP);
  // Air resistance slows rotation without prescribing an angle or a full turn.
  settleRotation(this,(this.tick-this.lastImpactTick)*STEP);
  if(this.demo)tap=this.course.taps.has(this.tick);
  integrate(this,tap);this.tilt=updateTilt(this.tilt,this.vy,STEP);
  // Automatic forward flight gently recovers its screen position after recoil.
  this.vx+=(-7*(this.x-PX)-4*this.vx)*STEP;this.x+=this.vx*STEP;
  if(tap)this.flapTime=.25;
  this.flapTime=Math.max(0,this.flapTime-STEP);this.noticeTime=Math.max(0,this.noticeTime-STEP);
  const forward=speed(this.passed);this.travel+=forward*STEP;this.tick++;
  const r=this.course.rings[this.passed],ry0=ringY(r,time),ry1=ringY(r,time+STEP);
  const x0=beforeX-(r.x-beforeTravel),y0=beforeY-ry0;
  let scored=null,touched=false;
  const active=this.course.rings.slice(Math.max(0,this.passed-1),this.passed+1);
  for(const obstacle of active){const oy0=ringY(obstacle,time),oy1=ringY(obstacle,time+STEP);
   const sx0=beforeX-(obstacle.x-beforeTravel),sy0=beforeY-oy0,sx1=this.x-(obstacle.x-this.travel),sy1=this.y-oy1;
   const impact=sweepRig(obstacle,sx0,sy0,sx1,sy1,this.prevSpin+this.prevTilt,this.spin+this.tilt);
   if(impact){touched=true;resolveHullVelocity(this,impact,forward,(oy1-oy0)/STEP);this.lastImpactTick=this.tick;
    const f=impact.fraction;this.x=beforeX+(this.x-beforeX)*f+this.vx*STEP*(1-f);this.y=beforeY+(this.y-beforeY)*f+this.vy*STEP*(1-f);
    obstacle.grazed=true;obstacle.lastContactTick=this.tick;this.streak=0;
   }
  }
  // Position projection keeps the firm body outside the rim after every impact. This
  // also keeps the still-visible previous ring solid during an upward flap.
  for(let iteration=0;iteration<32;iteration++){let moved=false;
   for(const obstacle of active){const rx=this.x-(obstacle.x-this.travel),ry=this.y-ringY(obstacle,time+STEP);if(Math.abs(rx)>obstacle.half+RIG_RADIUS+8)continue;
    for(const edge of[-obstacle.half,obstacle.half]){const separation=rimSeparation(rigHull(this.x-(obstacle.x-this.travel),this.y-ringY(obstacle,time+STEP),this.spin+this.tilt),edge),depth=RIM_TUBE+RIM_SKIN+.04-separation.distance;
     if(depth>1e-5){this.x+=separation.nx*depth;this.y+=separation.ny*depth;moved=true;touched=true;obstacle.grazed=true;obstacle.lastContactTick=this.tick;this.streak=0}
    }
   }if(!moved)break;
  }
  this.limbs.step(this,active,time+STEP,STEP,tap);
  if(touched&&this.rimFeedback===0){this.rimFeedback=.12;this.notice='KIMMOKE!';this.noticeTime=.65;this.events.push({type:'graze',x:this.x,y:this.y})}
  const finalX=this.x-(r.x-this.travel),finalY=this.y-ry1;
  if(y0>0&&finalY<=0)r.entered=false;
  const gate=downwardGate(r,x0,y0,finalX,finalY);if(gate){r.entered=true;r.entryPerfect=gate==='perfect'}
  if(r.entered&&rigCleared(r,finalX,finalY,this.spin+this.tilt))scored=r.entryPerfect&&!r.grazed?'perfect':'pass';
  if(this.y>H-24){this.lose('Putosit liian alas');return}
  if(this.x-(r.x-this.travel)>r.half+RIG_RADIUS+8&&!scored&&this.tick-(r.lastContactTick??-Infinity)>72){this.lose('Ohitit renkaan');return}
  if(scored){const hit=scored;this.passed++;this.streak=hit==='perfect'?this.streak+1:0;const pts=(hit==='perfect'?100:40)*multiplier(this.streak);this.score+=pts;this.notice=hit==='perfect'?'PERFECT!':'HYVÄ!';this.noticeTime=1.1;this.events.push({type:hit,pts,x:this.x,y:this.y});if(this.passed+30>this.course.rings.length)this.course.extend(this.course.rings.length+100)}
 }

 lose(reason){this.mode='over';this.reason=reason;this.events.push({type:'over'})}
}
