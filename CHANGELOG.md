# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Started from version 0.3.0

## Version v2.0.5 - 29.04.2020

## 2.0.4 - 12.04.2020

### Fixed

* fix JSDoc type auto-suggestion

## 2.0.2,2.0.3 - 08.04.2020

### Added

* add formidable options

### Fixed

* login handler waits until session is stored: fixes automatic redirects to login page when user has been logged in

## 2.0.1 - 02.04.2020

### Changed

* move to the next middleware instead of hanging when errors are thrown

## 2.0.0 - 04.03.2020

### Added

* support for admin v2

## 1.4.0 - 2019-12-17

### Changed

* change body-parser to formidable

## 1.3.0 - 2019-11-04

### Added

* Added session options to authenticatedRouter

### Removed

* removed cookie-parser dependency
