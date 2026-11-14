# Changelog

## 1.1.0

### Added
- Works with no configuration: finds the Tempest weather entity and every sensor on its device.
- Visual editor: title, weather entity, layout, scales and thresholds, and a Customize entities toggle.
- Layout: reorder or hide any panel, and reorder or hide the items inside the Header, Scales and Conditions row panels.
- Adjustable temperature bar range, graduated rain-today and wind scales (min, max, number of bars), rain-intensity thresholds, and heat/windy alert thresholds.
- Tap any value to open Home Assistant's entity dialog for it.
- Card picker suggestion for Tempest weather entities and sensors (Home Assistant 2026.6+).
- Full-width sizing in Sections views.

### Changed
- Temperature, wind and pressure are shown in each sensor's unit; rain follows the Home Assistant unit system. Metric installs no longer show imperial values.
- "Raining now", days since rain and the 24-hour pressure range are worked out by the card. Separate helper entities are no longer needed (they can still be set under `entities:`).
- The moon phase panel is optional and hidden when the Moon integration isn't installed.
- Titles and entity text are escaped before rendering.

### Upgrading
- Existing configs keep working; any `entities:` overrides are still honoured.

## 1.0.5

### Changed
- Default header title is now "Weather station". Set `title:` in the card config to use your own.

### Added
- Initial repository import of the card (previously distributed as a single file).
