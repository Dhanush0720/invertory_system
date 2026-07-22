const cron = require('node-cron');
const Alert = require('../models/Alert');
const Item = require('../models/Item'); 
const { generateInventoryInsights } = require('../utils/agentService');
const { spawn } = require('child_process');
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
                $match: {
                    $expr: {
                        $and: [
                            { $gt: ['$quantityRemaining', -9999] },
                            { $lte: ['$quantityRemaining', { $ifNull: ['$lowStockThreshold', 5] }] }
                        ]
                    }
                }
            },
            {
                $project: { dists: 0 }
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
            if (highAlerts.length > 0) {
                const msgLines = [
                    `*🚨 Nirvahana Daily Alert Summary*`,
                    ``,
                    ...highAlerts.slice(0, 3).map((a, i) => `${i + 1}. ${a.message}`),
                    ``,
                    `*Action:* ${highAlerts[0].recommended_action}`
                ];
                const msg = msgLines.join('\n');
                const { triggerWhatsAppNotification } = require('../utils/whatsappHelper');
                triggerWhatsAppNotification(null, null, null, msg).catch(e => {
                    console.error('Failed to trigger daily WhatsApp alert:', e);
                });
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
