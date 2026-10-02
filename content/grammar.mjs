/* ===== GRAMMAR PACK: lessons + progressive exercises (original material) =====
   Exercise: q (sentence with ___ or a question), opts, a (index of the correct option),
   why (why the wrong options are wrong), natural (a natural Band 7+ way to say it), lvl 1-3 */
export const GRAMMAR = [
{ id:"tenses", title:"Tenses", summary:"Choose the tense by time and by how the action connects to other times.",
 rules:["Present simple: facts, habits, general truths (charts with no dates in Task 1 descriptions of processes).","Past simple: finished time (in 2010, last year). Always use it for past data in Task 1.","Present continuous: temporary situations and trends happening now.","Future: 'is projected to / is expected to' for forecasts in charts."],
 examples:["Between 2000 and 2010, sales rose sharply.","Many people now work from home.","The figure is expected to reach 40% by 2030."],
 ex:[
 {lvl:1,q:"In 2015, the number of visitors ___ to 2 million.",opts:["increases","increased","has increased"],a:1,why:"'In 2015' is a finished time, so the past simple is required. The present perfect cannot be used with a finished past time.",natural:"In 2015, the number of visitors increased to 2 million."},
 {lvl:1,q:"Water ___ at 100 degrees Celsius at sea level.",opts:["boils","is boiling","boiled"],a:0,why:"General scientific truths use the present simple.",natural:"Water boils at 100°C at sea level."},
 {lvl:2,q:"Nowadays, more and more people ___ online courses.",opts:["take","are taking","took"],a:1,why:"'Nowadays, more and more' describes a current, changing trend, so the present continuous is the most natural choice.",natural:"Nowadays, an increasing number of people are taking online courses."},
 {lvl:2,q:"By 2040, the population of the city ___ 5 million.",opts:["is projected to reach","reaches","reached"],a:0,why:"For forecasts in Task 1, use 'is projected/expected/predicted to'.",natural:"The city's population is projected to reach 5 million by 2040."},
 {lvl:3,q:"While the proportion of cars ___ steadily, the use of bicycles fluctuated.",opts:["was rising","has risen","rises"],a:0,why:"Two simultaneous past trends: the background trend takes the past continuous.",natural:"While car use was rising steadily, cycling fluctuated."}
 ]},
{ id:"present-perfect", title:"Present Perfect", summary:"Connect the past with now: experience, unfinished time, results.",
 rules:["Use have/has + past participle for unfinished time (since, for, this year, recently).","Never use it with a finished time (yesterday, in 2010, ago).","Very common in Task 2: 'Technology has changed the way we work.'"],
 examples:["Online shopping has grown rapidly in recent years.","I have lived in Ouro Preto since 2010.","Governments have introduced several measures."],
 ex:[
 {lvl:1,q:"I ___ in this city since 2010.",opts:["live","have lived","lived"],a:1,why:"'Since 2010' + still true now = present perfect. A common error for Portuguese speakers is 'I live here since…'.",natural:"I have lived in this city since 2010."},
 {lvl:1,q:"She ___ the report two days ago.",opts:["has finished","finished","has been finishing"],a:1,why:"'Ago' marks a finished time, so the past simple is needed.",natural:"She finished the report two days ago."},
 {lvl:2,q:"In recent decades, technology ___ the way people communicate.",opts:["transformed","has transformed","transforms"],a:1,why:"'In recent decades' is a period continuing to now.",natural:"In recent decades, technology has transformed the way people communicate."},
 {lvl:2,q:"How long ___ English?",opts:["are you studying","have you been studying","do you study"],a:1,why:"Duration up to now with an ongoing activity = present perfect continuous.",natural:"How long have you been studying English?"},
 {lvl:3,q:"This is the first time I ___ an IELTS mock test.",opts:["take","am taking","have taken"],a:2,why:"'This is the first time' is always followed by the present perfect.",natural:"This is the first time I have taken an IELTS mock test."}
 ]},
{ id:"articles", title:"Articles", summary:"a/an for one of many, the for something specific, no article for general plural/uncountable ideas.",
 rules:["General ideas: no article. 'Education is important' (not 'The education').","Specific or already mentioned: the. 'The education system in Brazil…'","Singular countable nouns always need an article or determiner.","Use 'the' with superlatives and unique things: the government, the environment, the internet."],
 examples:["Technology can improve education.","The government should invest in public transport.","A university degree is not always necessary."],
 ex:[
 {lvl:1,q:"___ education is the key to development.",opts:["The","An","(no article)"],a:2,why:"Education in general is an uncountable, general idea: no article. 'The education' sounds like Portuguese 'a educação'.",natural:"Education is the key to development."},
 {lvl:1,q:"She is ___ honest person.",opts:["a","an","the"],a:1,why:"'Honest' starts with a vowel sound (the h is silent).",natural:"She is an honest person."},
 {lvl:2,q:"Pollution is harming ___ environment.",opts:["an","the","(no article)"],a:1,why:"'The environment' refers to the natural world as a unique thing.",natural:"Pollution is harming the environment."},
 {lvl:2,q:"Many people believe that ___ children should learn a second language.",opts:["the","(no article)","a"],a:1,why:"Children in general (plural, general) take no article.",natural:"Many people believe that children should learn a second language."},
 {lvl:3,q:"___ number of students studying abroad has risen, but ___ number of them return home.",opts:["The / a","A / the","The / the"],a:0,why:"'The number of' refers to the total quantity and takes a singular verb ('has risen'). 'A number of' means 'several' and takes a plural verb ('return').",natural:"The number of students studying abroad has risen, but a number of them return home."}
 ]},
{ id:"prepositions", title:"Prepositions", summary:"Fixed combinations that are frequently tested in Writing.",
 rules:["Trend language: increase BY (amount), increase TO (final level), an increase IN (something).","Time: in 2020, on Monday, at 9 pm, between 2000 and 2010, from… to…","Common verb + preposition: depend on, focus on, contribute to, result in, consist of."],
 examples:["Sales increased by 20% to 500 units.","There was a sharp rise in unemployment.","Success depends on regular practice."],
 ex:[
 {lvl:1,q:"The price rose ___ $10 to $15.",opts:["from","since","of"],a:0,why:"'From X to Y' shows the starting and final values.",natural:"The price rose from $10 to $15."},
 {lvl:1,q:"It depends ___ the situation.",opts:["of","on","from"],a:1,why:"'Depend on' is fixed. 'Depend of' is a direct translation of 'depender de'.",natural:"It depends on the situation."},
 {lvl:2,q:"There was a significant increase ___ the number of tourists.",opts:["of","in","on"],a:1,why:"Noun 'increase' + IN + the thing that increases.",natural:"There was a significant increase in the number of tourists."},
 {lvl:2,q:"Unemployment fell ___ 3%, reaching 7%.",opts:["by","to","in"],a:0,why:"'By' shows the size of the change; 'to' shows the final value (7%).",natural:"Unemployment fell by 3% to 7%."},
 {lvl:3,q:"Excessive screen time can contribute ___ poor sleep.",opts:["for","to","in"],a:1,why:"'Contribute to' is the fixed collocation.",natural:"Excessive screen time can contribute to poor sleep."}
 ]},
{ id:"conditionals", title:"Conditionals", summary:"Real, hypothetical and past hypothetical situations - essential for Task 2 arguments.",
 rules:["Zero: If + present, present (general truths).","First: If + present, will + verb (real future).","Second: If + past, would + verb (hypothetical present/future).","Third: If + had + past participle, would have + past participle (past regret).","Mixed and inverted forms (Were governments to…, Had they invested…) show Band 8 range."],
 examples:["If governments invest in public transport, traffic will decrease.","If cities were better planned, people would walk more.","Had the council acted earlier, the building would have been saved."],
 ex:[
 {lvl:1,q:"If it rains tomorrow, we ___ at home.",opts:["stay","will stay","would stay"],a:1,why:"A real future possibility uses the first conditional: will + verb.",natural:"If it rains tomorrow, we will stay at home."},
 {lvl:1,q:"If I ___ more time, I would study every day.",opts:["have","had","would have"],a:1,why:"Second conditional: If + past simple. Never 'would' in the if-clause.",natural:"If I had more time, I would study every day."},
 {lvl:2,q:"If the government ___ taxes on fuel, people might use public transport more.",opts:["raised","will raise","would raise"],a:0,why:"Hypothetical policy = second conditional (If + past).",natural:"If the government raised fuel taxes, people might use public transport more."},
 {lvl:2,q:"If she had studied harder, she ___ the exam.",opts:["would pass","would have passed","will pass"],a:1,why:"Past unreal condition: would have + past participle.",natural:"If she had studied harder, she would have passed the exam."},
 {lvl:3,q:"___ more funding available, the museum could extend its opening hours.",opts:["If there is","Were there","Had there"],a:1,why:"Inversion 'Were there…' = 'If there were…', a formal second conditional.",natural:"Were there more funding available, the museum could extend its opening hours."}
 ]},
{ id:"passive", title:"Passive Voice", summary:"Focus on the action or result, not on who did it. Essential for Task 1 processes.",
 rules:["Form: be + past participle (is made, was built, has been reduced).","Use it in process diagrams: 'The glass is crushed and then melted.'","Use it in formal writing when the agent is unknown or unimportant."],
 examples:["The bottles are collected and taken to a recycling plant.","A new bridge was built in 2005.","It is widely believed that…"],
 ex:[
 {lvl:1,q:"The museum ___ in 1890.",opts:["built","was built","has built"],a:1,why:"The museum did not build anything; it received the action. Past passive: was + past participle.",natural:"The museum was built in 1890."},
 {lvl:1,q:"First, the leaves ___ by hand.",opts:["pick","are picked","picked"],a:1,why:"Process description: present simple passive.",natural:"First, the leaves are picked by hand."},
 {lvl:2,q:"A new law ___ next year.",opts:["will introduce","will be introduced","is introducing"],a:1,why:"Future passive: will be + past participle.",natural:"A new law will be introduced next year."},
 {lvl:2,q:"It ___ that the economy will recover.",opts:["is expected","expects","is expecting"],a:0,why:"Impersonal passive 'It is expected that…' is formal and common in Task 2.",natural:"It is expected that the economy will recover."},
 {lvl:3,q:"Since 2010, several old factories ___ into apartments.",opts:["have converted","have been converted","were converted"],a:1,why:"Present perfect passive (since 2010 = up to now).",natural:"Since 2010, several old factories have been converted into apartments."}
 ]},
{ id:"relative", title:"Relative Clauses", summary:"Join ideas and add information: who, which, that, whose, where.",
 rules:["who = people; which = things; that = people/things in defining clauses; whose = possession; where = places.","Non-defining clauses take commas and never 'that': 'Brazil, which is…'.","Reduced clauses ('the man standing there', 'a book written in 1900') add sophistication."],
 examples:["Students who study abroad gain independence.","Ouro Preto, which is a UNESCO site, attracts many tourists.","The city where I grew up has changed."],
 ex:[
 {lvl:1,q:"People ___ exercise regularly tend to live longer.",opts:["which","who","whose"],a:1,why:"For people, use 'who' (or 'that').",natural:"People who exercise regularly tend to live longer."},
 {lvl:1,q:"This is the town ___ I was born.",opts:["where","which","who"],a:0,why:"For places with 'be born in', use 'where' (= in which).",natural:"This is the town where I was born."},
 {lvl:2,q:"London, ___ is the capital of England, has many museums.",opts:["that","which","what"],a:1,why:"Non-defining clause (with commas) cannot use 'that'.",natural:"London, which is the capital of England, has many museums."},
 {lvl:2,q:"Artists ___ work is sold at auction can become famous quickly.",opts:["who","whose","which"],a:1,why:"Possession (their work) = whose.",natural:"Artists whose work is sold at auction can become famous quickly."},
 {lvl:3,q:"Most of the people ___ in the survey were over 40.",opts:["who interviewed","interviewed","were interviewed"],a:1,why:"Reduced passive relative clause: 'people (who were) interviewed'.",natural:"Most of the people interviewed in the survey were over 40."}
 ]},
{ id:"modals", title:"Modal Verbs", summary:"Express obligation, possibility, advice and degrees of certainty - and hedge your claims.",
 rules:["Obligation: must, have to; advice: should, ought to.","Possibility/hedging: may, might, could - key for academic tone.","Past deduction: must have, might have, can't have + past participle.","Modal + base verb (no 'to'): 'should invest', not 'should to invest'."],
 examples:["Governments should invest more in education.","This may lead to higher unemployment.","He must have forgotten the meeting."],
 ex:[
 {lvl:1,q:"Students ___ wear a uniform at that school; it is a rule.",opts:["must","might","could"],a:0,why:"A rule = obligation = must / have to.",natural:"Students must wear a uniform at that school."},
 {lvl:1,q:"The government should ___ more in public transport.",opts:["to invest","invest","investing"],a:1,why:"Modal verbs are followed by the base form without 'to'.",natural:"The government should invest more in public transport."},
 {lvl:2,q:"Working from home ___ reduce traffic, but the effect is uncertain.",opts:["must","may","has to"],a:1,why:"Uncertainty = may/might/could. Hedging makes Task 2 claims more academic.",natural:"Working from home may reduce traffic, although the effect is uncertain."},
 {lvl:2,q:"You ___ pay to enter the museum; it's free.",opts:["mustn't","don't have to","can't"],a:1,why:"No obligation = don't have to. 'Mustn't' means it is prohibited.",natural:"You don't have to pay to enter the museum; it's free."},
 {lvl:3,q:"The lights are off. They ___ gone home already.",opts:["must have","should have","can have"],a:0,why:"Logical deduction about the past = must have + past participle.",natural:"The lights are off, so they must have gone home already."}
 ]},
{ id:"complex", title:"Complex Sentences", summary:"Combine clauses with subordinators to show the relationship between ideas (Band 7 requires a mix).",
 rules:["Concession: although, even though, while, whereas.","Reason/result: because, since, so that, which means that.","Condition: unless, provided that, as long as.","Avoid fragments: 'Because people are busy.' is not a sentence."],
 examples:["Although online learning is flexible, it requires discipline.","Unless governments act, pollution will increase.","Many people drive because public transport is unreliable."],
 ex:[
 {lvl:1,q:"___ it was raining, we went for a walk.",opts:["Because","Although","Unless"],a:1,why:"Contrast between rain and walking = concession (although).",natural:"Although it was raining, we went for a walk."},
 {lvl:1,q:"Which is a complete sentence?",opts:["Because many people work long hours.","Many people feel stressed because they work long hours.","Working long hours and stress."],a:1,why:"A subordinate clause alone ('Because…') is a fragment. It needs a main clause.",natural:"Many people feel stressed because they work long hours."},
 {lvl:2,q:"You will not improve ___ you practise regularly.",opts:["if","unless","although"],a:1,why:"Unless = if not.",natural:"You will not improve unless you practise regularly."},
 {lvl:2,q:"Some people prefer cities, ___ others prefer the countryside.",opts:["whereas","despite","because of"],a:0,why:"'Whereas' contrasts two clauses. 'Despite' must be followed by a noun or -ing.",natural:"Some people prefer cities, whereas others prefer the countryside."},
 {lvl:3,q:"Choose the most sophisticated version:",opts:["Tourism brings money. It also damages the environment.","Tourism brings money, but it also damages the environment.","While tourism generates considerable income, it can also cause serious environmental damage."],a:2,why:"All are correct, but C combines a concessive clause with precise vocabulary (generates, considerable, serious) - typical of Band 7+.",natural:"While tourism generates considerable income, it can also cause serious environmental damage."}
 ]},
{ id:"linking", title:"Linking Words", summary:"Connect ideas accurately; overusing or misusing linkers lowers Coherence and Cohesion.",
 rules:["Addition: moreover, furthermore, in addition (+ comma, start of sentence).","Contrast: however (sentence), but (clause), despite/in spite of (+ noun/-ing).","Result: therefore, as a result, consequently.","Do not start every sentence with a linker - Band 7 uses them 'flexibly', not mechanically."],
 examples:["Many students work part-time. However, this can affect their studies.","Despite the cost, the project was approved.","Prices rose; as a result, demand fell."],
 ex:[
 {lvl:1,q:"The course was expensive. ___, it was very useful.",opts:["However","Despite","Because"],a:0,why:"Contrast between two sentences = However + comma.",natural:"The course was expensive. However, it was very useful."},
 {lvl:1,q:"___ the bad weather, the event continued.",opts:["Although","Despite","However"],a:1,why:"'Despite' + noun phrase. 'Although' needs a full clause (although the weather was bad).",natural:"Despite the bad weather, the event continued."},
 {lvl:2,q:"Car use has fallen. ___, air quality has improved.",opts:["On the other hand","As a result","In contrast"],a:1,why:"The second sentence is a consequence = as a result / consequently.",natural:"Car use has fallen; as a result, air quality has improved."},
 {lvl:2,q:"Which use of 'besides' is correct?",opts:["Besides, the plan is too expensive.","Besides the plan is cheap, it is useful.","The plan is cheap, besides useful."],a:0,why:"'Besides,' as an adverb = moreover (informal). As a preposition it needs a noun/-ing: 'Besides being cheap, …'.",natural:"Besides being cheap, the plan is useful. / Moreover, the plan is too expensive."},
 {lvl:3,q:"Choose the best cohesive version:",opts:["Firstly, cars pollute. Secondly, cars are noisy. Thirdly, cars are expensive.","Cars are not only a major source of pollution but also noisy and costly to maintain.","Cars pollute and cars are noisy and cars are expensive."],a:1,why:"B avoids mechanical 'Firstly/Secondly' lists and repetition by using 'not only… but also'.",natural:"Cars are not only a major source of pollution but also noisy and costly to maintain."}
 ]},
{ id:"sva", title:"Subject-Verb Agreement", summary:"Singular subjects take singular verbs - even when the subject is long.",
 rules:["The number of + plural noun → singular verb (The number of cars IS…).","A number of + plural noun → plural verb.","People, police → plural; news, information, advice → singular uncountable.","Everyone, each, every → singular."],
 examples:["The number of tourists has increased.","People are becoming more health-conscious.","Each of the students has a laptop."],
 ex:[
 {lvl:1,q:"People ___ more aware of health issues today.",opts:["is","are","has"],a:1,why:"'People' is plural. 'People is' comes from Portuguese 'o povo é'.",natural:"People are more aware of health issues today."},
 {lvl:1,q:"The news ___ surprising.",opts:["were","was","are"],a:1,why:"'News' is uncountable and takes a singular verb.",natural:"The news was surprising."},
 {lvl:2,q:"The number of students ___ grown significantly.",opts:["have","has","are"],a:1,why:"The head noun is 'number' (singular).",natural:"The number of students has grown significantly."},
 {lvl:2,q:"Each of the participants ___ a certificate.",opts:["receive","receives","are receiving"],a:1,why:"'Each' is singular.",natural:"Each of the participants receives a certificate."},
 {lvl:3,q:"The quality of the services provided by local councils ___ improved.",opts:["have","has","were"],a:1,why:"The subject is 'the quality' (singular); 'services' and 'councils' are inside phrases.",natural:"The quality of the services provided by local councils has improved."}
 ]},
{ id:"gerunds", title:"Gerunds (-ing)", summary:"Use -ing as a noun subject, after prepositions and after certain verbs.",
 rules:["As subject: 'Reading improves vocabulary.'","After prepositions: interested in learning, instead of driving, before leaving.","After verbs: enjoy, avoid, consider, suggest, recommend, admit, finish, mind.","'Look forward to' and 'be used to' take -ing (to is a preposition)."],
 examples:["Learning a language takes time.","I look forward to hearing from you.","She suggested taking the train."],
 ex:[
 {lvl:1,q:"I enjoy ___ in museums.",opts:["to work","working","work"],a:1,why:"'Enjoy' + -ing.",natural:"I enjoy working in museums."},
 {lvl:1,q:"I look forward to ___ from you.",opts:["hear","hearing","heard"],a:1,why:"'To' in 'look forward to' is a preposition, so -ing follows. Essential in GT letters.",natural:"I look forward to hearing from you."},
 {lvl:2,q:"___ regularly is good for mental health.",opts:["Exercise to","Exercising","To exercising"],a:1,why:"A gerund works as the subject of the sentence.",natural:"Exercising regularly is good for mental health."},
 {lvl:2,q:"He is interested ___ an art business course.",opts:["to take","in taking","for taking"],a:1,why:"Interested IN + -ing.",natural:"He is interested in taking an art business course."},
 {lvl:3,q:"She is used to ___ long hours on the ship.",opts:["work","working","worked"],a:1,why:"'Be used to' (= accustomed to) + -ing. Compare 'used to work' (past habit).",natural:"She is used to working long hours on the ship."}
 ]},
{ id:"infinitives", title:"Infinitives (to + verb)", summary:"Use to + verb for purpose and after certain verbs and adjectives.",
 rules:["Purpose: 'I study to improve my band score.' (not 'for improve').","After verbs: want, decide, plan, hope, manage, refuse, afford, aim.","After adjectives: it is important/difficult/essential to…","Verbs with a change in meaning: stop to do vs stop doing; remember to do vs remember doing."],
 examples:["I'm studying to get a scholarship.","It is essential to plan your essay.","She decided to apply to Chevening."],
 ex:[
 {lvl:1,q:"I'm saving money ___ a new laptop.",opts:["for buy","to buy","for buying to"],a:1,why:"Purpose = to + verb. 'For buy' is a common Portuguese-influenced error ('para comprar').",natural:"I'm saving money to buy a new laptop."},
 {lvl:1,q:"She decided ___ abroad.",opts:["studying","to study","study"],a:1,why:"'Decide' + to-infinitive.",natural:"She decided to study abroad."},
 {lvl:2,q:"It is essential ___ the question carefully.",opts:["reading","to read","read"],a:1,why:"It is + adjective + to-infinitive.",natural:"It is essential to read the question carefully."},
 {lvl:2,q:"He stopped ___ a coffee on the way to work.",opts:["to buy","buying","buy"],a:0,why:"'Stop to do' = stop in order to do something. 'Stop doing' = quit.",natural:"He stopped to buy a coffee on the way to work."},
 {lvl:3,q:"Many families cannot afford ___ their children to private schools.",opts:["sending","to send","send"],a:1,why:"'Afford' + to-infinitive.",natural:"Many families cannot afford to send their children to private schools."}
 ]},
{ id:"comparatives", title:"Comparatives & Superlatives", summary:"Compare data precisely - vital in Task 1.",
 rules:["Short adjectives: -er/-est (higher, the highest). Long: more/most (more expensive).","Never 'more easy' or 'more higher'.","Precise comparison: twice as high as, three times more than, slightly lower than, considerably larger.","'The + comparative, the + comparative': The more you practise, the better you get."],
 examples:["Sales in 2020 were almost twice as high as in 2010.","Coal was the least popular source of energy.","The more you read, the larger your vocabulary becomes."],
 ex:[
 {lvl:1,q:"Train travel is ___ than flying for short distances.",opts:["more cheap","cheaper","more cheaper"],a:1,why:"One-syllable adjective: add -er. Never combine 'more' with -er.",natural:"Train travel is cheaper than flying for short distances."},
 {lvl:1,q:"This was the ___ decision of my career.",opts:["most important","importantest","more important"],a:0,why:"Long adjective superlative: the most + adjective.",natural:"This was the most important decision of my career."},
 {lvl:2,q:"The figure for 2020 was ___ that for 2000.",opts:["twice as high as","two times higher of","double than"],a:0,why:"Correct pattern: twice as + adjective + as.",natural:"The figure for 2020 was twice as high as that for 2000."},
 {lvl:2,q:"___ you practise, the more confident you become.",opts:["More","The more","Most"],a:1,why:"Double comparative structure: The more…, the more…",natural:"The more you practise, the more confident you become."},
 {lvl:3,q:"Choose the most precise Task 1 sentence:",opts:["Sales in A were bigger than B.","Sales in A were considerably higher than those in B.","A sold more."],a:1,why:"B uses an intensifier (considerably), the correct adjective for figures (higher) and a reference word (those) to avoid comparing 'sales' with 'B'.",natural:"Sales in A were considerably higher than those in B."}
 ]},
{ id:"reported", title:"Reported Speech", summary:"Report what people said, asked or claimed - useful in Speaking and when citing views in Task 2.",
 rules:["Backshift when reporting past speech: 'I am tired' → He said (that) he was tired.","Questions: no inversion and no 'do': She asked where I lived.","Reporting verbs: claim, argue, suggest (that/-ing), advise (someone to), deny (-ing)."],
 examples:["Some people argue that tourism damages local culture.","He said he would call me.","She asked me whether I had visited London."],
 ex:[
 {lvl:1,q:"\"I am busy,\" she said. → She said that she ___ busy.",opts:["is","was","has been"],a:1,why:"Past reporting verb: backshift am → was.",natural:"She said that she was busy."},
 {lvl:1,q:"He asked me where ___.",opts:["did I live","I lived","do I live"],a:1,why:"Reported questions use statement word order (no inversion).",natural:"He asked me where I lived."},
 {lvl:2,q:"The doctor advised me ___ more water.",opts:["drink","to drink","drinking"],a:1,why:"advise + object + to-infinitive.",natural:"The doctor advised me to drink more water."},
 {lvl:2,q:"She suggested ___ the museum early.",opts:["to visit","visiting","us to visit"],a:1,why:"suggest + -ing (or suggest that we visit). Never 'suggest someone to'.",natural:"She suggested visiting the museum early."},
 {lvl:3,q:"\"We will reduce taxes next year,\" the minister said. → The minister said they ___ taxes the following year.",opts:["will reduce","would reduce","reduced"],a:1,why:"will → would; next year → the following year.",natural:"The minister said they would reduce taxes the following year."}
 ]}
];
