import {
  toClassName, buildBlock, decorateBlock, loadBlock,
} from '../../scripts/aem.js';

const isDesktop = window.matchMedia('(width >= 900px)');

async function decorateTabPanel(tabPanel) {
  if (tabPanel.dataset.loaded === 'true') {
    return;
  }

  // load fragments
  const fragments = tabPanel.querySelectorAll('a[href*="/fragments/"]:only-child');
  await Promise.all([...fragments].map(async (a) => {
    const parent = a.parentNode;
    const fragment = buildBlock('fragment', [[a.cloneNode(true)]]);
    if (parent.tagName === 'P') {
      parent.before(fragment);
      parent.remove();
    } else {
      a.before(fragment);
      a.remove();
    }
    decorateBlock(fragment);
    await loadBlock(fragment);
  }));

  // create columns for any additional content

  tabPanel.dataset.loaded = true;
}

/**
 * decorate the jobs block
 * @param {Element} block the block element
 */
export default async function decorate(block) {
  // build tablist
  const tablist = document.createElement('div');
  tablist.className = 'tabs-list';
  tablist.setAttribute('role', 'tablist');

  [...block.children].forEach((tab, idx) => {
    const [tabButton, tabPanel] = [...tab.children];
    const id = toClassName(tabButton.textContent);
    if (tabButton.querySelector('a') && (!tabPanel || !tabPanel.textContent)) {
      let buttonContent = tabButton.firstElementChild;
      // buttonContent is likely a link inside of an h2 (or similar).
      // need to reverse order so the "action" elements are the first level childeen of the tablist
      const link = buttonContent.firstElementChild;
      if (link.tagName === 'A') {
        const clonedLink = link.cloneNode(true);
        const linkText = clonedLink.textContent;
        const clonedH2 = buttonContent.cloneNode(false);
        clonedH2.textContent = linkText;
        clonedLink.replaceChildren(clonedH2);
        buttonContent = clonedLink;
      }
      buttonContent.className = 'tabs-tab';
      tablist.append(buttonContent);
    } else {
      // build tab button
      const button = document.createElement('button');
      button.className = 'tabs-tab';
      button.id = `tab-${id}`;
      button.append(tabButton.firstElementChild);
      button.setAttribute('aria-controls', `tabpanel-${id}`);
      button.setAttribute('aria-selected', idx === 0);
      button.setAttribute('role', 'tab');
      button.setAttribute('type', 'button');
      button.addEventListener('click', () => {
        const expanded = button.getAttribute('aria-selected') === 'true';
        decorateTabPanel(tabPanel);
        block.querySelectorAll('[role=tabpanel]').forEach((panel) => {
          panel.setAttribute('aria-hidden', true);
        });
        tablist.querySelectorAll('button').forEach((btn) => {
          btn.setAttribute('aria-selected', false);
        });
        const shouldExpand = isDesktop.matches ? true : !expanded;
        button.setAttribute('aria-selected', shouldExpand);
        tabPanel.setAttribute('aria-hidden', !shouldExpand);
      });
      tablist.append(button);

      // decorate tabpanel
      tabPanel.className = 'tabs-panel';
      tabPanel.id = `tabpanel-${id}`;
      tabPanel.setAttribute('aria-hidden', idx !== 0);
      tabPanel.setAttribute('aria-labelledby', `tab-${id}`);
      tabPanel.setAttribute('role', 'tabpanel');
      tabPanel.dataset.loaded = false;

      block.append(tabPanel);
    }
    tab.remove();
  });

  tablist.setAttribute('aria-orientation', isDesktop.matches ? 'horizontal' : 'vertical');
  isDesktop.addEventListener('change', () => {
    tablist.setAttribute('aria-orientation', isDesktop.matches ? 'horizontal' : 'vertical');
    if (!block.querySelector('[role=tabpanel][aria-hidden=false]')) {
      tablist.querySelector('[role=tab]').click();
    }
  });

  await decorateTabPanel(block.querySelector('[role=tabpanel][aria-hidden=false]'));
  block.prepend(tablist);
}
