// Visual smoothing only: controls, collision and the original flight physics remain fixed-step.
export const lerp=(a,b,t)=>a+(b-a)*t;
export function smooth(current,target,dt,rate=12){return lerp(current,target,1-Math.exp(-rate*Math.max(0,dt)))}
export function poseWeights(previous,target,dt){
 const weights=previous.map((value,i)=>smooth(value,i===target?1:0,dt,22));
 const total=weights.reduce((a,b)=>a+b,0)||1;
 return weights.map(w=>w/total);
}
export function renderState(g,alpha){const a=Math.max(0,Math.min(1,alpha));return {tilt:lerp(g.prevTilt??g.tilt??0,g.tilt??0,a),x:lerp(g.prevX??g.x??112,g.x??112,a),spin:lerp(g.prevSpin??g.spin,g.spin,a),y:lerp(g.prevY??g.y,g.y,a),travel:lerp(g.prevTravel??g.travel,g.travel,a),time:Math.max(0,g.tick-1+a)/120}}

export const cameraOffsetX=(playerX,width=400)=>width/2-playerX;

// Wider gameplay framing only; HUD, menus and simulation units stay unchanged.
export const FLIGHT_ZOOM=.78;
export function flightCamera(playerX,zoom=FLIGHT_ZOOM,width=400,height=650){return{zoom,x:width/2-zoom*playerX,y:height/2*(1-zoom)}}
