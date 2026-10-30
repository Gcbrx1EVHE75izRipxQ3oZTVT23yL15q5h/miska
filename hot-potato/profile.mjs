const KEY='ring-dive-profile-v2';
export const ACHIEVEMENTS=[
 {id:'first',name:'Ensimmäinen sukellus',description:'Läpäise ensimmäinen rengas.',icon:'ring',rings:1},
 {id:'perfect3',name:'Kolme täydellistä',description:'Tee kolmen PERFECTin ketju.',icon:'bolt',streak:3},
 {id:'forest',name:'Metsän kutsu',description:'Saavuta Lumometsä. Renkaat 16–35.',icon:'leaf',rings:15},
 {id:'crystal',name:'Kristallin hohde',description:'Saavuta Kristalliluola. Renkaat 36–60.',icon:'crystal',rings:35},
 {id:'volcano',name:'Kuuma peruna',description:'Saavuta Tulivuori. Renkaat 61–90.',icon:'volcano',rings:60},
 {id:'space',name:'Peruna tähtien joukossa',description:'Saavuta Avaruus. Renkaat 91+.',icon:'star',rings:90}
];
export const defaults=()=>({name:'PERUNAPILOTTI',music:.65,effects:.85,muted:false,reduced:false,runs:[],plays:0,totalRings:0,bestStreak:0,highestRings:0,bestScore:0,achievements:{},lastRunId:null,latestRun:null});
const count=n=>Number.isSafeInteger(n)&&n>=0?n:0;
const volume=n=>Number.isFinite(Number(n))?Math.max(0,Math.min(1,Number(n))):.7;
export const cleanName=name=>String(name||'PERUNAPILOTTI').replace(/[<>\u0000-\u001f]/g,'').trim().slice(0,18)||'PERUNAPILOTTI';
export const validRun=r=>r&&Number.isSafeInteger(r.rings)&&r.rings>=0&&Number.isSafeInteger(r.score)&&r.score>=0;
export function ranked(runs){return [...runs].sort((a,b)=>b.score-a.score||b.rings-a.rings||a.at-b.at)}
export function unlockAchievements(p,{rings=0,bestStreak=0,test=false,at=Date.now()}={}){
 if(test)return [];p.achievements??={};const unlocked=[];
 for(const a of ACHIEVEMENTS)if(!p.achievements[a.id]&&(a.rings?rings>=a.rings:bestStreak>=a.streak)){p.achievements[a.id]=at||1;unlocked.push(a)}
 return unlocked;
}
export function loadProfile(storage){try{const old=JSON.parse(storage.getItem(KEY));if(!old)return defaults();const p={...defaults(),name:cleanName(old.name),music:volume(old.music??.65),effects:volume(old.effects??.85),muted:old.muted===true,reduced:old.reduced===true};
 p.runs=Array.isArray(old.runs)?ranked(old.runs.filter(validRun).map((r,i)=>({...r,id:String(r.id||`legacy-${i}`),name:cleanName(r.name),at:count(r.at),bestStreak:count(r.bestStreak)}))).slice(0,50):[];
 for(const k of ['plays','totalRings','bestStreak','highestRings','bestScore'])p[k]=count(old[k]);
 p.highestRings=Math.max(p.highestRings,...p.runs.map(r=>r.rings));p.bestScore=Math.max(p.bestScore,...p.runs.map(r=>r.score));
 p.achievements=Object.fromEntries(ACHIEVEMENTS.filter(a=>count(old.achievements?.[a.id])>0).map(a=>[a.id,old.achievements[a.id]]));
 p.lastRunId=typeof old.lastRunId==='string'?old.lastRunId:null;p.latestRun=validRun(old.latestRun)?{...old.latestRun,name:cleanName(old.latestRun.name)}:null;
 unlockAchievements(p,{rings:p.highestRings,bestStreak:p.bestStreak,at:1});return p;
 }catch{return defaults()}}
export function saveProfile(storage,p){try{storage.setItem(KEY,JSON.stringify(p));return true}catch{return false}}
export function addRun(p,run){if(run.test||!validRun(run))return false;
 p.plays++;p.totalRings+=run.rings;p.bestStreak=Math.max(p.bestStreak,run.bestStreak||0);p.highestRings=Math.max(p.highestRings,run.rings);p.bestScore=Math.max(p.bestScore,run.score);
 const entry={id:run.id||`${Date.now()}-${p.plays}`,name:cleanName(p.name),rings:run.rings,score:run.score,bestStreak:count(run.bestStreak),at:run.at??Date.now()};
 p.latestRun=entry;p.lastRunId=entry.id;p.runs=ranked([...p.runs,entry]).slice(0,50);unlockAchievements(p,{rings:run.rings,bestStreak:run.bestStreak,at:entry.at});return true;
}
// One definition shared by local filters and the dormant server: Monday 00:00 UTC.
export function weekStartUTC(now=Date.now()){const d=new Date(now);d.setUTCHours(0,0,0,0);d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return +d}
export function leaderboardRows(p,week=false,now=Date.now()){const since=week?weekStartUTC(now):-Infinity;return ranked(p.runs).filter(r=>r.at>=since).slice(0,20)}
