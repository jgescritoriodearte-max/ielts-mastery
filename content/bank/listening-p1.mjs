/* ===== LISTENING PART 1 BANK (original IELTS-style practice scripts, written for this app) =====
   Part 1: everyday transactional conversation between two speakers.
   All names, places, prices and phone numbers are invented (UK numbers use fictional ranges). */

export const SETS = [
/* ---------------- LP1-01 · band 5.5 ---------------- */
{
 id:"LP1-01", title:"Joining a Sports Centre", category:"Leisure", band:5.5, mock:null, part:1,
 voices:{R:"gb_f", C:"gb_m2"},
 lines:[
 ["R","Good morning, Halbrook Leisure Centre. How can I help you?"],
 ["C","Oh, hello. I'd like to join the centre, please. I've just moved to the area and I'd like to start using the gym and the pool."],
 ["R","Lovely. I can do that for you over the phone. I just need to take a few details first. Could I have your name, please?"],
 ["C","Yes, it's Daniel Whitcombe."],
 ["R","Could you spell your surname for me?"],
 ["C","Sure. It's W, H, I, T, C, O, M, B, E. Whitcombe."],
 ["R","Thank you. And what's your address, Daniel?"],
 ["C","It's forty-two Marley Road. That's M, A, R, L, E, Y. Marley Road."],
 ["R","And the postcode?"],
 ["C","H B seven, four P Q."],
 ["R","Great. And a phone number we can contact you on?"],
 ["C","My mobile is oh seven seven oh oh, nine oh oh, three six one. No, sorry, that's not right. It's two six one at the end. Oh seven seven oh oh, nine oh oh, two six one."],
 ["R","Two six one. Got it. Now, what kind of membership are you interested in? We have three types."],
 ["C","I'm not sure. What are the differences?"],
 ["R","Well, the off-peak membership is twenty-four pounds a month, but you can only come in on weekdays before four o'clock in the afternoon."],
 ["C","Ah, that's no good for me. I work in an office until five."],
 ["R","Then there's our standard membership. That's thirty-two pounds a month, and you can use the gym and the swimming pool at any time."],
 ["C","That sounds good. And the third one?"],
 ["R","The premium membership is forty-five pounds a month. It includes everything in the standard one, plus all the fitness classes and the sauna."],
 ["C","Hmm. I don't really go to classes, to be honest. I just want to swim and use the gym. So I'll take the standard one, please."],
 ["R","Standard membership, thirty-two pounds a month. There's also a joining fee. It's usually twenty pounds, but this month it's half price, so it's just ten pounds."],
 ["C","Oh, that's lucky. And when can I start?"],
 ["R","Whenever you like. When would suit you?"],
 ["C","Could I start on Monday the fourteenth? Oh, wait. I'm away for work that week. Let's say Monday the twenty-first instead."],
 ["R","The twenty-first of March. No problem. Now, how would you like to pay? For monthly memberships we only accept direct debit, I'm afraid. We can't take cash or credit cards for the monthly fee."],
 ["C","That's fine. Direct debit it is."],
 ["R","I'll email you the form. When you come in for the first time, you'll need to bring something that shows your address, like a bank statement or a gas bill."],
 ["C","Do I need a passport photo for the membership card?"],
 ["R","No, we used to ask for one, but now we just take your picture at reception. So only the proof of address."],
 ["C","OK. Is there anything else I should know?"],
 ["R","Yes. Before you use the gym, every new member has to do an induction. That's a short session with one of our trainers, who shows you how to use the machines safely."],
 ["C","When are those?"],
 ["R","They're on Tuesday and Thursday evenings. I could book you in for Thursday the twenty-fourth at half past six."],
 ["C","Perfect. Do I need to bring anything special?"],
 ["R","Just make sure you wear trainers. The trainer won't let you on the machines in ordinary shoes. And one more thing: the lockers in the changing rooms need a one-pound coin, but you get it back afterwards."],
 ["C","Good to know. Thanks very much for your help."],
 ["R","You're welcome, Daniel. See you on the twenty-fourth."]
 ],
 groups:[
 {qtype:"Form Completion", instr:"Complete the form below. Write ONE WORD AND/OR A NUMBER for each answer.", limit:1, items:[
  {q:"Surname: ___", a:["Whitcombe"], tag:"spelling", ev:"W, H, I, T, C, O, M, B, E", ex:"Write the surname exactly as it is spelled letter by letter. A misspelled name is marked wrong in IELTS."},
  {q:"Address: 42 ___ Road", a:["Marley"], tag:"spelling", ev:"That's M, A, R, L, E, Y", ex:"Street names are often spelled out in Part 1. Listen for each letter: M-A-R-L-E-Y."},
  {q:"Mobile number: ___", a:["07700900261"], tag:"distractors", ev:"It's two six one at the end", ex:"He first says 'three six one', then corrects himself to 'two six one'. The corrected number is always the answer. 'Oh' means zero."},
  {q:"Monthly fee: £___", a:["32","thirty-two"], tag:"numbers", ev:"That's thirty-two pounds a month", ex:"He chooses the standard membership, which costs £32. £24 (off-peak) and £45 (premium) are other memberships he does not choose."},
  {q:"Joining fee this month: £___", a:["10","ten"], tag:"distractors", ev:"so it's just ten pounds", ex:"The usual fee is £20, but it is half price this month. The question asks about this month, so the answer is £10."},
  {q:"Start date: Monday ___ March", a:["21","21st","twenty-first"], tag:"distractors", ev:"Let's say Monday the twenty-first instead", ex:"He suggests the fourteenth first but changes his mind because he is away. 'Instead' signals the final answer."}
 ]},
 {qtype:"Multiple Choice", instr:"Choose the correct letter, A, B or C.", items:[
  {q:"How will Daniel pay the monthly fee?", opts:["by credit card","by direct debit","in cash"], a:"B", tag:"detail", ev:"we only accept direct debit", ex:"The receptionist says cash and credit cards are not accepted for the monthly fee, so only direct debit is possible."},
  {q:"What must Daniel bring on his first visit?", opts:["a passport photo","proof of where he lives","his bank card"], a:"B", tag:"paraphrasing", ev:"bring something that shows your address", ex:"'Something that shows your address' = proof of where he lives. A photo is no longer needed because the centre takes the picture at reception."}
 ]},
 {qtype:"Note Completion", instr:"Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.", limit:1, items:[
  {q:"Gym induction: Thursday at ___ pm", a:["6.30","6:30","18:30","half past six"], tag:"numbers", ev:"Thursday the twenty-fourth at half past six", ex:"'Half past six' in the evening is 6.30 pm. Do not confuse the time with the date (the twenty-fourth)."},
  {q:"Must wear ___ during the induction", a:["trainers"], tag:"detail", ev:"Just make sure you wear trainers", ex:"The trainer will not allow ordinary shoes on the machines, so trainers are required."}
 ]}
 ]
},
/* ---------------- LP1-02 · band 5.5 ---------------- */
{
 id:"LP1-02", title:"Reporting a Lost Bag", category:"Travel", band:5.5, mock:null, part:1,
 voices:{S:"sc_f", P:"us_m"},
 lines:[
 ["S","Hello, this is the lost property office at Castlebridge station. How can I help?"],
 ["P","Hi. I think I left my bag on a train this morning, and I'd like to report it."],
 ["S","I'm sorry to hear that. Let's fill in a report form and see if we can find it. Can I take your name first?"],
 ["P","Sure. It's Mark Adeyemi."],
 ["S","How do you spell your surname?"],
 ["P","It's A, D, E, Y, E, M, I. Adeyemi."],
 ["S","Thank you. And which train were you on?"],
 ["P","It was the train from Castlebridge to Norbury. The nine forty. Oh, no, sorry, I missed the nine forty. I got the next one, the nine fifty-five."],
 ["S","The nine fifty-five to Norbury. And do you remember which coach you were sitting in?"],
 ["P","I think it was coach C. No, actually, it was D. I remember because it was the quiet coach, and that's always coach D."],
 ["S","That's right, it is. And where did you put the bag?"],
 ["P","On the shelf above my seat. I got off in a hurry and just forgot it."],
 ["S","It happens a lot, don't worry. Now, can you describe the bag for me?"],
 ["P","It's a rucksack. A medium-sized one."],
 ["S","And what colour is it?"],
 ["P","It's navy blue. Some people think it's black, but it's actually navy."],
 ["S","Navy blue. Is there anything that makes it easy to recognise?"],
 ["P","Yes, there's a yellow luggage tag on the front pocket, with my name written on it."],
 ["S","That's very helpful. What was inside the bag?"],
 ["P","My laptop, a couple of books from the library, and my camera. Oh, and my sandwiches, but I'm not too worried about those. The laptop is the important thing. It's got all my work on it, and I haven't backed it up for weeks."],
 ["S","I'll write down laptop, books and camera. Now, I need a phone number in case we find it."],
 ["P","It's oh one one three, four nine six, oh five eight two."],
 ["S","Oh one one three, four nine six, oh five eight two. Is that a mobile?"],
 ["P","No, that's my office number. I'd rather you used that, because my mobile battery keeps dying."],
 ["S","Fine. If the bag is handed in, we'll normally send a text message, but in that case shall we contact you by email instead?"],
 ["P","Yes, email would be better. It's on the form I filled in online last year, if that helps."],
 ["S","I'll check it's still correct before you go. Now, if we find the bag, you'll need to collect it in person."],
 ["P","Where's the office? Is it still next to platform one?"],
 ["S","It used to be, but it's moved. It's now opposite the ticket office, in the main hall."],
 ["P","OK. And is there a charge?"],
 ["S","Yes, there's a small handling fee of three pounds fifty when you collect an item."],
 ["P","That's fine. How long do you keep things?"],
 ["S","We keep most items for three months. But I'm sure we'll hear something before then. Trains on that line finish at Norbury, so the cleaners usually find bags at the end of the journey and bring them back the same day."],
 ["P","That's a relief. What do I need to bring when I collect it?"],
 ["S","Some photo identification, like a passport or a driving licence, and your reference number. Yours is L, P, four, seven, two."],
 ["P","L P four seven two. Thanks so much for your help."],
 ["S","You're welcome. Fingers crossed we find it soon."]
 ],
 groups:[
 {qtype:"Form Completion", instr:"Complete the form below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.", limit:2, items:[
  {q:"Name: Mark ___", a:["Adeyemi"], tag:"spelling", ev:"It's A, D, E, Y, E, M, I", ex:"Names from other languages are always spelled in the recording. Write each letter in order."},
  {q:"Train: the ___ to Norbury", a:["9.55","9:55","09:55","nine fifty-five"], tag:"distractors", ev:"I got the next one, the nine fifty-five", ex:"He first says 'the nine forty', then explains he missed that train. The corrected time, 9.55, is the answer."},
  {q:"Coach: ___", a:["D","coach D"], tag:"distractors", ev:"No, actually, it was D", ex:"Coach C is a distractor. 'No, actually' introduces the correction. The quiet coach is always D."},
  {q:"Type of bag: ___", a:["rucksack","a rucksack","backpack"], tag:"detail", ev:"It's a rucksack", ex:"A rucksack is a bag carried on the back. 'Medium-sized' describes its size, not its type."},
  {q:"Colour: ___", a:["navy blue","navy"], tag:"distractors", ev:"It's navy blue", ex:"Black is mentioned only because some people think the bag looks black. The real colour is navy blue."},
  {q:"Identifying feature: yellow ___ on front pocket", a:["luggage tag","tag"], tag:"detail", ev:"there's a yellow luggage tag on the front pocket", ex:"'Makes it easy to recognise' is paraphrased in the form as 'identifying feature'. The tag is yellow."},
  {q:"Contact number: ___", a:["01134960582"], tag:"numbers", ev:"It's oh one one three, four nine six, oh five eight two", ex:"Write all the digits; 'oh' = 0. This is his office number, which he prefers because his mobile battery keeps dying."}
 ]},
 {qtype:"Multiple Choice", instr:"Choose the correct letter, A, B or C.", items:[
  {q:"If the bag is found, the passenger will be contacted", opts:["by text message.","by phone call.","by email."], a:"C", tag:"distractors", ev:"Yes, email would be better", ex:"The office NORMALLY sends a text, but Mark agrees to email instead. 'Normally' often introduces a distractor."}
 ]},
 {qtype:"Short Answer", instr:"Answer the questions below. Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.", limit:3, items:[
  {q:"Which part of the station is the lost property office now opposite?", a:["the ticket office","ticket office"], tag:"distractors", ev:"It's now opposite the ticket office", ex:"Mark thinks it is next to platform one, but the office has moved. 'Now' signals the current location."},
  {q:"How much is the fee for collecting an item?", a:["£3.50","3.50","three pounds fifty"], tag:"numbers", ev:"a small handling fee of three pounds fifty", ex:"'Handling fee' = the fee for collecting. Three pounds fifty is written £3.50."}
 ]}
 ]
},
/* ---------------- LP1-03 · band 6 ---------------- */
{
 id:"LP1-03", title:"Booking a Holiday Cottage", category:"Travel", band:6, mock:null, part:1,
 voices:{A:"gb_m", C:"us_f"},
 lines:[
 ["A","Good afternoon, Fernlea Holiday Cottages, Tom speaking."],
 ["C","Hi there. I'm hoping to rent a cottage near Lake Ardwater for a week in August. I saw your website, but I wanted to check a few things before I book."],
 ["A","Of course. We've got three cottages on the estate at the moment. Shall I run through them?"],
 ["C","Yes, please."],
 ["A","The smallest is Bramble Cottage. It sleeps four people. In August it's five hundred and eighty pounds a week. Oh, sorry, no, I'm reading the July prices. In August it's six hundred and forty."],
 ["C","Six hundred and forty. And what's it like?"],
 ["A","It's quite traditional inside, but the best thing about it is the balcony upstairs. It looks right out over the lake, so you get lovely sunsets."],
 ["C","Sounds beautiful. What about the others?"],
 ["A","Next is Kingfisher Cottage. It used to sleep four as well, but we converted the loft last year, so now it takes six. That one's seven hundred and twenty pounds a week."],
 ["C","Does it have anything special?"],
 ["A","It has a wood-burning stove in the sitting room, which guests love, even in summer, because the evenings can get quite cool by the water."],
 ["C","And the third?"],
 ["A","That's the Old Mill. It's our largest property and sleeps eight. It's nine hundred and fifty pounds a week, and it has its own hot tub in the garden, which nobody else can use."],
 ["C","OK. So, there are five of us, all adults, and we'd like to bring our dog. Are dogs allowed?"],
 ["A","They're welcome in Kingfisher and the Old Mill, but not in Bramble, I'm afraid. The owner has allergies, and she sometimes stays there herself."],
 ["C","Well, Bramble's too small for us anyway, and the Old Mill is a bit over our budget. So Kingfisher sounds ideal."],
 ["A","Great choice. Which week were you thinking of?"],
 ["C","We'd like to arrive on Saturday the ninth of August."],
 ["A","Let me check. Ah, I'm sorry, Kingfisher is already booked that week. The following Saturday is free, though, the sixteenth."],
 ["C","Hmm. The sixteenth would be fine, actually. My sister can't get time off until then anyway."],
 ["A","Lovely. So that's Kingfisher Cottage from Saturday the sixteenth of August, for seven nights. Could I take your name?"],
 ["C","It's Anna Lindqvist. That's L, I, N, D, Q, V, I, S, T."],
 ["A","Thank you, Ms Lindqvist. Now, there's a small extra charge for dogs, to cover cleaning. It was thirty pounds last year, but we've reduced it to twenty-five pounds per stay."],
 ["C","That's fair enough."],
 ["A","To secure the booking, we ask for a deposit of twenty per cent of the total. For Kingfisher that comes to one hundred and forty-four pounds, and the rest is due four weeks before you arrive."],
 ["C","One hundred and forty-four. I can pay that by card today. What about arrival? Do we pick up the keys from someone?"],
 ["A","Guests used to collect them from the farm shop at the end of the lane, but the shop closes at five now, and people often arrive later. So we've put a key safe by the front door. I'll text you the code on the morning you arrive."],
 ["C","Perfect. Is there anything we should bring with us? Bed linen, towels?"],
 ["A","No, those are all provided. And there's a boot room with spare wellington boots if anyone forgets theirs. But I'd definitely bring a torch. The lane down to the cottage has no street lights, and it gets very dark."],
 ["C","Good tip. What about bikes? Should we bring ours?"],
 ["A","I wouldn't bother. There's a cycle hire place in the village, and it's much cheaper than carrying bikes all that way."],
 ["C","Great. Well, I think that's everything. Shall I give you my card details now?"],
 ["A","Yes, please. I'll put you through to our secure payment line."]
 ],
 groups:[
 {qtype:"Table Completion", instr:"Complete the table below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.", limit:2,
  table:{head:["Cottage","Sleeps","Price per week (August)","Special feature"], rows:[
   ["Bramble","4","£[1]","[2] with view of the lake"],
   ["Kingfisher","[3]","£720","wood-burning stove"],
   ["Old Mill","8","£950","private [4]"]
  ]},
  items:[
  {q:"Bramble price: £___", a:["640","six hundred and forty"], tag:"distractors", ev:"In August it's six hundred and forty", ex:"£580 is the July price. Tom corrects himself, and the table asks for the August price."},
  {q:"Bramble feature: ___", a:["balcony","a balcony"], tag:"paraphrasing", ev:"the best thing about it is the balcony upstairs", ex:"'Looks right out over the lake' is paraphrased in the table as 'with view of the lake'."},
  {q:"Kingfisher sleeps: ___", a:["6","six"], tag:"distractors", ev:"so now it takes six", ex:"It USED to sleep four. After the loft conversion it sleeps six; 'takes six' = sleeps six."},
  {q:"Old Mill feature: private ___", a:["hot tub"], tag:"paraphrasing", ev:"it has its own hot tub in the garden, which nobody else can use", ex:"'Its own' and 'nobody else can use' both express the idea of 'private'."}
 ]},
 {qtype:"Form Completion", instr:"Complete the booking form below. Write ONE WORD AND/OR A NUMBER for each answer.", limit:1, items:[
  {q:"Arrival: Saturday ___ August", a:["16","16th","sixteenth"], tag:"distractors", ev:"The sixteenth would be fine, actually", ex:"She asks for the ninth, but Kingfisher is booked that week, so she accepts the sixteenth."},
  {q:"Name: Anna ___", a:["Lindqvist"], tag:"spelling", ev:"L, I, N, D, Q, V, I, S, T", ex:"Be careful with unusual letter combinations: Q followed by V, not U."},
  {q:"Dog charge: £___ per stay", a:["25","twenty-five"], tag:"distractors", ev:"we've reduced it to twenty-five pounds per stay", ex:"£30 was last year's charge. The current charge is £25."},
  {q:"Deposit: £___", a:["144","one hundred and forty-four"], tag:"numbers", ev:"For Kingfisher that comes to one hundred and forty-four pounds", ex:"Twenty per cent is mentioned, but the form asks for the amount in pounds: £144."}
 ]},
 {qtype:"Multiple Choice", instr:"Choose the correct letter, A, B or C.", items:[
  {q:"How will the guests get the keys?", opts:["from the farm shop","from a box at the cottage","from the owner"], a:"B", tag:"paraphrasing", ev:"we've put a key safe by the front door", ex:"A key safe is a small locked box. The farm shop was used in the past but now closes too early."},
  {q:"What does Tom advise the guests to bring?", opts:["a torch","their own bikes","wellington boots"], a:"A", tag:"detail", ev:"But I'd definitely bring a torch", ex:"Boots are provided in the boot room, and bikes can be hired cheaply in the village, so only the torch is recommended."}
 ]}
 ]
},
/* ---------------- LP1-04 · band 6 ---------------- */
{
 id:"LP1-04", title:"A Part-time Job at the Museum Café", category:"Work", band:6, mock:null, part:1,
 voices:{M:"gb_m2", J:"sc_f"},
 lines:[
 ["M","Hello, Atrium Café at the Hartwell Museum. Neil speaking."],
 ["J","Oh, hi. My name's Jenna. I saw your advert for a part-time café assistant, and I wondered if I could ask a few questions about it."],
 ["M","Of course, Jenna. Fire away."],
 ["J","First of all, how many hours a week is it? I'm studying, so I can't do too many."],
 ["M","Well, the advert said fifteen hours, but we've had to change that slightly. It's now twelve hours a week: all day Saturday and one weekday afternoon."],
 ["J","Twelve is actually better for me. And can I ask about the pay?"],
 ["M","It's eleven pounds eighty an hour to start with. That goes up after you've finished your three-month trial period."],
 ["J","That sounds fine. What would I actually be doing?"],
 ["M","Mostly serving customers at the counter and keeping the tables clean. We have a barista who makes all the hot drinks, so you wouldn't need to worry about the coffee machine. But in the mornings you'd be preparing salads for the lunchtime menu."],
 ["J","OK. I've worked in a sandwich bar before, so I'm used to food preparation."],
 ["M","That's useful. Do you have a food hygiene certificate?"],
 ["J","Not yet, no. Is that a problem?"],
 ["M","Not at all. Everyone needs one, but if you don't have it, we pay for you to do the course online. It takes about three hours, and you can do it at home."],
 ["J","Great. Can I ask why you're recruiting at the moment? Is someone leaving?"],
 ["M","People often assume that, but no, the whole team is staying. And we're not changing our opening hours either, although we might open late on Fridays next year. The main reason is that the new dinosaur exhibition opens in June, and we're expecting about twice as many visitors."],
 ["J","Oh, I read about that. It looks amazing. Are there any benefits for staff?"],
 ["M","A few. People always ask about parking, but sadly the car park belongs to the council, so staff have to pay like everyone else. You do get twenty per cent off everything in the museum shop, though, and you get free entry to all the paid exhibitions. Unfortunately, that's just for you, not for family members."],
 ["J","That's still nice. So how do I apply?"],
 ["M","We'd need a CV, and also a short covering letter explaining why you'd like the job. Nothing too long, one page is plenty."],
 ["J","Should I send them to you?"],
 ["M","Well, I'll be doing the interviews, but applications go to our HR assistant. Her name is Gemma Rowntree."],
 ["J","Could you spell the surname?"],
 ["M","Sure. R, O, W, N, T, R, E, E. Rowntree. Her email is on the advert."],
 ["J","Thanks. And is there a closing date?"],
 ["M","Yes. It was going to be the end of the month, but we've brought it forward because of the exhibition. So the closing date is Friday the twenty-fifth of April."],
 ["J","The twenty-fifth. And when would interviews be?"],
 ["M","The following week, probably on the Wednesday. They'll be here at the museum, but not in the café, because it's too noisy. We use the education room on the second floor. It's next to the space gallery."],
 ["J","And what would the interview involve?"],
 ["M","It's quite informal. We'll chat for about twenty minutes, and then we'll ask you to serve a pretend customer, just to see how you deal with people."],
 ["J","That sounds fine. If I have any more questions, is this the best number to call?"],
 ["M","It's better to ring the main office, actually. That's oh one nine oh four, four nine six, two seven one. Sorry, two seven three. I always get that wrong. Two seven three."],
 ["J","Oh one nine oh four, four nine six, two seven three. Thanks very much, Neil. You've been really helpful."],
 ["M","No problem, Jenna. Good luck with your application."]
 ],
 groups:[
 {qtype:"Note Completion", instr:"Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.", limit:1, items:[
  {q:"Hours: ___ per week", a:["12","twelve"], tag:"distractors", ev:"It's now twelve hours a week", ex:"The advert said fifteen hours, but this has changed. 'Now' introduces the up-to-date information."},
  {q:"Starting pay: £___ per hour", a:["11.80","11,80","eleven pounds eighty"], tag:"numbers", ev:"It's eleven pounds eighty an hour to start with", ex:"'Eleven pounds eighty' is written £11.80. 'To start with' matches 'starting pay'."},
  {q:"Morning duties: preparing ___", a:["salads"], tag:"distractors", ev:"in the mornings you'd be preparing salads for the lunchtime menu", ex:"Hot drinks are made by the barista, and sandwiches relate to Jenna's old job. Only salads match her duties here."},
  {q:"No food hygiene certificate? Staff can do a free ___ course", a:["online"], tag:"paraphrasing", ev:"we pay for you to do the course online", ex:"'We pay for you' means the course is free for the employee."},
  {q:"Main office phone: ___", a:["01904496273"], tag:"distractors", ev:"Sorry, two seven three", ex:"Neil first says 'two seven one', then corrects it to 'two seven three'. Always write the corrected version."}
 ]},
 {qtype:"Multiple Choice", instr:"Choose the correct letter, A, B or C.", items:[
  {q:"Why is the café recruiting new staff?", opts:["Some staff members are leaving.","It will have more customers soon.","It is going to open for longer."], a:"B", tag:"paraphrasing", ev:"we're expecting about twice as many visitors", ex:"Neil rejects options A and C directly. The new exhibition will bring twice as many visitors, i.e. more customers."},
  {q:"Which benefit do staff receive?", opts:["free parking","free entry for family members","a discount in the shop"], a:"C", tag:"distractors", ev:"You do get twenty per cent off everything in the museum shop", ex:"Parking is not free, and free exhibition entry is for the employee only, not family. '20% off' = a discount."}
 ]},
 {qtype:"Short Answer", instr:"Answer the questions below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.", limit:2, items:[
  {q:"Apart from a CV, what should applicants send?", a:["covering letter","a covering letter","cover letter"], tag:"detail", ev:"a short covering letter explaining why you'd like the job", ex:"The question excludes the CV, so the answer is the covering letter."},
  {q:"What is the surname of the person who receives applications?", a:["Rowntree"], tag:"spelling", ev:"R, O, W, N, T, R, E, E", ex:"Neil will interview, but applications go to Gemma Rowntree. Note the double E at the end."},
  {q:"In which room will interviews take place?", a:["education room","the education room"], tag:"detail", ev:"We use the education room on the second floor", ex:"The café is rejected because it is too noisy. The space gallery is only a landmark next to the room."}
 ]}
 ]
},
/* ---------------- LP1-05 · band 6.5 ---------------- */
{
 id:"LP1-05", title:"Arranging Home Internet Installation", category:"Daily life", band:6.5, mock:null, part:1,
 voices:{A:"gb_f", C:"gb_m"},
 lines:[
 ["A","Thanks for calling Brightwire Broadband, you're through to Lucy. Are you an existing customer?"],
 ["C","No, not yet. I've just moved into a new flat, and there's no internet connection at all, so I'd like to get something set up as soon as possible."],
 ["A","No problem. Let's start with the address so I can check what's available. What's the street name?"],
 ["C","It's Quarrington Avenue. That's Q, U, A, R, R, I, N, G, T, O, N."],
 ["A","Double R. Got it. And the number?"],
 ["C","It's flat forty. People always hear fourteen, so I'll say it again: four, oh. Forty."],
 ["A","Forty, thanks. And the postcode?"],
 ["C","D H one, five R W."],
 ["A","Lovely. Right, good news, that whole street has full fibre. So you can choose from three packages. There's Essential, which gives you fifty megabits, then Fibre One Fifty, and Ultra, which is five hundred."],
 ["C","I work from home three days a week, and I'm on video calls most of the morning. My flatmate streams a lot of films, too. I was thinking Ultra?"],
 ["A","Honestly, for two people, One Fifty would be plenty. Ultra is really for big households or people uploading huge files."],
 ["C","Fair enough. What does One Fifty cost?"],
 ["A","On the eighteen-month contract it's thirty-one pounds a month. Or if you sign up for two years, it drops to twenty-seven fifty."],
 ["C","Hmm, I'm only renting this place for eighteen months, so I'll stick with the shorter one, even if it's a bit more."],
 ["A","Very sensible. So that's thirty-one pounds a month. There's no set-up fee at the moment, by the way. Normally it's fifty pounds, but it's been waived until the end of September."],
 ["C","Great. When can someone come and install it?"],
 ["A","Let me look at the engineer's diary. The earliest slot is Wednesday the ninth. Actually, no, hold on, that one's just been taken. It'll be Thursday the tenth."],
 ["C","Thursday's fine. Is it a morning or afternoon appointment?"],
 ["A","You can choose. Mornings are eight till twelve, afternoons one till five."],
 ["C","I've got a big meeting at nine, so the afternoon, please."],
 ["A","Afternoon it is. Now, someone over eighteen has to be at home for the whole appointment. The engineer can't start without an adult present."],
 ["C","That'll be me. Will the engineer need to drill through walls or anything?"],
 ["A","Possibly. The cable usually comes in at the front of the building, and the router normally goes in the hallway, next to the old phone socket."],
 ["C","The thing is, I work in the back bedroom, and the signal won't reach that far."],
 ["A","In that case, the engineer can run a cable through the roof space, so they'll need to get into the loft. Can you make sure there's nothing blocking the hatch?"],
 ["C","Sure, I'll clear it. And the router, do I need to collect it from somewhere?"],
 ["A","We used to post them out a few days before, but too many went missing, so now the engineer brings it with them on the day."],
 ["C","That's easier. Is there anything else I need to know?"],
 ["A","Just your reference number. It's B, W, seven, three, eight, one. And if you need to change the appointment, give us at least forty-eight hours' notice, otherwise there's a twenty-pound charge."],
 ["C","Forty-eight hours. Got it. Thanks, Lucy."],
 ["A","You're welcome. Enjoy the new flat."]
 ],
 groups:[
 {qtype:"Form Completion", instr:"Complete the form below. Write ONE WORD AND/OR A NUMBER for each answer.", limit:1, items:[
  {q:"Address: Flat ___, Quarrington Avenue", a:["40","forty"], tag:"distractors", ev:"People always hear fourteen, so I'll say it again: four, oh. Forty.", ex:"Fourteen and forty sound similar. He clarifies 'four, oh', which means 40."},
  {q:"Street name spelling: ___ Avenue", a:["Quarrington"], tag:"spelling", ev:"Q, U, A, R, R, I, N, G, T, O, N", ex:"Note the double R, which Lucy also checks. Spelling must be exact."},
  {q:"Package chosen: Fibre ___", a:["150","One Fifty"], tag:"distractors", ev:"Honestly, for two people, One Fifty would be plenty", ex:"He suggests Ultra but accepts Lucy's advice ('Fair enough'). The package name contains the number 150."},
  {q:"Monthly cost: £___", a:["31","thirty-one"], tag:"distractors", ev:"So that's thirty-one pounds a month", ex:"£27.50 is the price of the two-year contract, which he rejects because he is renting for only eighteen months."},
  {q:"Installation date: Thursday ___", a:["10","10th","tenth"], tag:"distractors", ev:"It'll be Thursday the tenth", ex:"Wednesday the ninth is offered first but has just been taken. The final date is Thursday the tenth."}
 ]},
 {qtype:"Multiple Choice", instr:"Choose the correct letter, A, B or C.", items:[
  {q:"Why does the caller choose an afternoon appointment?", opts:["He has an important work commitment.","His flatmate will be out in the morning.","Mornings are fully booked."], a:"A", tag:"paraphrasing", ev:"I've got a big meeting at nine, so the afternoon, please", ex:"'A big meeting' = an important work commitment. Both slots were available, so C is wrong."},
  {q:"Which part of the flat must the engineer be able to reach?", opts:["the hallway","the loft","the front wall"], a:"B", tag:"detail", ev:"so they'll need to get into the loft", ex:"The hallway and the front of the building are where things NORMALLY go; in this case the cable runs through the roof space, so the loft must be accessible."},
  {q:"How will the caller receive the router?", opts:["It will be sent by post.","He must collect it from a shop.","The engineer will bring it."], a:"C", tag:"distractors", ev:"now the engineer brings it with them on the day", ex:"Posting routers was the old system ('We used to'). The current method is the engineer bringing it."}
 ]},
 {qtype:"Note Completion", instr:"Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.", limit:1, items:[
  {q:"Set-up fee waived until the end of ___", a:["September"], tag:"detail", ev:"it's been waived until the end of September", ex:"'Waived' means the fee is not charged. The normal fee is £50, but there is no fee until the end of September."},
  {q:"To change appointment: give ___ hours' notice", a:["48","forty-eight"], tag:"numbers", ev:"give us at least forty-eight hours' notice", ex:"Do not confuse 48 hours with the £20 charge for late changes."}
 ]}
 ]
},
/* ---------------- LP1-06 · band 6.5 ---------------- */
{
 id:"LP1-06", title:"Registering for a Photography Course", category:"Leisure", band:6.5, mock:null, part:1,
 voices:{O:"us_f", A:"us_m"},
 lines:[
 ["O","Good morning, Millbrook Community Arts Centre, Rachel speaking."],
 ["A","Hi, I'm calling about the photography courses in your autumn brochure. I'd like to sign up for one, but I'm not sure which."],
 ["O","Sure, I can help with that. We're running three this term. Do you have the brochure in front of you?"],
 ["A","I've got an old copy, so some of the details might have changed."],
 ["O","OK, let me give you the current information. First, there's Digital Photography for Beginners. That's on Monday evenings, from seven to nine, and it costs eighty-five pounds for eight weeks."],
 ["A","Right. And the portrait course? My brochure says Tuesday."],
 ["O","It was going to be Tuesday, but the studio's being used by the pottery group that night, so we've moved it to Wednesday. Same time as before, six thirty to eight thirty, and it's a hundred and ten pounds."],
 ["A","And then there's a landscape course, isn't there?"],
 ["O","That's right, Landscape Photography. It's on Saturday mornings. The brochure says it starts at nine, but the tutor wants to catch the early light, so it now starts at half past eight. It's a hundred and twenty pounds, but that includes minibus travel to all the locations."],
 ["A","That sounds like the one for me. I've been taking photos for a couple of years, so I don't think I need the beginners' course, and I'm much more interested in scenery than people."],
 ["O","Great. Let me take some details. What's your name?"],
 ["A","It's Callum Fairbairn."],
 ["O","Can you spell your last name for me?"],
 ["A","F, A, I, R, B, A, I, R, N."],
 ["O","Thank you. And a contact number?"],
 ["A","My cell is oh seven seven oh oh, nine oh oh, five four eight. Sorry, I'm still getting used to British numbers. Five eight four at the end, not five four eight."],
 ["O","Five eight four. Got it. Now, the course was meant to start on the twelfth of October, but that's the half-term holiday, so the first session is now the nineteenth."],
 ["A","The nineteenth suits me fine."],
 ["O","What kind of camera do you use?"],
 ["A","I've got a bridge camera. Is that OK, or do I need something more professional?"],
 ["O","That's absolutely fine. Some people even use their phones. The one thing the tutor does insist on is a tripod, because you'll be taking long exposures of waterfalls and sunsets."],
 ["A","I've got one somewhere. Anything else?"],
 ["O","Spare batteries are a good idea, because you'll be outdoors for about three hours. And bring waterproof clothing. The minibus can't always park close to the viewpoints."],
 ["A","Understood. Is there any kind of discount? I'm a part-time student at the college."],
 ["O","Yes, students get fifteen per cent off. You'll just need to show your student card at the first session."],
 ["A","Brilliant. And what happens at the end of the course? Is there a certificate?"],
 ["O","There's no certificate, but every year we display the best photos. Last year the exhibition was in the public library, but it's closed for refurbishment until spring, so this year we'll be using the foyer of the town hall. It's a really nice space, and lots of people walk through it."],
 ["A","That's exciting. How do I pay?"],
 ["O","You can pay online, or you can come in and pay at reception. Most people pay online, but if you want the student discount, it's easier to pay in person, because we have to see the card first."],
 ["A","Then I'll come in. When's reception open?"],
 ["O","Monday to Friday, nine till five, and Saturday mornings until twelve."],
 ["A","I'll drop in on Saturday. Thanks so much."],
 ["O","You're welcome, Callum. See you soon."]
 ],
 groups:[
 {qtype:"Table Completion", instr:"Complete the table below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.", limit:2,
  table:{head:["Course","Day","Time","Cost"], rows:[
   ["Digital Photography for Beginners","Monday","7–9 pm","£[1]"],
   ["Portrait","[2]","6.30–8.30 pm","£110"],
   ["Landscape","Saturday","starts at [3] am","£120 (includes [4])"]
  ]},
  items:[
  {q:"Beginners' cost: £___", a:["85","eighty-five"], tag:"numbers", ev:"it costs eighty-five pounds for eight weeks", ex:"Eighty-five pounds is the cost; 'eight weeks' is the length of the course. Don't mix the two numbers."},
  {q:"Portrait day: ___", a:["Wednesday"], tag:"distractors", ev:"so we've moved it to Wednesday", ex:"His old brochure says Tuesday, but the course has been moved because of the pottery group."},
  {q:"Landscape start time: ___ am", a:["8.30","8:30","half past eight"], tag:"distractors", ev:"so it now starts at half past eight", ex:"Nine o'clock is the old brochure time. The tutor changed it to catch the early light."},
  {q:"Landscape price includes: ___", a:["minibus travel","travel","transport"], tag:"paraphrasing", ev:"that includes minibus travel to all the locations", ex:"The price covers minibus travel; 'transport' is an acceptable paraphrase."}
 ]},
 {qtype:"Form Completion", instr:"Complete the registration form below. Write ONE WORD AND/OR A NUMBER for each answer.", limit:1, items:[
  {q:"Surname: ___", a:["Fairbairn"], tag:"spelling", ev:"F, A, I, R, B, A, I, R, N", ex:"The pattern -air- appears twice: F-A-I-R-B-A-I-R-N."},
  {q:"Phone: ___", a:["07700900584"], tag:"distractors", ev:"Five eight four at the end, not five four eight", ex:"He first reverses the last digits and then corrects himself. The final digits are 584."},
  {q:"First session: ___ October", a:["19","19th","nineteenth"], tag:"distractors", ev:"so the first session is now the nineteenth", ex:"The twelfth is half-term, so the course starts a week later, on the nineteenth."},
  {q:"Essential equipment: a ___", a:["tripod"], tag:"paraphrasing", ev:"The one thing the tutor does insist on is a tripod", ex:"'Insist on' means it is required, i.e. essential. Batteries and waterproofs are only recommended."}
 ]},
 {qtype:"Multiple Choice", instr:"Choose the correct letter, A, B or C.", items:[
  {q:"Where will the students' photos be shown this year?", opts:["in the public library","in the town hall","on the centre's website"], a:"B", tag:"distractors", ev:"this year we'll be using the foyer of the town hall", ex:"The library was used last year but is closed for refurbishment. The foyer is the entrance area of the town hall."},
  {q:"Why will Callum pay at reception?", opts:["He prefers not to pay online.","Staff need to check a document.","It is cheaper than paying online."], a:"B", tag:"paraphrasing", ev:"it's easier to pay in person, because we have to see the card first", ex:"For the student discount, staff must see his student card (a document). The discount applies either way, so paying in person is not cheaper."}
 ]}
 ]
},
/* ---------------- LP1-07 · band 7 ---------------- */
{
 id:"LP1-07", title:"Booking a Conference Venue", category:"Work", band:7, mock:null, part:1,
 voices:{V:"sc_f", E:"gb_m2"},
 lines:[
 ["V","Ashcombe Hall events team, Fiona speaking."],
 ["E","Morning, Fiona. I'm ringing from Lumora Analytics. We're looking for a venue for our annual sales conference, and a colleague recommended you."],
 ["V","Lovely to hear. Can I take your name, so I can open an enquiry?"],
 ["E","Elliot Marchetti. That's M, A, R, C, H, E, T, T, I. Double T."],
 ["V","Thanks, Elliot. And what date are you looking at?"],
 ["E","Thursday the seventh of November. Sorry, scratch that, I've got last year's planner open. It's Thursday the fourteenth."],
 ["V","The fourteenth. We're free that day, which is lucky, because November gets busy. How many delegates are you expecting?"],
 ["E","Our usual figure is about a hundred and twenty, but the Dublin office might join us this time, which could push it up to a hundred and fifty. I'd say plan for a hundred and forty, and we'll confirm nearer the time."],
 ["V","A hundred and forty. Do you have a layout in mind?"],
 ["E","Cabaret style, ideally. Round tables, because there's a lot of group work in the afternoon."],
 ["V","OK, that rules out the Orangery, I'm afraid. It holds two hundred in rows, theatre style, but only a hundred and twenty at round tables. For a hundred and forty, cabaret, you'd want the Long Gallery. That seats up to a hundred and sixty."],
 ["E","The Long Gallery, then. Is there natural light? Our CEO always complains about windowless rooms."],
 ["V","Plenty. One whole side overlooks the gardens. Shall we talk about catering?"],
 ["E","Please."],
 ["V","We've got two day packages. The standard one gives you tea and coffee mid-morning and mid-afternoon, plus a hot buffet lunch. That's thirty-eight pounds a head."],
 ["E","And the other?"],
 ["V","The executive package has everything in the standard one, and on top of that delegates get a full breakfast when they arrive. The website still says forty-six pounds, but prices went up in September, so it's now forty-nine."],
 ["E","Forty-nine. Since a lot of people will be travelling in early, the breakfast might be worth it. I'll check with my manager. What's included in terms of equipment?"],
 ["V","The room hire covers the projector and both screens, and the Wi-Fi is free throughout the building. The only thing we charge separately for is wireless microphones. They're thirty-five pounds each for the day."],
 ["E","We'll need at least two of those, then. What about the evening? We normally have a dinner for everyone."],
 ["V","We can do a three-course dinner on the terrace, if you'd like."],
 ["E","It sounds tempting, but last year people were stuck at the venue all day and into the evening, and the feedback was that they'd have liked a change of scene. So I think we'll book a restaurant in town."],
 ["V","Completely understandable. The town centre's only ten minutes away by taxi."],
 ["E","Speaking of travel, how much parking do you have? Most of the team will drive."],
 ["V","There are a hundred and twenty spaces altogether, but thirty of those are kept for hotel guests, so ninety would be available for your delegates. Beyond that, there's an overflow field, but it isn't usable if it's been raining."],
 ["E","In November that's a risk. I'll encourage car sharing. What do you need from me to hold the date?"],
 ["V","A provisional booking is free and lasts fourteen days. To confirm it, we'd need a twenty-five per cent deposit and a signed contract."],
 ["E","Fourteen days should be enough. Could you email me a quote with both catering options?"],
 ["V","Of course. What's the best address?"],
 ["E","It's e dot marchetti at lumora analytics dot co dot uk. And my direct line is oh one one seven, four nine six, oh three nine two."],
 ["V","Perfect. I'll have that over to you this afternoon."],
 ["E","Thanks, Fiona. Speak soon."]
 ],
 groups:[
 {qtype:"Note Completion", instr:"Complete the notes below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.", limit:2, items:[
  {q:"Contact: Elliot ___", a:["Marchetti"], tag:"spelling", ev:"M, A, R, C, H, E, T, T, I", ex:"He adds 'Double T' to help. Names spelled in the recording must be copied letter for letter."},
  {q:"Date: Thursday ___ November", a:["14","14th","fourteenth"], tag:"distractors", ev:"It's Thursday the fourteenth", ex:"'Scratch that' cancels the seventh, which came from last year's planner."},
  {q:"Number of delegates to plan for: ___", a:["140","one hundred and forty","a hundred and forty"], tag:"distractors", ev:"I'd say plan for a hundred and forty", ex:"Three numbers are heard: 120 (usual), 150 (possible maximum) and 140 (the figure to plan for). 'Plan for' matches the question."},
  {q:"Room: the ___", a:["Long Gallery"], tag:"distractors", ev:"you'd want the Long Gallery", ex:"The Orangery is rejected: it holds only 120 at round tables (cabaret style), fewer than the 140 required."}
 ]},
 {qtype:"Table Completion", instr:"Complete the table below. Write ONE WORD AND/OR A NUMBER for each answer.", limit:1,
  table:{head:["Package","Includes","Price per person"], rows:[
   ["Standard","drinks twice a day + hot [1] lunch","£38"],
   ["Executive","as Standard + [2] on arrival","£[3]"]
  ]},
  items:[
  {q:"Standard lunch: hot ___", a:["buffet"], tag:"detail", ev:"plus a hot buffet lunch", ex:"'Tea and coffee mid-morning and mid-afternoon' is summarised in the table as 'drinks twice a day'. The lunch is a hot buffet."},
  {q:"Executive extra: ___ on arrival", a:["breakfast"], tag:"paraphrasing", ev:"delegates get a full breakfast when they arrive", ex:"'When they arrive' = 'on arrival'. 'On top of that' signals the extra item."},
  {q:"Executive price: £___", a:["49","forty-nine"], tag:"distractors", ev:"so it's now forty-nine", ex:"£46 is the out-of-date website price. Prices rose in September to £49."}
 ]},
 {qtype:"Multiple Choice", instr:"Choose the correct letter, A, B or C.", items:[
  {q:"Which item will cost extra?", opts:["the projector","wireless microphones","internet access"], a:"B", tag:"paraphrasing", ev:"The only thing we charge separately for is wireless microphones", ex:"'Charge separately' = cost extra. The projector is part of room hire and the Wi-Fi (internet access) is free."},
  {q:"Why does Elliot decide not to have dinner at the venue?", opts:["The terrace is too small for the group.","Delegates wanted to go somewhere different.","A restaurant in town is cheaper."], a:"B", tag:"paraphrasing", ev:"they'd have liked a change of scene", ex:"'A change of scene' means going somewhere different. Neither size nor price is mentioned as a reason."}
 ]},
 {qtype:"Short Answer", instr:"Answer the question below. Write ONE WORD AND/OR A NUMBER for your answer.", limit:1, items:[
  {q:"How many parking spaces can the delegates use?", a:["90","ninety"], tag:"numbers", ev:"so ninety would be available for your delegates", ex:"There are 120 spaces in total, but 30 are kept for hotel guests: 120 − 30 = 90. The overflow field is not guaranteed."}
 ]}
 ]
}
];
