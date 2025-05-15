const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

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

function randomOpponent(subcat) {
  return `${subcat.charAt(0).toUpperCase() + subcat.slice(1)} Opponent ${randomInt(1, 5)}`;
}

function generateMatchDetails(paper, subcat, year) {
  const details = [];
  for (let i = 0; i < 5; i++) {
    details.push({
      date: `${year}-03-${randomInt(10, 28)}`,
      result: randomResult(),
      opponent: randomOpponent(subcat),
      rating: randomInt(1700, 2000),
      venue: paper.venue
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

function generateMatchesForPaper(paper, subcat, year) {
  const matchDetails = generateMatchDetails(paper, subcat, year);
  const stats = calculateStats(matchDetails);
  return {
    id: paper.id,
    title: paper.title,
    ...stats,
    match_details: matchDetails
  };
}

function main() {
  // Read all paper files and generate matches for each paper
  const papersDir = path.join(baseDir, 'papers');
  
  function processDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        processDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('-papers.yaml')) {
        // Read the papers file
        const papersContent = fs.readFileSync(fullPath, 'utf8');
        const papersData = yaml.load(papersContent);
        
        // Extract category, subcategory, and year from the filename
        const [cat, subcat, year] = entry.name.split('-');
        
        // Generate matches for each paper
        const matches = papersData.papers.map(paper => 
          generateMatchesForPaper(paper, subcat, year)
        );
        
        // Save matches to corresponding matches directory
        const matchesDir = fullPath.replace('/papers/', '/matches/').replace('-papers.yaml', '-matches.yaml');
        const matchesDirPath = path.dirname(matchesDir);
        ensureDir(matchesDirPath);
        
        const yamlObj = { matches: matches };
        const yamlStr = yaml.dump(yamlObj, { noRefs: true, lineWidth: 120 });
        fs.writeFileSync(matchesDir, yamlStr, 'utf8');
        console.log(`Generated matches file: ${matchesDir}`);
      }
    }
  }
  
  processDirectory(papersDir);
}

main(); 