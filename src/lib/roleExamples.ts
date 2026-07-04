// ─────────────────────────────────────────────────────────────────────────
// Content for the programmatic SEO pages (/examples/[slug]) — one page per
// role in the catalogue. Everything is deterministic and written per role
// CATEGORY, then flavored with the role title, so 29 pages stay maintainable.
// The sample resumes render through the real template engine, so what Google
// indexes is exactly what the product produces.
// ─────────────────────────────────────────────────────────────────────────

import { Role, ROLES } from "@/lib/roles";
import { ResumeContent, EMPTY_CONTENT, ContactInfo } from "@/lib/types";

export const SAMPLE_CONTACT: Partial<ContactInfo> = {
  fullName: "Aarav Kumar",
  email: "aarav.kumar@example.com",
  phone: "+91 98765 43210",
  location: "Bengaluru, India",
  linkedin: "linkedin.com/in/aarav-kumar",
};

interface CategorySample {
  skills: string[];
  summary: (role: string) => string;
  experience: ResumeContent["experience"];
  projects: ResumeContent["projects"];
  certifications: string[];
  achievements: string[];
  tips: string[];
}

const SAMPLES: Record<string, CategorySample> = {
  "Software & IT": {
    skills: ["Java", "Python", "JavaScript", "React", "Node.js", "SQL", "Git", "REST APIs"],
    summary: (role) =>
      `Final-year B.Tech Computer Science student seeking a ${role} internship. Built and shipped 3 web applications used by 700+ students, with hands-on experience across the stack from React frontends to SQL-backed APIs.`,
    experience: [
      {
        title: "Software Development Intern",
        organization: "Zenlytic Labs (startup)",
        duration: "May 2025 - Jul 2025",
        bullets: [
          "Shipped 9 features for a customer dashboard used by 2,000+ monthly users, working in an agile team of 5.",
          "Reduced page load time by 35% by lazy-loading components and caching API responses.",
          "Wrote 40+ unit tests, raising coverage on the payments module from 45% to 80%.",
        ],
      },
    ],
    projects: [
      {
        name: "College Result Portal",
        techStack: ["React", "Firebase"],
        bullets: [
          "Built a result-checking portal adopted by 500+ students, cutting manual result queries to the office by 40%.",
          "Designed a caching layer that kept results available during exam-week traffic spikes of 3x normal load.",
        ],
      },
      {
        name: "Hostel Mess Feedback App",
        techStack: ["Node.js", "MongoDB", "Express"],
        bullets: [
          "Created a meal-rating app collecting 1,200+ weekly ratings, giving the mess committee data to change 2 menus.",
        ],
      },
    ],
    certifications: ["AWS Cloud Practitioner (2025)", "freeCodeCamp Responsive Web Design"],
    achievements: ["Finalist, Smart India Hackathon 2025 (top 40 of 2,000+ teams)"],
    tips: [
      "Lead with projects, not education. For software roles, one shipped project with users beats a long course list.",
      "Put numbers in at least half your bullets: users, requests, load time, test coverage, team size.",
      "List the exact technologies from the job description in your skills section, because ATS filters match keywords literally.",
      "Link your GitHub. Recruiters for software roles click it more than anything else on the page.",
    ],
  },
  "Data & AI": {
    skills: ["Python", "SQL", "Pandas", "Power BI", "Excel", "Scikit-learn", "Statistics", "Data Visualization"],
    summary: (role) =>
      `B.Tech student targeting a ${role} internship, with hands-on experience turning raw datasets into decisions: 4 analysis projects, 2 dashboards in production use, and a strong grounding in SQL and statistics.`,
    experience: [
      {
        title: "Data Analyst Intern",
        organization: "RetailKart (e-commerce)",
        duration: "May 2025 - Jul 2025",
        bullets: [
          "Analyzed 250K+ order records in SQL and Pandas to find delivery bottlenecks, cutting average dispatch delay by 18%.",
          "Built a Power BI dashboard used weekly by 3 category managers to track sales across 12 regions.",
          "Automated a daily Excel reporting task with Python, saving the team roughly 6 hours a week.",
        ],
      },
    ],
    projects: [
      {
        name: "Campus Placement Analysis",
        techStack: ["Python", "Pandas", "Matplotlib"],
        bullets: [
          "Analyzed 5 years of placement data (3,000+ offers) to surface the skills most correlated with higher packages.",
          "Presented findings to the placement cell; 2 recommendations were adopted for the next drive.",
        ],
      },
      {
        name: "Movie Ratings Predictor",
        techStack: ["Scikit-learn", "Python"],
        bullets: [
          "Trained a regression model on 100K ratings reaching an RMSE of 0.89, and documented the full feature pipeline.",
        ],
      },
    ],
    certifications: ["Google Data Analytics Certificate (2025)"],
    achievements: ["2nd place, college data hackathon among 60 teams"],
    tips: [
      "Every bullet should end in a number: rows analyzed, hours saved, accuracy reached, people who used the output.",
      "Name the tools in the bullets themselves ('in SQL and Pandas'), not just the skills list, so keywords appear in context.",
      "One dashboard screenshot link (Power BI / Tableau Public) is worth three course certificates.",
      "Keep a Statistics or SQL line in your skills; they are the two most-filtered keywords for data roles.",
    ],
  },
  "Design & Content": {
    skills: ["Figma", "Adobe Photoshop", "Illustrator", "Wireframing", "Prototyping", "Canva", "Typography", "User Research"],
    summary: (role) =>
      `Design-focused student seeking a ${role} internship. Portfolio of 10+ shipped artefacts including a redesigned college fest identity seen by 5,000+ attendees and two client projects delivered end to end.`,
    experience: [
      {
        title: "Design Intern",
        organization: "Studio Mitra (agency)",
        duration: "Jun 2025 - Aug 2025",
        bullets: [
          "Designed 25+ social media creatives for 3 client brands, lifting average engagement by 22%.",
          "Prototyped a mobile app onboarding flow in Figma that cut user drop-off in testing from 40% to 24%.",
        ],
      },
    ],
    projects: [
      {
        name: "College Fest Brand Identity",
        techStack: ["Illustrator", "Figma"],
        bullets: [
          "Created the full identity (logo, posters, merch, reels templates) for a fest with 5,000+ attendees.",
          "Ran a 12-person usability test on the fest website redesign, fixing the 3 most common navigation failures.",
        ],
      },
      {
        name: "NGO Website Redesign",
        techStack: ["Figma", "WordPress"],
        bullets: [
          "Redesigned and shipped a donation site, increasing completed donation flows by 30% in the first month.",
        ],
      },
    ],
    certifications: ["Google UX Design Certificate (in progress)"],
    achievements: ["Winner, national-level poster design contest (800+ entries)"],
    tips: [
      "The portfolio link is your real resume; put it in the header next to your email, not buried at the bottom.",
      "Describe outcomes, not deliverables: 'cut drop-off from 40% to 24%' beats 'designed onboarding screens'.",
      "Keep the resume design restrained. Ironically, over-designed resumes fail ATS parsing and annoy recruiters.",
      "Show range with 2-3 project types (brand, product, content), each with one strong number.",
    ],
  },
  "Business & Management": {
    skills: ["Market Research", "Excel", "PowerPoint", "SQL (basic)", "Communication", "Canva", "Google Analytics", "CRM tools"],
    summary: (role) =>
      `Business-minded student targeting a ${role} internship, with proven initiative: led a 30-member fest sponsorship team that raised ₹4.5L and completed 2 internships involving research, outreach, and reporting.`,
    experience: [
      {
        title: "Marketing & Operations Intern",
        organization: "FinEdge (fintech startup)",
        duration: "May 2025 - Jul 2025",
        bullets: [
          "Ran cold outreach to 200+ leads and qualified 35, contributing to 8 closed deals worth ₹2.1L.",
          "Built the weekly KPI report in Excel that leadership used to track 5 growth metrics.",
          "Wrote 12 blog posts that grew organic traffic by 26% over the internship period.",
        ],
      },
    ],
    projects: [
      {
        name: "Fest Sponsorship Drive",
        techStack: ["Outreach", "Negotiation"],
        bullets: [
          "Led a 30-member team that pitched 80+ companies and closed ₹4.5L in sponsorships, 50% above the previous year.",
        ],
      },
      {
        name: "Campus Cafe Market Study",
        techStack: ["Surveys", "Excel"],
        bullets: [
          "Surveyed 400+ students, sized the demand, and presented a pricing model adopted by the cafeteria vendor.",
        ],
      },
    ],
    certifications: ["Google Digital Marketing Certificate (2025)"],
    achievements: ["General Secretary, college entrepreneurship cell (900+ members)"],
    tips: [
      "Money and people are your numbers: amounts raised, deals closed, team sizes led, growth percentages.",
      "Leadership roles in fests and clubs count as real experience when you quantify what changed under you.",
      "Mirror the job description's language ('lead generation', 'stakeholder management') where it is honestly true.",
      "Keep the summary role-specific; 'seeking a marketing internship' beats 'seeking opportunities in a reputed organization'.",
    ],
  },
  "Core Engineering": {
    skills: ["AutoCAD", "SolidWorks", "MATLAB", "ANSYS", "GD&T", "Manufacturing Processes", "Excel", "Project Documentation"],
    summary: (role) =>
      `Mechanical-stream student seeking a ${role} internship, combining strong fundamentals with practice: 2 fabrication projects built to completion, a SAE team role, and simulation experience in ANSYS and MATLAB.`,
    experience: [
      {
        title: "Engineering Intern",
        organization: "Bharat Precision Works",
        duration: "Jun 2025 - Jul 2025",
        bullets: [
          "Drafted 15+ production drawings in AutoCAD with GD&T, reducing shop-floor clarification queries by 30%.",
          "Assisted a time study across 4 machining stations that cut average cycle time by 12%.",
        ],
      },
    ],
    projects: [
      {
        name: "SAE Baja All-Terrain Vehicle",
        techStack: ["SolidWorks", "ANSYS"],
        bullets: [
          "Designed and simulated the roll cage (validated to 3G loading), as part of a 25-member team placing 14th of 120 nationally.",
        ],
      },
      {
        name: "Solar Dryer for Farm Produce",
        techStack: ["Fabrication", "MATLAB"],
        bullets: [
          "Built a low-cost dryer achieving 40% faster drying than open-sun, field-tested with 3 local farmers.",
        ],
      },
    ],
    certifications: ["NPTEL: Design of Machine Elements (Elite)"],
    achievements: ["14th nationally, SAE Baja 2025 (of 120 teams)"],
    tips: [
      "Name the software with the standard ('AutoCAD with GD&T', 'ANSYS structural') because core-sector ATS filters are tool-specific.",
      "Team projects like SAE/robotics carry huge weight; state your exact subsystem and its measurable result.",
      "Include workshop or site exposure even if brief; it separates you from purely theoretical applicants.",
      "NPTEL Elite/Gold certificates are respected by core companies; list scores when strong.",
    ],
  },
  Other: {
    skills: ["Communication", "MS Excel", "Documentation", "Time Management", "Teamwork", "Presentation", "Basic Data Handling", "English + 2 regional languages"],
    summary: (role) =>
      `Motivated student seeking a ${role} opportunity, with a record of dependable execution: 2 campus responsibilities handled end to end, a customer-facing internship, and consistent peer-teaching experience.`,
    experience: [
      {
        title: "Customer Support Intern",
        organization: "QuickServe Solutions",
        duration: "May 2025 - Jul 2025",
        bullets: [
          "Handled 40+ customer queries daily across chat and email with a 92% satisfaction rating.",
          "Wrote a 20-page FAQ playbook that cut average resolution time for new interns by 25%.",
        ],
      },
    ],
    projects: [
      {
        name: "Peer Tutoring Programme",
        techStack: ["Teaching", "Organization"],
        bullets: [
          "Tutored 15 juniors weekly in core subjects; 12 improved their grade by at least one band in a semester.",
        ],
      },
      {
        name: "College Library Digitization Assist",
        techStack: ["Excel", "Documentation"],
        bullets: [
          "Catalogued 2,000+ titles into a searchable Excel system used daily by library staff.",
        ],
      },
    ],
    certifications: ["TCS iON Career Edge: Young Professional"],
    achievements: ["Best Volunteer Award, university convocation team (150 volunteers)"],
    tips: [
      "Reliability is your pitch: show things you ran end to end, with the size of what you handled.",
      "Customer-facing numbers (queries handled, satisfaction %, resolution time) translate across almost every role.",
      "Languages you can work in are a genuine differentiator for support, teaching, and operations roles; list them.",
      "Keep it to one page; for generalist roles, a tight resume reads as an organized mind.",
    ],
  },
};

