/**
 * K-12 Classroom Curriculum Ontology Graphs
 * Authentic school math and science progressions with distractor-mapped misconceptions.
 */
import type { CurriculumGraph } from './types.js';

const MIDDLE_SCHOOL_MATH: CurriculumGraph = {
  id: 'middle-school-math',
  title: 'Middle School Math: Fractions to Linear Inequalities',
  subject: 'Mathematics',
  gradeBand: 'Grades 6-8',
  description:
    'Adaptive classroom progression from equivalent fractions through linear equations and sign-flip inequalities.',
  concepts: [
    {
      id: 'math.frac.equiv',
      title: 'Equivalent Fractions & Ratios',
      gradeBand: 'Grade 6',
      prerequisites: [],
      bkt: { priorMastery: 0.42, learnRate: 0.2, slipRate: 0.09, guessRate: 0.22 }
    },
    {
      id: 'math.frac.ops',
      title: 'Unlike-Denominator Fraction Operations',
      gradeBand: 'Grade 6-7',
      prerequisites: ['math.frac.equiv'],
      bkt: { priorMastery: 0.34, learnRate: 0.18, slipRate: 0.1, guessRate: 0.22 }
    },
    {
      id: 'math.alg.linear',
      title: 'Two-Step Linear Equations',
      gradeBand: 'Grade 7',
      prerequisites: ['math.frac.ops'],
      bkt: { priorMastery: 0.28, learnRate: 0.18, slipRate: 0.1, guessRate: 0.2 }
    },
    {
      id: 'math.alg.ineq',
      title: 'Multi-Step Inequalities & Negative Scaling',
      gradeBand: 'Grade 8',
      prerequisites: ['math.alg.linear'],
      bkt: { priorMastery: 0.22, learnRate: 0.17, slipRate: 0.11, guessRate: 0.2 }
    }
  ],
  questions: [
    {
      id: 'm-eq-1',
      conceptId: 'math.frac.equiv',
      difficulty: 0.32,
      tierLabel: 'Tier 1 Foundation',
      prompt: 'Which fraction represents the exact same quantity as 3/4?',
      options: ['6/8', '4/5', '6/4', '3/8'],
      correctIndex: 0,
      explanation: 'Multiplying both numerator and denominator by 2 scales 3/4 to 6/8 without changing value.',
      misconceptions: [
        {
          optionIndex: 1,
          tag: 'ADDITIVE_FRACTION_SCALING',
          diagnosis: 'Added +1 to top and bottom (3+1)/(4+1) instead of scaling multiplicatively.',
          remediation: 'Compare 3/4 and 4/5 on a 20-slice bar: equivalent fractions multiply numerator and denominator by the same factor.'
        },
        {
          optionIndex: 2,
          tag: 'NUMERATOR_ONLY_DOUBLING',
          diagnosis: 'Doubled only the numerator while leaving the denominator fixed.',
          remediation: 'Doubling only the top doubles the value; multiply both top and bottom by 2 to keep value unchanged.'
        },
        {
          optionIndex: 3,
          tag: 'DENOMINATOR_ONLY_DOUBLING',
          diagnosis: 'Doubled the denominator alone, cutting the fraction in half.',
          remediation: 'Larger denominators mean smaller pieces; scale numerator by 2 as well so piece count matches.'
        }
      ]
    },
    {
      id: 'm-eq-2',
      conceptId: 'math.frac.equiv',
      difficulty: 0.48,
      tierLabel: 'Tier 1 Stretch',
      prompt: 'A classroom recipe uses 6 cups of flour for every 9 cups of oats. Which simplified ratio matches?',
      options: ['3 : 6', '2 : 3', '3 : 2', '1 : 3'],
      correctIndex: 1,
      explanation: 'Dividing both terms by their greatest common factor 3 simplifies 6:9 to 2:3.',
      misconceptions: [
        {
          optionIndex: 0,
          tag: 'SUBTRACTIVE_RATIO_REDUCTION',
          diagnosis: 'Subtracted 3 from each side of 6:9 instead of dividing by the common factor.',
          remediation: 'Ratios preserve proportion only under multiplication or division, never subtraction.'
        },
        {
          optionIndex: 2,
          tag: 'INVERTED_RATIO_ORDER',
          diagnosis: 'Reversed the order of flour to oats after simplifying.',
          remediation: 'Keep term labels anchored in order: flour (6 -> 2) comes before oats (9 -> 3).'
        }
      ]
    },
    {
      id: 'm-op-1',
      conceptId: 'math.frac.ops',
      difficulty: 0.54,
      tierLabel: 'Tier 2 Core',
      prompt: 'Compute 1/3 + 1/6 in simplest form.',
      options: ['2/9', '1/2', '2/6', '1/18'],
      correctIndex: 1,
      explanation: 'Convert 1/3 to 2/6 so the pieces match: 2/6 + 1/6 = 3/6 = 1/2.',
      misconceptions: [
        {
          optionIndex: 0,
          tag: 'STRAIGHT_ACROSS_DENOMINATOR_ADDITION',
          diagnosis: 'Added numerators and added denominators directly (1+1)/(3+6) = 2/9.',
          remediation: 'Denominators name the slice size; convert 1/3 into sixths (2/6) before adding numerators.'
        },
        {
          optionIndex: 2,
          tag: 'UNCONVERTED_NUMERATOR_SUM',
          diagnosis: 'Kept denominator 6 without scaling the first numerator 1/3 -> 2/6.',
          remediation: 'When 3 scales to 6 (x2), its numerator 1 must also scale by x2 to become 2/6.'
        }
      ]
    },
    {
      id: 'm-op-2',
      conceptId: 'math.frac.ops',
      difficulty: 0.64,
      tierLabel: 'Tier 2 Challenge',
      prompt: 'A battery is at 5/6 charge and uses 1/4 of a full charge during lab. What fraction remains?',
      options: ['4/2', '7/12', '4/12', '3/10'],
      correctIndex: 1,
      explanation: 'Using common denominator 12: 10/12 - 3/12 = 7/12.',
      misconceptions: [
        {
          optionIndex: 0,
          tag: 'SUBTRACTED_DENOMINATORS_DIRECTLY',
          diagnosis: 'Subtracted tops (5-1) and bottoms (6-4) separately.',
          remediation: 'Rewrite both fractions over LCD 12 first: 5/6 = 10/12 and 1/4 = 3/12.'
        },
        {
          optionIndex: 2,
          tag: 'FORGOT_NUMERATOR_RESCALING',
          diagnosis: 'Found LCD 12 correctly, then subtracted raw numerators 5 - 1 = 4.',
          remediation: 'After picking LCD 12, scale each numerator to match: (5x2)/12 - (1x3)/12 = 7/12.'
        }
      ]
    },
    {
      id: 'm-lin-1',
      conceptId: 'math.alg.linear',
      difficulty: 0.7,
      tierLabel: 'Tier 3 Core',
      prompt: 'Solve for x:  3x - 5 = 16',
      options: ['x = 7', 'x = 11/3', 'x = 18', 'x = -7'],
      correctIndex: 0,
      explanation: 'Add 5 to both sides (3x = 21), then divide both sides by 3 (x = 7).',
      misconceptions: [
        {
          optionIndex: 1,
          tag: 'INVERSE_OPERATION_SIGN_ERROR',
          diagnosis: 'Subtracted 5 from 16 instead of adding 5 to undo -5.',
          remediation: 'To undo subtracting 5 on the left, add +5 to both sides so 3x = 21.'
        },
        {
          optionIndex: 2,
          tag: 'SUBTRACTED_COEFFICIENT_INSTEAD_OF_DIVIDING',
          diagnosis: 'Got 3x = 21, then subtracted 3 instead of dividing by 3.',
          remediation: '3x means 3 multiplied by x; undo multiplication by dividing 21 by 3.'
        }
      ]
    },
    {
      id: 'm-lin-2',
      conceptId: 'math.alg.linear',
      difficulty: 0.78,
      tierLabel: 'Tier 3 Stretch',
      prompt: 'Solve for n:  2(n + 4) = 3n + 1',
      options: ['n = 3', 'n = 7', 'n = 5', 'n = -7'],
      correctIndex: 1,
      explanation: 'Distribute 2: 2n + 8 = 3n + 1. Subtract 2n and subtract 1 to get n = 7.',
      misconceptions: [
        {
          optionIndex: 0,
          tag: 'PARTIAL_DISTRIBUTION_ERROR',
          diagnosis: 'Multiplied 2 by n only (2n + 4 = 3n + 1), forgetting to distribute 2 across +4.',
          remediation: 'Distribute the outside factor 2 to every term inside parentheses: 2(n) + 2(4) = 2n + 8.'
        }
      ]
    },
    {
      id: 'm-ineq-1',
      conceptId: 'math.alg.ineq',
      difficulty: 0.85,
      tierLabel: 'Tier 4 Mastery',
      prompt: 'Solve the inequality:  -2x + 6 > 14',
      options: ['x > -4', 'x < -4', 'x < 4', 'x > -10'],
      correctIndex: 1,
      explanation: 'Subtract 6 to get -2x > 8, then divide by -2 and reverse the inequality sign: x < -4.',
      misconceptions: [
        {
          optionIndex: 0,
          tag: 'MISSED_NEGATIVE_DIVISION_SIGN_FLIP',
          diagnosis: 'Divided by -2 accurately (-4) without reversing > to <.',
          remediation: 'Multiplying or dividing an inequality by a negative number mirrors the number line and flips > to <.'
        },
        {
          optionIndex: 2,
          tag: 'DROPPED_NEGATIVE_DIVISOR_SIGN',
          diagnosis: 'Flipped the inequality symbol, yet divided 8 by +2 instead of -2.',
          remediation: 'Keep the negative sign on -2 when dividing: 8 / (-2) = -4.'
        }
      ]
    },
    {
      id: 'm-ineq-2',
      conceptId: 'math.alg.ineq',
      difficulty: 0.92,
      tierLabel: 'Tier 4 Sudden-Death',
      prompt: 'For which values of k does  5 - 3k >= 2k + 20  hold?',
      options: ['k >= -3', 'k <= -3', 'k <= 5', 'k >= 3'],
      correctIndex: 1,
      explanation: 'Subtract 2k and 5: -5k >= 15. Divide by -5 and flip >= to <=: k <= -3.',
      misconceptions: [
        {
          optionIndex: 0,
          tag: 'MISSED_NEGATIVE_DIVISION_SIGN_FLIP',
          diagnosis: 'Isolated k = -3 boundary, yet forgot to flip >= when dividing by -5.',
          remediation: 'Test k = 0: 5 >= 20 is false, confirming the solution region must be k <= -3.'
        }
      ]
    }
  ]
};

