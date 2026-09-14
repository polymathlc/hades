    // Authored vector combat art. SVGs are decoded and raster-cached once before
    // play; animation only transforms cached layers. No filters, random paths,
    // image allocation, or SVG parsing is performed in an animation frame.
    const attackSvgArt = (() => {
      const sources = Object.create(null), cache = Object.create(null), catalog = [];
      const palettes = {
        spirit: ['#75e4bb', '#d9fff0', '#246a74'], storm: ['#71bfff', '#f3ffff', '#4250a5'],
        fire: ['#ff8c3d', '#fff1b8', '#b92e4c'], tide: ['#47c8e6', '#e1ffff', '#285cb7'],
        sun: ['#f5c458', '#fff8da', '#aa5b37'], frost: ['#8fd9ed', '#ffffff', '#507bb6'],
        blood: ['#e65c79', '#ffcdbe', '#722c5e'], heart: ['#ef88c0', '#ffe4eb', '#95569a'],
        forge: ['#eca663', '#fff5cd', '#93617f'], moon: ['#b39eef', '#f7edff', '#6652aa']
      };
      const point = (r, a) => `${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`;
      const repeat = (count, fn) => Array.from({length: count}, (_, i) => fn(i)).join('');
      function defs(p) {
        return `<defs><linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${p[2]}"/><stop offset=".32" stop-color="${p[0]}"/><stop offset=".52" stop-color="${p[1]}"/><stop offset=".69" stop-color="${p[0]}"/><stop offset="1" stop-color="${p[2]}"/></linearGradient><radialGradient id="halo"><stop stop-color="${p[0]}" stop-opacity=".28"/><stop offset=".68" stop-color="${p[0]}" stop-opacity=".12"/><stop offset="1" stop-color="${p[0]}" stop-opacity="0"/></radialGradient><linearGradient id="flame" x1="0" y1="1" x2="0" y2="0"><stop stop-color="${p[2]}"/><stop offset=".45" stop-color="${p[0]}"/><stop offset="1" stop-color="${p[1]}"/></linearGradient></defs>`;
      }
      function register(key, body, theme = 'spirit', pixels = 192, viewBox = '-100 -100 200 200') {
        const p = palettes[theme];
        const bounds = viewBox.split(' ').map(Number), pixelHeight = Math.round(pixels * bounds[3] / bounds[2]);
        sources[key] = `<svg xmlns="http://www.w3.org/2000/svg" width="${pixels}" height="${pixelHeight}" viewBox="${viewBox}">${defs(p)}<g stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
        catalog.push(Object.freeze({key, theme, pixels, pixelHeight}));
      }
      function runes(radius, count, color, rotate = 0) {
        return repeat(count, i => `<g transform="rotate(${rotate + i * 360 / count}) translate(0 ${-radius})" fill="none" stroke="${color}" stroke-width="1.25"><path d="M-3 4V-4L3 0L-3 4M0-3V3"/><circle cy="-7" r=".8" fill="${color}"/></g>`);
      }
      function seal(p, radius = 86) {
        return `<circle r="${radius + 11}" fill="url(#halo)"/><circle r="${radius}" fill="none" stroke="${p[0]}" stroke-width="1.7"/><circle r="${radius-5}" fill="none" stroke="${p[1]}" stroke-width=".65"/>${runes(radius-13, 16, p[0])}<circle r="${radius-24}" fill="none" stroke="${p[0]}" stroke-width=".65" stroke-dasharray="2 5"/>`;
      }
      function star(p, radius = 80, points = 8) {
        return `<path d="M${repeat(points*2, i => `${i ? 'L' : ''}${point(i%2 ? radius*.25 : radius, i*Math.PI/points)}`)}Z" fill="url(#metal)" stroke="${p[1]}" stroke-width="1"/>`;
      }
      function flameTongue(p, shift = 0) {
        return `<path d="M-31 61C-70 27-45-4-25-31C-30-9-8-9-9-28C-16-51 7-63 ${shift+13}-91C${shift+37}-57 13-33 29-17C37-9 45-28 43-37C77 11 69 45 31 65C9 76-11 76-31 61Z" fill="url(#flame)" stroke="${p[0]}" stroke-width="1.3"/><path d="M-11 53C-34 23-4 1-5-19C17-4 1 17 18 20C28 20 26 7 26 3C44 30 27 58 9 60Z" fill="${p[1]}" opacity=".85"/><path d="M-37 30C-41 11-31-2-28-13M28 47C44 37 48 23 44 13M9-49Q4-32 9-18" fill="none" stroke="${p[1]}" stroke-width="2" opacity=".75"/>`;
      }
      // Four distinct left-click silhouettes: crescent, reverse crescent,
      // piercing spear, and a full circular finishing blade. Edge radius is the
      // gameplay range; fine ornament stays inside that edge.
      for (const [theme, p] of Object.entries(palettes)) {
        const slash = `<path d="M12-87C79-81 99-32 96 0C97 43 69 75 12 87C63 58 76 27 74 0C76-29 51-66 12-87Z" fill="url(#metal)" stroke="${p[1]}" stroke-width="1.2"/><path d="M7-76C55-61 81-24 78 0C79 32 54 60 7 76M17-63C54-48 68-17 64 8C61 27 48 45 28 55" fill="none" stroke="${p[0]}" stroke-width="1.5"/><path d="M28-72Q78-41 87-3M87 8Q78 47 30 71" fill="none" stroke="${p[1]}" stroke-width=".65"/>${repeat(11,i=>`<path transform="rotate(${-72+i*14.4})" d="M82-3L88 0L82 3M78 0H80" fill="none" stroke="${p[2]}" stroke-width="1.3"/>`)}<path d="M0 0L12-87Q74-55 74 0Q76 53 12 87Z" fill="${p[0]}" opacity=".045"/>`;
        register(`sweep-0-${theme}`, slash, theme);
        register(`sweep-1-${theme}`, `<g transform="scale(1 -1)">${slash}</g>`, theme);
        register(`sweep-2-${theme}`, `<path d="M-9-5L57-13L97 0L57 13L-9 5L21 0Z" fill="url(#metal)" stroke="${p[1]}" stroke-width="1.2"/><path d="M-4 0H87M23-7L34 0L23 7M40-8L52 0L40 8M60-9L75 0L60 9" fill="none" stroke="${p[2]}" stroke-width="1.2"/><path d="M-13-12Q24-23 58-18M-13 12Q24 23 58 18" fill="none" stroke="${p[0]}" stroke-width="1.5"/><path d="M-10-3L-30-8M-10 3L-30 8" stroke="${p[1]}" stroke-width="1"/>`, theme);
        register(`sweep-3-${theme}`, `<circle r="83" fill="none" stroke="${p[0]}" stroke-width="1"/>${repeat(8,i=>`<g transform="rotate(${i*45})"><path d="M0-95C28-94 49-76 56-64C28-81 13-79 0-79Z" fill="url(#metal)" stroke="${p[1]}" stroke-width=".8"/><path d="M0-89L9-85L4-82M15-85L22-81" fill="none" stroke="${p[2]}" stroke-width="1.2"/></g>`)}${runes(68, 12,p[0])}<circle r="56" fill="none" stroke="${p[0]}" stroke-width=".8" stroke-dasharray="3 8"/>`, theme);
        register(`shock-${theme}`, seal(p)+repeat(12,i=>`<path transform="rotate(${i*30})" d="M0-94L4-88L0-84L-4-88ZM0-62V-51M-3-58L0-54L3-58" fill="none" stroke="${p[1]}" stroke-width="1"/>`), theme, 192);
        register(`spark-${theme}`, star(p)+repeat(6,i=>`<path transform="rotate(${i*60+15})" d="M0-48L2-68L0-79L-2-68Z" fill="${p[0]}"/>`), theme, 64);
        register(`mote-${theme}`, `<path d="M0-84L15-18L74 0L15 18L0 84L-15 18L-74 0L-15-18Z" fill="url(#metal)"/><path d="M0-30L6 0L0 30L-6 0Z" fill="${p[1]}"/>`, theme, 48);
      }
      const moon = palettes.moon, fire = palettes.fire, frost = palettes.frost, tide = palettes.tide;
      register('moon_sickle', `<circle r="88" fill="url(#halo)"/><path d="M-18-79C58-85 90-17 52 42C29 79-23 87-62 52C-23 63 14 43 21 13C30-24 12-56-18-79Z" fill="url(#metal)" stroke="${moon[1]}" stroke-width="2"/><path d="M-8-65C42-60 61-19 41 17C27 43 4 57-25 60M-3-50C24-42 41-23 37 0" fill="none" stroke="${moon[2]}" stroke-width="3"/><path d="M-18-79C40-77 79-25 52 25" fill="none" stroke="#fff" stroke-width="1.2"/>${runes(65,9,moon[2],15)}<path d="M-28 4L-7-17L11 3L-10 24Z" fill="#102b3a" stroke="${moon[0]}" stroke-width="2"/><path d="M-10-8L0 3L-10 14L-20 3Z" fill="${moon[1]}"/><circle cx="-10" cy="3" r="5" fill="${moon[2]}"/>`, 'moon', 128);
      register('poison_dart', `<path d="M-85-8L-28-19L-39-36L7-19L87 0L7 19L-39 36L-28 19L-85 8L-64 0Z" fill="url(#metal)" stroke="#e5ffd1" stroke-width="1.5"/><path d="M-64 0H67M-11-12L14 0L-11 12M-44-10L-22 0L-44 10" fill="none" stroke="#1f5f46" stroke-width="2"/><path d="M31-6L44 0L31 6" fill="none" stroke="#f5ffd7" stroke-width="1"/>`, 'spirit', 96);
      register('frost_shard', `<path d="M-85 0L-24-28L37-22L89 0L37 22L-24 28Z" fill="url(#metal)" stroke="${frost[1]}" stroke-width="1.5"/><path d="M-85 0L-10-13L37-22L21 0L37 22L-10 13ZM-10-13L21 0L-10 13M21 0H89" fill="none" stroke="${frost[2]}" stroke-width="1.3"/><path d="M-21-16L5-33L-8-12M-21 16L5 33L-8 12" fill="${frost[0]}" stroke="${frost[1]}"/>`, 'frost', 96);
      register('metal_shard', `<path d="M-76-11L-31-34L0-22L84 0L0 22L-31 34L-76 11L-56 0Z" fill="url(#metal)" stroke="#fff0d6" stroke-width="2"/><path d="M-62 0L-29-16L-4 0L-29 16ZM-4 0H70M-21-22L5-12M-21 22L5 12" fill="none" stroke="#65565c" stroke-width="2"/><path d="M15-8L33 0L15 8" fill="none" stroke="#fff7dd"/>`, 'forge', 96);
      register('laser_shard', `<path d="M-96 0L-29-12L40-20L94 0L40 20L-29 12Z" fill="url(#metal)" stroke="#fff5cd" stroke-width="1.6"/><path d="M-67 0H84M8-11L25 0L8 11M40-12L55 0L40 12" fill="none" stroke="#ad6031" stroke-width="1.5"/>${repeat(3,i=>`<path d="M${-50+i*18}-20L${-40+i*18} 0L${-50+i*18} 20" stroke="#f9e5a5" stroke-width="1" fill="none" opacity=".55"/>`)}`, 'sun', 96);
      register('time_shard', `<path d="M-66-24L28-32L80 0L28 32L-66 24L-41 0Z" fill="url(#metal)" stroke="#ffeec0" stroke-width="1.5"/><path d="M-20-22H22L-3 0L22 22H-20L5 0Z" fill="#805b6e" stroke="#fff0bd" stroke-width="1.3"/><path d="M-12-15L3-4L14-15M-12 15L3 4L14 15" fill="#f9d384"/><path d="M34-22L56 0L34 22M-50-16L-32 0L-50 16" fill="none" stroke="#ffe9b0" stroke-width="1.5"/>`, 'sun', 96);
      register('whirling_blade', `${repeat(4,i=>`<g transform="rotate(${i*90})"><path d="M-12-16C-32-53-13-78 12-88C0-58 27-43 25-10Z" fill="url(#metal)" stroke="#ffefce" stroke-width="1.5"/><path d="M-7-26Q-11-53 6-70M1-25L6-44" fill="none" stroke="#79687b" stroke-width="2"/></g>`)}<circle r="22" fill="#384259" stroke="#fff4cf" stroke-width="3"/><path d="M0-15L15 0L0 15L-15 0Z" fill="url(#metal)"/><circle r="5" fill="#fff4cf"/>`, 'forge', 96);
      register('magma_ball', `<g transform="rotate(-90) scale(.85)">${flameTongue(fire)}</g><path d="M-33-23Q-66-31-87-15M-44 0L-97 0M-33 23Q-66 31-87 15" fill="none" stroke="${fire[0]}" stroke-width="2"/><circle r="22" fill="#7e283e" stroke="#ffc06e" stroke-width="2"/><path d="M-16-16L-1-6L-7 7L6 18M0-20L5-5L21 2M-21 1L-7 7L-14 19" fill="none" stroke="#ffe3a2" stroke-width="2.4"/>`, 'fire', 96);
      register('bouncing_acid', `<circle r="72" fill="url(#halo)"/><path d="M-62-8C-73-52-22-69-4-55C16-79 72-43 59-10C78 33 20 68-5 53C-51 78-81 28-62-8Z" fill="url(#metal)" stroke="#dffff2" stroke-width="2"/><path d="M-47-28Q-14-52 12-30Q37-58 49-16M-41 31Q-16 48 2 29Q31 46 49 21" fill="none" stroke="#276557" stroke-width="3"/><circle cx="-19" cy="-7" r="15" fill="#205353" stroke="#cfffca"/><circle cx="20" cy="17" r="10" fill="#205353" stroke="#cfffca"/><circle cx="24" cy="-18" r="5" fill="#efffde"/><circle cx="-14" cy="-12" r="4" fill="#efffde"/>`, 'spirit', 96);
      register('doom_skull', `<path d="M-45 24C-79-15-56-72 0-73C56-72 79-15 45 24L32 36L31 61L-31 61L-32 36Z" fill="url(#metal)" stroke="#ffdfec" stroke-width="2"/><path d="M-52-21L-13-12L-19 9L-43 12ZM52-21L13-12L19 9L43 12ZM0 3L-9 25H9Z" fill="#3b2559"/><path d="M-24 39V58M-8 40V59M8 40V59M24 39V58M-13-55L0-42L13-55M0-42V-26" fill="none" stroke="#66346d" stroke-width="3"/><path d="M-33-8L-21-5M33-8L21-5" stroke="#fff0c2" stroke-width="3"/>${repeat(4,i=>`<path transform="rotate(${i*90+45})" d="M0-81L3-90L0-95L-3-90Z" fill="#d49dde"/>`)}`, 'moon', 96);
      register('clockwork_bomb', `<circle r="77" fill="#674756" stroke="#f9dc9e" stroke-width="3"/>${repeat(12,i=>`<path transform="rotate(${i*30})" d="M-8-70V-83L-4-88H4L8-83V-70" fill="url(#metal)" stroke="#ffeabe" stroke-width="1"/>`)}<circle r="60" fill="url(#metal)" stroke="#8b674f" stroke-width="3"/><circle r="45" fill="#493d53" stroke="#f0c885" stroke-width="2"/>${repeat(12,i=>`<path transform="rotate(${i*30})" d="M0-38V-31" stroke="#f6dea9" stroke-width="2"/>`)}<path d="M0-29V0L21 14" fill="none" stroke="#fff4c9" stroke-width="4"/><circle r="7" fill="#eb9e69"/><path d="M-30 62Q0 46 30 62" fill="none" stroke="#fff1c6" stroke-width="2"/>`, 'sun', 96);
      register('charm_heart', `<path d="M0 63C-18 38-65 8-65-24C-64-60-24-68 0-37C24-68 64-60 65-24C65 8 18 38 0 63Z" fill="url(#metal)" stroke="#ffe6f1" stroke-width="2"/><path d="M-43-25Q-48-43-30-43M0-19C-12-40-43-22-28-3L0 28L28-3C43-22 12-40 0-19Z" fill="none" stroke="#fbd7e9" stroke-width="2"/><path d="M-57 22Q-82 16-86 0M57 22Q82 16 86 0M-46 38Q-64 42-77 32M46 38Q64 42 77 32" fill="none" stroke="#eb8bc1" stroke-width="2"/>`, 'heart', 96);
      register('witch_orb', `<circle r="76" fill="url(#halo)"/>${seal(moon,64)}<path d="M0-50L43 25H-43ZM0 50L43-25H-43Z" fill="none" stroke="#d3b5f2" stroke-width="1.4"/><circle r="26" fill="url(#metal)" stroke="#f4e3ff" stroke-width="2"/><path d="M-20 0Q0-24 20 0Q0 24-20 0Z" fill="#372759" stroke="#f4d4ff"/><path d="M0-12L5 0L0 12L-5 0Z" fill="#fff6dd"/>`, 'moon', 96);
      register('spark', `${star(palettes.sun,78,12)}<circle r="24" fill="#8d5b62" stroke="#fff5ce" stroke-width="2"/><circle r="15" fill="url(#metal)"/><path d="M0-9V9M-9 0H9" stroke="#fffbea" stroke-width="2"/>`, 'sun', 96);
      register('comet-tail', `<path d="M73 0Q2-44-97-12Q-50-8-24 0Q-53 8-97 12Q2 44 73 0Z" fill="url(#metal)" opacity=".5"/><path d="M58 0Q-15-21-75-8M58 0Q-15 21-75 8" fill="none" stroke="#efffed" stroke-width="1.5"/><path d="M24 0H-55" stroke="#efffed" stroke-width="1.5"/>`, 'spirit', 128);
      register('enemy-tail', `<path d="M73 0Q2-44-97-12Q-50-8-24 0Q-53 8-97 12Q2 44 73 0Z" fill="url(#metal)" opacity=".5"/><path d="M58 0Q-15-21-75-8M58 0Q-15 21-75 8" fill="none" stroke="#ffe9bd" stroke-width="1.5"/>`, 'blood', 128);
      for (let frame = 0; frame < 4; frame++) {
        const p=palettes.storm, bend=[0,8,-7,4][frame];
        const path=`M${12+bend}-95L${-8+bend}-61L18-65L-17-21L9-28L-8 13L12 7L0 78`;
        const branch=`M${-8+bend}-61L-43-50L-27-39L-63-9M-17-21L-43 3L-27 7L-51 32M-8 13L35 18L23 33L51 47M18-65L50-55L36-35L58-28`;
        register(`lightning-${frame}`, `<path d="${path}" fill="none" stroke="${p[0]}" stroke-width="17" opacity=".13"/><path d="${branch}" fill="none" stroke="${p[0]}" stroke-width="3"/><path d="${branch}" fill="none" stroke="#e9ffff" stroke-width=".9"/><path d="${path}" fill="none" stroke="${p[0]}" stroke-width="6"/><path d="${path}" fill="none" stroke="#fff" stroke-width="2"/><g transform="translate(0 78) scale(.25 .12)">${seal(p)}</g>${repeat(7,i=>`<path transform="translate(${(i%2?1:-1)*(18+i*4)} ${-70+i*21})" d="M0-4L2 0L0 4L-2 0Z" fill="#fff"/>`)}`, 'storm', 256);
        register(`flame-${frame}`, flameTongue(fire,[-7,4,12,-1][frame])+`<path d="M-52-34L-57-41M46-54L49-62M-25-64L-23-72M57-11L63-18" stroke="#ffd294" stroke-width="2"/>`, 'fire', 192);
      }
      register('fire-bloom', `<circle r="88" fill="url(#halo)"/>${repeat(10,i=>`<g transform="rotate(${i*36})"><path d="M-13-23C-37-40-11-54-15-82C8-63 3-53 13-43C18-53 16-61 21-65C41-38 25-26 12-17Z" fill="url(#flame)" stroke="#ffb568" stroke-width="1"/><path d="M-3-31Q-12-47-8-60Q7-48 3-32" fill="#ffecc0" opacity=".85"/></g>`)}<circle r="24" fill="#fff0b6"/><path d="M-16 0H16M0-16V16" stroke="#fffbea" stroke-width="2"/>`, 'fire', 256);
      register('water-wave', `<path d="M-38-83C47-85 93-45 84 1C99 38 51 84-38 83C17 60 43 35 43 0C46-33 18-62-38-83Z" fill="url(#metal)" opacity=".83" stroke="#d9fcff" stroke-width="1.4"/><path d="M-22-69C39-62 70-27 61 3C67 34 37 62-22 69M-4-50C23-48 42-28 41-5M-2 51C22 45 38 30 37 15" fill="none" stroke="#edffff" stroke-width="2"/><path d="M31-60C47-66 66-46 54-40C44-38 40-46 46-48M64-20C79-22 89-5 76 1C65 5 64-5 70-8M48 38C66 37 66 61 48 61C36 60 39 50 47 50" fill="none" stroke="#f4ffff" stroke-width="2"/>${repeat(7,i=>`<circle cx="${30+Math.sin(i*2)*43}" cy="${-72+i*23}" r="${1+i%3}" fill="#e7ffff"/>`)}`, 'tide', 192);
      // The cast is an inscription on the arena floor, not a flying spell.
      // The outside stroke ends exactly at 96 SVG units: drawSvgCast maps that
      // boundary to the real cast radius. All ornaments remain inside it.
      const castGlyphs = [
        'M-2.5 3V-3L2.5 0L-2.5 3M0-2V2',
        'M-2.5-3L0 3L2.5-3M-2-1H2M0-3V3',
        'M-2.5 3V-3H2.5M-2.5 0H1.5M.5-3V3',
        'M0-3V3M-2.5-1L0 1L2.5-1M-2.5-3H2.5',
        'M-2.5 2L0-3L2.5 2ZM-2.5 0H2.5M0 2V3.5',
        'M-2.5-2L0 0L-2.5 2M2.5-2L0 0L2.5 2M0-3V3'
      ];
      const castRunes = (radius, count, color, offset = 0) => repeat(count, i =>
        `<g transform="rotate(${offset+i*360/count}) translate(0 ${-radius})" fill="none" stroke="${color}" stroke-width=".85"><path d="${castGlyphs[i%castGlyphs.length]}"/><circle cx="4.4" r=".48" fill="${color}" stroke="none"/></g>`);
      const castGeometry = `<path d="M0-69.5L60.19 34.75H-60.19ZM0 69.5L60.19-34.75H-60.19Z" fill="none" stroke="#bfa7f1" stroke-width=".82"/><path d="M0-64L55.43 32H-55.43ZM0 64L55.43-32H-55.43Z" fill="none" stroke="#8b78bc" stroke-width=".48"/><circle r="40" fill="none" stroke="#d9c4ff" stroke-width=".85"/><circle r="36.7" fill="none" stroke="#ad94db" stroke-width=".55"/><path d="M0-32L32 0L0 32L-32 0ZM-22.63-22.63H22.63V22.63H-22.63Z" fill="none" stroke="#d5bef8" stroke-width=".85"/>${repeat(4,i=>`<g transform="rotate(${i*90})" fill="none" stroke="#f5e5c4" stroke-width=".85"><path d="M0-32V-21M-3-26L0-23L3-26"/><circle cy="-35" r="1.3"/></g>`)}<circle r="18" fill="none" stroke="#ccb2ef" stroke-width=".65"/><path d="M0-14L12.12 7H-12.12ZM0 14L12.12-7H-12.12Z" fill="none" stroke="#fff0d1" stroke-width="1.1"/><circle r="4.2" fill="none" stroke="#efd9ff" stroke-width=".85"/><path d="M0-2V2M-2 0H2" fill="none" stroke="#fff4da" stroke-width=".65"/>`;
      register('cast-outer', `<circle r="95" fill="#6550a6" opacity=".065"/><circle r="95.4" fill="none" stroke="#e8d5ff" stroke-width="1.2"/><circle r="91.6" fill="none" stroke="#ad92d9" stroke-width=".65"/><circle r="82.3" fill="none" stroke="#c1a6f0" stroke-width=".8"/><circle r="79.5" fill="none" stroke="#806aa6" stroke-width=".5"/>${repeat(72,i=>`<path transform="rotate(${i*5})" d="M0-92.8V-${i%3===0?94.5:93.8}" fill="none" stroke="#ddc6fb" stroke-width="${i%3===0?.7:.45}"/>`)}${repeat(4,i=>`<g transform="rotate(${i*90})" fill="none"><path d="M0-95L4-90V-83L0-78L-4-83V-90Z" fill="#211d39" stroke="#f3dfbc" stroke-width=".95"/><path d="M0-91V-82M-2-87H2M0-78V-71M-3-74L0-71L3-74" stroke="#efdbff" stroke-width=".75"/><circle cy="-68.5" r="2.5" stroke="#efdabd" stroke-width=".85"/></g>`)}${repeat(4,i=>`<g transform="rotate(${45+i*90})" fill="none" stroke="#ba9ce7" stroke-width=".7"><path d="M0-79V-73M-3-76L0-73L3-76"/><circle cy="-69.5" r="1.35"/></g>`)}${castGeometry}`, 'moon', 384);
      // A single cached inscription band is reused at two radii. Only these
      // internal bands turn; the cardinal markers and center stay grounded.
      register('cast-inner', `<circle r="89.8" fill="none" stroke="#c4abe8" stroke-width=".5"/><circle r="83.1" fill="none" stroke="#f0dfff" stroke-width=".45"/>${castRunes(86.5,36,'#eee0ff',5)}${repeat(12,i=>`<path transform="rotate(${i*30})" d="M-1.5-80.4H1.5" fill="none" stroke="#d8bfef" stroke-width=".55"/>`)}`, 'moon', 384);
      // Detonation stays a circular ground ripple; no spikes, blades or orb.
      register('cast-burst', `<circle r="94" fill="#a183dd" opacity=".055"/><circle r="95.1" fill="none" stroke="#f4e3ff" stroke-width="1.6"/><circle r="90.8" fill="none" stroke="#bfa0ee" stroke-width=".75"/><circle r="78.5" fill="none" stroke="#d9bef5" stroke-width=".75"/>${castRunes(85,30,'#e9d1ff',6)}<circle r="73.8" fill="none" stroke="#f7e5ff" stroke-width="1.25"/><circle r="54" fill="none" stroke="#dbc0f2" stroke-width=".8"/><circle r="48" fill="none" stroke="#b196dc" stroke-width=".55"/>${castGeometry}`, 'moon', 384);
      register('lunar-ray', `<path d="M0-12C70-25 160-25 298 0C160 25 70 25 0 12Z" fill="url(#metal)" opacity=".65"/><path d="M2-8Q138-8 295 0Q138 8 2 8Z" fill="#fdf1ff"/><path d="M2-16Q115-33 258-6M2 16Q115 33 258 6" fill="none" stroke="#bba5ec" stroke-width="1.6"/>${repeat(10,i=>`<path transform="translate(${20+i*26} 0)" d="M-3-9L3 0L-3 9M-1-17L5-12M-1 17L5 12" fill="none" stroke="#6950a5" stroke-width="1"/>`)}`, 'moon', 384, '0 -40 300 80');
      register('ice-trap', `<ellipse cy="52" rx="77" ry="26" fill="url(#halo)" stroke="#77c5dd" stroke-width="1.3"/>${repeat(5,i=>{const x=(i-2)*27, top=[-13,-44,-85,-52,-21][i];return `<path d="M${x-14} 47L${x-8} ${top}L${x+6} ${top-10}L${x+16} 42L${x} 56Z" fill="url(#metal)" stroke="#eaffff" stroke-width="1.3"/><path d="M${x+6} ${top-10}L${x} 56M${x-8} ${top}L${x+4} ${top+12}L${x+16} 42" fill="none" stroke="#6699c3" stroke-width="1"/>`;})}<path d="M-56 60L-21 67L3 61L29 68L61 57" fill="none" stroke="#c3f4ff"/>`, 'frost', 192);
      register('charm-bloom', `${seal(palettes.heart)}${repeat(8,i=>`<g transform="rotate(${i*45}) translate(0 -43) scale(.34)"><path d="M0 38C-65-7-20-59 0-22C20-59 65-7 0 38Z" fill="url(#metal)" stroke="#ffe0f0" stroke-width="3"/><path d="M-14-14Q-23-19-28-7" stroke="#fff5f9" stroke-width="2" fill="none"/></g>`)}<path d="M0-17C-25-40-48-10 0 28C48-10 25-40 0-17Z" fill="url(#metal)" stroke="#ffe3ef" stroke-width="1"/>`, 'heart', 256);
      register('vortex', `${repeat(5,i=>`<path transform="rotate(${i*72})" d="M-14-18C-79-21-91 49-55 72C-73 12-17 8-14 35C10 10 2-10-14-18Z" fill="url(#metal)" opacity=".65" stroke="#d9ffff" stroke-width="1"/>`)}<circle r="17" fill="#143958" stroke="#9ee8f3" stroke-width="2"/>`, 'tide', 256);
      register('blood-field', `${seal(palettes.blood)}${repeat(6,i=>`<path transform="rotate(${i*60})" d="M0-64C-23-30-20-18 0-15C20-18 23-30 0-64Z" fill="url(#metal)" opacity=".7" stroke="#ffc4c6"/>`)}<path d="M0-21L21 0L0 21L-21 0Z" fill="#742f51" stroke="#f5b0b5"/>`, 'blood', 256);
      register('enemy-circle', `${seal(palettes.blood,91)}${repeat(12,i=>`<path transform="rotate(${i*30})" d="M0-94L5-85L0-79L-5-85Z" fill="#ffa298"/>`)}<circle r="91" fill="#ff745f" opacity=".045"/>`, 'blood', 256);
      register('enemy-fan', `<path d="M0 0L60-77A98 98 0 0 1 60 77Z" fill="#fa7f66" opacity=".075"/><path d="M0 0L60-77A98 98 0 0 1 60 77Z" fill="none" stroke="#ffb099" stroke-width="1.2"/><path d="M53-69A87 87 0 0 1 53 69" fill="none" stroke="#ffd4a8" stroke-width="1" stroke-dasharray="4 5"/>${repeat(7,i=>`<path transform="rotate(${-45+i*15})" d="M77-3L84 0L77 3M10 0H18" fill="none" stroke="#fff0c1" stroke-width="1.2"/>`)}`, 'blood', 256);
      register('enemy-rush', `<path d="M0-28H90L99 0L90 28H0Z" fill="#fa7f66" opacity=".08"/><path d="M0-28H90L99 0L90 28H0" fill="none" stroke="#ffb099" stroke-width="1"/>${repeat(7,i=>`<path transform="translate(${10+i*12} 0)" d="M-3-12L3 0L-3 12" fill="none" stroke="#ffcfab" stroke-width="1.1"/>`)}<path d="M0-23H87M0 23H87" stroke="#ffe8bd" stroke-width=".65" stroke-dasharray="2 5"/>`, 'blood', 256, '0 -32 100 64');
      const projectileTypes = Object.freeze(['moon_sickle','poison_dart','frost_shard','magma_ball','bouncing_acid','doom_skull','clockwork_bomb','charm_heart','whirling_blade','witch_orb','laser_shard','time_shard','spark','metal_shard']);
      const failures = [], metrics = {draws: 0, decoded: 0, rasterBytes: 0};
      const ready = Promise.all(catalog.map(record => new Promise(resolve => {
        const image = new Image();
        image.onload = () => {
          try {
            const layer = document.createElement('canvas'); layer.width = record.pixels; layer.height = record.pixelHeight;
            layer.getContext('2d').drawImage(image, 0, 0, record.pixels, record.pixelHeight);
            cache[record.key] = layer; metrics.decoded++; metrics.rasterBytes += record.pixels * record.pixelHeight * 4;
          } catch (_) { failures.push(record.key); }
          resolve();
        };
        image.onerror = () => { failures.push(record.key); resolve(); };
        image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sources[record.key]);
      })));
      function draw(ctx, key, x, y, width, height = width, angle = 0, alpha = 1) {
        const layer = cache[key];
        if (!layer || !(width > 0) || !(height > 0) || !(alpha > 0)) return false;
        ctx.save(); ctx.translate(x, y); if (angle) ctx.rotate(angle);
        ctx.globalAlpha *= Math.min(1, alpha); ctx.drawImage(layer, -width/2, -height/2, width, height); ctx.restore();
        metrics.draws++; return true;
      }
      function themeForColor(color) {
        const mapping = {'#2ae6b4':'spirit','#98ffe2':'spirit','#c084fc':'moon','#9333ea':'moon','#8b5cf6':'moon','#818cf8':'moon',
          '#38bdf8':'storm','#a5f3fc':'frost','#a5eaff':'storm','#ea580c':'fire','#fb923c':'fire','#f97316':'forge',
          '#0284c7':'tide','#06b6d4':'tide','#7dd3fc':'frost','#dc2626':'blood','#ef4444':'blood','#ec4899':'heart',
          '#facc15':'sun','#fde047':'sun','#f59e0b':'sun','#eab308':'sun','#d97706':'forge'};
        return mapping[String(color).toLowerCase()] || 'spirit';
      }
      function activeTheme(slot = 'strike') {
        const gods = [['zeus','storm'],['hestia','fire'],['poseidon','tide'],['apollo','sun'],['demeter','frost'],['ares','blood'],['aphrodite','heart'],['hephaestus','forge']];
        return (gods.find(([god]) => hasBoon(`${god}_${slot}`)) || ['', 'spirit'])[1];
      }
      return Object.freeze({sources: Object.freeze(sources), catalog: Object.freeze(catalog), projectileTypes, ready, failures, metrics, draw, themeForColor, activeTheme});
    })();

    function drawSvgCast(ctx, cast, originX = 0, originY = 0) {
      if (!cast) return;
      const x = cast.x-originX, y = cast.y-originY, diameter = cast.radius*2 / .96;
      const remaining = Math.max(0, Math.min(1, cast.timer / 2.5));
      const reduced = gameRuntime.settings.reducedMotion;
      attackSvgArt.draw(ctx, 'cast-outer', x,y,diameter,diameter,0,.88);
      attackSvgArt.draw(ctx, 'cast-inner', x,y,diameter,diameter,reduced ? 0 : cast.angle*.08,.7+remaining*.18);
      attackSvgArt.draw(ctx, 'cast-inner', x,y,diameter*.57,diameter*.57,reduced ? 0 : -cast.angle*.13,.52+remaining*.2);
    }
    function drawSvgBoonEffects(ctx) {
      const time = boonState().time || 0, reduced = gameRuntime.settings.reducedMotion;
      for (const area of gameState.boonAreas || []) {
        const key = area.type === 'firestorm' ? 'fire-bloom' : area.type === 'vortex' ? 'vortex' : 'blood-field';
        attackSvgArt.draw(ctx,key,area.x,area.y,area.radius*2,area.radius*2,reduced ? 0 : time*(area.type==='vortex' ? .45 : -.12),Math.min(.46,area.remaining*.4));
      }
      if (hasBoon('selene_orbit')) {
        const x=player.x+Math.cos(time*2.2)*86, y=player.y+Math.sin(time*2.2)*86;
        attackSvgArt.draw(ctx,'moon_sickle',x,y,38,38,reduced ? 0 : time*2);
      }
    }
    // Called from Enemy.draw after translating to the enemy's origin. Shape
    // dimensions deliberately match the existing damaging telegraph geometry.
    function drawSvgEnemyTelegraph(ctx, enemy) {
      if (!enemy.isTelegraphing) return;
      const progress = Math.max(0,Math.min(1,1 - Math.max(0, enemy.telegraphTimer) / Math.max(.01,enemy.telegraphMax)));
      const targetRadii = {mortar:80,eruption:80,boss_leap_slam:150,cerberus_pounce:160,thanatos_teleport_slash:130,chronos_blitz:140};
      const areaRadii = {nyx_gravity_well:320,tartarus_ground_shatter:260,thanatos_reaper_cleave:220,medusa_gaze_petrify:320,chaos_singularity_blackhole:400,hydra_slam:200,hecate_polymorph:240,boss_scythe:200};
      const fanTypes = ['fan','poison_fan','flame_cone','hydra_barrage','cerberus_magma_breath','typhon_magma_eruption','nyx_darkness_beam','prometheus_solar_slash','charon_tsunami_surge','line'];
      let x=0,y=0;
      if (enemy.telegraphTarget && targetRadii[enemy.telegraphType]) { x=enemy.telegraphTarget.x-enemy.x; y=enemy.telegraphTarget.y-enemy.y; }
      if (enemy.telegraphType === 'rush') {
        const distance = Math.min(380,enemy.telegraphParam), a=enemy.telegraphAngle;
        attackSvgArt.draw(ctx,'enemy-rush',x+Math.cos(a)*distance/2,y+Math.sin(a)*distance/2,distance,80*32/28,a,.48+progress*.35);
      } else if (fanTypes.includes(enemy.telegraphType)) {
        attackSvgArt.draw(ctx,'enemy-fan',x,y,enemy.telegraphParam*2/.98,enemy.telegraphParam*2/.98,enemy.telegraphAngle,.5+progress*.35);
      } else {
        const radius=targetRadii[enemy.telegraphType] || areaRadii[enemy.telegraphType] || enemy.telegraphParam;
        attackSvgArt.draw(ctx,'enemy-circle',x,y,radius*2/.91,radius*2/.91,0,.5+progress*.35);
      }
    }
