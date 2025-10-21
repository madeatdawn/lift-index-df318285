import { QuizData } from "@/types/quiz";

export const initialQuizData: QuizData = {
  questions: [
    {
      id: "q1",
      question: "How do you feel about your current direction in life?",
      options: [
        { id: "a", text: "I'm exploring different possibilities and seeking advice or mentorship to figure out what path is right for me.", value: 1 },
        { id: "b", text: "I'm actively putting in effort, experimenting, and trying to make progress, even if it feels scattered at times.", value: 2 },
        { id: "c", text: "I've built a stable foundation, and I want to step further while maintaining security.", value: 3 },
        { id: "d", text: "I know my strengths and experience, and I'm ready to express myself authentically to create meaningful results.", value: 4 },
        { id: "e", text: "I'm fully living my purpose and focused on using my skills and influence to impact others.", value: 5 }
      ]
    },
    {
      id: "q2",
      question: "What are you struggling with currently?",
      options: [
        { id: "a", text: "Being unsure which advice, mentor, or opportunities to follow.", value: 1 },
        { id: "b", text: "Overworking, lacking boundaries, or losing focus on priorities.", value: 2 },
        { id: "c", text: "Feeling the pull to do more, worrying about falling behind, or comparing yourself to others.", value: 3 },
        { id: "d", text: "Feeling complacent about what you've accomplished and unsure how to evolve meaningfully.", value: 4 },
        { id: "e", text: "Risk of burnout or over-identifying with your role or legacy.", value: 5 }
      ]
    },
    {
      id: "q3",
      question: "What motivates you most right now?",
      options: [
        { id: "a", text: "Understanding what's possible for me, finding mentors, and exploring different paths.", value: 1 },
        { id: "b", text: "Making consistent progress and seeing tangible results from my efforts.", value: 2 },
        { id: "c", text: "Strengthening my foundation while exploring ways to grow beyond comfort zones.", value: 3 },
        { id: "d", text: "Expressing my authentic self and leveraging my strengths for meaningful impact.", value: 4 },
        { id: "e", text: "Expanding influence, mentoring others, and leaving a lasting mark through my work.", value: 5 }
      ]
    },
    {
      id: "q4",
      question: "How do you approach new opportunities?",
      options: [
        { id: "a", text: "I explore them cautiously, seeking guidance and learning from others before committing.", value: 1 },
        { id: "b", text: "I try different approaches, learning by doing, and gradually building momentum.", value: 2 },
        { id: "c", text: "I evaluate opportunities carefully, balancing potential growth with stability.", value: 3 },
        { id: "d", text: "If it's worth my time, I take bold steps based on my expertise and values, expressing my unique voice confidently.", value: 4 },
        { id: "e", text: "I select opportunities that amplify impact, mentor others, and leave a lasting legacy.", value: 5 }
      ]
    },
    {
      id: "q5",
      question: "How do you handle uncertainty or change?",
      options: [
        { id: "a", text: "I seek advice, gather information, and explore before acting.", value: 1 },
        { id: "b", text: "I experiment, adjust as I go, and learn from trial and error.", value: 2 },
        { id: "c", text: "I plan carefully to maintain stability while cautiously stepping outside my comfort zone.", value: 3 },
        { id: "d", text: "I act confidently, trusting my experience and authenticity.", value: 4 },
        { id: "e", text: "I embrace transformative change that strengthens my impact and benefits others.", value: 5 }
      ]
    },
    {
      id: "q6",
      question: "How do you think about risk?",
      options: [
        { id: "a", text: "I'm cautious but curious, seeking guidance before making moves.", value: 1 },
        { id: "b", text: "I take small calculated risks to test and learn.", value: 2 },
        { id: "c", text: "I prefer measured steps that protect my stability while allowing growth.", value: 3 },
        { id: "d", text: "I step confidently into opportunities that reflect my authentic self. Otherwise, I can pass.", value: 4 },
        { id: "e", text: "I embrace transformative risks that amplify impact for myself and others.", value: 5 }
      ]
    },
    {
      id: "q7",
      question: "How do you spend your energy day-to-day?",
      options: [
        { id: "a", text: "Exploring possibilities, connecting with mentors, and testing new ideas.", value: 1 },
        { id: "b", text: "Building momentum, putting effort into tasks, and creating structure.", value: 2 },
        { id: "c", text: "Maintaining routines, systems, and stability while considering new challenges.", value: 3 },
        { id: "d", text: "Expressing yourself, sharing ideas, and applying your expertise for success.", value: 4 },
        { id: "e", text: "Leading, mentoring, and creating systems to sustain long-term impact.", value: 5 }
      ]
    },
    {
      id: "q8",
      question: "How do you measure progress or fulfillment right now?",
      options: [
        { id: "a", text: "By exploring possibilities, gaining clarity, and learning from guidance.", value: 1 },
        { id: "b", text: "By momentum, consistency, and seeing tangible results.", value: 2 },
        { id: "c", text: "By stability, competence, and building a reliable foundation.", value: 3 },
        { id: "d", text: "By authentic expression, influence, and meaningful outcomes.", value: 4 },
        { id: "e", text: "By impact, legacy, and how I elevate others while living purposefully.", value: 5 }
      ]
    },
    {
      id: "q9",
      question: "What do you feel you're good at in this stage of your journey?",
      options: [
        { id: "a", text: "Curiosity, learning from others, and exploring possibilities.", value: 1 },
        { id: "b", text: "Putting in effort, building momentum, and taking action.", value: 2 },
        { id: "c", text: "Maintaining stability, reliability, and consistency.", value: 3 },
        { id: "d", text: "Expressing your authentic self, applying expertise meaningfully, and inspiring confidence.", value: 4 },
        { id: "e", text: "Leading, mentoring, and creating lasting impact through purpose and influence.", value: 5 }
      ]
    },
    {
      id: "q10",
      question: "What do you feel is blocking you from success right now?",
      options: [
        { id: "a", text: "So many possibilities that it's hard to choose a direction.", value: 1 },
        { id: "b", text: "Too much effort without clear systems or focus.", value: 2 },
        { id: "c", text: "Comparing yourself to others, overworking to maintain stability, or feeling hesitant to grow.", value: 3 },
        { id: "d", text: "Comfortable with your level of mastery but unsure how to evolve meaningfully.", value: 4 },
        { id: "e", text: "Feeling like everything depends on you and taking it all on.", value: 5 }
      ]
    },
    {
      id: "q11",
      question: "What excites you most about the future?",
      options: [
        { id: "a", text: "Learning from mentors, exploring paths, and discovering where I belong.", value: 1 },
        { id: "b", text: "Turning effort into progress and seeing results from my work.", value: 2 },
        { id: "c", text: "Expanding beyond my comfort zone while staying grounded in stability.", value: 3 },
        { id: "d", text: "Expressing your authentic self and making meaningful contributions.", value: 4 },
        { id: "e", text: "Leaving a legacy, mentoring others, and creating lasting impact.", value: 5 }
      ]
    }
  ],
  results: [
    {
      id: "seeking",
      name: "Seeking",
      minScore: 1.0,
      maxScore: 1.5,
      description: "Exploring, curious, discovering what lights you up.",
      embedHTML: ""
    },
    {
      id: "striving",
      name: "Striving",
      minScore: 1.6,
      maxScore: 2.5,
      description: "Working hard, building momentum, seeking focus.",
      embedHTML: ""
    },
    {
      id: "steadfast",
      name: "Steadfast",
      minScore: 2.6,
      maxScore: 3.5,
      description: "Stable, competent, ready for deeper meaning and authentic growth.",
      embedHTML: ""
    },
    {
      id: "shining",
      name: "Shining",
      minScore: 3.6,
      maxScore: 4.5,
      description: "Experienced, aligned, mastering skills, stepping into authentic expression.",
      embedHTML: ""
    },
    {
      id: "significance",
      name: "Significance",
      minScore: 4.6,
      maxScore: 5.0,
      description: "Fully living purpose, mentoring, leaving lasting impact.",
      embedHTML: ""
    }
  ]
};
