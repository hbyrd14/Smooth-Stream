import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import organizationsRouter from "./organizations";
import eventsRouter from "./events";
import tasksRouter from "./tasks";
import notesRouter from "./notes";
import assetsRouter from "./assets";
import activityRouter from "./activity";
import profilesRouter from "./profiles";
import settingsRouter from "./settings";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(organizationsRouter);
router.use(eventsRouter);
router.use(tasksRouter);
router.use(notesRouter);
router.use(assetsRouter);
router.use(activityRouter);
router.use(profilesRouter);
router.use(settingsRouter);
router.use(aiRouter);

export default router;
