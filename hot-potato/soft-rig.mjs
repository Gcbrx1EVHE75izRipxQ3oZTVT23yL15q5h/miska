import {armPose,RIM_TUBE,RIM_SKIN} from './rig-geometry.mjs?v=3.0';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function flightTargets(time,vy=0){
 const arms=[-1,1].map(side=>({...armPose(side,time*5,true),kind:'arm',side,radius:7,length:18}));
 const legs=[[-20,15,23,1.8],[-3,19,25,0]].map(([hx,hy,drop,phase],i)=>{const sway=Math.sin(time*5+phase)*2.2-clamp(vy/150,-3,3);return {hx,hy,kx:hx-2+sway*.5,ky:hy+drop*.5,ax:hx+sway,ay:hy+drop+Math.sin(time*5+phase)*1.2,kind:'leg',side:i?1:-1,radius:21,length:18}});
 return [...arms,...legs];
}
function projectPoint(p,o,radius){const dx=p.x-o.x,dy=p.y-o.y,d=Math.hypot(dx,dy),min=radius+RIM_TUBE+RIM_SKIN;if(d>=min)return false;const nx=d?dx/d:0,ny=d?dy/d:-1;p.x=o.x+nx*min;p.y=o.y+ny*min;return true}
function limit(a,b,max){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d>max){b.x=a.x+dx*max/d;b.y=a.y+dy*max/d}}
function segment(a,b,o,radius,fixed=false){const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy,t=clamp(((o.x-a.x)*dx+(o.y-a.y)*dy)/(l||1),fixed?.35:0,1),p={x:a.x+dx*t,y:a.y+dy*t},before={...p};if(!projectPoint(p,o,radius))return false;const wa=fixed?0:1-t,wb=t,den=wa*(1-t)+wb*t||1;const sx=(p.x-before.x)/den,sy=(p.y-before.y)/den;a.x+=sx*wa;a.y+=sy*wa;b.x+=sx*wb;b.y+=sy*wb;return true}
// Four low-mass two-joint spring chains. Their impulses bend the appendage,
// never the pilot's controls. Maximum bone lengths prevent stretching; knees
// and elbows may fold freely. Projection treats palms and sneaker pixels as solid.
export class SoftRig{
 constructor(){this.chains=[];this.lastVy=0}
 step(body,rings,time,dt,tap=false){const targets=flightTargets(time,body.vy),angle=body.spin+body.tilt,cs=Math.cos(angle),sn=Math.sin(angle),obstacles=[];
  for(const r of rings){const ry=r.base+Math.sin(time*r.frequency+r.phase)*r.amplitude;for(const side of[-1,1]){const dx=r.x-body.travel+side*r.half-body.x,dy=ry-body.y;if(Math.hypot(dx,dy)<150)obstacles.push({x:dx*cs+dy*sn,y:-dx*sn+dy*cs})}}
  if(!this.chains.length)this.chains=targets.map(t=>({k:{x:t.kx,y:t.ky,vx:0,vy:0},a:{x:t.ax,y:t.ay,vx:0,vy:0},prevK:{x:t.kx,y:t.ky},prevA:{x:t.ax,y:t.ay},contact:false}));
  const inertia=clamp((body.vy-this.lastVy)*.018,-5,5);this.lastVy=body.vy;
  this.chains.forEach((chain,i)=>{const t=targets[i],root={x:t.hx,y:t.hy};chain.prevK={...chain.k};chain.prevA={...chain.a};chain.contact=false;
   for(const [node,tx,ty]of[[chain.k,t.kx,t.ky],[chain.a,t.ax,t.ay]]){node.vx+=(70*(tx-node.x)-9*node.vx)*dt;node.vy+=(70*(ty-node.y)-9*node.vy)*dt;node.vy-=inertia*(i<2?.4:.7);node.x+=node.vx*dt;node.y+=node.vy*dt;}
   for(let pass=0;pass<(obstacles.length?24:1);pass++){let corrected=false;limit(root,chain.k,t.length);limit(chain.k,chain.a,t.length);for(const o of obstacles){let hit=projectPoint(chain.k,o,3.5);hit=projectPoint(chain.a,o,t.radius)||hit;hit=segment(root,chain.k,o,3.4,true)||hit;hit=segment(chain.k,chain.a,o,3.4)||hit;chain.contact=hit||chain.contact;corrected=hit||corrected}if(!corrected)break}
   if(chain.contact){chain.k.vx*=.4;chain.k.vy*=.4;chain.a.vx*=.4;chain.a.vy*=.4}
  });
 }
 sample(alpha=1,time=0,vy=0){const targets=flightTargets(time,vy);return targets.map((t,i)=>{const p=this.chains[i];if(!p)return t;const mix=(a,b)=>a+(b-a)*alpha;return {...t,kx:mix(p.prevK.x,p.k.x),ky:mix(p.prevK.y,p.k.y),ax:mix(p.prevA.x,p.a.x),ay:mix(p.prevA.y,p.a.y),contact:p.contact}})}
}
