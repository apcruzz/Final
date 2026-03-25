  (function() {
    const STATES = [
      "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia",
      "Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland",
      "Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey",
      "New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina",
      "South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"
    ];

    const GROUPS = {
      warm:         new Set(["Florida","Texas","Arizona","Nevada","California","Hawaii","Georgia","South Carolina","Louisiana","Alabama","Mississippi","New Mexico"]),
      coastal:      new Set(["California","Florida","Texas","New York","New Jersey","Delaware","Maryland","Virginia","North Carolina","South Carolina","Georgia","Alabama","Louisiana","Mississippi","Alaska","Hawaii","Oregon","Washington","Maine","Massachusetts","Rhode Island"]),
      warmCoastal:  new Set(["California","Florida","Hawaii","Texas","Georgia","South Carolina","North Carolina","Alabama","Louisiana","Mississippi"]),
      mild:         new Set(["North Carolina","Virginia","Tennessee","Arkansas","Oklahoma","Kentucky","Maryland","Oregon"]),
      cold:         new Set(["Alaska","North Dakota","South Dakota","Montana","Minnesota","Wisconsin","Vermont","Maine","New Hampshire","Wyoming","Michigan"]),
      snowy:        new Set(["Alaska","Colorado","Maine","Massachusetts","Michigan","Minnesota","Montana","New Hampshire","New York","Utah","Vermont","Wisconsin","Wyoming"]),
      urban:        new Set(["New York","California","Illinois","Massachusetts","Texas","Florida","New Jersey","Washington","Georgia","Pennsylvania"]),
      suburban:     new Set(["Virginia","North Carolina","Colorado","Arizona","Maryland","Tennessee","Ohio","Minnesota"]),
      rural:        new Set(["Montana","Wyoming","North Dakota","South Dakota","Idaho","West Virginia","Vermont","Maine","Nebraska"]),
      affordable:   new Set(["Texas","Tennessee","Oklahoma","Arkansas","Mississippi","Alabama","Kentucky","West Virginia","Iowa","Kansas"]),
      balancedCost: new Set(["North Carolina","Georgia","Arizona","Ohio","Michigan","Nevada","Missouri","Indiana","Pennsylvania"]),
      premium:      new Set(["California","New York","Massachusetts","Hawaii","Washington","New Jersey","Maryland","Colorado","Oregon"]),
      nature:       new Set(["Colorado","Utah","Montana","Wyoming","Idaho","Alaska","Maine","Vermont","Oregon","Washington"]),
      entertainment:new Set(["California","New York","Nevada","Florida","Texas","Illinois","Georgia","Louisiana"]),
      jobs:         new Set(["California","Texas","New York","Washington","Massachusetts","Virginia","North Carolina","Colorado","Georgia"]),
      quiet:        new Set(["Vermont","Maine","Wyoming","Montana","West Virginia","South Dakota","North Dakota","Idaho","New Hampshire"]),
      westCoast:    new Set(["California","Oregon","Washington"]),
      desert:       new Set(["Arizona","Nevada","New Mexico","Utah"]),
      adventure:    new Set(["Alaska","Colorado","Utah","Montana","Wyoming","Idaho"]),
      creative:     new Set(["California","New York","Oregon","Washington","Massachusetts","Louisiana","New Mexico","Tennessee"]),
      foodScene:    new Set(["California","New York","Texas","Louisiana","Illinois","Nevada","Georgia","Oregon"]),
      collegeTown:  new Set(["Massachusetts","North Carolina","Virginia","Michigan","Wisconsin","Colorado","Oregon"]),
      family:       new Set(["Minnesota","Virginia","North Carolina","Colorado","Wisconsin","Utah","Iowa","Nebraska"]),
      independent:  new Set(["Alaska","Vermont","Oregon","Montana","New Mexico","Maine"]),
      hospitality:  new Set(["Hawaii","South Carolina","Georgia","Tennessee","North Carolina","Louisiana","Alabama"]),
      waterLife:    new Set(["Hawaii","California","Florida","Alaska","Washington","Maine","Michigan"]),
      winterSports: new Set(["Alaska","Colorado","Utah","Vermont","Maine","Wyoming","Montana","Michigan","Minnesota","New Hampshire","Wisconsin"]),
      history:      new Set(["Massachusetts","Virginia","Pennsylvania","South Carolina","Louisiana","New Mexico","Maryland"]),
      music:        new Set(["Tennessee","Louisiana","Texas","Georgia","Illinois","New York"]),
      wellness:     new Set(["Hawaii","California","Colorado","Oregon","Arizona","Vermont"]),
      islandCulture:new Set(["Hawaii"]),
      frontier:     new Set(["Alaska"]),
      film:         new Set(["California","New York","Georgia","New Mexico"]),
      stargazing:   new Set(["Alaska","New Mexico","Arizona","Utah","Montana","Wyoming"]),
      surfCulture:  new Set(["Hawaii","California"]),
      ecoLiving:    new Set(["California","Oregon","Washington","Vermont","Colorado","Hawaii"]),
      luxury:       new Set(["California","New York","Hawaii","Florida","Massachusetts"]),
      nationalParks:new Set(["Alaska","Utah","Arizona","Colorado","Wyoming","Montana","California"]),
      farmLife:     new Set(["Iowa","Kansas","Nebraska","Wisconsin","Idaho","Montana"]),
      civicCulture: new Set(["Virginia","Maryland","Massachusetts","Minnesota","Colorado","Washington"]),
      roadTrips:    new Set(["Texas","California","Arizona","Utah","Colorado","Montana","Alaska"]),
      spiritual:    new Set(["Hawaii","New Mexico","Arizona","California","Oregon"]),
      marineLife:   new Set(["Hawaii","Alaska","California","Florida","Washington","Maine"])
    };

    const QUESTION_BANK = [
      { id:"weather", prompt:"What weather do you prefer most of the year?", options:[
        {id:"warm",  label:"Warm and sunny",  apply:[{group:"warm",score:3},{group:"mild",score:1}]},
        {id:"mild",  label:"Four seasons",    apply:[{group:"mild",score:3},{group:"cold",score:1},{group:"warm",score:1}]},
        {id:"cold",  label:"Cool / snowy",    apply:[{group:"cold",score:2},{group:"snowy",score:3},{group:"winterSports",score:1}]}
      ]},
      { id:"lifestyle", prompt:"What kind of lifestyle fits you best?", options:[
        {id:"urban",    label:"Big city energy",      apply:[{group:"urban",score:3},{group:"jobs",score:1}]},
        {id:"suburban", label:"Balanced suburban",    apply:[{group:"suburban",score:3},{group:"balancedCost",score:1}]},
        {id:"rural",    label:"Small town / rural",   apply:[{group:"rural",score:3},{group:"quiet",score:1}]}
      ]},
      { id:"budget", prompt:"How important is affordability?", options:[
        {id:"high",   label:"Very important",      apply:[{group:"affordable",score:3},{group:"balancedCost",score:1}]},
        {id:"medium", label:"Somewhat important",  apply:[{group:"balancedCost",score:3},{group:"affordable",score:1}]},
        {id:"low",    label:"Not a major factor",  apply:[{group:"premium",score:3},{group:"urban",score:1}]}
      ]},
      { id:"activities", prompt:"Which activities do you want nearby?", options:[
        {id:"nature",        label:"Outdoors and nature",      apply:[{group:"nature",score:3},{group:"quiet",score:1}]},
        {id:"entertainment", label:"Food, arts, nightlife",   apply:[{group:"entertainment",score:3},{group:"urban",score:1}]},
        {id:"mix",           label:"A mix of both",            apply:[{group:"suburban",score:2},{group:"nature",score:1},{group:"entertainment",score:1}]}
      ]},
      { id:"priority", prompt:"What is your top priority in your next place?", options:[
        {id:"career",  label:"Career opportunities",  apply:[{group:"jobs",score:3},{group:"urban",score:1}]},
        {id:"quiet",   label:"Peace and slower pace", apply:[{group:"quiet",score:3},{group:"rural",score:1}]},
        {id:"balance", label:"Balanced life",         apply:[{group:"suburban",score:2},{group:"balancedCost",score:2}]}
      ]},
      { id:"weekend", prompt:"What does your ideal weekend look like?", options:[
        {id:"events", label:"Concerts, events, city life", apply:[{group:"entertainment",score:3},{group:"urban",score:1}]},
        {id:"hiking", label:"Trails, parks, mountains",   apply:[{group:"nature",score:3},{group:"quiet",score:1}]},
        {id:"mix",    label:"Some activity, some rest",   apply:[{group:"suburban",score:2},{group:"nature",score:1},{group:"entertainment",score:1}]}
      ]},
      { id:"homeType", prompt:"Where would you rather live?", options:[
        {id:"downtown",   label:"Downtown apartment",     apply:[{group:"urban",score:3},{group:"premium",score:1}]},
        {id:"suburb",     label:"Suburban neighborhood",  apply:[{group:"suburban",score:3},{group:"balancedCost",score:1}]},
        {id:"smalltown",  label:"Small town",             apply:[{group:"rural",score:3},{group:"quiet",score:1}]}
      ]},
      { id:"transport", prompt:"How do you prefer getting around?", options:[
        {id:"transit",  label:"Public transit / walking", apply:[{group:"urban",score:3},{group:"premium",score:1}]},
        {id:"car",      label:"Mostly by car",            apply:[{group:"suburban",score:3},{group:"balancedCost",score:1}]},
        {id:"minimal",  label:"Short drives, less traffic", apply:[{group:"quiet",score:3},{group:"rural",score:1}]}
      ]},
      { id:"pace", prompt:"What daily pace do you enjoy?", options:[
        {id:"fast",     label:"Fast-paced and busy",    apply:[{group:"urban",score:3},{group:"jobs",score:1}]},
        {id:"moderate", label:"Balanced and steady",    apply:[{group:"suburban",score:3},{group:"balancedCost",score:1}]},
        {id:"slow",     label:"Slow and relaxed",       apply:[{group:"quiet",score:3},{group:"rural",score:1}]}
      ]},
      { id:"landscape", prompt:"Which landscape do you prefer most?", options:[
        {id:"coast",    label:"Coast and beaches",       apply:[{group:"warmCoastal",score:5},{group:"coastal",score:2},{group:"warm",score:2}]},
        {id:"mountain", label:"Mountains and forests",   apply:[{group:"nature",score:3},{group:"quiet",score:1}]},
        {id:"plains",   label:"Open plains and space",   apply:[{group:"rural",score:2},{group:"affordable",score:2}]}
      ]},
      { id:"culture", prompt:"What kind of local culture feels most exciting to you?", options:[
        {id:"island",   label:"Island traditions and aloha spirit", apply:[{group:"islandCulture",score:7},{group:"hospitality",score:2},{group:"waterLife",score:2}]},
        {id:"frontier", label:"Independent frontier character",     apply:[{group:"frontier",score:7},{group:"adventure",score:2},{group:"independent",score:2}]},
        {id:"arts",     label:"Creative arts and diverse neighborhoods", apply:[{group:"creative",score:4},{group:"urban",score:1}]}
      ]},
      { id:"travelStyle", prompt:"How do you want your surroundings to feel?", options:[
        {id:"iconic",    label:"Globally iconic and energetic", apply:[{group:"urban",score:3},{group:"premium",score:1},{group:"film",score:1}]},
        {id:"laidback",  label:"Relaxed, scenic, and easygoing", apply:[{group:"westCoast",score:3},{group:"wellness",score:2}]},
        {id:"remote",    label:"Remote and far from the crowds", apply:[{group:"frontier",score:4},{group:"quiet",score:2},{group:"independent",score:1}]}
      ]},
      { id:"food", prompt:"What food scene sounds best to you?", options:[
        {id:"global",   label:"Global restaurants and variety", apply:[{group:"foodScene",score:3},{group:"urban",score:1}]},
        {id:"regional", label:"Strong local flavors and traditions", apply:[{group:"history",score:1},{group:"music",score:1},{group:"hospitality",score:2}]},
        {id:"fresh",    label:"Fresh seafood and farm-to-table", apply:[{group:"coastal",score:2},{group:"westCoast",score:2},{group:"waterLife",score:1}]}
      ]},
      { id:"community", prompt:"What kind of community would help you feel at home?", options:[
        {id:"welcoming", label:"Warm, welcoming, and neighborly", apply:[{group:"hospitality",score:3},{group:"family",score:1}]},
        {id:"indie",     label:"Independent and offbeat",         apply:[{group:"independent",score:3},{group:"creative",score:1}]},
        {id:"ambitious", label:"Driven and opportunity-focused",  apply:[{group:"jobs",score:3},{group:"collegeTown",score:1}]}
      ]},
      { id:"water", prompt:"Which water setting sounds most appealing?", options:[
        {id:"tropical", label:"Warm ocean, reefs, and beaches", apply:[{group:"islandCulture",score:5},{group:"warmCoastal",score:4},{group:"waterLife",score:2},{group:"warm",score:2}]},
        {id:"rugged",   label:"Wild coastline, glaciers, and fishing towns", apply:[{group:"frontier",score:5},{group:"waterLife",score:2},{group:"cold",score:1}]},
        {id:"mixed",    label:"Lakes, rivers, and weekend beach trips", apply:[{group:"warmCoastal",score:2},{group:"coastal",score:1},{group:"suburban",score:1},{group:"family",score:1}]}
      ]},
      { id:"careerField", prompt:"Which work scene is most attractive?", options:[
        {id:"tech",       label:"Tech and innovation",          apply:[{group:"jobs",score:2},{group:"westCoast",score:2},{group:"premium",score:1}]},
        {id:"creative",   label:"Media, arts, and entertainment", apply:[{group:"creative",score:3},{group:"film",score:2}]},
        {id:"handsOn",    label:"Outdoor, practical, or self-directed work", apply:[{group:"frontier",score:2},{group:"rural",score:1},{group:"independent",score:2}]}
      ]},
      { id:"seasonalMood", prompt:"Which seasonal pattern sounds best?", options:[
        {id:"summer",  label:"Long summers and beach days",  apply:[{group:"warm",score:3},{group:"waterLife",score:1}]},
        {id:"balanced",label:"A little of everything",       apply:[{group:"mild",score:2},{group:"balancedCost",score:1},{group:"family",score:1}]},
        {id:"winter",  label:"Bold winters and dramatic cold", apply:[{group:"cold",score:3},{group:"winterSports",score:2}]}
      ]},
      { id:"socialScene", prompt:"What social scene do you prefer?", options:[
        {id:"festivals", label:"Festivals, music, and nightlife", apply:[{group:"music",score:2},{group:"entertainment",score:2}]},
        {id:"cafes",     label:"Coffee shops, galleries, and local makers", apply:[{group:"creative",score:3},{group:"wellness",score:1}]},
        {id:"small",     label:"Smaller circles and more privacy", apply:[{group:"quiet",score:2},{group:"independent",score:2}]}
      ]},
      { id:"housingVibe", prompt:"Which housing vibe sounds best?", options:[
        {id:"modern",   label:"Modern apartment or condo", apply:[{group:"urban",score:2},{group:"premium",score:1},{group:"westCoast",score:1}]},
        {id:"bungalow", label:"Charming neighborhood home", apply:[{group:"suburban",score:2},{group:"family",score:1},{group:"history",score:1}]},
        {id:"cabin",    label:"Cabin, ranch, or something tucked away", apply:[{group:"frontier",score:2},{group:"adventure",score:2},{group:"quiet",score:1}]}
      ]},
      { id:"weekTrip", prompt:"What kind of weekend trip would you actually take?", options:[
        {id:"surf",   label:"Surf town or beach escape", apply:[{group:"islandCulture",score:3},{group:"warmCoastal",score:4},{group:"surfCulture",score:2},{group:"waterLife",score:1}]},
        {id:"ski",    label:"Ski town or snowy mountain lodge", apply:[{group:"winterSports",score:3},{group:"nature",score:1}]},
        {id:"road",   label:"Open-road trip with wide landscapes", apply:[{group:"desert",score:2},{group:"rural",score:1},{group:"independent",score:1}]}
      ]},
      { id:"values", prompt:"Which value matters most in where you live?", options:[
        {id:"freedom",   label:"Freedom, space, and self-reliance", apply:[{group:"frontier",score:3},{group:"independent",score:2}]},
        {id:"belonging", label:"Belonging and cultural warmth",     apply:[{group:"islandCulture",score:3},{group:"hospitality",score:2}]},
        {id:"mobility",  label:"Access, momentum, and options",      apply:[{group:"jobs",score:2},{group:"urban",score:2}]}
      ]},
      { id:"learning", prompt:"What kind of learning environment appeals to you?", options:[
        {id:"research",  label:"Research hubs and universities", apply:[{group:"collegeTown",score:3},{group:"jobs",score:1}]},
        {id:"craft",     label:"Hands-on traditions and local knowledge", apply:[{group:"history",score:1},{group:"music",score:1},{group:"hospitality",score:1},{group:"frontier",score:1}]},
        {id:"selfMade",  label:"Independent, self-taught path", apply:[{group:"independent",score:3},{group:"rural",score:1}]}
      ]},
      { id:"nightlife", prompt:"What kind of evenings do you want most often?", options:[
        {id:"city",   label:"Late-night city options",   apply:[{group:"urban",score:3},{group:"entertainment",score:1}]},
        {id:"music",  label:"Live music and local venues", apply:[{group:"music",score:3},{group:"foodScene",score:1}]},
        {id:"stars",  label:"Quiet nights under the stars", apply:[{group:"stargazing",score:3},{group:"quiet",score:1}]}
      ]},
      { id:"fitness", prompt:"What movement style fits you best?", options:[
        {id:"ocean",   label:"Swimming, paddling, or beach activity", apply:[{group:"warmCoastal",score:4},{group:"islandCulture",score:2},{group:"surfCulture",score:2},{group:"waterLife",score:2},{group:"wellness",score:1}]},
        {id:"trail",   label:"Hiking, climbing, and mountain days",    apply:[{group:"adventure",score:3},{group:"nature",score:1}]},
        {id:"studio",  label:"Gyms, classes, and structured routines", apply:[{group:"urban",score:1},{group:"suburban",score:2},{group:"wellness",score:1}]}
      ]},
      { id:"identity", prompt:"Which identity marker feels most like you?", options:[
        {id:"global",   label:"Globally connected and diverse", apply:[{group:"urban",score:2},{group:"creative",score:2}]},
        {id:"regional", label:"Deeply tied to local tradition", apply:[{group:"history",score:2},{group:"hospitality",score:1},{group:"islandCulture",score:1}]},
        {id:"wild",     label:"Drawn to the edge of the map",   apply:[{group:"frontier",score:4},{group:"adventure",score:1}]}
      ]},
      { id:"scenery", prompt:"What scenery would you never get tired of?", options:[
        {id:"volcanic", label:"Volcanic coastlines and tropical mountains", apply:[{group:"islandCulture",score:5},{group:"nature",score:1}]},
        {id:"glacial",  label:"Glaciers, fjords, and massive wilderness",   apply:[{group:"frontier",score:5},{group:"nature",score:1}]},
        {id:"classic",  label:"Parks, neighborhoods, and balanced scenery", apply:[{group:"westCoast",score:2},{group:"family",score:1},{group:"suburban",score:1}]}
      ]},
      { id:"story", prompt:"What kind of place do you want your life story to feel like?", options:[
        {id:"cinematic", label:"Ambitious, creative, and cinematic", apply:[{group:"film",score:3},{group:"creative",score:2}]},
        {id:"grounded",  label:"Grounded, steady, and community-first", apply:[{group:"family",score:2},{group:"balancedCost",score:2}]},
        {id:"expedition",label:"Adventurous and a little untamed", apply:[{group:"frontier",score:3},{group:"adventure",score:2}]}
      ]},
      { id:"environment", prompt:"What environment sounds most restorative to you?", options:[
        {id:"reef",   label:"Tropical water and ocean life", apply:[{group:"warmCoastal",score:4},{group:"surfCulture",score:3},{group:"marineLife",score:3},{group:"islandCulture",score:2}]},
        {id:"forest", label:"Forest trails and cool air",    apply:[{group:"ecoLiving",score:2},{group:"nature",score:2},{group:"wellness",score:1}]},
        {id:"open",   label:"Open sky and huge distances",   apply:[{group:"frontier",score:2},{group:"roadTrips",score:2},{group:"stargazing",score:1}]}
      ]},
      { id:"moneyStyle", prompt:"How do you feel about cost of living versus experience?", options:[
        {id:"splurge",  label:"I will pay more for a standout lifestyle", apply:[{group:"luxury",score:3},{group:"premium",score:2}]},
        {id:"middle",   label:"I want a strong balance",                  apply:[{group:"balancedCost",score:3},{group:"family",score:1}]},
        {id:"practical",label:"Value matters a lot",                      apply:[{group:"affordable",score:3},{group:"farmLife",score:1}]}
      ]},
      { id:"publicLife", prompt:"What kind of public life appeals to you?", options:[
        {id:"engaged",   label:"Civic energy and well-run communities", apply:[{group:"civicCulture",score:3},{group:"collegeTown",score:1}]},
        {id:"creative",  label:"Street culture and public expression",  apply:[{group:"creative",score:2},{group:"urban",score:1},{group:"film",score:1}]},
        {id:"lowkey",    label:"Minimal noise and more privacy",        apply:[{group:"quiet",score:2},{group:"independent",score:1},{group:"rural",score:1}]}
      ]},
      { id:"vacationMood", prompt:"Pick the vacation mood you would repeat every year.", options:[
        {id:"resort",    label:"Resort, beach, and sunset dinners", apply:[{group:"warmCoastal",score:4},{group:"islandCulture",score:3},{group:"luxury",score:2},{group:"waterLife",score:1}]},
        {id:"expedition",label:"Remote lodge and wildlife watching", apply:[{group:"frontier",score:3},{group:"marineLife",score:1},{group:"adventure",score:2}]},
        {id:"park",      label:"National parks and scenic drives",   apply:[{group:"nationalParks",score:3},{group:"roadTrips",score:2}]}
      ]},
      { id:"creativeWork", prompt:"What kind of creative output do you connect with most?", options:[
        {id:"film",   label:"Film, content, or visual media", apply:[{group:"film",score:4},{group:"creative",score:1}]},
        {id:"craft",  label:"Handmade goods and local makers", apply:[{group:"creative",score:2},{group:"history",score:1},{group:"ecoLiving",score:1}]},
        {id:"none",   label:"I care more about practical living", apply:[{group:"family",score:1},{group:"affordable",score:1},{group:"farmLife",score:2}]}
      ]},
      { id:"landUse", prompt:"What land use feels most appealing nearby?", options:[
        {id:"coastal", label:"Marinas, beaches, and ocean access", apply:[{group:"warmCoastal",score:4},{group:"marineLife",score:3},{group:"coastal",score:1},{group:"surfCulture",score:1}]},
        {id:"parks",   label:"Protected parks and wilderness",    apply:[{group:"nationalParks",score:3},{group:"nature",score:1}]},
        {id:"fields",  label:"Farms, ranches, and open working land", apply:[{group:"farmLife",score:3},{group:"rural",score:1}]}
      ]},
      { id:"personalRhythm", prompt:"Which personal rhythm feels healthiest to you?", options:[
        {id:"sunrise", label:"Early mornings and outdoor routines", apply:[{group:"wellness",score:2},{group:"nature",score:1},{group:"surfCulture",score:1}]},
        {id:"steady",  label:"Steady routines and dependable systems", apply:[{group:"civicCulture",score:2},{group:"family",score:1},{group:"balancedCost",score:1}]},
        {id:"free",    label:"Flexible days with lots of space",      apply:[{group:"frontier",score:2},{group:"independent",score:2}]}
      ]},
      { id:"heritage", prompt:"Which kind of heritage do you most want around you?", options:[
        {id:"native",   label:"Indigenous roots and land-based tradition", apply:[{group:"islandCulture",score:2},{group:"frontier",score:2},{group:"history",score:1}]},
        {id:"colonial", label:"Historic neighborhoods and old institutions", apply:[{group:"history",score:3},{group:"civicCulture",score:1}]},
        {id:"blended",  label:"A blended mix of newer and older cultures",   apply:[{group:"urban",score:1},{group:"creative",score:2},{group:"foodScene",score:1}]}
      ]},
      { id:"mobility", prompt:"How much motion do you want in your life?", options:[
        {id:"island", label:"One strong home base with intentional travel", apply:[{group:"islandCulture",score:2},{group:"wellness",score:1},{group:"luxury",score:1}]},
        {id:"routes", label:"Road access and constant regional exploring", apply:[{group:"roadTrips",score:3},{group:"desert",score:1}]},
        {id:"local",  label:"Mostly local routines close to home",        apply:[{group:"family",score:2},{group:"suburban",score:1},{group:"quiet",score:1}]}
      ]},
      { id:"wildlife", prompt:"Which wildlife setting sounds most memorable?", options:[
        {id:"whales",  label:"Whales, reefs, and sea turtles",     apply:[{group:"marineLife",score:3},{group:"islandCulture",score:2}]},
        {id:"bears",   label:"Bears, moose, and untouched habitat", apply:[{group:"frontier",score:3},{group:"nationalParks",score:1},{group:"adventure",score:1}]},
        {id:"birds",   label:"Birds, lakes, and changing seasons", apply:[{group:"waterLife",score:1},{group:"mild",score:1},{group:"family",score:1},{group:"nature",score:1}]}
      ]}
    ];

    function shuffle(arr) {
      const out = arr.slice();
      for (let i=out.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [out[i],out[j]]=[out[j],out[i]]; }
      return out;
    }

    const QUESTIONS_PER_ROUND = 5;
    const QUESTION_ROTATION_STORAGE_KEY = "state-match-question-rotation-v2";
    const STATE_GROUP_COUNTS = STATES.reduce(function(map, state) {
      map[state] = 0;
      return map;
    }, {});

    Object.values(GROUPS).forEach(function(states) {
      states.forEach(function(state) {
        STATE_GROUP_COUNTS[state] = (STATE_GROUP_COUNTS[state] || 0) + 1;
      });
    });

    function createQuestionRotation() {
      return {
        order: shuffle(QUESTION_BANK.map(function(question) { return question.id; })),
        cursor: 0
      };
    }

    function readQuestionRotation() {
      try {
        const raw = window.localStorage.getItem(QUESTION_ROTATION_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const validIds = new Set(QUESTION_BANK.map(function(question) { return question.id; }));
        if (!parsed || !Array.isArray(parsed.order) || typeof parsed.cursor !== "number") return null;
        if (
          parsed.order.length !== QUESTION_BANK.length ||
          parsed.order.some(function(id) { return !validIds.has(id); })
        ) {
          return null;
        }
        return {
          order: parsed.order.slice(),
          cursor: Math.max(0, Math.min(parsed.cursor, parsed.order.length))
        };
      } catch (_) {
        return null;
      }
    }

    function writeQuestionRotation(rotation) {
      try {
        window.localStorage.setItem(QUESTION_ROTATION_STORAGE_KEY, JSON.stringify(rotation));
      } catch (_) {
        // Ignore storage write failures and continue in memory.
      }
    }

    function getNextQuestions(count) {
      const byId = new Map(QUESTION_BANK.map(function(question) {
        return [question.id, question];
      }));
      let rotation = readQuestionRotation() || createQuestionRotation();
      const selected = [];

      while (selected.length < count) {
        if (rotation.cursor >= rotation.order.length) {
          rotation = createQuestionRotation();
        }
        const nextId = rotation.order[rotation.cursor];
        rotation.cursor += 1;
        const question = byId.get(nextId);
        if (question) selected.push(question);
      }

      writeQuestionRotation(rotation);
      return selected;
    }

    function getBaseScore(state) {
      if (state === "Hawaii") return 0.45;
      if (state === "Alaska") return 0.45;
      if (state === "California") return 0.35;
      if (state === "Colorado" || state === "Oregon" || state === "Washington") return 0.12;
      return 0;
    }

    function ensureRemoteCandidates(entries, allEntries, limit) {
      const out = entries.slice(0, limit).map(([state, score]) => ({ state, score: +score.toFixed(2) }));
      const remoteStates = ["Alaska", "Hawaii"];
      const cutoffScore = out.length ? out[out.length - 1].score : 0;

      const present = new Set(out.map(r => r.state));
      for (const state of remoteStates) {
        if (present.has(state)) continue;
        const match = allEntries.find(([s]) => s === state);
        if (!match) continue;
        if (match[1] < cutoffScore * 0.9) continue;
        if (!out.length) break;
        const score = +match[1].toFixed(2);
        out[out.length - 1] = { state, score };
        out.sort((a,b) => b.score - a.score);
        present.add(state);
      }
      return out;
    }

    function getGroupWeight(group, score) {
      const states = GROUPS[group];
      if (!states || !states.size) return 0;
      // Broad groups should matter, but not overpower more distinctive signals.
      return score / Math.sqrt(states.size);
    }

    function getBreadthPenalty(state) {
      const groupCount = STATE_GROUP_COUNTS[state] || 0;
      if (groupCount <= 8) return 1;
      return 1 + (groupCount - 8) * 0.045;
    }

    function computeRecs(answers, questions) {
      const scores = new Map(STATES.map(s=>[s, getBaseScore(s)]));
      const matchCounts = new Map(STATES.map(s=>[s, 0]));
      const answerSignature = answers.join("|");
      answers.forEach((aid, idx) => {
        const q = questions[idx]; if (!q) return;
        const sel = q.options.find(o=>o.id===aid); if (!sel) return;
        sel.apply.forEach(({group,score}) => {
          const states = Array.from(GROUPS[group] || []);
          if (!states.length) return;
          const weight = getGroupWeight(group, score);
          states.forEach(function(state) {
            scores.set(state, (scores.get(state) || 0) + weight);
            matchCounts.set(state, (matchCounts.get(state) || 0) + 1);
          });
        });
      });
      const allSorted = [...scores.entries()]
        .map(function([state, score]) {
          const matchCount = matchCounts.get(state) || 0;
          const supportBonus = matchCount > 0 ? Math.min(0.55, matchCount * 0.06) : 0;
          const balancedScore = (score + supportBonus) / getBreadthPenalty(state);
          return [state, +balancedScore.toFixed(4), hashSeed(answerSignature + "::" + state)];
        })
        .sort((a,b)=> b[1] !== a[1] ? b[1] - a[1] : b[2] - a[2])
        .map(([state, score]) => [state, score]);
      return ensureRemoteCandidates(allSorted.slice(0,3), allSorted, 3);
    }

    function hashSeed(input) {
      let h = 2166136261;
      const str = String(input || "");
      for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return (h >>> 0) / 4294967295;
    }

    // ── Quiz rendering ──
    const body    = document.getElementById("quiz-body");
    const backBtn = document.getElementById("quiz-back-btn");
    const nextBtn = document.getElementById("quiz-next-btn");

    let questions = getNextQuestions(QUESTIONS_PER_ROUND);
    let playerName = "";
    let playerGender = "male";
    const answers = [];
    let step = -1;

    function showStep() {
      if (step < 0) {
        // Intro
        body.innerHTML = `
          <div class="qz-step-label">Welcome</div>
          <h2 class="qz-heading">Find your perfect state match</h2>
          <p class="qz-sub">Answer 5 quick questions and we'll match you to a U.S. state — then explore it on the map.</p>
          <div class="qz-field qz-gap-field">
            <label class="qz-label" for="quiz-name-input">Your name</label>
            <input id="quiz-name-input" class="qz-input" type="text" maxlength="40" placeholder="Enter your name" value="${escHtml(playerName)}" autocomplete="off" />
          </div>`;
        body.innerHTML += `
          <div class="qz-field">
            <div class="qz-label">Select your gender</div>
            <div class="qz-checkbox-row">
              <label class="qz-checkbox-option">
                <input type="checkbox" id="quiz-gender-male" value="male" ${playerGender === "male" ? "checked" : ""} />
                Male
              </label>
              <label class="qz-checkbox-option">
                <input type="checkbox" id="quiz-gender-female" value="female" ${playerGender === "female" ? "checked" : ""} />
                Female
              </label>
            </div>
          </div>`;
        const inp = body.querySelector("#quiz-name-input");
        inp?.focus();
        inp?.addEventListener("input", e => { playerName = e.target.value.trim(); nextBtn.disabled = !playerName; });
        const maleChk = body.querySelector("#quiz-gender-male");
        const femaleChk = body.querySelector("#quiz-gender-female");
        const maleLabel = maleChk ? maleChk.closest(".qz-checkbox-option") : null;
        const femaleLabel = femaleChk ? femaleChk.closest(".qz-checkbox-option") : null;
        const syncGender = (g) => {
          playerGender = g;
          if (maleChk) maleChk.checked = g === "male";
          if (femaleChk) femaleChk.checked = g === "female";
          if (maleLabel) maleLabel.classList.toggle("is-selected", g === "male");
          if (femaleLabel) femaleLabel.classList.toggle("is-selected", g === "female");
        };
        maleChk?.addEventListener("change", () => {
          if (maleChk.checked) syncGender("male");
          else syncGender("male");
        });
        femaleChk?.addEventListener("change", () => {
          if (femaleChk.checked) syncGender("female");
          else if (!maleChk?.checked) syncGender("male");
        });
        backBtn.style.display = "none";
        nextBtn.textContent = "Begin";
        nextBtn.disabled = !playerName;
        clearHighlight();
      } else if (step < questions.length) {
        const q = questions[step];
        body.innerHTML = `
          <div class="qz-step-label">Question ${step+1} of ${questions.length}</div>
          <h2 class="qz-heading">${escHtml(q.prompt)}</h2>
          <div class="qz-options">
            ${q.options.map(o=>`
              <button type="button" class="qz-opt${answers[step]===o.id?" selected":""}" data-ans="${o.id}">
                ${escHtml(o.label)}
              </button>`).join("")}
          </div>`;
        body.querySelectorAll(".qz-opt").forEach(b => b.addEventListener("click", () => {
          answers[step] = b.dataset.ans;
          body.querySelectorAll(".qz-opt").forEach(x=>x.classList.toggle("selected",x===b));
          nextBtn.disabled = false;
        }));
        backBtn.style.display = "";
        backBtn.disabled = step === 0;
        nextBtn.textContent = step===questions.length-1 ? "See my match" : "Next";
        nextBtn.disabled = !answers[step];
      } else {
        // Result
        const recs = computeRecs(answers, questions);
        const top = recs[0];
        const vd = visitData()[top.state];
        const demog = demogData()[top.state]?.["2022"];
        const econ  = econData()[top.state];

        // Build extra stats
        const statFmt = v => v != null ? v.toLocaleString() : "—";
        const pctFmt  = v => typeof v==="number" ? (v*100).toFixed(1)+"%" : "—";
        const popFmt  = v => v >= 1e6 ? (v/1e6).toFixed(1)+"M" : v >= 1e3 ? (v/1e3).toFixed(0)+"K" : v?.toString() || "—";

        body.innerHTML = `
          <div class="qz-step-label">Your match</div>
          <h2 class="qz-result-name">${escHtml(playerName)}, your state is</h2>
          <div class="qz-result-state">${escHtml(top.state)}</div>
          <div class="qz-stats-grid">
            ${vd ? `<div class="qz-stat"><span class="qz-stat-val">#${vd.rank}</span><span class="qz-stat-lbl">Visitor rank</span></div>
                    <div class="qz-stat"><span class="qz-stat-val">${statFmt(vd.visitation2024k)}k</span><span class="qz-stat-lbl">Overseas visitors '24</span></div>
                    <div class="qz-stat"><span class="qz-stat-val">${pctFmt(vd.pctChange)}</span><span class="qz-stat-lbl">YoY visitor growth</span></div>` : ""}
            ${demog ? `<div class="qz-stat"><span class="qz-stat-val">${popFmt(demog.population)}</span><span class="qz-stat-lbl">Population (2022)</span></div>` : ""}
            ${econ  ? `<div class="qz-stat"><span class="qz-stat-val">${econ.dominantSector||"—"}</span><span class="qz-stat-lbl">Top industry</span></div>` : ""}
          </div>
          <div class="qz-top3-label">Also consider</div>
          <div class="qz-top3">
            ${recs.slice(1).map(r=>`<span class="qz-runner">${escHtml(r.state)}</span>`).join("")}
          </div>`;

        backBtn.style.display = "";
        backBtn.disabled = true;
        nextBtn.textContent = "Play again";
        nextBtn.disabled = false;

        // Highlight on map
        highlightState(top.state);
        // Place avatar on matched state
        if (playerName) {
          renderStateAvatar(playerName, top.state, {
            avatarKey: playerGender === "female" ? "wahine" : "default",
            source: "state_match"
          });
        }
      }
    }

    backBtn.addEventListener("click", () => {
      if (step > 0) { step--; showStep(); }
      else if (step === 0) { step = -1; showStep(); }
    });

    nextBtn.addEventListener("click", () => {
      if (step < 0) {
        if (!playerName) return;
        step = 0; showStep(); return;
      }
      if (step < questions.length) {
        if (!answers[step]) return;
        step++; showStep(); return;
      }
      // Play again
      questions = getNextQuestions(QUESTIONS_PER_ROUND);
      playerName = ""; playerGender = "male"; answers.length = 0; step = -1;
      showStep();
    });

    showStep();
  })();
