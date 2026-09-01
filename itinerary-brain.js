/* ============================================================
   ITINERARY BRAIN  ·  Bhutan
   Data + pure planning pipeline. No UI, no dependencies, no network.
   Extracted from the Iconic Bhutan Travels / Breathe Bhutan desk.

   USAGE (any site or PWA):
     <script src="itinerary-brain.js"></script>
     const plan = ItineraryBrain.draft(
       "couple, October, festivals, Tiger's Nest, 7 days, she is 68",
       { nights: null, age: null, diff: 3 }   // nulls = trace from text
     );
     // plan = { nights, parse:{traced,flags,pins,weights},
     //          route:['paro',...],
     //          days:[{v,driveH,acts:[{n,hrs}],pool,fest,tak}],
     //          verdicts:{ok,notes,warns}, text }
     const p2 = ItineraryBrain.replan(plan, { removeStop:'trongsa' });
     const p3 = ItineraryBrain.replan(plan, { nights: plan.nights+1 });
     const p4 = ItineraryBrain.replan(plan, { diff: 2, age: 70 });

   Raw parts are also exposed: aiParse, buildRoute, recommend, festFor,
   poolFor, actDiff, checkPlan, legHours, legKm, hrsWord, enroute, fcFmt,
   and the data tables (VAL, WITHIN, FESTCAL, HOTELS, LAND, DEST…).
   The one invariant: no sentence the data tables cannot back.
   ============================================================ */
