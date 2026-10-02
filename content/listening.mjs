/* ===== LISTENING BANK (original IELTS-style practice scripts, written for this app) =====
   voices: logical voice ids mapped to Piper models in scripts/make_audio.py
   gb_m, gb_f, gb_m2 (northern English), us_f, us_m, sc_f (Scottish)                       */

export const LISTENING_SETS = [
/* ---------------- Practice pack ---------------- */
{
 id:"L5", title:"Booking a Table", level:"Beginner", category:"Daily life", mock:null, part:1,
 voices:{M:"gb_m", W:"gb_f"},
 lines:[
 ["M","Good evening, Bella Vista restaurant."],
 ["W","Hello. I'd like to book a table for Saturday, please."],
 ["M","Certainly. For how many people?"],
 ["W","There'll be six of us. Oh, actually, my brother can't come now, so five."],
 ["M","Five people. And what time would you like?"],
 ["W","Around eight o'clock?"],
 ["M","I'm sorry, we're fully booked at eight. I can offer you half past seven or a quarter past nine."],
 ["W","Half past seven is fine."],
 ["M","Lovely. Can I have a name for the booking?"],
 ["W","Yes, it's Sarah Penrose. That's P, E, N, R, O, S, E."],
 ["M","Thank you. And a contact number?"],
 ["W","It's oh one six one, four nine six, oh seven three two."],
 ["M","Do you have any special requests?"],
 ["W","Yes. It's my mother's birthday, so could we have a table by the window?"],
 ["M","Of course. And if you like, we can bring a small cake at the end of the meal, free of charge."],
 ["W","Oh, that would be lovely. Thank you very much."]
 ],
 groups:[
 {qtype:"Form Completion", instr:"Complete the form. Write ONE WORD AND/OR A NUMBER for each answer.", limit:1, items:[
  {q:"Number of people: ___", a:["5","five"], tag:"distractors", ev:"so five", ex:"She first says six, then corrects herself. In IELTS the final, corrected information is the answer."},
  {q:"Time: ___ pm", a:["7.30","7:30","19:30","730"], tag:"numbers", ev:"Half past seven is fine", ex:"Eight o'clock was not available; she accepts half past seven = 7.30."},
  {q:"Surname: ___", a:["penrose"], tag:"spelling", ev:"P, E, N, R, O, S, E", ex:"Names spelled letter by letter must be written exactly."},
  {q:"Phone: ___", a:["01614960732"], tag:"numbers", ev:"oh one six one, four nine six, oh seven three two", ex:"'Oh' = zero. Spaces do not matter."}
 ]},
 {qtype:"Sentence Completion", instr:"Complete the sentences. Write ONE WORD ONLY for each answer.", limit:1, items:[
  {q:"The customer would like a table near the ___ .", a:["window"], tag:"paraphrasing", ev:"a table by the window", ex:"'By' = 'near'."},
  {q:"The restaurant will provide a free ___ .", a:["cake"], tag:"paraphrasing", ev:"a small cake at the end of the meal, free of charge", ex:"'Free of charge' = 'free'."}
 ]}
 ]
},
{
 id:"L6", title:"Old Town Walking Tour", level:"Intermediate", category:"Travel", mock:null, part:2,
 voices:{N:"gb_f"},
 lines:[
 ["N","Good morning, everyone, and welcome to the Old Town walking tour. My name's Helen and I'll be your guide today."],
 ["N","The tour lasts about two hours. Not ninety minutes, as it says on some of the older leaflets. We'll finish down by the river, near the ferry terminal."],
 ["N","We'll be walking about four kilometres, mostly on flat streets, but there is one steep hill near the cathedral, so please take your time there."],
 ["N","Our first stop is the market square, where a weekly market has been held since the fourteenth century. After that, we'll visit the cathedral."],
 ["N","Please note that you can't take photographs inside the cathedral itself, but you're welcome to take as many as you like in the cloisters."],
 ["N","Halfway through, we'll stop for twenty minutes at a café on Bridge Street. Drinks aren't included in the price of the tour, but the café gives a ten per cent discount if you show your tour ticket."],
 ["N","Finally, if anyone gets separated from the group, please call the number on the back of your ticket rather than trying to find us. The streets can be very confusing."]
 ],
 groups:[
 {qtype:"Multiple Choice", instr:"Choose the correct letter, A, B or C.", items:[
  {q:"How long does the tour last?", opts:["ninety minutes","about two hours","about four hours"], a:"B", tag:"distractors", ev:"The tour lasts about two hours", ex:"Ninety minutes is mentioned only as an error on old leaflets."},
  {q:"Where are photographs NOT allowed?", opts:["in the cloisters","in the market square","inside the cathedral"], a:"C", tag:"detail", ev:"you can't take photographs inside the cathedral itself", ex:"Photos are welcome in the cloisters."},
  {q:"What do tour members get at the café?", opts:["a free drink","a discount","a map of the town"], a:"B", tag:"distractors", ev:"gives a ten per cent discount if you show your tour ticket", ex:"Drinks are NOT included - a classic distractor."}
 ]},
 {qtype:"Short Answer", instr:"Answer the questions. Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.", limit:3, items:[
  {q:"Where does the tour finish?", a:["river","the river","by the river","ferry terminal","the ferry terminal"], tag:"detail", ev:"We'll finish down by the river, near the ferry terminal", ex:"Either 'the river' or 'the ferry terminal' is accepted."},
  {q:"How far will the group walk?", a:["4 kilometres","four kilometres","4 km","4km","4 kilometers","four kilometers","about 4 kilometres"], tag:"numbers", ev:"We'll be walking about four kilometres", ex:"Write the number and the unit."},
  {q:"What should people do if they get separated?", a:["call the number","phone the number","call","ring the number"], tag:"paraphrasing", ev:"please call the number on the back of your ticket", ex:"'Get separated from the group' is repeated almost exactly - listen for the instruction after it."}
 ]}
 ]
},
{
 id:"L7", title:"Library Study Spaces", level:"Upper-Intermediate", category:"Education", mock:null, part:3,
 voices:{M:"gb_m2", W:"us_f"},
 lines:[
 ["M","Hi. I'm new this term, and I wanted to ask about places to study in the library."],
 ["W","Of course. There are three main options. The first is the silent reading room, which is on the second floor. You don't need to book it, it's first come, first served, but phones must be switched off completely. Not just on silent."],
 ["M","OK. And what about group work?"],
 ["W","For that you'd want one of the group study rooms. They're on the ground floor. People often say they're next to the café, but they're actually beside the computer area. You need to book those online, and you can have a room for a maximum of three hours a day."],
 ["M","Three hours. And is there anywhere with specialist computers?"],
 ["W","Yes, the digital lab. That's in the basement. It has software for design and statistics. You book it at the help desk, not online, and during exam periods it's open until midnight."],
 ["M","Great. Are there any other services I should know about?"],
 ["W","A few. Laptop loans: you'll need to show your student card every time you borrow one. Printing is available at weekends as well as on weekdays. And the research skills workshops: some students think they're only for postgraduates, but they're open to everyone, and they're completely free of charge."]
 ],
 groups:[
 {qtype:"Table Completion", instr:"Complete the table. Write NO MORE THAN TWO WORDS for each answer.", limit:2, table:{head:["Space","Location","Booking","Notes"], rows:[["Silent reading room","second floor","no booking","phones must be [1]"],["Group study rooms","ground floor, beside the [2]","online","maximum [3] a day"],["Digital lab","[4]","at help desk","open until midnight in exam periods"]]}, items:[
  {q:"Silent reading room: phones must be ___", a:["switched off","off","turned off"], tag:"detail", ev:"phones must be switched off completely", ex:"'Not just on silent' is a distractor."},
  {q:"Group study rooms: beside the ___", a:["computer area"], tag:"distractors", ev:"they're actually beside the computer area", ex:"'Next to the café' is what people wrongly say."},
  {q:"Group study rooms: maximum ___ a day", a:["3 hours","three hours"], tag:"numbers", ev:"a maximum of three hours a day", ex:"Include the unit 'hours'."},
  {q:"Digital lab location: ___", a:["basement","the basement"], tag:"detail", ev:"That's in the basement", ex:"Direct detail."}
 ]},
 {qtype:"Matching", instr:"What does the librarian say about each service? Choose the correct letter, A–E.", options:["A  free of charge","B  only for postgraduates","C  must be booked a week ahead","D  available at weekends","E  requires a student card"], optKey:"letter", items:[
  {q:"Laptop loans", a:"E", tag:"detail", ev:"you'll need to show your student card every time", ex:"Student card = E."},
  {q:"Printing", a:"D", tag:"detail", ev:"Printing is available at weekends", ex:"Weekends = D."},
  {q:"Research skills workshops", a:"A", tag:"distractors", ev:"they're completely free of charge", ex:"'Only for postgraduates' is mentioned as a false belief."}
 ]}
 ]
},
{
 id:"L8", title:"How a Solar Still Works", level:"Advanced", category:"Science", mock:null, part:4,
 voices:{N:"us_m"}, diagram:"still",
 lines:[
 ["N","A solar still is a simple device that produces drinking water using only the heat of the sun."],
 ["N","To build one, you dig a hole in the ground, roughly a metre across. In the centre of the hole you place a container, such as a cup or a bowl, to collect the water."],
 ["N","The hole is then covered with a sheet of clear plastic, which is held in place around the edges with soil or rocks. Finally, a small stone is placed in the middle of the sheet, directly above the container, so that the plastic dips down to form a cone shape."],
 ["N","Here's how it works. Sunlight passes through the plastic and heats the ground, and moisture in the soil evaporates. When this water vapour touches the underside of the plastic, which is cooler, it condenses into droplets."],
 ["N","Because of the cone shape, the droplets run down towards the lowest point and drip into the container."],
 ["N","It's worth stressing that the amount of water produced is small. A still like this is a survival tool, not a solution for a whole community. Its output depends heavily on how much moisture there is in the soil, and adding green plants inside the hole can increase it."]
 ],
 groups:[
 {qtype:"Diagram Label Completion", instr:"Label the diagram. Write ONE WORD ONLY for each answer.", limit:1, diagram:"still", items:[
  {q:"Label 1: sheet of clear ___", a:["plastic"], tag:"detail", ev:"a sheet of clear plastic", ex:"The cover is clear plastic."},
  {q:"Label 2: small ___ in the middle of the sheet", a:["stone","rock"], tag:"detail", ev:"a small stone is placed in the middle of the sheet", ex:"Rocks hold the edges; a stone weighs down the centre."},
  {q:"Label 3: ___ to collect the water", a:["container","cup","bowl"], tag:"paraphrasing", ev:"you place a container, such as a cup or a bowl, to collect the water", ex:"'Container' is the general word; cup or bowl are accepted."}
 ]},
 {qtype:"Summary Completion", instr:"Complete the summary. Write ONE WORD ONLY for each answer.", limit:1, items:[
  {q:"Sunlight heats the ground and moisture in the soil ___ .", a:["evaporates"], tag:"fast speech", ev:"moisture in the soil evaporates", ex:"Verb in the present simple, third person: evaporates."},
  {q:"The vapour ___ on the cooler underside of the plastic.", a:["condenses"], tag:"paraphrasing", ev:"it condenses into droplets", ex:"Condense = turn from gas into liquid."},
  {q:"Output can be increased by adding green ___ .", a:["plants"], tag:"detail", ev:"adding green plants inside the hole can increase it", ex:"Plural noun."}
 ]}
 ]
},

/* ---------------- Mock Test 01 (exclusive content) ---------------- */
{
 id:"M1L1", title:"Enrolling on an Evening Course", level:"Intermediate", category:"Daily life", mock:"01", part:1,
 voices:{W:"gb_f", M:"gb_m"},
 lines:[
 ["W","Good morning, Riverside Arts Centre. How can I help?"],
 ["M","Hi. I'd like to enrol on one of your evening courses, please."],
 ["W","Of course. Which course are you interested in?"],
 ["M","I was thinking about the watercolour class, but I've just seen on your website that it's full. So, the drawing course, please."],
 ["W","Right, Introduction to Drawing. Can I take your name?"],
 ["M","Yes, it's Daniel Whitcombe."],
 ["W","Could you spell your surname for me?"],
 ["M","Sure. W, H, I, T, C, O, M, B, E."],
 ["W","Thank you. And your address?"],
 ["M","Forty-two Mill Lane. Oh no, sorry, I've just moved. It's seventeen Harbour Road."],
 ["W","Seventeen Harbour Road. And the postcode?"],
 ["M","B R six, four J T."],
 ["W","And a contact phone number?"],
 ["M","My mobile is oh seven nine four six, three eight one, five two oh."],
 ["W","Lovely. Now, the course used to run on Tuesday evenings, but this term it's on Thursdays, from seven until nine."],
 ["M","Thursdays is fine."],
 ["W","The fee is ninety-five pounds for the term. There's a discount for students, which brings it down to seventy-six pounds. Are you a student?"],
 ["M","No, I'm not, I'm afraid."],
 ["W","No problem. You'll need to bring your own materials. We provide pencils, but please bring a sketchbook."],
 ["M","OK."],
 ["W","And how did you hear about us?"],
 ["M","Well, I saw a poster in the library, but it was actually a friend who recommended the drawing course to me."],
 ["W","That's great. And finally, the first class is on the fourteenth of March."],
 ["M","The fourteenth. Perfect, thank you."]
 ],
 groups:[
 {qtype:"Form Completion", instr:"Complete the form. Write ONE WORD AND/OR A NUMBER for each answer.", limit:1, items:[
  {q:"Course: ___", a:["drawing"], tag:"distractors", ev:"So, the drawing course, please", ex:"The watercolour class is full - a distractor."},
  {q:"Surname: ___", a:["whitcombe"], tag:"spelling", ev:"W, H, I, T, C, O, M, B, E", ex:"Copy the spelling letter by letter."},
  {q:"Address: ___ Harbour Road", a:["17","seventeen"], tag:"distractors", ev:"It's seventeen Harbour Road", ex:"42 Mill Lane is his old address."},
  {q:"Postcode: ___", a:["br64jt","br6 4jt"], tag:"spelling", ev:"B R six, four J T", ex:"Letters and numbers mixed: BR6 4JT."},
  {q:"Phone: ___", a:["07946381520"], tag:"numbers", ev:"oh seven nine four six, three eight one, five two oh", ex:"'Oh' = 0."},
  {q:"Day: ___", a:["thursday","thursdays"], tag:"distractors", ev:"this term it's on Thursdays", ex:"'Used to run on Tuesday' signals old information."},
  {q:"Fee: £ ___", a:["95","ninety-five","ninety five"], tag:"numbers", ev:"The fee is ninety-five pounds for the term", ex:"He is not a student, so no discount."},
  {q:"Bring a ___", a:["sketchbook","sketch book","sketch-book"], tag:"detail", ev:"please bring a sketchbook", ex:"Pencils are provided."},
  {q:"Heard about the centre from a ___", a:["friend"], tag:"distractors", ev:"it was actually a friend who recommended the drawing course", ex:"'Actually' introduces the correct answer; the poster is a distractor."},
  {q:"First class: ___ March", a:["14","14th","fourteenth"], tag:"numbers", ev:"the first class is on the fourteenth of March", ex:"Dates: 14, 14th or fourteenth are all acceptable."}
 ]}
 ]
},
{
 id:"M1L2", title:"Welcome to the Hartley Museum", level:"Upper-Intermediate", category:"Culture", mock:"01", part:2,
 voices:{N:"gb_m"}, map:"museum",
 lines:[
 ["N","Good morning, and welcome to the Hartley Museum. Before you start exploring, let me explain where everything is. If you look at the plan in your leaflet, you'll see the main entrance at the bottom."],
 ["N","As you come in through the main entrance, the cloakroom is immediately on your right. Some visitors expect the café to be next to the entrance, but the room on your left as you come in is actually our education room for school groups."],
 ["N","Walk straight ahead into the Central Hall, and you'll find the café on your left."],
 ["N","The gift shop has moved recently. It used to be in the room to the right of the Central Hall, which is now the Portrait Gallery. The shop is now at the far end of the building, in the top left-hand corner."],
 ["N","Directly behind the Central Hall, at the back of the building in the middle, is the temporary exhibition room. And in the top right-hand corner, you'll find the doors that lead out to the sculpture garden."],
 ["N","Now, a few practical points. We're open every day except Monday, although during the school holidays we do open on Mondays too."],
 ["N","There used to be a guided tour at half past ten, but the free morning tour now starts at eleven o'clock, and there's another one in the afternoon."],
 ["N","You're welcome to take photographs in all the galleries, as long as you don't use flash."],
 ["N","If you want to see the Portrait Gallery, I'd go there first. Not because it closes early, it doesn't, but because by midday it gets very crowded."],
 ["N","Finally, large bags must be left in the cloakroom. I'm afraid we don't have any lockers. Enjoy your visit."]
 ],
 groups:[
 {qtype:"Map Labelling", instr:"Label the plan. Choose the correct letter, A–G.", options:["A","B","C","D","E","F","G"], map:"museum", items:[
  {q:"Cloakroom", a:"B", tag:"detail", ev:"the cloakroom is immediately on your right", ex:"Right of the entrance = B."},
  {q:"Café", a:"C", tag:"distractors", ev:"you'll find the café on your left", ex:"A is the education room - the speaker corrects the expectation."},
  {q:"Gift shop", a:"E", tag:"distractors", ev:"in the top left-hand corner", ex:"D was the old shop; it is now the Portrait Gallery."},
  {q:"Temporary exhibition room", a:"F", tag:"detail", ev:"at the back of the building in the middle", ex:"Behind the Central Hall = F."},
  {q:"Sculpture garden (doors)", a:"G", tag:"detail", ev:"in the top right-hand corner", ex:"Top right = G."}
 ]},
 {qtype:"Multiple Choice", instr:"Choose the correct letter, A, B or C.", items:[
  {q:"The museum is normally closed on", opts:["Mondays.","Tuesdays.","Sundays."], a:"A", tag:"detail", ev:"We're open every day except Monday", ex:"The school-holiday exception does not change the normal rule."},
  {q:"The free morning tour starts at", opts:["10.30.","11.00.","2.30."], a:"B", tag:"distractors", ev:"the free morning tour now starts at eleven o'clock", ex:"10.30 was the old time."},
  {q:"Photography in the galleries is", opts:["not allowed.","allowed without flash.","allowed only in the garden."], a:"B", tag:"paraphrasing", ev:"as long as you don't use flash", ex:"'As long as' = on condition that."},
  {q:"The speaker suggests visiting the Portrait Gallery first because", opts:["it is less crowded early in the day.","it closes early.","it has the most famous painting."], a:"A", tag:"distractors", ev:"by midday it gets very crowded", ex:"He explicitly rejects 'closes early'."},
  {q:"Large bags must be", opts:["left in the cloakroom.","carried at the front.","left in lockers."], a:"A", tag:"detail", ev:"large bags must be left in the cloakroom", ex:"There are no lockers."}
 ]}
 ]
},
{
 id:"M1L3", title:"A Project on Visitor Behaviour", level:"Advanced", category:"Education", mock:"01", part:3,
 voices:{T:"gb_m2", W:"sc_f", M:"us_m"},
 lines:[
 ["T","So, Maya and Tom, how's the project on visitor behaviour going?"],
 ["W","Quite well, thanks. We've decided to focus on how long visitors spend in front of each artwork."],
 ["M","We originally wanted to look at the whole museum, but that was far too ambitious, so we've chosen just one gallery."],
 ["T","Sensible. And how are you collecting your data?"],
 ["W","We considered interviews, but people don't really want to stop and talk. So we're observing visitors and timing them with a stopwatch."],
 ["T","How many visitors have you observed?"],
 ["M","We aimed for two hundred, but we've got a hundred and twenty so far."],
 ["T","And has anything surprised you?"],
 ["W","The average time was much shorter than we expected. Under thirty seconds per artwork."],
 ["M","Although people did spend longer with the works that had an audio guide."],
 ["T","What's been your biggest problem?"],
 ["M","Honestly, deciding when a visit to an artwork actually starts. Is it when someone glances at it, or when they stop walking? Getting permission from the museum was easy, by comparison."],
 ["T","That's a classic issue. Now, let's talk about your reading. How useful have your sources been?"],
 ["W","The museum's annual report was really helpful. It gives visitor numbers for every gallery."],
 ["M","The journal article from the nineties is interesting, but the data are so old that we can't really rely on them."],
 ["W","The management textbook is fine, but it's far too general. It hardly mentions visitor behaviour at all."],
 ["M","The dissertation from last year didn't have very useful results, but the way they designed their observation sheet helped us a lot with our method."],
 ["W","And I thought the online visitor reviews would be the most useful thing of all, but they were so hard to interpret. People write in so many different styles."],
 ["M","We spent hours on them and still weren't sure what they meant."]
 ],
 groups:[
 {qtype:"Multiple Choice", instr:"Choose the correct letter, A, B or C.", items:[
  {q:"The students decided to study", opts:["the whole museum.","one gallery.","online visitors."], a:"B", tag:"distractors", ev:"so we've chosen just one gallery", ex:"The whole museum was their original idea."},
  {q:"Their main method of collecting data is", opts:["interviews.","questionnaires.","observation."], a:"C", tag:"paraphrasing", ev:"we're observing visitors and timing them", ex:"Interviews were rejected."},
  {q:"How many visitors have they observed so far?", opts:["120","200","220"], a:"A", tag:"numbers", ev:"we've got a hundred and twenty so far", ex:"200 was the target."},
  {q:"What surprised them?", opts:["Visitors spent less time than expected.","Visitors preferred sculptures.","Audio guides were unpopular."], a:"A", tag:"paraphrasing", ev:"much shorter than we expected", ex:"Audio guides actually increased viewing time."},
  {q:"Their biggest difficulty is", opts:["getting permission from the museum.","defining when viewing begins.","analysing the statistics."], a:"B", tag:"paraphrasing", ev:"deciding when a visit to an artwork actually starts", ex:"Permission was 'easy, by comparison'."}
 ]},
 {qtype:"Matching", instr:"What do the students say about each source? Choose the correct letter, A–F.", options:["A  very useful","B  too old to rely on","C  too general","D  useful for methods only","E  difficult to interpret","F  too expensive"], optKey:"letter", items:[
  {q:"The museum's annual report", a:"A", tag:"detail", ev:"The museum's annual report was really helpful", ex:"'Really helpful' = very useful."},
  {q:"The journal article", a:"B", tag:"paraphrasing", ev:"the data are so old that we can't really rely on them", ex:"Too old to rely on."},
  {q:"The management textbook", a:"C", tag:"detail", ev:"it's far too general", ex:"Direct match."},
  {q:"Last year's dissertation", a:"D", tag:"paraphrasing", ev:"helped us a lot with our method", ex:"Results weren't useful, but the method was."},
  {q:"Online visitor reviews", a:"E", tag:"distractors", ev:"they were so hard to interpret", ex:"She expected them to be the most useful - a distractor for A."}
 ]}
 ]
},
{
 id:"M1L4", title:"Light and the Care of Artworks", level:"IELTS Level", category:"Art", mock:"01", part:4,
 voices:{N:"gb_f"},
 lines:[
 ["N","Today I'm going to talk about one of the greatest threats to works of art on paper and canvas, and that is light."],
 ["N","The first thing to understand is that light damage is cumulative. In other words, it adds up over time, and once it has happened, it cannot be reversed."],
 ["N","The most harmful part of light is ultraviolet radiation, which is invisible to the human eye. Museums now use filters on windows and on lamps to remove it."],
 ["N","However, visible light also causes damage, particularly to watercolours and to textiles, whose colours gradually fade."],
 ["N","For this reason, conservators measure light levels in a unit called lux. For the most sensitive objects, the usual recommendation is about fifty lux, roughly the light of a dim room. Oil paintings can generally tolerate higher levels, around two hundred lux."],
 ["N","Another important strategy is rotation. Sensitive works are displayed for a limited period, and then returned to dark storage to rest, while other works take their place."],
 ["N","Heat from lighting is a further problem. It can make materials expand and contract, and over time this movement causes cracks. Modern LED lighting produces much less heat than older lamps, and it emits almost no ultraviolet."],
 ["N","Finally, a word about humidity. If the air is too damp, mould may grow, and if it is too dry, wood and canvas can become brittle."]
 ],
 groups:[
 {qtype:"Note Completion", instr:"Complete the notes. Write ONE WORD AND/OR A NUMBER for each answer.", limit:1, items:[
  {q:"Light damage is ___ and cannot be reversed.", a:["cumulative"], tag:"detail", ev:"light damage is cumulative", ex:"Cumulative = adds up over time."},
  {q:"The most harmful type of light: ___ radiation", a:["ultraviolet","uv"], tag:"detail", ev:"ultraviolet radiation, which is invisible", ex:"UV is also accepted."},
  {q:"___ on windows and lamps remove it.", a:["filters"], tag:"detail", ev:"Museums now use filters on windows", ex:"Plural noun."},
  {q:"Visible light makes watercolours and ___ fade.", a:["textiles"], tag:"fast speech", ev:"particularly to watercolours and to textiles", ex:"Listen for the second item in a list."},
  {q:"Light levels are measured in ___ .", a:["lux"], tag:"spelling", ev:"a unit called lux", ex:"Short technical words are easy to misspell."},
  {q:"Sensitive objects: about ___ lux", a:["50","fifty"], tag:"numbers", ev:"about fifty lux", ex:"Fifty (50), not fifteen (15) - listen to the stress."},
  {q:"Oil paintings: about ___ lux", a:["200","two hundred"], tag:"numbers", ev:"around two hundred lux", ex:"Higher tolerance for oils."},
  {q:"___ : sensitive works are shown for a limited time, then stored in the dark.", a:["rotation"], tag:"paraphrasing", ev:"Another important strategy is rotation", ex:"The definition follows the term."},
  {q:"Heat can cause ___ in materials over time.", a:["cracks"], tag:"paraphrasing", ev:"over time this movement causes cracks", ex:"Plural noun."},
  {q:"Too much humidity allows ___ to grow.", a:["mould","mold"], tag:"spelling", ev:"mould may grow", ex:"British 'mould' or American 'mold' are both accepted."}
 ]}
 ]
}
];

/* ---------------- Map & diagram definitions ---------------- */
export const MAPS = {
 museum:{ w:360, h:300, title:"Hartley Museum - ground floor",
  rooms:[
   {x:10,y:10,w:110,h:80,label:"E"},{x:125,y:10,w:110,h:80,label:"F"},{x:240,y:10,w:110,h:80,label:"G"},
   {x:10,y:95,w:110,h:90,label:"C"},{x:125,y:95,w:110,h:90,label:"Central Hall",fixed:true},{x:240,y:95,w:110,h:90,label:"D"},
   {x:10,y:190,w:110,h:80,label:"A"},{x:125,y:190,w:110,h:80,label:"Foyer",fixed:true},{x:240,y:190,w:110,h:80,label:"B"}
  ],
  entrance:{x:180,y:285,label:"Main entrance"} }
};
