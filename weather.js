async function getWeather(latitude, longitude) {
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`
        );
        const data = await response.json();
        return data.current;
    } catch (error) {
        console.error('Error fetching weather:', error);
        return null;
    }
}

function displayWeather(elementId, weatherData) {
    const element = document.getElementById(elementId);
    if (!weatherData) {
        element.querySelector('.weather-info').innerHTML = 'Failed to load weather data';
        return;
    }

    const html = `
        <p>Temperature: ${weatherData.temperature_2m}°C</p>
        <p>Humidity: ${weatherData.relative_humidity_2m}%</p>
        <p>Wind Speed: ${weatherData.wind_speed_10m} km/h</p>
        <p class="update-time">Last updated: ${new Date().toLocaleTimeString()}</p>
    `;

    element.querySelector('.weather-info').innerHTML = html;
}

async function updateWeather() {
    // Default to London when page loads
    const londonWeather = await getWeather(51.5074, -0.1278);
    displayWeather('default-weather', londonWeather);
}

// Update weather immediately and then every 5 minutes
updateWeather();
setInterval(updateWeather, 5 * 60 * 1000);

async function geocodeCity(cityName) {
    try {
        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=5&language=en&format=json`
        );
        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
            throw new Error('City not found');
        }
        
        return data.results.map(city => ({
            name: city.name,
            country: city.country,
            latitude: city.latitude,
            longitude: city.longitude,
            admin1: city.admin1 // State/Province/Region
        }));
    } catch (error) {
        console.error('Error geocoding city:', error);
        throw error;
    }
}

function showSearchResults(cities) {
    const weatherContainer = document.querySelector('.weather-container');
    weatherContainer.innerHTML = `
        <div class="search-results-list">
            <h3>Select a city:</h3>
            <div class="city-list">
                ${cities.map(city => `
                    <button class="city-option" 
                            onclick="selectCity(${city.latitude}, ${city.longitude}, '${city.name}', '${city.country}', '${city.admin1 || ''}')">
                        ${city.name}${city.admin1 ? `, ${city.admin1}` : ''}, ${city.country}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

async function searchCity() {
    const searchInput = document.getElementById('citySearch');
    const searchResults = document.getElementById('search-results');
    const cityName = searchInput.value.trim();
    
    if (!cityName) return;

    try {
        // Clear previous error messages
        const existingError = document.querySelector('.error-message');
        if (existingError) existingError.remove();

        const cities = await geocodeCity(cityName);
        showSearchResults(cities);

    } catch (error) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = 'City not found. Please try again.';
        searchResults.innerHTML = '';
        searchResults.appendChild(errorDiv);
    }
}

async function selectCity(latitude, longitude, name, country, admin1) {
    const weatherContainer = document.querySelector('.weather-container');
    const weatherCardId = 'default-weather';
    
    weatherContainer.innerHTML = `
        <div class="weather-card" id="${weatherCardId}">
            <h2>${name}${admin1 ? `, ${admin1}` : ''}, ${country}</h2>
            <div class="weather-info">Loading...</div>
        </div>
    `;

    // Get and display weather for the selected city
    const weatherData = await getWeather(latitude, longitude);
    displayWeather(weatherCardId, weatherData);
    
    // Clear the search input
    document.getElementById('citySearch').value = '';
}

// Add event listener for Enter key
document.getElementById('citySearch').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        searchCity();
    }
}); 