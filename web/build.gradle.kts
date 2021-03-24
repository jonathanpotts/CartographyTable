plugins {
    kotlin("js") version "1.4.31"
    id("org.jetbrains.kotlin.plugin.serialization") version "1.4.31"
}

group = "io.github.jonathanpotts"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

kotlin {
    js().browser()

    sourceSets {
        val main by getting {
            dependencies {
                implementation(kotlin("stdlib-common"))
                implementation(kotlin("stdlib-js"))
                implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.1.0")
            }
        }

        val test by getting {
            dependencies {
                implementation(kotlin("test-common"))
                implementation(kotlin("test-annotations-common"))
                implementation(kotlin("test-js"))
            }
        }
    }
}
