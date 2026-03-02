const fs = require('fs');
const path = require('path');

const newCorsBlock = `
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
`;

function processFile(filePath, dryRun = false) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (!content.includes('export default')) {
        return false;
    }

    const handlerRegex = /(export\s+default\s+(?:async\s+)?function\s+handler\s*\(\s*req\s*,\s*res\s*\)\s*\{)/;
    const match = content.match(handlerRegex);
    
    if (!match) return false;
    
    const handlerStart = match.index + match[0].length;
    
    const preHandler = content.slice(0, handlerStart);
    let postHandler = content.slice(handlerStart);

    // Strip ALL res.setHeader that appear early on (looping while we find them near the start)
    // We remove them if they happen before the first real logic like `if (req.method !==` or `try {`
    // Actually, simplest regex: Just find everything from the handler { ... to the first `if (req.method !==` or `try {`
    
    const logicStartMatch = postHandler.match(/\s*(?:if\s*\(\s*req\.method\s*!==|try\s*\{|const\s+\{)/);
    
    let toReplace = postHandler;
    let actualContent = "";
    if (logicStartMatch) {
       toReplace = postHandler.slice(0, logicStartMatch.index);
       actualContent = postHandler.slice(logicStartMatch.index);
    }
    
    // The `toReplace` section contains all the old CORS and OPTIONS preflights
    // We just toss it out completely.
    
    const newContent = preHandler + newCorsBlock + "\n" + actualContent;
    
    if (!dryRun) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated CORS for: ${filePath}`);
    } else {
        console.log(`\n\n--- DRY RUN: ${filePath} ---\n` + newContent.substring(0, 500) + '...\n');
    }
    return true;
}

function processDir(dir, dryRun) {
    const files = fs.readdirSync(dir);
    let count = 0;
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory() && !fullPath.includes('_lib')) {
            count += processDir(fullPath, dryRun);
        } else if (fullPath.endsWith('.js') && file !== 'supabase.js' && !fullPath.includes('_lib')) {
            count += processFile(fullPath, dryRun) ? 1 : 0;
        }
    }
    return count;
}

const apiDir = path.join(__dirname, 'api');
const updatedCount = processDir(apiDir, false); // DRY RUN FALSE
console.log(`Successfully scanned ${updatedCount} API route(s).`);
