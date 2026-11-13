# Tempest LightMap Card

[![Validate](https://github.com/trevnologies/ha-tempest-lightmap-card/actions/workflows/validate.yml/badge.svg)](https://github.com/trevnologies/ha-tempest-lightmap-card/actions/workflows/validate.yml)

A full-width Home Assistant dashboard card for a Tempest weather station:
current conditions, a 12-hour and 10-day forecast, humidity and wind dials,
precipitation/UV/wind scales, 24-hour temperature, wind and pressure charts,
and 30 days of daily rainfall.

The card is a single dependency-free JavaScript module. It needs no other
custom cards, no card-mod and no build step.

## Installation

### Home Assistant Marketplace (Recommended)

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=trevnologies&repository=ha-tempest-lightmap-card&category=plugin)

1. Click the badge above. It opens your Home Assistant instance directly to
   this repository in the Marketplace (requires
   [My Home Assistant](https://www.home-assistant.io/integrations/my/),
   on by default for most setups)
2. Install **Tempest LightMap Card**, then hard-refresh your browser

Or manually:

1. **Settings → Marketplace → Add from link**
2. Repository: `https://github.com/trevnologies/ha-tempest-lightmap-card`, Type: **Dashboard**
3. Install **Tempest LightMap Card**, then hard-refresh your browser

The Marketplace registers the dashboard resource for you.

### Manual

1. Download `tempest-lightmap-card.js` from the [latest release](https://github.com/trevnologies/ha-tempest-lightmap-card/releases/latest)
2. Copy it to `/config/www/tempest-lightmap-card.js`
3. **Settings → Dashboards → ⋮ → Resources → Add resource**:
   URL `/local/tempest-lightmap-card.js?v=1.0.5`, type **JavaScript module**
4. Hard-refresh your browser. Change the `?v=` value after every update.

## Configuration

The card works best in a **Panel** view.

```yaml
type: custom:tempest-lightmap-card
title: Weather station   # optional; text on the side tab
entities:                # optional; override only the ones that differ
  weather: weather.my_station
  temp: sensor.my_station_air_temperature
```

| Key | Used for | Default entity |
|-----|----------|----------------|
| `weather` | Condition, hourly and daily forecast | `weather.tempest_home` |
| `temp` | Air temperature and 24h chart | `sensor.tempest_home_air_temperature` |
| `feels` | Feels-like temperature | `sensor.tempest_home_feels_like` |
| `dew` | Dew point and 24h chart | `sensor.tempest_home_dew_point` |
| `hum` | Humidity dial | `sensor.tempest_home_relative_humidity` |
| `wind` | Wind speed scale and chart | `sensor.tempest_home_wind_speed` |
| `gust` | Wind gust scale and chart | `sensor.tempest_home_wind_gust` |
| `dir` | Wind direction dial | `sensor.tempest_home_wind_direction` |
| `press` | Sea-level pressure and chart | `sensor.tempest_home_sea_level_pressure` |
| `trend` | Pressure trend (`falling`/`steady`/`rising`) | `sensor.tempest_home_pressure_trend` |
| `pmin` / `pmax` | 24h pressure range | `sensor.tempest_home_tempest_pressure_24h_min` / `_max` |
| `uv` | UV index scale | `sensor.tempest_home_uv_index` |
| `rate` | Precipitation intensity | `sensor.tempest_home_rain_intensity` |
| `rain` | Rain today and 30-day chart | `sensor.tempest_home_rain_accumulation_today` |
| `raining` | "Raining now" indicator | `binary_sensor.rain_currently_raining` |
| `since` | Days since last rain | `sensor.rain_days_since_last_rain` |
| `strikes` | Lightning strikes, last 3h | `sensor.tempest_home_lightning_detected_last_3_hrs` |
| `heat` | Heat index | `sensor.tempest_home_heat_index` |
| `ts` | Last-update freshness | `sensor.tempest_home_timestamp` |
| `moon` | Moon phase | `sensor.moon_phase` |
| `sun` | Sunrise/sunset | `sun.sun` |

## Known limitations

- Display units are fixed to °F, mph and inHg, and rain sensors are assumed
  to report millimetres.
- There is no visual editor yet; configure the card in YAML.

## License

[Apache-2.0](LICENSE)
