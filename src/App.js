import logo from './logo.svg';
import './App.css';
import { useState } from 'react';

export default function App() {
  const NEWYORK = [40.7128, -74.0060]
  const [temp, setTemp] = useState(0)
  const [humid, setHumid] = useState(0)
  const [precip, setPrecip] = useState(0)

  // Get location (will rely on search box stuff)
  function mapRequest() {

  }


  // Call Weather API (this can be consolidated)
  function weatherCall({coords}) {
    // We'll need this later because the national weather service has a two request system
    // const url = `https://api.weather.gov/points/${coords[0]},${coords[1]}`

    const url = `https://api.weather.gov/gridpoints/OKX/33,35/forecast`
    const stats = call(url)

    console.log(stats)
  }

  function call(url) {
    let stats = {temp: null, tempTrend: null, humidity: null, precip: null}
    fetch(url, {method: "GET"})
      .then((response) => response.json())
      .then((response) => {
        const today = response.properties.periods[0]
        setTemp(today.temperature)
        // setTempTrend(today.temperatureTrend)
        setHumid(today.relativeHumidity.value)
        setPrecip(today.probabilityOfPrecipitation.value)
    });
    console.log(stats.temp)
    return stats
  }

  weatherCall(NEWYORK)

  // Display info (with various intermediate steps tbd)
  return (
    <div>
      <p>{temp}F</p>
      <p>Humidity: {humid}%</p>
      <p>Chance of Rain: {precip}%</p>
    </div>
  );
}
