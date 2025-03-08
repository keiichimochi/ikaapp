import { readFileSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

export interface DiaryEntry {
  date: string;
  title: string;
  content: string;
  categories: string[];
}

export interface DiaryMetadata {
  id: string;
  title: string;
  path: string;
  created_at: string;
  updated_at: string;
  entries: {
    date: string;
    title: string;
    categories: string[];
  }[];
}

export interface DiaryData {
  diaries: DiaryMetadata[];
  categories: string[];
  latest_update: string;
}

export function loadDiaryMetadata(): DiaryData {
  const metadataPath = join(process.cwd(), 'docs/diary/metadata.json');
  const metadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));
  return metadata;
}

export function loadDiaryContent(path: string): DiaryEntry[] {
  const fullPath = join(process.cwd(), path);
  const fileContent = readFileSync(fullPath, 'utf-8');
  const entries: DiaryEntry[] = [];
  
  // Split content by ## to get each day's entry
  const dayEntries = fileContent.split('\n## ').filter(Boolean);
  
  dayEntries.forEach((entry) => {
    const lines = entry.split('\n');
    const dateMatch = lines[0].match(/(\d{4}-\d{2}-\d{2})/);
    
    if (dateMatch) {
      const date = dateMatch[1];
      const title = lines[0].replace(date, '').trim();
      const content = lines.slice(1).join('\n').trim();
      
      // Extract categories from content (assuming they're in ### categories format)
      const categories = content.match(/###\s+([^\n]+)/g)?.map(cat => 
        cat.replace('### ', '').trim()
      ) || [];
      
      entries.push({
        date,
        title: title || `${date}の日記`,
        content,
        categories
      });
    }
  });
  
  return entries;
}

export function getDiaryByMonth(month: string): DiaryEntry[] | null {
  const metadata = loadDiaryMetadata();
  const diary = metadata.diaries.find(d => d.id === month);
  
  if (!diary) {
    return null;
  }
  
  return loadDiaryContent(diary.path);
}

export function getLatestDiaries(count: number = 5): DiaryEntry[] {
  const metadata = loadDiaryMetadata();
  const latestDiary = metadata.diaries[0]; // Assuming diaries are sorted by date
  
  if (!latestDiary) {
    return [];
  }
  
  const entries = loadDiaryContent(latestDiary.path);
  return entries.slice(0, count);
}

export function getAllCategories(): string[] {
  const metadata = loadDiaryMetadata();
  return metadata.categories;
}

export function getDiariesByCategory(category: string): DiaryEntry[] {
  const metadata = loadDiaryMetadata();
  const allEntries: DiaryEntry[] = [];
  
  metadata.diaries.forEach(diary => {
    const entries = loadDiaryContent(diary.path);
    const filteredEntries = entries.filter(entry => 
      entry.categories.includes(category)
    );
    allEntries.push(...filteredEntries);
  });
  
  return allEntries;
} 