// archive-links.js
// Copyright (c) 2020 Carl Gorringe
//
// Code copied and modified from:
// https://github.com/bfirsh/internetarchive-pdfjs-isbn-links/

// TODO: add event listeners to the "EventBus" instead of "eventBusDispatchToDOM"

document.addEventListener(
  "textlayerrendered",
  function(event) {
    if (event.detail.pageNumber === PDFViewerApplication.page) {
      console.log("Adding Archive links...");
      IA_findLinks();
    }
  },
  true
);

/*
// This code doesn't work yet...
var IA_eventBus;
document.addEventListener(
  "webviewerloaded",
  function(event) {
    console.log("webviewerloaded");

    // FIXME: Doesn't work, eventBus is null
    IA_eventBus = window.PDFViewerApplication.eventBus;
    if (IA_eventBus !== null) {

      IA_eventBus.on(
        "textlayerrendered",
        function(event) {
          console.log("textlayerrendered");
          if (event.detail.pageNumber === PDFViewerApplication.page) {
            console.log("Adding Archive links...");
            IA_findLinks();
          }
        },
        true
      );

    }

  },
  true
);
*/


function IA_addLinkFromRegexMatch(node, index, text, href) {
  // split Text Node in two and return 2nd node
  const linkText = node.splitText(index);
  // Split at end of match, discarding tail node
  linkText.splitText(text.length);

  const link = document.createElement("a");
  link.setAttribute("href", href);
  link.setAttribute("target", "_blank");
  link.setAttribute("class", "iarchive-link");

  // Insert link into DOM then move the text into the link
  linkText.parentNode.insertBefore(link, linkText);
  link.appendChild(linkText);

  return link;
}

// TODO: create generic way to store a list of regex's, wrapped regex's
//       in an array to support multiple link types, e.g. http, ISBN, etc...

function IA_findLinks() {

  // match web links, including end slashes, but not end periods.
  let httpRegex = /\bhttps?\:\/\/\S+[^\s\.]/g;

  // TODO: need to exclude matches that start with http(s), and include links with slashes but not ending in .html
  let httpWrap = /\S+\.html/;
  let httpPriorCount = 0;
  let priorAnode;

  const treeWalker = document.createTreeWalker(document.getElementById("viewer"), NodeFilter.SHOW_TEXT);
  while (treeWalker.nextNode()) {
    let node = treeWalker.currentNode;
    if (node.parentNode.nodeName === "SCRIPT" || node.parentNode.nodeName === "STYLE" || node.parentNode.nodeName === "A") {
      httpPriorCount -= 1;
      continue;
    }

    // searching for http(s) wrapped
    if (httpPriorCount > 0) {
      //console.log("httpPriorCount: ", httpPriorCount);  // DEBUG
      httpPriorCount -= 1;
      let matchWrap = httpWrap.exec(node.nodeValue);
      if (matchWrap !== null) {
        let url = matchWrap[0];
        console.log("Wrapped URL: ", url);  // DEBUG
        if (priorAnode !== null) {
          // append wrapped URL to prior URL
          let priorUrl = priorAnode.getAttribute("href");
          let fullUrl = priorUrl + url;
          console.log("Full URL: ", fullUrl);  // DEBUG
          IA_addLinkFromRegexMatch(node, matchWrap.index, url, fullUrl);
          priorAnode.setAttribute("href", fullUrl);
        }
        httpPriorCount = 0;
      }
    }

    // searching for http(s) matches
    let match = httpRegex.exec(node.nodeValue);
    while (match !== null) {
      // TODO: need to test this loop works correctly
      httpPriorCount = 3;
      let url = match[0];
      console.log("Found URL: ", url);
      priorAnode = IA_addLinkFromRegexMatch(node, match.index, url, "https://web.archive.org/web/2/" + url);  // wayback machine
      //priorAnode = IA_addLinkFromRegexMatch(node, match.index, url, url);  // direct link
      match = httpRegex.exec(node.nodeValue);
    }
    httpRegex.lastIndex = 0;

  }
}
