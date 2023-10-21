import './App.css';
import { useState } from 'react';

//Vars for testing
const NEWYORK = {time: null, name: "New York", coords: [40.7128, -74.0060]}
const FLIGHTCODE = "NK712"

//Do two of these for flight departure and arrival location and times :)
export default function App() {
  //Use Date
  const [departure, setDeparture] = useState({time: null, name: null})
  const [arrival, setArrival] = useState({time: null, name: null})

  function flightCall(code) {
    const url = `https://flight-radar1.p.rapidapi.com/flights/get-more-info?query=${code}&fetchBy=flight&page=1`
    console.log()
    fetch(url, {
      method: "GET",
      headers: {
      'X-RapidAPI-Key': process.env.REACT_APP_APIKEY,
      'X-RapidAPI-Host': 'flight-radar1.p.rapidapi.com'
    }})
      .then((response) => response.json())
      .then((response) => {
        console.log(response)
        const flight = response.response[0]
        flight.airport.origin
      });
  }

  flightCall(FLIGHTCODE)
  return (
    <div className="container">
      <input id="flight-search" placeholder="Flight Number"></input>
      <WeatherCard city={NEWYORK}/>
    </div>
  )
}

function WeatherCard({city}) {

  const [temp, setTemp] = useState(null)
  const [humid, setHumid] = useState(null)
  const [precip, setPrecip] = useState(null)
  const [icon, setIcon] = useState(null)
  const [wind, setWind] = useState(null)
  const [tempTrend, setTempTrend] = useState(null)

  // Get location (will rely on search box stuff)
  function Flight(flight) {

  }
  // Call Weather API (this can be consolidated)
  function weatherCall() {
    // We'll need this later because the national weather service has a two request system
    // const url = `https://api.weather.gov/points/${coords[0]},${coords[1]}`

    const url = `https://api.weather.gov/gridpoints/OKX/33,35/forecast`
    callCoords(url)
  }

  function callCoords(url) {
    fetch(url, {method: "GET"})
      .then((response) => response.json())
      .then((response) => {
        const today = response.properties.periods[0]
        // console.log(today)
        setTemp(today.temperature)
        setTempTrend(today.temperatureTrend)
        setHumid(today.relativeHumidity.value)
        setPrecip(today.probabilityOfPrecipitation.value)
        setIcon(today.icon)
        setWind(today.windSpeed)
    });
  }

  weatherCall(city.coords)

  // Display info (with various intermediate steps tbd)
  return (
    <div className="weather-card">
      <div className="title-row">
        <h2>{city.name}</h2>
      </div>
      <div className="content-row">
        <img src={icon} alt="weather icon" className="weather-icon"/>
        <h3>{temp}°F</h3>
        <p>Temperature: {tempTrend}</p>
        <p>Wind: {wind}</p>
        <p>Humidity: {humid}%</p>
        <p>Chance of Rain: {precip ? `${precip}%` : "Unknown" }</p>
      </div>
    </div>
  );
}
