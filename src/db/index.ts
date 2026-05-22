import Dexie, { type Table } from 'dexie';

export interface Question {
  id?: number;
  question: string;
  A: string;
  B: string;
  C: string;
  D: string;
  answer: string;
  explanation: string;
  year: string;
  category: string;
}

export interface Progress {
  id: number; // Question ID
  correctCount: number;
  wrongCount: number;
}

export class ExamDatabase extends Dexie {
  questions!: Table<Question>;
  progress!: Table<Progress>;

  constructor() {
    super('ExamSystemDB');
    this.version(1).stores({
      questions: '++id, question, year, category',
      progress: 'id, correctCount, wrongCount'
    });
  }
}

export const db = new ExamDatabase();
