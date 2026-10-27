// ============================================
// SKYCAST - WEATHER DASHBOARD
// ============================================

const form = document.querySelector('#search-form');
const input = document.querySelector('#city-input');
const button = document.querySelector('#search-button');
const status = document.querySelector('#status-message');
const dashboard = document.querySelector('#overview');
const unitButton = document.querySelector('#unit-toggle');

let fahrenheit = false;
let last = null;

// Autocomplete variables
let suggestionBox = null;
let suggestionTimer = null;
let selectedCity = null;
let activeSuggestion = -1;
let currentSuggestions = [];
let suggestionRequestId = 0;


// ============================================
// WEATHER CONDITIONS
// ============================================

const conditions = {
    0: ['Clear sky', 'sunny'],
    1: ['Mainly clear', 'sunny'],
    2: ['Partly cloudy', 'cloudy'],
    3: ['Overcast', 'cloudy'],
    45: ['Fog', 'cloudy'],
    48: ['Rime fog', 'cloudy'],
    51: ['Light drizzle', 'rain'],
    53: ['Moderate drizzle', 'rain'],
    55: ['Dense drizzle', 'rain'],
    56: ['Freezing drizzle', 'rain'],
    57: ['Dense freezing drizzle', 'rain'],
    61: ['Slight rain', 'rain'],
    63: ['Moderate rain', 'rain'],
    65: ['Heavy rain', 'rain'],
    66: ['Freezing rain', 'rain'],
    67: ['Heavy freezing rain', 'rain'],
    71: ['Light snow', 'snow'],
    73: ['Moderate snow', 'snow'],
    75: ['Heavy snow', 'snow'],
    77: ['Snow grains', 'snow'],
    80: ['Rain showers', 'rain'],
    81: ['Moderate rain showers', 'rain'],
    82: ['Heavy rain showers', 'storm'],
    85: ['Snow showers', 'snow'],
    86: ['Heavy snow showers', 'snow'],
    95: ['Thunderstorm', 'storm'],
    96: ['Thunderstorm with hail', 'storm'],
    99: ['Thunderstorm with heavy hail', 'storm']
};


// ============================================
// HELPER FUNCTIONS
// ============================================

function info(code) {
    return conditions[code] || ['Conditions unavailable', 'cloudy'];
}

function gif(code) {
    return `assets/weather-${info(code)[1]}.gif`;
}

function temp(celsius) {
    return Math.round(
        fahrenheit ? celsius * 9 / 5 + 32 : celsius
    );
}

function unit() {
    return fahrenheit ? '°F' : '°C';
}

function message(text, error = false) {
    status.textContent = text;
    status.classList.toggle('error', error);
}

async function json(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            'Weather service error. Please try again.'
        );
    }

    return response.json();
}


// ============================================
// CITY SEARCH
// ============================================

// Search for a city by name
async function locate(name) {
    const url = new URL(
        'https://geocoding-api.open-meteo.com/v1/search'
    );

    url.search = new URLSearchParams({
        name: name,
        count: '1',
        language: 'en',
        format: 'json'
    });

    const result = await json(url);

    return result.results?.[0] || null;
}


// ============================================
// LIVE CITY AUTOCOMPLETE
// ============================================

// Create the suggestions dropdown
function createSuggestionBox() {
    if (suggestionBox) return;

    suggestionBox = document.createElement('div');
    suggestionBox.id = 'city-suggestions';
    suggestionBox.setAttribute('role', 'listbox');

    Object.assign(suggestionBox.style, {
        position: 'absolute',
        top: '100%',
        left: '0',
        right: '0',
        background: '#ffffff',
        color: '#29251f',
        border: '1px solid #ded6c9',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.12)',
        overflowY: 'auto',
        maxHeight: '260px',
        zIndex: '9999',
        display: 'none'
    });

    // Position suggestions relative to the input container.
    const parent = input.parentElement;
    parent.style.position = 'relative';
    parent.appendChild(suggestionBox);
}


// Hide the suggestions
function hideSuggestions() {
    if (suggestionBox) {
        suggestionBox.style.display = 'none';
    }

    activeSuggestion = -1;
    input.removeAttribute('aria-activedescendant');
}


// Highlight the active suggestion
function highlightSuggestion() {
    if (!suggestionBox) return;

    const items = Array.from(suggestionBox.children);

    items.forEach((item, index) => {
        const isActive = index === activeSuggestion;

        item.style.background = isActive
            ? '#f3ede3'
            : '#ffffff';

        item.setAttribute(
            'aria-selected',
            String(isActive)
        );
    });

    if (activeSuggestion >= 0 && items[activeSuggestion]) {
        input.setAttribute(
            'aria-activedescendant',
            items[activeSuggestion].id
        );

        items[activeSuggestion].scrollIntoView({
            block: 'nearest'
        });
    } else {
        input.removeAttribute('aria-activedescendant');
    }
}


