export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  return {
    pathPrefix: "/1st-shirt/",
    dir: {
      input: "src",
      output: "dist"
    }
  };
}
