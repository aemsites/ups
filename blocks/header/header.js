import { getMetadata, loadCSS, loadScript } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates desktop width
const isDesktop = window.matchMedia('(width >= 1200px)');

function toggleHeader(desktop, nav, hamburger) {
  const hamburgerWrapper = hamburger.closest('div');
  const controls = hamburger.getAttribute('aria-controls').split(' ');
  const toggleControls = (ids, status) => {
    ids.forEach((id) => {
      const control = nav.querySelector(`#${id}`);
      if (control) control.setAttribute('aria-hidden', status);
    });
  };

  if (desktop) {
    nav.dataset.expanded = true;
    hamburgerWrapper.setAttribute('aria-hidden', true);
    toggleControls(controls, false);
  } else {
    document.body.removeAttribute('data-scroll');
    document.getElementById('nav-backdrop').setAttribute('aria-hidden', true);
    nav.dataset.expanded = false;
    hamburgerWrapper.setAttribute('aria-hidden', false);
    toggleControls(controls, true);
  }
}

function toggleHamburger(hamburger, nav) {
  const expanded = hamburger.getAttribute('aria-expanded') === 'true';
  hamburger.setAttribute('aria-expanded', !expanded);
  const controls = hamburger.getAttribute('aria-controls').split(' ');
  controls.forEach((id) => {
    const control = document.getElementById(id);
    if (control) control.setAttribute('aria-hidden', expanded);
  });
  nav.dataset.expanded = !expanded;
  if (!expanded) document.body.dataset.scroll = 'disabled';
  else document.body.removeAttribute('data-scroll');
}

function buildButton(id) {
  const button = document.createElement('button');
  button.setAttribute('type', 'button');
  button.id = id;
  return button;
}

function buildSymbol(name) {
  const icon = document.createElement('i');
  icon.className = `symbol symbol-${name}`;
  return icon;
}

function wrapAnchorText(a) {
  const icon = a.querySelector('span.icon');
  const text = a.textContent.trim();
  a.innerHTML = `${icon.outerHTML}<span class="text">${text}</span>`;
}

// function openLocator(e) {
//   // location locator functionality
// }

async function buildSearch(wrapper, button) {
  // decorate search button
  const close = buildSymbol('close');
  button.append(close);
  button.setAttribute('aria-controls', 'search-modal');
  // build search form
  const searchPath = '/blocks/header/search';
  const resp = await fetch(`${searchPath}/index.html`);
  const search = document.createElement('form');
  search.id = 'search-modal';
  search.innerHTML = await resp.text();
  await loadCSS(`${searchPath}/styles.css`);
  wrapper.append(search);
  await loadScript(`${searchPath}/scripts.js`, { type: 'module' });
  return search;
}

async function toggleSearch(e) {
  const button = e.target.closest('button');
  let search = document.getElementById('search-modal');
  if (!search) search = await buildSearch(e.target.closest('li'), button);
  const expanded = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', !expanded);
  if (!expanded) search.querySelector('input[type="search"]').focus();
}

