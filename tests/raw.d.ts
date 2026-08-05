/** Vite's `?raw` import suffix: pulls a file in as a string. Used by source-scanning tests. */
declare module "*?raw" {
  const content: string;
  export default content;
}
