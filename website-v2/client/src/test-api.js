import { fetchCategories, testApiConnection } from './services/api';

async function testCategories() {
    try {
        // First test API connectivity
        console.log('Testing API connection...');
        const connectionTest = await testApiConnection();
        console.log('API Connection Test:', connectionTest);

        // Then test categories endpoint
        console.log('\nFetching categories...');
        const categories = await fetchCategories();
        console.log('Categories:', JSON.stringify(categories, null, 2));
        
        // Verify the structure
        if (Array.isArray(categories)) {
            console.log('\nCategories structure verification:');
            categories.forEach(category => {
                console.log(`\nCategory: ${category.name} (${category.slug})`);
                console.log(`- Description: ${category.description}`);
                console.log(`- Color: ${category.color}`);
                console.log('- Subcategories:');
                category.subcategories.forEach(sub => {
                    console.log(`  * ${sub.name} (${sub.slug})`);
                    console.log(`    - Description: ${sub.description}`);
                    console.log(`    - arXiv Categories: ${sub.arxivCategories.join(', ')}`);
                });
            });
        } else {
            console.error('Error: Categories is not an array');
        }
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run the test
testCategories(); 