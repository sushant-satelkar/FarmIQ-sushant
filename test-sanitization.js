// Test sanitization logic
const testData = [
    {
        id: 1,
        name: 'Devanshu Singh',
        crops_grown: 'Tomato, Onion',
        available_quantity: '1200 kg',
        location: 'Nashik, Maharashtra',
        expected_price: '???30??????45/kg'
    },
    {
        id: 2,
        name: 'Vishesh',
        crops_grown: 'Wheat, Barley',
        available_quantity: '2500 kg',
        location: 'Akola, Maharashtra',
        expected_price: '???22??????30/kg'
    },
    {
        id: 3,
        name: 'Test Farmer',
        crops_grown: 'Sugarcane, Cotton',
        available_quantity: '5000 kg',
        location: 'Pune, Maharashtra',
        expected_price: '???280??????300/quintal'
    }
];

// Helper function to clean values safely
const cleanValue = (value, regex) => {
    if (!value || value.trim() === '') return '-';
    const cleaned = value.replace(regex, '').trim();
    return cleaned || '-';
};

// Sanitize data
const sanitized = testData.map(farmer => ({
    ...farmer,
    expected_price: cleanValue(farmer.expected_price, /[^\d₹\-–—\s\/a-zA-Z]/g),
    crops_grown: cleanValue(farmer.crops_grown, /[^a-zA-Z,\s]/g),
    available_quantity: cleanValue(farmer.available_quantity, /[^\d\sa-zA-Z]/g),
    location: cleanValue(farmer.location, /[^a-zA-Z,\s]/g)
}));

console.log(JSON.stringify(sanitized, null, 2));
