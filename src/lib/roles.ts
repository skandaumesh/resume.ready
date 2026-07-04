// Roles are now FREE TEXT — a student can type any role. The list below powers
// search suggestions/autocomplete only; it is not a hard limit. Intake questions
// are universal (every resume needs the same raw inputs); the AI decides the
// role-appropriate framing and section order at generation time.

export type QuestionType = "text" | "textarea" | "tags";

export interface Question {
  id: string;
  label: string;
  placeholder?: string;
  type: QuestionType;
  helper?: string;
  required?: boolean;
}

export interface Role {
  slug: string;
  title: string;
  category: string;
  blurb: string;
}

// The universal intake — works for ANY role the student types.
export const UNIVERSAL_QUESTIONS: Question[] = [
  {
    id: "education",
    label: "Education",
    type: "textarea",
    required: true,
    placeholder:
      "B.Tech in Computer Science, XYZ Institute of Technology, 2022-2026, CGPA 8.4",
    helper: "Degree, institution, years, and CGPA/percentage.",
  },
  {
    id: "skills",
    label: "Skills",
    type: "tags",
    required: true,
    placeholder: "Type a skill and press Enter",
    helper: "Add tools, languages, and anything relevant to the role.",
  },
  {
    id: "projects",
    label: "Projects / work samples",
    type: "textarea",
    required: true,
    placeholder:
      "College Result Portal - a website where students check results. Used by my class. Built with React and Firebase.",
    helper:
      "Describe them plainly - what you did, who it was for, what tools. The AI turns this into strong, quantified bullets.",
  },
  {
    id: "experience",
    label: "Internships / work experience (optional)",
    type: "textarea",
    placeholder:
      "Web Development Intern at ABC Startup, summer 2024 - worked on their website.",
    helper: "Any internships, freelance, part-time, or volunteer work.",
  },
  {
    id: "certifications",
    label: "Certifications (optional)",
    type: "textarea",
    placeholder: "Google Data Analytics Certificate, 2024",
    helper: "One per line. Leave blank if none.",
  },
  {
    id: "achievements",
    label: "Achievements (optional)",
    type: "textarea",
    placeholder:
      "Winner, Smart India Hackathon 2024; 2nd place, college coding contest",
    helper: "Awards, ranks, competitions, leadership. Leave blank if none.",
  },
];

function role(slug: string, title: string, category: string, blurb: string): Role {
  return { slug, title, category, blurb };
}

// Suggestion catalogue (for autocomplete). Not exhaustive — students can type
// anything not on this list.
export const ROLES: Role[] = [
  // Software & IT
  role("software-developer", "Software Developer", "Software & IT", "General software / SDE roles."),
  role("frontend-developer", "Frontend Developer", "Software & IT", "UI-focused web development."),
  role("backend-developer", "Backend Developer", "Software & IT", "Server, API, and database roles."),
  role("full-stack-developer", "Full-Stack Developer", "Software & IT", "End-to-end web applications."),
  role("mobile-app-developer", "Mobile App Developer", "Software & IT", "Android / iOS / cross-platform."),
  role("devops-engineer", "DevOps Engineer", "Software & IT", "CI/CD, cloud, infrastructure."),
  role("cloud-engineer", "Cloud Engineer", "Software & IT", "AWS / Azure / GCP roles."),
  role("cybersecurity-analyst", "Cybersecurity Analyst", "Software & IT", "Security, SOC, pentesting."),
  role("qa-test-engineer", "QA / Test Engineer", "Software & IT", "Software testing and QA."),
  // Data & AI
  role("data-analyst", "Data Analyst", "Data & AI", "Data analysis, BI, analytics."),
  role("data-scientist", "Data Scientist", "Data & AI", "Data science and modelling."),
  role("machine-learning-engineer", "Machine Learning Engineer", "Data & AI", "ML / AI engineering."),
  // Design & Content
  role("ui-ux-designer", "UI/UX Designer", "Design & Content", "Product, UI, and UX design."),
  role("graphic-designer", "Graphic Designer", "Design & Content", "Visual and brand design."),
  role("content-writer", "Content Writer", "Design & Content", "Writing and copywriting."),
  // Business & Management
  role("business-analyst", "Business Analyst", "Business & Management", "Business analysis, consulting."),
  role("product-manager", "Product Manager", "Business & Management", "Product management."),
  role("marketing-intern", "Marketing Intern", "Business & Management", "General marketing."),
  role("digital-marketing", "Digital Marketing", "Business & Management", "SEO, ads, social media."),
  role("sales-intern", "Sales / Business Development", "Business & Management", "Sales and BD."),
  role("hr-intern", "HR Intern", "Business & Management", "Human resources, people-ops."),
  role("operations-intern", "Operations Intern", "Business & Management", "Operations, program management."),
  role("finance-accounts-intern", "Finance / Accounts Intern", "Business & Management", "Finance, accounting, audit."),
  // Core Engineering
  role("mechanical-engineer", "Mechanical Engineer", "Core Engineering", "Mechanical / production / design."),
  role("civil-engineer", "Civil Engineer", "Core Engineering", "Civil, structural, construction."),
  role("electrical-engineer", "Electrical Engineer", "Core Engineering", "Electrical and power systems."),
  role("electronics-engineer", "Electronics & Communication Engineer", "Core Engineering", "ECE, embedded, hardware."),
  // Other
  role("customer-support", "Customer Support Associate", "Other", "Customer service and support."),
  role("teacher-educator", "Teacher / Educator", "Other", "Teaching, tutoring, training."),
];

// Lightweight fuzzy-ish search over the suggestion catalogue. Ranks exact >
// starts-with > word-boundary > substring. Used for typeahead only.
export function searchRoles(query: string, limit = 8): Role[] {
  const q = query.trim().toLowerCase();
  if (!q) return ROLES.slice(0, limit);
  const scored = ROLES.map((r) => {
    const t = r.title.toLowerCase();
    let score = 0;
    if (t === q) score = 100;
    else if (t.startsWith(q)) score = 80;
    else if (new RegExp(`\\b${escapeRe(q)}`).test(t)) score = 60;
    else if (t.includes(q)) score = 40;
    else if (r.category.toLowerCase().includes(q)) score = 20;
    // token overlap for multi-word queries like "web dev"
    const qTokens = q.split(/\s+/).filter(Boolean);
    if (score === 0 && qTokens.length > 1) {
      const hits = qTokens.filter((tok) => t.includes(tok)).length;
      if (hits) score = 10 + hits;
    }
    return { r, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.r);
  return scored;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getRole(slug: string): Role | undefined {
  return ROLES.find((r) => r.slug === slug);
}
