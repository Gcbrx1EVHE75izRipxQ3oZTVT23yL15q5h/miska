// Offline DOM/Canvas doubles for application-flow tests. No browser/network or layout engine.
import fs from 'node:fs';import vm from 'node:vm';import path from 'node:path';import {fileURLToPath} from 'node:url';
import * as launch from '../../launch.mjs';
import * as rig from '../../rig-geometry.mjs';
import * as physics from '../../physics.mjs';import * as motion from '../../motion.mjs';import * as groove from '../../groove.mjs';import * as profiles from '../../profile.mjs';import * as icons from '../../icons.mjs';import {Sound} from '../../sound.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
class Element{
 constructor(tag,doc){this.tagName=tag.toUpperCase();this.doc=doc;this.children=[];this.parentElement=null;this.attributes={};this.style={setProperty(k,v){this[k]=v}};this.dataset={};this.hidden=false;this.inert=false;this.disabled=false;this.checked=false;this.value='';this.className='';this.listeners={};this.writes=0;}
 setAttribute(k,v){this.attributes[k]=String(v);if(k==='id')this.id=v;if(k==='class')this.className=v;if(k==='hidden')this.hidden=true;if(k==='disabled')this.disabled=true;if(k==='checked')this.checked=true;if(k==='value')this.value=v;if(k==='width'||k==='height')this[k]=Number(v);if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v}
 getAttribute(k){return this.attributes[k]??null}
 get classList(){const el=this;return{add(...s){el.className=[...new Set([...el.className.split(' ').filter(Boolean),...s])].join(' ')},remove(...s){el.className=el.className.split(' ').filter(x=>!s.includes(x)).join(' ')},toggle(s,on){if(on===undefined)on=!this.contains(s);on?this.add(s):this.remove(s)},contains(s){return el.className.split(' ').includes(s)}}}
 append(...nodes){for(let n of nodes){if(typeof n==='string'){const t=new Element('#text',this.doc);t.raw=n;n=t}n.parentElement=this;this.children.push(n)}}
 appendChild(n){this.append(n);return n}replaceChildren(...n){this.children.forEach(c=>c.parentElement=null);this.children=[];this.append(...n)}
 get textContent(){return this.tagName==='#TEXT'?this.raw||'':this.children.map(c=>c.textContent).join('')}
 set textContent(v){this.writes++;const n=new Element('#text',this.doc);n.raw=String(v);this.replaceChildren(n)}
 set innerHTML(html){this.replaceChildren();parse(html,this,this.doc)}get innerHTML(){return this.textContent}
 matches(sel){return sel.split(',').some(s=>{s=s.trim();if(s.startsWith('#'))return this.id===s.slice(1);if(s.startsWith('.'))return s.slice(1).split('.').every(c=>this.classList.contains(c));if(s.startsWith('['))return Object.hasOwn(this.attributes,s.slice(1,-1));return this.tagName.toLowerCase()===s})}
 closest(sel){for(let p=this;p;p=p.parentElement)if(p.matches(sel))return p;return null}
 querySelectorAll(sel){const parts=sel.trim().split(/\s+/),last=parts.pop(),result=[];const visit=p=>{for(const ch of p.children){if(ch.matches(last)){let at=ch.parentElement,okay=true;for(let i=parts.length-1;i>=0;i--){while(at&&!at.matches(parts[i]))at=at.parentElement;if(!at){okay=false;break}at=at.parentElement}if(okay)result.push(ch)}visit(ch)}};visit(this);return result}
 querySelector(s){return this.querySelectorAll(s)[0]||null}addEventListener(k,fn){(this.listeners[k]??=[]).push(fn)}
 focus(){this.doc.activeElement=this}get isConnected(){for(let p=this;p;p=p.parentElement)if(p===this.doc)return true;return false}
 click(){for(let p=this;p;p=p.parentElement)if(p.hidden||p.inert||p.disabled)throw Error('Inactive control '+this.id);return this.onclick?.({target:this})}
 get offsetWidth(){return 200}getBoundingClientRect(){const {width:w,height:h}=this.doc.viewport;if(this.id==='shell')return{width:w,height:h,top:0,left:0};if(this.classList.contains('hero-space'))return{width:w,height:Math.max(105,h-380),top:h<650?150:210,left:0};return{width:100,height:44,top:0,left:0}}
 getContext(){return canvasContext()}
}
function parse(html,parent,doc){const stack=[parent],voids=new Set(['meta','link','img','input','br','hr','source']);for(const token of html.match(/<[^>]*>|[^<]+/g)||[]){if(token.startsWith('<!'))continue;if(token.startsWith('</')){if(stack.length>1)stack.pop();continue}if(token.startsWith('<')){const tag=token.match(/^<([\w-]+)/)?.[1];if(!tag)continue;const el=new Element(tag,doc);const attrs=token.slice(tag.length+1,-1);for(const m of attrs.matchAll(/([\w-]+)(?:="([^"]*)"|='([^']*)'|=([^\s>]+))?/g))el.setAttribute(m[1],m[2]??m[3]??m[4]??'');stack.at(-1).append(el);if(!voids.has(tag)&&!token.endsWith('/>'))stack.push(el)}else{const t=new Element('#text',doc);t.raw=token.replace(/&amp;/g,'&');stack.at(-1).append(t)}}}
function canvasContext(){return new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),drawImage(im,...coords){if(!im)throw Error('Missing graphic');if(coords.some(n=>!Number.isFinite(n)))throw Error('Invalid graphic coordinate')},measureText:s=>({width:s.length*7})},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)})}
class AudioNode{constructor(){for(const k of ['gain','frequency','delayTime','threshold','knee','ratio','attack','release'])this[k]={value:0,cancelScheduledValues(){},setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){}}}connect(){}disconnect(){}start(){}stop(){}}
class Audio{constructor(){this.state='running';this.currentTime=0;this.sampleRate=100;this.destination={}}resume(){this.state='running';return Promise.resolve()}createGain(){return new AudioNode()}createOscillator(){return new AudioNode()}createBufferSource(){return new AudioNode()}createDynamicsCompressor(){return new AudioNode()}createDelay(){return new AudioNode()}createBiquadFilter(){return new AudioNode()}createBuffer(_,n){return{getChannelData:()=>new Float32Array(n)}}}
class OfflineSound extends Sound{constructor(p){super(p);this.ctx=new Audio()}}
export async function harness({width=390,height=844,stored={}}={}){
 const document=new Element('document',null);document.doc=document;document.viewport={width,height};document.hidden=false;document.createElement=tag=>new Element(tag,document);document.activeElement=document;parse(fs.readFileSync(root+'/index.html','utf8'),document,document);
 const data=new Map(Object.entries(stored)),localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};let callbacks=[],ms=0;
 const window={addEventListener(){}};
 class Image{constructor(){this.width=1000;this.height=1000}set src(value){if(!fs.existsSync(root+'/'+value))throw Error('Missing asset '+value);queueMicrotask(()=>this.onload())}}
 const errors=[];const context=vm.createContext({...launch,...rig,...physics,...motion,...groove,...profiles,...icons,Sound:OfflineSound,document,window,Image,localStorage,ResizeObserver:class{constructor(fn){this.fn=fn}observe(){this.fn()}},requestAnimationFrame:fn=>callbacks.push(fn),setInterval:()=>0,console:{error:(...v)=>errors.push(v.join(' '))},Date,Math});
 const source=fs.readFileSync(root+'/game.mjs','utf8').replace(/^import .*;\n/gm,'').replace('mountIcons();','mountIcons(document);');vm.runInContext(source,context,{filename:'game.mjs'});for(let i=0;i<8;i++)await Promise.resolve();
 const read=code=>vm.runInContext(code,context),step=(dt=1000/120)=>{ms+=dt;const current=callbacks;callbacks=[];for(const cb of current)cb(ms)},click=async id=>{await document.querySelector('#'+id).click();for(let i=0;i<4;i++)await Promise.resolve()};
 return {document,read,step,click,data,errors,close(){read('sound.groove.stop();sound.stopEffects()')},advance(seconds){for(let i=0;i<seconds*120;i++)step()},tap(){read('tap()')}};
}
