/* ===== WRITING & SPEAKING PROMPTS (original, IELTS-style). Chart figures are illustrative practice data. ===== */
export const WRITING_T1_ACADEMIC = [
 {id:"T1-line", type:"Line graph", title:"Visitors to three museums", prompt:"The graph below shows the number of visitors (in thousands) to three museums in a city between 2010 and 2020.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
  chart:{kind:"line", unit:"thousand visitors", xLabels:["2010","2012","2014","2016","2018","2020"], series:[{name:"History Museum",values:[420,450,470,500,530,310]},{name:"Art Gallery",values:[300,340,400,460,520,280]},{name:"Science Centre",values:[510,500,480,470,450,260]}]}},
 {id:"T1-bar", type:"Bar chart", title:"Reading habits by age", prompt:"The chart below shows the percentage of adults in one country who read at least one book a month, by age group, in 2005 and 2025.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
  chart:{kind:"bar", unit:"%", categories:["18-29","30-44","45-59","60+"], series:[{name:"2005",values:[48,52,55,61]},{name:"2025",values:[39,44,53,66]}]}},
 {id:"T1-pie", type:"Pie chart", title:"Culture budget", prompt:"The pie charts below show how a city council spent its culture budget in 2014 and 2024.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
  chart:{kind:"pie", pies:[{title:"2014",slices:[{label:"Museums",value:40},{label:"Libraries",value:30},{label:"Festivals",value:15},{label:"Heritage sites",value:10},{label:"Digital projects",value:5}]},{title:"2024",slices:[{label:"Museums",value:32},{label:"Libraries",value:22},{label:"Festivals",value:18},{label:"Heritage sites",value:13},{label:"Digital projects",value:15}]}]}},
 {id:"T1-table", type:"Table", title:"Weekly study hours", prompt:"The table below shows the average number of hours per week that university students in five countries spent on different study activities.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
  chart:{kind:"table", head:["Country","Lectures","Independent study","Group work","Online learning"], rows:[["Country A","12","15","4","3"],["Country B","15","10","6","5"],["Country C","9","18","3","8"],["Country D","14","12","8","2"],["Country E","10","14","5","9"]]}},
 {id:"T1-process", type:"Process", title:"Recycling glass bottles", prompt:"The diagram below shows how glass bottles are recycled.\n\nSummarise the information by selecting and reporting the main features.",
  chart:{kind:"process", steps:["Used bottles collected from recycling bins","Transported to a sorting plant","Sorted by colour (clear, green, brown)","Washed to remove labels and dirt","Crushed into small pieces called cullet","Melted in a furnace at about 1,500°C","Moulded into new bottles","Filled and delivered to shops"]}},
 {id:"T1-map", type:"Map", title:"Town centre changes", prompt:"The maps below show the centre of a small town in 2000 and today.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
  chart:{kind:"map", maps:[{title:"2000",features:[{x:10,y:10,w:120,h:70,label:"Car park"},{x:140,y:10,w:110,h:70,label:"Market hall"},{x:10,y:90,w:240,h:22,label:"Main Street (traffic)",road:true},{x:10,y:122,w:80,h:70,label:"Bank"},{x:100,y:122,w:150,h:70,label:"Factory"}]},{title:"Today",features:[{x:10,y:10,w:120,h:70,label:"Library & café"},{x:140,y:10,w:110,h:70,label:"Market hall"},{x:10,y:90,w:240,h:22,label:"Main Street (pedestrian)",road:true},{x:10,y:122,w:80,h:70,label:"Restaurant"},{x:100,y:122,w:150,h:70,label:"Apartments + park"}]}]}},
 {id:"T1-multi", type:"Multiple data", title:"Energy in two charts", prompt:"The bar chart shows electricity production from renewable sources in one country in 2015 and 2025. The pie chart shows the share of each source in 2025.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
  chart:{kind:"multi", charts:[{kind:"bar", unit:"TWh", categories:["Hydro","Wind","Solar","Biomass"], series:[{name:"2015",values:[60,8,1,9]},{name:"2025",values:[62,30,22,11]}]},{kind:"pie", pies:[{title:"2025 share",slices:[{label:"Hydro",value:50},{label:"Wind",value:24},{label:"Solar",value:17},{label:"Biomass",value:9}]}]}]}},
 {id:"T1-mixed", type:"Mixed charts", title:"Cruise passengers", prompt:"The line graph shows the number of cruise passengers visiting a port city from 2018 to 2024. The table shows the average amount each passenger spent in the city.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
  chart:{kind:"multi", charts:[{kind:"line", unit:"thousand passengers", xLabels:["2018","2019","2020","2021","2022","2023","2024"], series:[{name:"Passengers",values:[210,240,30,60,190,260,290]}]},{kind:"table", head:["Year","Average spending per passenger (US$)"], rows:[["2018","95"],["2020","70"],["2022","88"],["2024","104"]]}]}}
];

