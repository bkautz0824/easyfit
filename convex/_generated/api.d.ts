/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as devAuth from "../devAuth.js";
import type * as http from "../http.js";
import type * as insights from "../insights.js";
import type * as seedData from "../seedData.js";
import type * as trainingPlans from "../trainingPlans.js";
import type * as users from "../users.js";
import type * as workoutContext from "../workoutContext.js";
import type * as workouts from "../workouts.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  devAuth: typeof devAuth;
  http: typeof http;
  insights: typeof insights;
  seedData: typeof seedData;
  trainingPlans: typeof trainingPlans;
  users: typeof users;
  workoutContext: typeof workoutContext;
  workouts: typeof workouts;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
