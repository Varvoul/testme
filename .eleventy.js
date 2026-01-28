const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
  // ============================================
  // LIQUID OPTIONS (MUST BE FIRST)
  // ============================================
  eleventyConfig.setLiquidOptions({
    dynamicPartials: true,
    strict_filters: false,
    jsTruthy: true
  });

  // ============================================
  // PASSTHROUGH COPIES
  // ============================================
  eleventyConfig.addPassthroughCopy({
    "src/_assets": "assets",
    "src/admin": "admin",
    "src/robots.txt": "robots.txt",
    "src/sitemap.xml": "sitemap.xml"
  });

  // Watch for changes
  eleventyConfig.addWatchTarget("src/_assets");
  eleventyConfig.addWatchTarget("src/admin");

  // ============================================
  // FILTERS
  // ============================================
  // Escape filter for HTML safety
  eleventyConfig.addFilter("escape", function(value) {
    if (!value) return '';
    return value.replace(/[&<>"']/g, function(m) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[m];
    });
  });

  // WhereExp filter (for compatibility with existing templates)
  eleventyConfig.addFilter("whereExp", function(array, variableName, expression) {
    if (!Array.isArray(array)) return [];
    
    // For simple equality checks like "item.category == 'movie'"
    const match = expression.match(/(\w+)\.(\w+)\s*(==|!=|>=|<=|>|<)\s*(['"][^'"]+['"]|[^'"]+)/);
    
    if (!match) {
      console.warn(`whereExp expression not supported: ${expression}`);
      return [];
    }
    
    const [, varName, property, operator, value] = match;
    const cleanValue = value.replace(/^['"]|['"]$/g, '');
    
    return array.filter(item => {
      const itemValue = item[property] || item.data?.[property];
      
      // Convert to number if possible for numeric comparisons
      const numericValue = isNaN(cleanValue) ? cleanValue : Number(cleanValue);
      const numericItemValue = isNaN(itemValue) ? itemValue : Number(itemValue);
      
      switch(operator) {
        case '==': return numericItemValue == numericValue;
        case '!=': return numericItemValue != numericValue;
        case '>=': return numericItemValue >= numericValue;
        case '<=': return numericItemValue <= numericValue;
        case '>': return numericItemValue > numericValue;
        case '<': return numericItemValue < numericValue;
        default: return false;
      }
    });
  });

  // Date formatting
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("LLLL d, yyyy");
  });

  eleventyConfig.addFilter("htmlDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("yyyy-LL-dd");
  });

  // JSON filter
  eleventyConfig.addFilter("json", function(value) {
    return JSON.stringify(value);
  });

  // URL encode filter
  eleventyConfig.addFilter("urlencode", function(value) {
    return encodeURIComponent(value);
  });

  // Limit array filter
  eleventyConfig.addFilter("limit", function(array, limit) {
    if (!Array.isArray(array)) return [];
    return array.slice(0, limit);
  });

  // Where filter
  eleventyConfig.addFilter("where", function(array, key, value) {
    if (!Array.isArray(array)) return [];
    return array.filter(item => {
      const itemValue = item[key] || item.data?.[key];
      return itemValue === value;
    });
  });

  // Sort by filter
  eleventyConfig.addFilter("sortBy", function(array, key, order = "asc") {
    if (!Array.isArray(array)) return [];
    return array.sort((a, b) => {
      const aVal = a[key] || a.data?.[key];
      const bVal = b[key] || b.data?.[key];
      
      if (order === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  });

  // Truncate filter
  eleventyConfig.addFilter("truncate", function(str, length) {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
  });

  // Pluralize filter
  eleventyConfig.addFilter("pluralize", function(count, singular, plural) {
    return count === 1 ? singular : (plural || singular + 's');
  });

  // ============================================
  // COLLECTIONS
  // ============================================
  
  // All shows collection
  eleventyConfig.addCollection("allShows", function(collectionApi) {
    return collectionApi.getAll().filter(item => item.data.layout);
  });

  // Featured shows
  eleventyConfig.addCollection("featuredShows", function(collectionApi) {
    return collectionApi.getAll().filter(item => 
      item.data.featured === true
    ).sort((a, b) => (b.data.popularity || 0) - (a.data.popularity || 0));
  });

  // Movies collection
  eleventyConfig.addCollection("movies", function(collectionApi) {
    return collectionApi.getAll().filter(item => 
      item.data.type === 'movie'
    ).sort((a, b) => (b.data.airedYear || 0) - (a.data.airedYear || 0));
  });

  // Anime collection
  eleventyConfig.addCollection("anime", function(collectionApi) {
    return collectionApi.getAll().filter(item => 
      item.data.type === 'anime'
    ).sort((a, b) => (b.data.popularity || 0) - (a.data.popularity || 0));
  });

  // TV Shows collection
  eleventyConfig.addCollection("series", function(collectionApi) {
    return collectionApi.getAll().filter(item => 
      item.data.type === 'series'
    ).sort((a, b) => (b.data.airedYear || 0) - (a.data.airedYear || 0));
  });

  // Top Rated collection
  eleventyConfig.addCollection("topRated", function(collectionApi) {
    return collectionApi.getAll().filter(item => 
      (item.data.rating >= 8.0 || item.data.imbdScore >= 8.0)
    ).sort((a, b) => 
      (b.data.imbdScore || b.data.rating || 0) - (a.data.imbdScore || a.data.rating || 0)
    );
  });

  // Currently Airing collection
  eleventyConfig.addCollection("airing", function(collectionApi) {
    return collectionApi.getAll().filter(item => 
      item.data.status && 
      (item.data.status.includes('Airing') || 
       item.data.status.includes('Ongoing') ||
       item.data.status.includes('Currently'))
    ).sort((a, b) => (b.data.popularity || 0) - (a.data.popularity || 0));
  });

  // ============================================
  // SHORTCODES
  // ============================================
  
  // Current year
  eleventyConfig.addShortcode("year", function() {
    return new Date().getFullYear();
  });

  // Card component
  eleventyConfig.addShortcode("card", function(show) {
    return `
      <div class="card">
        <a href="/${show.type}/${show.slug}/">
          <img src="${show.posterUrl}" alt="${show.title}" loading="lazy">
          <h3>${show.title}</h3>
          <p>${show.airedYear} • ${show.type}</p>
        </a>
      </div>
    `;
  });

  // ============================================
  // GLOBAL DATA
  // ============================================
  eleventyConfig.addGlobalData("env", process.env);
  eleventyConfig.addGlobalData("buildTime", () => {
    return new Date().toISOString();
  });

  // ============================================
  // TRANSFORMS
  // ============================================
  
  // Minify HTML in production
  eleventyConfig.addTransform("htmlmin", function(content, outputPath) {
    if (outputPath && outputPath.endsWith(".html") && process.env.NODE_ENV === "production") {
      return content
        .replace(/\s+/g, " ")
        .replace(/>\s+</g, "><")
        .trim();
    }
    return content;
  });

  // Optimize search index JSON
  eleventyConfig.addTransform("search-index-optimization", function(content, outputPath) {
    if (outputPath && outputPath.endsWith("/search-index.json")) {
      try {
        const json = JSON.parse(content);
        return JSON.stringify(json);
      } catch (e) {
        console.warn("Could not parse search-index.json for optimization");
        return content;
      }
    }
    return content;
  });

  // ============================================
  // CONFIGURATION
  // ============================================
  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      layouts: "_includes",    
      data: "_data"
    },
    templateFormats: ["liquid", "md", "html", "njk", "json"],
    htmlTemplateEngine: "liquid",
    markdownTemplateEngine: "liquid",
    dataTemplateEngine: "liquid",
    passthroughFileCopy: true,
    pathPrefix: "/"
  };
};