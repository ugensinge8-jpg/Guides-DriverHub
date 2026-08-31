/* ============================================================
   DRUK PAH ENGINE  \u00b7  the trip-builder, operator-facing
   "What does your guest want?" \u2014 the same trimmed question set,
   turned to face the guest, wired straight into the Itinerary Brain.

   Requires itinerary-brain.js loaded first.

   USAGE:
     <script src="itinerary-brain.js"></script>
     <script src="drukpah-engine.js"></script>
     const s = DrukPah.session();
     s.greeting;                 // Druk Pah introduces himself to the operator
     s.current();                // {k,t,sub,type,options,progress:{i,n}}
     s.answer('family');         // advance (id | number for count | array for final)
     s.back();                   // one step back
     if (s.done()) const {plan, phrase, meta} = s.result();
     // plan  = full ItineraryBrain plan (route, days, verdicts, text)
     // meta  = {party, count, tier, planAround[]} for your pricing UI
   ============================================================ */
(function(root){
const IB = (typeof module!=='undefined'&&typeof require!=='undefined')
  ? require('./itinerary-brain.js')
  : root.ItineraryBrain;

const Q=[
{k:'party',t:'Who is your guest travelling with?',sub:'Everything that follows bends around this.',o:[
 ['solo','\ud83e\uddd8','Travelling alone','Their own rhythm, their own pace'],
 ['couple','\u2764\ufe0f','A couple','A journey built for two'],
 ['family','\ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d\udc67','A family','Children, parents, or three generations'],
 ['friends','\ud83c\udf92','A few friends','A small private group'],
 ['group','\ud83d\ude90','Ten or more','A larger party travelling together']]},
{k:'count',type:'count',when:a=>a.party&&a.party!=='solo',
 t:'How many guests, in all?',sub:'This shapes rooms, vehicles and the Sustainable Development Fee.'},
{k:'interest',t:'What is calling your guest to Bhutan?',sub:'Choose their strongest pull \u2014 the rest weaves in anyway.',o:[
 ['spirit','\ud83d\udd4a\ufe0f','Stillness & spirit','Temples, meditation, mountain quiet'],
 ['trails','\u26f0\ufe0f','Trails & high places','Passes, ridgelines, earned views'],
 ['offbeat','\ud83e\udded','Off the beaten path','Empty valleys, roads that give up'],
 ['culture','\ud83c\udfad','Festivals & living culture','Cham dances, dzongs, tradition'],
 ['crafts','\ud83e\uddf5','Craft & making','Looms, clay, paper, brush'],
 ['wild','\ud83e\udd85','Wildlife & wild places','Cranes, forests, birdsong'],
 ['food','\ud83c\udf72','Food & farm life','Kitchens, markets, harvests'],
 ['photo','\ud83d\udcf7','Photography','Light, faces, architecture'],
 ['rest','\ud83c\udf38','Rest & restoration','Hot-stone soaks, soft landings']]},
{k:'trek',when:a=>a.interest==='trails',t:'How do they want to cover the ground?',sub:'The engine will say honestly if it is too much or too little.',o:[
 ['day','\ud83e\udd7e','Day walks only','Back to a warm bed each night'],
 ['light','\u26fa','A night or two out','A taste of camping, gently'],
 ['real','\ud83c\udfd5\ufe0f','A proper trek','Several days, real passes'],
 ['big','\ud83c\udfd4\ufe0f','The serious thing','Jomolhari or the long trail'],
 ['bike','\ud83d\udeb2','On two wheels','Road climbs, with a vehicle behind']]},
{k:'offbeat',when:a=>a.interest==='offbeat',t:'How far past the map do they want to go?',sub:'Whole valleys here see a handful of outsiders a year.',o:[
 ['haa','\ud83c\udfd4\ufe0f','Haa & the Chele La','Cliff hermitages, empty trails'],
 ['bumthang','\ud83c\udf32','Ura & Tang valleys','Stone villages, blue pine'],
 ['east','\ud83d\udc02','Merak & Sakteng','The Brokpa highlands of the far east'],
 ['noroad','\ud83e\udd7e','Wherever the road gives up','Days on foot, no signal']]},
{k:'fest',when:a=>a.interest==='culture',t:'How would they like to meet a festival?',sub:'Dates move each year \u2014 the calendar is checked against theirs.',o:[
 ['big','\ud83c\udfaa','The great tshechus','Paro or Thimphu, in full colour'],
 ['small','\ud83c\udfd8\ufe0f','A village festival','Fewer visitors, more welcome'],
 ['crane','\ud83d\udd4a\ufe0f','The Crane Festival','Phobjikha in late autumn'],
 ['bydate','\ud83d\udcc5','Whatever falls in their dates','Surprise them well']]},
{k:'well',when:a=>a.interest==='rest',t:'What kind of restoration are they after?',sub:'All of it can be layered.',o:[
 ['bath','\u2668\ufe0f','Hot-stone baths & springs','Dotsho, Gasa, Dur'],
 ['medit','\ud83e\uddd8','Meditation & silence','Taught by monks, practised alone'],
 ['spa','\ud83d\udc86','Proper spa days','Six Senses, COMO, Amankora'],
 ['sowa','\ud83c\udf3f','Traditional medicine','Sowa Rigpa, herbs, pulse reading']]},
{k:'spirit',when:a=>a.interest==='spirit',t:'How close do they want to get?',sub:'The route goes as deep as they are comfortable going.',o:[
 ['visit','\ud83d\ude4f','Visit the great temples','Guided, respectful, unhurried'],
 ['sit','\ud83e\udeb7','Sit in on prayers','Dawn chanting, butter lamps'],
 ['stay','\u2638\ufe0f','Sleep inside a monastery','A cell, a bell, a shared meal'],
 ['neykor','\ud83e\udded','A full pilgrimage','Neykor, site to site, with intention']]},
{k:'craft',when:a=>a.interest==='crafts',t:'What would they like to make?',sub:'Half a day at a bench beats an hour in a shop.',o:[
 ['weave','\ud83e\uddf6','Weave yathra','At the looms of Bumthang'],
 ['clay','\ud83c\udffa','Throw pottery','Clay, wheel, patient hands'],
 ['paint','\ud83d\udd8c\ufe0f','Paint or carve','Thangka brushwork, mask carving'],
 ['paper','\ud83d\udcdc','Make deh-sho paper','The old daphne-bark craft']]},
{k:'wild',when:a=>a.interest==='wild',t:'What are they hoping to see?',sub:'Be honest with them about odds and season.',o:[
 ['crane','\ud83d\udd4a\ufe0f','Black-necked cranes','Phobjikha, November to February'],
 ['birds','\ud83d\udc26','Birding, broadly','650+ species across the altitudes'],
 ['forest','\ud83c\udf32','Forest & flowers','Rhododendron, blue pine, ferns'],
 ['high','\ud83e\udd8c','High-altitude wildlife','Takin, blue sheep, yak country']]},
{k:'food',when:a=>a.interest==='food',t:'How would they like to eat?',sub:'The best meals happen in kitchens, not restaurants.',o:[
 ['farm','\ud83c\udfe1','At farmhouse tables','Whatever the garden gave'],
 ['cook','\ud83d\udc69\u200d\ud83c\udf73','Learn to cook it','Ema datshi, momos, red rice'],
 ['market','\ud83e\uddfa','Follow the markets','Weekend stalls, cheese, chillies'],
 ['forage','\ud83c\udf44','Seasonal & foraged','Matsutake, fiddleheads, honey']]},
{k:'photo',when:a=>a.interest==='photo',t:'What are they photographing?',sub:'The guide plans the light around this.',o:[
 ['land','\ud83c\udfd4\ufe0f','Landscape & architecture','Dzongs, passes, valleys'],
 ['people','\ud83d\udc65','People & portraits','With permission, always asked'],
 ['fest','\ud83c\udfad','Festival colour','Cham masks in motion'],
 ['night','\ud83c\udf0c','Night & stars','Long exposures, clear air']]},
{k:'length',type:'days',t:'How many days can they give the kingdom?',
 sub:'One road \u2014 every day changes how far it honestly reaches. A band, or their exact number.',o:[
 ['d3','\ud83c\udf04','3\u20134 days','Paro, properly'],
 ['d46','\u2708\ufe0f','5\u20136 days','The western valleys'],
 ['d79','\ud83d\udcc5','7\u20139 days','Adds the crane valley'],
 ['d10','\ud83c\udfd4\ufe0f','10\u201312 days','Reaches Bumthang'],
 ['d14','\ud83e\udded','13+ days','The long way east']]},
{k:'stay',t:'How do they want their nights?',sub:'Every quote follows this choice.',o:[
 ['home','\ud83c\udfe1','Farmhouse & homestay','Hearths, hot-stone baths, families'],
 ['monastic','\u2638\ufe0f','Monastic homestay','Temple guesthouses, prayers at dawn'],
 ['three','\ud83d\udecf\ufe0f','Comfortable 3\u2605','The listed-price standard'],
 ['boutique','\ud83c\udfee','Boutique character','Small lodges with a view'],
 ['lux','\ud83d\udc51','Top-tier luxury','The kingdom\u2019s finest lodges'],
 ['mix','\ud83c\udfa8','A thoughtful mix','Surprise them']]},
{k:'final',type:'final',t:'Anything to plan around for them?',
 sub:'Allergies, diets, mobility, altitude \u2014 every kitchen and guide on the route is briefed before arrival.',
 groups:[['At the table',['Vegetarian','Vegan','Gluten-free','Dairy-free','Nut allergy','Shellfish allergy','Halal']],
         ['On the road',['Limited mobility','Altitude concerns','Travelling with a baby','None of these']]]}
];

const PHRASE={
 party:{solo:'a solo traveller',couple:'a couple',family:'a family with children',friends:'a few friends',group:'a group of ten or more'},
 interest:{spirit:'meditation, temples and the spiritual side',trails:'hiking and trekking',
  offbeat:'quiet empty valleys and nature off the beaten path',culture:'festivals, dzongs and living culture',
  crafts:'craft, weaving and making things',wild:'wildlife, birds and nature',
  food:'food, farmhouse kitchens and markets',photo:'photography of dzongs and valleys',
  rest:'a relaxed gentle pace, hot stone baths and wellness'},
 trek:{day:'day hikes only',light:'a night of gentle camping',real:'a proper trek',big:'the Jomolhari trek',bike:'cycling with support'},
 fest:{big:'the great Paro festival',small:'a village festival',crane:'the Crane Festival in Phobjikha in November, cranes',bydate:'festivals'},
 offbeat:{haa:'Haa',bumthang:'Bumthang',east:'remote trekking in the far east',noroad:'trekking where the road gives up'},
 wild:{crane:'cranes in Phobjikha',birds:'birding',forest:'forest walks and flowers',high:'takin and high wildlife'}};
const NIGHTS={d3:3,d46:5,d79:8,d10:10,d14:13};
const DIFF={day:3,light:3,real:4,big:5,bike:3};

function flow(a){return Q.filter(q=>!q.when||q.when(a));}
function synth(a){
 const bits=[];
 if(a.party)bits.push(PHRASE.party[a.party]);
 if(a.interest)bits.push(PHRASE.interest[a.interest]);
 ['trek','fest','offbeat','wild'].forEach(k=>{if(a[k]&&PHRASE[k]&&PHRASE[k][a[k]])bits.push(PHRASE[k][a[k]]);});
 const gentle=(a.final||[]).some(x=>/mobility|altitude|baby/i.test(x));
 if(gentle)bits.push('a gentle pace');
 const phrase=bits.join(', ');
 const nights=typeof a.length==='number'?Math.max(2,a.length-1):(NIGHTS[a.length]||6);
 const diff=DIFF[a.trek]||( (a.interest==='rest'||gentle)?2:3 );
 return {phrase,opts:{nights,diff},
  meta:{party:a.party,count:a.count||1,tier:a.stay||'three',planAround:(a.final||[]).filter(x=>x!=='None of these')}};
}
function session(){
 const a={}; let i=0;
 return {
  greeting:'Kuzuzangpo la \u2014 I am Druk Pah. Tell me what your guest wants, and I will draft their Bhutan. A few questions, then the route.',
  answers:a,
  current(){const f=flow(a);return i<f.length?Object.assign({progress:{i:i+1,n:f.length}},f[i]):null;},
  answer(v){const f=flow(a);if(i>=f.length)return;a[f[i].k]=v;i++;return this.current();},
  back(){if(i>0){const f=flow(a);i--;delete a[f[i]&&f[i].k];}return this.current();},
  done(){return i>=flow(a).length;},
  result(){const s=synth(a);const plan=IB.draft(s.phrase,s.opts);
   return {plan,phrase:s.phrase,meta:s.meta};}
 };
}
const DrukPah={session,questions:Q,flow,synth,
 greeting:'Kuzuzangpo la \u2014 I am Druk Pah. What does your guest want?'};
if(typeof module!=='undefined'&&module.exports)module.exports=DrukPah;
else root.DrukPah=DrukPah;
})(typeof window!=='undefined'?window:globalThis);
