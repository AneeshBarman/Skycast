# SkyCast Pro Weather Dashboard

Responsive weather dashboard built with HTML, CSS, vanilla JavaScript, Open-Meteo APIs, and five original animated GIF illustrations.

## Features
- City search and geocoding
- Current temperature, feels-like temperature, humidity, wind speed/direction, precipitation and UV index
- Next 12 hours and seven-day forecast
- Celsius/Fahrenheit toggle
- Weather-condition-specific animated GIFs (sunny, cloudy, rain, snow, storm)
- Responsive desktop/mobile layout and API error states

## Run locally
1. Extract the project ZIP and open the folder in VS Code.
2. Open `index.html` using Live Server, or try opening it in a browser.
3. Search for a city. Internet access is required for the live API calls.

## Files
- `index.html`: page structure
- `style.css`: dashboard styling and responsive breakpoints
- `script.js`: geocoding, forecast requests, rendering and unit conversion
- `assets/*.gif`: original animated weather illustrations

## APIs
Geocoding: https://geocoding-api.open-meteo.com/v1/search
Forecast: https://api.open-meteo.com/v1/forecast
Provider: https://open-meteo.com/

## Honest project summary
This project uses HTML, CSS, vanilla JavaScript, Open-Meteo and local GIF assets. It does not use React, a database, a custom backend, or machine learning. Forecast accuracy and availability depend on the external provider.
