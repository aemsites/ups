import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

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