(function(root){
const GATEWAY={
 paro:{n:'Paro',air:1,to:'paro',hrs:0,km:0,
  d:'Every international flight lands here. The only airport a visitor arrives at.'},
 phuentsholing:{n:'Phuentsholing',to:'thimphu',hrs:6,km:170,
  d:'The main crossing from West Bengal, and the busiest. A permit is arranged on arrival, then about six hours climbing to Thimphu.'},
 gelephu:{n:'Gelephu',to:'trongsa',hrs:10,km:250,
  d:'The central crossing from Assam. A long day north to Trongsa, through subtropical forest that becomes pine somewhere around Zhemgang.'},
 samdrup:{n:'Samdrup Jongkhar',to:null,hrs:null,km:null,east:1,
  d:'The eastern crossing from Assam, three hours from Trashigang. The east is a separate journey \u2014 tell us and we will plan it by hand.'}
};

const VAL={
 paro:{n:'Paro',alt:'2,200 m',see:[
  ["Taktsang, the Tiger's Nest — a three-hour climb, or the tea-house viewpoint",'spirit trails photo',5],
  ['Kyichu Lhakhang — seventh century, still in daily use, and two orange trees in the courtyard that fruit the whole year round','spirit crafts',4],
  ['Rinpung Dzong above the river, reached over the old cantilever bridge — the fortress the Paro tshechu fills every spring','culture photo',3],
  ['The National Museum in the watchtower above the valley','culture crafts',2],
  ['A slow valley walk through paddy and farmhouse country','rest food',2]]},
 thimphu:{n:'Thimphu',alt:'2,320 m',see:[
  ['Buddha Dordenma, looking down the whole valley','spirit photo',4],
  ['Tashichho Dzong at the close of the working day, when the civil servants leave and the monks move back in — the seat of government and the summer residence of the Je Khenpo under one roof','culture photo',3],
  ['The Memorial Chorten, built for the Third King, and busiest at dawn when half of Thimphu walks its circuit before work','spirit culture',3],
  ['The weekend market, if your dates allow','food culture',3],
  ['Cheri or Tango — a forest climb to a working monastery','spirit trails',4],
  ['The school of the thirteen arts, and the textile museum','crafts culture',4],
  ['The takin preserve above town','wild',2]]},
 punakha:{n:'Punakha',alt:'1,250 m',see:[
  ['Punakha Dzong at the meeting of two rivers','culture spirit photo',5],
  ['Chimi Lhakhang, through the fields from Sopsokha','spirit culture',4],
  ['The suspension bridge and the climb to Khamsum Yulley','trails photo',3],
  ['Warm-valley rice terraces, and time by the water','rest food',2]]},
 phobjikha:{n:'Phobjikha',alt:'3,000 m',see:[
  ['Gangtey Gonpa above the marsh','spirit culture',4],
  ['The black-necked crane centre and the valley nature trail','wild rest',5],
  ['Potato fields, dwarf bamboo, and a great deal of sky','rest photo',3]]},
 trongsa:{n:'Trongsa',alt:'2,200 m',see:[
  ['Trongsa Dzong, the longest fortress in the country','culture photo',4],
  ['Ta Dzong, the watchtower museum of the royal line','culture',3]]},
 bumthang:{n:'Bumthang',alt:'2,600 m',see:[
  ['Jakar Dzong and the Chokhor valley temples','culture spirit',4],
  ['Kurjey and Jambay Lhakhang, among the oldest in Bhutan','spirit culture',5],
  ['Tamshing, founded by Pema Lingpa himself','spirit crafts',3],
  ['Mebar Tsho, the burning lake in its gorge','spirit photo',3],
  ['The Tang valley, wide and almost entirely unhurried','offbeat rest',4],
  ['Ura, the highest village cluster in Bumthang','offbeat culture',4]]},
 haa:{n:'Haa',alt:'2,700 m',see:[
  ['The Chele La at 3,988 m — the highest road in the kingdom','offbeat trails photo',5],
  ['Juneydrak hermitage on its cliff, without the queue','offbeat spirit',5],
  ['Lhakhang Karpo and Lhakhang Nagpo, white temple and black','spirit culture',3]]}
};

const DEST=[
{id:"paro",v:"v1",name:"Paro",tag:"2,200 m",k:"Western Bhutan",
 blurb:"First valley, first breath — the airport, the rice terraces, and the cliff that holds the Tiger's Nest.",
 intro:["Almost everyone meets Bhutan in Paro. The plane banks between ridgelines, wheels touch down beside willow trees, and suddenly the pace of the outside world falls away. The valley is wide and gentle: farmhouses with painted lintels, archery grounds, a single easy-going main street.","High above it all hangs Taktsang — the Tiger's Nest — pinned to a granite wall nine hundred metres over the fields. However many photographs you have seen, the first real glimpse still stops conversation."],
 sights:[["Taktsang (Tiger's Nest)","The cliff monastery every traveller climbs to — allow half a day."],["Rinpung Dzong","Paro's riverside fortress, alive with monks and morning light."],["Ta Dzong / National Museum","A round watchtower turned treasury of Bhutanese art."],["Kyichu Lhakhang","A serene 7th-century temple ringed by prayer wheels."],["Drukgyel Dzong","Atmospheric ruins that once watched the old Tibet road."]],
 when:"March–May and September–November",whenNote:"Clear skies, festival season, and perfect hiking weather.",
 getting:"Fly straight into Paro International Airport — the country's only one — on Drukair or Bhutan Airlines."},
{id:"thimphu",v:"v2",name:"Thimphu",tag:"2,320 m",k:"The Capital",
 blurb:"A capital with monks and ministries, weekend markets and espresso — and not one traffic light.",
 intro:["Thimphu is where the kingdom thinks out loud. Government, monarchy and the central monk body all share this valley, yet the city has famously never installed a traffic light — a white-gloved officer still conducts the main junction by hand.","Give it a full day and it repays you: incense drifting from the Memorial Chorten, farmers weighing red rice at the weekend market, students bent over thangka paintings at the arts school, and the vast golden Buddha watching it all from the ridge."],
 sights:[["Buddha Dordenma","A 51-metre gilded Buddha with 125,000 smaller figures inside."],["Tashichho Dzong","Seat of the throne room and the central monastic body."],["National Memorial Chorten","Circled by devotees from first light until dark."],["Centenary Farmers Market","Chillies, ferns, honey and mountain cheese by the sack."],["Motithang Takin Preserve","Home of the takin, Bhutan's improbable national animal."]],
 when:"Any month",whenNote:"September–October adds the capital's great tshechu.",
 getting:"An easy one-hour river-valley drive from Paro."},
{id:"punakha",v:"v3",name:"Punakha",tag:"1,280 m",k:"The Old Capital",
 blurb:"Warm air, two rivers, and the fortress many call the most beautiful building in the Himalaya.",
 intro:["Drop from the Dochula pass and the air changes: Punakha sits low enough for bananas, bougainvillea and winter rice. This gentle valley ran the country for three centuries and still hosts the monastic body every winter.","Where its two rivers braid together stands Punakha Dzong — the Palace of Great Happiness — white walls, golden roofs, jacaranda blossom in spring. Bhutanese themselves travel here just to see it."],
 sights:[["Punakha Dzong","The 1637 fortress at the meeting of the Pho Chhu and Mo Chhu."],["Chimi Lhakhang","The Divine Madman's hilltop temple, reached through mustard fields."],["Suspension Bridge","A long, prayer-flag-wrapped crossing above jade water."],["Khamsum Yulley Chorten","A short climb to a chorten with the valley at your feet."],["Mo Chhu Rafting","Gentle rapids past the dzong's own walls."]],
 when:"October–April",whenNote:"Pleasantly warm while higher valleys turn cold.",
 getting:"About 2.5 hours from Thimphu over the 3,100 m Dochula Pass."},
{id:"wangdue",v:"v4",name:"Wangdue Phodrang",tag:"1,350 m",k:"Central Gateway",
 blurb:"The ridge-top district where the road east truly begins.",
 intro:["Every journey into central Bhutan passes beneath Wangdue's dzong, rebuilt with extraordinary care after a fire in 2012 and once again commanding the meeting of two rivers from its long ridge.","Pause here for the clustered stone village of Rinchengang — one of the country's oldest — and for the bamboo-work and slate carving the district's artisans are known for."],
 sights:[["Wangdue Phodrang Dzong","A 17th-century ridge fortress, painstakingly restored."],["Rinchengang Village","Ancient terraced houses stacked shoulder to shoulder."],["Punatsang Chhu","Broad river views along the east–west highway."],["Bamboo Craft Stalls","The district's signature weaving, sold roadside."]],
 when:"October–April",whenNote:"Autumn brings the local tshechu and its famous ox dance.",
 getting:"Thirty minutes beyond Punakha on the national highway."},
{id:"phobjikha",v:"v1",name:"Phobjikha Valley",tag:"3,000 m",k:"Valley of Cranes",
 blurb:"A high glacial bowl that empties of summer and fills with cranes.",
 intro:["Phobjikha is a place you hear before you see: wind in the pines, then — in winter — the strange trumpeting of black-necked cranes drifting over the marsh. Each November the endangered birds arrive from Tibet, and the whole valley arranges itself around their comfort; even power lines run underground here.","Gangtey Monastery presides from a wooded spur, and an easy trail loops the valley floor past potato farms, grazing cattle and utter quiet."],
 sights:[["Gangtey Monastery","Historic seat of the Pema Lingpa tradition."],["Crane Information Centre","Scopes and hides over the roosting marsh."],["Gangtey Nature Trail","Two unhurried hours across the open valley."],["Festival Ground","Crane dances fill the courtyard every 11 November."]],
 when:"Late October–mid February",whenNote:"Crane season; spring brings wildflowers instead.",
 getting:"Roughly 3 hours from Punakha via the Lawa La pass."},
{id:"trongsa",v:"v5",name:"Trongsa",tag:"2,200 m",k:"Seat of Kings",
 blurb:"The largest dzong in the kingdom, and the balcony of the monarchy.",
 intro:["Trongsa appears long before you arrive — a white fortress poured down a ridge above the Mangde gorge, visible across the valley for an hour of hairpin road. For centuries no one crossed the country without passing through its gates.","Bhutan's kings still take the title of Trongsa Penlop before the throne, and the old watchtower above the dzong now tells the dynasty's story as a superb small museum."],
 sights:[["Trongsa Dzong","Bhutan's largest fortress, stacked down the hillside."],["Ta Dzong Museum","The watchtower, devoted to the royal house."],["Mangde Gorge","Sheer river scenery on the western approach."],["Chendebji Chorten","A whitewashed Nepali-style stupa on the highway."]],
 when:"March–May and September–November",whenNote:"For clear passes on the mountain roads.",
 getting:"About 4 hours east of Phobjikha over the Pele La (3,420 m)."},
{id:"bumthang",v:"v4",name:"Bumthang",tag:"2,600–2,800 m",k:"Sacred Heartland",
 blurb:"Four valleys of temples, buckwheat, honey — and the country's oldest stories.",
 intro:["If western Bhutan is the kingdom's face, Bumthang is its memory. Across four adjoining valleys stand the temples where Guru Rinpoche subdued demons and where the saint Pema Lingpa pulled treasures from a burning lake — stories locals recount as family history, not legend.","It is also simply delicious: buckwheat pancakes, wildflower honey, farmhouse cheese, and a much-loved local brewery to finish the day."],
 sights:[["Jambay Lhakhang","One of the kingdom's two oldest temples, from the 7th century."],["Kurjey Lhakhang","Where the Guru left his body-print in rock."],["Jakar Dzong","The 'Castle of the White Bird' above the main valley."],["Tamzhing Lhakhang","Pema Lingpa's own monastery, murals intact."],["Membartsho","The Burning Lake gorge, hung with prayer flags."]],
 when:"September–November",whenNote:"Late October adds the fire-blessing festival at Jambay Lhakhang.",
 getting:"2.5 hours beyond Trongsa; short domestic flights also land at Bathpalathang."},
{id:"haa",v:"v2",name:"Haa Valley",tag:"2,700 m",k:"The Quiet One",
 blurb:"Closed to visitors until 2002 — and still blissfully overlooked.",
 intro:["Haa hides behind the ridge west of Paro, a narrow valley of buckwheat and potatoes that only opened to travellers in 2002 and still sees a fraction of the kingdom's visitors. Its guardians are a pair of temples — one white, one black — rooted in the valley's oldest legends.","Getting there is half the reward: the road crests Chele La at 3,988 metres, the highest drivable pass in Bhutan, where thousands of prayer flags stream against a wall of snow peaks."],
 sights:[["Lhakhang Karpo & Nagpo","The valley's paired white and black temples."],["Chele La Pass","Bhutan's highest road pass, festooned with flags."],["Katsho Village Paths","Farm-lane walks without another traveller in sight."],["Haa Summer Festival","Highland herder culture celebrated each July."]],
 when:"April–October",whenNote:"July for the summer festival; autumn for pass views.",
 getting:"Two hours from Paro across the spectacular Chele La."}];

const LAND=[
{id:"tigers-nest",v:"v1",name:"Tiger's Nest (Taktsang)",where:"Paro Valley",
 intro:["Nine hundred metres above the valley floor, the white walls of Taktsang grip a sheer granite face. The story runs that Guru Rinpoche arrived here in the 8th century on the back of a flying tigress and meditated in the cave for three years, three months, three weeks and three days; the temples rose around that cave in 1692.","The path up winds through blue pine and rhododendron, past a tea-house lookout and a waterfall crossing, to the chapels themselves. Count on four to five hours round trip — and on remembering them for the rest of your life."],
 tips:["Set off by 7–8 am for cool air and quiet trail","Ponies are available for the lower half","Shoulders and knees covered; cameras stay in lockers at the gate","A hot-stone bath afterwards is the local reward"],
 alt:{n:"The Bumdra trail — arriving from above",
  p:["Almost everybody reaches Taktsang the same way: from the car park, upward, in the middle of the morning, with everybody else. There is another way, and it runs in the opposite direction.",
     "The Bumdra trek climbs from Sang Choekhor through blue pine to a meadow at about 3,800 metres and camps there for the night — above the monastery rather than below it. Next morning you descend onto Taktsang from the ridge, reaching the roofs before the day walkers are halfway up, and seeing it from an angle you cannot reach without having slept up there.",
     "Two days rather than one, a night under canvas, and the same monastery at the end of it."],
  ask:"Bumdra — arriving at Taktsang from above",
  tour:"bumdra"}},
{id:"punakha-dzong",v:"v3",name:"Punakha Dzong",where:"Punakha",
 intro:["Its formal name means the Palace of Great Happiness, and it earns it. Raised in 1637 where two rivers meet, this was the seat of Bhutan's government for three hundred years and remains the winter home of the central monastic body.","Coronations and the royal wedding were held within these walls. Come in spring, when jacaranda blooms lilac against the whitewash, or late winter for the festival week."],
 tips:["Enter across the traditional cantilever bridge","Late Feb–March for the drubchen; spring for jacaranda","Photograph the courtyards freely; not the chapel interiors"]},
{id:"buddha-dordenma",v:"v2",name:"Buddha Dordenma",where:"Kuensel Phodrang, Thimphu",
 intro:["Fifty-one and a half metres of bronze and gold, seated in meditation above the capital — among the largest Buddha figures on earth, completed in 2015. Inside the three-storey throne sit one hundred and twenty-five thousand smaller gilded Buddhas.","The surrounding ridge is now a nature park of easy trails and the best sunset panorama of the Thimphu valley."],
 tips:["Mornings give the clearest valley views","Pair with Changangkha temple and the takin preserve","Shoes off and shoulders covered inside the hall"]},
{id:"dochula",v:"v4",name:"Dochula Pass",where:"Thimphu–Punakha road · 3,100 m",
 intro:["The highway east crests this saddle amid one hundred and eight memorial chortens, built to honour soldiers lost in 2003 — a place of remembrance that has become the country's favourite viewpoint.","In clear weather, most reliably from October to February, the pass unrolls a 180-degree wall of Himalayan snow peaks, crowned by Gangkhar Puensum: at 7,570 metres, the highest unclimbed mountain on the planet."],
 tips:["Tea and biscuits at the pass cafeteria are a ritual","Winter mornings give the surest views","Climb five minutes to the hilltop temple above the chortens"]},
{id:"kyichu",v:"v5",name:"Kyichu Lhakhang",where:"Paro",
 intro:["Tradition counts Kyichu among one hundred and eight temples raised in a single day in the 7th century to pin down a land-spanning demoness — this one anchoring her left foot. It is one of the two oldest temples in the kingdom.","Inside sits a revered ancient image of the Buddha; outside, elderly devotees circle the prayer wheels, and the courtyard's orange trees are said never to be without fruit."],
 tips:["Ten minutes from Paro town — pair with the dzong","Walk clockwise; spin the wheels as you go","A calm counterpoint before or after Taktsang"]},
{id:"chimi",v:"v6",name:"Chimi Lhakhang",where:"Punakha Valley",
 intro:["A twenty-five-minute stroll through rice and mustard fields ends at this small hilltop temple of Drukpa Kunley — the 15th-century 'Divine Madman' whose scandalous humour carried serious teaching, and whose memory Bhutan holds with enormous affection.","Couples come from across the country for blessings of fertility, and the walk itself, past farmhouses painted with the saint's protective symbols, is half the pleasure."],
 tips:["Combine with Punakha Dzong in one easy day","Flat and gentle — suitable for every age","Let your guide tell the Madman's stories properly"]},
{id:"trongsa-dzong",v:"v2",name:"Trongsa Dzong",where:"Trongsa",
 intro:["The greatest fortress in the kingdom spills down a ridge above the Mangde gorge, so perfectly placed that all east–west traffic once passed through its corridors — and paid for the privilege.","The first two kings ruled from here, and the crown prince still holds the governorship of Trongsa before accession. The watchtower above now houses a first-class museum of the dynasty."],
 tips:["Leave a full hour for the Ta Dzong museum","The classic photo is from the viewpoint on the western approach","A natural overnight stop on the drive east"]},
{id:"gangtey-gonpa",v:"v1",name:"Gangtey Monastery",where:"Phobjikha Valley",
 intro:["From a wooded spur at the head of the crane marsh, Gangtey Gonpa has anchored the Pema Lingpa tradition in western Bhutan since the 17th century, its recent restoration a masterclass of traditional craft.","Arrive here first: the valley opens below you, the nature trail starts at the gate, and each 11 November the crane festival fills the courtyard."],
 tips:["Begin the valley trail from the monastery hill","11 November for the festival in its courtyard","Slow down for the carving and murals inside"]}];

const FESTCAL=[
{n:"Lhamoi Dromchhen",v:"Trongsa Dzong",d:"Trongsa",s:"2026-02-22",e:"2026-02-24",c:"Religious Tshechu"},
{n:"Punakha Dromchoe",v:"Punakha Dzong",d:"Punakha",s:"2026-02-24",e:"2026-02-26",c:"Religious Tshechu",star:1,
 charm:"Not a tshechu but a dromchoe — a re-enactment of the 17th-century battle against Tibetan forces, with the pazaps, the militia, in full armour. Older and stranger than the dance festivals, and it runs straight into the tshechu."},
{n:"Punakha Tshechu",v:"Punakha Dzong",d:"Punakha",s:"2026-02-27",e:"2026-03-01",c:"Religious Tshechu",star:1,
 charm:"Three days of cham in the courtyard of the most beautiful dzong in the country, where the Mo Chhu and Pho Chhu meet. February is warm in Punakha at 1,242 m while the passes above are still frozen."},
{n:"Tharpaling Thongdrol",v:"Tharpaling Lhakhang, Chumi",d:"Bumthang",s:"2026-03-03",e:"2026-03-03",c:"Religious Tshechu"},
{n:"Tangsibi Mani",v:"Tangsibi Lhakhang, Ura",d:"Bumthang",s:"2026-03-04",e:"2026-03-06",c:"Religious Tshechu"},
{n:"Chhorten Kora",v:"Chorten Kora",d:"Trashiyangtse",s:"2026-03-03",e:"2026-03-19",c:"Religious Tshechu",
 charm:"Two separate kora days, a fortnight apart. Pilgrims walk the great white stupa through the night, and Dakpa people cross from Arunachal Pradesh to join them."},
{n:"Gomphukora",v:"Gom Kora Lhakhang",d:"Trashiyangtse",s:"2026-03-26",e:"2026-03-28",c:"Religious Tshechu",star:1,
 charm:"Around a rock where Guru Rinpoche is said to have subdued a demon. Young people from across the east come to circumambulate through the night — and, traditionally, to find someone."},
{n:"Talo Tshechu",v:"Talo Gonpa",d:"Punakha",s:"2026-03-26",e:"2026-03-28",c:"Religious Tshechu",
 charm:"Small, hill-top and almost entirely local. Two hours from Thimphu and a world away from the crowds at Paro the same week."},
{n:"Gasa Tshechu",v:"Gasa Dzong",d:"Gasa",s:"2026-03-26",e:"2026-03-28",c:"Religious Tshechu"},
{n:"Zhemgang Tshechu",v:"Zhemgang Dzong",d:"Zhemgang",s:"2026-03-26",e:"2026-03-28",c:"Religious Tshechu"},
{n:"Paro Tshechu",v:"Rinpung Dzong",d:"Paro",s:"2026-03-29",e:"2026-04-02",c:"Religious Tshechu",star:2,
 charm:"The largest spring festival in Bhutan. The Guru Thongdrel — a silk applique thangka several storeys high — is unfurled before dawn on the final morning and rolled away before the sun can touch it. Thousands come. Book flights nine months out."},
{n:"Rhododendron Festival",v:"Lamperi Botanical Park",d:"Thimphu",s:"2026-04-22",e:"2026-04-24",c:"Eco-Cultural",tbc:1,
 charm:"Forty-six species in bloom along the Dochula ridge. Dates not yet confirmed by the Department."},
{n:"Domkhar Tshechu",v:"Domkhar, Chumi",d:"Bumthang",s:"2026-04-26",e:"2026-04-28",c:"Religious Tshechu"},
{n:"Ura Yakchoe",v:"Ura Lhakhang",d:"Bumthang",s:"2026-04-28",e:"2026-05-02",c:"Religious Tshechu",star:1,
 charm:"The highest of the Bumthang valleys at about 3,100 m, and a sacred image brought out only for this. Villagers picnic in the field beside the temple in their best kira and gho for five days."},
{n:"Nimalung Tshechu",v:"Nimalung Dratshang, Chumi",d:"Bumthang",s:"2026-06-22",e:"2026-06-24",c:"Religious Tshechu",
 charm:"Monsoon season, so almost no visitors — and it runs into Kurjey the day it ends."},
{n:"Kurjey Tshechu",v:"Kurjey Lhakhang, Choekhor",d:"Bumthang",s:"2026-06-24",e:"2026-06-24",c:"Religious Tshechu",
 charm:"One day, at the temple built around the cave where Guru Rinpoche left the imprint of his body in the rock."},
{n:"Tour of the Dragon",v:"Bumthang to Thimphu",d:"Bumthang",s:"2026-09-05",e:"2026-09-05",c:"Sports & Adventure",star:1,
 charm:"268 km in one day, over four passes above 3,000 m. Widely called the hardest one-day mountain bike race in the world. Riders start in the dark and the fastest finish after nightfall."},
{n:"Thimphu Drubchen",v:"Tashichho Dzong",d:"Thimphu",s:"2026-09-17",e:"2026-09-17",c:"Religious Tshechu",
 charm:"The older, quieter ceremony that precedes the tshechu by four days."},
{n:"Wangdue Tshechu",v:"Wangduephodrang",d:"Wangdue Phodrang",s:"2026-09-19",e:"2026-09-21",c:"Religious Tshechu"},
{n:"Tamshing Phala Chhoepa",v:"Tamshing Lhakhang",d:"Bumthang",s:"2026-09-21",e:"2026-09-23",c:"Religious Tshechu",
 charm:"At the monastery Pema Lingpa built himself in 1501, still home to around a hundred Nyingma monks."},
{n:"Thimphu Tshechu",v:"Tashichho Dzong",d:"Thimphu",s:"2026-09-21",e:"2026-09-23",c:"Religious Tshechu",star:2,
 charm:"The largest autumn festival, and the capital effectively stops for it. The Dance of the Black Hats and the Dance of the Terrifying Deities are the ones people come for. Clear September skies make it the best-photographed festival in the country."},
{n:"Gangtey Tshechu",v:"Gangtey Gonpa",d:"Phobjikha",s:"2026-09-24",e:"2026-09-26",c:"Religious Tshechu",
 charm:"Above the crane marsh at 3,000 m, with the thongdrel unfurled on the last day."},
{n:"Thangbi Mewang",v:"Thangbi Lhakhang, Choekhor",d:"Bumthang",s:"2026-09-26",e:"2026-09-27",c:"Religious Tshechu",
 charm:"The fire blessing — villagers run beneath a burning gate to be cleansed for the year ahead."},
{n:"Jhomolhari Mountain Festival",v:"Dangochong",d:"Thimphu",s:"2026-10-14",e:"2026-10-15",c:"Eco-Cultural",star:1,
 charm:"Held at 4,080 m under Bhutan's most sacred peak, to celebrate the snow leopard. You have to trek in — which is the point."},
{n:"Jakar Tshechu",v:"Jakar Dzong, Choekhor",d:"Bumthang",s:"2026-10-18",e:"2026-10-21",c:"Religious Tshechu"},
{n:"Pemagatshel Tshechu",v:"Pemagatshel Dzong",d:"Pemagatshel",s:"2026-10-18",e:"2026-10-21",c:"Religious Tshechu"},
{n:"Haa Tshechu",v:"Lhakhang Karpo",d:"Haa",s:"2026-10-19",e:"2026-10-21",c:"Religious Tshechu",
 charm:"At the White Temple in the valley over the Chele La. Haa sees fewer visitors than anywhere else in the west."},
{n:"Chhukha Tshechu",v:"Chhukha Dzong",d:"Chhukha",s:"2026-10-19",e:"2026-10-21",c:"Religious Tshechu"},
{n:"Dechenphu Tshechu",v:"Dechenphu Lhakhang",d:"Thimphu",s:"2026-10-21",e:"2026-10-21",c:"Religious Tshechu"},
{n:"Jambay Lhakhang Drup",v:"Jambay Lhakhang, Choekhor",d:"Bumthang",s:"2026-10-26",e:"2026-10-29",c:"Religious Tshechu",star:2,
 charm:"The most extraordinary festival in Bhutan. At a temple founded in the 7th century, the Mewang fire ceremony runs at midnight, and the Tercham — the naked dance — is performed in darkness by masked men for fertility. No photographs. Nothing else in the calendar is like it."},
{n:"Prakhar Duchhoed",v:"Prakhar Lhakhang, Chumi",d:"Bumthang",s:"2026-10-27",e:"2026-10-29",c:"Religious Tshechu"},
{n:"Black-Necked Crane Festival",v:"Gangtey Gonpa, Phobjikha",d:"Phobjikha",s:"2026-11-11",e:"2026-11-11",c:"Eco-Cultural",star:2,
 charm:"One day, in the courtyard of Gangtey Gonpa, to mark the cranes' return from Tibet. Schoolchildren dance dressed as cranes. Several hundred birds are on the marsh below. Held every 11 November."},
{n:"Goenpai Drupchen",v:"Trongsa Dzong",d:"Trongsa",s:"2026-11-14",e:"2026-11-16",c:"Religious Tshechu"},
{n:"Mongar Tshechu",v:"Mongar Dzong",d:"Mongar",s:"2026-11-17",e:"2026-11-19",c:"Religious Tshechu"},
{n:"Phuntsholing Tshechu",v:"Phuntsholing",d:"Chhukha",s:"2026-11-17",e:"2026-11-19",c:"Religious Tshechu"},
{n:"Trashigang Tshechu",v:"Trashigang Dzong",d:"Trashigang",s:"2026-11-18",e:"2026-11-20",c:"Religious Tshechu",
 charm:"The largest festival in the far east, and a nine-hour drive beyond Bumthang. Needs at least ten days."},
{n:"Jambay Lhakhang Singye Cham",v:"Jambay Lhakhang, Choekhor",d:"Bumthang",s:"2026-11-24",e:"2026-11-24",c:"Religious Tshechu"},
{n:"Nalakhar Tshechu",v:"Ngaa Lhakhang, Choekhor",d:"Bumthang",s:"2026-11-24",e:"2026-11-26",c:"Religious Tshechu"},
{n:"Druk Wangyel Tshechu",v:"Dochula",d:"Thimphu",s:"2026-12-13",e:"2026-12-13",c:"Religious Tshechu",star:1,
 charm:"Danced not by monks but by the Royal Bhutan Army, at 3,100 m among the 108 chortens, with the eastern Himalaya behind them on a clear December morning."},
{n:"Trongsa Tshechu",v:"Trongsa Dzong",d:"Trongsa",s:"2026-12-17",e:"2026-12-21",c:"Religious Tshechu",
 charm:"In the longest dzong in the country, dropping down its ridge above the Mangde Chhu gorge. Thongdrel on the last day."},
{n:"Lhuentse Tshechu",v:"Lhuentse Dzong",d:"Lhuentse",s:"2026-12-17",e:"2026-12-21",c:"Religious Tshechu"},
{n:"Samdrupjongkhar Tshechu",v:"Samdrupjongkhar",d:"Samdrup Jongkhar",s:"2026-12-22",e:"2026-12-24",c:"Religious Tshechu"},
{n:"Nabji Lhakhang Drup",v:"Nabji Lhakhang, Nabji",d:"Trongsa",s:"2026-12-24",e:"2026-12-26",c:"Religious Tshechu",
 charm:"Reached on foot through subtropical forest in Jigme Singye Wangchuck National Park. Among the least visited festivals with a published date."}
];

const fcD=s=>new Date(s+'T00:00:00');

function fcFmt(s,e){
 const a=fcD(s),b=fcD(e);
 if(s===e)return a.getDate()+' '+FCMON[a.getMonth()];
 if(a.getMonth()===b.getMonth())return a.getDate()+'–'+b.getDate()+' '+FCMON[a.getMonth()];
 return a.getDate()+' '+FCMON[a.getMonth()]+' – '+b.getDate()+' '+FCMON[b.getMonth()];
}

const ROADORDER=['haa','paro','thimphu','punakha','phobjikha','trongsa','bumthang'];

const HOP={'paro|thimphu':1,'thimphu|punakha':3,'punakha|phobjikha':2.5,
 'phobjikha|trongsa':3,'trongsa|bumthang':2.5,'paro|haa':2,'thimphu|haa':3.5,
 'punakha|trongsa':4.5,'phobjikha|bumthang':5,
 /* the long ways home, measured on the Lateral Road */
 'punakha|paro':4,'phobjikha|paro':6,'trongsa|paro':8.5,'bumthang|paro':10.5,
 'haa|thimphu':3.5,'bumthang|thimphu':9.5,'trongsa|thimphu':7.5};

const HOPKM={
 'haa|paro':65, 'paro|thimphu':54, 'thimphu|punakha':72,
 'punakha|phobjikha':78, 'phobjikha|trongsa':130, 'trongsa|bumthang':68
};

function legHours(a,b){
 if(a===b)return 0;
 const direct=hop(a,b);
 const ia=ROADORDER.indexOf(a), ib=ROADORDER.indexOf(b);
 if(ia<0||ib<0)return direct||null;
 let sum=0, step=ia<ib?1:-1;
 for(let i=ia;i!==ib;i+=step){
  const h=hop(ROADORDER[i],ROADORDER[i+step]);
  if(!h)return direct||null;
  sum+=h;
 }
 return direct?Math.min(direct,sum):sum;
}

function legKm(a,b){
 if(a===b)return 0;
 const ia=ROADORDER.indexOf(a), ib=ROADORDER.indexOf(b);
 if(ia<0||ib<0)return null;
 let sum=0, step=ia<ib?1:-1;
 for(let i=ia;i!==ib;i+=step){
  const a2=ROADORDER[i], b2=ROADORDER[i+step];
  const k=HOPKM[a2+'|'+b2]||HOPKM[b2+'|'+a2];
  if(!k)return null;
  sum+=k;
 }
 return sum;
}

const hrsWord=n=>n<=0.75?'half an hour':(n<1.25?'an hour':(n%1?n+' hours':n+' hours'));

const ENROUTE={
 'paro|thimphu':[
  ['Tachog Lhakhang','15 min','The iron chain bridge, fifteen kilometres out of Paro. Thangtong Gyalpo forged the links in the fifteenth century.'],
  ['Chuzom confluence','10 min','Where the Paro and Thimphu rivers meet, with three chortens in three different styles \u2014 Bhutanese, Tibetan and Nepali.']],
 'thimphu|punakha':[
  ['Dochu La','40 min','The 108 chortens at 3,100 m, and the eastern Himalaya behind them on a clear morning.'],
  ['Lamperi Botanical Park','1h','Forty-six rhododendron species below the pass. Best late April.']],
 'punakha|phobjikha':[
  ['Chimi Lhakhang','1h','The Divine Madman\u2019s temple, twenty minutes on foot from the road through the fields.'],
  ['Wangdue Phodrang','30 min','The dzong on its ridge above the Punatsangchhu, and the last town before the pass.']],
 'phobjikha|trongsa':[
  ['Pele La','20 min','3,420 m, and the divide between west and central Bhutan. Yak herders on the pass in summer.'],
  ['Chendebji Chorten','20 min','A Nepali-style stupa in a river bend, built in the eighteenth century to pin down a demon.']],
 'trongsa|bumthang':[
  ['Yotong La','20 min','3,425 m. The Bumthang side is a different climate to the Trongsa side.'],
  ['Chumey weaving village','45 min','Yathra \u2014 the woollen strip-weave that only Bumthang makes.']],
 'paro|haa':[
  ['Chele La','40 min','The highest motorable point in Bhutan at 3,988 m, with ten thousand prayer flags along the ridge.'],
  ['Kila Nunnery','1h','Cut into the cliff below the pass, and reached only on foot.']]
};

function enroute(a,b){
 if(!a||!b||a===b)return [];
 return ENROUTE[a+'|'+b]||ENROUTE[b+'|'+a]||[];
}

const WITHIN={
 paro:[
  {n:'Chele La and the Haa side',hrs:4,
   what:'Up to the highest motorable point in the country at 3,988 m, prayer flags the whole length of the ridge, and Kila Nunnery cut into the cliff below. Down the far side into Haa if you want the valley, or turn round at the pass.'},
  {n:'Upper Paro valley',hrs:3,
   what:'Drukgyel Dzong at the head of the valley, the road toward Jomolhari base, and Kyichu Lhakhang on the way back — seventh century, and two orange trees that fruit all year.'},
  {n:'Zuri Dzong walk',hrs:3,
   what:'A quieter climb than Taktsang with almost nobody on it: up through pine above the museum, the whole valley below, and the airport runway a thin grey line in the middle of it.'}],
 thimphu:[
  {n:'Cheri and Tango',hrs:5,
   what:'Drive to the head of the valley at Dodena, cross the river on a covered bridge, and climb an hour to Cheri — founded 1620, and monks have kept three-year retreats there ever since. Tango, the Buddhist university, is the next spur along.'},
  {n:'Dochula and back',hrs:4,
   what:'Out to the pass at 3,100 m for the 108 chortens and the whole eastern Himalaya on a clear morning, then back down for lunch. The walk up to Lungchutse adds four hours if you want it.'},
  {n:'Motithang and the city',hrs:3,
   what:'The takin preserve, the school of the thirteen arts, the weekend market if the day is right, and Tashichho Dzong at the close of the working day.'}],
 punakha:[
  {n:'Khamsum Yulley and the Mo Chhu',hrs:4,
   what:'A swaying suspension bridge, then an hour up through rice terraces to the chorten the Queen Mother spent nine years building. The river below is warm enough to sit beside afterwards.'},
  {n:'Chimi Lhakhang and the mustard fields',hrs:3,
   what:'Twenty minutes on foot from Sopsokha between farmhouses painted with what the guidebooks call fertility symbols, out to the temple of the Divine Madman.'},
  {n:'Talo and Nobgang',hrs:4,
   what:'Up the hill above Punakha to two villages most itineraries drive straight past — terraced, quiet, and with a view back down the whole valley.'}],
 phobjikha:[
  {n:'The Gangtey Nature Trail',hrs:3,
   what:'Down from the monastery through meadow and dwarf bamboo to Khewa Lhakhang, an hour and a half almost all downhill, with the marsh open on your left the whole way.'},
  {n:'The crane roost at dawn and dusk',hrs:3,
   what:'The Black-Necked Crane Centre has the telescopes trained on the roosting grounds. Between November and February there are several hundred birds out there.'}],
 bumthang:[
  {n:'The Tang valley and Ogyen Choling',hrs:6,
   what:'Out to the widest and least visited of the four Bumthang valleys, and up to a fifteenth-century manor still held by the same family — now a museum of how a noble household actually lived.'},
  {n:'Ura village',hrs:5,
   what:'The highest of the Bumthang clusters at about 3,100 m: stone houses shoulder to shoulder around a central lane, barley in terraces, and a dialect the next valley cannot quite follow.'},
  {n:'Chokhor temple circuit',hrs:4,
   what:'Kurjey, Jambay and Tamshing within a few kilometres of each other — the oldest religious ground in the country, walkable between if the weather is kind.'},
  {n:'Mebar Tsho, the Burning Lake',hrs:3,
   what:'Not a lake but a dark pool in a gorge, where Pema Lingpa is said to have gone into the water holding a butter lamp and come out with it still burning.'}],
 trongsa:[
  {n:'The dzong and Ta Dzong',hrs:4,
   what:'The longest fortress in Bhutan, dropping down its ridge above the Mangde Chhu gorge, and the watchtower above it — now the museum of the monarchy.'}],
 haa:[
  {n:'Juneydrak and the valley floor',hrs:4,
   what:'A steep half-hour to a hermitage stuck to a cliff face, with the footprint of Machig Labdron in the rock — the same vertigo as Taktsang and usually nobody else on the path.'}]
};

const ACT_HRS={
 'Taktsang':6, 'Tiger\u2019s Nest':6, 'Chele La':4, 'Kyichu Lhakhang':0.5,
 'Drukgyel Dzong':1, 'Rinpung Dzong':1.5, 'The National Museum':1,
 'Buddha Dordenma':1, 'Tashichho Dzong':1, 'The Memorial Chorten':0.75,
 'The weekend market':1.5, 'The takin preserve':1, 'Zorig Chusum':1.5,
 'Cheri Goemba':4, 'Tango':3, 'Punakha Dzong':1.5,
 'Khamsum Yulley Namgyal Chorten':3, 'Chimi Lhakhang':1.5,
 'The suspension bridge':0.5, 'Gangtey Goemba':1,
 'The Black-Necked Crane Centre':1, 'The Gangtey Nature Trail':2,
 'Trongsa Dzong':1.5, 'Ta Dzong':1, 'Jakar Dzong':1,
 'Kurjey Lhakhang':1, 'Jambay Lhakhang':0.75, 'Tamshing':0.75,
 'Mebar Tsho':1, 'Lhakhang Karpo':1, 'Juneydrak':2.5,
 'Tachog Lhakhang':0.5, 'Chuzom confluence':0.25, 'Dochu La':0.75,
 'Lamperi Botanical Park':1, 'Wangdue Phodrang':0.5, 'Pele La':0.4,
 'Chendebji Chorten':0.4, 'Yotong La':0.4, 'Chumey weaving village':0.75,
 'Kila Nunnery':2
};

function actHrs(name,fallback){
 if(ACT_HRS[name]!=null)return ACT_HRS[name];
 for(const k in ACT_HRS) if(name.indexOf(k)===0)return ACT_HRS[k];
 return fallback!=null?fallback:1;
}

const HOTELS={
 paro:[
  {n:'Amankora Paro',tier:'lux',r:1650,tags:'spa quiet romantic view',note:'Aman’s pine-forest lodge below the ruins of Drukgyel'},
  {n:'Six Senses Paro',tier:'lux',r:1500,tags:'spa quiet romantic view',note:'Stone-and-glass lodge looking down the valley'},
  {n:'COMO Uma Paro',tier:'lux',r:900,tags:'spa romantic view family',note:'Hilltop, with a well-known spa'},
  {n:'Zhiwa Ling Heritage',tier:'boutique',r:340,tags:'heritage quiet family',note:'Bhutanese-built, traditional joinery throughout'},
  {n:'Naksel Boutique Hotel & Spa',tier:'boutique',r:300,tags:'spa quiet',note:'Quiet side of the valley, good spa'},
  {n:'Le Méridien Paro Riverfront',tier:'boutique',r:280,tags:'river family view',note:'On the Paro Chhu, easy for families'},
  {n:'Tashi Namgay Resort',tier:'three',r:130,tags:'river family',note:'Riverside, dependable, close to town'},
  {n:'Hotel Olathang',tier:'three',r:110,tags:'heritage quiet',note:'Long-standing government-built hotel in the pines'},
  {n:'A Paro farmhouse',tier:'home',r:70,tags:'farm local family',note:'Family home, hot-stone bath fired in the shed'}
 ],
 thimphu:[
  {n:'Amankora Thimphu',tier:'lux',r:1600,tags:'spa quiet romantic',note:'Walled courtyard lodge in a blue-pine forest'},
  {n:'Six Senses Thimphu',tier:'lux',r:1450,tags:'spa quiet view',note:'Above the city, with the valley below'},
  {n:'Taj Tashi',tier:'lux',r:420,tags:'spa family heritage',note:'Dzong-inspired, in the middle of town'},
  {n:'Terma Linca Resort & Spa',tier:'boutique',r:300,tags:'spa river quiet',note:'Riverside, a short drive out of the centre'},
  {n:'Le Méridien Thimphu',tier:'boutique',r:270,tags:'family view',note:'Central, contemporary'},
  {n:'Namgay Heritage Hotel',tier:'three',r:140,tags:'heritage family',note:'Central, traditional detailing'},
  {n:'Hotel Druk',tier:'three',r:125,tags:'family',note:'On the clock tower square, everything on foot'},
  {n:'A Thimphu family home',tier:'home',r:65,tags:'local family farm',note:'City-edge household, home cooking'}
 ],
 punakha:[
  {n:'Amankora Punakha',tier:'lux',r:1600,tags:'quiet romantic river heritage',note:'A restored farmhouse across a suspension bridge'},
  {n:'Six Senses Punakha',tier:'lux',r:1450,tags:'spa view romantic',note:'Rice-terrace views from a hillside perch'},
  {n:'COMO Uma Punakha',tier:'lux',r:850,tags:'river quiet romantic',note:'Small, on the Mo Chhu'},
  {n:'Dhensa Boutique Resort',tier:'boutique',r:330,tags:'quiet view spa',note:'Forest-facing, calm, all-suite'},
  {n:'RKPO Green Resort',tier:'boutique',r:250,tags:'river family view',note:'Above the river, good for families'},
  {n:'Punatsangchhu Cottages',tier:'three',r:130,tags:'river family',note:'Simple cottages by the water'},
  {n:'Damchen Resort',tier:'three',r:120,tags:'river',note:'Riverside, close to the dzong'},
  {n:'A Punakha farmhouse',tier:'home',r:70,tags:'farm local river family',note:'Rice-farming household in the warm valley'}
 ],
 phobjikha:[
  {n:'Amankora Gangtey',tier:'lux',r:1600,tags:'quiet romantic view',note:'Looking straight down the crane marsh'},
  {n:'Six Senses Gangtey',tier:'lux',r:1450,tags:'quiet view romantic',note:'A glass-walled bridge over the valley'},
  {n:'Gangtey Lodge',tier:'boutique',r:520,tags:'quiet romantic view heritage',note:'Farmhouse conversion above the monastery'},
  {n:'Dewachen Hotel',tier:'three',r:140,tags:'quiet family view',note:'Valley-floor, wood-fired stoves'},
  {n:'Phuntsho Chholing Lodge',tier:'three',r:120,tags:'local quiet',note:'Simple, warm, well-placed for the marsh'},
  {n:'A Phobjikha farmhouse',tier:'home',r:70,tags:'farm local quiet',note:'Potato-farming family, bukhari stove'}
 ],
 trongsa:[
  {n:'Yangkhil Resort',tier:'boutique',r:190,tags:'view quiet',note:'Facing the great dzong across the gorge'},
  {n:'Tashi Ninjay Guest House',tier:'three',r:110,tags:'local family',note:'Simple and friendly, in town'},
  {n:'A Trongsa guesthouse',tier:'home',r:65,tags:'local farm',note:'Family-run rooms above the valley'}
 ],
 bumthang:[
  {n:'Amankora Bumthang',tier:'lux',r:1550,tags:'quiet heritage romantic',note:'Beside the Wangdicholing palace grounds'},
  {n:'Six Senses Bumthang',tier:'lux',r:1400,tags:'quiet spa view',note:'In a working pine forest'},
  {n:'Yugharling Resort',tier:'boutique',r:230,tags:'view family quiet',note:'Above Jakar, wide valley views'},
  {n:'Chumey Nature Resort',tier:'boutique',r:200,tags:'quiet farm view',note:'In the Chumey weaving valley'},
  {n:'Jakar Village Lodge',tier:'three',r:120,tags:'heritage local',note:'Traditional building below the dzong'},
  {n:'A Bumthang farmhouse',tier:'home',r:70,tags:'farm local heritage family',note:'Buckwheat farm, cheese and ara at the table'}
 ],
 haa:[
  {n:'Lechuna Heritage Lodge',tier:'boutique',r:210,tags:'heritage quiet farm',note:'Restored heritage house in the upper valley'},
  {n:'Risum Resort',tier:'three',r:120,tags:'family quiet',note:'The valley’s dependable standby'},
  {n:'A Haa farmhouse',tier:'home',r:65,tags:'farm local quiet monastic',note:'Buckwheat and barley country, very quiet'}
 ]
};

const TIERSTAR={
 home:'Farmhouse', monastic:'Monastery guesthouse',
 three:'3-star', boutique:'Boutique', lux:'5-star'
};

function checkPlan(days,entryK,exitK){
 /* Which door the trip uses decides what "finishes well" means — a Paro
    flight and a Phuentsholing crossing are different departure days. The
    builder passes its gateways; any other caller gets the old
    fly-in, fly-out reading unchanged. */
 const EN=GATEWAY[entryK]||GATEWAY.paro, EX=GATEWAY[exitK]||GATEWAY.paro;
 const out={hours:0,legs:[],notes:[],warn:[],ok:[]};
 if(!days.length)return out;

 for(let i=1;i<days.length;i++){
  const from=days[i-1], to=days[i];
  if(from===to){out.legs.push(0);continue;}
  const h=legHours(from,to);
  out.legs.push(h||0);
  out.hours+=h||0;
 }

 /* a day is a driving day if you moved that morning */
 const driveDays=out.legs.filter(x=>x>0).length;
 const restDays=days.length-1-driveDays;

 /* 1 — does it start and end where its own doors are? */
 if(EN.air&&days[0]!=='paro')
  out.warn.push('Your first night is not in Paro. You land at Paro, so unless you are driving straight out we would normally start you there — it also gives you the afternoon to find your altitude at 2,235 m.');
 const last=days[days.length-1];
 if(EX.air){
  if(last!=='paro'){
   const back=legHours(last,'paro');
   if(back>=8)
    out.warn.push('You finish in '+VAL[last].n+', which is about '+hrsWord(back)+' from Paro airport. That is a whole day on the road, and Paro flights leave early — you need a night in Paro before you fly, or a domestic flight from Bathpalathang. We can price either.');
   else if(back>=4)
    out.warn.push('You finish in '+VAL[last].n+', roughly '+hrsWord(back)+' from the airport. Doable on departure morning only if your flight is late; otherwise add a Paro night.');
   else if(back>0)
    out.notes.push('You finish in '+VAL[last].n+', about '+hrsWord(back)+' from Paro — workable for a morning flight, though a last night in Paro makes the early start gentler.');
  }else out.ok.push('Finishes in Paro, the airport valley, so the flight home is straightforward.');
 }else if(EX.to){
  const down=(legHours(last,EX.to)||0)+EX.hrs;
  if(last===EX.to)
   out.ok.push('Finishes in '+VAL[EX.to].n+', the last valley before the '+EX.n+' crossing — about '+hrsWord(EX.hrs)+' down to the border on your departure day.');
  else if(down>=8)
   out.warn.push('You finish in '+VAL[last].n+', about '+hrsWord(down)+' from the '+EX.n+' crossing. That is too much for one departure day — sleep your last night in '+VAL[EX.to].n+', the valley the border road leaves from.');
  else
   out.warn.push('You finish in '+VAL[last].n+'; the road out runs through '+VAL[EX.to].n+' to '+EX.n+', about '+hrsWord(down)+' in all on your departure day. A last night in '+VAL[EX.to].n+' shortens it to '+hrsWord(EX.hrs)+'.');
 }else
  out.notes.push('You leave through '+EX.n+'. The east is a separate journey — we plan that departure by hand.');

 /* 2 — has anybody given themselves a day off? */
 if(days.length>=6&&restDays===0)
  out.warn.push('Every day of this plan moves you somewhere. Over '+days.length+' days that is tiring, particularly at altitude. Two nights in one valley somewhere in the middle changes the whole trip.');
 else if(restDays>0)
  out.ok.push(restDays+' night'+(restDays>1?'s':'')+' where you stay put — that is what makes the rest of it enjoyable.');

 /* 3 — any single leg that is simply too long for one day */
 for(let i=1;i<days.length;i++){
  const h=legHours(days[i-1],days[i]);
  if(h>=9)
   out.warn.push('Day '+(i+1)+': '+VAL[days[i-1]].n+' to '+VAL[days[i]].n+' is about '+hrsWord(h)+' of driving. We would break that with a night on the way rather than do it in one push.');
  else if(h>=6)
   out.notes.push('Day '+(i+1)+': '+VAL[days[i-1]].n+' to '+VAL[days[i]].n+', around '+hrsWord(h)+'. A long but manageable day — leave early.');
 }

 /* 4 — passes worth knowing about */
 const seen={};
 for(let i=1;i<days.length;i++){
  const p=passBetween(days[i-1],days[i]);
  if(p&&!seen[p.n]){seen[p.n]=1;out.notes.push('Day '+(i+1)+' crosses '+p.n+' at '+p.alt+'.');}
 }

 /* 5 — the arithmetic */
 out.driveDays=driveDays;
 out.restDays=restDays;
 out.nights=days.length;
 return out;
}

const DRUK_ROUTES={
 2:['paro','paro'],
 3:['paro','thimphu','paro'],
 4:['paro','thimphu','punakha','paro'],
 5:['paro','thimphu','punakha','punakha','paro'],
 6:['paro','thimphu','punakha','punakha','paro','paro'],
 7:['paro','thimphu','punakha','punakha','phobjikha','paro','paro'],
 8:['paro','thimphu','punakha','punakha','phobjikha','phobjikha','paro','paro'],
 9:['paro','thimphu','punakha','phobjikha','trongsa','bumthang','punakha','paro','paro'],
 10:['paro','thimphu','punakha','phobjikha','trongsa','bumthang','bumthang','punakha','paro','paro'],
 11:['paro','haa','thimphu','punakha','phobjikha','trongsa','bumthang','bumthang','punakha','paro','paro'],
 12:['paro','haa','thimphu','thimphu','punakha','phobjikha','trongsa','bumthang','bumthang','punakha','paro','paro']};

const hop=(a,b)=>HOP[a+'|'+b]||HOP[b+'|'+a]||null;

function passBetween(a,b){
 for(const k in PASSES){const p=PASSES[k];
  if((p.links[0]===a&&p.links[1]===b)||(p.links[0]===b&&p.links[1]===a))return Object.assign({id:k},p);}
 return null;
}

const PASSES={
 dochula:{n:'Dochu La',alt:'3,100 m',links:['thimphu','punakha'],km:null,
  what:'The 108 Druk Wangyal chortens, raised by the eldest Queen Mother in memory of soldiers who died in 2003, ranked in tiers on the ridge.',
  sees:'Masanggang at 7,194 m and Gangkhar Puensum at 7,570 m — the highest unclimbed mountain in the world.',
  note:'The traditional walking route between the old capital at Punakha and the present one at Thimphu.'},
 pele:{n:'Pele La',alt:'3,420 m',links:['phobjikha','trongsa'],km:130,
  what:'A chorten and prayer flags on open yak pasture, dwarf bamboo down both sides.',
  sees:'Jomolhari at 7,326 m and Jichu Drake at 6,662 m, on the rare clear day.',
  note:'This is the line between western and central Bhutan, and the western boundary of Jigme Singye Wangchuck National Park — Royal Bengal tiger and red panda country, though you will not see either from the car.'},
 yotong:{n:'Yotong La',alt:'3,425 m',links:['trongsa','bumthang'],km:68,
  what:'Mist, usually. The top of the pass is cloud-wrapped more often than not, which is its own kind of atmosphere.',
  sees:'When it lifts, the Chumey valley opening out below on the Bumthang side.',
  note:'The crossing into the Bumthang valleys — the cultural heartland, and the oldest temples in the country.'},
 chele:{n:'Chele La',alt:'3,988 m',links:['paro','haa'],km:35,
  what:'The highest motorable point in Bhutan at 3,988 m — 35 km from Paro, 26 km from Haa — and ten thousand prayer flags along the ridge.',
  sees:'Jomolhari on the skyline, and the Haa valley dropping away on the far side.',
  note:'Spruce and larch on the climb, and in early summer the white poppy that grows only here.'},
 thrumshing:{n:'Thrumshing La',alt:'3,780 m',links:['bumthang','mongar'],km:198,
  what:'Bhutan\u2019s second-highest pass, over the Donga range, inside Thrumshingla National Park.',
  sees:'Cliffs, cloud, and a descent that drops from 3,800 m to 650 m in a matter of hours — alpine forest to semi-tropical orange groves.',
  note:'This is the crossing into eastern Bhutan. Long, narrow and often misted. It is the reason the east feels like another country.'}
};

const FCMON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];



/* ============================================================
   BREATHE BHUTAN — AI ITINERARY DESK
   Paste the guest's words. The desk traces the keywords, builds
   the route from the real road matrix, fills days from the real
   activity lists, and hands back a draft you can edit.
   Every fact comes from the knowledge core above — nothing invented.
   ============================================================ */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MONTHS=['january','february','march','april','may','june','july','august','september','october','november','december'];
const LMV={'tigers-nest':'paro','kyichu':'paro','punakha-dzong':'punakha','chimi':'punakha','dochula':'punakha','buddha-dordenma':'thimphu','trongsa-dzong':'trongsa','gangtey-gonpa':'phobjikha'};
const ORD=ROADORDER;
const idx=v=>ORD.indexOf(v);

/* ---------- the tracer ---------- */
function aiParse(text){
 const raw=' '+String(text).toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ')+' ';
 const P={traced:[],flags:[],pins:[],w:{},month:-1,nights:null,age:null,taktsang:false};
 const dm=raw.match(/ (\d{1,2}) (day|days|night|nights) /);
 if(dm){P.nights=parseInt(dm[1],10)-(dm[2][0]==='d'?1:0);P.traced.push(dm[1]+' '+dm[2]);}
 const am=raw.match(/ (\d{1,2}) (year|years|yo|yrs) /)||raw.match(/ age (\d{1,2}) /)
  ||raw.match(/ (?:she|he|i|mum|mom|dad|mother|father|grandmother|grandma|grandfather|grandpa|wife|husband) is (\d{2}) /);
 if(am){P.age=parseInt(am[am.length-1],10);P.traced.push('age '+P.age);}
 const has=w=>raw.indexOf(' '+w)>-1;
 const any=a=>a.some(has);
 MONTHS.forEach((m,i)=>{if(has(m)||has(m.slice(0,3)+' ')){P.month=i;P.traced.push(m);}});
 Object.keys(VAL).forEach(v=>{if(raw.indexOf(' '+VAL[v].n.toLowerCase()+' ')>-1){P.pins.push(v);P.traced.push(VAL[v].n);}});
 LAND.forEach(l=>{const nm=l.name.toLowerCase();
  if(raw.indexOf(nm)>-1||(l.id==='tigers-nest'&&(has('taktsang')||raw.indexOf('tiger')>-1))){
   const v=LMV[l.id]; if(v&&P.pins.indexOf(v)<0)P.pins.push(v);
   if(l.id==='tigers-nest')P.taktsang=true;
   P.traced.push(l.name);}});
 const W=(k,words,label)=>{if(any(words)){P.w[k]=(P.w[k]||0)+1;P.traced.push(label);}};
 W('fest',['festival','festivals','tshechu','cham','mask dance'],'festivals');
 W('trek',['trek','trekking','hike','hiking','camp','camping'],'trails');
 W('nature',['crane','cranes','bird','birds','birding','wildlife','nature','forest','takin'],'nature');
 W('culture',['dzong','monastery','monasteries','temple','temples','culture','cultural','history','buddhism','buddhist'],'culture');
 W('photo',['photo','photography','photographer'],'photography');
 W('food',['food','cuisine','momo','momos','farm','farmhouse','cooking'],'food');
 W('slow',['slow','relax','relaxed','gentle','easy','wellness','spa','hot stone','unwind','quiet'],'a gentle pace');
 W('spirit',['meditation','meditate','retreat','spiritual','blessing','prayer'],'the spiritual side');
 W('family',['kids','children','child','family','son','daughter','toddler'],'family');
 if(any(['grandmother','grandma','grandfather','grandpa','elderly','senior','older parents'])){P.w.gentle=1;P.traced.push('an elder in the party');}
 if(any(['cycle','cycling','bicycle','bike']))P.flags.push('Cycling traced \u2014 the capital is cycling-mad country; the team will shape road time and a ride around it.');
 if(any(['wedding','vows','marry','marriage']))P.flags.push('Wedding / blessing traced \u2014 a lhakhang ceremony is arranged personally by the team, never templated.');
 if(any(['honeymoon','anniversary']))P.flags.push('Honeymoon / anniversary traced \u2014 quiet rooms and private dinners, planned discreetly.');
 if(P.age&&P.age>=65&&!P.w.gentle){P.w.gentle=1;}
 return P;
}

/* ---------- the route builder: out along the road, home to Paro ---------- */
function buildRoute(nights,P,exclude){
 exclude=exclude||[];
 const pins=(P.pins||[]).filter(v=>exclude.indexOf(v)<0);
 nights=Math.max(2,Math.min(14,nights));
 let far='punakha';
 if(nights>=9)far='bumthang'; else if(nights>=7)far='phobjikha';
 if(P.w&&P.w.nature&&nights>=6&&idx(far)<idx('phobjikha'))far='phobjikha';
 pins.forEach(v=>{if(idx(v)>idx(far))far=v;});
 if(exclude.indexOf(far)>-1)far=ORD[idx(far)-1];
 const chain=['paro'];
 for(let i=idx('thimphu');i<=idx(far);i++){
  const v=ORD[i];
  if(exclude.indexOf(v)>-1)continue;
  if(v==='haa')continue;
  if(v==='phobjikha'&&idx(far)>idx('phobjikha')&&!pins.includes('phobjikha')&&!(P.w&&P.w.nature))continue;
  chain.push(v);
 }
 if(pins.includes('haa')&&exclude.indexOf('haa')<0)chain.splice(1,0,'haa');
 const back=[];
 if(idx(far)>=idx('trongsa'))back.push('punakha');
 back.push('paro');
 let route=chain.concat(back.filter(v=>exclude.indexOf(v)<0||v==='paro'));
 route=route.filter((v,i)=>i===0||v!==route[i-1]);
 while(route.length<nights){
  const scores={};
  route.forEach(v=>{
   let sc=1;
   if(pins.includes(v))sc+=3;
   if(P.w){ if(P.w.nature&&v==='phobjikha')sc+=3;
    if(P.w.culture&&(v==='punakha'||v==='thimphu'))sc+=2;
    if(P.w.fest&&P.festValley===v)sc+=3;
    if(P.w.slow)sc+=v==='punakha'?1:0; }
   const cnt=route.filter(x=>x===v).length;
   sc-=(cnt-1)*1.3;                       /* crowding penalty */
   if(v==='paro'){const trail=(route[route.length-1]==='paro'?1:0)+(route[route.length-2]==='paro'?1:0);
    sc+= trail<2 ? 2 : -3;}               /* one settled Taktsang double, never a third */
   if(v==='trongsa')sc-=1;
   scores[v]=Math.max(scores[v]||0,sc);
  });
  const best=Object.keys(scores).sort((a,b)=>scores[b]-scores[a])[0];
  const at=route.lastIndexOf(best);
  route.splice(at,0,best);
 }
 while(route.length>nights){
  let cut=-1;
  for(let i=route.length-2;i>0;i--){if(route[i]===route[i-1]&&!pins.includes(route[i])){cut=i;break;}}
  if(cut<0)for(let i=route.length-2;i>0;i--){if(route[i]===route[i-1]){cut=i;break;}}
  if(cut<0){
   let worst=-1,wi=-1;
   for(let i=1;i<route.length-1;i++){const v=route[i];if(!pins.includes(v)){const sc=(v==='trongsa'?0:1);if(wi<0||sc<worst){worst=sc;wi=i;}}}
   cut=wi>0?wi:1;
  }
  route.splice(cut,1);
  route=route.filter((v,i)=>i===0||v!==route[i-1]||route.filter(x=>x===v).length>1);
 }
 if(route[route.length-1]!=='paro')route[route.length-1]='paro';
 return route;
}

/* ---------- difficulty of a thing, read from its own name ---------- */
function actDiff(n){
 const s=n.toLowerCase();
 if(/taktsang|tiger/.test(s))return 5;
 if(/khamsum|bumdra|chele la|climb|lookout hike/.test(s))return 4;
 if(/hike|trail|walk|suspension|takin/.test(s))return 3;
 return 2;
}
function festFor(v,month){
 if(month<0)return null;
 const mm=String(month+1).padStart(2,'0');
 return FESTCAL.find(f=>(f.s.slice(5,7)===mm||f.e.slice(5,7)===mm)&&f.d&&f.d.toLowerCase().indexOf(VAL[v].n.toLowerCase())>-1)||null;
}
function poolFor(v){
 const acts=[]; const seen={};
 (WITHIN[v]||[]).forEach(x=>{if(!seen[x.n]){seen[x.n]=1;acts.push({n:x.n,hrs:x.hrs,w:x.what||''});}});
 (VAL[v].see||[]).forEach(s0=>{
  const nm=String(s0[0]).split(/ \u2014 | \u2013 |, /)[0];
  if(!seen[nm]){seen[nm]=1;acts.push({n:nm,hrs:actHrs(nm,1.5),w:String(s0[1]||'')});}
 });
 return acts;
}
function recommend(v,driveH,P,diffCap,removed,manual){
 removed=removed||[]; manual=manual||[];
 let cap=diffCap;
 if(P.w&&(P.w.gentle))cap=Math.min(cap,3);
 if(P.w&&P.w.family)cap=Math.min(cap,3);
 if(P.age&&P.age>=70)cap=Math.min(cap,3);
 const budget=driveH>0?Math.max(1.5,9-driveH-1):8;
 const pool=poolFor(v).filter(a=>removed.indexOf(a.n)<0&&!manual.some(m=>m.n===a.n));
 pool.forEach(a=>{
  let sc=1; const t=(a.n+' '+a.w).toLowerCase(); const d=actDiff(a.n);
  const wantsTak=P.taktsang&&/taktsang|tiger/.test(t);
  if(d>cap&&!wantsTak){a.sc=-99;return;}
  if(wantsTak)sc+=9;
  if(P.w){ if(P.w.trek&&d>=3)sc+=2;
   if(P.w.nature&&/crane|bird|nature|takin|forest|valley walk/.test(t))sc+=3;
   if(P.w.culture&&/dzong|lhakhang|monastery|temple|museum|chorten/.test(t))sc+=2;
   if(P.w.food&&/farm|market|kitchen|lunch|momo/.test(t))sc+=2;
   if(P.w.spirit&&/monastery|lhakhang|temple|nunnery|prayer/.test(t))sc+=2;
   if(P.w.photo&&/view|point|pass|dzong/.test(t))sc+=1;
   if(P.w.slow&&a.hrs<=1.5)sc+=1; }
  a.sc=sc+Math.random()*0.01;
 });
 const chosen=manual.slice();
 let used=manual.reduce((s,a)=>s+(a.hrs||1),0);
 pool.filter(a=>a.sc>0).sort((a,b)=>b.sc-a.sc).forEach(a=>{
  if(used+a.hrs<=budget){chosen.push(a);used+=a.hrs;}
 });
 return {chosen,budget,pool:pool.filter(a=>a.sc>-90&&!chosen.some(c=>c.n===a.n))};
}



/* ---------- the engine: draft and replan, stateless in, plan out ---------- */
function assemble(nights,P,exclude,diff){
 const route=buildRoute(nights,P,exclude||[]);
 let festUsed=false;
 const days=route.map((v,i)=>{
  const prev=i>0?route[i-1]:null;
  const driveH=prev&&prev!==v?legHours(prev,v):0;
  const r=recommend(v,driveH,P,diff,[],[]);
  const day={v,driveH,acts:r.chosen,pool:r.pool,budget:r.budget};
  if((P.age>=60||(P.w&&P.w.gentle))&&day.acts.some(a=>/taktsang|tiger/i.test(a.n)))day.tak=1;
  if(!festUsed){const f=festFor(v,P.month);if(f){day.fest=f;festUsed=true;}}
  return day;
 });
 const verdicts=checkPlan(route,'paro','paro');
 return {nights,parse:P,route,days,verdicts,exclude:exclude||[],diff,
  text:renderText(nights,days,verdicts,P)};
}
function renderText(nights,days,cp,P){
 const L=['Draft itinerary ('+nights+' nights)',''];
 days.forEach((d,i)=>{
  L.push('Day '+(i+1)+' \u2014 '+VAL[d.v].n+(d.driveH?' \u00b7 '+hrsWord(d.driveH)+' on the road':' \u00b7 staying put'));
  if(d.fest)L.push('  \u2605 '+d.fest.n+' ('+fcFmt(d.fest.s,d.fest.e)+' 2026)');
  if(d.tak)L.push('  \u25e6 taken gently: ponies for the lower half, tea-house lookout a proud turnaround, 7\u20138am start');
  d.acts.forEach(a=>L.push('  \u2022 '+a.n+' ('+a.hrs+'h)'));
  L.push('');
 });
 (cp.ok||[]).concat(cp.notes||[]).forEach(x=>L.push('\u2713 '+x));
 (cp.warns||[]).forEach(x=>L.push('\u26a0 '+x));
 (P.flags||[]).forEach(f=>L.push('\u25ce '+f));
 return L.join('\n');
}
function draft(text,opts){
 opts=opts||{};
 const P=aiParse(text||'');
 let nights=opts.nights||P.nights||6;
 if(opts.age)P.age=opts.age;
 if(P.age&&P.age>=65)P.w.gentle=1;
 nights=Math.max(2,Math.min(14,nights));
 return assemble(nights,P,[],opts.diff||3);
}
function replan(plan,ch){
 ch=ch||{};
 const P=plan.parse;
 if(ch.age!==undefined){P.age=ch.age;if(P.age>=65)P.w.gentle=1;}
 const exclude=plan.exclude.slice();
 if(ch.removeStop&&plan.route.indexOf(ch.removeStop)>-1&&ch.removeStop!=='paro')exclude.push(ch.removeStop);
 const nights=Math.max(2,Math.min(14,ch.nights||plan.nights));
 const diff=ch.diff||plan.diff;
 const out=assemble(nights,P,exclude,diff);
 if(ch.removeStop&&exclude.length>plan.exclude.length){
  const v=ch.removeStop;
  const top=poolFor(v).sort((a,b)=>a.hrs-b.hrs)[0];
  out.note=VAL[v].n+' removed; its nights flow to the neighbouring stay.'+
   (top?' The road may still pass '+VAL[v].n+' \u2014 '+top.n+' ('+top.hrs+'h) can fit on the drive.':'');
 }
 return out;
}
const ItineraryBrain={draft,replan,aiParse,buildRoute,recommend,festFor,poolFor,actDiff,
 checkPlan,legHours,legKm,hrsWord,enroute,fcFmt,
 data:{VAL,DEST,LAND,FESTCAL,WITHIN,HOTELS,TIERSTAR,ENROUTE,ROADORDER,HOP,HOPKM,DRUK_ROUTES}};
if(typeof module!=='undefined'&&module.exports)module.exports=ItineraryBrain;
else root.ItineraryBrain=ItineraryBrain;
})(typeof window!=='undefined'?window:globalThis);


/* ---------------------------------------------------------------
   Added for the Bhutan Tourism Hub build.
   This one line makes the file an ES module. Without it Vite sees
   `module.exports` above, treats the file as CommonJS, wraps it in a
   factory that is never called, and neither the export nor `window`
   is ever set. With it, the UMD block above takes the `window` path
   and this re-exports the same object for a normal import.
   The logic above is untouched.
   --------------------------------------------------------------- */
export default (typeof window !== 'undefined' ? window.ItineraryBrain : globalThis.ItineraryBrain);
