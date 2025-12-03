/**
 * Simple keyword extraction utility for agricultural Q&A system
 * Extracts 1-3 most relevant keywords from farmer questions
 */

// Common agricultural terms dictionary
const AGRICULTURAL_TERMS = [
    // Crops
    'wheat', 'rice', 'corn', 'maize', 'barley', 'soybean', 'cotton', 'sugarcane',
    'tomato', 'potato', 'onion', 'chili', 'capsicum', 'cucumber', 'cabbage',
    'cauliflower', 'carrot', 'peas', 'beans', 'groundnut', 'mustard', 'sunflower',
    'bajra', 'jowar', 'ragi', 'pulses', 'gram', 'lentils', 'chickpea',
    'basmati', 'paddy', 'millet', 'oats', 'pomegranate', 'grapes', 'mango',

    // Diseases & Pests
    'disease', 'pest', 'fungus', 'fungal', 'bacteria', 'bacterial', 'virus', 'viral',
    'blight', 'rust', 'wilt', 'rot', 'mildew', 'scab', 'mold', 'infection',
    'aphid', 'whitefly', 'thrips', 'mite', 'caterpillar', 'bollworm', 'leafhopper',
    'nematode', 'weevil', 'borer', 'insect', 'infestation',

    // Fertilizers & Nutrients
    'fertilizer', 'manure', 'compost', 'urea', 'nitrogen', 'phosphorus', 'potassium',
    'npk', 'dap', 'organic', 'vermicompost', 'biofertilizer', 'nutrient',
    'sulfur', 'zinc', 'iron', 'calcium', 'magnesium', 'micronutrient',

    // Soil
    'soil', 'ph', 'acidity', 'alkalinity', 'texture', 'sandy', 'loamy', 'clay',
    'erosion', 'drainage', 'moisture', 'salinity', 'fertility', 'tilth',

    // Weather & Water
    'irrigation', 'drip', 'sprinkler', 'water', 'rainfall', 'drought', 'flood',
    'temperature', 'humidity', 'frost', 'heat', 'monsoon', 'winter', 'summer',

    // Market & Economics
    'market', 'price', 'rate', 'selling', 'mandi', 'apmc', 'enam', 'quintal',
    'cost', 'profit', 'subsidy', 'loan', 'insurance', 'procurement',

    // General farming
    'crop', 'harvest', 'yield', 'production', 'sowing', 'planting', 'cultivation',
    'farming', 'agriculture', 'organic', 'season', 'variety', 'hybrid', 'seed',
    'germination', 'growth', 'spacing', 'pruning', 'mulching', 'intercropping'
];

// Stop words to ignore
const STOP_WORDS = [
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
    'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'will',
    'with', 'i', 'my', 'can', 'should', 'would', 'could', 'have', 'do', 'does',
    'what', 'when', 'where', 'which', 'who', 'why', 'how', 'about', 'after',
    'before', 'during', 'than', 'this', 'these', 'those', 'am', 'been', 'being',
    'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such'
];

/**
 * Extract keywords from a question
 * @param {string} question - The farmer's question
 * @returns {string} Comma-separated keywords (1-3 keywords)
 */
function extractKeywords(question) {
    if (!question || typeof question !== 'string') {
        return '';
    }

    // Convert to lowercase and remove special characters
    const cleaned = question.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');

    // Split into words
    const words = cleaned.split(/\s+/).filter(word => word.length > 2);

    // Remove stop words
    const filteredWords = words.filter(word => !STOP_WORDS.includes(word));

    // Find agricultural terms in the question
    const agriculturalKeywords = [];
    AGRICULTURAL_TERMS.forEach(term => {
        if (cleaned.includes(term)) {
            agriculturalKeywords.push(term);
        }
    });

    // Score words based on:
    // 1. Agricultural term match (highest priority)
    // 2. Word frequency
    // 3. Word length
    const wordScores = {};

    // Agricultural terms get highest score
    agriculturalKeywords.forEach(word => {
        wordScores[word] = (wordScores[word] || 0) + 10;
    });

    // Count frequency of other words
    filteredWords.forEach(word => {
        if (!wordScores[word]) {
            wordScores[word] = (wordScores[word] || 0) + 1;
        }
    });

    // Bonus for longer words (likely more specific)
    Object.keys(wordScores).forEach(word => {
        if (word.length >= 6) {
            wordScores[word] += 0.5;
        }
    });

    // Sort by score
    const sortedWords = Object.keys(wordScores).sort((a, b) => {
        return wordScores[b] - wordScores[a];
    });

    // Return top 1-3 keywords
    const topKeywords = sortedWords.slice(0, 3);

    return topKeywords.join(', ');
}

/**
 * Check if a question has good keyword matches with database entry
 * @param {string} questionKeywords - Extracted keywords from question
 * @param {string} dbKeywords - Keywords stored in database
 * @returns {number} Match score (0-100)
 */
function calculateKeywordMatchScore(questionKeywords, dbKeywords) {
    if (!questionKeywords || !dbKeywords) return 0;

    const qKeywords = questionKeywords.toLowerCase().split(',').map(k => k.trim());
    const dKeywords = dbKeywords.toLowerCase().split(',').map(k => k.trim());

    let matches = 0;
    qKeywords.forEach(qKey => {
        dKeywords.forEach(dKey => {
            if (qKey === dKey || qKey.includes(dKey) || dKey.includes(qKey)) {
                matches++;
            }
        });
    });

    const maxPossibleMatches = Math.max(qKeywords.length, dKeywords.length);
    return Math.round((matches / maxPossibleMatches) * 100);
}

module.exports = {
    extractKeywords,
    calculateKeywordMatchScore
};
