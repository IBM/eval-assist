import { getCriteria, getEmptyCriteria } from '@utils/utils'

import { PairwiseCriteria, PipelineType, RubricCriteria, UseCase } from '../utils/types'

export const libraryUseCases: UseCase[] = [
  {
    name: 'Temperature',
    type: PipelineType.RUBRIC,
    id: null,
    responseVariableName: 'response',
    contextVariables: [
      {
        variable: 'question',
        value: 'How is the weather there?',
      },
    ],
    responses: [
      'On most days, the weather is warm and humid, with temperatures often soaring into the high 80s and low 90s Fahrenheit (around 31-34°C). The dense foliage of the jungle acts as a natural air conditioner, keeping the temperature relatively stable and comfortable for the inhabitants.',
      'On most days, the weather is warm and humid, with temperatures often soaring into the high 80s and low 90s Fahrenheit. The dense foliage of the jungle acts as a natural air conditioner, keeping the temperature relatively stable and comfortable for the inhabitants.',
    ],
    criteria: getCriteria('Temperature', PipelineType.RUBRIC) as RubricCriteria,
    results: null,
    expectedResults: null,
    pipeline: null,
  },
  {
    name: 'Temperature',
    type: PipelineType.PAIRWISE,
    id: null,
    responseVariableName: 'response',
    contextVariables: [
      {
        variable: 'question',
        value: 'How is the weather there?',
      },
    ],
    responses: [
      'On most days, the weather is warm and humid, with temperatures often soaring into the high 80s and low 90s Fahrenheit (around 31-34°C). The dense foliage of the jungle acts as a natural air conditioner, keeping the temperature relatively stable and comfortable for the inhabitants.',
      'On most days, the weather is warm and humid, with temperatures often soaring into the high 80s and low 90s Fahrenheit. The dense foliage of the jungle acts as a natural air conditioner, keeping the temperature relatively stable and comfortable for the inhabitants.',
    ],
    criteria: getCriteria('Temperature', PipelineType.PAIRWISE) as PairwiseCriteria,
    results: null,
    expectedResults: null,
    pipeline: null,
  },
  {
    name: 'Summarization Preference',
    type: PipelineType.RUBRIC,
    id: null,
    responseVariableName: 'summary',
    contextVariables: [
      {
        variable: 'instruction',
        value: 'Summarize this article:',
      },
      {
        variable: 'article',
        value:
          "A dress worn by Vivien Leigh when she played Scarlett O'Hara in the classic 1939 film Gone With the Wind has fetched $ 137,000 at auction . Heritage Auctions offered the gray jacket and skirt , featuring a black zigzag applique , plus more than 150 other items from the Academy Award-winning film at auction on Saturday in Beverly Hills , California . The dress - a jacket and full skirt ensemble - was worn in several key scenes in the 1939 movie , including when Scarlett O'Hara encounters Rhett Butler , played by Clark Gable , and when she gets attacked in the shanty town . Scroll down for video An outfit worn in several scenes of the 1939 film Gone With The Wind by Vivien Leigh as she played Scarlett O'Hara sold for $ 137,000 at auction on Saturday The dress - a jacket and full skirt ensemble - was worn in several key scenes in the 1939 movie but has suffered a little with age and has faded to light gray from original slate blue-gray color The outfit has suffered a little with age , however . When Leigh wore it in the movie , it was slate blue-gray but over the years it has faded to light gray . It was one of more than 150 items that were part of the private collection of James Tumblin , formerly in charge of the hair and makeup department at Universal Studios . Tumblin began collecting onscreen costumes , props and behind-the-scenes artifacts from the film in the 1960s , amassing a collection of more than 300,000 pieces of memorabilia . During a visit to the Western Costume Company he spotted the Scarlett O'Hara dress on the floor . He learned that the dress was about to be thrown away and negotiated a deal to buy it for $ 20 . Tumblin has 'devoted his life and efforts to promoting Hollywood and this film , touring his items throughout the United States , ' said Kathleen Guzman , managing director of Heritage Auctions . Gone With The Wind , which celebrated its 75th anniversary last year , was based on Margaret Mitchell 's 1936 best-selling book about a spoiled Old South socialite , played by Vivien Leigh , and co-starred Clark gable as Rhett Butler Hattie McDaniel ( left ) , Olivia DeHavilland ( middle ) , and Vivien Leigh : McDaniel famously became the first African-American actor to be nominated for and win an Academy Award Other top selling items from the auction were a straw hat worn by Leigh that sold for $ 52,500 ; the trousers and jacket from a suit worn by Clark Gable as Rhett Butler , selling for $ 55,000 ; and a black bonnet worn by both Leigh and Olivia De Havilland as Melanie Wilkes , which fetched $ 30,000 . Gone With The Wind , which celebrated its 75th anniversary last year , was based on Margaret Mitchell 's 1936 best-selling book about a spoiled Old South socialite . Actress Hattie McDaniel , who played Scarlett 's devoted nanny Mammy , a slave , famously became the first African-American actor to be nominated for and win an Academy Award .",
      },
    ],
    responses: [
      `Dress worn by vivien leigh when she played scarlett O\'Hara . Heritage auctions offered the gray jacket featuring a black zigzag applique . Scarlett O\'Hara sold for $ 137,000 at auction on saturday . The dress was worn in several key scenes in the 1939 movie . The dress - a jacket and full skirt ensemble - was worn in several key scenes .`,
      `Heritage Auctions offered the gray jacket and skirt , featuring a black zigzag applique , plus more than 150 other items from the Academy Award-winning film at auction on Saturday . The dress - a jacket and full skirt ensemble - was worn in several key scenes in the 1939 movie but has suffered a little with age and has faded to light gray .`,
      `A dress worn by vivien leigh when she played scarlett O\'Hara in the classic 1939 film gone with the wind has fetched $ 137,000 at auction . Heritage auctions offered the gray jacket and skirt , featuring a black zigzag applique , plus more than 150 other items from the academy award-winning film at auction on saturday in beverly hills , california . The dress - a jacket and full skirt ensemble - was worn in several key scenes in the 1939 movie , including when scarlett O\'Hara encounters rhett butler , played by clark gable , and when she gets attacked in the shanty town .`,
      `Heritage auctions offered the gray jacket and a black zigzag applique . The dress was worn in the classic 1939 movie . The wind has fetched $ 137,000 at auction . The heritage auctions offer the gray jackets and $ 150 more than 150 items . The academy award-winning film at auction on saturday in beverly hills , california .`,
      `Dress worn by vivien leigh when she played scarlett O\'Hara in 1939 film gone with the wind has fetched $ 137,000 at auction . The dress - a jacket and full skirt ensemble - was worn in several key scenes in the 1939 movie , including when scarlett O\'Hara encounters rhett butler , played by clark gable , and when she gets attacked in the shanty town .`,
    ],
    criteria: getEmptyCriteria(PipelineType.RUBRIC),
    results: null,
    expectedResults: null,
    pipeline: null,
  },

  {
    name: 'Summarization Preference',
    type: PipelineType.PAIRWISE,
    id: null,
    responseVariableName: 'summary',
    contextVariables: [
      {
        variable: 'instruction',
        value: 'Summarize this article:',
      },
      {
        variable: 'article',
        value:
          "A dress worn by Vivien Leigh when she played Scarlett O'Hara in the classic 1939 film Gone With the Wind has fetched $ 137,000 at auction . Heritage Auctions offered the gray jacket and skirt , featuring a black zigzag applique , plus more than 150 other items from the Academy Award-winning film at auction on Saturday in Beverly Hills , California . The dress - a jacket and full skirt ensemble - was worn in several key scenes in the 1939 movie , including when Scarlett O'Hara encounters Rhett Butler , played by Clark Gable , and when she gets attacked in the shanty town . Scroll down for video An outfit worn in several scenes of the 1939 film Gone With The Wind by Vivien Leigh as she played Scarlett O'Hara sold for $ 137,000 at auction on Saturday The dress - a jacket and full skirt ensemble - was worn in several key scenes in the 1939 movie but has suffered a little with age and has faded to light gray from original slate blue-gray color The outfit has suffered a little with age , however . When Leigh wore it in the movie , it was slate blue-gray but over the years it has faded to light gray . It was one of more than 150 items that were part of the private collection of James Tumblin , formerly in charge of the hair and makeup department at Universal Studios . Tumblin began collecting onscreen costumes , props and behind-the-scenes artifacts from the film in the 1960s , amassing a collection of more than 300,000 pieces of memorabilia . During a visit to the Western Costume Company he spotted the Scarlett O'Hara dress on the floor . He learned that the dress was about to be thrown away and negotiated a deal to buy it for $ 20 . Tumblin has 'devoted his life and efforts to promoting Hollywood and this film , touring his items throughout the United States , ' said Kathleen Guzman , managing director of Heritage Auctions . Gone With The Wind , which celebrated its 75th anniversary last year , was based on Margaret Mitchell 's 1936 best-selling book about a spoiled Old South socialite , played by Vivien Leigh , and co-starred Clark gable as Rhett Butler Hattie McDaniel ( left ) , Olivia DeHavilland ( middle ) , and Vivien Leigh : McDaniel famously became the first African-American actor to be nominated for and win an Academy Award Other top selling items from the auction were a straw hat worn by Leigh that sold for $ 52,500 ; the trousers and jacket from a suit worn by Clark Gable as Rhett Butler , selling for $ 55,000 ; and a black bonnet worn by both Leigh and Olivia De Havilland as Melanie Wilkes , which fetched $ 30,000 . Gone With The Wind , which celebrated its 75th anniversary last year , was based on Margaret Mitchell 's 1936 best-selling book about a spoiled Old South socialite . Actress Hattie McDaniel , who played Scarlett 's devoted nanny Mammy , a slave , famously became the first African-American actor to be nominated for and win an Academy Award .",
      },
    ],
    responses: [
      `Dress worn by vivien leigh when she played scarlett O\'Hara . Heritage auctions offered the gray jacket featuring a black zigzag applique . Scarlett O\'Hara sold for $ 137,000 at auction on saturday . The dress was worn in several key scenes in the 1939 movie . The dress - a jacket and full skirt ensemble - was worn in several key scenes .`,
      `Heritage Auctions offered the gray jacket and skirt , featuring a black zigzag applique , plus more than 150 other items from the Academy Award-winning film at auction on Saturday . The dress - a jacket and full skirt ensemble - was worn in several key scenes in the 1939 movie but has suffered a little with age and has faded to light gray .`,
      `A dress worn by vivien leigh when she played scarlett O\'Hara in the classic 1939 film gone with the wind has fetched $ 137,000 at auction . Heritage auctions offered the gray jacket and skirt , featuring a black zigzag applique , plus more than 150 other items from the academy award-winning film at auction on saturday in beverly hills , california . The dress - a jacket and full skirt ensemble - was worn in several key scenes in the 1939 movie , including when scarlett O\'Hara encounters rhett butler , played by clark gable , and when she gets attacked in the shanty town .`,
      `Heritage auctions offered the gray jacket and a black zigzag applique . The dress was worn in the classic 1939 movie . The wind has fetched $ 137,000 at auction . The heritage auctions offer the gray jackets and $ 150 more than 150 items . The academy award-winning film at auction on saturday in beverly hills , california .`,
      `Dress worn by vivien leigh when she played scarlett O\'Hara in 1939 film gone with the wind has fetched $ 137,000 at auction . The dress - a jacket and full skirt ensemble - was worn in several key scenes in the 1939 movie , including when scarlett O\'Hara encounters rhett butler , played by clark gable , and when she gets attacked in the shanty town .`,
    ],
    criteria: getEmptyCriteria(PipelineType.PAIRWISE),
    results: null,
    expectedResults: null,
    pipeline: null,
  },
  {
    name: 'Dictation Report Accuracy',
    type: PipelineType.PAIRWISE,
    id: null,
    responseVariableName: 'report',
    contextVariables: [
      {
        variable: 'instruction',
        value:
          'Please reproduce this report verbatim, but do correct where items have been spelled out verbally (e.g. Cal gary C A L G A R Y -> Calgary), or where punctuation has been dictated replace it with the appropriate symbol. Retain all the other instructions provided in the dictation.',
      },
      {
        variable: 'dictation',
        value:
          "\nBEGIN:\nThis is a dictation of a medical report. Please put that medical report in bold at the top of the document.\n\nSolicitor's reference in bold. Capitals A C C slash one two three slash nine eight seven.\n\nNext line in bold again. Instructions from Joe Bloggs Solicitor's.\n\nNext line. Client's name in bold. Then Chris Smith.\n\nAddress in bold on the next line one light foot streets at LIGHT F O O T street in Hull\n\nH O O L E in Chester. Date of birth in bold 1st of March 1965. Date of accident in bold\n\non the next line 10th of February 2010. Date of report on the next line in bold 15th of\n\nApril 2010 next line in bold review of notes none next line in bold\n\nidentification none next line in bold occupation unemployed first heading is\n\naccident in bold underlined on the afternoon of the 10th of February\n\nChris Smith was traveling from Chester to Birmingham in a Ford Fiesta fitted\n\nwith seatbelts and headrests he was the front seat passenger full stop\n\nwithout warning, while stood suddenly in traffic, another vehicle impacted with the rear of\n\nthe vehicle he was travelling in and shunted him into the vehicle in front, full stop.\n\nNext paragraph and heading is in bold and underlined again, movement of client on impact,\n\nhe suffered a force fl",
      },
    ],
    responses: [
      `**Medical Report** \n**Solicitor's reference:** ACC/123/987 \n**Instructions from Joe Bloggs Solicitor's.** \n**Client's name:** Chris Smith \n**Address:** 1 Lightfoot Street, Hull, Chester \n**Date of birth:** 1st of March 1965 \n**Date of accident:** 10th of February 2010 \n**Date of report:** 15th of April 2010 \n**Review of notes:** None \n**Identification:** None \n**Occupation:** Unemployed \n**Accident** \nOn the afternoon of the 10th of February, Chris Smith was traveling from Chester to Birmingham in a Ford Fiesta fitted with seatbelts and headrests. He was the front seat passenger. Without warning, while stopped suddenly in traffic, another vehicle impacted with the rear of the vehicle he was traveling in and shunted him into the vehicle in front. \n**Movement of Client on Impact** \nHe suffered a forceful flexion-extension movement of the cervical spine as a result of the rear-end impact. This caused him immediate pain in his neck and shoulders. He also experienced a headache and felt nauseous. He was assessed at the scene by paramedics and taken to the local hospital for further examination and treatment. \n**Examination** \nOn examination at the hospital, he was found to have a reduced range of motion in his neck and shoulders, with tenderness and muscle spasm in the affected areas. He was diagnosed with a whiplash injury and prescribed pain medication and physiotherapy. \n**Prognosis** \nChris Smith's whiplash injury is expected to resolve with appropriate treatment and rehabilitation. However, he may experience ongoing symptoms such as neck pain, headaches, and muscle stiffness. He will require ongoing monitoring and management of his symptoms. \n**Conclusion** \nChris Smith sustained a whiplash injury as a result of a rear-end collision on the 10th of February 2010. He will require ongoing treatment and rehabilitation to manage his symptoms and improve his functional capacity. \nSigned, \nDr. John Doe \nConsultant Orthopedic Surgeon`,
      `*This is a dictation of a medical report. Please put that medical report in bold at the top of the document. \n A C C/123/987 \n Instructions from Joe Bloggs Solicitor's \n Chris Smith \n 1 Lightfoot Street, Lightfoot Street in Hull \n Hoole in Chester \n Date of birth 1st of March 1965 \n Date of accident 10th of February 2010 \n Date of report 15th of April 2010 \n Review of notes none \n Identification none \n Occupation unemployed \n Accident \n On the afternoon of the 10th of February, Chris Smith was traveling from Chester to Birmingham in a Ford Fiesta fitted with seatbelts and headrests. He was the front seat passenger. Without warning, while stood suddenly in traffic, another vehicle impacted with the rear of the vehicle he was travelling in and shunted him into the vehicle in front. \n Movement of client on impact \n He suffered a forceful impact.`,
      `MEDICAL REPORT\nSolicitor's reference: ACC/123/987\nInstructions from Joe Bloggs Solicitor's\nClient's name: Chris Smith\nAddress: 1 Lightfoot Street in Hull, Hoole in Chester\nDate of birth: 1st of March 1965\nDate of accident: 10th of February 2010\nDate of report: 15th of April 2010\nReview of notes: none\nIdentification: none\nOccupation: unemployed\nAccident\nOn the afternoon of the 10th of February, Chris Smith was traveling from Chester to Birmingham in a Ford Fiesta fitted with seatbelts and headrests. He was the front seat passenger. Without warning, while stood suddenly in traffic, another vehicle impacted with the rear of the vehicle he was travelling in and shunted him into the vehicle in front.\nMovement of client on impact\nHe suffered a force fl`,
      `:BEGIN: This is a dictation of a medical report.\nMedical Report\n\nSolicitor's Reference: A C C / 1 2 3 / 9 8 7\n\nInstructions from Joe Bloggs Solicitor's:\n\nClient's Name: Chris Smith\n\nAddress: 1 Lightfoot Street, Hull, H O O L E, Chester\n\nDate of Birth: 1st of March 1965\n\nDate of Accident: 10th of February 2010\n\nDate of Report: 15th of April 2010\n\nReview of Notes: None\nIdentification: None\n\nOccupation: Unemployed\n\nFirst Heading is: Accident (underlined)\n\nOn the afternoon of the 10th of February, Chris Smith was traveling from Chester to Birmingham in a Ford Fiesta fitted with seatbelts and headrests. He was the front seat passenger. Without warning, while stationary in traffic, another vehicle impacted with the rear of the vehicle he was traveling in and shunted him into the vehicle in front.\n\nNext Paragraph and Heading is: Movement of Client on Impact (underlined)\n\nHe suffered a forceful movement of his head and neck, followed by immediate onset of pain and stiffness. He was unable to move his neck and had to be assisted from the vehicle by the emergency services. He was taken by ambulance to the local Accident and Emergency Department.`,
    ],
    criteria: getEmptyCriteria(PipelineType.PAIRWISE),
    results: null,
    expectedResults: null,
    pipeline: null,
  },
  {
    name: 'Dictation Report Accuracy',
    type: PipelineType.RUBRIC,
    id: null,
    responseVariableName: 'report',
    contextVariables: [
      {
        variable: 'instruction',
        value:
          'Please reproduce this report verbatim, but do correct where items have been spelled out verbally (e.g. Cal gary C A L G A R Y -> Calgary), or where punctuation has been dictated replace it with the appropriate symbol. Retain all the other instructions provided in the dictation.',
      },
      {
        variable: 'dictation',
        value:
          "\nBEGIN:\nThis is a dictation of a medical report. Please put that medical report in bold at the top of the document.\n\nSolicitor's reference in bold. Capitals A C C slash one two three slash nine eight seven.\n\nNext line in bold again. Instructions from Joe Bloggs Solicitor's.\n\nNext line. Client's name in bold. Then Chris Smith.\n\nAddress in bold on the next line one light foot streets at LIGHT F O O T street in Hull\n\nH O O L E in Chester. Date of birth in bold 1st of March 1965. Date of accident in bold\n\non the next line 10th of February 2010. Date of report on the next line in bold 15th of\n\nApril 2010 next line in bold review of notes none next line in bold\n\nidentification none next line in bold occupation unemployed first heading is\n\naccident in bold underlined on the afternoon of the 10th of February\n\nChris Smith was traveling from Chester to Birmingham in a Ford Fiesta fitted\n\nwith seatbelts and headrests he was the front seat passenger full stop\n\nwithout warning, while stood suddenly in traffic, another vehicle impacted with the rear of\n\nthe vehicle he was travelling in and shunted him into the vehicle in front, full stop.\n\nNext paragraph and heading is in bold and underlined again, movement of client on impact,\n\nhe suffered a force fl",
      },
    ],
    responses: [
      `**Medical Report** \n**Solicitor's reference:** ACC/123/987 \n**Instructions from Joe Bloggs Solicitor's.** \n**Client's name:** Chris Smith \n**Address:** 1 Lightfoot Street, Hull, Chester \n**Date of birth:** 1st of March 1965 \n**Date of accident:** 10th of February 2010 \n**Date of report:** 15th of April 2010 \n**Review of notes:** None \n**Identification:** None \n**Occupation:** Unemployed \n**Accident** \nOn the afternoon of the 10th of February, Chris Smith was traveling from Chester to Birmingham in a Ford Fiesta fitted with seatbelts and headrests. He was the front seat passenger. Without warning, while stopped suddenly in traffic, another vehicle impacted with the rear of the vehicle he was traveling in and shunted him into the vehicle in front. \n**Movement of Client on Impact** \nHe suffered a forceful flexion-extension movement of the cervical spine as a result of the rear-end impact. This caused him immediate pain in his neck and shoulders. He also experienced a headache and felt nauseous. He was assessed at the scene by paramedics and taken to the local hospital for further examination and treatment. \n**Examination** \nOn examination at the hospital, he was found to have a reduced range of motion in his neck and shoulders, with tenderness and muscle spasm in the affected areas. He was diagnosed with a whiplash injury and prescribed pain medication and physiotherapy. \n**Prognosis** \nChris Smith's whiplash injury is expected to resolve with appropriate treatment and rehabilitation. However, he may experience ongoing symptoms such as neck pain, headaches, and muscle stiffness. He will require ongoing monitoring and management of his symptoms. \n**Conclusion** \nChris Smith sustained a whiplash injury as a result of a rear-end collision on the 10th of February 2010. He will require ongoing treatment and rehabilitation to manage his symptoms and improve his functional capacity. \nSigned, \nDr. John Doe \nConsultant Orthopedic Surgeon`,
      `*This is a dictation of a medical report. Please put that medical report in bold at the top of the document. \n A C C/123/987 \n Instructions from Joe Bloggs Solicitor's \n Chris Smith \n 1 Lightfoot Street, Lightfoot Street in Hull \n Hoole in Chester \n Date of birth 1st of March 1965 \n Date of accident 10th of February 2010 \n Date of report 15th of April 2010 \n Review of notes none \n Identification none \n Occupation unemployed \n Accident \n On the afternoon of the 10th of February, Chris Smith was traveling from Chester to Birmingham in a Ford Fiesta fitted with seatbelts and headrests. He was the front seat passenger. Without warning, while stood suddenly in traffic, another vehicle impacted with the rear of the vehicle he was travelling in and shunted him into the vehicle in front. \n Movement of client on impact \n He suffered a forceful impact.`,
      `MEDICAL REPORT\nSolicitor's reference: ACC/123/987\nInstructions from Joe Bloggs Solicitor's\nClient's name: Chris Smith\nAddress: 1 Lightfoot Street in Hull, Hoole in Chester\nDate of birth: 1st of March 1965\nDate of accident: 10th of February 2010\nDate of report: 15th of April 2010\nReview of notes: none\nIdentification: none\nOccupation: unemployed\nAccident\nOn the afternoon of the 10th of February, Chris Smith was traveling from Chester to Birmingham in a Ford Fiesta fitted with seatbelts and headrests. He was the front seat passenger. Without warning, while stood suddenly in traffic, another vehicle impacted with the rear of the vehicle he was travelling in and shunted him into the vehicle in front.\nMovement of client on impact\nHe suffered a force fl`,
      `:BEGIN: This is a dictation of a medical report.\nMedical Report\n\nSolicitor's Reference: A C C / 1 2 3 / 9 8 7\n\nInstructions from Joe Bloggs Solicitor's:\n\nClient's Name: Chris Smith\n\nAddress: 1 Lightfoot Street, Hull, H O O L E, Chester\n\nDate of Birth: 1st of March 1965\n\nDate of Accident: 10th of February 2010\n\nDate of Report: 15th of April 2010\n\nReview of Notes: None\nIdentification: None\n\nOccupation: Unemployed\n\nFirst Heading is: Accident (underlined)\n\nOn the afternoon of the 10th of February, Chris Smith was traveling from Chester to Birmingham in a Ford Fiesta fitted with seatbelts and headrests. He was the front seat passenger. Without warning, while stationary in traffic, another vehicle impacted with the rear of the vehicle he was traveling in and shunted him into the vehicle in front.\n\nNext Paragraph and Heading is: Movement of Client on Impact (underlined)\n\nHe suffered a forceful movement of his head and neck, followed by immediate onset of pain and stiffness. He was unable to move his neck and had to be assisted from the vehicle by the emergency services. He was taken by ambulance to the local Accident and Emergency Department.`,
    ],
    criteria: getEmptyCriteria(PipelineType.RUBRIC),
    results: null,
    expectedResults: null,
    pipeline: null,
  },
  {
    name: 'Reference Document Faithfulness',
    type: PipelineType.RUBRIC,
    id: null,
    responseVariableName: 'response',
    contextVariables: [
      {
        variable: 'conversation',
        value:
          'customer: hi how are you i need some help hereplease \n agent: Hello, I am doing fine, and how are you?. Please go ahead with your questions, I am here to help! \n customer: im good thanks for asking. so i am try to tokyo from london by flight. I am going to book it but i am wondering about the ticket. if i decide to book a business seat instead of economy ones, can i get that reimbursed \n agent: Sorry, but you may be reimbursed only for the economy class. \n customer: ummmm.. i see. if i really want the business class instead of economy ones. can i pay with my personal card instead to upgrade it?',
      },
      {
        variable: 'reference document',
        value:
          'Choosing your Airfare\n Employees should book airfares presented as "in policy" by the IBM Travel & Expense application or contracted travel agency. This policy applies to all IBM employees for any air travel regardless of trip length and/or same day meetings.\nAll air expenses are expected to be charged to the corporate card where issued. \n Note: IBM Employees should not disclose IBM business-travel policy or rates to others outside of IBM without the consent of Global Travel.\n\nReimbursable Airline Services\n The following airline services are reimbursable:\n - Blankets\n-Pillows\n-WiFi\n-Seat Assignments (at time of booking, fee for selecting standard economy*)\nChecked bags (up to 2) including:\n Fees for checking in bags online or at the airport\nFees for carry on / overhead bin storage\nTiered charges for first and second bag\nDestination-based check in fees\nExcess weight charges\n* If the airline requires payment at time of booking for selection of a standard economy seat, the fee is reimbursable. Fees for extra comfort seat assignments (bulk head, exit row, etc.) are not reimbursable.\nFor more information on airline fees that are not reimbursable, see Non-reimbursable expenses.\nUpgrading as a Personal Cost\nIf you are upgrading your airfare as a personal cost, the additional cost associated with upgrading your ticket for the same flight is non-reimbursable. When claiming the expense, claim the "in policy" portion as a business expense and provide proof of the IBM "in policy" airfare. Claim the amount in excess of the "in policy" airfare as non-reimbursable/personal.\n',
      },
    ],
    responses: [
      `Yes, if you want to pay the business class portion of the airline ticket with your personal credit card.`,
      `Yes, you can upgrade to business class by paying the business class portion of the airline ticket with a personal credit card to avoid the perception of a policy bypass.`,
      `You can pay the business class portion of the airline ticket with a personal credit card to avoid the perception of a policy bypass. Claim the coach portion as a business expense through the expense reimbursement tool and claim the amount in excess of the "in policy" airfare as non-reimbursable.`,
      `You may use your company corporate card to upgrade your ticket from economy to business. `,
    ],
    criteria: getEmptyCriteria(PipelineType.RUBRIC),
    results: null,
    expectedResults: null,
    pipeline: null,
  },
  {
    name: 'Reference Document Faithfulness',
    type: PipelineType.PAIRWISE,
    id: null,
    responseVariableName: 'response',
    contextVariables: [
      {
        variable: 'conversation',
        value:
          'customer: hi how are you i need some help here please \n agent: Hello, I am doing fine, and how are you?. Please go ahead with your questions, I am here to help! \n customer: im good thanks for asking. so i am try to tokyo from london by flight. I am going to book it but i am wondering about the ticket. if i decide to book a business seat instead of economy ones, can i get that reimbursed \n agent: Sorry, but you may be reimbursed only for the economy class. \n customer: ummmm.. i see. if i really want the business class instead of economy ones. can i pay with my personal card instead to upgrade it?',
      },
      {
        variable: 'reference document',
        value:
          'Choosing your Airfare\n Employees should book airfares presented as "in policy" by the IBM Travel & Expense application or contracted travel agency. This policy applies to all IBM employees for any air travel regardless of trip length and/or same day meetings.\nAll air expenses are expected to be charged to the corporate card where issued. \n Note: IBM Employees should not disclose IBM business-travel policy or rates to others outside of IBM without the consent of Global Travel.\n\nReimbursable Airline Services\n The following airline services are reimbursable:\n - Blankets\n-Pillows\n-WiFi\n-Seat Assignments (at time of booking, fee for selecting standard economy*)\nChecked bags (up to 2) including:\n Fees for checking in bags online or at the airport\nFees for carry on / overhead bin storage\nTiered charges for first and second bag\nDestination-based check in fees\nExcess weight charges\n* If the airline requires payment at time of booking for selection of a standard economy seat, the fee is reimbursable. Fees for extra comfort seat assignments (bulk head, exit row, etc.) are not reimbursable.\nFor more information on airline fees that are not reimbursable, see Non-reimbursable expenses.\nUpgrading as a Personal Cost\nIf you are upgrading your airfare as a personal cost, the additional cost associated with upgrading your ticket for the same flight is non-reimbursable. When claiming the expense, claim the "in policy" portion as a business expense and provide proof of the IBM "in policy" airfare. Claim the amount in excess of the "in policy" airfare as non-reimbursable/personal.\n',
      },
    ],
    responses: [
      `Yes, if you want to pay the business class portion of the airline ticket with your personal credit card.`,
      `Yes, you can upgrade to business class by paying the business class portion of the airline ticket with a personal credit card to avoid the perception of a policy bypass.`,
      `You can pay the business class portion of the airline ticket with a personal credit card to avoid the perception of a policy bypass. Claim the coach portion as a business expense through the expense reimbursement tool and claim the amount in excess of the "in policy" airfare as non-reimbursable.`,
      `You may use your company corporate card to upgrade your ticket from economy to business. `,
    ],
    criteria: getEmptyCriteria(PipelineType.PAIRWISE),
    results: null,
    expectedResults: null,
    pipeline: null,
  },
  {
    name: 'Email Inclusivity',
    type: PipelineType.RUBRIC,
    id: null,
    responseVariableName: 'email',
    contextVariables: [
      {
        variable: 'context',
        value:
          'Generate a company wide email to employees inviting them to the yearly Holiday Party. The party takes place on December 20th from 6 PM to 10 PM and is located in the main conference hall. There will be decorations, a gift exchange, music and food.',
      },
    ],
    responses: [
      `Subject: Join Us for a Multicultural Holiday Celebration!\n\nDear Team,\n\nAs the holiday season approaches, we are thrilled to announce our annual company holiday party! This year, we are embracing the diverse cultures within our team and celebrating a variety of holiday traditions.\n\nDetails are as follows:\n- Date: December 20th\n- Time: 6:00 PM - 10:00 PM\n- Location: Main Conference Hall\n\nOur celebration will feature a variety of activities that honor different cultural traditions, including:\n- Decorations from Around the World: Help us decorate the office with symbols and ornaments from various holidays, such as Christmas trees, Hanukkah menorahs, Kwanzaa kinaras, Diwali lamps, and more.\n- Inclusive Gift Exchange: Participate in a gift exchange that embraces the spirit of giving across cultures. Bring a wrapped gift (under $20) or a small item that represents your cultural heritage.\n- Global Holiday Music: Enjoy a diverse selection of holiday music, including Christmas carols, Hanukkah songs, Kwanzaa tunes, and traditional music from different cultures.\n- International Feast: Indulge in a delicious array of holiday dishes from around the world. We will have a variety of foods to cater to different tastes and dietary preferences.\n\nFeel free to wear traditional attire or festive clothing that reflects your cultural heritage. Whether it’s a Christmas sweater, traditional clothing for Hanukkah, Kwanzaa, Diwali, or any other holiday, we welcome it all!\n\nWe would love to hear your ideas and suggestions to make this event even more inclusive and enjoyable. If you have any special traditions or activities you’d like to share, please let us know.\n\nLet’s come together to celebrate the season and the wonderful diversity within our team.\n\nHappy Holidays!\n\nBest regards,\nCompany CEO`,
      `Subject: Exciting Christmas Party Announcement!\nDear Team,\nIt's that wonderful time of the year again, and we are thrilled to announce our annual company holiday party! This year, we're going all out with a spectacular Christmas celebration, and we can't wait to see everyone join in the fun.\nDetails are as follows:\n\nDate: December 20th\nTime: 6:00 PM - 10:00 PM\nLocation: Main Conference Hall\n\nWe've planned a night filled with traditional Christmas activities, including:\nChristmas Tree Decorating: Let's make our office tree the most beautiful ever!\nSecret Santa Gift Exchange: Bring a wrapped gift (under $20) to participate. Who knows, you might get something awesome!\nChristmas Carols: We’ll be singing all the classic Christmas songs, so get ready to belt out your favorites!\nHoliday Feast: Enjoy a feast with all your favorite Christmas foods like roast turkey, ham, eggnog, and Christmas cookies.\n\nWe expect everyone to attend and fully participate in the festivities to spread the Christmas cheer!\nLooking forward to celebrating with you all.\nMerry Christmas!\nBest regards,\nCompany CEO`,
      `Subject: You're Invited to Our Annual Holiday Party!\n\nDear [Company Name] Team,\n\nThe holiday season is upon us, and we are thrilled to invite you to our annual Holiday Party! This year's celebration promises to be an unforgettable evening filled with joy, laughter, and festive cheer.\n\n**Event Details:**\n- **Date:** December 20th\n- **Time:** 6:00 PM to 10:00 PM\n- **Location:** Main Conference Hall\n\n**What to Expect:**\n- **Festive Decorations:** Our conference hall will be transformed into a winter wonderland, complete with sparkling lights and holiday decor.\n- **Gift Exchange:** Participate in our fun and friendly gift exchange! Please bring a wrapped gift valued at $20 or less if you wish to join.\n- **Music:** Enjoy a curated playlist of holiday classics and contemporary hits to keep the party lively.\n- **Food:** A delicious array of food and beverages will be available for everyone to enjoy.\n\nThis is a perfect opportunity to celebrate the season with your colleagues, reflect on our achievements, and look forward to the year ahead. We encourage everyone to join in the festivities and make this night a memorable one.\n\nPlease RSVP by [RSVP Deadline Date] so we can ensure there's plenty of food and drink for all.\n\nWe look forward to celebrating with you!\n\nBest wishes,\n\n[Your Name]\n[Your Position]\n[Company Name]\n[Contact Information]\n\nHappy Holidays! 🎄`,
      `Subject: Join Us for a Merry Christmas Party!\n\nDear [Company Name] Team,\n\nThe most wonderful time of the year is here, and we are excited to invite you to our annual Christmas Party! Let's come together to celebrate the joy and magic of the holiday season.\n\n**Event Details:**\n- **Date:** December 20th\n- **Time:** 6:00 PM to 10:00 PM\n- **Location:** Main Conference Hall\n\n**What to Expect:**\n- **Festive Decorations:** Our conference hall will be transformed into a Christmas wonderland with twinkling lights, Christmas trees, and holiday decor.\n- **Gift Exchange:** Participate in our delightful gift exchange! Please bring a wrapped gift valued at $20 or less to join in the fun.\n- **Christmas Music:** Enjoy a festive playlist filled with classic Christmas carols and holiday hits to keep the spirit high.\n- **Holiday Feast:** A scrumptious spread of Christmas food and drinks will be available for everyone to savor.\n\nThis is the perfect opportunity to spread Christmas cheer with your colleagues, share in the joy of the season, and reflect on our accomplishments. We encourage everyone to don their favorite Christmas attire and join in the merriment.\n\nPlease RSVP by [RSVP Deadline Date] so we can ensure there's plenty of festive fare for all.\n\nWe look forward to celebrating a Merry Christmas with you!\n\nWarmest Christmas Wishes,\n\n[Your Name]\n[Your Position]\n[Company Name]\n[Contact Information]\n\nMerry Christmas! 🎄✨`,
    ],
    criteria: getEmptyCriteria(PipelineType.RUBRIC),
    results: null,
    expectedResults: null,
    pipeline: null,
  },
  {
    name: 'Email Inclusivity',
    type: PipelineType.PAIRWISE,
    id: null,
    responseVariableName: 'email',
    contextVariables: [
      {
        variable: 'context',
        value:
          'Generate a company wide email to employees inviting them to the yearly Holiday Party. The party takes place on December 20th from 6 PM to 10 PM and is located in the main conference hall. There will be decorations, a gift exchange, music and food.',
      },
    ],
    responses: [
      `Subject: Join Us for a Multicultural Holiday Celebration!\n\nDear Team,\n\nAs the holiday season approaches, we are thrilled to announce our annual company holiday party! This year, we are embracing the diverse cultures within our team and celebrating a variety of holiday traditions.\n\nDetails are as follows:\n- Date: December 20th\n- Time: 6:00 PM - 10:00 PM\n- Location: Main Conference Hall\n\nOur celebration will feature a variety of activities that honor different cultural traditions, including:\n- Decorations from Around the World: Help us decorate the office with symbols and ornaments from various holidays, such as Christmas trees, Hanukkah menorahs, Kwanzaa kinaras, Diwali lamps, and more.\n- Inclusive Gift Exchange: Participate in a gift exchange that embraces the spirit of giving across cultures. Bring a wrapped gift (under $20) or a small item that represents your cultural heritage.\n- Global Holiday Music: Enjoy a diverse selection of holiday music, including Christmas carols, Hanukkah songs, Kwanzaa tunes, and traditional music from different cultures.\n- International Feast: Indulge in a delicious array of holiday dishes from around the world. We will have a variety of foods to cater to different tastes and dietary preferences.\n\nFeel free to wear traditional attire or festive clothing that reflects your cultural heritage. Whether it’s a Christmas sweater, traditional clothing for Hanukkah, Kwanzaa, Diwali, or any other holiday, we welcome it all!\n\nWe would love to hear your ideas and suggestions to make this event even more inclusive and enjoyable. If you have any special traditions or activities you’d like to share, please let us know.\n\nLet’s come together to celebrate the season and the wonderful diversity within our team.\n\nHappy Holidays!\n\nBest regards,\nCompany CEO`,
      `Subject: Exciting Christmas Party Announcement!\nDear Team,\nIt's that wonderful time of the year again, and we are thrilled to announce our annual company holiday party! This year, we're going all out with a spectacular Christmas celebration, and we can't wait to see everyone join in the fun.\nDetails are as follows:\n\nDate: December 20th\nTime: 6:00 PM - 10:00 PM\nLocation: Main Conference Hall\n\nWe've planned a night filled with traditional Christmas activities, including:\nChristmas Tree Decorating: Let's make our office tree the most beautiful ever!\nSecret Santa Gift Exchange: Bring a wrapped gift (under $20) to participate. Who knows, you might get something awesome!\nChristmas Carols: We’ll be singing all the classic Christmas songs, so get ready to belt out your favorites!\nHoliday Feast: Enjoy a feast with all your favorite Christmas foods like roast turkey, ham, eggnog, and Christmas cookies.\n\nWe expect everyone to attend and fully participate in the festivities to spread the Christmas cheer!\nLooking forward to celebrating with you all.\nMerry Christmas!\nBest regards,\nCompany CEO`,
      `Subject: You're Invited to Our Annual Holiday Party!\n\nDear [Company Name] Team,\n\nThe holiday season is upon us, and we are thrilled to invite you to our annual Holiday Party! This year's celebration promises to be an unforgettable evening filled with joy, laughter, and festive cheer.\n\n**Event Details:**\n- **Date:** December 20th\n- **Time:** 6:00 PM to 10:00 PM\n- **Location:** Main Conference Hall\n\n**What to Expect:**\n- **Festive Decorations:** Our conference hall will be transformed into a winter wonderland, complete with sparkling lights and holiday decor.\n- **Gift Exchange:** Participate in our fun and friendly gift exchange! Please bring a wrapped gift valued at $20 or less if you wish to join.\n- **Music:** Enjoy a curated playlist of holiday classics and contemporary hits to keep the party lively.\n- **Food:** A delicious array of food and beverages will be available for everyone to enjoy.\n\nThis is a perfect opportunity to celebrate the season with your colleagues, reflect on our achievements, and look forward to the year ahead. We encourage everyone to join in the festivities and make this night a memorable one.\n\nPlease RSVP by [RSVP Deadline Date] so we can ensure there's plenty of food and drink for all.\n\nWe look forward to celebrating with you!\n\nBest wishes,\n\n[Your Name]\n[Your Position]\n[Company Name]\n[Contact Information]\n\nHappy Holidays! 🎄`,
      `Subject: Join Us for a Merry Christmas Party!\n\nDear [Company Name] Team,\n\nThe most wonderful time of the year is here, and we are excited to invite you to our annual Christmas Party! Let's come together to celebrate the joy and magic of the holiday season.\n\n**Event Details:**\n- **Date:** December 20th\n- **Time:** 6:00 PM to 10:00 PM\n- **Location:** Main Conference Hall\n\n**What to Expect:**\n- **Festive Decorations:** Our conference hall will be transformed into a Christmas wonderland with twinkling lights, Christmas trees, and holiday decor.\n- **Gift Exchange:** Participate in our delightful gift exchange! Please bring a wrapped gift valued at $20 or less to join in the fun.\n- **Christmas Music:** Enjoy a festive playlist filled with classic Christmas carols and holiday hits to keep the spirit high.\n- **Holiday Feast:** A scrumptious spread of Christmas food and drinks will be available for everyone to savor.\n\nThis is the perfect opportunity to spread Christmas cheer with your colleagues, share in the joy of the season, and reflect on our accomplishments. We encourage everyone to don their favorite Christmas attire and join in the merriment.\n\nPlease RSVP by [RSVP Deadline Date] so we can ensure there's plenty of festive fare for all.\n\nWe look forward to celebrating a Merry Christmas with you!\n\nWarmest Christmas Wishes,\n\n[Your Name]\n[Your Position]\n[Company Name]\n[Contact Information]\n\nMerry Christmas! 🎄✨`,
    ],
    criteria: getEmptyCriteria(PipelineType.PAIRWISE),
    results: null,
    expectedResults: null,
    pipeline: null,
  },
]
