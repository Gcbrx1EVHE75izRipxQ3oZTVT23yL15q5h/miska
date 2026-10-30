// Set this only after the separate durable API has been deployed and verified.
export const API_URL='';
async function request(path,body){const res=await fetch(API_URL+path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(7000)});if(!res.ok)throw Error('Tulostaulu ei vastaa');return res.json()}
export const beginRankedRun=()=>API_URL?request('/session',{}):Promise.resolve(null);
export const submitRankedRun=data=>API_URL?request('/scores',data):Promise.resolve(null);
export const fetchRankings=week=>request('/scores?period='+(week?'week':'all'));
