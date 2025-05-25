import { httpRouter } from "convex/server";

const http = httpRouter();

// If you need to add other HTTP routes, you can do so here, for example:
// http.route({
//   path: "/somePath",
//   method: "GET",
//   handler: httpAction(async () => {
//     return new Response("Hello from /somePath");
//   }),
// });

// The auth setup in convex/http.ts expects this router.
export default http;
