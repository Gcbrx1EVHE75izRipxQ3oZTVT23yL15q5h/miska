const clamp=t=>Math.max(0,Math.min(1,t)),ease=t=>{t=clamp(t);return t*t*(3-2*t)},mix=(a,b,t)=>a+(b-a)*t;
export const LAUNCH_DURATION=1.6;
// The opening coordinates refer to the generated kitchen asset, never the concept art.
export function kitchenLayout(padX=0,padY=0){const width=400+2*padX,height=650+2*padY,scale=Math.max(width/1024,height/1536),w=1024*scale,h=1536*scale,x=-padX+(width-w)/2,y=-padY+(height-h)/2;return{x,y,w,h,window:{x:x+w*.705,y:y+h*.275,sill:y+h*.407},floor:y+h*.55}}
export function launchPose(seconds,hero,window){const t=clamp(seconds/LAUNCH_DURATION),runEnd=.46,jumpEnd=.83,run=clamp(t/runEnd),jump=clamp((t-runEnd)/(jumpEnd-runEnd)),exit=clamp((t-jumpEnd)/(1-jumpEnd));
 const startFloor=hero.y+53*hero.size,runFloor=window.sill+87,runX=window.x-36,s=mix(hero.size,1,ease(run)),rx=mix(hero.x,runX,ease(run)),floor=mix(startFloor,runFloor,ease(run));
 if(t<runEnd)return{stage:'run',x:rx,y:floor-48*s-Math.abs(Math.sin(run*Math.PI*6))*4,scale:s,stride:run*Math.PI*6,lean:-.10,kitchenAlpha:1,zoom:1,done:false};
 const j=ease(jump),x=mix(runX,window.x,j),y=mix(runFloor-48,window.y,j)-Math.sin(jump*Math.PI)*35,size=mix(1,.68,j);
 if(t<jumpEnd)return{stage:'jump',x,y,scale:size,stride:Math.PI*6,lean:-.18+.3*jump,kitchenAlpha:1,zoom:1,done:false};
 const e=ease(exit);return{stage:'exit',x:mix(window.x,200,e),y:mix(window.y,275,e),scale:mix(.68,1,e),stride:Math.PI*6,lean:mix(.12,0,e),kitchenAlpha:1-e,zoom:1+e*2.3,done:t>=1};
}
export function runningLimbs(phase){const arms=[-1,1].map(side=>{const s=Math.sin(phase+(side<0?0:Math.PI));return{kind:'arm',side,hx:side*26,hy:5,kx:side*29+s*7,ky:14,ax:side*26+s*17,ay:18-s*12}}),legs=[[-20,15,1.8],[-3,19,0]].map(([hx,hy,offset],i)=>{const wave=Math.sin(phase+offset),lift=Math.max(0,wave)*18;return{kind:'leg',side:i?1:-1,hx,hy,kx:hx+wave*11,ky:hy+14-lift*.7,ax:hx+wave*17,ay:hy+27-lift}});return [...arms,...legs]}