const MIDDLE_SCHOOL_SCIENCE: CurriculumGraph = {
  id: 'middle-school-science',
  title: 'Middle School Science: Forces, Energy & Ecosystems',
  subject: 'Integrated Science',
  gradeBand: 'Grades 6-8',
  description:
    'Classroom conceptual physics and ecology ladder uncovering classic student misconceptions on motion, heat, and food webs.',
  concepts: [
    {
      id: 'sci.force.net',
      title: 'Balanced vs. Unbalanced Net Forces',
      gradeBand: 'Grade 6',
      prerequisites: [],
      bkt: { priorMastery: 0.44, learnRate: 0.2, slipRate: 0.09, guessRate: 0.22 }
    },
    {
      id: 'sci.motion.inertia',
      title: "Newton's Laws & Mass vs. Acceleration",
      gradeBand: 'Grade 7',
      prerequisites: ['sci.force.net'],
      bkt: { priorMastery: 0.34, learnRate: 0.18, slipRate: 0.1, guessRate: 0.22 }
    },
    {
      id: 'sci.energy.transfer',
      title: 'Kinetic-Potential Conservation & Thermal Flow',
      gradeBand: 'Grade 7-8',
      prerequisites: ['sci.motion.inertia'],
      bkt: { priorMastery: 0.28, learnRate: 0.18, slipRate: 0.1, guessRate: 0.2 }
    },
    {
      id: 'sci.eco.trophic',
      title: 'Trophic Energy Pyramids & Carbon Cycling',
      gradeBand: 'Grade 8',
      prerequisites: ['sci.energy.transfer'],
      bkt: { priorMastery: 0.22, learnRate: 0.17, slipRate: 0.11, guessRate: 0.2 }
    }
  ],
  questions: [
    {
      id: 's-force-1',
      conceptId: 'sci.force.net',
      difficulty: 0.34,
      tierLabel: 'Tier 1 Foundation',
      prompt: 'A hockey puck glides across frictionless ice at a steady 6 m/s. What horizontal net force acts on it?',
      options: ['0 N', '6 N forward', 'A fading force from the stick', '6 N backward'],
      correctIndex: 0,
      explanation: 'Constant velocity means zero acceleration, so net horizontal force is 0 N.',
      misconceptions: [
        {
          optionIndex: 1,
          tag: 'MOTION_REQUIRES_CONTINUOUS_FORCE',
          diagnosis: 'Assumed moving at 6 m/s requires an ongoing 6 N forward push.',
          remediation: 'Force causes changes in velocity, not motion itself; with zero friction, an object coasts at constant speed with 0 N net force.'
        },
        {
          optionIndex: 2,
          tag: 'IMPETUS_CARRYOVER_BELIEF',
          diagnosis: 'Treated the initial stick hit as a stored force carried inside the puck.',
          remediation: 'Once contact with the stick ends, the stick exerts zero force on the puck.'
        }
      ]
    },
    {
      id: 's-motion-1',
      conceptId: 'sci.motion.inertia',
      difficulty: 0.56,
      tierLabel: 'Tier 2 Core',
      prompt: 'A small drone collides head-on with a heavy cargo truck. Compare the force each exerts on the other during impact.',
      options: [
        'The truck exerts a much larger force on the drone',
        'Both exert equal and opposite forces on each other',
        'The faster object exerts the larger force',
        'Only the truck exerts a force'
      ],
      correctIndex: 1,
      explanation: "By Newton's Third Law, interaction forces are equal in magnitude; the drone accelerates more only because its mass is tiny.",
      misconceptions: [
        {
          optionIndex: 0,
          tag: 'LARGER_MASS_EXERTS_LARGER_FORCE',
          diagnosis: 'Confused the drone experiencing dramatic acceleration with receiving a larger contact force.',
          remediation: 'Forces are equal (F_truck = F_drone); a = F/m explains why small mass m undergoes huge acceleration.'
        }
      ]
    },
    {
      id: 's-energy-1',
      conceptId: 'sci.energy.transfer',
      difficulty: 0.72,
      tierLabel: 'Tier 3 Core',
      prompt: 'In a 22 C classroom, a metal desk leg feels colder to your hand than a wooden desktop. Why?',
      options: [
        'Metal naturally stays at a lower temperature than wood',
        'Metal conducts thermal energy away from your warmer skin faster than wood',
        'Cold flows out of the metal into your hand',
        'Wood generates slight heat from air friction'
      ],
      correctIndex: 1,
      explanation: 'Both sit at 22 C thermal equilibrium, yet metal has high thermal conductivity and draws heat from your 33 C skin rapidly.',
      misconceptions: [
        {
          optionIndex: 0,
          tag: 'FEEL_TEMPERATURE_EQUIVALENCE',
          diagnosis: 'Equated how cool a surface feels with its thermometer reading.',
          remediation: 'Your skin senses rate of heat loss, not temperature; objects in the same room share the same temperature.'
        }
      ]
    },
    {
      id: 's-eco-1',
      conceptId: 'sci.eco.trophic',
      difficulty: 0.87,
      tierLabel: 'Tier 4 Mastery',
      prompt: 'If marsh plants capture 10,000 kcal of solar energy, roughly how much energy reaches tertiary predators three trophic steps up?',
      options: ['5,000 kcal', '1,000 kcal', '10 kcal', '10,000 kcal (energy is conserved)'],
      correctIndex: 2,
      explanation: 'Roughly 90% of usable biomass energy dissipates as metabolic heat per step: 10,000 -> 1,000 -> 100 -> 10 kcal.',
      misconceptions: [
        {
          optionIndex: 3,
          tag: 'MISAPPLIED_CONSERVATION_TO_BIOMASS',
          diagnosis: 'Assumed total energy conservation means 100% stays stored as edible biomass across trophic levels.',
          remediation: 'Total energy is conserved globally, yet ~90% at each trophic step escapes to the environment as cellular respiration heat.'
        }
      ]
    }
  ]
};

const CURRICULA: readonly CurriculumGraph[] = [MIDDLE_SCHOOL_MATH, MIDDLE_SCHOOL_SCIENCE];

export function listCurricula(): readonly CurriculumGraph[] {
  return CURRICULA;
}

export function getCurriculumById(id: string): CurriculumGraph | undefined {
  return CURRICULA.find((c) => c.id === id);
}
