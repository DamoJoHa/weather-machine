import './App.css';
import { useState } from 'react';


export default function App() {
  const [weather, setWeather] = useState(null)

  //Takes user input code and sets state for flight info
  async function handleSumbit(e) {
    e.preventDefault();
    console.log("Code received")

    // TODO: REGEX the code here?

    // Handle form data
    const formData = new FormData(e.target)
    const formJson = Object.fromEntries(formData.entries());
    const code = formJson.code


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

      const departure = await weatherFromFlight(flights.departure)
      const arrival = await weatherFromFlight(flights.arrival)

      console.log("changing state")

      setWeather({
        departure: departure,
        arrival: arrival
      })
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

        // Sets based on that period
        return {
          temp: period.temperature,
          desc: period.shortForecast,
          humid: period.relativeHumidity.value,
          icon: period.icon,
          wind: period.windSpeed,
          time: formatTimeString(zone, time),
          cityName: city
        }
    }).catch((error) => {
      console.log(error)
    });
    return forecast
  }

  function findTimeWeather(response, time) {
    let match
    // could use .find in here, rather than all this nonsense
    response.properties.periods.forEach((period) => {
      const start = Date.parse(period.startTime)
      const end = Date.parse(period.endTime)
      if (start < time && end > time) {
        console.log("Period matched")
        match = period
      }
    });
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
function CardBox(weather) {
  console.log(weather)
  if (!weather) {
    return (<p>Please enter a valid request in the search box.</p>)
  }
  return (
    <div className="cards">
      <WeatherCard weather={weather.departure}/>
      <WeatherCard weather={weather.arrival}/>
    </div>
    )
}

// Renders Weather Card
function WeatherCard({weather}) {
  return (
    <div className="weather-card">
      <div className="title-row">
        <h2>{weather.cityName}</h2>
        <p>{weather.time}</p>
      </div>
      <div className="content-row">
        <img src={weather.icon} alt="weather icon" className="weather-icon"/>
        <h3>{weather.temp}°F</h3>
        <p>{weather.desc}</p>
        <p>Wind: {weather.wind}</p>
        <p>Humidity: {weather.humid}%</p>
      </div>
    </div>
  );
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
