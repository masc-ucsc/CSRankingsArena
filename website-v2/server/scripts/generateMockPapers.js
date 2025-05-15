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

function randomTitle(subcat, i, year) {
  return `${subcat.charAt(0).toUpperCase() + subcat.slice(1)} Paper ${i + 1} (${year})`;
}

function generatePaper(subcat, year, i) {
  return {
    id: `${subcat}-${year}-${i + 1}`,
    title: randomTitle(subcat, i, year),
    authors: [
      `Author ${randomInt(1, 3)}`,
      `Author ${randomInt(4, 6)}`,
      `Author ${randomInt(7, 9)}`
    ],
    venue: `Venue ${randomInt(1, 3)} ${year}`,
    year: year,
    abstract: `This is a sample abstract for ${subcat} paper ${i + 1} from ${year}. It describes the research contributions and findings.`,
    citations: randomInt(0, 100),
    impact_score: randomInt(1, 10),
    keywords: [
      `${subcat}-keyword-1`,
      `${subcat}-keyword-2`,
      `${subcat}-keyword-3`
    ]
  };
}

function generatePapers(subcat, year) {
  const papers = [];
  for (let i = 0; i < 5; i++) {
    papers.push(generatePaper(subcat, year, i));
  }
  return papers;
}

function main() {
  for (const cat of categories) {
    for (const subcat of cat.subcategories) {
      for (const year of years) {
        const papers = generatePapers(subcat, year);
        const yamlObj = { papers: papers };
        const yamlStr = yaml.dump(yamlObj, { noRefs: true, lineWidth: 120 });
        const filename = `${cat.slug}-${subcat}-${year}-papers.yaml`;
        const papersDir = path.join(baseDir, 'papers', cat.slug, subcat, year.toString());
        ensureDir(papersDir);
        const papersPath = path.join(papersDir, filename);
        fs.writeFileSync(papersPath, yamlStr, 'utf8');
        console.log(`Generated papers file: ${papersPath}`);
      }
    }
  }
}

main(); 