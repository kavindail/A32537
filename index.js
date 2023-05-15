const PAGE_SIZE = 10;
let currentPage = 1;
let pokemons = [];

const paginationElement = document.getElementById('pagination');
const pokemonElement = document.getElementById('pokemon');
const displayInfoElement = document.getElementById('displayInfo');

const updatePaginationDiv = (currentPage, numPages) => {
  paginationElement.innerHTML = '';

  if (currentPage > 1) {
    paginationElement.insertAdjacentHTML('beforeend', `
      <li class="page-item">
        <button class="page-link previousButton" value="${currentPage - 1}">Previous</button>
      </li>
    `);
  }

  const startPage = currentPage === 1 ? 1 : Math.max(1, currentPage - 2);
  const endPage = Math.min(numPages, startPage + 4);

  for (let i = startPage; i <= endPage; i++) {
    paginationElement.insertAdjacentHTML('beforeend', `
      <li class="page-item${i === currentPage ? ' active' : ''}">
        <button class="page-link numberedButtons" value="${i}">${i}</button>
      </li>
    `);
  }

  if (currentPage < numPages) {
    paginationElement.insertAdjacentHTML('beforeend', `
      <li class="page-item">
        <button class="page-link nextButton" value="${currentPage + 1}">Next</button>
      </li>
    `);
  }
};

const updateDisplayInfo = (total, displayed) => {
  displayInfoElement.textContent = `Total Pokémon: ${total} | Displayed Pokémon: ${displayed}`;
};

const paginate = async (currentPage, pageSize, data) => {
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const selectedData = data.slice(startIndex, endIndex);

  pokemonElement.innerHTML = '';

  for (const item of selectedData) {
    const res = await axios.get(item.url);

    const divElement = document.createElement('div');
    divElement.classList.add('pokeCard', 'card');
    divElement.setAttribute('pokeName', res.data.name);
    divElement.innerHTML = `
      <h3>${res.data.name.toUpperCase()}</h3>
      <img src="${res.data.sprites.front_default}" alt="${res.data.name}"/>
      <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#pokeModal">
        More
      </button>
    `;

    pokemonElement.appendChild(divElement);
  }

  updateDisplayInfo(data.length, selectedData.length);
};

const fetchPokemonTypes = async () => {
  const response = await axios.get('https://pokeapi.co/api/v2/type');
  const types = response.data.results;

  const typesCheckboxes = types
    .map(type => `
      <div class="form-check form-check-inline">
        <input class="form-check-input typeCheckbox" type="checkbox" value="${type.name}" id="${type.name}">
        <label class="form-check-label" for="${type.name}">${type.name}</label>
      </div>
    `)
    .join('');

  document.getElementById('typeFilter').innerHTML = typesCheckboxes;
};

const pokemonTypeCache = new Map();

const fetchPokemonDetails = async (pokemon) => {
  if (pokemonTypeCache.has(pokemon.name)) {
    return pokemonTypeCache.get(pokemon.name);
  }

  try {
    const res = await axios.get(pokemon.url);
    const types = res.data.types.map(type => type.type.name);
    pokemon TypeCache.set(pokemon.name, types);
    return types;
  } catch (error) {
    console.error('Error', error);
    return [];
  }
};

const filterPokemons = async (selectedTypes) => {
  const filteredPokemons = [];
  
  for (const pokemon of pokemons) {
    const types = await fetchPokemonDetails(pokemon);
    if (selectedTypes.length === 0 || selectedTypes.every(type => types.includes(type))) {
      filteredPokemons.push(pokemon);
    }
  }

  paginate(currentPage, PAGE_SIZE, filteredPokemons);
  const numPages = Math.ceil(filteredPokemons.length / PAGE_SIZE);
  updatePaginationDiv(currentPage, numPages);
};

const setup = async () => {
  pokemonElement.innerHTML = '';
  const response = await axios.get('https://pokeapi.co/api/v2/pokemon?offset=0&limit=810');
  pokemons = response.data.results;

  await fetchPokemonTypes();

  document.body.addEventListener('click', async (e) => {
    if (e.target.classList.contains('pokeCard')) {
      const pokemonName = e.target.getAttribute('pokeName');
      const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
      const types = res.data.types.map(type => type.type.name);

      const modalBodyElement = document.querySelector('.modal-body');
      modalBodyElement.innerHTML = `
        <div style="width:200px">
          <img src="${res.data.sprites.other['official-artwork'].front_default}" alt="${res.data.name}"/>
          <div>
            <h3>Abilities</h3>
            <ul>
              ${res.data.abilities.map(ability => `<li>${ability.ability.name}</li>`).join('')}
            </ul>
          </div>
          <div>
            <h3>Stats</h3>
            <ul>
              ${res.data.stats.map(stat => `<li>${stat.stat.name}: ${stat.base_stat}</li>`).join('')}
            </ul>
          </div>
        </div>
        <h3>Types</h3>
        <ul>
          ${types.map(type => `<li>${type}</li>`).join('')}
        </ul>
      `;

      const modalTitleElement = document.querySelector('.modal-title');
      modalTitleElement.innerHTML = `
        <h2>${res.data.name.toUpperCase()}</h2>
        <h5>${res.data.id}</h5>
      `;
    }
  });

  document.body.addEventListener('change', async () => {
    const selectedTypes = Array.from(document.querySelectorAll('.typeCheckbox:checked')).map(checkbox => checkbox.value);
    await filterPokemons(selectedTypes);
  });

  document.body.addEventListener('click', async (e) => {
    if (e.target.classList.contains('numberedButtons') || e.target.classList.contains('previousButton') || e.target.classList.contains('nextButton')) {
      currentPage = Number(e.target.value);
      const selectedTypes = Array.from(document.querySelectorAll('.typeCheckbox:checked')).map(checkbox => checkbox.value);
      await filterPokemons(selectedTypes);
    }
  });

  const numPages = Math.ceil(pokemons.length / PAGE_SIZE);
  paginate(currentPage, PAGE_SIZE, pokemons);
  updatePaginationDiv(currentPage, numPages);
};

document.addEventListener('DOMContentLoaded', setup);
