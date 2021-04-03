# BlockMaps

[![Java CI with Gradle](https://github.com/jonathanpotts/BlockMaps/actions/workflows/gradle.yml/badge.svg)](https://github.com/jonathanpotts/BlockMaps/actions/workflows/gradle.yml) [![Node.js CI](https://github.com/jonathanpotts/BlockMaps/actions/workflows/node.js.yml/badge.svg)](https://github.com/jonathanpotts/BlockMaps/actions/workflows/node.js.yml)

A Minecraft server plugin for creating immersive 3D maps viewable on the web.

**NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG.**

## Building from source

To build from source, the following software must be installed:

* [OpenJDK](https://openjdk.java.net/) 8
* [Node.js](https://nodejs.org/)

Steps to build:

1. Download the software referenced above.
2. Clone the `main` branch of the repository.
3. Navigate to the `plugin` directory in a terminal.
4. Run `./gradlew clean webShadowJar`.

The built JAR file will be in the `plugin/spigot/build/libs` directory.

## Server setup

To run the plugin, the server must be using [Spigot](https://www.spigotmc.org/) 1.14.4+. Future versions will require 1.17+ to add support for blocks below Y=0.

Put the JAR file in the `plugins` directory of the Spigot server and (re)start the server. Run the `refresh-map-data` command to generate the initial map data.

### Web server setup

The plugin does not contain an integrated web server to prevent web requests from effecting the performance of the server.

The web app does not require any runtimes to be installed on the web server. It is recommended to configure your server to send the files with gzip compression.

The web app files will be located in the `plugins\BlockMaps\web` directory after running the `refresh-map-data` command. The web server only needs read access to the files. The files will be updated as the map changes so therefore the folder should either be the target of a symlink or the files should be shipped to the web server on a frequent basis.

## Web browser requirements

The web app should work on recent releases of [Chrome](https://www.google.com/chrome/), [Safari](https://www.apple.com/safari/), [Firefox](https://www.mozilla.org/firefox/browsers/), [Edge](https://www.microsoft.com/edge/), and [Opera](https://www.opera.com/) (except Opera Mini) on both desktop and mobile.
