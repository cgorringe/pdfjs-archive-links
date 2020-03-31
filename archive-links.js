// archive-links.js
// Copyright (c) 2020 Carl Gorringe
//
// Code copied and modified from:
// https://github.com/bfirsh/internetarchive-pdfjs-isbn-links/

document.addEventListener(
	"textlayerrendered", 
	function(event) {
    // was this the last page?
    if (event.detail.pageNumber === PDFViewerApplication.page) {
      console.log("Adding Archive links...");
      IA_findLinks();
    }
  },
  true
);

function IA_addLinkFromRegexMatch(node, match, href) {
  // split Text Node in two and return 2nd node
  const linkText = node.splitText(match.index);
  // Split at end of match, discarding tail node
  linkText.splitText(match[0].length);   // TODO: review this

  const link = document.createElement("a");
  link.setAttribute("href", href);
  link.setAttribute("target", "_blank");
  link.setAttribute("class", "iarchive-link");

  // Insert link into DOM then move the text into the link
  // TODO: not sure here, need to test!
  linkText.parentNode.insertBefore(link, linkText);
  link.appendChild(linkText);
}

function IA_findLinks() {

  // TODO: include ending slashes (but not periods) and need to support line wrapping.
  let rex = /\bhttps?\:\/\/\S+\b/g;

  const treeWalker = document.createTreeWalker(document.getElementById("viewer"), NodeFilter.SHOW_TEXT);
  while (treeWalker.nextNode()) {
    let node = treeWalker.currentNode;
    if (node.parentNode.nodeName === "SCRIPT" || node.parentNode.nodeName === "STYLE" || node.parentNode.nodeName === "A") { continue; }

    //let match = rex.exec(node.nodeValue)
    //if (!match) { continue; }

    let match;
    while ((match = rex.exec(node.nodeValue)) !== null) {
      // TODO: need to test this loop works correctly
      const url = match[0];
      console.log("Found URL: ", url);
      IA_addLinkFromRegexMatch(node, match, "https://web.archive.org/web/*/" + url);
    }
    rex.lastIndex = 0;
  }
}
