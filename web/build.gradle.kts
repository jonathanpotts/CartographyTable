plugins {
    kotlin("js")
    id("org.jetbrains.kotlin.plugin.serialization")
}

group = "com.jonathanpotts"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

kotlin {
    js {
        browser()
        binaries.executable()
    }
}

dependencies {
    implementation(project(":shared"))
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.1.0")

    testImplementation(kotlin("test-js"))
}
