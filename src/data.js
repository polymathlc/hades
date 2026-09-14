    const GODS = {
      zeus: {
        name: 'Zeus',
        title: 'Lord of Olympus',
        portraitIndex: 0,
        color: '#facc15',
        quotes: [
          '"Take my lightning, niece. Smite the usurper of Time and light up the darkness!"',
          '"A storm gathers in the Underworld. Let Chronos feel the wrath of Olympus!"'
        ],
        boons: [
          { id: 'zeus_strike', name: 'Lightning Strike', slot: 'Attack', desc: '[ATTACK] Strikes call down chain lightning arcing between up to 5 enemies for 45 electric damage.' },
          { id: 'zeus_ring', name: 'Storm Ring', slot: 'Cast', desc: '[CAST] Cast circle triggers repeating lightning strikes every 0.4s for 22 damage.' },
          { id: 'zeus_dash', name: 'Static Dash', slot: 'Dash', desc: '[DASH] Dashing discharges a burst of 6 electric spark bolts for 30 damage.' },
          { id: 'zeus_special', name: 'Thunder Special', slot: 'Special', desc: '[SPECIAL] Special sickle calls down a thunderbolt upon every enemy struck for 55 damage.' },
          { id: 'zeus_cloud', name: 'High Voltage', slot: 'Passive — Attack & Special', desc: '[PASSIVE — ATTACK & SPECIAL] Chain lightning jumps +3 extra times and has +40% wider arc distance.' },
          { id: 'zeus_jolt', name: 'Static Shock', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Inflicts Jolted on foes; when they attack, they take 80 self-inflicted electric damage.' },
          { id: 'zeus_bolt', name: 'Heaven’s Vengeance', slot: 'Passive — Survival', desc: '[PASSIVE — SURVIVAL] Whenever you take damage, immediately strike the attacker with 120 retaliatory lightning.' },
          { id: 'zeus_conduit', name: 'Storm Conduit', slot: 'Passive — Attack & Special', desc: '[PASSIVE — ATTACK & SPECIAL] All lightning effects have +30% chance to critically strike for 2.5x damage.' },
          { id: 'zeus_fury', name: 'God’s Wrath', slot: 'Passive — Attack & Special', desc: '[PASSIVE — ATTACK & SPECIAL] Gain +25% overall attack speed and +25% lightning strike frequency.' },
          { id: 'zeus_overload', name: 'Electric Overload', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Foes struck by lightning emit secondary shockwaves dealing 35 area damage.' }
        ]
      },
      hestia: {
        name: 'Hestia',
        title: 'Goddess of the Hearth',
        portraitIndex: 1,
        color: '#f97316',
        quotes: [
          '"Keep the hearth burning bright, child. Let us reduce these shades to ash!"',
          '"A small ember is all it takes to consume the grandest halls of time."'
        ],
        boons: [
          { id: 'hestia_strike', name: 'Flame Strike', slot: 'Attack', desc: '[ATTACK] Strikes inflict Scorch, dealing 60 burn damage over 3 seconds.' },
          { id: 'hestia_ring', name: 'Smolder Ring', slot: 'Cast', desc: '[CAST] Cast circle ignites a continuous fire vortex that incinerates foes for 30 burn damage.' },
          { id: 'hestia_dash', name: 'Searing Dash', slot: 'Dash', desc: '[DASH] Dash leaves a flaming path that burns enemies who step into it.' },
          { id: 'hestia_special', name: 'Magma Special', slot: 'Special', desc: '[SPECIAL] Special sickle leaves a trail of burning magma on its path.' },
          { id: 'hestia_pyro', name: 'Pyroclast', slot: 'Passive — Attack & Cast', desc: '[PASSIVE — ATTACK & CAST] Scorch deals +60% damage and spreads to nearby foes every second.' },
          { id: 'hestia_combust', name: 'Controlled Burn', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Striking scorched foes triggers a fiery combustion dealing 50 instant bonus damage.' },
          { id: 'hestia_ash', name: 'Hearth Blessing', slot: 'Passive — Survival', desc: '[PASSIVE — SURVIVAL] Gain 25% damage resistance while standing inside fire trails or cast rings.' },
          { id: 'hestia_inferno', name: 'Raging Inferno', slot: 'Passive — Attack & Special', desc: '[PASSIVE — ATTACK & SPECIAL] Foes suffering Scorch take +40% bonus damage from all player attacks.' },
          { id: 'hestia_ember', name: 'Firebrand', slot: 'Passive — Special', desc: '[PASSIVE — SPECIAL] Your Special launches 2 bouncing fire embers alongside the sickle throw.' },
          { id: 'hestia_flare', name: 'Solar Flare', slot: 'Passive — Hex', desc: '[PASSIVE — HEX] Hex activations leave a lasting 5s blazing firestorm dealing 150 total area damage.' }
        ]
      },
      poseidon: {
        name: 'Poseidon',
        title: 'Lord of the Seas',
        portraitIndex: 2,
        color: '#38bdf8',
        quotes: [
          '"Aha! Melinoë! Wash away these gloomy shades with the crushing power of the tides!"',
          '"Let the depths rise and crush the ancient Titan into the reef!"'
        ],
        boons: [
          { id: 'poseidon_strike', name: 'Wave Strike', slot: 'Attack', desc: '[ATTACK] Attacks blast enemies backward with heavy waves. Slashing foes into walls deals 80 wall-slam bonus damage!' },
          { id: 'poseidon_ring', name: 'Flood Ring', slot: 'Cast', desc: '[CAST] Cast circle erupts into a violent geyser, knocking all snared foes outward.' },
          { id: 'poseidon_dash', name: 'Tidal Dash', slot: 'Dash', desc: '[DASH] Dash unleashes a surging wave that propels you and slams enemies for 50 damage.' },
          { id: 'poseidon_special', name: 'Tsunami Special', slot: 'Special', desc: '[SPECIAL] Special sickle creates a wide wave pushing back all enemies in front.' },
          { id: 'poseidon_crush', name: 'Heavy Surf', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Wall slam damage increased by +80% and stuns enemies for 1.0s.' },
          { id: 'poseidon_rip', name: 'Riptide', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Wave attacks create whirlpools pulling foes inward toward the center.' },
          { id: 'poseidon_ocean', name: 'Ocean’s Bounty', slot: 'Passive — Economy', desc: '[PASSIVE — ECONOMY] Enemies drop +60% more Gold Obols and Ashes upon defeat.' },
          { id: 'poseidon_typhoon', name: 'Typhoon Force', slot: 'Passive — Attack & Dash', desc: '[PASSIVE — ATTACK & DASH] Surge waves pierce enemy shields and destroy incoming hostile projectiles.' },
          { id: 'poseidon_undertow', name: 'Undertow', slot: 'Passive — Dash', desc: '[PASSIVE — DASH] Dashing directly into enemies slams them backwards for 60 water damage.' },
          { id: 'poseidon_surge', name: 'Tidal Surge', slot: 'Passive — Special', desc: '[PASSIVE — SPECIAL] Gain +40% movement speed for 3s after launching your Special sickle.' }
        ]
      },
      apollo: {
        name: 'Apollo',
        title: 'God of Light',
        portraitIndex: 3,
        color: '#fde047',
        quotes: [
          '"Radiance to guide your blade, Melinoë. Let us shine bright upon the shadows!"',
          '"Strike with solar brilliance and dazzle all who oppose your destiny."'
        ],
        boons: [
          { id: 'apollo_strike', name: 'Nova Strike', slot: 'Attack', desc: '[ATTACK] Attacks have +50% wider sweep radius and inflict Dazzle (foes miss attacks).' },
          { id: 'apollo_ring', name: 'Solar Ring', slot: 'Cast', desc: '[CAST] Cast circle expands by +40% radius and triggers blinding solar flares.' },
          { id: 'apollo_special', name: 'Sunburst Special', slot: 'Special', desc: '[SPECIAL] Special sickle creates a radiant blinding explosion at apex for 85 damage.' },
          { id: 'apollo_dash', name: 'Blinding Dash', slot: 'Dash', desc: '[DASH] Dashing blinds nearby foes for 2.5s.' },
          { id: 'apollo_radiance', name: 'Solar Radiance', slot: 'Passive — Attack & Special', desc: '[PASSIVE — ATTACK & SPECIAL] Dazzled and blinded foes take +40% bonus damage from all sources.' },
          { id: 'apollo_dawn', name: 'Breaking Dawn', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Striking blinded foes triggers an instant 60 damage light burst.' },
          { id: 'apollo_hymn', name: 'Divine Hymn', slot: 'Passive — Survival', desc: '[PASSIVE — SURVIVAL] Defeating enemies heals Melinoë for 4 HP (up to 25 HP per chamber).' },
          { id: 'apollo_splendor', name: 'High Splendor', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] All sword attacks release radiant sun sparks seeking out targets.' },
          { id: 'apollo_sunfire', name: 'Sunfire Aegis', slot: 'Passive — Survival', desc: '[PASSIVE — SURVIVAL] Gain a 25% passive evasion chance while standing inside cast rings.' },
          { id: 'apollo_clarity', name: 'Lucid Mind', slot: 'Passive — Cast', desc: '[PASSIVE — CAST] Magick regenerates +100% faster (14 Magick per second).' }
        ]
      },
      selene: {
        name: 'Selene',
        title: 'Goddess of the Moon',
        portraitIndex: 4,
        color: '#c084fc',
        quotes: [
          '"The silver light guides you in the darkest hour, Witch of the Crossroads."',
          '"Invoke the Moon Hex, Melinoë, and pierce the shroud of Time itself."'
        ],
        boons: [
          { id: 'selene_hex_ray', name: 'Lunar Ray', slot: 'Hex', desc: '[HEX] Fires a continuous devastating moonlight laser beam dealing 550 total damage!' },
          { id: 'selene_hex_slow', name: 'Phase Shift', slot: 'Hex', desc: '[HEX] Slows down time for all enemies by 85% for 4.5 seconds.' },
          { id: 'selene_hex_meteor', name: 'Total Eclipse', slot: 'Hex', desc: '[HEX] Upgrades your meteor to 1200 area damage after a 0.55s warning.' },
          { id: 'selene_dash', name: 'Moon Cloak', slot: 'Dash', desc: '[DASH] Dashing conceals you for 0.45s, making attacks miss, and grants a 50% chance to double your next melee strike.' },
          { id: 'selene_crescent', name: 'Silver Crescent', slot: 'Passive — Special', desc: '[PASSIVE — SPECIAL] Your Special sickle fires 2 crescent blades in a spread.' },
          { id: 'selene_orbit', name: 'Orbital Moon', slot: 'Passive — Survival', desc: '[PASSIVE — SURVIVAL] A lunar orb orbits Melinoë dealing 35 contact damage and blocking bullets.' },
          { id: 'selene_gravity', name: 'Lunar Gravity', slot: 'Passive — Cast', desc: '[PASSIVE — CAST] Your Cast circle draws in enemy projectiles and neutralizes them.' },
          { id: 'selene_shroud', name: 'Witch Shroud', slot: 'Passive — Hex', desc: '[PASSIVE — HEX] Dashing through enemy attacks generates +20 Hex Charge instantly.' },
          { id: 'selene_waxing', name: 'Waxing Crescent', slot: 'Passive — Hex', desc: '[PASSIVE — HEX] Hex charge gains +40% faster on all basic attacks and specials.' },
          { id: 'selene_fullmoon', name: 'Full Moon Might', slot: 'Passive — Attack & Special', desc: '[PASSIVE — ATTACK & SPECIAL] While your Hex gauge is 100% full, all attacks deal +40% bonus damage.' }
        ]
      },
      hermes: {
        name: 'Hermes',
        title: 'God of Swiftness',
        portraitIndex: 5,
        color: '#fb923c',
        quotes: [
          '"Quick on your feet, coz! Time waits for no one, especially not Chronos!"',
          '"Speed is the greatest weapon against the Master of Time."'
        ],
        boons: [
          { id: 'hermes_speed', name: 'Nimble Mind', slot: 'Passive — Attack & Special', desc: '[PASSIVE — ATTACK & SPECIAL] Attack and Special speed increased by +45%.' },
          { id: 'hermes_dash', name: 'Hyper Sprint', slot: 'Dash', desc: '[DASH] Halves Dash recovery time and grants +60% movement speed for 2s after dashing.' },
          { id: 'hermes_dodge', name: 'Greater Evasion', slot: 'Passive — Survival', desc: '[PASSIVE — SURVIVAL] Gain a flat 30% chance to completely dodge any incoming attack.' },
          { id: 'hermes_haste', name: 'Quick Strike', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Attack combo recovery time reduced by 60%.' },
          { id: 'hermes_gust', name: 'Gale Force', slot: 'Passive — Dash', desc: '[PASSIVE — DASH] Dashing creates a shockwave blowing away enemy bullets.' },
          { id: 'hermes_rush', name: 'Adrenaline Rush', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Moving above base speed grants +35% damage to your next strike.' },
          { id: 'hermes_delivery', name: 'Swift Delivery', slot: 'Passive — Attack & Special', desc: '[PASSIVE — ATTACK & SPECIAL] You deal bonus damage equal to 40% of your total movement speed.' },
          { id: 'hermes_reflex', name: 'Lightning Reflexes', slot: 'Passive — Survival', desc: '[PASSIVE — SURVIVAL] Dodging an attack discharges an instant 80 electric shock to nearby foes.' },
          { id: 'hermes_stride', name: 'Fleet Stride', slot: 'Passive — Mobility', desc: '[PASSIVE — MOBILITY] Permanently increases base movement speed by +40%.' },
          { id: 'hermes_wings', name: 'Winged Talaria', slot: 'Passive — Dash', desc: '[PASSIVE — DASH] Extends Dash invulnerability to 0.55s, protecting you from attacks and hazards after landing.' }
        ]
      },
      aphrodite: {
        name: 'Aphrodite',
        title: 'Goddess of Love',
        portraitIndex: 6,
        color: '#f43f5e',
        quotes: [
          '"Heartstrings weave fate, darling. Let them tremble before our beauty!"',
          '"A broken heart hurts worse than any blade, Melinoë."'
        ],
        boons: [
          { id: 'aphrodite_strike', name: 'Heartbreak Strike', slot: 'Attack', desc: '[ATTACK] Attacks deal +60% damage and inflict Weak, reducing enemy attack power by 35%.' },
          { id: 'aphrodite_dash', name: 'Passion Dash', slot: 'Dash', desc: '[DASH] Dashing releases a burst of charm petals that weaken nearby foes.' },
          { id: 'aphrodite_ring', name: 'Sweet Surrender', slot: 'Cast', desc: '[CAST] Cast circle causes snared enemies to take +50% bonus damage from all sources.' },
          { id: 'aphrodite_special', name: 'Crush Special', slot: 'Special', desc: '[SPECIAL] Special sickle inflicts heavy Weak and slows enemy movement by 40%.' },
          { id: 'aphrodite_charm', name: 'Captivating Glance', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Attacks have a 20% chance to Charm foes to fight for you for 4s.' },
          { id: 'aphrodite_allure', name: 'Fatal Allure', slot: 'Passive — Attack & Special', desc: '[PASSIVE — ATTACK & SPECIAL] Attacks and Special projectiles deal +40% damage to weakened foes.' },
          { id: 'aphrodite_grace', name: 'Life Affirmation', slot: 'Passive — Survival', desc: '[PASSIVE — SURVIVAL] All maximum health pickups and healing effects are increased by +50%.' },
          { id: 'aphrodite_heart', name: 'Dying Wish', slot: 'Passive — Survival', desc: '[PASSIVE — SURVIVAL] Weakened enemies detonate in a burst of charm petals on death for 80 area damage.' },
          { id: 'aphrodite_beauty', name: 'Unshakable Glamour', slot: 'Passive — Survival', desc: '[PASSIVE — SURVIVAL] Bosses and mini-bosses deal -25% reduced damage to Melinoë.' },
          { id: 'aphrodite_embrace', name: 'Loving Embrace', slot: 'Passive — Survival', desc: '[PASSIVE — SURVIVAL] Standing near enemies restores 2 HP per second (up to 20 HP per room).' }
        ]
      },
      hephaestus: {
        name: 'Hephaestus',
        title: 'God of the Forge',
        portraitIndex: 7,
        color: '#ea580c',
        quotes: [
          '"Good steel and heavy blows! Let us forge Chronos into scrap metal!"',
          '"Feel the heat of the divine furnace in your strikes!"'
        ],
        boons: [
          { id: 'hephaestus_strike', name: 'Volcanic Strike', slot: 'Attack', desc: '[ATTACK] Every 4s, your next Attack unleashes a colossal volcanic blast for 180 damage.' },
          { id: 'hephaestus_armor', name: 'Heavy Armor', slot: 'Passive — Survival', desc: '[PASSIVE — SURVIVAL] Gain +50 Max HP and 25% passive damage resistance.' },
          { id: 'hephaestus_ring', name: 'Molten Ring', slot: 'Cast', desc: '[CAST] Cast circle erupts with a molten crater dealing 45 area damage.' },
          { id: 'hephaestus_special', name: 'Anvil Special', slot: 'Special', desc: '[SPECIAL] Special sickle triggers a concussive shockwave for 90 volcanic bonus damage.' },
          { id: 'hephaestus_forge', name: 'Divine Forge', slot: 'Passive — Survival', desc: '[PASSIVE — SURVIVAL] Every 3 cleared chambers, gain +15 Max Health for the rest of this run.' },
          { id: 'hephaestus_blast', name: 'Molten Shrapnel', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Volcanic Strikes fire 6 piercing metal shrapnel shards in all directions.' },
          { id: 'hephaestus_temper', name: 'Tempered Steel', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Attacks deal +45% bonus damage to armored foes, mini-bosses, and Titan bosses.' },
          { id: 'hephaestus_shield', name: 'Iron Aegis', slot: 'Passive — Survival', desc: '[PASSIVE — SURVIVAL] Gain a 40 HP energy barrier that completely absorbs hits and recharges each room.' },
          { id: 'hephaestus_smelt', name: 'Magma Smelting', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Attack strikes pierce enemy defense shields and gain +40 sweep range.' },
          { id: 'hephaestus_crush', name: 'Seismic Anvil', slot: 'Passive — Special', desc: '[PASSIVE — SPECIAL] Sickle hits shred armor, making targets take +30% damage from all sources.' }
        ]
      },
      demeter: {
        name: 'Demeter',
        title: 'Goddess of Seasons',
        portraitIndex: 8,
        color: '#67e8f9',
        quotes: [
          '"Winter has arrived for the Underworld. Freeze them to brittle stone, granddaughter."',
          '"The cold preserves nothing that stands against us."'
        ],
        boons: [
          { id: 'demeter_strike', name: 'Frost Strike', slot: 'Attack', desc: '[ATTACK] Attacks inflict Chill, slowing enemy movement and attacks by up to 50%.' },
          { id: 'demeter_ring', name: 'Arctic Ring', slot: 'Cast', desc: '[CAST] Cast circle summons a freezing blizzard vortex that continuously chills foes.' },
          { id: 'demeter_dash', name: 'Glacial Dash', slot: 'Dash', desc: '[DASH] Dash leaves freezing icicles that shatter when stepped on for 50 damage.' },
          { id: 'demeter_special', name: 'Freeze Special', slot: 'Special', desc: '[SPECIAL] Special sickle freezes enemies solid in ice for 1.5 seconds.' },
          { id: 'demeter_shatter', name: 'Glacial Shatter', slot: 'Passive — Attack & Special', desc: '[PASSIVE — ATTACK & SPECIAL] Attacks and Special projectiles deal +50% damage to chilled or frozen foes.' },
          { id: 'demeter_hail', name: 'Hailstorm', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Chilled foes are struck by falling hailstones every 1s for 30 damage.' },
          { id: 'demeter_blizzard', name: 'Snow Squall', slot: 'Passive — Cast', desc: '[PASSIVE — CAST] Your Cast blizzard expands by +40% and reduces enemy projectile accuracy.' },
          { id: 'demeter_rime', name: 'Killing Frost', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Enemies at max Chill stacks decay rapidly for 40 frost damage per second.' },
          { id: 'demeter_frostbite', name: 'Bitter Cold', slot: 'Passive — Survival', desc: '[PASSIVE — SURVIVAL] Foes who hit Melinoë while chilled take 60 reflected frost damage and get frozen.' },
          { id: 'demeter_winter', name: 'Winter Harvest', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Chilled foes with under 15% health shatter instantly into ice (execute).' }
        ]
      },
      ares: {
        name: 'Ares',
        title: 'God of War',
        portraitIndex: 9,
        color: '#dc2626',
        quotes: [
          '"Carnage is the true destiny of the Underworld. Let blood flow!"',
          '"A glorious battle awaits us, Melinoë. Slay them all."'
        ],
        boons: [
          { id: 'ares_strike', name: 'Curse of Agony', slot: 'Attack', desc: '[ATTACK] Attacks inflict Doom, dealing 90 delayed explosive damage after 1.1 seconds.' },
          { id: 'ares_ring', name: 'Blade Rift', slot: 'Cast', desc: '[CAST] Cast circle summons a spinning blade rift that tears through enemies for 50 damage.' },
          { id: 'ares_passive', name: 'Battle Rage', slot: 'Passive — Attack & Special', desc: '[PASSIVE — ATTACK & SPECIAL] Slaying any enemy grants +50% damage boost for 5 seconds.' },
          { id: 'ares_special', name: 'Curse of Pain', slot: 'Special', desc: '[SPECIAL] Special sickle inflicts 120 delayed Doom on all enemies pierced.' },
          { id: 'ares_blade_dash', name: 'Blade Dash', slot: 'Dash', desc: '[DASH] Dashing leaves behind a miniature whirling blade rift dealing 50 damage.' },
          { id: 'ares_impending', name: 'Impending Doom', slot: 'Passive — Attack & Special', desc: '[PASSIVE — ATTACK & SPECIAL] Doom takes 0.4s longer to detonate, but its explosive damage is increased by +80%.' },
          { id: 'ares_engulf', name: 'Engulfing Vortex', slot: 'Passive — Cast', desc: '[PASSIVE — CAST] Blade Rifts pull in nearby foes and grow +40% larger over their duration.' },
          { id: 'ares_blood', name: 'Blood Frenzy', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] After taking damage, your next 2 attacks deal +100% bonus damage.' },
          { id: 'ares_grim', name: 'Grim Reaper', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Slaying a Doom-afflicted foe immediately triggers Doom on all adjacent targets.' },
          { id: 'ares_carnage', name: 'Carnage Engine', slot: 'Passive — Economy', desc: '[PASSIVE — ECONOMY] Defeating 3 enemies without taking damage grants +30 bonus Gold Obols.' }
        ]
      }
    };

    // Poms only offer effects whose combat calculation actually reads their level.
    // Unique utility effects remain useful rewards, but never consume a Pom.
    const POM_UPGRADE_EFFECTS = {
      zeus_strike: 'Chain lightning damage', zeus_ring: 'Cast lightning damage',
      zeus_special: 'Special lightning damage', zeus_jolt: 'Jolted damage', zeus_overload: 'Shockwave damage',
      hestia_strike: 'Attack Scorch damage', hestia_ring: 'Cast Scorch damage', hestia_special: 'Special Scorch damage',
      hestia_combust: 'Combustion damage', hestia_ember: 'Ember damage', hestia_flare: 'Firestorm damage',
      poseidon_dash: 'Dash wave damage', poseidon_special: 'Special wave damage', poseidon_undertow: 'Undertow damage',
      apollo_ring: 'Solar flare damage', apollo_special: 'Sunburst damage', apollo_dawn: 'Light burst damage',
      apollo_splendor: 'Seeking spark damage', selene_hex_ray: 'Lunar Ray damage',
      selene_hex_meteor: 'Meteor damage', selene_orbit: 'Orbital Moon damage',
      aphrodite_strike: 'Attack damage', aphrodite_special: 'Special damage',
      hephaestus_strike: 'Volcanic Strike damage', hephaestus_special: 'Anvil damage',
      hephaestus_forge: 'Maximum health gained', hephaestus_blast: 'Shrapnel damage',
      demeter_hail: 'Hailstone damage', demeter_rime: 'Frost decay damage',
      ares_strike: 'Attack Doom damage', ares_special: 'Special Doom damage', ares_blade_dash: 'Blade rift damage'
    };
    function pomUpgradeDescription(boon, level = boon.level || 1) {
      const effect = POM_UPGRADE_EFFECTS[boon.id];
      if (!effect) return null;
      const base = boon.id === 'aphrodite_strike' || boon.id === 'aphrodite_special' ? 1.6 : 1;
      return `${effect}: ${Math.round((base + (level - 1) * 0.4) * 100)}% of base`;
    }

    // --- DUO BOON SYNERGY SYSTEM ---
    const DUO_BOONS = [
      {
        id: 'duo_sea_storm',
        name: 'Sea Storm',
        gods: ['Poseidon', 'Zeus'],
        reqs: [['poseidon_strike', 'poseidon_dash', 'poseidon_ring'], ['zeus_strike', 'zeus_ring', 'zeus_dash']],
        desc: '[DUO BOON — ATTACK & DASH] Whenever your wave knockback effects slam enemies, instant chain lightning strikes them for 60 damage!'
      },
      {
        id: 'duo_plasma',
        name: 'Plasma Discharge',
        gods: ['Zeus', 'Hestia'],
        reqs: [['zeus_strike', 'zeus_ring'], ['hestia_strike', 'hestia_ring', 'hestia_dash']],
        desc: '[DUO BOON — ATTACK] Chain lightning ignites Scorch on all targets, making burn damage tick twice as fast with secondary spark bursts.'
      },
      {
        id: 'duo_supernova',
        name: 'Supernova',
        gods: ['Apollo', 'Hestia'],
        reqs: [['apollo_strike', 'apollo_ring'], ['hestia_strike', 'hestia_ring']],
        desc: '[DUO BOON — ATTACK] Scorched enemies detonate upon death in a massive 220px blinding solar nova dealing 180 area damage.'
      },
      {
        id: 'duo_blizzard',
        name: 'Blizzard Cyclone',
        gods: ['Poseidon', 'Demeter'],
        reqs: [['poseidon_ring', 'poseidon_strike'], ['demeter_ring', 'demeter_strike']],
        desc: '[DUO BOON — CAST] Cast circle becomes a permanent freezing water cyclone that pulls in all enemies and inflicts Chill.'
      },
      {
        id: 'duo_heartbreak_doom',
        name: 'Heartbreak Doom',
        gods: ['Aphrodite', 'Ares'],
        reqs: [['aphrodite_strike', 'aphrodite_dash'], ['ares_strike', 'ares_ring']],
        desc: '[DUO BOON — ATTACK] Weakened foes immediately trigger continuous Doom blade rifts whenever they take attack damage.'
      },
      {
        id: 'duo_freezing_inferno',
        name: 'Freezing Inferno',
        gods: ['Hestia', 'Demeter'],
        reqs: [['hestia_strike', 'hestia_dash'], ['demeter_strike', 'demeter_ring']],
        desc: '[DUO BOON — ATTACK & SPECIAL] Enemies afflicted with both Scorch and Chill suffer Steam Shock, taking +150% critical damage from all attacks.'
      },
      {
        id: 'duo_volcanic_flash',
        name: 'Volcanic Flash',
        gods: ['Hephaestus', 'Zeus'],
        reqs: [['hephaestus_strike', 'hephaestus_ring'], ['zeus_strike', 'zeus_ring']],
        desc: '[DUO BOON — ATTACK] Hephaestus volcanic blasts trigger chain lightning to all surrounding targets across the arena.'
      },
      {
        id: 'duo_sunlit_moon',
        name: 'Sunlit Moon',
        gods: ['Apollo', 'Selene'],
        reqs: [['apollo_strike', 'apollo_ring'], ['selene_hex_ray', 'selene_hex_slow', 'selene_hex_meteor']],
        desc: '[DUO BOON — HEX] Selene Hexes charge +100% faster and gain +100% blast radius with blinding solar brilliance.'
      }
    ];

    // --- GAME STATE ---
    const gameState = {
      chamber: 1,
      bestChamber: 1,
      roomsCleared: 0,
      roomDamageTaken: 0,
      pendingActions: [],
      chamberType: 'normal',
      enemiesCleared: false,
      kills: 0,
      gold: 80,
      ashes: 10,
      bones: 5,
      upgrades: {
        maxHp: 0,
        magick: 0,
        damage: 0,
        defiance: 1
      },
      equippedBoons: [],
      particles: [],
      projectiles: [],
      enemies: [],
      camera: { x: 0, y: 0 },
      isPaused: false,
      battleRageTimer: 0,
      doors: [] // Array of interactive exit gates
    };

    // Only permanent resources are stored. A new run never inherits old combat state.
    function progressStorageKey() {
      return typeof learningStorageKey === 'function' ? learningStorageKey() : 'chronos-fall-progress-v1';
    }
    function loadPermanentProgress() {
      try {
        const storageKey = progressStorageKey();
        if (!storageKey) return;
        const saved = JSON.parse(localStorage.getItem(storageKey));
        if (!saved || saved.version !== 1) return;
        const integer = (value, fallback, limit) => Number.isSafeInteger(value) && value >= 0 && value <= limit ? value : fallback;
        gameState.ashes = integer(saved.ashes, 10, 100000000);
        gameState.bones = integer(saved.bones, 5, 100000000);
        gameState.bestChamber = Math.max(1, integer(saved.bestChamber, 1, 1000000));
        for (const key of Object.keys(gameState.upgrades)) {
          gameState.upgrades[key] = integer(saved.upgrades?.[key], gameState.upgrades[key], 10000);
        }
      } catch (_) { /* Disabled or corrupt storage must never prevent a run. */ }
    }
    function savePermanentProgress() {
      try {
        const storageKey = progressStorageKey();
        if (!storageKey) return;
        localStorage.setItem(storageKey, JSON.stringify({
          version: 1, ashes: gameState.ashes, bones: gameState.bones,
          bestChamber: gameState.bestChamber, upgrades: gameState.upgrades
        }));
      } catch (_) { /* Play remains available when browser storage is unavailable. */ }
    }
    loadPermanentProgress();
    window.addEventListener('pagehide', savePermanentProgress);

    // --- 40+ ENEMY DEFINITIONS (Standard enemies 80% reduced HP, Mini-bosses, 20x Chronos & 10 Post-Chronos Bosses) ---
    const ENEMY_TYPES = {
      // 1. Mini-Bosses (Mapped to minibosses.webp: 2x2 grid)
      asterius_king: { name: 'Asterius — Minotaur King', isMiniBoss: true, maxHp: 8500, speed: 110, radius: 52, color: '#f59e0b', sheet: 'minibosses', cellX: 0, cellY: 0, cols: 2, rows: 2, behavior: 'miniboss_asterius' },
      hydra_prime: { name: 'Lernaean Bone Hydra Prime', isMiniBoss: true, maxHp: 16000, speed: 70, radius: 56, color: '#10b981', sheet: 'minibosses', cellX: 1, cellY: 0, cols: 2, rows: 2, behavior: 'miniboss_hydra' },
      hecate_matron: { name: 'Hecate — Witch Matron', isMiniBoss: true, maxHp: 26000, speed: 120, radius: 48, color: '#8b5cf6', sheet: 'minibosses', cellX: 0, cellY: 1, cols: 2, rows: 2, behavior: 'miniboss_hecate' },
      cerberus_prime: { name: 'Cerberus Prime — Infernal Guardian', isMiniBoss: true, maxHp: 38000, speed: 180, radius: 55, color: '#ef4444', sheet: 'minibosses', cellX: 1, cellY: 1, cols: 2, rows: 2, behavior: 'miniboss_cerberus' },

      // 2. Monsters & Beasts (Mapped to monsters_beasts.webp: 3x2 grid) (HP -80%)
      minotaur_brute: { name: 'Minotaur Brute', maxHp: 168, speed: 90, radius: 40, color: '#b91c1c', sheet: 'monsters_beasts', cellX: 0, cellY: 0, cols: 3, rows: 2, behavior: 'bull_rush' },
      cerberus_hound: { name: 'Cerberus Houndling', maxHp: 116, speed: 190, radius: 32, color: '#b45309', sheet: 'monsters_beasts', cellX: 1, cellY: 0, cols: 3, rows: 2, behavior: 'triple_fireball' },
      tartarus_behemoth: { name: 'Tartarus Behemoth', maxHp: 240, speed: 60, radius: 48, color: '#78716c', sheet: 'monsters_beasts', cellX: 2, cellY: 0, cols: 3, rows: 2, behavior: 'earthquake' },
      cyclops_smasher: { name: 'Cyclops Smasher', maxHp: 176, speed: 75, radius: 42, color: '#71717a', sheet: 'monsters_beasts', cellX: 0, cellY: 1, cols: 3, rows: 2, behavior: 'quad_boulder_slam' },
      gorgon_viper: { name: 'Gorgon Viper', maxHp: 58, speed: 180, radius: 25, color: '#15803d', sheet: 'monsters_beasts', cellX: 1, cellY: 1, cols: 3, rows: 2, behavior: 'poison_fan' },
      lava_crag_crab: { name: 'Lava Crag Crab', maxHp: 136, speed: 110, radius: 35, color: '#c2410c', sheet: 'monsters_beasts', cellX: 2, cellY: 1, cols: 3, rows: 2, behavior: 'magma_dropper' },

      // 3. Undead & Cultists (Mapped to undead_cultists.webp: 3x2 grid) (HP -80%)
      bloodless_screamer: { name: 'Bloodless Screamer', maxHp: 40, speed: 230, radius: 22, color: '#f43f5e', sheet: 'undead_cultists', cellX: 0, cellY: 0, cols: 3, rows: 2, behavior: 'screamer' },
      satyr_cultist: { name: 'Satyr Cultist', maxHp: 52, speed: 175, radius: 25, color: '#84cc16', sheet: 'undead_cultists', cellX: 1, cellY: 0, cols: 3, rows: 2, behavior: 'poison_darts' },
      phantasm_cloaker: { name: 'Phantasm Cloaker', maxHp: 48, speed: 160, radius: 24, color: '#9333ea', sheet: 'undead_cultists', cellX: 2, cellY: 0, cols: 3, rows: 2, behavior: 'stealth_backstab' },
      doom_herald: { name: 'Doom Herald', maxHp: 104, speed: 110, radius: 32, color: '#ef4444', sheet: 'undead_cultists', cellX: 0, cellY: 1, cols: 3, rows: 2, behavior: 'doom_runes' },
      bone_chariot: { name: 'Bone Chariot', maxHp: 100, speed: 310, radius: 32, color: '#d97706', sheet: 'undead_cultists', cellX: 1, cellY: 1, cols: 3, rows: 2, behavior: 'wall_bounce_charger' },
      automaton_sentry: { name: 'Automaton Sentry', maxHp: 128, speed: 0, radius: 34, color: '#ca8a04', sheet: 'undead_cultists', cellX: 2, cellY: 1, cols: 3, rows: 2, behavior: 'dual_laser_turret' },

      // 4. Shades & Swarmers (Mapped to shade.webp) (HP -80%)
      shade_wretch: { name: 'Shade Wretch', maxHp: 34, speed: 200, radius: 24, color: '#2ae6b4', sheet: 'shade', behavior: 'swarmer' },
      shade_bruiser: { name: 'Shade Bruiser', maxHp: 112, speed: 85, radius: 36, color: '#0891b2', sheet: 'shade', behavior: 'slammer' },
      blast_beetle: { name: 'Blast Beetle', maxHp: 30, speed: 260, radius: 20, color: '#dc2626', sheet: 'shade', behavior: 'kamikaze_bomber' },
      clockwork_saw: { name: 'Clockwork Saw', maxHp: 72, speed: 270, radius: 24, color: '#eab308', sheet: 'shade', behavior: 'blade_bouncer' },
      stygian_jellyfish: { name: 'Stygian Jellyfish', maxHp: 70, speed: 70, radius: 30, color: '#06b6d4', sheet: 'shade', behavior: 'electric_pulse_ring' },
      hydra_spawn: { name: 'Hydra Spawn', maxHp: 116, speed: 85, radius: 33, color: '#16a34a', sheet: 'shade', behavior: 'bouncing_acid_triad' },
      shadow_reaper: { name: 'Shadow Reaper', maxHp: 68, speed: 140, radius: 28, color: '#6366f1', sheet: 'shade', behavior: 'teleport_scythe' },
      void_lurker: { name: 'Void Lurker', maxHp: 62, speed: 165, radius: 26, color: '#4c1d95', sheet: 'shade', behavior: 'burrow_eruption' },

      // 5. Casters (Mapped to witch.webp) (HP -80%)
      witch_siren: { name: 'Witch Siren', maxHp: 56, speed: 120, radius: 28, color: '#a855f7', sheet: 'witch', behavior: 'triple_orb' },
      witch_archmage: { name: 'Witch Archmage', maxHp: 84, speed: 95, radius: 30, color: '#c084fc', sheet: 'witch', behavior: 'pentagram_mortar' },
      flame_cultist: { name: 'Flame Cultist', maxHp: 64, speed: 115, radius: 26, color: '#ea580c', sheet: 'witch', behavior: 'flamethrower' },
      frost_banshee: { name: 'Frost Banshee', maxHp: 70, speed: 130, radius: 27, color: '#38bdf8', sheet: 'witch', behavior: 'frost_spiral' },
      chrono_mage: { name: 'Chrono-Mage', maxHp: 96, speed: 105, radius: 30, color: '#fbbf24', sheet: 'witch', behavior: 'time_rift' },
      time_weever: { name: 'Time Weever', maxHp: 76, speed: 125, radius: 27, color: '#eab308', sheet: 'witch', behavior: 'time_tether_bombs' },
      sirens_choir: { name: 'Sirens Choir', maxHp: 80, speed: 110, radius: 28, color: '#ec4899', sheet: 'witch', behavior: 'charm_pulse' },
      soul_necromancer: { name: 'Soul Necromancer', maxHp: 92, speed: 100, radius: 29, color: '#8b5cf6', sheet: 'witch', behavior: 'summon_skeleton_shades' },

      // 6. Elite & Chronos Titan Boss (Chamber 100)
      chronos_vanguard: { name: 'Chronos Vanguard', maxHp: 144, speed: 110, radius: 36, color: '#d97706', sheet: 'chronos', behavior: 'shield_spearman' },
      chronos: { name: 'Chronos — Titan of Time (Colossal)', isBoss: true, maxHp: 68000, speed: 115, radius: 64, color: '#eab308', sheet: 'chronos', behavior: 'titan_boss_20x' },

      // 7. Ten Post-Chronos Colossal Bosses (Every 30 Chambers after 100)
      typhon_prime: { name: 'Typhon Prime — Father of Monsters', isBoss: true, maxHp: 85000, speed: 120, radius: 68, color: '#ea580c', sheet: 'infinite_bosses_a', cellX: 0, cellY: 0, cols: 2, rows: 2, behavior: 'boss_typhon' },
      nyx_primordial: { name: 'Nyx Primordial — Sovereign of Night', isBoss: true, maxHp: 110000, speed: 130, radius: 65, color: '#818cf8', sheet: 'infinite_bosses_a', cellX: 1, cellY: 0, cols: 2, rows: 2, behavior: 'boss_nyx' },
      tartarus_colossus: { name: 'Tartarus Colossus — The Living Pit', isBoss: true, maxHp: 145000, speed: 100, radius: 72, color: '#d97706', sheet: 'infinite_bosses_a', cellX: 0, cellY: 1, cols: 2, rows: 2, behavior: 'boss_tartarus' },
      thanatos_ascended: { name: 'Thanatos Ascended — God of Death', isBoss: true, maxHp: 180000, speed: 155, radius: 66, color: '#06b6d4', sheet: 'infinite_bosses_a', cellX: 1, cellY: 1, cols: 2, rows: 2, behavior: 'boss_thanatos' },
      prometheus_rebound: { name: 'Prometheus Rebound — Titan of Fire', isBoss: true, maxHp: 220000, speed: 125, radius: 68, color: '#f97316', sheet: 'infinite_bosses_b', cellX: 0, cellY: 0, cols: 2, rows: 2, behavior: 'boss_prometheus' },
      medusa_queen: { name: 'Medusa Queen — Petrifying Terror', isBoss: true, maxHp: 265000, speed: 140, radius: 65, color: '#10b981', sheet: 'infinite_bosses_b', cellX: 1, cellY: 0, cols: 2, rows: 2, behavior: 'boss_medusa' },
      nemesis_supreme: { name: 'Nemesis Supreme — Divine Retribution', isBoss: true, maxHp: 310000, speed: 160, radius: 64, color: '#f59e0b', sheet: 'infinite_bosses_b', cellX: 0, cellY: 1, cols: 2, rows: 2, behavior: 'boss_nemesis' },
      charon_harvester: { name: 'Charon Harvester — Dread Ferryman', isBoss: true, maxHp: 360000, speed: 110, radius: 70, color: '#eab308', sheet: 'infinite_bosses_b', cellX: 1, cellY: 1, cols: 2, rows: 2, behavior: 'boss_charon' },
      python_ancient: { name: 'Python Ancient — Dragon of Delphi', isBoss: true, maxHp: 420000, speed: 135, radius: 72, color: '#22c55e', sheet: 'infinite_bosses_c', cellX: 0, cellY: 0, cols: 2, rows: 2, behavior: 'boss_python' },
      chaos_embodied: { name: 'Chaos Embodied — Origin of Cosmos', isBoss: true, maxHp: 500000, speed: 140, radius: 75, color: '#ec4899', sheet: 'infinite_bosses_c', cellX: 0, cellY: 1, cols: 2, rows: 2, behavior: 'boss_chaos' }
    };

    // --- PLAYER CLASS (4-Hit Attack Combo System with Devastating Finisher) ---
