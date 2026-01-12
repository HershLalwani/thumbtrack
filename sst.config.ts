/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "thumbtrack",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "cloudflare",
    };
  },
  async run() {
    // Create R2 bucket for image uploads
    const bucket = new sst.cloudflare.Bucket("ThumbtrackImages");

    // Output bucket info for use in the API
    return {
      bucket: bucket.name,
    };
  },
});
