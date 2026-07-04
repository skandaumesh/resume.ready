// Shape of the AI-generated resume content and the user-entered contact block.
// The AI function (src/lib/ai/generateResume.ts) is instructed to return JSON
// matching ResumeContent exactly.

export interface ContactInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string; // city, e.g. "Bengaluru, India"
  linkedin?: string;
  github?: string;
  portfolio?: string;
  // Optional headshot (data URL) used by photo templates. Design overrides
  // (accent color, font) are also stored on the contact object under reserved
  // `_`-prefixed keys so they persist without a schema change.
  photo?: string;
}

export interface ExperienceItem {
  title: string; // role / position
  organization: string; // company / club / institution
  duration: string; // e.g. "Jun 2024 – Aug 2024"
  bullets: string[]; // quantified achievement bullets
}

export interface ProjectItem {
  name: string;
  techStack: string[];
  bullets: string[]; // quantified, impact-focused bullets
}

export interface EducationItem {
  degree: string; // e.g. "B.Tech in Computer Science"
  institution: string;
  duration: string; // e.g. "2022 – 2026"
  details?: string; // CGPA / relevant coursework
}

// Valid section keys the AI may order. Kept as a const so the renderer and the
// AI normalizer agree on the vocabulary.
export const SECTION_KEYS = [
  "summary",
  "skills",
  "experience",
  "projects",
  "education",
  "certifications",
  "achievements",
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export interface ResumeContent {
  summary: string; // 2–3 line professional summary tailored to the role
  skills: string[]; // flat list of skills (grouped by the template if needed)
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  certifications: string[];
  achievements: string[];
  // Role-appropriate section ordering chosen by the AI (e.g. a designer leads
  // with projects, a fresher with education). Optional — renderer falls back to
  // a sensible default when absent.
  sectionOrder?: SectionKey[];
}

// Minimal empty content used before generation / as a safe fallback.
export const EMPTY_CONTENT: ResumeContent = {
  summary: "",
  skills: [],
  experience: [],
  projects: [],
  education: [],
  certifications: [],
  achievements: [],
  sectionOrder: [],
};
