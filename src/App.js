import logo from './logo.svg';
import './App.css';
import { useState } from 'react';

//Do two of these for flight departure and arrival location and times :)

export default function App() {
  const NEWYORK = [40.7128, -74.0060]
  const [temp, setTemp] = useState(0)
  const [humid, setHumid] = useState(0)
  const [precip, setPrecip] = useState(0)
  const [icon, setIcon] = useState(0)
  const [wind, setWind] = useState(0)
  const [tempTrend, setTempTrend] = useState(0)

  // Get location (will rely on search box stuff)
  function mapRequest() {

  }


  // Call Weather API (this can be consolidated)
  function weatherCall({coords}) {
    // We'll need this later because the national weather service has a two request system
    // const url = `https://api.weather.gov/points/${coords[0]},${coords[1]}`

    const url = `https://api.weather.gov/gridpoints/OKX/33,35/forecast`
    call(url)
  }

  function call(url) {
    fetch(url, {method: "GET"})
      .then((response) => response.json())
      .then((response) => {
        const today = response.properties.periods[0]
        console.log(today)
        setTemp(today.temperature)
        setTempTrend(today.temperatureTrend)
        setHumid(today.relativeHumidity.value)
        setPrecip(today.probabilityOfPrecipitation.value)
        setIcon(today.icon)
        setWind(today.windSpeed)
    });
  }

  weatherCall(NEWYORK)

  // Display info (with various intermediate steps tbd)
  return (
    <div className="weather-card">
      <div className="title-row">
        <h2>New York</h2>
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
