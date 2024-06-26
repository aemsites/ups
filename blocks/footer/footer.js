import { getMetadata, toClassName } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const isDesktop = window.matchMedia('(width >= 900px)');

function toggleNavSection(navDrop, expanded) {
  const navControlButton = navDrop.querySelector(':scope > button');
  navControlButton.setAttribute('aria-expanded', expanded);
}

function toggleAllNavSections(navSectionContainer, expanded = false) {
  navSectionContainer.querySelectorAll('li.collapsible').forEach((navSection) => {
    toggleNavSection(navSection, expanded);
  });
}

function decorateFooterNav(block, footerNavList) {
  footerNavList.classList.add('nav-list');
  footerNavList.querySelectorAll(':scope > li').forEach((liEl, idx) => {
    const subList = liEl.querySelector(':scope > ul');
    if (subList) {
      liEl.classList.add('collapsible');
      const textNodes = [...liEl.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE);
      const liText = textNodes.map((text) => text.textContent).join('').trim();
      const dropButton = document.createElement('button');
      const sublistId = `sublist-${toClassName(liText)}-${idx}`;
      dropButton.textContent = liText;
      [
        { attr: 'type', value: 'button' },
        { attr: 'aria-expanded', value: 'false' },
        { attr: 'aria-controls', value: sublistId },
      ].forEach(({ attr, value }) => {
        dropButton.setAttribute(attr, value);
      });
      liEl.prepend(dropButton);
      textNodes.forEach((text) => text.remove());
      subList.setAttribute('id', sublistId);
      dropButton.addEventListener('click', () => {
        if (!isDesktop.matches) {
          const expanded = dropButton.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(block, false);
          toggleNavSection(liEl, !expanded);
        }
      });
    }
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  footer.querySelectorAll('.section > .default-content-wrapper > ul').forEach((ul) => {
    decorateFooterNav(block, ul);
    toggleAllNavSections(ul, isDesktop.matches);
  });

  isDesktop.addEventListener('change', () => {
    toggleAllNavSections(block, isDesktop.matches);
  });

  // decorate icons
  const icons = footer.querySelectorAll('.icon img[src]');
  icons.forEach(async (icon) => {
    const resp = await fetch(icon.src);
    const temp = document.createElement('div');
    temp.innerHTML = await resp.text();
    const svg = temp.querySelector('svg');
    icon.replaceWith(svg);
  });

  block.append(footer);
}