export const WRITING_T1_GT = [
 {id:"GT-formal-1", type:"Formal letter", title:"Lost luggage", prompt:"You recently travelled by plane and your suitcase did not arrive at your destination.\n\nWrite a letter to the airline. In your letter\n• give details of your flight and the suitcase\n• explain the problems this has caused you\n• say what you would like the airline to do\n\nWrite at least 150 words. You do NOT need to write any addresses. Begin your letter: Dear Sir or Madam,"},
 {id:"GT-formal-2", type:"Formal letter", title:"Course complaint", prompt:"You attended an evening course at a local college, but you were not satisfied with it.\n\nWrite a letter to the college director. In your letter\n• describe the course you took\n• explain what was unsatisfactory\n• suggest how the course could be improved\n\nWrite at least 150 words. Begin your letter: Dear Sir or Madam,"},
 {id:"GT-semi-1", type:"Semi-formal letter", title:"Noise from a neighbour", prompt:"Your neighbour has recently started doing building work at weekends, and the noise is disturbing you.\n\nWrite a letter to your neighbour. In your letter\n• explain the situation\n• describe how it affects you\n• suggest a solution\n\nWrite at least 150 words. Begin your letter: Dear …,"},
 {id:"GT-semi-2", type:"Semi-formal letter", title:"Request to your manager", prompt:"You would like to take a short course that would help you in your job.\n\nWrite a letter to your manager. In your letter\n• describe the course\n• explain how it would benefit your work\n• ask for time off or financial support\n\nWrite at least 150 words. Begin your letter: Dear …,"},
 {id:"GT-informal-1", type:"Informal letter", title:"Invitation to visit", prompt:"A friend from another country is planning to visit your city next month.\n\nWrite a letter to your friend. In your letter\n• say how you feel about the visit\n• suggest places to visit together\n• give advice about what to bring\n\nWrite at least 150 words. Begin your letter: Dear …,"},
 {id:"GT-informal-2", type:"Informal letter", title:"Thank you for your help", prompt:"A friend helped you when you moved to a new home.\n\nWrite a letter to your friend. In your letter\n• thank your friend for the help\n• describe your new home\n• invite your friend to visit\n\nWrite at least 150 words. Begin your letter: Dear …,"}
];

