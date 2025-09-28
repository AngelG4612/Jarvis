# J.A.R.V.I.S. Copilot Instructions

## Project Overview
J.A.R.V.I.S. is a multi-component smart mirror system combining:
- **Flutter mobile app** (`app/jarvis/`) - companion control app for configuration and IoT control
- **MagicMirror² integration** (`mirror/`) - Electron-based display with custom Home Assistant modules
- **Infrastructure** (`infra/`) - Docker Compose stack with Home Assistant + Mosquitto MQTT broker

## Architecture & Key Components

### Flutter App Structure (`app/jarvis/`)
- **Currently boilerplate**: Default Flutter counter app - needs full implementation
- **Target purpose**: Mirror layout config, IoT device control, automation triggers
- **Key dependencies**: Standard Flutter with `cupertino_icons` - will need HTTP client, MQTT, state management
- **Platform support**: Multi-platform (Android, iOS, Windows, macOS, Linux, Web)

### Development Workflow

#### Flutter Development
```bash
cd app/jarvis
flutter pub get                    # Install dependencies  
flutter run                       # Hot reload development
flutter test                      # Run unit tests
flutter analyze                   # Lint check
```

#### Infrastructure Setup
```bash
cd infra
docker compose up -d              # Start HA + MQTT stack
# Access Home Assistant: http://localhost:8123
# MQTT broker: localhost:1883
```

#### MagicMirror² Integration
- Custom module: `mirror/modules/mmm-jarvis-ha/` (symlinked to MagicMirror installation)
- Config API: `mirror/services/config-api/` (Node/Express for layout control)

## Project-Specific Patterns

### Directory Organization
- **Monorepo structure**: Each major component (`app/`, `mirror/`, `infra/`) is self-contained
- **Infrastructure as code**: Docker Compose + versioned Home Assistant YAML configs
- **Mobile-first approach**: Flutter app is the primary user interface

### Integration Points
- **MQTT messaging**: Central communication backbone between all components
- **Home Assistant API**: RESTful + WebSocket APIs for IoT device control
- **Config synchronization**: Mirror layout/settings managed via mobile app

### Development Conventions
- **Flutter**: Standard `package:flutter_lints/flutter.yaml` linting rules
- **Cross-platform**: Target all Flutter platforms (mobile, desktop, web)
- **Local-first**: System works offline; secure API tokens for cloud features

## Key Files & Entry Points
- `app/jarvis/lib/main.dart` - Flutter app entry point (currently basic counter)
- `app/jarvis/pubspec.yaml` - Dependencies and project metadata
- `README.md` - Complete project setup and architecture documentation
- `infra/` - Infrastructure configurations (placeholder for Docker Compose)
- `mirror/` - MagicMirror² modules and config API (placeholder)

## Development Focus Areas
1. **Flutter app implementation**: Replace boilerplate with IoT control UI, HTTP/MQTT clients
2. **API integration**: Home Assistant REST/WebSocket + MQTT pub/sub patterns  
3. **State management**: Consider Riverpod/Bloc for complex IoT device state
4. **Real-time updates**: WebSocket/MQTT subscriptions for live device status
5. **Multi-platform testing**: Ensure UI works across mobile and desktop form factors

## Testing Strategy
- **Widget tests**: Use existing `test/widget_test.dart` as template
- **Integration tests**: Plan for end-to-end IoT device interaction testing
- **Platform testing**: Validate on multiple Flutter target platforms