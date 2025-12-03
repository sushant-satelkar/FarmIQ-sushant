// Test script to verify sanitization logic
const testData = [
    {
        id: 1,
        name: "Devanshu Singh",
        crops_grown: "Tomato, Onion",
        available_quantity: "1200 kg",
        location: "Nashik, Maharashtra",
        expected_price: "₹30-₹45/kg"
    }
];

// Sanitization functions (matching server.js)
const sanitize = (farmer) => ({
    ...farmer,
    expected_price: farmer.expected_price
        ? (farmer.expected_price.replace(/[^\d₹\-–\/kgquintal\s]/gi, '').trim() || '-')
        : '-',
    crops_grown: farmer.crops_grown
        ? (farmer.crops_grown.replace(/[^a-zA-Z,\s]/g, '').trim() || '-')
        : '-',
    available_quantity: farmer.available_quantity
        ? (farmer.available_quantity.replace(/[^\d\skgquintal]/gi, '').trim() || '-')
        : '-',
    location: farmer.location
        ? (farmer.location.replace(/[^a-zA-Z,\s]/g, '').trim() || '-')
        : '-'
});

// Test
console.log('Original:', testData[0]);
console.log('Sanitized:', sanitize(testData[0]));
