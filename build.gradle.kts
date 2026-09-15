plugins {
    java
    id("org.springframework.boot") version "3.3.4" apply false
}

allprojects {
    group = "com.eventix"
    version = "1.0.0-SNAPSHOT"

    repositories {
        mavenCentral()
    }
}

subprojects {
    apply(plugin = "java")

    java {
        toolchain {
            languageVersion.set(JavaLanguageVersion.of(21))
        }
    }

    dependencies {
        val springBootBom = platform("org.springframework.boot:spring-boot-dependencies:3.3.4")
        val springCloudBom = platform("org.springframework.cloud:spring-cloud-dependencies:2023.0.3")

        implementation(springBootBom)
        implementation(springCloudBom)

        compileOnly(springBootBom)
        annotationProcessor(springBootBom)

        compileOnly("org.projectlombok:lombok")
        annotationProcessor("org.projectlombok:lombok")

        testImplementation(springBootBom)
        testImplementation("org.springframework.boot:spring-boot-starter-test")
    }

    tasks.withType<Test> {
        useJUnitPlatform()
    }
}