// Select a city from the suggestions
function selectCity(city) {
    selectedCity = city;

    input.value = city.name;

    hideSuggestions();

    message(
        `Selected ${city.name}. Press Search to load its weather.`
    );
}


// Display matching cities
function showSuggestions(cities) {
    createSuggestionBox();

    suggestionBox.replaceChildren();

    currentSuggestions = cities;
    activeSuggestion = -1;

    if (!cities.length) {
        hideSuggestions();
        return;
    }

    cities.forEach((city, index) => {
        const item = document.createElement('button');

        item.type = 'button';
        item.id = `city-suggestion-${index}`;
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', 'false');

        const locationParts = [
            city.name,
            city.admin1,
            city.country
        ].filter((value, i, array) => {
            return value && array.indexOf(value) === i;
        });

        item.textContent = locationParts.join(', ');

        Object.assign(item.style, {
            display: 'block',
            width: '100%',
            padding: '12px 15px',
            border: 'none',
            borderBottom: '1px solid #eee8df',
            background: '#ffffff',
            color: '#29251f',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: '14px',
            lineHeight: '1.5'
        });

        item.addEventListener('mouseenter', () => {
            activeSuggestion = index;
            highlightSuggestion();
        });

        item.addEventListener('focus', () => {
            activeSuggestion = index;
            highlightSuggestion();
        });

        // Prevent the input from losing focus before selection.
        item.addEventListener('mousedown', event => {
            event.preventDefault();
            selectCity(city);
        });

        // Support touchscreens and other pointer devices.
        item.addEventListener('click', () => {
            selectCity(city);
        });

        suggestionBox.appendChild(item);
    });

    suggestionBox.style.display = 'block';
}


// Fetch suggestions while the user types
async function searchCitySuggestions(query) {
    const searchTerm = query.trim();
    const requestId = ++suggestionRequestId;

    if (searchTerm.length < 2) {
        hideSuggestions();
        return;
    }

    try {
        const url = new URL(
            'https://geocoding-api.open-meteo.com/v1/search'
        );

        url.search = new URLSearchParams({
            name: searchTerm,
            count: '8',
            language: 'en',
            format: 'json'
        });

        const response = await json(url);

        // Ignore results from older requests.
        if (requestId !== suggestionRequestId) return;

        // Only show results for the current input.
        if (input.value.trim() !== searchTerm) return;

        const cities = response.results || [];

        if (cities.length === 0) {
            hideSuggestions();
            return;
        }

        showSuggestions(cities);

    } catch (error) {
        if (requestId === suggestionRequestId) {
            hideSuggestions();
        }
    }
}


// Initialize autocomplete
createSuggestionBox();

input.setAttribute('autocomplete', 'off');
input.setAttribute('role', 'combobox');
input.setAttribute('aria-autocomplete', 'list');
input.setAttribute('aria-controls', 'city-suggestions');
input.setAttribute('aria-expanded', 'false');


// Listen for typing
input.addEventListener('input', () => {
    selectedCity = null;

    clearTimeout(suggestionTimer);

    // Invalidate any previous search request.
    suggestionRequestId++;

    const query = input.value.trim();

    if (query.length < 2) {
        hideSuggestions();
        return;
    }

    suggestionTimer = setTimeout(() => {
        searchCitySuggestions(query);
    }, 300);
});


// Keyboard navigation through suggestions
input.addEventListener('keydown', event => {
    const dropdownIsOpen =
        suggestionBox &&
        suggestionBox.style.display !== 'none' &&
        currentSuggestions.length > 0;

    if (event.key === 'Escape') {
        hideSuggestions();
        return;
    }

    if (!dropdownIsOpen) return;

    if (event.key === 'ArrowDown') {
        event.preventDefault();

        activeSuggestion =
            (activeSuggestion + 1) % currentSuggestions.length;

        highlightSuggestion();
    }

    if (event.key === 'ArrowUp') {
        event.preventDefault();

        activeSuggestion =
            activeSuggestion <= 0
                ? currentSuggestions.length - 1
                : activeSuggestion - 1;

        highlightSuggestion();
    }

    if (
        event.key === 'Enter' &&
        activeSuggestion >= 0
    ) {
        event.preventDefault();

        selectCity(
            currentSuggestions[activeSuggestion]
        );
    }
});


// Close suggestions when clicking outside
document.addEventListener('click', event => {
    if (
        suggestionBox &&
        !input.contains(event.target) &&
        !suggestionBox.contains(event.target)
    ) {
        hideSuggestions();
    }
});


// ============================================
// WEATHER FORECAST API
// ============================================

