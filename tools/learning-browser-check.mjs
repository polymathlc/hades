import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {root, preparePage} from './browser-harness.mjs';
import {pathToFileURL} from 'node:url';

const fixture=`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><iframe id="game" title="Hades beta" style="width:100vw;height:100vh;border:0" src="/game.html?learning=1&subject=math"></iframe><script type="module">
import {installHadesLearningParent} from '/learning-parent.js';
window.identity='teacher:P6';window.records=[];window.shown=[];window.messages=[];window.bankSize=5;window.bankCounter=0;
addEventListener('message',e=>{if(e.source===document.getElementById('game').contentWindow)messages.push(e.data)});
window.bridge=installHadesLearningParent({subject:'Math',getFrame:()=>document.getElementById('game'),getIdentity:()=>identity,isAllowed:()=>true,isActive:()=>true,
getQuestions:()=>Array.from({length:bankSize},()=>({id:'bank-'+(++bankCounter),html:'<p>Which fraction is equal to one half?</p><table><tr><td>A</td><td>2 of 4 equal parts</td></tr></table>',options:['2/4','1/4','3/4','4/4'],answer:0,topic:'Fractions'})),
markShown:q=>shown.push(q.id),recordAnswer:r=>records.push({id:r.question.id,correct:r.correct})});window.ready=true;
</script></body></html>`;
const game=await fs.readFile(path.join(root,'index.html'));
const parent=await fs.readFile(path.join(root,'learning-parent.js'));
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 res.setHeader('Content-Type',pathname.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8');
 if(pathname==='/')res.end(fixture);else if(pathname==='/game.html')res.end(game);else if(pathname==='/learning-parent.js')res.end(parent);else{res.statusCode=404;res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const moduleName=process.env.PLAYWRIGHT_MODULE;
const {chromium}=await import(moduleName?pathToFileURL(moduleName).href:'playwright');
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_BROWSER_CHANNEL?{channel:process.env.PLAYWRIGHT_BROWSER_CHANNEL}:{})});
try {
 const {page,errors}=await preparePage(browser);await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.ready);
 const frame=page.frames().find(f=>f.url().includes('/game.html'));
 await frame.getByRole('button',{name:'Enter the underworld',exact:true}).click();
 await frame.waitForFunction(()=>gameRuntime.started&&hadesLearning.sessionId);
 assert.equal(await frame.evaluate(()=>hadesLearning.profileKey),'math:teacher:P6');
 const initial=await frame.evaluate(()=>{
  player.hp=20;gameState.enemies=[];onChamberCleared();
  gameState.equippedBoons=GODS.zeus.boons.filter(b=>!POM_UPGRADE_EFFECTS[b.id]).map(b=>({...b,level:1}));
  gameState.doors=[{x:player.x,y:player.y,radius:40,reward:{type:'god',godKey:'zeus'}}];
  const hp=player.hp,maxHp=player.maxHp;updateSimulation(1/60);return {hp,maxHp,chamber:gameState.chamber};
 });
 assert.equal(initial.hp,20,'embedded room clear cannot grant free healing');
 await page.locator('.hades-learning-overlay').waitFor();
 assert.equal(await frame.evaluate(()=>runtimeCanPlay()),false);
 assert.equal(await frame.evaluate(()=>gameState.chamber),1);
 assert.equal(await page.evaluate(()=>shown.length),5);
 for(let i=0;i<5;i++){
  await page.locator('.hades-learning-option').nth(0).click();
  assert.equal(await frame.evaluate(()=>gameState.chamber),1,'no advancement before claim');
  assert.equal(await frame.evaluate(()=>player.hp),20,'no early healing');
  await page.getByRole('button',{name:i===4?'Claim sanctuary reward':'Next question',exact:true}).click();
 }
 await frame.locator('#boon-modal').waitFor({state:'visible'});
 assert.equal(await frame.evaluate(()=>player.hp),Math.min(initial.maxHp,20+Math.round(initial.maxHp*.4)));
 assert.equal(await frame.evaluate(()=>hadesLearning.tier),'heroic');
 assert.match(await frame.locator('#boon-choices-container').innerText(),/Heroic/i);
 await frame.locator('#boon-choices-container button').first().click();
 await frame.waitForFunction(()=>gameState.chamber===2);
 const earned=await frame.evaluate(()=>gameState.equippedBoons.at(-1));
 assert.equal(earned.level,4);assert.equal(earned.tier,'heroic');
 assert.equal(await frame.evaluate(id=>boonPower(id),earned.id),2.2);
 assert.equal(await frame.evaluate(()=>runtimeCanPlay()),true,'parent quiz blur cannot strand the next chamber paused');
 assert.equal(await page.evaluate(()=>records.length),5);
 assert.equal(await page.evaluate(()=>messages.some(m=>JSON.stringify(m).includes('answer'))),false);
 console.log('PASS real iframe checkpoint: five grades, exact healing, Heroic damage and playable next chamber');

 // The next completed quiz replaces the tier. Zero answers right gives no heal
 // and only one real Pom level; missing banks/cancellation never advance.
 await frame.evaluate(()=>{gameState.enemies=[];player.hp=30;continueThroughHadesGate({type:'pom'},3)});
 await page.locator('.hades-learning-overlay').waitFor();
 for(let i=0;i<5;i++){
  await page.locator('.hades-learning-option').nth(1).click();
  await page.getByRole('button',{name:i===4?'Claim sanctuary reward':'Next question',exact:true}).click();
 }
 await frame.locator('#pom-modal').waitFor({state:'visible'});
 assert.equal(await frame.evaluate(()=>player.hp),30);
 assert.equal(await frame.evaluate(()=>hadesLearning.tier),'common');
 assert.match(await frame.locator('#pom-choices-container').innerText(),/Lv 4 ➔ Lv 5/i);
 await frame.locator('#pom-choices-container button').first().click();
 await frame.waitForFunction(()=>gameState.chamber===3);
 assert.equal(await page.evaluate(()=>new Set(shown).size),10);
 console.log('PASS zero-score checkpoint grants no life and the actual Common Pom upgrade');

 await frame.evaluate(()=>{gameState.enemies=[];continueThroughHadesGate({type:'gold'},4)});
 await page.locator('.hades-learning-overlay').waitFor();
 await page.getByRole('button',{name:'Return to game',exact:true}).click();
 await frame.waitForFunction(()=>hadesLearning.state==='blocked');
 assert.equal(await frame.evaluate(()=>gameState.chamber),3);
 await page.evaluate(()=>bankSize=4);await frame.locator('#learning-retry').click();
 await frame.waitForFunction(()=>hadesLearning.state==='blocked');
 assert.equal(await frame.evaluate(()=>hadesLearning.round),2);
 assert.equal(await page.locator('.hades-learning-overlay').count(),0);
 await page.evaluate(()=>bankSize=5);await frame.locator('#learning-retry').click();
 await page.locator('.hades-learning-overlay').waitFor();
 await page.evaluate(()=>{identity='teacher:P4';bridge.invalidate();});
 await frame.waitForFunction(()=>hadesLearning.sessionId===null&&hadesLearning.state==='blocked');
 assert.equal(await frame.evaluate(()=>gameState.chamber),3);
 assert.equal(await frame.evaluate(()=>gameRuntime.started),false);
 assert.equal(await page.locator('.hades-learning-overlay').count(),0);
 await frame.locator('#learning-retry').click();
 await frame.waitForFunction(()=>gameRuntime.started&&hadesLearning.profileKey==='math:teacher:P4');
 assert.equal(await frame.evaluate(()=>gameState.chamber),1);
 assert.equal(await frame.evaluate(()=>hadesLearning.round),0);
 console.log('PASS cancel, short bank and account changes never skip the checkpoint or reuse a reward');
 assert.deepEqual(errors,[]);
 await fs.mkdir(path.join(root,'test-results'),{recursive:true});
 await page.screenshot({path:path.join(root,'test-results','learning-iframe.png')});
 await page.close();
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