export const WRITING_T2 = [
 {id:"T2-op-1",type:"Opinion essay",prompt:"Some people believe that museums should be free for everyone. To what extent do you agree or disagree?"},
 {id:"T2-op-2",type:"Opinion essay",prompt:"Unpaid community service should be a compulsory part of high school programmes. To what extent do you agree or disagree?"},
 {id:"T2-op-3",type:"Opinion essay",prompt:"Governments should spend more money on public transport and less on building new roads. To what extent do you agree or disagree?"},
 {id:"T2-op-4",type:"Opinion essay",prompt:"Art and music are less important school subjects than science and mathematics. To what extent do you agree or disagree?"},
 {id:"T2-ag-1",type:"Agree / disagree",prompt:"International tourism has brought more harm than good to the places that tourists visit. Do you agree or disagree?"},
 {id:"T2-ag-2",type:"Agree / disagree",prompt:"It is better for children to grow up in the countryside than in a big city. Do you agree or disagree?"},
 {id:"T2-ag-3",type:"Agree / disagree",prompt:"Online learning will eventually replace traditional classrooms. Do you agree or disagree?"},
 {id:"T2-ag-4",type:"Agree / disagree",prompt:"Famous artworks should be returned to the countries where they were originally created. Do you agree or disagree?"},
 {id:"T2-dis-1",type:"Discussion essay",prompt:"Some people think that the government should fund the arts, while others believe this money should be spent on healthcare and education. Discuss both views and give your own opinion."},
 {id:"T2-dis-2",type:"Discussion essay",prompt:"Some people prefer to work for a large company, while others prefer a small one. Discuss both views and give your own opinion."},
 {id:"T2-dis-3",type:"Discussion essay",prompt:"Some believe that university education should be free, while others think students should pay. Discuss both views and give your own opinion."},
 {id:"T2-dis-4",type:"Discussion essay",prompt:"Some people think that history is the most important subject at school, while others believe subjects about the future, such as technology, matter more. Discuss both views and give your own opinion."},
 {id:"T2-ad-1",type:"Advantages / disadvantages",prompt:"More and more people are working from home. What are the advantages and disadvantages of this trend?"},
 {id:"T2-ad-2",type:"Advantages / disadvantages",prompt:"Many museums now display their collections online. Do the advantages of this development outweigh the disadvantages?"},
 {id:"T2-ad-3",type:"Advantages / disadvantages",prompt:"Some young people choose to take a gap year before university. What are the advantages and disadvantages of this?"},
 {id:"T2-ad-4",type:"Advantages / disadvantages",prompt:"In many countries, people are living longer. Do the advantages of this outweigh the disadvantages?"},
 {id:"T2-ps-1",type:"Problem / solution",prompt:"Many historic city centres are becoming overcrowded with tourists. What problems does this cause, and what solutions can you suggest?"},
 {id:"T2-ps-2",type:"Problem / solution",prompt:"Art theft from museums and churches remains a serious problem in many countries. Why does this happen, and what can be done to prevent it?"},
 {id:"T2-ps-3",type:"Problem / solution",prompt:"In many cities, young people cannot afford to buy a home. What are the causes of this problem, and what measures could be taken?"},
 {id:"T2-ps-4",type:"Problem / solution",prompt:"Fewer young people are reading books for pleasure. Why is this happening, and how can reading be encouraged?"},
 {id:"T2-tp-1",type:"Two-part question",prompt:"Many people today collect objects such as stamps, coins or works of art. Why do people collect things? Is collecting a positive or negative activity?"},
 {id:"T2-tp-2",type:"Two-part question",prompt:"More people are choosing to study abroad. Why is this? Is it a positive or negative development for their home countries?"},
 {id:"T2-tp-3",type:"Two-part question",prompt:"Some people spend a lot of money on luxury items. Why do they do this? Should governments discourage it?"},
 {id:"T2-tp-4",type:"Two-part question",prompt:"Cruise holidays have become very popular. Why are they so popular? What effects do they have on the places that ships visit?"}
];

export const SPEAKING_P1 = {
 "Home":["Do you live in a house or an apartment?","What do you like most about your home?","Is there anything you would like to change about it?","Do you plan to live there for a long time?"],
 "Work":["What do you do?","Why did you choose that job?","What do you find most challenging about your work?","Would you like to change your job in the future?"],
 "Studies":["Are you studying at the moment?","What subject did you enjoy most at school?","Do you prefer studying alone or with other people?","What would you like to study in the future?"],
 "Family":["Do you have a large family?","Who are you closest to in your family?","How often do you spend time with your family?","Do you think families are as close today as in the past?"],
 "Hobbies":["What do you like to do in your free time?","Did you have a hobby as a child?","Is there a hobby you would like to try?","Do you think hobbies should be relaxing or challenging?"],
 "Travel":["Do you enjoy travelling?","What was the last place you visited?","Do you prefer travelling alone or with others?","Where would you like to travel in the future?"],
 "Food":["What kind of food do you like?","Do you enjoy cooking?","Is there any food you didn't like as a child but like now?","How important is food in your culture?"],
 "Technology":["How often do you use your phone?","What app do you use most?","Has technology made your life easier?","Is there any technology you would like to stop using?"],
 "Daily life":["What is your daily routine like?","What is your favourite time of day?","Do you usually plan your day in advance?","Has your routine changed recently?"],
 "Friends":["How often do you see your friends?","What do you usually do together?","Is it easy for you to make new friends?","Do you prefer having a few close friends or many friends?"],
 "Weather":["What's the weather like where you live?","What kind of weather do you like most?","Does the weather affect your mood?","Has the weather in your city changed in recent years?"],
 "Free time":["How do you usually spend your weekends?","Do you have enough free time?","Do you prefer staying at home or going out?","What did you do in your free time when you were a child?"],
 "Art":["Do you like art?","Did you learn art at school?","Have you ever visited an art gallery?","Would you like to have a work of art at home?"]
};

