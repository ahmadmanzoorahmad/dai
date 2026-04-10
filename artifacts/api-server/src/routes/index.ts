import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardsRouter from "./dashboards/index.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardsRouter);

export default router;
