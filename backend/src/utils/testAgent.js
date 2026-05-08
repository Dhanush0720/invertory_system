// Remove the 'utils/' part from the require path
const { generateInventoryInsights } = require('./agentService');


const mockDatabaseData = {
    lowStockItems: [
        { item_name: "Whiteboard Markers (Black)", current_stock: 4, minimum_threshold: 20 },
        { item_name: "Ethernet Cables (5m)", current_stock: 12, minimum_threshold: 15 }
    ],
    recentDistributions: [
        { department: "Computer Science", item: "Laptops", quantity: 15, date: "2026-03-24" },
        { department: "Computer Science", item: "Laptops", quantity: 12, date: "2026-03-23" }, // Anomaly: CS taking a lot of laptops two days in a row
        { department: "Mechanical", item: "Safety Goggles", quantity: 2, date: "2026-03-24" }
    ]
};

async function runTest() {
    console.log("Agent is analyzing data...\n");
    const insights = await generateInventoryInsights(mockDatabaseData);
    console.log(JSON.stringify(insights, null, 2));
}

runTest();