function toggleLanguagePicker(e) {
  const button = e.srcElement;
  const expanded = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', !expanded);
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('section');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools', 'location-finder', 'language-picker', 'alert', 'support'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) {
      section.id = `nav-${c}`;
      section.classList.add(`nav-${c}`);
    }
  });

  // build desktop backdrop
  const backdrop = document.createElement('div');
  backdrop.id = 'nav-backdrop';
  backdrop.className = 'nav-backdrop';
  backdrop.setAttribute('aria-hidden', true);
  block.append(backdrop);

  // decorate brand
  const brand = nav.querySelector('.nav-brand');
  if (brand) {
    const a = brand.querySelector('a[href]');
    if (!a) {
      const content = brand.querySelector('h1, h2, h3, h4, h5, h6, p');
      content.className = 'brand-content';
      if (content) {
        const link = document.createElement('a');
        if (!content.textContent) link.setAttribute('title', 'UPS Home');
        link.href = '/';
        link.innerHTML = content.innerHTML;
        content.innerHTML = link.outerHTML;
      }
    }
  }

  // decorate sections
  const sections = nav.querySelector('.nav-sections');
  if (sections) {
    const wrapper = document.createElement('nav');
    const ul = sections.querySelector('ul');
    const clone = ul.cloneNode(true);
    wrapper.append(clone);
    [...clone.children].forEach((li, i) => {
      const subsection = li.querySelector('ul');
      if (subsection) {
        li.className = 'subsection';
        li.dataset.expanded = false;
        subsection.id = `subsection-${i + 1}`;
        subsection.setAttribute('role', 'menu');
        [...subsection.children].forEach((subli) => {
          subli.setAttribute('role', 'menuitem');
          const a = subli.querySelector('a');
          if (a) {
            a.innerHTML = `<span>${a.innerHTML}</span>`;
            const chevron = buildSymbol('chevron');
            a.append(chevron);
          }
        });
        const label = li.textContent.replace(subsection.textContent, '').trim();
        subsection.dataset.label = label;
        const button = document.createElement('button');
        button.setAttribute('type', 'button');
        button.setAttribute('aria-haspopup', true);
        button.setAttribute('aria-expanded', false);
        button.setAttribute('aria-controls', `subsection-${i + 1}`);
        button.textContent = label;
        button.addEventListener('click', () => {
          const expanded = button.getAttribute('aria-expanded') === 'true';
          wrapper.querySelectorAll('[aria-expanded="true"]').forEach((ex) => ex.setAttribute('aria-expanded', false));
          button.setAttribute('aria-expanded', !expanded);
          li.dataset.expanded = !expanded;
          if (isDesktop.matches) {
            if (!expanded) {
              document.body.dataset.scroll = 'disabled';
              backdrop.setAttribute('aria-hidden', false);
            } else {
              document.body.removeAttribute('data-scroll');
              backdrop.setAttribute('aria-hidden', true);
            }
          }
        });
        const chevron = buildSymbol('chevron');
        button.append(chevron);
        li.innerHTML = '';
        li.prepend(button, subsection);
      }
    });
    ul.replaceWith(wrapper);
  }

  // decorate tools
  const tools = nav.querySelector('.nav-tools');
  if (tools) {
    const a = tools.querySelector('a');
    if (a) {
      wrapAnchorText(a);
      const chevron = buildSymbol('chevron');
      a.append(chevron);
      a.className = 'button';
      a.setAttribute('aria-label', a.textContent.trim());
      a.parentElement.className = 'button-wrapper';
    }
    const search = tools.querySelector('span.icon.icon-search');
    if (search) {
      const wrapper = search.parentElement;
      const button = buildButton('search');
      button.setAttribute('aria-label', 'Search');
      button.append(search);
      button.addEventListener('click', toggleSearch);
      wrapper.innerHTML = '';
      wrapper.append(button);
    }
  }

  // decorate location finder
  const location = nav.querySelector('.nav-location-finder');
  if (location && location.querySelector('p')) {
    const button = buildButton('location-finder');
    button.innerHTML = location.querySelector('p').innerHTML;
    wrapAnchorText(button);
    const chevron = buildSymbol('chevron');
    button.append(chevron);
    // button.addEventListener('click', openLocator);
    location.innerHTML = '';
    location.append(button);
  }

  // decorate language picker
  const language = nav.querySelector('.nav-language-picker');
  if (language && language.querySelector('ul, ol')) {
    const list = language.querySelector('ul, ol');
    const current = list.querySelector('strong');
    // decorate button
    const button = buildButton('language-picker');
    button.setAttribute('aria-expanded', false);
    button.textContent = current.textContent;
    const chevron = buildSymbol('chevron');
    button.append(chevron);
    button.addEventListener('click', toggleLanguagePicker);
    list.parentElement.insertBefore(button, list);
    // decorate list
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-labelledby', 'language-picker');
    [...list.children].forEach((li) => {
      li.setAttribute('role', 'option');
    });
  }

  // decorate alert
  const alert = nav.querySelector('.nav-alert');
  if (alert && alert.querySelector('a')) {
    const a = alert.querySelector('a');
    a.removeAttribute('class');
    wrapAnchorText(a);
    alert.innerHTML = '';
    alert.append(a);
  }

  // build mobile hamburger
  const hamburgerWrapper = document.createElement('div');
  hamburgerWrapper.className = 'nav-hamburger';
  const hamburgerButton = document.createElement('button');
  hamburgerButton.setAttribute('type', 'button');
  hamburgerButton.setAttribute('aria-controls', 'nav-sections nav-language nav-support');
  hamburgerButton.setAttribute('aria-expanded', false);
  hamburgerButton.setAttribute('aria-label', 'Open navigation');
  const hamburger = document.createElement('i');
  hamburger.className = 'symbol symbol-hamburger';
  hamburgerButton.append(hamburger);
  hamburgerButton.addEventListener('click', () => toggleHamburger(hamburgerButton, nav));
  hamburgerWrapper.append(hamburgerButton);
  nav.prepend(hamburgerWrapper);

  toggleHeader(isDesktop.matches, nav, hamburgerButton);
  isDesktop.addEventListener('change', (e) => toggleHeader(e.matches, nav, hamburgerButton));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.prepend(navWrapper);
}
