async function populateSuggestions(ul) {
  const req = await fetch('/fragments/search-suggestions.json');
  const { data } = await req.json();
  data.forEach((suggestion) => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${suggestion.URL}">${suggestion.name}</a>`;
    ul.append(li);
  });
}

function registerEventListeners(doc) {
  const search = doc.getElementById('search-modal');
  const suggestions = search.querySelector('.tools-search-suggestions ul');

  search.addEventListener('submit', (e) => {
    e.preventDefault();
    const { value } = [...search.elements][0];
    if (value && value.trim() !== '') {
      window.location.href = `https://www.ups.com/us/en/SearchResults.page?q=${encodeURIComponent(value)}`;
    }
  });

  populateSuggestions(suggestions);
}

registerEventListeners(document);
