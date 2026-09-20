export interface HelpArticle {
  id: string;
  title: string;
  category: string;
  summary: string;
  keywords: string[];
  steps: string[];
}

export interface HelpFaq {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface TroubleshootingItem {
  id: string;
  title: string;
  symptoms: string;
  steps: string[];
}