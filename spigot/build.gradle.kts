plugins {
    kotlin("jvm") version "1.4.31"
    id("org.jetbrains.kotlin.plugin.serialization") version "1.4.31"
    id("com.github.johnrengelman.shadow") version "6.1.0"
}

group = "io.github.jonathanpotts"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
    maven { url = uri("https://oss.sonatype.org/content/repositories/snapshots") }
    maven { url = uri("https://hub.spigotmc.org/nexus/content/repositories/snapshots") }
}

dependencies {
    implementation(kotlin("stdlib-jdk8"))
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.4.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-jdk8:1.4.3")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.1.0")
    implementation("io.ktor:ktor-client-core:1.5.2")
    implementation("io.ktor:ktor-client-cio:1.5.2")

    testImplementation(kotlin("test"))
    testImplementation(kotlin("test-junit"))

    compileOnly("org.spigotmc:spigot-api:1.14.4-R0.1-SNAPSHOT")
}

tasks.compileKotlin {
    kotlinOptions.jvmTarget = "1.8"
}

tasks.jar {
    archiveBaseName.set("${rootProject.name}-${project.name}")
}

tasks.shadowJar {
    archiveBaseName.set("${rootProject.name}-${project.name}")
}
