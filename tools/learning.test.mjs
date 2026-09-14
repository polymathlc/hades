import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../src/learning.js',import.meta.url),'utf8');
const plain=value=>JSON.parse(JSON.stringify(value));

function fixture({enabled=true,iframe=true,subject='math'}={}) {
  const elements=new Map(),messages=[],timers=new Map(),calls={starts:[],loads:[],saves:[],resume:0,pauses:[],god:[],pom:0,reset:0};
  const element=id=>{if(!elements.has(id))elements.set(id,{id,style:{display:'none'},hidden:false,textContent:'',append(){}});return elements.get(id);};
  const parent={postMessage(message,origin){messages.push({data:plain(message),origin});}};
  const window={location:{origin:'https://learning.example.test',search:enabled?`?learning=1&subject=${subject}`:''},addEventListener(){}};
  window.parent=iframe?parent:window;
  let uuid=0,timerId=0,context;
  context=vm.createContext({window,URLSearchParams,Math,Number,String,Object,encodeURIComponent,
    crypto:{randomUUID:()=>`request-${++uuid}`},
    setTimeout(callback,delay){const id=++timerId;timers.set(id,{callback,delay});return id;},clearTimeout(id){timers.delete(id);},
    document:{hidden:false,getElementById:element,createElement(){return {style:{display:'none'},innerHTML:''};}},
    gameState:{isPaused:false,ashes:999,bones:999,bestChamber:99,upgrades:{maxHp:8,magick:8,damage:8,defiance:8},particles:[]},
    gameRuntime:{ready:true,started:false,manualPaused:false,modalNodes:[]},
    player:{x:10,y:20,hp:40,maxHp:100,resetForRun(){calls.reset++;}},
    sound:{stopBGM(){}},resetRuntimeInput(){},updateHUD(){},
    resumeRuntime(){calls.resume++;},pauseRuntime(reason){calls.pauses.push(reason);},showRuntimePanel(){},
    startChamber(index,reward){calls.starts.push({index,reward});},
    openGodBoonModal(god,callback){calls.god.push({god,callback});},openPomModal(callback){calls.pom++;calls.pomCallback=callback;},
    loadPermanentProgress(){calls.loads.push(context.learningStorageKey());},savePermanentProgress(){calls.saves.push(context.learningStorageKey());},
    FloatingText:class {constructor(x,y,text,color){Object.assign(this,{x,y,text,color});}}
  });
  vm.runInContext(source+'\nglobalThis.state=hadesLearning;',context);
  context.installHadesLearning();
  function receive(data,{origin=window.location.origin,from=parent}={}){context.receiveLearningMessage({data,origin,source:from});}
  function ready(overrides={}){receive({type:'HADES_READY',requestId:context.state.helloId,sessionId:'session-one',available:true,profileKey:`student|${subject}|P6`,subject,...overrides});}
  function connect(){context.startHadesRun();ready();}
  function checkpoint(reward={type:'gold'},chamber=2){context.continueThroughHadesGate(reward,chamber);}
  function result(correct=5,overrides={}){const pending=context.state.pending;return {type:'HADES_ROUND_RESULT',sessionId:context.state.sessionId,requestId:pending?.requestId,round:pending?.round,...plain(context.learningRewardForScore(correct)),...overrides};}
  function runTimers(){for(const [id,timer] of [...timers]){if(timers.has(id)){timers.delete(id);timer.callback();}}}
  return {context,calls,messages,timers,element,parent,window,receive,ready,connect,checkpoint,result,runTimers};
}

test('five-answer reward table gives deterministic healing and boon tiers without AI',()=>{
  const f=fixture();
  const tiers=['fractured','common','uncommon','rare','epic','heroic'];
  for(let correct=0;correct<=5;correct++)assert.deepEqual(plain(f.context.learningRewardForScore(correct)),{correct,total:5,healPercent:correct*8,boonTier:tiers[correct]});
  for(const score of [-1,6,2.5,'5',null,undefined,NaN,Infinity])assert.equal(f.context.learningRewardForScore(score),null);
});

test('standalone mode preserves the original save namespace and does not require questions',()=>{
  const f=fixture({enabled:false});
  assert.equal(f.context.learningStorageKey(),'chronos-fall-progress-v1');
  f.context.startHadesRun();f.checkpoint({type:'gold'},2);
  assert.deepEqual(f.calls.starts.map(s=>s.index),[1,2]);assert.equal(f.messages.length,0);
  assert.equal(f.context.learningBoonRank(),1);
});

test('learning cannot start at a top-level URL without an authenticated parent',()=>{
  const f=fixture({iframe:false});f.context.startHadesRun();
  assert.equal(f.context.state.state,'blocked');assert.equal(f.calls.starts.length,0);assert.equal(f.context.learningStorageKey(),null);
  f.ready();assert.equal(f.calls.starts.length,0);
});

