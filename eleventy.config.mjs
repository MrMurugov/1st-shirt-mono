export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({
    "src/assets/css/styles-v2.css": "assets/css/styles-v2.css",
    "src/assets/js/main.js": "assets/js/main.js",
    "src/assets/fonts/manrope-cyrillic.woff2": "assets/fonts/manrope-cyrillic.woff2",
    "src/assets/fonts/manrope-latin.woff2": "assets/fonts/manrope-latin.woff2",
    "src/assets/images": "assets/images"
  });
  eleventyConfig.addFilter("absoluteUrl", (value, baseUrl) => {
    const cleanValue = String(value || "").replace(/^\/+/, "");
    return new URL(cleanValue, baseUrl).href;
  });

  return {
    pathPrefix: "/1st-shirt/",
    dir: {
      input: "src",
      output: "dist"
    }
  };
}
