# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- WebGL context loss handling with automatic recovery
- Theme support: light, dark, and system modes via `theme` config option
- CSS variables for consistent theming across all layouts

### Changed
- Reorganized CSS architecture with centralized theme variables
- Improved CLI error messages with actionable suggestions

## [0.1.3] - 2024-12-XX

### Changed
- Updated documentation for npm package workflow

## [0.1.2] - 2024-12-XX

### Added
- Initial npm package release
- Shadertoy-compatible GLSL shader development environment
- Multi-pass rendering (BufferA-D + Image)
- Ping-pong buffer support for feedback effects
- External texture loading with filter/wrap options
- Keyboard input texture (256x3 RGBA)
- Mouse tracking (iMouse uniform)
- Live code editing in split and tabbed layouts
- Common code support (common.glsl)
- Shader compilation error display with source context
- Playback controls (play/pause, reset, screenshot)
- Auto-pause when shader is off-screen
- FPS counter
- CLI tools: `shader create`, `shader init`, `shader new`, `shader dev`, `shader build`, `shader list`
- Four layout modes: fullscreen, default, split, tabbed
- Prism.js syntax highlighting in code viewers
- Device pixel ratio support
- Responsive design with media queries

### Technical
- WebGL2 rendering with RGBA32F textures
- TypeScript with strict mode
- Vite build system
- ESM module format
