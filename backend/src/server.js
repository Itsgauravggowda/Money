
import "dotenv/config";

import { createServer } from "node:http";

import { connectDatabase, closeDatabase } from "./db/database.js";
import { setupDatabase } from "./db/setup.js";

import { handleAuthRoutes } from "./routes/auth-routes.js";
import { handleFinancialEventRoutes } from "./routes/financial-event-routes.js";
import { handleGoalRoutes } from "./routes/goal-routes.js";
import { handleFinancialProfileRoutes } from "./routes/financial-profile-routes.js";
import { handleMonthlyPlanningRoutes } from "./routes/monthly-planning-routes.js";
import { handleFinancialScenarioRoutes } from "./routes/financial-scenario-routes.js";
import { handleLiabilityRoutes } from "./routes/liability-routes.js";
import { handleSavedScenarioRoutes } from "./routes/saved-scenario-routes.js";

const PORT = process.env.PORT || 3000;

const server = createServer(async (req, res) => {
    const pathname = new URL(
        req.url,
        `http://${req.headers.host || "localhost"}`
    ).pathname;

    if (req.method === "GET" && pathname === "/") {
        res.writeHead(200, {
            "Content-Type": "application/json",
        });

        res.end(JSON.stringify({
            status: "ok",
            message: "Money backend is running",
        }));

        return;
    }

    try {
        const authHandled = await handleAuthRoutes(req, res, pathname);
        if (authHandled) return;

        const financialEventsHandled =
            await handleFinancialEventRoutes(req, res, pathname);
        if (financialEventsHandled) return;

        const goalRoutesHandled =
            await handleGoalRoutes(req, res, pathname);
        if (goalRoutesHandled) return;

        const financialProfileRoutesHandled =
            await handleFinancialProfileRoutes(req, res, pathname);
        if (financialProfileRoutesHandled) return;

        const monthlyPlanningRoutesHandled =
            await handleMonthlyPlanningRoutes(req, res, pathname);
        if (monthlyPlanningRoutesHandled) return;

        const financialScenarioRoutesHandled =
            await handleFinancialScenarioRoutes(req, res, pathname);
        if (financialScenarioRoutesHandled) return;

        const savedScenarioRoutesHandled =
            await handleSavedScenarioRoutes(req, res, pathname);
        if (savedScenarioRoutesHandled) return;

        const liabilityRoutesHandled =
            await handleLiabilityRoutes(req, res, pathname);
        if (liabilityRoutesHandled) return;

        res.writeHead(404, {
            "Content-Type": "application/json",
        });

        res.end(JSON.stringify({
            status: "error",
            message: "Route not found",
        }));
    } catch (error) {
        console.error("Request error:", error);

        if (!res.headersSent) {
            res.writeHead(500, {
                "Content-Type": "application/json",
            });

            res.end(JSON.stringify({
                status: "error",
                message: "Internal server error",
            }));
        }
    }
});

async function startServer() {
    await connectDatabase();
    await setupDatabase();

    server.listen(PORT, () => {
        console.log(`Money backend running at http://localhost:${PORT}`);
    });
}

async function shutdown() {
    server.close(async () => {
        await closeDatabase();
        process.exit(0);
    });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startServer().catch(async (error) => {
    console.error("Failed to start Money backend:", error.message);
    await closeDatabase();
    process.exitCode = 1;
});
