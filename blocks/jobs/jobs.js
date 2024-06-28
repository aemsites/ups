import {
  toClassName, buildBlock, decorateBlock, loadBlock,
} from '../../scripts/aem.js';

const isDesktop = window.matchMedia('(width >= 900px)');

async function decorateTabPanel(tabPanel) {
  if (tabPanel.dataset.status === 'loaded' || tabPanel.dataset.status === 'loading') {
    return;
  }
  tabPanel.dataset.status = 'loading';

  if (tabPanel.querySelector('img')) {
    tabPanel.classList.add('has-hero-img');
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

  tabPanel.dataset.status = 'loaded';
}

async function updateActivePanel(block, idx) {
  let tabLoadingPromise;
  block.querySelectorAll('.tabs-panel').forEach((tabPanel, i) => {
    tabPanel.classList.remove('active');
    const isActive = idx === i;
    if (isActive) {
      tabPanel.classList.add('active');
      tabLoadingPromise = decorateTabPanel(tabPanel);
    }

    if (isDesktop.matches) {
      tabPanel.setAttribute('aria-hidden', !isActive);
    } else {
      const panelControlButton = tabPanel.querySelector('.tabs-panel-header button');
      if (panelControlButton) {
        panelControlButton.setAttribute('aria-expanded', isActive);
      }
    }
  });

  block.querySelectorAll('.tabs-list .tabs-tab').forEach((tab, i) => {
    tab.setAttribute('aria-selected', idx === i);
  });

  if (tabLoadingPromise) {
    await tabLoadingPromise;
  }
}

async function toggleActivePanel(block, tabPanel, idx) {
  const isActive = tabPanel.classList.contains('active');
  if (isActive) {
    // just make all panels inactive
    await updateActivePanel(block, -1);
  } else {
    await updateActivePanel(block, idx);
  }
}

function updatePanelAttributes(panel) {
  if (isDesktop.matches) {
    panel.setAttribute('aria-hidden', !panel.classList.contains('active'));
    panel.querySelector('.tabs-panel-content').removeAttribute('aria-hidden');
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', panel.dataset.labelledby);
  } else {
    panel.removeAttribute('aria-hidden');
    const panelControlButton = panel.querySelector('.tabs-panel-header button');
    if (panelControlButton) {
      panelControlButton.setAttribute('aria-expanded', panel.classList.contains('active'));
    }
    panel.removeAttribute('role');
    panel.removeAttribute('aria-labelledby');
  }
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
    const tabButton = tab.children.item(0);
    const tabPanel = tab.children.item(1) || document.createElement('div');
    const id = toClassName(tabButton.textContent);
    tabPanel.className = 'tabs-panel';
    tabPanel.id = `tabpanel-${id}`;
    block.append(tabPanel);

    const tabPanelContent = document.createElement('div');
    tabPanelContent.id = `tabpanel-${id}-content`;
    tabPanelContent.className = 'tabs-panel-content';
    const panelContentInner = document.createElement('div');
    panelContentInner.className = 'tabs-panel-content-inner';
    panelContentInner.append(...tabPanel.children);
    tabPanelContent.append(panelContentInner);
    tabPanel.append(tabPanelContent);

    const tabPanelHeader = document.createElement('div');
    tabPanelHeader.className = 'tabs-panel-header';
    tabPanel.prepend(tabPanelHeader);

    if (tabButton.querySelector('a') && (!tabPanel || !tabPanel.textContent)) {
      let buttonContent = tabButton.firstElementChild;
      // buttonContent is likely a link inside of an h2 (or similar).
      // need to reverse order so the "action" elements are the first level children of the tablist
      const link = buttonContent.firstElementChild;
      if (link.tagName === 'A') {
        const clonedLink = link.cloneNode(true);
        const linkText = clonedLink.textContent;
        const clonedH2 = buttonContent.cloneNode(false);
        clonedH2.className = 'tabs-tab-title';
        clonedH2.textContent = linkText;
        clonedLink.replaceChildren(clonedH2);
        buttonContent = clonedLink;
      }
      buttonContent.className = 'tabs-tab';
      tablist.append(buttonContent);
      tabPanel.classList.add('tabs-panel-no-content');
      tabPanelHeader.append(buttonContent.cloneNode(true));
    } else {
      // build tab button
      const button = document.createElement('button');
      button.className = 'tabs-tab';
      button.id = `tab-${id}`;
      tabButton.firstElementChild.className = 'tabs-tab-title';
      button.append(tabButton.firstElementChild);
      button.setAttribute('aria-controls', `tabpanel-${id}`);
      button.setAttribute('aria-selected', idx === 0);
      button.setAttribute('role', 'tab');
      button.setAttribute('type', 'button');
      button.addEventListener('click', () => {
        updateActivePanel(block, idx);
      });
      tablist.append(button);

      const clonedButton = button.cloneNode(true);
      clonedButton.removeAttribute('role');
      clonedButton.removeAttribute('id');
      clonedButton.removeAttribute('aria-selected');
      clonedButton.setAttribute('aria-controls', `tabpanel-${id}-content`);
      clonedButton.addEventListener('click', () => {
        toggleActivePanel(block, tabPanel, idx);
      });
      tabPanelHeader.append(clonedButton);

      tabPanel.dataset.labelledby = `tab-${id}`;
      tabPanel.dataset.status = 'initialized';
    }
    tab.remove();
  });
  block.prepend(tablist);

  isDesktop.addEventListener('change', () => {
    document.querySelectorAll('.tabs-panel').forEach(updatePanelAttributes);
    if (isDesktop.matches && !block.querySelector('.tabs-panel.active')) {
      updateActivePanel(block, 0);
    }
  });
  document.querySelectorAll('.tabs-panel').forEach(updatePanelAttributes);

  await updateActivePanel(block, 0);
}
