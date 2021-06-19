import com.github.gradle.node.npm.task.NpmTask

plugins {
  kotlin("jvm") version "1.5.10"
  id("com.github.node-gradle.node") version "3.0.1"
}

group "com.jonathanpotts"
version "1.0-SNAPSHOT"

repositories {
  mavenCentral()
  maven { url = uri("https://oss.sonatype.org/content/repositories/snapshots") }
  maven { url = uri("https://hub.spigotmc.org/nexus/content/repositories/snapshots") }
  maven { url = uri("https://repository.mulesoft.org/nexus/content/repositories/public/") }
}

java {
  sourceCompatibility = JavaVersion.VERSION_16
  targetCompatibility = JavaVersion.VERSION_16
}

dependencies {
  compileOnly("org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.5.10")
  compileOnly("org.spigotmc:spigot-api:1.17-R0.1-SNAPSHOT")
  implementation("com.github.imcdonagh:image4j:0.7.2")
}

node {
  nodeProjectDir.set(file("$rootDir/../web"))
}

tasks.register<NpmTask>("npmBuild") {
  dependsOn("npmInstall")
  args.set(arrayOf("run", "build").toMutableList())
}

tasks.register<Copy>("copyWeb") {
  dependsOn("npmBuild")
  from("$rootDir/../web/dist")
  into("$buildDir/resources/main/data/web")
}

tasks.register<Jar>("webJar") {
  dependsOn("copyWeb")
  from(sourceSets.main.get().output)
}