async function forecast(latitude, longitude) {
    const url = new URL(
        'https://api.open-meteo.com/v1/forecast'
    );

    url.search = new URLSearchParams({
        latitude: latitude,
        longitude: longitude,

        current:
            'temperature_2m,relative_humidity_2m,' +
            'apparent_temperature,precipitation,' +
            'weather_code,wind_speed_10m,' +
            'wind_direction_10m,uv_index',

        hourly:
            'temperature_2m,precipitation_probability,' +
            'weather_code',

        daily:
            'weather_code,temperature_2m_max,' +
            'temperature_2m_min,precipitation_probability_max',

        forecast_days: '7',
        forecast_hours: '24',
        timezone: 'auto',
        temperature_unit: 'celsius',
        wind_speed_unit: 'kmh'
    });

    return json(url);
}


// ============================================
// DATE AND WEATHER HELPERS
// ============================================

function time(value) {
    return new Date(value).toLocaleTimeString(
        undefined,
        {
            hour: 'numeric',
            minute: '2-digit'
        }
    );
}

function day(date, index) {
    if (index === 0) return 'Today';

    const [year, month, dateNumber] = date
        .split('-')
        .map(Number);

    return new Date(
        year,
        month - 1,
        dateNumber
    ).toLocaleDateString(
        undefined,
        { weekday: 'long' }
    );
}

function uvText(value) {
    if (value == null) return 'UV data unavailable';

    if (value < 3) return 'Low UV exposure';
    if (value < 6) return 'Moderate UV exposure';
    if (value < 8) return 'High UV exposure';
    if (value < 11) return 'Very high UV exposure';

    return 'Extreme UV exposure';
}

function direction(degrees) {
    return [
        'N', 'NE', 'E', 'SE',
        'S', 'SW', 'W', 'NW'
    ][Math.round(degrees / 45) % 8];
}

function insight(current) {
    if (current.weather_code >= 51) {
        return 'Clouds or precipitation are expected. Consider carrying an umbrella if you head out.';
    }

    if (current.temperature_2m >= 32) {
        return 'It is a warm day. Drink water regularly and plan outdoor activities around the heat.';
    }

    if (current.wind_speed_10m >= 25) {
        return 'It is breezy right now. Keep the wind in mind when planning outdoor activities.';
    }

    if (current.uv_index >= 6) {
        return 'UV levels are elevated. Consider shade and sun protection if you are outdoors.';
    }

    return 'Conditions look relatively calm. Check the hourly outlook before making plans.';
}


// ============================================
// RENDER HOURLY FORECAST
// ============================================

function renderHourly(hourly, currentTime) {
    const list = document.querySelector('#hourly-list');

    list.replaceChildren();

    let start = hourly.time.findIndex(value => {
        return new Date(value) >= new Date(currentTime);
    });

    if (start < 0) start = 0;

    for (
        let i = start;
        i < Math.min(start + 12, hourly.time.length);
        i++
    ) {
        const card = document.createElement('article');
        card.className = 'hour-card';

        const timeLabel = document.createElement('span');
        timeLabel.className = 'hour-time';
        timeLabel.textContent =
            i === start ? 'Now' : time(hourly.time[i]);

        const image = document.createElement('img');
        image.className = 'hour-weather';
        image.src = gif(hourly.weather_code[i]);
        image.alt = info(hourly.weather_code[i])[0];

        const temperature = document.createElement('span');
        temperature.className = 'hour-temp';
        temperature.textContent =
            `${temp(hourly.temperature_2m[i])}${unit()}`;

        const rain = document.createElement('span');
        rain.className = 'hour-rain';
        rain.textContent =
            `☂ ${hourly.precipitation_probability[i] ?? 0}%`;

        card.append(
            timeLabel,
            image,
            temperature,
            rain
        );

        list.append(card);
    }
}


// ============================================
// RENDER 7-DAY FORECAST
// ============================================

function renderDays(daily) {
    const list = document.querySelector('#weekly-list');

    list.replaceChildren();

    daily.time.forEach((date, index) => {
        const row = document.createElement('div');
        row.className = 'week-row';

        const dayName = document.createElement('div');
        dayName.className = 'week-day';
        dayName.textContent = day(date, index);

        const condition = document.createElement('div');
        condition.className = 'week-condition';

        const image = document.createElement('img');
        image.src = gif(daily.weather_code[index]);
        image.alt = '';

        const description = document.createElement('span');
        description.textContent =
            info(daily.weather_code[index])[0];

        condition.append(image, description);

        const temperatures = document.createElement('div');
        temperatures.className = 'week-temps';

        const high = document.createElement('span');
        high.textContent =
            `${temp(daily.temperature_2m_max[index])}${unit()}`;

        const low = document.createElement('span');
        low.className = 'week-low';
        low.textContent =
            `${temp(daily.temperature_2m_min[index])}${unit()}`;

        temperatures.append(high, low);

        const rain = document.createElement('div');
        rain.className = 'week-rain';
        rain.textContent =
            `☂ ${daily.precipitation_probability_max?.[index] ?? 0}%`;

        row.append(
            dayName,
            condition,
            temperatures,
            rain
        );

        list.append(row);
    });
}


