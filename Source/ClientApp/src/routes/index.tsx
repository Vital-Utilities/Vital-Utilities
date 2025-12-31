import { createFileRoute } from "@tanstack/react-router";
import { Processes } from "../pages/Processes";

export const Route = createFileRoute("/")({
    component: Processes
});
