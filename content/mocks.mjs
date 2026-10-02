/* ===== MOCK TESTS (exclusive content: not used in practice packs) =====
   To add Mock Test 02: create sets with mock:"02" and add an entry below. No core changes needed. */
export const MOCKS = [
 { id:"mock-01", title:"Mock Test 01",
   listening:["M1L1","M1L2","M1L3","M1L4"], reading:["R1","R2","R3"],
   writing:{
    t1Academic:{id:"M1-T1A", type:"Bar chart", title:"Household internet use", prompt:"The chart below shows the percentage of households with internet access in four regions of a country in 2010 and 2025.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
      chart:{kind:"bar", unit:"%", categories:["North","South","East","West"], series:[{name:"2010",values:[45,62,38,55]},{name:"2025",values:[88,94,81,90]}]}},
    t1GT:{id:"M1-T1G", type:"Formal letter", title:"Hotel booking problem", prompt:"You recently stayed at a hotel, but your room was not the type you had booked.\n\nWrite a letter to the hotel manager. In your letter\n• give details of your booking\n• explain what was wrong with the room\n• say what you would like the hotel to do\n\nWrite at least 150 words. Begin your letter: Dear Sir or Madam,"},
    t2:{id:"M1-T2", type:"Discussion essay", prompt:"Some people think that private collectors should be allowed to buy important works of art, while others believe such works should belong only to public museums. Discuss both views and give your own opinion."}
   },
   speaking:{
    p1:{topic:"Neighbourhood", questions:["Can you describe the area where you live?","What do you like about your neighbourhood?","Is there anything you would change about it?","Do you know your neighbours well?"]},
    p2:{id:"M1-C", topic:"Describe an object that is important to you.", points:["what the object is","how you got it","how long you have had it","and explain why it is important to you"]},
    p3:["Why do people keep objects that have no practical use?","Do people in your country value old things or new things more?","How has online shopping changed what people buy?","Should important objects be kept in museums or in families?"]
   }
 }
];