// ============================================
// RENDER WEATHER DASHBOARD
// ============================================

function render(city, data) {
    last = { city, data };

    const current = data.current;
    const daily = data.daily;
    const weatherInfo = info(current.weather_code);

    document.querySelector('#location-name').textContent = [
        city.name,
        city.admin1,
        city.country
    ]
        .filter((value, index, array) => {
            return value && array.indexOf(value) === index;
        })
        .join(', ');

    document.querySelector('#local-time').textContent =
        `Local time · ${time(current.time)}`;

    document.querySelector('#current-temperature').textContent =
        `${temp(current.temperature_2m)}${unit()}`;

    document.querySelector('#weather-description').textContent =
        weatherInfo[0];

    document.querySelector('#feels-like').textContent =
        `Feels like ${temp(current.apparent_temperature)}${unit()}`;

    document.querySelector('#day-summary').textContent =
        insight(current);

    document.querySelector('#today-high').textContent =
        `${temp(daily.temperature_2m_max[0])}${unit()}`;

    document.querySelector('#today-low').textContent =
        `${temp(daily.temperature_2m_min[0])}${unit()}`;

    document.querySelector('#humidity').textContent =
        `${current.relative_humidity_2m}%`;

    document.querySelector('#humidity-bar').style.width =
        `${Math.min(100, Math.max(0, current.relative_humidity_2m))}%`;

    document.querySelector('#wind-speed').textContent =
        `${Math.round(current.wind_speed_10m)} km/h`;

    document.querySelector('#wind-direction').textContent =
        `Direction ${direction(current.wind_direction_10m)} · ${Math.round(current.wind_direction_10m)}°`;

    document.querySelector('#precipitation').textContent =
        `${Number(current.precipitation).toFixed(1)} mm`;

    document.querySelector('#uv-index').textContent =
        current.uv_index == null
            ? '—'
            : Number(current.uv_index).toFixed(1);

    document.querySelector('#uv-label').textContent =
        uvText(current.uv_index);

    document.querySelector('#weather-tip').textContent =
        insight(current);

    const image = document.querySelector('#weather-animation');

    image.src = gif(current.weather_code);
    image.alt = `Animated ${weatherInfo[1]} weather illustration`;

    document.querySelector('#animation-caption').textContent =
        weatherInfo[1] === 'sunny'
            ? 'SUNLIT SKIES'
            : weatherInfo[1] === 'cloudy'
                ? 'CLOUD COVER'
                : weatherInfo[1] === 'rain'
                    ? 'RAIN IN MOTION'
                    : weatherInfo[1] === 'snow'
                        ? 'FALLING SNOW'
                        : 'STORM WATCH';

    renderHourly(data.hourly, current.time);
    renderDays(daily);

    dashboard.classList.remove('hidden');
}


// ============================================
// SEARCH FORM SUBMISSION
// ============================================

form.addEventListener('submit', async event => {
    event.preventDefault();

    const name = input.value.trim();

    if (!name) {
        message('Please enter a city name.', true);
        input.focus();
        return;
    }

    // Use the selected autocomplete result when available.
    const cityToLoad =
        selectedCity && selectedCity.name === name
            ? selectedCity
            : null;

    button.disabled = true;
    button.textContent = 'Loading…';

    hideSuggestions();

    message('Finding your location and loading forecast…');

    try {
        const city = cityToLoad || await locate(name);

        if (!city) {
            dashboard.classList.add('hidden');

            message(
                'City not found. Check the spelling and try again.',
                true
            );

            return;
        }

        const data = await forecast(
            city.latitude,
            city.longitude
        );

        if (!data.current || !data.daily || !data.hourly) {
            throw new Error(
                'Weather data was incomplete. Please try again.'
            );
        }

        render(city, data);

        // Keep the selected city for subsequent unit changes.
        selectedCity = city;

        message(`Weather loaded for ${city.name}.`);

    } catch (error) {
        dashboard.classList.add('hidden');

        message(
            error.message ||
            'Could not load weather. Check your connection and try again.',
            true
        );

    } finally {
        button.disabled = false;
        button.textContent = 'Search ↗';
    }
});


// ============================================
// CELSIUS / FAHRENHEIT TOGGLE
// ============================================

unitButton.addEventListener('click', () => {
    fahrenheit = !fahrenheit;

    unitButton.innerHTML = fahrenheit
        ? '°F <small>/ °C</small>'
        : '°C <small>/ °F</small>';

    if (last) {
        render(last.city, last.data);
    }
});
