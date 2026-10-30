import {MenuGroove} from './groove.mjs';
export class Sound{
 constructor(settings){this.settings=settings;this.ctx=null;this.unlocked=false;this.error='';this.groove=new MenuGroove(()=>this.context());this.muted=!!settings.muted;this.menu=true;this.visible=true;this.paused=false;this.listeners=[];this.effects=new Set()}
 context(){if(!this.ctx){if(navigator.audioSession)navigator.audioSession.type='playback';this.ctx=new(window.AudioContext||window.webkitAudioContext)();this.ctx.onstatechange=()=>{this.unlocked=this.ctx.state==='running';if(!this.unlocked){this.groove.stop();this.stopEffects()}else this.sync();this.changed()}}return this.ctx}
 changed(){for(const fn of this.listeners)fn()}
 async unlock(){try{const c=this.context();await c.resume();this.unlocked=c.state==='running';this.error=this.unlocked?'':'Äänen käynnistys odottaa painallusta';if(this.unlocked){const b=c.createBuffer(1,1,c.sampleRate),s=c.createBufferSource();s.buffer=b;s.connect(c.destination);s.start();this.sync()}this.changed();return this.unlocked}catch{this.error='Selain ei käynnistänyt ääntä. Kokeile uudelleen.';this.changed();return false}}
 sync(){if(!this.visible||this.paused||this.muted)this.stopEffects();const yes=this.unlocked&&!this.muted&&this.visible&&!this.paused&&this.menu&&this.settings.music>0;this.groove.volume=this.settings.music;yes?this.groove.start():this.groove.stop();if(this.groove.master&&yes)this.groove.master.gain.setTargetAtTime(.55*this.settings.music,this.ctx.currentTime,.04);this.changed()}
 stopEffects(){for(const source of this.effects){try{source.stop()}catch{}}this.effects.clear()}
 effect(type){
  if(!this.unlocked||this.muted||!this.visible||this.paused||!this.settings.effects)return;
  const c=this.ctx;if(c.state!=='running')return;
  // Fixed, recognizable motifs. Per-voice gain keeps chord cues balanced.
  if(type==='glass'){
   if(!this.glassNoise){this.glassNoise=c.createBuffer(1,Math.ceil(c.sampleRate*.26),c.sampleRate);const data=this.glassNoise.getChannelData(0);let seed=712;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=(seed/4294967296)*2-1}}
   const noise=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain(),at=c.currentTime;noise.buffer=this.glassNoise;filter.type='highpass';filter.frequency.value=1800;noise.connect(filter);filter.connect(gain);gain.connect(c.destination);gain.gain.setValueAtTime(.065*this.settings.effects,at);gain.gain.exponentialRampToValueAtTime(.001,at+.25);this.effects.add(noise);noise.onended=()=>{this.effects.delete(noise);noise.disconnect();filter.disconnect();gain.disconnect()};noise.start(at);noise.stop(at+.27);
  }
  const cues={glass:[[2700,1700,.14,0,.035],[3600,2100,.18,.028,.026],[4300,3100,.12,.073,.018]],step:[[160,95,.045,0,.045]],jump:[[260,850,.28,0,.065]],tap:[[330,510,.065,0,.085]],pass:[[520,900,.16,0,.11]],perfect:[[740,990,.21,0,.075],[1110,1480,.22,.045,.052],[1480,1760,.19,.09,.035]],graze:[[260,140,.13,0,.10]],over:[[220,65,.3,0,.095]],click:[[620,800,.045,0,.065]],multiplier:[[660,660,.12,0,.06],[880,880,.16,.10,.06],[1320,1320,.21,.20,.06]],world:[[330,440,.4,0,.045],[495,660,.4,.08,.045],[660,880,.5,.16,.04]],record:[[523,523,.16,0,.065],[659,659,.16,.13,.065],[784,784,.16,.26,.065],[1047,1568,.45,.39,.07]]};
  const at=c.currentTime;for(const[a,b,d,delay,level]of(cues[type]||cues.pass)){
   const o=c.createOscillator(),gain=c.createGain();o.connect(gain);gain.connect(c.destination);o.type=['graze','glass'].includes(type)?'triangle':'sine';
   const t=at+delay;o.frequency.setValueAtTime(a,t);o.frequency.exponentialRampToValueAtTime(b,t+d);gain.gain.setValueAtTime(level*this.settings.effects,t);gain.gain.exponentialRampToValueAtTime(.001,t+d);this.effects.add(o);o.onended=()=>{this.effects.delete(o);o.disconnect();gain.disconnect()};o.start(t);o.stop(t+d+.01);
  }
 }
 get status(){return this.error||(this.muted?'Äänet on mykistetty.':this.unlocked?(this.settings.music===0&&this.settings.effects===0?'Äänenvoimakkuudet ovat nollassa.':'Äänet ovat päällä.'):'Napauta käynnistääksesi äänet.')}
}