test('handshake validates parent window, exact origin, request and session before loading progress',()=>{
  const f=fixture();f.context.startHadesRun();
  const valid={type:'HADES_READY',requestId:f.context.state.helloId,sessionId:'session-one',available:true,profileKey:'student|math|P6',subject:'math'};
  f.receive(valid,{origin:'https://evil.example.test'});f.receive(valid,{from:{}});f.receive(valid,{from:f.window});
  f.receive({...valid,requestId:'old-request'});f.receive({...valid,sessionId:''});f.receive({...valid,sessionId:'x'.repeat(129)});
  for(const profileKey of ['',null,99,'x'.repeat(513)])f.receive({...valid,profileKey});
  assert.equal(f.calls.starts.length,0);assert.equal(f.calls.loads.length,0);assert.equal(f.context.learningStorageKey(),null);
  f.receive(valid);assert.equal(f.calls.starts.length,1);assert.equal(f.calls.loads.length,1);
  assert.equal(f.context.state.subject,'Math');assert.equal(f.context.gameState.ashes,10);assert.equal(f.context.gameState.bones,5);assert.equal(f.context.gameState.bestChamber,1);
  assert.deepEqual(plain(f.context.gameState.upgrades),{maxHp:0,magick:0,damage:0,defiance:1});
  f.receive(valid);assert.equal(f.calls.starts.length,1,'ready replay cannot reset or restart a run');
  assert.ok(f.messages.every(m=>m.origin==='https://learning.example.test'));
});

test('profile save namespaces separate account, subject and preview grade; reset cannot save to another profile',()=>{
  const f=fixture();f.context.startHadesRun();assert.equal(f.context.learningStorageKey(),null);
  const keys=[];
  for(const profileKey of ['alice|math|P6','alice|science|P6','alice|math|P4','bob|math|P6','alice/math?P6']){
    f.context.startHadesRun();f.ready({profileKey});keys.push(f.context.learningStorageKey());
  }
  assert.equal(new Set(keys).size,keys.length);assert.ok(keys.every(k=>k.startsWith('chronos-fall-learning-v1:')));
  assert.ok(!keys.some(k=>k.includes('/')));f.context.resetLearningSession();assert.equal(f.context.learningStorageKey(),null);
});

test('missing profile and handshake timeout stay paused; retry reuses the pending hello safely',()=>{
  const f=fixture();f.context.startHadesRun();const requestId=f.context.state.helloId;
  f.ready({available:false,reason:'Choose a school level'});assert.equal(f.context.state.state,'blocked');assert.equal(f.calls.starts.length,0);
  f.element('learning-retry').onclick();assert.equal(f.messages.at(-1).data.requestId,requestId);
  f.runTimers();assert.equal(f.context.state.state,'blocked');assert.equal(f.context.gameState.isPaused,true);
  f.element('learning-retry').onclick();f.ready();assert.equal(f.calls.starts.length,1);assert.equal(f.context.state.state,'ready');
});

test('availability requires an explicit boolean confirmation from the host',()=>{
  for(const available of [false,0,1,'false','true',null,[],{}]){
    const f=fixture();f.context.startHadesRun();f.ready({available});
    assert.equal(f.calls.starts.length,0);assert.equal(f.context.state.state,'blocked');
    f.ready({available:true});assert.equal(f.calls.starts.length,1);
  }
});

test('each gate waits for exactly five correctly signed answers and rejects malformed results',()=>{
  const f=fixture();f.connect();f.checkpoint();const good=f.result();
  const invalid=[{sessionId:'old'},{requestId:'old'},{round:0},{round:'1'},{total:4},{total:'5'},{correct:'5'},{correct:6},{correct:-1},{correct:4},{correct:2.1},{healPercent:100},{boonTier:'epic'},{type:'UNRELATED'}];
  f.receive(good,{origin:'https://evil.example.test'});f.receive(good,{from:{}});
  for(const patch of invalid)f.receive({...good,...patch});
  assert.equal(f.context.player.hp,40);assert.equal(f.calls.starts.length,1);assert.equal(f.calls.saves.length,0);assert.equal(f.context.state.round,0);
  assert.equal(f.context.gameState.isPaused,true);assert.ok(f.context.state.pending);
  f.receive(good);assert.equal(f.context.player.hp,80);assert.equal(f.calls.starts.length,2);assert.equal(f.context.state.round,1);assert.equal(f.context.state.pending,null);
  assert.equal(f.context.learningBoonRank(),8);assert.match(f.context.learningBoonLabel(),/Heroic/);
});

test('life is healed by actual maximum-life percentage, capped, rounded, and reported accurately',()=>{
  for(let correct=0;correct<=5;correct++){
    const f=fixture();f.connect();f.context.player.maxHp=137;f.context.player.hp=101;
    f.checkpoint();f.receive(f.result(correct));
    const healed=Math.min(36,Math.round(137*correct*.08));
    assert.equal(f.context.player.hp,101+healed);
    assert.match(f.context.gameState.particles.at(-1).text,new RegExp(`\\+${healed} LIFE`));
  }
  const full=fixture();full.connect();full.context.player.hp=100;full.checkpoint();full.receive(full.result());
  assert.equal(full.context.player.hp,100);assert.match(full.context.gameState.particles.at(-1).text,/\+0 LIFE/);
});

