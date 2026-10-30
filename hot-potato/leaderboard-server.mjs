// Dedicated Ring Dive API. Node 24+, no packages. Never put credentials here.
// Deploy separately from the static game, with DB_PATH on a persistent disk.
import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {randomBytes} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {Game} from './physics.mjs';
import {cleanName,weekStartUTC} from './profile.mjs';
export function verifyReplay({seed,ticks,taps,rings,score,test}){
 if(test||!Number.isInteger(seed)||!Number.isInteger(ticks)||ticks<1||ticks>72000||!Array.isArray(taps)||taps.length>15000||!Number.isInteger(rings)||rings<0||!Number.isInteger(score)||score<0)throw Error('Virheellinen suoritus');
 let prev=-1;for(const tap of taps){if(!Number.isInteger(tap)||tap<=prev||tap>=ticks)throw Error('Virheellinen ohjaustieto');prev=tap}
 const g=new Game({seed});let next=0;while(g.mode==='play'&&g.tick<ticks){g.step(taps[next]===g.tick);if(taps[next]===g.tick-1)next++}
 if(g.mode!=='over'||g.tick!==ticks||g.passed!==rings||g.score!==score)throw Error('Tulos ei vastaa lentoa');
 return {rings:g.passed,score:g.score};
}
export function createLeaderboard({dbPath=':memory:',origin='https://hot-potato-play.onrender.com',clock=Date.now}={}){
 const db=new DatabaseSync(dbPath);db.exec(`PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,seed INTEGER,created INTEGER,used INTEGER DEFAULT 0); CREATE TABLE IF NOT EXISTS scores(id TEXT PRIMARY KEY,player TEXT NOT NULL,name TEXT NOT NULL,rings INTEGER NOT NULL,score INTEGER NOT NULL,at INTEGER NOT NULL); CREATE INDEX IF NOT EXISTS scores_rank ON scores(score DESC,rings DESC);`);
 const rates=new Map();
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Vary','Origin');
  if(req.headers.origin&&req.headers.origin!==origin){res.writeHead(403);res.end('{}');return}
  res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');
  const send=(status,data)=>{res.writeHead(status);res.end(JSON.stringify(data))};if(req.method==='OPTIONS'){send(204,null);return}
  const url=new URL(req.url,'http://localhost'),now=clock();
  if(req.method==='GET'&&url.pathname==='/health'){send(200,{ok:true});return}
  const ip=req.socket.remoteAddress;let rate=rates.get(ip);if(!rate||now-rate.start>60000){rate={start:now,n:0};rates.set(ip,rate)}if(++rate.n>90){send(429,{error:'Odota hetki ja yritä uudelleen.'});return}if(rates.size>10000)for(const [key,r]of rates)if(now-r.start>60000)rates.delete(key);
  try{
   if(req.method==='GET'&&url.pathname==='/scores'){
    let since=0;if(url.searchParams.get('period')==='week'){since=weekStartUTC(now)}
    const rows=db.prepare(`SELECT name,rings,score,at FROM (SELECT *,ROW_NUMBER() OVER(PARTITION BY player ORDER BY score DESC,rings DESC,at ASC) rn FROM scores WHERE at>=?) WHERE rn=1 ORDER BY score DESC,rings DESC,at ASC LIMIT 50`).all(since);send(200,{rows});return;
   }
   if(req.method!=='POST'){send(404,{error:'Ei löydy'});return}
   let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>160000){send(413,{error:'Liian suuri suoritus'});return}}const data=JSON.parse(raw||'{}');
   if(url.pathname==='/session'){
    db.prepare('DELETE FROM sessions WHERE created<?').run(now-1800000);const token=randomBytes(24).toString('hex'),seed=randomBytes(4).readUInt32LE();db.prepare('INSERT INTO sessions(token,seed,created) VALUES(?,?,?)').run(token,seed,now);send(200,{token,seed});return;
   }
   if(url.pathname==='/scores'){
    const session=db.prepare('SELECT * FROM sessions WHERE token=?').get(String(data.token||''));if(!session||session.used||now-session.created>1800000)throw Error('Lento on vanhentunut');
    if(!/^[a-zA-Z0-9-]{16,64}$/.test(data.player||''))throw Error('Virheellinen pelaajatunnus');
    if(!Number.isInteger(data.ticks)||data.ticks/120*1000>now-session.created+2000)throw Error('Lentoaika ei täsmää');
    const result=verifyReplay({...data,seed:session.seed});
    db.exec('BEGIN IMMEDIATE');try{db.prepare('INSERT INTO scores VALUES(?,?,?,?,?,?)').run(data.token,data.player,cleanName(data.name),result.rings,result.score,now);db.prepare('UPDATE sessions SET used=1 WHERE token=?').run(data.token);db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}
    send(201,{saved:true});return;
   }
   send(404,{error:'Ei löydy'});
  }catch(e){send(400,{error:e.message==='Tulos ei vastaa lentoa'?e.message:'Suoritusta ei voitu tallentaa.'})}
 });
 server.on('close',()=>db.close());return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){if(!process.env.DB_PATH)throw Error('Set DB_PATH to a persistent disk file before deployment');createLeaderboard({dbPath:process.env.DB_PATH,origin:process.env.GAME_ORIGIN||'https://hot-potato-play.onrender.com'}).listen(Number(process.env.PORT||10000),'0.0.0.0')}
