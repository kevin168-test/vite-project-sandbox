import { db, type Question } from '../db';

export async function getWeightedRandomSample(count: number, category?: string) {
  let allQuestions = await db.questions.toArray();
  
  if (category) {
    allQuestions = allQuestions.filter(q => q.category === category);
  }

  const allProgress = await db.progress.toArray();
  const progressMap = new Map(allProgress.map(p => [p.id, p]));

  const weightedQuestions = allQuestions.map(q => {
    const progress = progressMap.get(q.id!);
    let weight = 1.0;

    if (!progress) {
      weight = 1.0;
    } else {
      const { correctCount, wrongCount } = progress;
      if (correctCount > 0 && correctCount > wrongCount) {
        weight = 0.2;
      } else if (wrongCount === 1) {
        weight = 3.0;
      } else if (wrongCount >= 2) {
        weight = 5.0;
      }
    }

    return { question: q, weight };
  });

  // Weighted random sampling without replacement
  const selected: Question[] = [];
  const pool = [...weightedQuestions];

  for (let i = 0; i < count && pool.length > 0; i++) {
    const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let j = 0; j < pool.length; j++) {
      random -= pool[j].weight;
      if (random <= 0) {
        selected.push(pool[j].question);
        pool.splice(j, 1);
        break;
      }
    }
  }

  return selected;
}
