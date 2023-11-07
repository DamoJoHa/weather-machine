import './App.css';
import { useState } from 'react';


export default function App() {
  // need new states to keep track of
  const [flight, setFlight] = useState(null)

  //Takes user input code and sets state for flight info
  function handleSumbit(e) {
    e.preventDefault();
    console.log("Code received")

    // REGEX the code here?

    // Handle form data
    const formData = new FormData(e.target)
    const formJson = Object.fromEntries(formData.entries());
    const code = formJson.code


    // API call to get flight data
    const url = `https://flight-radar1.p.rapidapi.com/flights/get-more-info?query=${code}&fetchBy=flight&page=1`
    console.log("Fetching flight info")
    fetch(url, {
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

        // set the flight info
        setFlight({
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
        })

        console.log("Arrival and Departure set")
      })
      .catch((error) => {
        console.log(error)
      })
  }


  function findTimeFlight(period) {
    // The multiplication compensates for UNIX time things
    const dept = period.time.scheduled.departure * 1000
    const now = Date.now()
    console.log("Scheduled > Now?")
    console.log(dept, dept > now)
    return (dept > now)
  }

  function SearchBar({onSubmit}) {
    return (
      <form className="search-bar" onSubmit={onSubmit}>
          <input name="code" placeholder="Flight Number"></input>
          <button type="submit">Search</button>
      </form>
    )
  }

  return (
    <div className="container">
      <SearchBar onSubmit={handleSumbit}/>
      <div className="cards">
        <WeatherCard city={flight.departure}/>
        <WeatherCard city={flight.arrival}/>
      </div>
    </div>
  )
}



function WeatherCard({city}) {
  const [forecast, setForecast] = useState(null)

  // Call Weather API
  function weatherCall(lat, lon) {
    // We'll need this because the national weather service has a two request system
    const coordsURL = `https://api.weather.gov/points/${lat},${lon}`
    fetch(coordsURL, {method: "GET"})
      .then((response) => response.json())
      .then((response) => {
        console.log(response)

        // Call second api for weather
        callGrid(response.properties.forecastHourly, response.properties.timeZone)


    }).catch((error) => {
      console.log(error)
    })

  }

  // This fires a million times (I think because of the way I'm setting state)
  function callGrid(url, zone) {
    console.log(zone)
    fetch(url, {method: "GET"})
      .then((response) => response.json())
      .then((response) => {
        console.log("Checking weather")

        // Checks which time period to use
        const period = findTimeWeather(response)
        console.log(period)

        // Sets based on that period
        setForecast({
          temp: period.temperature,
          desc: period.shortForecast,
          humid: period.relativeHumidity.value,
          icon: period.icon,
          wind: period.windSpeed,
          timezone: zone
        })
    }).catch((error) => {
      console.log(error)
    });
  }

  function findTimeWeather(response) {
    let match = {}
    // could use .find in here, rather than all this nonsense
    response.properties.periods.forEach((period) => {
      const start = Date.parse(period.startTime)
      const end = Date.parse(period.endTime)
      if (start < city.time && end > city.time) {
        console.log("Period matched")
        match = period
      }
    });
    return match
  }

  // Format the date string to local timezone
  function formatTimeString() {
    const time = new Date(city.time)
    const options = { timeZone: forecast.timezone, timeStyle: "short" }
    return time.toLocaleTimeString("en-US", options)
  }


  // Make sure that the city was actually found, and the forecast is unset, before setting forecast
  if (city.name) {
    weatherCall(city.lat, city.lon);
  }
  if (forecast) {
    // Display info
    return (
      <div className="weather-card">
        <div className="title-row">
          <h2>{city.name}</h2>
          <p>{formatTimeString()}</p>
        </div>
        <div className="content-row">
          <img src={forecast.icon} alt="weather icon" className="weather-icon"/>
          <h3>{forecast.temp}°F</h3>
          <p>{forecast.desc}</p>
          <p>Wind: {forecast.wind}</p>
          <p>Humidity: {forecast.humid}%</p>
        </div>
      </div>
    );
  }
}