export interface RoleExample {
  role: Role;
  contact: Partial<ContactInfo>;
  content: ResumeContent;
  tips: string[];
  faq: { q: string; a: string }[];
}

export function getRoleExample(slug: string): RoleExample | null {
  const role = ROLES.find((r) => r.slug === slug);
  if (!role) return null;
  const s = SAMPLES[role.category] ?? SAMPLES["Other"];

  const content: ResumeContent = {
    ...EMPTY_CONTENT,
    summary: s.summary(role.title),
    skills: s.skills,
    experience: s.experience,
    projects: s.projects,
    education: [
      {
        degree: "B.Tech (relevant stream)",
        institution: "XYZ Institute of Technology",
        duration: "2022 - 2026",
        details: "CGPA 8.2/10",
      },
    ],
    certifications: s.certifications,
    achievements: s.achievements,
  };

  const faq = [
    {
      q: `What should a fresher put on a ${role.title} resume?`,
      a: `Lead with 1-2 concrete projects with numbers (users, results, scale), then skills matched to the job description, then education. Recruiters for ${role.title} roles spend under 10 seconds on the first pass, so quantified bullets matter more than long descriptions.`,
    },
    {
      q: `How long should a ${role.title} fresher resume be?`,
      a: "One page. Freshers with more than one page almost always have filler; cutting it raises the density of things worth reading. Every bullet should start with an action verb and ideally contain a number.",
    },
    {
      q: `How do I make my ${role.title} resume pass ATS screening?`,
      a: "Use a single-column layout, standard section names (Experience, Skills, Education), and the exact keywords from the job description where they honestly apply. You can check your score free with our ATS checker, no sign-up needed.",
    },
  ];

  return { role, contact: SAMPLE_CONTACT, content, tips: s.tips, faq };
}

export function allExampleSlugs(): string[] {
  return ROLES.map((r) => r.slug);
}
