// Visual smoothing only: controls, collision and the original flight physics remain fixed-step.
export const lerp=(a,b,t)=>a+(b-a)*t;
export function smooth(current,target,dt,rate=12){return lerp(current,target,1-Math.exp(-rate*Math.max(0,dt)))}
export function poseWeights(previous,target,dt){
 const weights=previous.map((value,i)=>smooth(value,i===target?1:0,dt,22));
 const total=weights.reduce((a,b)=>a+b,0)||1;
 return weights.map(w=>w/total);
}
export function renderState(g,alpha){const a=Math.max(0,Math.min(1,alpha));return {spin:lerp(g.prevSpin??g.spin,g.spin,a),y:lerp(g.prevY??g.y,g.y,a),travel:lerp(g.prevTravel??g.travel,g.travel,a),time:Math.max(0,g.tick-1+a)/120}}
