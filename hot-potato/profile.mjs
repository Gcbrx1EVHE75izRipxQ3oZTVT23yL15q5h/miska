const KEY='ring-dive-profile-v2';
export const defaults=()=>({name:'PERUNAPILOTTI',music:.65,effects:.85,reduced:false,runs:[],plays:0,totalRings:0,bestStreak:0});
export function loadProfile(storage){try{const p=JSON.parse(storage.getItem(KEY));if(!p)return defaults();return {...defaults(),...p,name:cleanName(p.name),runs:Array.isArray(p.runs)?p.runs.filter(validRun).slice(0,50):[],music:clamp(p.music),effects:clamp(p.effects)}}catch{return defaults()}}
const clamp=n=>Number.isFinite(Number(n))?Math.max(0,Math.min(1,Number(n))):.7;
export const cleanName=name=>String(name||'PERUNAPILOTTI').replace(/[<>\u0000-\u001f]/g,'').trim().slice(0,18)||'PERUNAPILOTTI';
export const validRun=r=>r&&Number.isInteger(r.rings)&&r.rings>=0&&Number.isInteger(r.score)&&r.score>=0;
export function saveProfile(storage,p){try{storage.setItem(KEY,JSON.stringify(p));return true}catch{return false}}
export function ranked(runs){return [...runs].sort((a,b)=>b.score-a.score||b.rings-a.rings||a.at-b.at)}
export function addRun(p,run){if(run.test||!validRun(run))return false;p.plays++;p.totalRings+=run.rings;p.bestStreak=Math.max(p.bestStreak,run.bestStreak||0);p.runs=ranked([...p.runs,{id:run.id||`${Date.now()}-${p.plays}`,name:cleanName(p.name),rings:run.rings,score:run.score,at:run.at||Date.now()}]).slice(0,50);return true}
