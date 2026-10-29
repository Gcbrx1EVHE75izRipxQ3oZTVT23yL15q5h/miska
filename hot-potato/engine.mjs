/* RING DIVE — original dc1812d physics, deterministic 120 Hz simulation. */
export const DT=1/120, GRAVITY=625, IMPULSE=-255, PX=112, WIDTH=400, HEIGHT=650;
export const BODY={x:21,y:20}, RIM=6;
export const WORLDS=[{name:'TAIVAS',start:1,end:15,color:'#ffcf48'},{name:'LUMOMETSÄ',start:16,end:35,color:'#64ffba'},{name:'KRISTALLILUOLA',start:36,end:60,color:'#ef83ff'},{name:'TULIVUORI',start:61,end:90,color:'#ff8e38'},{name:'AVARUUS',start:91,end:Infinity,color:'#67eaff'}];
export function tier(number){return number>=91?4:number>=61?3:number>=36?2:number>=16?1:0}
export function speed(passed){return 130+Math.min(passed*2.5,95)+13*(1-Math.exp(-Math.max(0,passed-110)/350))}
export function radius(number){return [80,73,66,59,53+3*Math.exp(-Math.max(0,number-91)/220)][tier(number)]}
export function amplitude(number){return number>=36&&number%3===0?[0,0,8,12,16][tier(number)]:0}
export function ringY(r,time){return r.base+r.amp*Math.sin(time*.9+r.phase)}
export function integrate(s,flap=false){if(flap)s.vy=IMPULSE;s.vy+=GRAVITY*DT;s.y+=s.vy*DT;s.travel+=speed(s.passed)*DT;s.tick++;s.time=s.tick*DT;if(s.y<42){s.y=42;s.vy=Math.max(0,s.vy)}}
function segmentBox(x0,y0,x1,y1,cx,rx,ry){let lo=0,hi=1;for(const [p,d,a,b] of [[x0,x1-x0,cx-rx,cx+rx],[y0,y1-y0,-ry,ry]]){if(Math.abs(d)<1e-10){if(p<a||p>b)return false}else{let u=(a-p)/d,v=(b-p)/d;if(u>v)[u,v]=[v,u];lo=Math.max(lo,u);hi=Math.min(hi,v);if(lo>hi)return false}}return true}
export function contact(r,old,s){const ox=PX-(r.x-old.travel),nx=PX-(r.x-s.travel),oy=old.y-ringY(r,old.time),ny=s.y-ringY(r,s.time);if(segmentBox(ox,oy,nx,ny,-r.half,BODY.x+RIM,BODY.y+RIM)||segmentBox(ox,oy,nx,ny,r.half,BODY.x+RIM,BODY.y+RIM))return 'rim';
if(oy<0&&ny>=0&&ny>oy&&s.vy>0){const f=-oy/(ny-oy),offset=Math.abs(ox+(nx-ox)*f);if(offset<r.half-BODY.x-RIM){r.entered=true;r.offset=offset}else if(offset<r.half+BODY.x+RIM)return 'rim'}
if(ny<0&&s.vy<0)r.entered=false;
if(r.entered&&ny>BODY.y+RIM&&ny>oy&&s.vy>0){r.entered=false;return 'pass'}
if(r.x-s.travel+r.half<PX-BODY.x)return 'miss';return null}
function initial(){return {y:275,vy:0,travel:0,tick:0,time:0,passed:0}}
/** Each ring is built around a verified input trajectory, never placed randomly. */
export function buildCourse(count=180,prior=null){const rings=prior?[...prior.rings]:[],tape=prior?[...prior.tape]:[],checkpoints=prior?[...prior.checkpoints]:[];let s=prior?{...prior.finalState}:initial();for(let n=rings.length+1;n<=count;n++){checkpoints.push({...s});const v=speed(n-1),duration=(n===1?358:([[315],[315,325,310],[315,335,300],[305,325,300],[290,325,300,340]][tier(n)])[n%([1,3,3,3,4][tier(n)])])/v;const target=330+Math.sin(n*1.71)*[28,43,66,75,80][tier(n)];let best=null;for(const extra of [0,30,60,90]){const N=Math.round(duration/DT)+extra;
for(const fall of [114,120,126,132])for(const wait of [0,4,8,12,18,24,30,36])for(let m=0;m<=4;m++){const last=N-fall;if(last<wait)continue;const taps=[wait];if(last>wait+2){for(let k=1;k<=m+1;k++)taps.push(Math.round(wait+(last-wait)*k/(m+1)))}const tapSet=new Set(taps);let p={...s},min=p.y,max=p.y;for(let i=0;i<N;i++){integrate(p,tapSet.has(i));min=Math.min(min,p.y);max=Math.max(max,p.y)}if(min<135||max>525)continue;
const r={number:n,tier:tier(n),x:s.travel+PX+v*N*DT,base:p.y,half:radius(n),amp:amplitude(n),phase:n*1.37,entered:false,offset:0};r.base-=r.amp*Math.sin(p.time*.9+r.phase);
let q={...s},outcome=null,doneAt=0;for(let i=0;i<N+40;i++){const old={...q};integrate(q,tapSet.has(i));const hit=contact(r,old,q);if(hit){outcome=hit;doneAt=i+1;break}}if(outcome!=='pass'||r.base<210||r.base>445)continue;
// Require a usable timing window, not just a single frame-perfect witness.
let tolerant=true;for(const delta of [-2,2]){let z={...s};const trial={...r,entered:false};const shifted=new Set(taps.map(t=>Math.max(0,t+delta)));let result=null;for(let i=0;i<N+45;i++){const before={...z};integrate(z,shifted.has(i));result=contact(trial,before,z);if(result)break}if(result!=='pass'){tolerant=false;break}}if(!tolerant)continue;const cost=Math.abs(p.y-target)+m*1.5;if(!best||cost<best.cost)best={cost,r:{...r,entered:false,offset:0},state:q,taps,doneAt}}
if(best)break;}if(!best)throw Error('No validated trajectory for ring '+n);rings.push(best.r);for(const t of best.taps)if(t<best.doneAt)tape.push(s.tick+t);s=best.state;s.passed=n}
return {rings,tape,checkpoints,finalState:{...s},validated:count}}
export class Game{
constructor(course,start=1){this.course=course;this.reset(start)}
reset(start=1){if(!Number.isInteger(start)||start<1||start>this.course.rings.length)throw Error('Invalid ring');this.state={...this.course.checkpoints[start-1]};this.next=start-1;this.start=start;this.passed=0;this.score=0;this.streak=0;this.multiplier=1;this.status='ready';this.reason='';this.pending=false;this.events=[];this.rings=this.course.rings.map(r=>({...r,done:r.number<start,entered:false}));}
flap(){if(this.status==='play')this.pending=true}
step(){if(this.status!=='play')return;const s=this.state,old={...s};integrate(s,this.pending);this.pending=false;if(s.y>HEIGHT-45){this.fail('Peruna putosi liian alas.');return}const r=this.rings[this.next];if(!r)return;const hit=contact(r,old,s);if(hit==='rim'){this.fail('Osuit renkaan reunaan.');return}if(hit==='miss'){this.fail('Rengas jäi väliin.');return}if(hit==='pass'){r.done=true;this.next++;this.passed++;s.passed=r.number;const perfect=r.offset<(r.half-BODY.x-RIM)*.22;this.streak=perfect?this.streak+1:0;this.multiplier=1+Math.min(4,Math.floor(this.streak/3));const pts=(perfect?100:40)*this.multiplier;this.score+=pts;this.events.push({type:'pass',number:r.number,perfect,points:pts,multiplier:this.multiplier});}}
fail(reason){this.status='over';this.reason=reason;this.events.push({type:'over',reason})}}
export function sceneryProgress(game){const x=game.state.travel+PX;let i=Math.max(0,game.next-1);while(i<game.rings.length&&game.rings[i].x<x)i++;const r=game.rings[i],prev=i?game.rings[i-1]:{x:PX,number:0};const fraction=r?Math.max(0,Math.min(1,(x-prev.x)/(r.x-prev.x))):1;const progress=prev.number+fraction;for(let k=0;k<4;k++){const end=WORLDS[k].end;if(progress<end)return {from:k,to:k+1,blend:Math.max(0,Math.min(1,(progress-(end-2))/2)),progress}}return {from:4,to:4,blend:0,progress}}
