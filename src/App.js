import './App.css';
import { useState } from 'react';
import reportWebVitals from './reportWebVitals';


export default function App() {
  const [weather, setWeather] = useState(null)

  //Takes user input code and sets state for flight info
  async function handleSumbit(e) {
    e.preventDefault();
    console.log("Code received")

    // Handle form data
    const formData = new FormData(e.target);
    const formJson = Object.fromEntries(formData.entries());
    const input = formJson.code.replaceAll(/\s/g, "")

    // Check code format before making api request (I shamelessly stole this regex from the web)
    const codeRegex = /(?<![\dA-Z])(?!\d{2})([A-Z\d]{2})(\d{2,4})(?!\d)/
    const codeMatch = input.match(codeRegex)
    let code
    if (codeMatch) {
      code = codeMatch[0]
    }
    if (code) {
      findFlight(code)
    }
  }

  async function findFlight(code) {
    // API call to get flight data
    let flights;
    const url = `https://flight-radar1.p.rapidapi.com/flights/get-more-info?query=${code}&fetchBy=flight&page=1`
    console.log("Fetching flight info")
    await fetch(url, {
      method: "GET",
      headers: {
      'X-RapidAPI-Key': process.env.REACT_APP_APIKEY,
      'X-RapidAPI-Host': 'flight-radar1.p.rapidapi.com'
    }})
      .then((response) => {
        console.log("Response received")
        return response.json()
      })
      .then((response) => {
        // filter for upcoming flights
        console.log("Filtering by time")
        const data = response.result.response.data.reverse().find(findTimeFlight)
        console.log(data)

        // assign the flight info
        flights = {
          departure: {
            time: data.time.scheduled.departure * 1000,
            name: data.airport.origin.name,
            lat: data.airport.origin.position.latitude,
            lon: data.airport.origin.position.longitude
          },
          arrival: {
            time: data.time.scheduled.arrival * 1000,
            name: data.airport.destination.name,
            lat: data.airport.destination.position.latitude,
            lon: data.airport.destination.position.longitude
          }
        }

        console.log("Flight Found")
      })
      .catch((error) => {
        console.log(error)
      })

      if (flights) {
        const departure = await weatherFromFlight(flights.departure)

        const arrival = await weatherFromFlight(flights.arrival)

        console.log("changing state")

        setWeather({
          departure: departure,
          arrival: arrival
        })
      } else {
        console.log("Flight not found")
      }
  }
  // Returns true if a scheduled time is in the future
  function findTimeFlight(period) {
    // The multiplication compensates for UNIX time things
    const dept = period.time.scheduled.departure * 1000
    const now = Date.now()
    console.log("Scheduled > Now?")
    console.log(dept, dept > now)
    return (dept > now)
  }


  // Weather Card Stuff Below

  // manages all of the steps to get weather info from flight info
  async function weatherFromFlight(flight) {
    const gridCallData = await weatherCall(flight.lat, flight.lon)
    console.log(gridCallData)
    const forecast =  await callGrid(gridCallData.forecastHourly, gridCallData.timeZone, flight.time, flight.name)
    console.log(forecast)
    return forecast
  }

  async function weatherCall(lat, lon) {
    // Request based on lat/lon to get the url for the second request
    const coordsURL = `https://api.weather.gov/points/${lat},${lon}`
    let forecast
    await fetch(coordsURL, {method: "GET"})
      .then((response) => response.json())
      .then((response) => {
        console.log(response)
        forecast = response.properties
      })
      .catch((error) => {
        console.log(error)
      })
    return forecast
  }

  async function callGrid(url, zone, time, city) {
    console.log(zone)
    const forecast = await fetch(url, {method: "GET"})
      .then((response) => response.json())
      .then((response) => {
        console.log("Checking weather")

        // Checks which time period to use
        const period = findTimeWeather(response, time)
        console.log(period)

        // if a matching period was found, asign the forecast
        const forecast = period ? {
          temp: period.temperature,
          desc: period.shortForecast,
          humid: period.relativeHumidity.value,
          icon: period.icon,
          wind: period.windSpeed
        } : null;

        // Sets based on that period
        return {
          forecast: forecast,
          time: formatTimeString(zone, time),
          cityName: city
        }
    }).catch((error) => {
      console.log(error)
    });
    return forecast
  }

  function findTimeWeather(response, time) {
    const match = response.properties.periods.find((period) => {
      const start = Date.parse(period.startTime)
      const end = Date.parse(period.endTime)
      return start < time && end > time
    });

    if (match) console.log("Match found")

    return match
  }

  // Format the date string to local timezone
  function formatTimeString(zone, timeNum) {
    const time = new Date(timeNum)
    const options = { timeZone: zone, timeStyle: "short" }
    return time.toLocaleTimeString("en-US", options)
  }


  return (
    <div className="container">
      <SearchBar onSubmit={handleSumbit}/>
      <CardBox weather={weather}/>
    </div>
  )
};

// Renders card container
function CardBox({weather}) {
  console.log(weather)
  if (!weather) {
    return (<p>Please enter a valid request in the search box.</p>)
  }
  if (!(weather.departure && weather.arrival)) {
    return (<p>There was a problem handling your request.  Check your flight number and try again.</p>)
  }
  return (
    <div className="cards">
      {/* the side prop will be used to format departure and arrival cards */}
      <WeatherCard city={weather.departure} side={true}/>
      <WeatherCard city={weather.arrival} side={false}/>
    </div>
    )
}

// Renders Weather Card
function WeatherCard({ city, side }) {
  const cardClass = side ? "departure weather-card" : "arrival weather-card";

  return (
    <div className={cardClass}>
      <div className="title-row">
        <h2>{city.cityName}</h2>
        <p>{city.time}</p>
      </div>
      <ForecastBlock forecast={city.forecast}/>
    </div>
  );
}

function ForecastBlock({forecast}) {
  // Catch cases where a location is found but a forecast is not made
  if (forecast) {
    return (
      <div className="content-row">
        <img src={forecast.icon} alt="weather icon" className="weather-icon"/>
        <h3>{forecast.temp}°F</h3>
        <p>{forecast.desc}</p>
        <p>Wind: {forecast.wind}</p>
        <p>Humidity: {forecast.humid}%</p>
      </div>
    )
  }
  return (
    <div className="content-row">
      <p>Weather data not available</p>
    </div>
  )
}

// Renders search bar
function SearchBar({onSubmit}) {
  return (
    <form className="search-bar" onSubmit={onSubmit}>
        <input name="code" placeholder="Flight Number"></input>
        <button type="submit">Search</button>
    </form>
  )
}
