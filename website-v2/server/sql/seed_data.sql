-- Seed categories
INSERT INTO categories (name, slug, description, color) VALUES
('Artificial Intelligence', 'ai', 'Research in AI, machine learning, and computational intelligence.', '#3498db'),
('Computer Architecture', 'architecture', 'Design and optimization of computer hardware systems.', '#e74c3c'),
('Operating Systems', 'os', 'Research on OS design, resource management, and system software.', '#2ecc71');

-- Seed subcategories for AI
INSERT INTO subcategories (name, slug, description, category_id) VALUES
('Computer Vision', 'vision', 'Image recognition, object detection, and scene understanding.', (SELECT id FROM categories WHERE slug = 'ai')),
('Machine Learning', 'ml', 'Algorithms and methods for training systems from data.', (SELECT id FROM categories WHERE slug = 'ai')),
('Natural Language Processing', 'nlp', 'Text analysis, language understanding, and generation.', (SELECT id FROM categories WHERE slug = 'ai')),
('Large Language Models', 'llm', 'Research on transformer-based language models and their applications.', (SELECT id FROM categories WHERE slug = 'ai')),
('Robotics & AI', 'robotics', 'AI methods for robotics and autonomous systems.', (SELECT id FROM categories WHERE slug = 'ai'));

-- Seed subcategories for Computer Architecture
INSERT INTO subcategories (name, slug, description, category_id) VALUES
('Processor Design', 'processors', 'CPU architecture, pipeline design, and instruction sets.', (SELECT id FROM categories WHERE slug = 'architecture')),
('Memory Systems', 'memory', 'Memory hierarchies, caching, and storage systems.', (SELECT id FROM categories WHERE slug = 'architecture')),
('Hardware Accelerators', 'accelerators', 'Specialized processors for AI, graphics, and other domains.', (SELECT id FROM categories WHERE slug = 'architecture'));

-- Seed subcategories for OS
INSERT INTO subcategories (name, slug, description, category_id) VALUES
('Kernel Design', 'kernel', 'OS kernel architecture, scheduling, and resource management.', (SELECT id FROM categories WHERE slug = 'os')),
('Virtualization', 'virtualization', 'Virtual machines, containers, and system virtualization.', (SELECT id FROM categories WHERE slug = 'os')),
('Distributed Systems', 'distributed', 'Distributed operating systems and coordination.', (SELECT id FROM categories WHERE slug = 'os'));

-- Seed arXiv categories
-- AI - Vision
INSERT INTO arxiv_categories (name, subcategory_id) VALUES
('cs.CV', (SELECT id FROM subcategories WHERE slug = 'vision' AND category_id = (SELECT id FROM categories WHERE slug = 'ai')));

-- AI - ML
INSERT INTO arxiv_categories (name, subcategory_id) VALUES
('cs.LG', (SELECT id FROM subcategories WHERE slug = 'ml' AND category_id = (SELECT id FROM categories WHERE slug = 'ai'))),
('stat.ML', (SELECT id FROM subcategories WHERE slug = 'ml' AND category_id = (SELECT id FROM categories WHERE slug = 'ai')));

-- AI - NLP
INSERT INTO arxiv_categories (name, subcategory_id) VALUES
('cs.CL', (SELECT id FROM subcategories WHERE slug = 'nlp' AND category_id = (SELECT id FROM categories WHERE slug = 'ai')));

-- AI - LLM
INSERT INTO arxiv_categories (name, subcategory_id) VALUES
('cs.CL', (SELECT id FROM subcategories WHERE slug = 'llm' AND category_id = (SELECT id FROM categories WHERE slug = 'ai'))),
('cs.LG', (SELECT id FROM subcategories WHERE slug = 'llm' AND category_id = (SELECT id FROM categories WHERE slug = 'ai')));

-- AI - Robotics
INSERT INTO arxiv_categories (name, subcategory_id) VALUES
('cs.RO', (SELECT id FROM subcategories WHERE slug = 'robotics' AND category_id = (SELECT id FROM categories WHERE slug = 'ai')));

-- Architecture - Processors
INSERT INTO arxiv_categories (name, subcategory_id) VALUES
('cs.AR', (SELECT id FROM subcategories WHERE slug = 'processors' AND category_id = (SELECT id FROM categories WHERE slug = 'architecture')));

-- Architecture - Memory
INSERT INTO arxiv_categories (name, subcategory_id) VALUES
('cs.AR', (SELECT id FROM subcategories WHERE slug = 'memory' AND category_id = (SELECT id FROM categories WHERE slug = 'architecture')));

-- Architecture - Accelerators
INSERT INTO arxiv_categories (name, subcategory_id) VALUES
('cs.AR', (SELECT id FROM subcategories WHERE slug = 'accelerators' AND category_id = (SELECT id FROM categories WHERE slug = 'architecture'))),
('cs.DC', (SELECT id FROM subcategories WHERE slug = 'accelerators' AND category_id = (SELECT id FROM categories WHERE slug = 'architecture')));

-- OS - Kernel
INSERT INTO arxiv_categories (name, subcategory_id) VALUES
('cs.OS', (SELECT id FROM subcategories WHERE slug = 'kernel' AND category_id = (SELECT id FROM categories WHERE slug = 'os')));

-- OS - Virtualization
INSERT INTO arxiv_categories (name, subcategory_id) VALUES
('cs.OS', (SELECT id FROM subcategories WHERE slug = 'virtualization' AND category_id = (SELECT id FROM categories WHERE slug = 'os'))),
('cs.DC', (SELECT id FROM subcategories WHERE slug = 'virtualization' AND category_id = (SELECT id FROM categories WHERE slug = 'os')));

-- OS - Distributed
INSERT INTO arxiv_categories (name, subcategory_id) VALUES
('cs.OS', (SELECT id FROM subcategories WHERE slug = 'distributed' AND category_id = (SELECT id FROM categories WHERE slug = 'os'))),
('cs.DC', (SELECT id FROM subcategories WHERE slug = 'distributed' AND category_id = (SELECT id FROM categories WHERE slug = 'os')));