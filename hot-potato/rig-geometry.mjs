// Conservative, pose-independent envelope of the SAME flight sprite rectangles
// and connected limbs used by the renderer. No decorative part is excluded.
export const RIM_TUBE=10, RIM_SKIN=1.25;
const rotate=(x,y,a)=>({x:x*Math.cos(a)-y*Math.sin(a),y:x*Math.sin(a)+y*Math.cos(a)});
// The same shoulder/elbow/wrist anchors drive both drawing and collision bounds.
export function armPose(side,phase,flight=false){
 const wave=Math.sin(phase+(side<0?0:Math.PI)),cross=Math.cos(phase*2);
 return flight?{hx:side*26,hy:5,kx:side*(34+2*wave),ky:16,ax:side*(36+3*wave),ay:27+3*cross}
 :{hx:side*25,hy:-9,kx:side*(34+5*wave),ky:1-9*wave,ax:side*(38+7*wave),ay:9-22*wave};
}
const raw=[];const add=(x,y)=>raw.push({x,y});
function box(x,y,w,h,angle=0,tx=0,ty=0,mirror=1){for(const px of[x,x+w])for(const py of[y,y+h]){const q=rotate(px,py,angle);add(tx+mirror*q.x,ty+q.y)}}
box(-36,-28,72,56);
for(let i=0;i<=160;i++){const angle=-.74+1.24*i/160;for(const[tx,ty,w,mirror]of[[-22,-3,32,1],[25,-4,22,-1]]){const h=w*318/394;box(-w*.87,-h*.78,w,h,angle,tx,ty,mirror)}}
for(const[hx,hy,drop]of[[-20,15,23],[-3,19,25]]){
 for(const sway of[-5.2,5.2])for(const dy of[-1.2,1.2])for(const angle of[-.02,.18]){const w=23,h=w*331/550;box(-w*.25,-h*.22,w,h,angle,hx+sway,hy+drop+dy)}
 for(const x of[hx-5.3,hx+5.3])for(const y of[hy,hy+drop+1.2])box(x-3.4,y-3.4,6.8,6.8);
}
for(let i=0;i<=160;i++)for(const side of[-1,1]){const a=armPose(side,i*Math.PI/80,true);for(const [x,y,r]of[[a.hx,a.hy,3.5],[a.kx,a.ky,3.5],[a.ax,a.ay,7]])box(x-r,y-r,2*r,2*r)}
// Intersections of 20 support half-planes enclose every sampled rectangle.
// An extra 1 px covers continuous angular extrema and antialiasing.
const N=20,normals=Array.from({length:N},(_,i)=>({x:Math.cos(i*2*Math.PI/N),y:Math.sin(i*2*Math.PI/N)})),support=normals.map(n=>Math.max(...raw.map(p=>p.x*n.x+p.y*n.y))+1);
export const FLIGHT_HULL=normals.map((a,i)=>{const j=(i+1)%N,b=normals[j],det=a.x*b.y-a.y*b.x;return{x:(support[i]*b.y-a.y*support[j])/det,y:(a.x*support[j]-support[i]*b.x)/det}});
export const RIG_RADIUS=Math.max(...FLIGHT_HULL.map(p=>Math.hypot(p.x,p.y)));
export function rigHull(x=0,y=0,angle=0){const cs=Math.cos(angle),sn=Math.sin(angle);return FLIGHT_HULL.map(p=>({x:x+p.x*cs-p.y*sn,y:y+p.x*sn+p.y*cs}))}
export function rimSeparation(hull,edge){let best=Infinity,qx=0,qy=0,inside=true;
 for(let i=0;i<hull.length;i++){const a=hull[i],b=hull[(i+1)%hull.length],dx=b.x-a.x,dy=b.y-a.y;
 if(dx*(-a.y)-dy*(edge-a.x)<-1e-8)inside=false;
 const t=Math.max(0,Math.min(1,((edge-a.x)*dx-a.y*dy)/(dx*dx+dy*dy)));const x=a.x+t*dx,y=a.y+t*dy,d=(x-edge)**2+y*y;if(d<best){best=d;qx=x;qy=y}}
 const len=Math.sqrt(best)||1e-8,sign=inside?-1:1;return{distance:inside?-Math.sqrt(best):Math.sqrt(best),nx:(qx-edge)/len*sign,ny:qy/len*sign,qx,qy};
}
export function sweepRig(r,x0,y0,x1,y1,a0=0,a1=a0){const dx=x1-x0,dy=y1-y0,da=a1-a0,bound=Math.hypot(dx,dy)+RIG_RADIUS*Math.abs(da);if(bound<1e-10)return null;
 let first=null;
 for(const edge of[-r.half,r.half]){let t=0;
  for(let i=0;i<32&&t<=1;i++){const x=x0+dx*t,y=y0+dy*t,s=rimSeparation(rigHull(x,y,a0+da*t),edge),gap=s.distance-RIM_TUBE-RIM_SKIN;
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
export const envelopeSourcePoints=()=>raw;
