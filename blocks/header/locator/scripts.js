import { fetchPlaceholders } from '../../../scripts/aem.js';

const MAP_URL = 'https://www.bing.com/api/v6/Places/AutoSuggest?';

/**
 * Constructs URL for autofill request.
 * @param {string} param - Search parameter
 * @returns {Promise<string>} Promise that resolves to constructed URL string
 */
async function writeAutofillRequest(param) {
  // fetch placeholders id from placeholders
  const ph = await fetchPlaceholders();
  const { bingAppId } = ph;
  // write URL and remove whitespace characters
  return `${MAP_URL}q=${encodeURIComponent(param)}
    &appid=${bingAppId}
    &count=4
    &constraints=country:US
    &types=place,address
    &structuredaddress=true`.replace(/\s+/g, '');
}

/**
 * Splits an address string at the first comma.
 * @param {string} address - Address string
 * @returns {string[]} Array containing the address split at the first comma
 * (If no comma found, returns an array with the original address as the only element.)
 */
function splitAddress(address) {
  const index = address.indexOf(',');
  if (index < 0) return [address];
  const beforeComma = address.substring(0, index).trim();
  const afterComma = address.substring(index + 1).trim();
  return [beforeComma, afterComma];
}

/**
 * Populates an autosuggest result wrapper with lines of text.
 * @param {HTMLElement} wrapper - DOM element that will contain the autosuggest results
 * @param {string[]} lines - Array of strings to be added in the wrapper
 */
function populateAutosuggestResult(wrapper, lines) {
  lines.forEach((line) => {
    const span = document.createElement('span');
    span.textContent = line;
    wrapper.append(span);
  });
}

/**
 * Formats the result object.
 * @param {Object} result - Result object
 * @returns {string} Formatted result string
 */
function formatResult(result) {
  // helper to format the address by appending the country if it's not already included
  const formatAddress = (text, country) => {
    if (country && !text.includes(country)) {
      return `${text}, ${country}`;
    }
    return text;
  };

  // eslint-disable-next-line no-underscore-dangle
  if (result._type === 'PostalAddress') {
    const { text, addressCountry } = result;
    return formatAddress(text, addressCountry);
  }
  // eslint-disable-next-line no-underscore-dangle
  if (result._type === 'Place') {
    const { name, address } = result;
    const { text, addressCountry } = address;
    if (name) {
      return `${name}, ${formatAddress(text, addressCountry)}`;
    }
    return formatAddress(text, addressCountry);
  }
  // return an empty string if the result type is not recognized
  return '';
}

/**
 * Populates the autosuggest dropdown with formatted data.
 * @param {Object} data - Data object containing the values for the autosuggest
 * @param {HTMLElement} autosuggest - Element representing the autosuggest dropdown
 */
function populateAutosuggest(data, autosuggest) {
  const lis = autosuggest.querySelectorAll('li:not([class])');
  if (data.value.length) {
    autosuggest.style.display = 'block';
    lis.forEach((li, i) => {
      // clear previous result content
      const button = li.querySelector('button');
      button.removeAttribute('data-value');
      button.removeAttribute('id');
      button.disabled = true;
      const p = button.querySelector('p');
      p.textContent = '';
      if (data.value[i]) {
        const result = data.value[i];
        // populate the result content
        button.id = result.id;
        const address = formatResult(result);
        if (address) {
          autosuggest.style.display = 'block';
          populateAutosuggestResult(p, splitAddress(address));
          button.dataset.value = address;
          button.disabled = false;
          li.setAttribute('aria-hidden', false);
        } else {
          // if result has no address, hide the <li> element
          li.setAttribute('aria-hidden', true);
        }
      } else {
        // if there is no nth result, hide the <li> element
        li.setAttribute('aria-hidden', true);
      }
    });
  } else {
    // if there are no values in the data, hide the autosuggest dropdown
    autosuggest.style.display = 'none';
  }
}

function registerEventListeners(doc) {
  const locator = doc.getElementById('locator-modal');

  // enable form close button
  const closeButton = locator.querySelector('button#locator-close');
  closeButton.addEventListener('click', () => {
    locator.setAttribute('aria-hidden', true);
    document.body.dataset.removeAttribute('data-scroll');
  });

  // initialize form
  const form = locator.querySelector('form');
  const search = form.querySelector('input[type="search"]');
  const autosuggest = form.querySelector('#locator-autosuggest');

  // enable filter button toggle
  const filterButton = form.querySelector('button#locator-filter');
  filterButton.addEventListener('click', () => {
    const expanded = filterButton.getAttribute('aria-expanded') === 'true';
    filterButton.setAttribute('aria-expanded', !expanded);
  });

  // enable form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    filterButton.setAttribute('aria-expanded', false);
  });

  // enable autosuggest for search
  search.addEventListener('keyup', async () => {
    const { value } = search;
    const url = await writeAutofillRequest(value);
    const req = await fetch(url);
    const res = await req.json();
    populateAutosuggest(res, autosuggest);
  });

  // enable each button in the autosuggest dropdown
  autosuggest.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      const { value } = button.dataset;
      search.value = value.trim();
      autosuggest.style.display = 'none';
    });
  });

  // hide autosuggest dropdown after search input loses focus
  search.addEventListener('blur', () => {
    setTimeout(() => {
      autosuggest.style.display = 'none';
    }, 200);
  });

  // display autosuggest dropdown when search input is focused
  search.addEventListener('focus', () => {
    const visible = autosuggest.querySelector('li[aria-hidden="false"]');
    if (visible) autosuggest.style.display = 'block';
    filterButton.setAttribute('aria-expanded', false);
  });

  // enable current location button
  const currentLocationButton = form.querySelector('button#locator-current-location');
  currentLocationButton.addEventListener('click', () => {
    search.value = 'Your Current Location';
    filterButton.setAttribute('aria-expanded', false);
  });

  // enable clear search button
  const clearButton = form.querySelector('button#locator-clear');
  clearButton.addEventListener('click', () => {
    search.value = '';
    autosuggest.style.display = 'none';
    autosuggest.querySelectorAll('li:not([class])').forEach((li) => {
      const button = li.querySelector('button');
      button.removeAttribute('data-value');
      button.removeAttribute('id');
      const p = button.querySelector('p');
      p.textContent = '';
      li.setAttribute('aria-hidden', true);
    });
    search.focus();
  });

  // enable search filters
  const filters = form.querySelectorAll('ul li input:not([id])');
  const allFilter = form.querySelector('ul li input#all-locations');
  filters.forEach((filter) => {
    filter.addEventListener('change', () => {
      const checked = [...filters].filter((f) => f.checked);
      allFilter.checked = checked.length === filters.length;
    });
  });
  allFilter.addEventListener('change', () => {
    const checked = allFilter.checked === true;
    filters.forEach((filter) => {
      filter.checked = checked;
    });
  });
}

registerEventListeners(document);
