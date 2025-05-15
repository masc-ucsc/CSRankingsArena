const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Categories and subcategories from seedCategories.js
const categories = [
  {
    slug: 'ai',
    subcategories: ['vision', 'ml', 'nlp', 'llm', 'robotics']
  },
  {
    slug: 'architecture',
    subcategories: ['processors', 'memory', 'accelerators']
  },
  {
    slug: 'os',
    subcategories: ['kernel', 'virtualization', 'distributed']
  }
];

const years = [2023, 2024, 2025];
const baseDir = path.join(__dirname, '../mock');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomResult() {
  return ['W', 'D', 'L'][randomInt(0, 2)];
}

function randomTrend() {
  return ['up', 'down', 'stable'][randomInt(0, 2)];
}

function randomTitle(subcat, i, year) {
  return `${subcat.charAt(0).toUpperCase() + subcat.slice(1)} Paper ${i + 1} (${year})`;
}

function randomOpponent(subcat) {
  return `${subcat.charAt(0).toUpperCase() + subcat.slice(1)} Opponent ${randomInt(1, 5)}`;
}

function generateMatchDetails(subcat, year) {
  const details = [];
  for (let i = 0; i < 5; i++) {
    details.push({
      date: `${year}-03-${randomInt(10, 28)}`,
      result: randomResult(),
      opponent: randomOpponent(subcat),
      rating: randomInt(1700, 2000),
      venue: `Venue ${randomInt(1, 3)} ${year}`
    });
  }
  return details;
}

function calculateStats(matchDetails) {
  let wins = 0, draws = 0, losses = 0, points = 0, ratingDiff = 0;
  matchDetails.forEach(m => {
    if (m.result === 'W') { wins++; points += 3; ratingDiff += m.rating; }
    else if (m.result === 'D') { draws++; points += 1; }
    else { losses++; ratingDiff -= m.rating; }
  });
  const matches = matchDetails.length;
  const winRate = matches > 0 ? (wins / matches) * 100 : 0;
  const form = matchDetails.map(m => m.result).join('');
  const trend = randomTrend();
  return { wins, draws, losses, points, matches, ratingDiff, winRate: parseFloat(winRate.toFixed(1)), form, trend };
}

function generatePapers(subcat, year) {
  const papers = [];
  for (let i = 0; i < 5; i++) {
    const matchDetails = generateMatchDetails(subcat, year);
    const stats = calculateStats(matchDetails);
    papers.push({
      id: `${subcat}-${year}-${i + 1}`,
      title: randomTitle(subcat, i, year),
      ...stats,
      match_details: matchDetails
    });
  }
  return papers;
}

function main() {
  for (const cat of categories) {
    for (const subcat of cat.subcategories) {
      for (const year of years) {
        const papers = generatePapers(subcat, year);
        const yamlObj = { matches: papers };
        const yamlStr = yaml.dump(yamlObj, { noRefs: true, lineWidth: 120 });
        const filename = `${cat.slug}-${subcat}-${year}-matches.yaml`;
        // Organize matches under matches/ai/llm/2025, papers under papers/ai/llm/2025 (parent directory 'papers')
        const matchesDir = path.join(baseDir, 'matches', cat.slug, subcat, year.toString());
        const papersDir = path.join(baseDir, 'papers', cat.slug, subcat, year.toString());
        ensureDir(matchesDir);
        ensureDir(papersDir);
        const matchesPath = path.join(matchesDir, filename);
        const papersPath = path.join(papersDir, filename);
        fs.writeFileSync(matchesPath, yamlStr, 'utf8');
        fs.writeFileSync(papersPath, yamlStr, 'utf8');
        console.log(`Generated matches file: ${matchesPath} and papers file: ${papersPath}`);
      }
    }
  }
}

main(); 