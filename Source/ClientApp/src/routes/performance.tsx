import { createFileRoute } from "@tanstack/react-router";
import { PerformancePage } from "../pages/Performance/Performance";

export const Route = createFileRoute("/performance")({
    component: PerformancePage
});
