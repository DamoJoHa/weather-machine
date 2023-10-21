import './App.css';
import { useState } from 'react';

//Vars for testing
const NEWYORK = {time: null, name: "New York", lat: 40.7128, lon: -74.0060}
const FLIGHTCODE = "NK712"

//Do two of these for flight departure and arrival location and times :)
export default function App() {
  //Use Date
  const [departure, setDeparture] = useState({time: null, name: null, lat: null, lon: null})
  const [arrival, setArrival] = useState({time: null, name: null, coords: null})


  //Takes user input code and sets state for flight info
  function flightCall(code) {
    const url = `https://flight-radar1.p.rapidapi.com/flights/get-more-info?query=${code}&fetchBy=flight&page=1`
    fetch(url, {
      method: "GET",
      headers: {
      'X-RapidAPI-Key': process.env.REACT_APP_APIKEY,
      'X-RapidAPI-Host': 'flight-radar1.p.rapidapi.com'
    }})
      .then((response) => response.json())
      .then((response) => {
        console.log(response)
        const data = response.response.data[0]
        //departure vars
        let name = data.airport.origin.name
        let lat = data.airport.origin.position.latitude
        let lon = data.airport.origin.position.longitude
        let time = data.time.scheduled.departure
        setDeparture({time: time, name: name, lat: lat, lon: lon})
        console.log(departure)
        //arrival vars
        name = data.airport.destination.name
        lat = data.airport.destination.position.latitude
        lon = data.airport.destination.position.longitude
        time = data.time.scheduled.arrival
        setArrival({time: time, name: name, lat: lat, lon: lon})
        console.log(arrival)
      });
  }

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

  // Call Weather API (this can be consolidated)
  function weatherCall(lat, lon) {
    // We'll need this because the national weather service has a two request system
    const coordsURL = `https://api.weather.gov/points/${lat},${lon}`
    fetch(coordsURL, {method: "GET"})
      .then((response) => response.json())
      .then((response) => {
        callGrid(response.properties.forecastHourly)
    })
  }


  function callGrid(url) {
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

  weatherCall(city.lat, city.lon)

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
