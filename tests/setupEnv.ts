import { loadEnvConfig } from "@next/env";
import { resolve } from "path";
loadEnvConfig(resolve(__dirname, ".."));

/**
 * The unit suite runs against mock repositories and the simulated payment
 * gateway, which refuses to start unless APP_MODE is "demo".
 *
 * Without this the order-lifecycle test passes only for a developer who
 * happens to have APP_MODE=demo in .env.local, and fails for everyone else —
 * a fresh clone and CI included. A test should declare the mode it needs
 * rather than inherit it from whatever the machine happens to have.
 *
 * Defaulted, never forced: a run that sets APP_MODE explicitly keeps it, so
 * this cannot mask a suite deliberately exercising live-gateway behaviour.
 */
process.env.APP_MODE ??= "demo";
process.env.NEXT_PUBLIC_APP_MODE ??= process.env.APP_MODE;
