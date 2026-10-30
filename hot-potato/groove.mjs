// Original instrumental: 108 BPM, warm disco keys, syncopated bass and swung hats.
// No external recordings, third-party tracks, permissions or network requests.
export const BPM=108,BEAT=60/BPM,LOOP_STEPS=128;
const roots=[41,38,34,36,41,38,34,36];
const chords=[[53,57,60,64],[50,53,57,60],[46,50,53,57],[48,52,55,62]];
const tunes=[[69,72,74,72],[69,65,67,69],[65,69,72,69],[67,70,74,72],[72,76,74,72],[69,72,69,65],[65,69,72,74],[74,72,67,64]];
export const midiHz=n=>440*2**((n-69)/12);
export function grooveStep(index){
 const step=((index%LOOP_STEPS)+LOOP_STEPS)%LOOP_STEPS,bar=Math.floor(step/16),s=step%16,events=[];
 if(s%4===0)events.push({instrument:'kick',gain:.65});
 if(s===4||s===12)events.push({instrument:'clap',gain:.22});
 if(s%2===0)events.push({instrument:'hat',gain:s%4===2?.11:.055,offset:s%4===2?.028:0});
 if(s%2===1)events.push({instrument:'shaker',gain:.025,offset:.012});
 const bassSteps=[0,3,6,10,13],bassIndex=bassSteps.indexOf(s);
 if(bassIndex>=0)events.push({instrument:'bass',note:roots[bar]+([0,12,0,7,12][bassIndex]),duration:[.34,.17,.24,.2,.18][bassIndex],gain:.3});
 if([0,6,11].includes(s))for(const note of chords[bar%4])events.push({instrument:'keys',note,duration:.32,gain:.065});
 const melodyIndex=[2,7,10,14].indexOf(s);
 if(melodyIndex>=0)events.push({instrument:'bell',note:tunes[bar][melodyIndex],duration:.3,gain:bar%2?.065:.085});
 return events;
}
const ease=t=>t*t*(3-2*t);
export function dancePose(seconds){
 const beat=Math.max(0,seconds)/BEAT,phase=beat*Math.PI;
 // A running-man step has two distinct jobs: the weighted foot slides back
 // ON the floor while the free knee comes up, swings forward and plants.
 // Smoothly mix in a heel/toe T-step over an eight-beat phrase.
 const shuffle=(1-Math.cos(beat*Math.PI/4))/2;
 function leg(offset,side){
  const u=((beat+offset)%2+2)%2,swing=u>=1,q=swing?u-1:u;
  const lift=swing?19*Math.sin(Math.PI*q)**2:0;
  const depth=swing?-13+26*ease(q):13-26*ease(q);
  const swivel=Math.sin(phase*2),toe=side*shuffle*.26*swivel;
  return {lift,depth,slide:side*shuffle*7*Math.sin(phase),
   turn:side*(.035+shuffle*.13)*swivel,
   yaw:toe+side*.08,pitch:swing?-.2*Math.sin(Math.PI*q):.12*Math.sin(Math.PI*q),
   contact:!swing};
 }
 const l=leg(0,-1),r=leg(1,1);
 return {travel:5*Math.sin(phase/2),x:3*Math.sin(phase),y:1.6*(1+Math.cos(phase*2)),lean:.025*Math.sin(phase),
  leftSlide:l.slide,rightSlide:r.slide,leftLift:l.lift,rightLift:r.lift,
  leftDepth:l.depth,rightDepth:r.depth,leftTurn:l.turn,rightTurn:r.turn,
  leftYaw:l.yaw,rightYaw:r.yaw,leftPitch:l.pitch,rightPitch:r.pitch,
  leftContact:l.contact,rightContact:r.contact,
  wingLeft:-.1+.28*Math.sin(phase+.55),wingRight:-.1+.28*Math.sin(phase+Math.PI+.55),
  headTurn:.025*Math.sin(phase-.4)};
}
export class MenuGroove{
 constructor(factory=()=>new (window.AudioContext||window.webkitAudioContext)()){
  this.factory=factory;this.ctx=null;this.running=false;this.timer=null;this.sources=new Set();this.origin=0;this.next=0;this.generation=0;this.volume=.65;this.beatOffset=()=>0;
 }
 get seconds(){return this.running&&this.ctx?Math.max(0,this.ctx.currentTime-this.origin):null}
 async start(){
  if(this.running)return;
  try{
   if(!this.ctx)this.init();
   // Set synchronously so a later stop (Play/hidden tab) cancels pending resume.
   this.running=true;const generation=++this.generation;await this.ctx.resume();if(!this.running||generation!==this.generation)return;
   const offset=Math.max(0,this.beatOffset());this.origin=this.ctx.currentTime+.035-offset;this.next=Math.ceil(offset/(BEAT/4));
   this.master.gain.cancelScheduledValues(this.ctx.currentTime);this.master.gain.setValueAtTime(0,this.ctx.currentTime);this.master.gain.linearRampToValueAtTime(.55*this.volume,this.ctx.currentTime+.1);
   this.schedule();this.timer=setInterval(()=>this.schedule(),25);
  }catch{this.running=false;this.stop()}
 }
 init(){
  const c=this.ctx=this.factory();this.master=c.createGain();this.master.gain.value=0;
  const compressor=c.createDynamicsCompressor();compressor.threshold.value=-17;compressor.knee.value=12;compressor.ratio.value=3;compressor.attack.value=.003;compressor.release.value=.17;
  this.master.connect(compressor);compressor.connect(c.destination);
  this.echo=c.createDelay(.5);this.echo.delayTime.value=BEAT*.75;const wet=c.createGain();wet.gain.value=.17;this.echo.connect(wet);wet.connect(this.master);
  this.noise=c.createBuffer(1,c.sampleRate*.4,c.sampleRate);const data=this.noise.getChannelData(0);let seed=712;
  for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=(seed/4294967296)*2-1}
 }
 track(source,nodes=[]){this.sources.add(source);source.onended=()=>{this.sources.delete(source);source.disconnect();for(const node of nodes)node.disconnect()};return source}
 schedule(){
  if(!this.running)return;
  const c=this.ctx;
  // Discard stale events if a browser suspended/throttled the timer.
  const elapsed=(c.currentTime-this.origin)/(BEAT/4);if(this.next<elapsed-1)this.next=Math.ceil(elapsed);
  while(this.origin+this.next*BEAT/4<c.currentTime+.12){const at=this.origin+this.next*BEAT/4;for(const e of grooveStep(this.next))this.note(e,at+(e.offset||0));this.next++}
 }
 note(e,at){
  const c=this.ctx;if(at<c.currentTime-.01)return;
  const gain=c.createGain();gain.connect(this.master);
  if(e.instrument==='kick'){
   const o=this.track(c.createOscillator(),[gain]);o.type='sine';o.frequency.setValueAtTime(145,at);o.frequency.exponentialRampToValueAtTime(43,at+.12);gain.gain.setValueAtTime(e.gain,at);gain.gain.exponentialRampToValueAtTime(.001,at+.23);o.connect(gain);o.start(at);o.stop(at+.25);return;
  }
  if(['clap','hat','shaker'].includes(e.instrument)){
   const filter=c.createBiquadFilter(),n=this.track(c.createBufferSource(),[gain,filter]);n.buffer=this.noise;filter.type='highpass';filter.frequency.value=e.instrument==='clap'?1100:6500;n.connect(filter);filter.connect(gain);
   const duration=e.instrument==='clap'?.13:e.instrument==='hat'?.065:.035;
   gain.gain.setValueAtTime(e.gain,at);gain.gain.exponentialRampToValueAtTime(.001,at+duration);n.start(at);n.stop(at+duration+.01);return;
  }
  const filter=c.createBiquadFilter(),o=this.track(c.createOscillator(),[gain,filter]);o.type=e.instrument==='bass'?'triangle':'sine';o.frequency.value=midiHz(e.note);
  filter.type='lowpass';filter.frequency.value=e.instrument==='bass'?750:4200;o.connect(filter);filter.connect(gain);
  const end=at+e.duration;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(e.gain,at+.012);gain.gain.exponentialRampToValueAtTime(.001,end);
  if(e.instrument!=='bass')gain.connect(this.echo);
  o.start(at);o.stop(end+.02);
 }
 stop(){
  this.running=false;this.generation++;if(this.timer!==null){clearInterval(this.timer);this.timer=null}
  if(!this.ctx)return;const now=this.ctx.currentTime;
  this.master.gain.cancelScheduledValues(now);this.master.gain.setTargetAtTime(0,now,.008);
  for(const source of this.sources){try{source.stop(now+.025)}catch{}}this.sources.clear();
 }
}
