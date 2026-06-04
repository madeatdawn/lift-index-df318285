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
      question: "How consistently are you seeing results from your efforts?",
      options: [
        { id: "a", text: "I'm not sure what results to expect yet—I'm still figuring things out.", value: 1 },
        { id: "b", text: "Results are inconsistent, but I'm learning from each attempt.", value: 2 },
        { id: "c", text: "I see steady results that I can rely on, even if they're not extraordinary.", value: 3 },
        { id: "d", text: "I consistently achieve meaningful results aligned with my strengths.", value: 4 },
        { id: "e", text: "My results create ripple effects—they impact others beyond just myself.", value: 5 }
      ]
    },
    {
      id: "q3",
      question: "Where does progress live for you right now?",
      options: [
        { id: "a", text: "Progress means learning, exploring, and understanding my options.", value: 1 },
        { id: "b", text: "Progress is about building momentum and taking consistent action.", value: 2 },
        { id: "c", text: "Progress is maintaining what works while cautiously expanding.", value: 3 },
        { id: "d", text: "Progress is expressing my authentic expertise and creating impact.", value: 4 },
        { id: "e", text: "Progress is elevating others and creating lasting systems of impact.", value: 5 }
      ]
    },
    {
      id: "q4",
      question: "How would you describe your financial relationship to this area of focus?",
      options: [
        { id: "a", text: "I'm investing time and energy without expecting financial return yet.", value: 1 },
        { id: "b", text: "I'm starting to see some income but it's not reliable or substantial.", value: 2 },
        { id: "c", text: "I have stable income that meets my needs, though I want more.", value: 3 },
        { id: "d", text: "I'm compensated well for my expertise and value.", value: 4 },
        { id: "e", text: "Financial success flows naturally and supports broader impact.", value: 5 }
      ]
    },
    {
      id: "q5",
      question: "What limits your growth right now?",
      options: [
        { id: "a", text: "Clarity—I don't know which direction to commit to.", value: 1 },
        { id: "b", text: "Focus—I'm spread too thin or lack systems.", value: 2 },
        { id: "c", text: "Risk tolerance—I hesitate to step outside what's working.", value: 3 },
        { id: "d", text: "Capacity—I need to scale or delegate to grow further.", value: 4 },
        { id: "e", text: "Sustainability—I need to ensure my impact continues without burning out.", value: 5 }
      ]
    },
    {
      id: "q6",
      question: "How visible is your work to others?",
      options: [
        { id: "a", text: "I'm mostly working privately, learning before I share.", value: 1 },
        { id: "b", text: "I'm starting to put myself out there but it feels inconsistent.", value: 2 },
        { id: "c", text: "I have a steady presence that people recognize.", value: 3 },
        { id: "d", text: "I'm known for my expertise and people seek me out.", value: 4 },
        { id: "e", text: "My work speaks for itself and creates opportunities I don't have to chase.", value: 5 }
      ]
    },
    {
      id: "q7",
      question: "How do you respond to friction or setbacks?",
      options: [
        { id: "a", text: "I seek advice and reassurance before deciding how to proceed.", value: 1 },
        { id: "b", text: "I push through and try different approaches until something works.", value: 2 },
        { id: "c", text: "I analyze carefully and make measured adjustments.", value: 3 },
        { id: "d", text: "I trust my experience and adapt confidently.", value: 4 },
        { id: "e", text: "I see friction as refinement—it strengthens my purpose and impact.", value: 5 }
      ]
    },
    {
      id: "q8",
      question: "How engaged are others with your work or vision?",
      options: [
        { id: "a", text: "I'm still building connections and learning who my people are.", value: 1 },
        { id: "b", text: "Some people are interested but engagement is inconsistent.", value: 2 },
        { id: "c", text: "I have a reliable community or audience that trusts me.", value: 3 },
        { id: "d", text: "People actively seek my perspective and want to work with me.", value: 4 },
        { id: "e", text: "I'm cultivating leaders and my vision extends through others.", value: 5 }
      ]
    },
    {
      id: "q9",
      question: "What feels most needed for you next?",
      options: [
        { id: "a", text: "Guidance and clarity on which path to pursue.", value: 1 },
        { id: "b", text: "Systems, focus, and sustainable momentum.", value: 2 },
        { id: "c", text: "Confidence to stretch beyond my comfort zone.", value: 3 },
        { id: "d", text: "Opportunities to fully express my expertise and influence.", value: 4 },
        { id: "e", text: "Ways to multiply my impact and create lasting legacy.", value: 5 }
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
      embedHTML: "",
      redirectUrl: "https://elanoura.com/seeking"
    },
    {
      id: "striving",
      name: "Striving",
      minScore: 1.6,
      maxScore: 2.5,
      description: "Working hard, building momentum, seeking focus.",
      embedHTML: "",
      redirectUrl: "https://elanoura.com/striving"
    },
    {
      id: "steadfast",
      name: "Steadfast",
      minScore: 2.6,
      maxScore: 3.5,
      description: "Stable, competent, ready for deeper meaning and authentic growth.",
      embedHTML: "",
      redirectUrl: "https://elanoura.com/steadfast"
    },
    {
      id: "shining",
      name: "Shining",
      minScore: 3.6,
      maxScore: 4.5,
      description: "Experienced, aligned, mastering skills, stepping into authentic expression.",
      embedHTML: "",
      redirectUrl: "https://elanoura.com/shining"
    },
    {
      id: "significance",
      name: "Significance",
      minScore: 4.6,
      maxScore: 5.0,
      description: "Fully living purpose, mentoring, leaving lasting impact.",
      embedHTML: "",
      redirectUrl: "https://elanoura.com/significance"
    }
  ]
};
