const cron = require('node-cron');
const Alert = require('../models/Alert');
// Assuming your inventory model is called Item. Adjust the path/name if needed!
const Item = require('../models/Item'); 
const { generateInventoryInsights } = require('../utils/agentService');
const { exec } = require('child_process');
const path = require('path');

async function runAutonomousAgent() {
    console.log("🤖 Nirvahana agent is waking up to analyze inventory...");
    
    try {
        const Distribution = require('../models/Distribution');

        // ── 1. Compute real remaining stock via aggregation (quantityRemaining is NOT stored in Item schema)
        //       Join Item with Distribution totals, subtract to get actual remaining
        const stockPipeline = [
            {
                $lookup: {
                    from: 'distributions',
                    localField: '_id',
                    foreignField: 'item',
                    as: 'dists'
                }
            },
            {
                $addFields: {
                    totalDistributed: { $sum: '$dists.quantityDistributed' },
                    quantityRemaining: { $subtract: ['$quantityPurchased', { $sum: '$dists.quantityDistributed' }] }
                }
            },
            {
                $match: { quantityRemaining: { $lte: 5, $gt: -9999 } }  // items where remaining ≤ 5
            },
            {
                $project: { dists: 0 }  // strip distribution array from payload
            }
        ];

        const lowStockItems = await Item.aggregate(stockPipeline);
        console.log(`📦 Low stock items found: ${lowStockItems.length}`);

        // Find recent items (new stock) for financial anomaly analysis
        const recentItems = await Item.find().sort({ createdAt: -1 }).limit(10).lean();
        
        // Find recent distributions to detect usage fraud/shrinkage
        const recentDistributions = await Distribution.find().sort({ dateOfDistribution: -1 }).limit(20).populate('item', 'itemName unitPrice').lean();

        const inventoryData = {
            lowStockItems,
            recentItems,
            recentDistributions
        };

        // 2. Think (The "Brain")
        const insightsData = await generateInventoryInsights(inventoryData);

        // 3. Act (Store the Insights)
        if (insightsData && insightsData.insights) {
            // Optional: Clear out old active alerts so the dashboard doesn't get cluttered
            await Alert.deleteMany({ status: 'active' });

            // Prepare the new alerts for the database
            const alertsToSave = insightsData.insights.map(alert => ({
                severity: alert.severity,
                issue_type: alert.issue_type,
                message: alert.message,
                recommended_action: alert.recommended_action,
                action_code: alert.action_code,
                status: 'active'
            }));

            // Save them all to MongoDB
            await Alert.insertMany(alertsToSave);
            console.log(`✅ Nirvahana saved ${alertsToSave.length} new alerts to the database.`);

            // ── WHATSAPP AUTONOMOUS NOTIFICATION ──
            const highAlerts = alertsToSave.filter(a => a.severity === 'High');
            const phone  = process.env.WHATSAPP_NUMBER;

            if (highAlerts.length > 0 && phone) {
                console.log(`📱 Sending WhatsApp alert to ${phone}...`);
                const msgLines = [
                    `*🚨 Nirvahana Low-Stock Alert*`,
                    ``,
                    ...highAlerts.slice(0, 3).map((a, i) => `${i + 1}. ${a.message}`),
                    ``,
                    `*Action:* ${highAlerts[0].recommended_action}`
                ];
                const msg = msgLines.join('\n').replace(/"/g, "'");
                const scriptPath = path.join(__dirname, '../utils/whatsapp_sender.py');
                const command = `python "${scriptPath}" "${phone}" "${msg}"`;
                exec(command, (error, stdout, stderr) => {
                    if (error) console.error(`❌ WhatsApp failed: ${error.message}`);
                    else console.log(`✅ WhatsApp sent: ${stdout.trim()}`);
                    if (stderr) console.warn(`⚠️ Python stderr: ${stderr.trim()}`);
                });
            } else if (highAlerts.length > 0) {
                console.log("⚠️ High alerts found but WHATSAPP_NUMBER is missing in .env. Skipping.");
            }

        } else {
            console.log("⚠️ Agent ran, but no insights were generated.");
        }

    } catch (error) {
        console.error("❌ Agent execution failed:", error);
    }
}

// Schedule the agent to run automatically at Midnight every day
cron.schedule('0 0 * * *', runAutonomousAgent);

// Export the function so we can manually trigger it for the hackathon demo
module.exports = { runAutonomousAgent };