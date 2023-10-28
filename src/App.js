import './App.css';
import { useState } from 'react';


export default function App() {
  // need new states to keep track of
  const [departure, setDeparture] = useState({time: null, name: null, lat: null, lon: null})
  const [arrival, setArrival] = useState({time: null, name: null, lat: null, lon: null})

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

        // departure vars
        setDeparture({
          time: data.time.scheduled.departure * 1000,
          name: data.airport.origin.name,
          lat: data.airport.origin.position.latitude,
          lon: data.airport.origin.position.longitude
        })

        // arrival vars
        setArrival({
          time: data.time.scheduled.arrival * 1000,
          name: data.airport.destination.name,
          lat: data.airport.destination.position.latitude,
          lon: data.airport.destination.position.longitude
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
        <WeatherCard city={arrival}/>
        <WeatherCard city={departure}/>
      </div>
    </div>
  )
}



function WeatherCard({city}) {
  //Update these values to display a fake flight or something??  Or implement logic in render

  const [temp, setTemp] = useState(null)
  const [humid, setHumid] = useState(null)
  const [icon, setIcon] = useState(null)
  const [wind, setWind] = useState(null)
  const [desc, setDesc] = useState(null)
  const [timeString, setTimeString] = useState(null)

  // Call Weather API
  function weatherCall(lat, lon) {
    // We'll need this because the national weather service has a two request system
    const coordsURL = `https://api.weather.gov/points/${lat},${lon}`
    fetch(coordsURL, {method: "GET"})
      .then((response) => response.json())
      .then((response) => {
        console.log(response)
        callGrid(response.properties.forecastHourly, city.time)
    }).catch((error) => {
      console.log(error)
    })

  }

  // This fires a million times for some reason???
  function callGrid(url, time) {
    fetch(url, {method: "GET"})
      .then((response) => response.json())
      .then((response) => {
        // Checks which time period to use
        console.log("Checking weather")
        const period = findTimeWeather(response, time)
        console.log(period)

        // Sets based on that period

        setTemp(period.temperature)
        setDesc(period.shortForecast)
        setHumid(period.relativeHumidity.value)
        setIcon(period.icon)
        setWind(period.windSpeed)
    }).catch((error) => {
      console.log(error)
    });
  }

  function findTimeWeather(response, time) {
    let match = {}
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

  if (city.name) {
    weatherCall(city.lat, city.lon);
    // Display info
    return (
      <div className="weather-card">
        <div className="title-row">
          <h2>{city.name}</h2>
          <p>{timeString}</p>
        </div>
        <div className="content-row">
          <img src={icon} alt="weather icon" className="weather-icon"/>
          <h3>{temp}°F</h3>
          <p>{desc}</p>
          <p>Wind: {wind}</p>
          <p>Humidity: {humid}%</p>
        </div>
      </div>
    );
  }
}
