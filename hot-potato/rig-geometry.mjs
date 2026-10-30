// Body collision geometry. Soft appendages are solved separately in soft-rig.mjs.
export const RIM_TUBE=7, RIM_SKIN=1.25;
const rotate=(x,y,a)=>({x:x*Math.cos(a)-y*Math.sin(a),y:x*Math.sin(a)+y*Math.cos(a)});
// The same shoulder/elbow/wrist anchors drive both drawing and collision bounds.
export function armPose(side,phase,flight=false){
 const wave=Math.sin(phase+(side<0?0:Math.PI)),cross=Math.cos(phase*2);
 return flight?{hx:side*26,hy:5,kx:side*(34+2*wave),ky:16,ax:side*(36+3*wave),ay:27+3*cross}
 :{hx:side*25,hy:-9,kx:side*(34+5*wave),ky:1-9*wave,ax:side*(38+7*wave),ay:9-22*wave};
}
// Only the potato's firm body is rigid. Hands, feet and wings are articulated.
// Circumscribed ellipse follows the visible body; soft appendages never enlarge it.
export const FLIGHT_HULL=Array.from({length:20},(_,i)=>{const a=(i+.5)*Math.PI/10,k=1/Math.cos(Math.PI/20);return{x:36*k*Math.cos(a),y:27*k*Math.sin(a)}});
export const RIG_RADIUS=Math.max(...FLIGHT_HULL.map(p=>Math.hypot(p.x,p.y)));
export function rigHull(x=0,y=0,angle=0){const cs=Math.cos(angle),sn=Math.sin(angle);return FLIGHT_HULL.map(p=>({x:x+p.x*cs-p.y*sn,y:y+p.x*sn+p.y*cs}))}
export function rimSeparation(hull,edge){let best=Infinity,qx=0,qy=0,inside=true;
 for(let i=0;i<hull.length;i++){const a=hull[i],b=hull[(i+1)%hull.length],dx=b.x-a.x,dy=b.y-a.y;
 if(dx*(-a.y)-dy*(edge-a.x)<-1e-8)inside=false;
 const t=Math.max(0,Math.min(1,((edge-a.x)*dx-a.y*dy)/(dx*dx+dy*dy)));const x=a.x+t*dx,y=a.y+t*dy,d=(x-edge)**2+y*y;if(d<best){best=d;qx=x;qy=y}}
 const len=Math.sqrt(best)||1e-8,sign=inside?-1:1;return{distance:inside?-Math.sqrt(best):Math.sqrt(best),nx:(qx-edge)/len*sign,ny:qy/len*sign,qx,qy};
}
export function sweepRig(r,x0,y0,x1,y1,a0=0,a1=a0,padding=0){const dx=x1-x0,dy=y1-y0,da=a1-a0,bound=Math.hypot(dx,dy)+RIG_RADIUS*Math.abs(da);if(bound<1e-10)return null;
 let first=null;
 for(const edge of[-r.half,r.half]){const den=dx*dx+dy*dy,closest=den?Math.max(0,Math.min(1,-((x0-edge)*dx+y0*dy)/den)):0,ex=x0+closest*dx-edge,ey=y0+closest*dy;
  if(ex*ex+ey*ey>(RIG_RADIUS+RIM_TUBE+RIM_SKIN+padding+.05)**2)continue;
  let t=0;
  for(let i=0;i<32&&t<=1;i++){const x=x0+dx*t,y=y0+dy*t,s=rimSeparation(rigHull(x,y,a0+da*t),edge),gap=s.distance-RIM_TUBE-RIM_SKIN-padding;
   if(gap<=.025){const hit={...s,edge,fraction:t,armX:s.qx-x,armY:s.qy-y};if(!first||t<first.fraction)first=hit;break}
   t+=Math.max(.00001,gap/bound*.9);
  }
 }
 return first;
}
export const tiltTarget=vy=>Math.max(-.2,Math.min(.32,vy/950));
export function updateTilt(current,vy,dt){return current+(tiltTarget(vy)-current)*(1-Math.exp(-10*dt))}
export function rigCleared(r,x,y,angle=0){return Math.min(...rigHull(x,y,angle).map(p=>p.y))>RIM_TUBE+RIM_SKIN+.04}
// Exposed only for geometry coverage tests, never a gameplay bypass.
export const envelopeSourcePoints=()=>Array.from({length:360},(_,i)=>({x:36*Math.cos(i*Math.PI/180),y:27*Math.sin(i*Math.PI/180)}));
