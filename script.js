const API_KEY = "dfb87daf459dbf1de719aff024d36421"; // Your API Key
let liveLocationSet = false;  // Flag to ensure live location doesn't change after city is entered

// Initialize Map
const map = L.map('map').setView([20, 78], 5); // Default India view
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);


// Initialize Chart.js
const aqiCtx = document.getElementById('aqiChart').getContext('2d');
const humidityCtx = document.getElementById('humidityChart').getContext('2d');

const aqiChart = new Chart(aqiCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label:  'AQI Level',
            data: [],
            borderColor: 'rgba(0, 255, 26, 0.3)',
            backgroundColor: 'rgba(0, 255, 26, 0.3)',
            fill: true
        }]
    }
});

const humidityChart = new Chart(humidityCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Humidity (%)',
            data: [],
            borderColor: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.3)',
            fill: true
        }]
    }
});













// Function to fetch coordinates from city name
async function getCoordinates(city) {
    const geoURL = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`;
    try {
        const response = await fetch(geoURL);
        if (!response.ok) throw new Error("City not found!");
        const data = await response.json();
        if (data.length === 0) throw new Error("City not found!");

        const { lat, lon } = data[0];
        getWeatherData(lat, lon, city);
        map.setView([lat, lon], 10); // Move map
    } catch (error) {
        console.error(error);
        updateUIError("Invalid city name.");
    }
}


// Function to fetch city name from coordinates
async function getCityName(lat, lon) {
    const reverseGeoURL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;
    try {
        const response = await fetch(reverseGeoURL);
        if (!response.ok) throw new Error("Location not found!");
        const data = await response.json();
        if (data.length === 0) throw new Error("Location not found!");
        return data[0].name;
    } catch (error) {
        console.error(error);
        return "Unknown Location";
    }
}















// Function to fetch Air Quality & Weather data
async function getWeatherData(lat, lon, city) {
    const airURL = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    const weatherURL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;









    
    try {
        const [airResponse, weatherResponse] = await Promise.all([fetch(airURL), fetch(weatherURL)]);
        if (!airResponse.ok || !weatherResponse.ok) throw new Error("Failed to fetch data.");

        const airData = await airResponse.json();
        const weatherData = await weatherResponse.json();

        const aqi = airData.list[0].main.aqi; 
        const components = airData.list[0].components;
        const temp = weatherData.main.temp;
        const humidity = weatherData.main.humidity;
        const weatherCondition = weatherData.weather[0].description;
        const windSpeed = weatherData.wind.speed;
        const pressure = weatherData.main.pressure;
        const uvIndex = Math.floor(Math.random() * 11); // Simulated UV Index
        const sunrise = new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString();
        const sunset = new Date(weatherData.sys.sunset * 1000).toLocaleTimeString();
    
        updateUI(city, aqi,components, temp, humidity, weatherCondition, windSpeed, pressure, uvIndex, sunrise, sunset);
          // Add Marker
          L.marker([lat, lon]).addTo(map)
          .bindPopup(`<b>${city}</b><br>AQI: ${aqi} - ${status}`)
          .openPopup();
          updateGraphs(aqi, humidity);
    } catch (error) {
        console.error(error);
        updateUIError("Could not fetch data.");
    }
}


// Function to update Graphs
function updateGraphs(aqi, humidity) {
    aqiChart.data.labels.push(new Date().toLocaleTimeString());
    aqiChart.data.datasets[0].data.push(aqi);
    aqiChart.update();

    humidityChart.data.labels.push(new Date().toLocaleTimeString());
    humidityChart.data.datasets[0].data.push(humidity);
    humidityChart.update();
}







// Update Weather Condition UI
function updateWeatherUI(condition) {
    document.getElementById("weather-condition").innerText = `Condition: ${condition}`;
}

// Handle Errors in UI
function updateUIError(message) {
    document.getElementById("weather-condition").innerText = message;
}







// Function to update UI with fetched data
function updateUI(city, aqi, components, temp, humidity,weatherCondition, windSpeed, pressure, uvIndex, sunrise, sunset) {
    const { status, color } = getAQIStatus(aqi);

    document.getElementById("location").innerText = `📍 ${city}`;
    document.getElementById("aqi").innerText = aqi;
    document.getElementById("aqi-status").innerText = status;
    document.getElementById("aqi-status").style.color = color;
    document.getElementById("oxygen").innerText = `O₂: ${components.o3} µg/m³`;
    document.getElementById("nitrogen").innerText = `NO₂: ${components.no2} µg/m³`;
    document.getElementById("pm10").innerText = `PM10: ${components.pm10} µg/m³`;
    document.getElementById("pm2_5").innerText = `PM2.5: ${components.pm2_5} µg/m³`;
    document.getElementById("temperature").innerText = `🌡️ Temperature: ${temp}°C`;
    document.getElementById("humidity").innerText = `💧 Humidity: ${humidity}%`;
    document.getElementById("weather-condition").innerText = `🌧️🌈 Condition: ${weatherCondition}`;
    document.getElementById("wind").innerText = `🌬️ Wind Speed: ${windSpeed} kph`;
    document.getElementById("pressure").innerText = `🌡️ Pressure: ${pressure} mBar`;
    document.getElementById("uv-index").innerText = `☀️ UV Index: ${uvIndex} (Approx.)`;


}


// Event listener for user input
document.getElementById("searchBtn").addEventListener("click", () => {
    const city = document.getElementById("cityInput").value.trim();
    if (city) getCoordinates(city);
});

// Function to update live location and AQI on the right side
async function updateLiveLocation(lat, lon) {
    const airURL = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    const geoURL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;

    try {
        const airResponse = await fetch(airURL);
        const geoResponse = await fetch(geoURL);
        
        const airData = await airResponse.json();
        const geoData = await geoResponse.json();

        const aqi = airData.list[0].main.aqi;
        const cityName = geoData.length > 0 ? geoData[0].name : "Unknown City";
        
        const { status, color } = getAQIStatus(aqi);

        document.getElementById("live-location").innerText = `Live Location: ${cityName} (${lat.toFixed(2)}, ${lon.toFixed(2)})`;
        document.getElementById("live-aqi").innerText = `AQI: ${aqi}`;
        document.getElementById("live-aqi-status").innerText = status;
        document.getElementById("live-aqi-status").style.color = color;
    } catch (error) {
        console.error("Error fetching live location data:", error);
    }
}

// Function to determine air quality health status
function getAQIStatus(aqi) {
    if (aqi === 1) return { status: "Good 😊", color: "green" };
    if (aqi === 2) return { status: "Fair 🙂", color: "yellow" };
    if (aqi === 3) return { status: "Moderate 😐", color: "orange" };
    if (aqi === 4) return { status: "Poor 😷", color: "red" };
    return { status: "Very Poor ☠️", color: "purple" };
}

// Function to handle errors in UI
function updateUIError(message) {
    document.getElementById("location").innerText = "⚠ Error";
    document.getElementById("aqi").innerText = "--";
    document.getElementById("aqi-status").innerText = message;
    document.getElementById("temperature").innerText = "--";
    document.getElementById("humidity").innerText = "--";
    document.getElementById("wind").innerText = "--";
    document.getElementById("pressure").innerText = "--";
    document.getElementById("uv-index").innerText = "--";
    document.getElementById("sunrise").innerText = "--";
    document.getElementById("sunset").innerText = "--";
    document.getElementById("oxygen").innerText = "--";
    document.getElementById("nitrogen").innerText = "--";
    document.getElementById("pm10").innerText = "--";
    document.getElementById("pm2_5").innerText = "--";
}

// Event listener for user input
document.getElementById("searchBtn").addEventListener("click", () => {
    const city = document.getElementById("cityInput").value.trim();
    if (city) getCoordinates(city);
});
   









//kajs
// Function to get the live location
function getLiveLocation() {
    if (navigator.geolocation && !liveLocationSet) {  // Only update live location once
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude} = position.coords;
            updateLiveLocation(latitude, longitude);
            liveLocationSet = true;  // Mark live location as set
        }, (error) => {
            console.error(error);
        });
    } else {
        console.log("Live location already set, won't update after city search.");
    }
}

// Map Click Event
map.on('click', async function(e) {
    const { lat, lng } = e.latlng;
    const cityName = await getCityName(lat, lng);
    getWeatherData(lat, lng, cityName);
    L.marker([lat, lng]).addTo(map).bindPopup(`${cityName}<br>AQI: --`).openPopup();
});

// Call the live location function when the page loads
getLiveLocation();




