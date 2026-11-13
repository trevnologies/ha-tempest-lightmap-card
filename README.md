# Tempest LightMap Card

[![Validate](https://github.com/trevnologies/ha-tempest-lightmap-card/actions/workflows/validate.yml/badge.svg)](https://github.com/trevnologies/ha-tempest-lightmap-card/actions/workflows/validate.yml)

A full-width Home Assistant dashboard card for a Tempest weather station:
current conditions, a 12-hour and 10-day forecast, humidity and wind dials,
precipitation/UV/rain/wind scales, 24-hour temperature, wind and pressure
charts, 30 days of daily rainfall and a temperature bar.

- **Works with no configuration.** The card finds your Tempest weather entity
  and all of its sensors on its own.
- **Visual editor** for the title, layout, scales, thresholds and entities.
- **Follows your units.** Temperature, wind and pressure use each sensor's
  unit; rain follows your Home Assistant unit system (inches or millimetres).
- **Tap anything for details.** Every value opens Home Assistant's standard
  entity dialog with its history, attributes and settings.
- **Single dependency-free JavaScript module.** No other custom cards,
  card-mod or build step.

## Requirements

- Home Assistant 2025.1 or newer (2026.6 or newer for the card-picker
  suggestion)
- The **Tempest** integration
  ([julianbow/TempestHomeAssistant](https://github.com/julianbow/TempestHomeAssistant)),
  available in the Home Assistant Marketplace
- Optional: the built-in **Moon** integration, for the moon phase panel

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
   URL `/local/tempest-lightmap-card.js?v=1.1.0`, type **JavaScript module**
4. Hard-refresh your browser. Change the `?v=` value after every update.

## Adding the card

- **Card picker:** select your Tempest weather entity when adding a card and
  pick **Tempest LightMap Card** under *Community* (Home Assistant 2026.6+),
  or search for it by name.
- **YAML:** the minimal configuration is just the type:

  ```yaml
  type: custom:tempest-lightmap-card
  ```

The card is designed for a **Panel** view. In a Sections view it takes the
full width.

## Tapping the card

Tapping a value opens the same entity dialog you get from the integration's
device page. The most specific part wins, so tapping the gust figure inside
the wind scale opens the gust sensor, and tapping elsewhere in that row opens
wind speed.

| Tap | Opens |
|-----|-------|
| Temperature, temperature chart, temperature bar | Air temperature |
| Condition icon or text, forecasts, conditions panel | Weather entity |
| "feels like", header stats, dew point text | That sensor |
| Live / stale indicator | Last update timestamp |
| Humidity and wind direction dials | Humidity / wind direction |
| Each scale | Its sensor (gust figure opens wind gust) |
| Pressure trend / pressure value | Pressure trend / sea-level pressure |
| Moon phase panel | Moon phase |
| Wind, pressure and daily rain charts | Wind speed, sea-level pressure, rain today (legend entries open their own sensor) |

## Visual editor

Everything below can be set from the card editor; the YAML is shown for
reference. Anything left at its default is not written to the config.

### General

| Option | Description | Default |
|--------|-------------|---------|
| `title` | Text on the side tab | `Weather station` |
| `weather` | Tempest weather entity | Auto-detected |

### Layout

Panels can be reordered and hidden. The items inside the **Header**,
**Scales** and **Conditions row** panels can be reordered and hidden within
their own panel; an item can't be moved to a different panel. A panel whose
items are all hidden is not shown.

| Panel id | Items |
|----------|-------|
| `header` | `dew_point`, `rain_today`, `lightning`, `sun` |
| `hourly_forecast` | |
| `daily_forecast` | |
| `humidity` | |
| `wind_direction` | |
| `scales` | `precipitation`, `uv`, `rain_today`, `wind` |
| `conditions` | `conditions`, `pressure`, `moon` |
| `temperature_chart` | |
| `wind_chart` | |
| `pressure_chart` | |
| `rain_chart` | |
| `temperature_bar` | |

```yaml
panels: [header, temperature_bar, hourly_forecast]   # listed first, in this order; the rest follow
items:
  conditions: [moon, pressure, conditions]
hide_panels: [humidity]
hide_items: [header.lightning, scales.uv]
```

Panels flow to fill gaps, so a narrow panel moved next to a wide one may sit
beside it rather than below it.

### Scales and thresholds

Leave any of these out to use the default for your units. A scale needs
`min`, `max` and `step` to take effect and shows at most 13 marks.

| Option | Description | Default (imperial / metric) |
|--------|-------------|-----------------------------|
| `temperature_bar` | `min`, `max`, `step` of the bottom temperature bar | 10–110 by 10 °F / −10–40 by 5 °C |
| `rain_scale` | `min`, `max`, `step` of the *Rain today* scale | 0.2–3.0 in / 5–75 mm (uneven steps) |
| `wind_scale` | `min`, `max`, `step` of the *Wind and gust* scale, in the wind sensor's unit | 2–50 mph / 5–80 km/h (uneven steps) |
| `rain_intensity` | `moderate` and `heavy` thresholds, per hour | 0.1 / 0.3 in, 2.5 / 7.6 mm |
| `alerts` | `heat` (heat index) and `wind` (wind speed) that light the heat and wind icons | 95 °F / 35 °C, 20 mph (converted to your wind unit) |

```yaml
temperature_bar: { min: 20, max: 110, step: 10 }   # 10 marks
rain_scale: { min: 0.05, max: 0.5, step: 0.05 }    # for dry climates
alerts: { heat: 105 }
```

### Entities

Every entity is found automatically from the Tempest device. In the editor
each one has a **Show** toggle and a picker:

- **Show off** (`exclude`) hides every part of the card that uses that
  entity. For example, excluding `strikes` removes the lightning header stat
  (the lightning icon then follows only the weather condition); excluding
  `moon` removes the moon phase panel.
- **Picker** (`entities`) overrides the auto-detected entity.

| Key | Used for |
|-----|----------|
| `temp` | Air temperature, 24h chart, temperature bar |
| `feels` | Feels-like temperature |
| `dew` | Dew point |
| `hum` | Humidity dial |
| `wind` / `gust` | Wind scale and 24h chart |
| `dir` | Wind direction dial |
| `press` | Sea-level pressure and 24h chart |
| `trend` | Pressure trend (`falling` / `steady` / `rising`) |
| `uv` | UV index |
| `rate` | Precipitation intensity, "raining now" |
| `rain` | Rain today, 30-day chart, days since rain |
| `strikes` | Lightning strikes, last 3h |
| `heat` | Heat index (heat alert) |
| `ts` | Live / stale indicator |
| `moon` | Moon phase (Moon integration) |
| `sun` | Sunrise / sunset |

```yaml
exclude: [strikes, heat]
entities:
  temp: sensor.my_station_air_temperature
```

The card works out "raining now", days since rain and the 24-hour pressure
range itself. If you prefer your own helpers, set them in YAML:
`entities: { raining: …, since: …, pmin: …, pmax: … }`.

## Known limitations

- Entities are discovered from the Tempest integration listed under
  Requirements; other weather integrations need every entity set by hand.
- The *Next 12 hours* and *10-day* panels need a weather entity that provides
  hourly and daily forecasts.

## License

[Apache-2.0](LICENSE)