export const SPEAKING_P2 = [
 {id:"C1",topic:"Describe a museum or gallery you enjoyed visiting.",points:["where it was","when you went there","what you saw there","and explain why you enjoyed it"],p3:["Why do you think some people never visit museums?","Should museums be free for everyone?","How can museums attract more young visitors?","Will virtual museums replace real ones in the future?"]},
 {id:"C2",topic:"Describe a person who has had a strong influence on your career.",points:["who this person is","how you know them","what they did","and explain why they influenced you"],p3:["What qualities make a good mentor?","Do young people today have more role models than in the past?","Is it better to learn from experience or from other people?"]},
 {id:"C3",topic:"Describe a skill you learned that took a long time to master.",points:["what the skill is","when you started learning it","how you learned it","and explain why it took so long"],p3:["Which skills are most important for young people today?","Should schools teach practical skills such as cooking?","Is it harder for adults to learn new skills than children?"]},
 {id:"C4",topic:"Describe a city you have visited that you would like to return to.",points:["where it is","when you visited","what you did there","and explain why you would like to go back"],p3:["What makes a city attractive to tourists?","What problems can tourism cause for local people?","How can cities protect their historic buildings?"]},
 {id:"C5",topic:"Describe a time when you had to solve a difficult problem at work.",points:["what the problem was","when it happened","how you solved it","and explain how you felt afterwards"],p3:["Are problem-solving skills more important than knowledge?","How do companies train employees to deal with problems?","Do people work better alone or in teams when solving problems?"]},
 {id:"C6",topic:"Describe a piece of art you would like to own.",points:["what it is","who created it","where you saw it","and explain why you would like to own it"],p3:["Why do people spend huge amounts of money on art?","Should governments buy important artworks for the public?","Is art a good investment?"]},
 {id:"C7",topic:"Describe a goal you hope to achieve in the next few years.",points:["what the goal is","why it is important to you","what you are doing to achieve it","and explain how you will feel if you achieve it"],p3:["Is it important for young people to set goals?","Why do some people give up on their goals?","Do people's goals change as they get older?"]},
 {id:"C8",topic:"Describe a journey you made by sea or by air that you remember well.",points:["where you went","who you travelled with","what happened during the journey","and explain why you remember it"],p3:["How has international travel changed in recent decades?","What are the environmental effects of air and sea travel?","Will people travel more or less in the future?"]},
 {id:"C9",topic:"Describe a book that you found useful.",points:["what the book was","when you read it","what it was about","and explain why it was useful to you"],p3:["Do people read less than they used to?","Are e-books better than printed books?","What kinds of books should children read?"]},
 {id:"C10",topic:"Describe a historic building in your country.",points:["what the building is","where it is","what it is used for now","and explain why it is important"],p3:["Why is it important to preserve old buildings?","Who should pay for the protection of historic sites?","Should old buildings be converted for new uses?"]}
];

export const SHADOWING = {
 "Fluency":[
  "Well, that's an interesting question. I've never really thought about it before, but I'd say…",
  "To be honest, it depends on the situation. On the one hand…, but on the other hand…",
  "What I mean is that people tend to value experiences more than possessions these days.",
  "Let me think about that for a second. I suppose the main reason is convenience.",
  "That's a difficult one to answer, but if I had to choose, I'd go for the second option."
 ],
 "Pronunciation":[
  "I've worked in hospitality for several years, mostly with international clients.",
  "The museum's collection includes paintings, sculptures and decorative objects.",
  "Environmental problems require international cooperation.",
  "I thoroughly enjoyed the theatre performance on Thursday.",
  "Vocabulary development is essential for academic success."
 ],
 "Intonation":[
  "Do you really think so? I'm not so sure.",
  "It wasn't just interesting; it was absolutely fascinating!",
  "If I had the chance, I'd definitely go back.",
  "Some people love it, while others can't stand it.",
  "Would you rather travel by train or by plane?"
 ],
 "Linking":[
  "I picked it up on a trip to Italy.",
  "It's an art gallery in an old part of town.",
  "We ended up eating out almost every evening.",
  "I'd like to find out more about it.",
  "Not at all; it was a lot of fun."
 ],
 "Natural expressions":[
  "It's not really my cup of tea, to be honest.",
  "I was over the moon when I got the news.",
  "It was a once-in-a-lifetime experience.",
  "I've been meaning to try it for ages.",
  "It really broadened my horizons."
 ]
};
