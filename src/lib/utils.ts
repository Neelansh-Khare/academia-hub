import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface BibTeXData {
  title: string;
  authors: string[] | null;
  venue: string | null;
  year: number | null;
  doi: string | null;
  url: string | null;
}

export function exportToBibTeX(publications: BibTeXData[], filename: string = 'publications.bib') {
  const bibEntries = publications.map((pub, index) => {
    const type = pub.venue?.toLowerCase().includes('conference') || pub.venue?.toLowerCase().includes('proceedings') 
      ? 'inproceedings' 
      : 'article';
    
    const key = `pub_${index}_${pub.year || 'unknown'}`;
    const authorsStr = pub.authors?.join(' and ') || 'Unknown Authors';
    
    let entry = `@${type}{${key},\n`;
    entry += `  title = {${pub.title}},\n`;
    entry += `  author = {${authorsStr}},\n`;
    if (pub.venue) entry += `  ${type === 'article' ? 'journal' : 'booktitle'} = {${pub.venue}},\n`;
    if (pub.year) entry += `  year = {${pub.year}},\n`;
    if (pub.doi) entry += `  doi = {${pub.doi}},\n`;
    if (pub.url) entry += `  url = {${pub.url}},\n`;
    entry += `}`;
    
    return entry;
  }).join('\n\n');

  downloadFile(bibEntries, filename, 'text/plain');
}

export function downloadFile(content: string, filename: string, contentType: string = 'text/plain') {
  const blob = new Blob([content], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export function downloadAsMarkdown(content: string, filename: string) {
  downloadFile(content, filename, 'text/markdown');
}
