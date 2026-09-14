import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {withBrowser} from './browser-harness.mjs';

await withBrowser(async ({browser, root}) => {
  const page=await browser.newPage({viewport:{width:1440,height:1060},deviceScaleFactor:1});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.setContent('<html><body style="margin:0;background:#08121f"><canvas id="gallery" width="1440" height="1060"></canvas></body></html>');
  const art=await fs.readFile(path.join(root,'src/attack-svg-art.js'),'utf8');
  const effects=await fs.readFile(path.join(root,'src/effects.js'),'utf8');
  await page.addScriptTag({content:`const gameRuntime={settings:{reducedMotion:false}}; const player={x:0,y:0,angle:0};const gameState={enemies:[],boonAreas:[]};function hasBoon(){return false;} function boonState(){return {time:0};}\n${art}\n${effects}`});
  const result=await page.evaluate(async () => {
    await attackSvgArt.ready;
    const parser=new DOMParser(), invalid=[], clipped=[], empty=[];
    const probe=document.createElement('canvas');probe.width=probe.height=256;
    const pctx=probe.getContext('2d',{willReadFrequently:true});
    for(const [key,svg] of Object.entries(attackSvgArt.sources)){
      if(parser.parseFromString(svg,'image/svg+xml').querySelector('parsererror'))invalid.push(key);
      pctx.clearRect(0,0,256,256);attackSvgArt.draw(pctx,key,128,128,240,240);
      const rgba=pctx.getImageData(0,0,256,256).data;let pixels=0,border=0;
      for(let y=0;y<256;y++)for(let x=0;x<256;x++)if(rgba[(y*256+x)*4+3]>5){pixels++;if(x<6||x>249||y<6||y>249)border++;}
      if(pixels<120)empty.push(key);if(border)clipped.push(key);
    }
    // Exercise the actual combat draw methods, including every left-click combo
    // and both persistent fields, rather than only rendering their source art.
    const liveEffects=[...Array.from({length:4},(_,i)=>new AnimatedAttackSweep(0,0,0,160,i)),new HitSpark(0,0,'#2ae6b4'),new AnimatedLightningStrike(0,0),new AnimatedFireExplosion(0,0),new AnimatedFireExplosion(0,0,100,'cast'),new AnimatedWaterWave(0,0,0),new Particle(0,0,0,0,'#2ae6b4',10,.3),new Shockwave(0,0,100,'#dc2626'),new LunarRayEffect(0,0,0,250),new FireTrail(0,0),new IceShardTrap(0,0),new CharmBurst(0,0)];
    const silentEffects=[];
    for(const effect of liveEffects){const count=attackSvgArt.metrics.draws;effect.draw(pctx);if(attackSvgArt.metrics.draws<=count)silentEffects.push(effect.constructor.name);}
    for(const type of attackSvgArt.projectileTypes){const count=attackSvgArt.metrics.draws;new Projectile(0,0,200,0,1,type,player).draw(pctx);if(attackSvgArt.metrics.draws<=count)silentEffects.push(type);}
    const before=attackSvgArt.metrics.decoded, canvas=document.getElementById('gallery'),ctx=canvas.getContext('2d');
    ctx.fillStyle='#08121f';ctx.fillRect(0,0,1440,1060);
    ctx.font='bold 31px Georgia';ctx.fillStyle='#e5eddf';ctx.fillText('THE UNDERWORLD · VECTOR COMBAT ATELIER',30,47);
    ctx.font='14px Arial';ctx.fillStyle='#90adbb';ctx.fillText('Authored SVG filigree, crystalline facets, branching lightning, flame curls and ritual inscriptions',30,74);
    const entries=[['Crescent strike','sweep-0-spirit'],['Reverse strike','sweep-1-storm'],['Piercing strike','sweep-2-fire'],['Finishing blade','sweep-3-sun'],['Cast · outer seal','cast-outer'],['Cast · inner seal','cast-inner'],['Cast detonation','cast-burst'],
      ['Returning moon sickle','moon_sickle'],['Venom dart','poison_dart'],['Glacial shard','frost_shard'],['Molten core','magma_ball'],['Acid globule','bouncing_acid'],['Doom skull','doom_skull'],['Clockwork bomb','clockwork_bomb'],
      ['Charm heart','charm_heart'],['Whirling blade','whirling_blade'],['Witch eye','witch_orb'],['Solar laser','laser_shard'],['Chronos shard','time_shard'],['Apollo spark','spark'],['Forged shrapnel','metal_shard'],
      ['Forked lightning','lightning-0'],['Lightning · second frame','lightning-2'],['Fire eruption','fire-bloom'],['Living flame','flame-1'],['Tidal crest','water-wave'],['Lunar ray','lunar-ray'],['Ice snare','ice-trap'],
      ['Charm bloom','charm-bloom'],['Tidal vortex','vortex'],['Blood ritual','blood-field'],['Impact sigil','shock-forge'],['Enemy ritual warning','enemy-circle'],['Enemy fan warning','enemy-fan'],['Enemy charge warning','enemy-rush']];
    for(let i=0;i<entries.length;i++){
      const x=22+(i%7)*202,y=96+Math.floor(i/7)*190;
      ctx.fillStyle='#101f30';ctx.fillRect(x,y,188,176);ctx.strokeStyle='#294052';ctx.strokeRect(x+.5,y+.5,188,176);
      const key=entries[i][1]; const width=key==='lunar-ray'||key==='enemy-rush'?165:138;
      const height=key==='lunar-ray'?45:key==='enemy-rush'?70:138;
      attackSvgArt.draw(ctx,key,x+94,y+77,width,height);
      ctx.font='12px Arial';ctx.fillStyle='#c3d6d6';ctx.textAlign='center';ctx.fillText(entries[i][0],x+94,y+164);ctx.textAlign='left';
    }
    // A sustained render workload must reuse textures instead of growing the
    // cache or changing simulation fields while drawing.
    const projectile=new Projectile(10,20,50,0,10,'moon_sickle',player);
    const snapshot=JSON.stringify(projectile,(_,v)=>v instanceof Set?[...v]:v);
    const started=performance.now();
    for(let frame=0;frame<120;frame++)for(let i=0;i<40;i++)projectile.draw(pctx);
    const renderMs=performance.now()-started;
    const afterSnapshot=JSON.stringify(projectile,(_,v)=>v instanceof Set?[...v]:v);
    return {invalid,empty,clipped,silentEffects,failures:attackSvgArt.failures,keys:Object.keys(attackSvgArt.sources).length,decoded:attackSvgArt.metrics.decoded,before,rasterBytes:attackSvgArt.metrics.rasterBytes,renderMs,unchanged:snapshot===afterSnapshot,projectiles:attackSvgArt.projectileTypes};
  });
  assert.deepEqual(errors,[]);assert.deepEqual(result.invalid,[]);assert.deepEqual(result.empty,[]);assert.deepEqual(result.clipped,[]);assert.deepEqual(result.failures,[]);
  assert.deepEqual(result.silentEffects,[]);
  assert.equal(result.decoded,result.keys);assert.equal(result.before,result.decoded);assert.equal(result.unchanged,true);
  assert.ok(result.rasterBytes<24*1024*1024,'bounded SVG texture memory');
  const producers=(await Promise.all(['player.js','enemies.js','boon-effects.js'].map(f=>fs.readFile(path.join(root,'src',f),'utf8')))).join('\n');
  const literalTypes=[...producers.matchAll(/new Projectile\([^\n]*?,\s*'([a-z_]+)',\s*(?:this|player)\)/g)].map(m=>m[1]);
  for(const type of literalTypes)assert.ok(result.projectiles.includes(type),'uncovered projectile '+type);
  assert.doesNotMatch(art,/<filter|<fe[A-Z]|<image |<foreignObject|https?:\/\/(?!www\.w3\.org)/);
  const qaDir=path.resolve(root,'test-results');
  await fs.mkdir(qaDir,{recursive:true});
  await page.locator('#gallery').screenshot({path:path.join(qaDir,'svg-combat-gallery.png')});
  console.log(JSON.stringify(result,null,2));await page.close();
});
