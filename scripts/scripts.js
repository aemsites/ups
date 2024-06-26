import {
  sampleRUM,
  buildBlock,
  loadHeader,
  loadFooter,
  // decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForLCP,
  loadBlocks,
  loadCSS,
} from './aem.js';

const LCP_BLOCKS = []; // add your LCP blocks to the list

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates links with appropriate classes to style them as buttons
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    // identify standalone links
    if (a.href !== a.textContent && p.textContent === a.textContent) {
      a.className = 'button';
      const strong = a.closest('strong');
      const em = a.closest('em');
      const double = !!strong && !!em;
      if (double) a.classList.add('accent');
      else if (strong) a.classList.add('emphasis');
      else if (em) a.classList.add('outline');
      p.innerHTML = a.outerHTML;
      p.className = 'button-wrapper';
    }
  });
}

function decorateImages(main) {
  main.querySelectorAll('p img').forEach((img) => {
    const p = img.closest('p');
    p.className = 'img-wrapper';
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateImages(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
}

function detectFastConnection() {
  if (window.navigator && window.navigator.connection) {
    return window.navigator.connection.effectiveType === '4g';
  }

  /** desktop as proxy for speed */
  return window.innerWidth >= 900;
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await waitForLCP(LCP_BLOCKS);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (sessionStorage.getItem('fonts-loaded') || detectFastConnection()) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadBlocks(main);

  // promises we want to complete before lazy finished, but we don't need to wait for individually
  const lazyPromises = [];

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  lazyPromises.push(loadHeader(doc.querySelector('header')));
  lazyPromises.push(loadFooter(doc.querySelector('footer')));

  lazyPromises.push(loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`));
  lazyPromises.push(loadFonts());

  await Promise.allSettled(lazyPromises);

  sampleRUM('lazy');
  sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));
  sampleRUM.observe(main.querySelectorAll('picture > img'));
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  let loadDelay = 3000;
  if (window.navigator && window.navigator.connection && window.navigator.connection.downlink > 0) {
    loadDelay = 3000 - (window.navigator.connection.downlink * 200);
    console.error(`
      loadDelay: ${loadDelay}; 
      connection: ${window.navigator.connection.effectiveType}; 
        downlink: ${window.navigator.connection.downlink}
    `);
  }

  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), loadDelay);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