test('replayed results and reentrant callbacks cannot heal or enter a gate twice',()=>{
  const f=fixture();f.connect();f.checkpoint();const first=f.result(4);
  f.context.state.pending.enter=()=>{f.calls.starts.push({index:2});f.receive(first);};
  f.receive(first);f.receive(first);
  assert.equal(f.context.player.hp,72);assert.equal(f.calls.starts.length,2);assert.equal(f.calls.saves.length,1);
  f.checkpoint({type:'gold'},3);const second=f.result(2);
  f.receive(first);assert.equal(f.context.player.hp,72);assert.equal(f.context.state.pending.round,2);
  f.receive(second);assert.equal(f.context.player.hp,88);assert.equal(f.calls.starts.length,3);assert.equal(f.context.state.round,2);
});

test('blocked question rounds and repeated retries preserve the same gate and request',()=>{
  const f=fixture();f.connect();f.checkpoint({type:'gold'},2);const pending=f.context.state.pending;
  f.checkpoint({type:'god',godKey:'zeus'},99);assert.equal(f.context.state.pending,pending);
  f.receive({type:'HADES_ROUND_BLOCKED',sessionId:f.context.state.sessionId,requestId:pending.requestId,round:pending.round,message:'No suitable bank questions remain'});
  assert.equal(f.context.state.state,'blocked');assert.equal(f.context.player.hp,40);assert.equal(f.calls.starts.length,1);
  f.element('learning-retry').onclick();f.runTimers();f.element('learning-retry').onclick();
  const requests=f.messages.filter(m=>m.data.type==='HADES_ROUND_REQUEST');
  assert.equal(new Set(requests.map(m=>m.data.requestId)).size,1);assert.ok(requests.every(m=>m.data.round===1));
  assert.equal(f.context.state.pending,pending);assert.equal(f.context.player.hp,40);
  f.receive(f.result(3));assert.equal(f.calls.starts.at(-1).index,2);assert.equal(f.calls.god.length,0);
});

test('god and pom rewards open only after successful checkpoint completion',()=>{
  const f=fixture();f.connect();f.checkpoint({type:'god',godKey:'zeus'},2);
  assert.equal(f.calls.god.length,0);f.receive(f.result(4));assert.equal(f.calls.god.length,1);
  assert.equal(f.calls.god[0].god,'zeus');assert.equal(f.context.learningBoonRank(),5);assert.equal(f.calls.starts.length,1);
  f.calls.god[0].callback();assert.equal(f.calls.starts.at(-1).index,2);
  f.checkpoint({type:'pom'},3);assert.equal(f.calls.pom,0);f.receive(f.result(2));assert.equal(f.calls.pom,1);
  f.calls.pomCallback();assert.equal(f.calls.starts.at(-1).index,3);
});

test('profile invalidation and ending a run revoke pending rewards and resume only after a new handshake',()=>{
  const f=fixture();f.connect();f.checkpoint();const late=f.result();
  f.receive({type:'HADES_INVALIDATE',sessionId:'other'});assert.ok(f.context.state.pending);
  f.receive({type:'HADES_INVALIDATE',sessionId:'session-one'});
  assert.equal(f.context.state.pending,null);assert.equal(f.context.learningStorageKey(),null);assert.equal(f.context.state.state,'blocked');assert.equal(f.context.gameRuntime.started,false);
  f.receive(late);assert.equal(f.context.player.hp,40);assert.equal(f.calls.starts.length,1);
  f.element('learning-retry').onclick();assert.equal(f.context.state.state,'connecting');f.ready({sessionId:'session-two',profileKey:'bob|math|P4'});
  assert.equal(f.calls.starts.length,2);f.checkpoint();const next=f.result();f.element('learning-end').onclick();f.receive(next);
  assert.equal(f.context.player.hp,40);assert.equal(f.calls.starts.length,2);assert.equal(f.context.state.pending,null);
  assert.equal(f.timers.size,0,'cancel removes checkpoint callbacks');
  f.context.startHadesRun();f.ready({sessionId:'session-three'});f.checkpoint({type:'gold'},2);
  f.receive(next);assert.ok(f.context.state.pending,'cancelled round cannot satisfy a fresh session');
  f.receive(f.result(5));assert.equal(f.context.player.hp,80);assert.equal(f.calls.starts.length,4);
});

test('a result delivered while the tab is hidden enters the earned gate then pauses combat',()=>{
  const f=fixture();f.connect();f.checkpoint();f.context.document.hidden=true;f.receive(f.result());
  assert.equal(f.calls.starts.length,2);assert.deepEqual(f.calls.pauses,['away']);
});
